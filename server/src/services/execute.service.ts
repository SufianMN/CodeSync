import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number;
  memory: number; // in MB
  success: boolean;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface TestCaseResult {
  id: string;
  status:
    | 'Correct'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Runtime Error'
    | 'Compilation Error';
  runtimeMs?: number;
  memoryMB?: number;
  expected?: string;
  received?: string;
  stderr?: string;
}

const LANGUAGE_CONFIG = {
  cpp: {
    image: 'gcc:latest',
    fileName: 'main.cpp',
    compileCommand: 'g++ main.cpp -o program',
    runCommand: './program',
  },
  python: {
    image: 'python:3.10-slim',
    fileName: 'main.py',
    compileCommand: null,
    runCommand: 'python3 main.py',
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    fileName: 'Main.java',
    compileCommand: 'javac Main.java',
    runCommand: 'java Main',
  },
  javascript: {
    image: 'node:18-slim',
    fileName: 'main.js',
    compileCommand: null,
    runCommand: 'node main.js',
  },
};

const normalizeOutput = (str: string) => {
  return str
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
};

export const ExecuteService = {
  async executeCode(
    language: keyof typeof LANGUAGE_CONFIG,
    code: string,
    stdin: string = '',
  ): Promise<ExecutionResult> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) throw new Error('Unsupported language');

    const runId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(os.tmpdir(), `codesync_exec_${runId}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });
      const sourceFile = path.join(tempDir, config.fileName);
      await fs.writeFile(sourceFile, code, 'utf-8');
      const stdinFile = path.join(tempDir, 'stdin.txt');
      await fs.writeFile(stdinFile, stdin, 'utf-8');

      const dockerCommand = config.compileCommand
        ? `${config.compileCommand} && ${config.runCommand} < stdin.txt`
        : `${config.runCommand} < stdin.txt`;

      const startTime = performance.now();
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      let isTimeout = false;

      try {
        const { stdout: out, stderr: err } = await execFileAsync(
          'docker',
          [
            'run',
            '--rm',
            '--network',
            'none',
            '--cpus',
            '1',
            '--memory',
            '512m',
            '-v',
            `${tempDir}:/app`,
            '-w',
            '/app',
            config.image,
            'sh',
            '-c',
            dockerCommand,
          ],
          { timeout: 10000 },
        );
        stdout = out;
        stderr = err;
      } catch (error: any) {
        if (error.killed && error.signal === 'SIGTERM') {
          isTimeout = true;
          stderr = 'Execution timed out';
          exitCode = 124;
        } else {
          stdout = error.stdout || '';
          stderr = error.stderr || error.message || 'Execution failed';
          exitCode = error.code || 1;
        }
      }

      const endTime = performance.now();
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        runtime: Math.round(endTime - startTime),
        memory: 0,
        success: exitCode === 0 && !isTimeout,
      };
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to clean up temp dir ${tempDir}:`, e);
      }
    }
  },

  async executeTestCases(
    language: keyof typeof LANGUAGE_CONFIG,
    code: string,
    timeLimitMs: number,
    memoryLimitMB: number,
    testCases: TestCase[],
  ): Promise<{ passed: number; total: number; results: TestCaseResult[] }> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) throw new Error('Unsupported language');

    const runId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(os.tmpdir(), `codesync_test_${runId}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });
      const sourceFile = path.join(tempDir, config.fileName);
      await fs.writeFile(sourceFile, code, 'utf-8');

      // 1. Compilation Step (if needed)
      if (config.compileCommand) {
        try {
          await execFileAsync(
            'docker',
            [
              'run',
              '--rm',
              '--network',
              'none',
              '--cpus',
              '1',
              '--memory',
              '1024m',
              '-v',
              `${tempDir}:/app`,
              '-w',
              '/app',
              config.image,
              'sh',
              '-c',
              config.compileCommand,
            ],
            { timeout: 10000 },
          );
        } catch (error: any) {
          const stderr = error.stderr || error.message || 'Compilation failed';
          return {
            passed: 0,
            total: testCases.length,
            results: testCases.map((tc) => ({
              id: tc.id,
              status: 'Compilation Error',
              stderr,
            })),
          };
        }
      }

      const results: TestCaseResult[] = [];
      let passed = 0;

      // 2. Execution Step (for each test case)
      for (const tc of testCases) {
        const stdinFile = path.join(tempDir, `stdin_${tc.id}.txt`);
        await fs.writeFile(stdinFile, tc.input, 'utf-8');

        const dockerCommand = `${config.runCommand} < stdin_${tc.id}.txt`;
        const startTime = performance.now();

        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        let isTimeout = false;

        try {
          const { stdout: out, stderr: err } = await execFileAsync(
            'docker',
            [
              'run',
              '--rm',
              '--network',
              'none',
              '--cpus',
              '1',
              '--memory',
              `${memoryLimitMB}m`,
              '-v',
              `${tempDir}:/app`,
              '-w',
              '/app',
              config.image,
              'sh',
              '-c',
              dockerCommand,
            ],
            { timeout: timeLimitMs + 500 }, // Slight buffer for docker overhead
          );
          stdout = out;
          stderr = err;
        } catch (error: any) {
          if (error.killed && error.signal === 'SIGTERM') {
            isTimeout = true;
            exitCode = 124;
          } else {
            stdout = error.stdout || '';
            stderr = error.stderr || '';
            exitCode = error.code || 1;
          }
        }

        const endTime = performance.now();
        const runtimeMs = Math.round(endTime - startTime);

        let status: TestCaseResult['status'] = 'Runtime Error';
        const expectedNormalized = normalizeOutput(tc.expectedOutput);
        const receivedNormalized = normalizeOutput(stdout);

        if (isTimeout || runtimeMs > timeLimitMs) {
          status = 'Time Limit Exceeded';
        } else if (exitCode === 137) {
          status = 'Memory Limit Exceeded';
        } else if (exitCode !== 0) {
          status = 'Runtime Error';
        } else if (expectedNormalized === receivedNormalized) {
          status = 'Correct';
          passed++;
        } else {
          status = 'Wrong Answer';
        }

        results.push({
          id: tc.id,
          status,
          runtimeMs: status !== 'Compilation Error' ? runtimeMs : undefined,
          memoryMB: 0, // Placeholder as precise peak memory via docker is complex without additional tools
          expected: status === 'Wrong Answer' ? tc.expectedOutput : undefined,
          received: status === 'Wrong Answer' ? stdout : undefined,
          stderr: status === 'Runtime Error' ? stderr : undefined,
        });
      }

      return { passed, total: testCases.length, results };
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to clean up temp dir ${tempDir}:`, e);
      }
    }
  },
};
