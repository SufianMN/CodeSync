import { useState, useEffect } from 'react';
import {
  RunTestsResponse,
  TestCase,
  getTestCases,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from '../../api/testcase.api';
import { TerminalOutput } from './TerminalOutput';
import {
  Terminal,
  Settings2,
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Play,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { WorkspaceNode } from '../../api/workspace.api';

interface ExecutionPanelProps {
  activeFileId: string | null;
  activeNode: WorkspaceNode | null;
  updateNode: (id: string, data: Partial<WorkspaceNode>) => Promise<any>;
  result: RunTestsResponse | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  height: number;
  runMode: 'testcases' | 'output';
}

export function ExecutionPanel({
  activeFileId,
  activeNode,
  updateNode,
  result,
  isLoading,
  error,
  isOpen,
  setIsOpen,
  height,
  runMode,
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<'testcases' | 'results' | 'output'>('testcases');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Time and Memory Limit state
  const [timeLimit, setTimeLimit] = useState<string>('1.00');
  const [memoryLimit, setMemoryLimit] = useState<string>('512');

  useEffect(() => {
    if (activeNode) {
      setTimeLimit((activeNode.timeLimitMs ? activeNode.timeLimitMs / 1000 : 1.0).toFixed(2));
      setMemoryLimit((activeNode.memoryLimitMB || 512).toString());
    }
  }, [activeNode]);

  const handleSaveConstraints = () => {
    if (activeFileId) {
      updateNode(activeFileId, {
        timeLimitMs: Math.round(parseFloat(timeLimit) * 1000),
        memoryLimitMB: parseInt(memoryLimit, 10),
      });
    }
  };

  useEffect(() => {
    if (activeFileId) {
      loadTestCases(activeFileId);
    } else {
      setTestCases([]);
    }
  }, [activeFileId]);

  const loadTestCases = async (fileId: string) => {
    setLoadingCases(true);
    try {
      const cases = await getTestCases(fileId);
      setTestCases(cases);
    } catch (err) {
      console.error('Failed to load test cases', err);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (runMode === 'output') {
      setActiveTab('output');
    } else if (activeTab === 'output') {
      setActiveTab('testcases');
    }
  }, [runMode]);

  useEffect(() => {
    if (isLoading || result || error) {
      if (runMode === 'output' || (error && error.includes('No test cases found'))) {
        setActiveTab('output');
      } else {
        setActiveTab('results');
      }
      setIsOpen(true);
    }
  }, [isLoading, result, error, runMode, setIsOpen]);

  const handleAddTestCase = async () => {
    if (!activeFileId || testCases.length >= 5) return;
    try {
      const newTc = await createTestCase(activeFileId, { input: '', expectedOutput: '' });
      setTestCases([...testCases, newTc]);
    } catch (err) {
      console.error('Failed to add testcase', err);
    }
  };

  const handleDuplicate = async (tc: TestCase) => {
    if (!activeFileId || testCases.length >= 5) return;
    try {
      const newTc = await createTestCase(activeFileId, {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      });
      setTestCases([...testCases, newTc]);
    } catch (err) {
      console.error('Failed to duplicate testcase', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTestCase(id);
      setTestCases(testCases.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete testcase', err);
    }
  };

  const handleUpdateTestCase = async (
    id: string,
    field: 'input' | 'expectedOutput',
    value: string,
  ) => {
    setTestCases(testCases.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    try {
      await updateTestCase(id, { [field]: value });
    } catch (err) {
      console.error('Failed to update testcase', err);
    }
  };

  if (!isOpen) {
    return (
      <div
        className="bg-[#1e1e1e] border-t border-gray-800 flex items-center px-4 py-2 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <ChevronUp className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Test Cases</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-[#1e1e1e] relative z-10 flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      {/* Tabs Header */}
      <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-gray-800 px-2 pt-2">
        <div className="flex space-x-1">
          {runMode === 'testcases' ? (
            <>
              <button
                onClick={() => setActiveTab('testcases')}
                className={twMerge(
                  'px-4 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 transition-colors',
                  activeTab === 'testcases'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50',
                )}
              >
                <Settings2 className="h-4 w-4" />
                <span>Test Cases</span>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={twMerge(
                  'px-4 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 transition-colors',
                  activeTab === 'results'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50',
                )}
              >
                <Terminal className="h-4 w-4" />
                <span>Execution Results</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('output')}
              className={twMerge(
                'px-4 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 transition-colors',
                activeTab === 'output'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50',
              )}
            >
              <Play className="h-4 w-4" />
              <span>Interactive Output</span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2 text-blue-400" />}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded mr-2"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#0d0d0d]">
        {activeTab === 'testcases' && (
          <div className="p-4 max-w-5xl mx-auto space-y-6">
            {!activeFileId ? (
              <div className="text-gray-500 italic text-center p-8 bg-[#1e1e1e] rounded-md border border-gray-800">
                Open a file to manage its test cases.
              </div>
            ) : (
              <>
                {/* Execution Constraints */}
                <div className="bg-[#1e1e1e] rounded-lg border border-gray-800 p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Execution Constraints
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Time Limit (seconds)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10.0"
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(e.target.value)}
                          onBlur={handleSaveConstraints}
                          className="w-24 bg-[#0d0d0d] border border-gray-700 rounded-l px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                        />
                        <span className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-3 py-1 text-sm text-gray-400">
                          s
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Memory Limit (MB)</label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="16"
                          min="32"
                          max="2048"
                          value={memoryLimit}
                          onChange={(e) => setMemoryLimit(e.target.value)}
                          onBlur={handleSaveConstraints}
                          className="w-24 bg-[#0d0d0d] border border-gray-700 rounded-l px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                        />
                        <span className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-3 py-1 text-sm text-gray-400">
                          MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Cases List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Custom Test Cases ({testCases.length}/5)
                    </h3>
                    <button
                      onClick={handleAddTestCase}
                      disabled={testCases.length >= 5}
                      className="flex items-center px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Test Case
                    </button>
                  </div>

                  {loadingCases ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                  ) : testCases.length === 0 ? (
                    <div className="text-gray-500 italic text-center p-8 bg-[#1e1e1e] rounded-md border border-gray-800">
                      No test cases defined. Add one to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {testCases.map((tc, idx) => (
                        <div
                          key={tc.id}
                          className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between bg-gray-800/50 px-4 py-2 border-b border-gray-800">
                            <span className="text-sm font-semibold text-gray-300">
                              Test Case {idx + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDuplicate(tc)}
                                className="text-gray-400 hover:text-white p-1"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(tc.id)}
                                className="text-gray-400 hover:text-red-400 p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                Input
                              </label>
                              <textarea
                                value={tc.input}
                                onChange={(e) =>
                                  handleUpdateTestCase(tc.id, 'input', e.target.value)
                                }
                                className="w-full h-32 bg-[#0d0d0d] border border-gray-700 rounded p-2 text-sm text-gray-300 font-mono resize-y focus:outline-none focus:border-blue-500"
                                spellCheck={false}
                                placeholder="Standard Input..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                Expected Output
                              </label>
                              <textarea
                                value={tc.expectedOutput}
                                onChange={(e) =>
                                  handleUpdateTestCase(tc.id, 'expectedOutput', e.target.value)
                                }
                                className="w-full h-32 bg-[#0d0d0d] border border-gray-700 rounded p-2 text-sm text-gray-300 font-mono resize-y focus:outline-none focus:border-blue-500"
                                spellCheck={false}
                                placeholder="Expected Output..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-4 max-w-5xl mx-auto font-sans">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-gray-400 animate-pulse">Running test cases...</span>
              </div>
            ) : error ? (
              <div className="bg-red-950/30 border border-red-900/50 rounded-md p-4 flex items-start space-x-3 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="overflow-x-auto">
                  <div className="font-semibold mb-1">Execution Error</div>
                  <pre className="whitespace-pre-wrap text-sm">{error}</pre>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between bg-[#1e1e1e] p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-3">
                    {result.passed === result.total ? (
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <div className="text-xl font-bold text-white">
                        {result.passed === result.total ? 'Accepted' : 'Failed'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Passed {result.passed} / {result.total} Test Cases
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.results.map((res, idx) => (
                    <div
                      key={res.id}
                      className="bg-[#1e1e1e] rounded-lg border border-gray-800 overflow-hidden"
                    >
                      <div
                        className={clsx(
                          'px-4 py-3 flex items-center justify-between border-b border-gray-800/50',
                          res.status === 'Correct' ? 'bg-green-950/20' : 'bg-red-950/20',
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 font-medium">Test Case {idx + 1}</span>
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider',
                              res.status === 'Correct'
                                ? 'bg-green-500/10 text-green-400'
                                : res.status === 'Wrong Answer'
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-yellow-500/10 text-yellow-400',
                            )}
                          >
                            {res.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-mono text-gray-500">
                          {res.runtimeMs !== undefined && (
                            <div className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" /> {res.runtimeMs} ms
                            </div>
                          )}
                          {res.memoryMB !== undefined && (
                            <div className="flex items-center">
                              <Database className="w-3.5 h-3.5 mr-1" /> {res.memoryMB} MB
                            </div>
                          )}
                        </div>
                      </div>

                      {(res.status === 'Wrong Answer' ||
                        res.status === 'Runtime Error' ||
                        res.status === 'Compilation Error') && (
                        <div className="p-4 space-y-4 bg-[#0d0d0d]">
                          {res.status === 'Wrong Answer' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">
                                  Expected
                                </div>
                                <div className="bg-[#1e1e1e] border border-gray-700 rounded p-3 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                  {res.expected || (
                                    <span className="text-gray-600 italic">empty string</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">
                                  Received
                                </div>
                                <div className="bg-red-950/10 border border-red-900/30 rounded p-3 text-sm text-red-200 font-mono whitespace-pre-wrap">
                                  {res.received || (
                                    <span className="text-red-900 italic">empty string</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {(res.status === 'Runtime Error' || res.status === 'Compilation Error') &&
                            res.stderr && (
                              <div>
                                <div className="text-xs font-semibold text-red-500 uppercase mb-2 tracking-wider">
                                  Error Details
                                </div>
                                <div className="bg-red-950/20 border border-red-900/30 rounded p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
                                  {res.stderr}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Terminal className="w-12 h-12 mb-4 opacity-50" />
                <p>Run your test cases to see the results here.</p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: activeTab === 'output' ? 'block' : 'none', height: '100%' }}>
          <TerminalOutput />
        </div>
      </div>
    </div>
  );
}
