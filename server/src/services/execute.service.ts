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

const TIMEOUT_MS = 10000;
const MEMORY_LIMIT = '512m';
const CPU_LIMIT = '1';

const LANGUAGE_CONFIG = {
  cpp: {
    image: 'gcc:latest',
    fileName: 'main.cpp',
    runCommand: 'g++ main.cpp -o program && ./program',
  },
  python: {
    image: 'python:3.10-slim',
    fileName: 'main.py',
    runCommand: 'python3 main.py',
  },
  java: {
    image: 'openjdk:17-slim',
    fileName: 'Main.java',
    runCommand: 'javac Main.java && java Main',
  },
  javascript: {
    image: 'node:18-slim',
    fileName: 'main.js',
    runCommand: 'node main.js',
  },
};

export const ExecuteService = {
  async executeCode(
    language: keyof typeof LANGUAGE_CONFIG,
    code: string,
    stdin: string = '',
  ): Promise<ExecutionResult> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) throw new Error('Unsupported language');

    // Create unique temp directory
    const runId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(os.tmpdir(), `codesync_exec_${runId}`);

    try {
      await fs.mkdir(tempDir, { recursive: true });

      // Write code and stdin files
      const sourceFile = path.join(tempDir, config.fileName);
      await fs.writeFile(sourceFile, code, 'utf-8');

      const stdinFile = path.join(tempDir, 'stdin.txt');
      await fs.writeFile(stdinFile, stdin, 'utf-8');

      // Prepare docker command
      // We redirect stdin.txt into the command so the executed program receives it.
      const dockerCommand = `${config.runCommand} < stdin.txt`;

      const startTime = performance.now();

      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      let isTimeout = false;

      // Note: In a production environment, you might want to use a more robust way to measure memory.
      // For this milestone, we will approximate memory as 0 or a fixed minimal value since docker stats is hard to capture synchronously.
      // We enforce the limit using Docker's --memory flag.

      try {
        const { stdout: out, stderr: err } = await execFileAsync(
          'docker',
          [
            'run',
            '--rm',
            '--network',
            'none', // Disable network access
            '--cpus',
            CPU_LIMIT,
            '--memory',
            MEMORY_LIMIT,
            '-v',
            `${tempDir}:/app`,
            '-w',
            '/app',
            config.image,
            'sh',
            '-c',
            dockerCommand,
          ],
          { timeout: TIMEOUT_MS },
        );
        stdout = out;
        stderr = err;
      } catch (error: any) {
        if (error.killed && error.signal === 'SIGTERM') {
          isTimeout = true;
          stderr = 'Execution timed out';
          exitCode = 124; // Standard timeout exit code
        } else {
          // Captures compilation errors or runtime exceptions
          stdout = error.stdout || '';
          stderr = error.stderr || error.message || 'Execution failed';
          exitCode = error.code || 1;
        }
      }

      const endTime = performance.now();
      const runtime = Math.round(endTime - startTime);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        runtime,
        memory: 0, // Placeholder for milestone
        success: exitCode === 0 && !isTimeout,
      };
    } finally {
      // Clean up temporary files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to clean up temp dir ${tempDir}:`, e);
      }
    }
  },
};
