import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { socket } from '../../socket/socket';
import { useWorkspace } from '../../hooks/useWorkspace';

export function TerminalOutput() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { terminal: terminalSize } = useWorkspace(); // To resize when layout changes

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0d0d0d',
        foreground: '#d4d4d4',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[38;5;240mReady for execution...\x1b[0m');

    // Input buffer for line-buffered input (since we lack a true PTY line discipline)
    const inputBuffer = { current: '' };

    term.onData((data) => {
      // Handle pasted text or Enter key
      if (data.includes('\r') || data.includes('\n')) {
        const normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = normalized.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (i < lines.length - 1) {
            // Line with a newline after it
            inputBuffer.current += lines[i];
            term.write(lines[i] + '\r\n');
            socket.emit('terminal:input', { data: inputBuffer.current + '\n' });
            inputBuffer.current = '';
          } else {
            // Last part
            inputBuffer.current += lines[i];
            term.write(lines[i]);
          }
        }
        return;
      }

      // Handle Backspace
      if (data === '\x7F') {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        // Normal character
        inputBuffer.current += data;
        term.write(data);
      }
    });

    const handleStart = () => {
      term.clear();
      term.focus();
    };

    const handleOutput = ({ data }: { data: string }) => {
      term.write(data);
    };

    const handleExit = ({ exitCode }: { exitCode: number }) => {
      term.write(`\r\n\x1b[38;5;240m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
    };

    socket.on('terminal:start', handleStart);
    socket.on('terminal:output', handleOutput);
    socket.on('terminal:exit', handleExit);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      socket.off('terminal:start', handleStart);
      socket.off('terminal:output', handleOutput);
      socket.off('terminal:exit', handleExit);
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Fit terminal when workspace layout changes
  useEffect(() => {
    if (fitAddonRef.current) {
      // Small timeout to allow container to fully resize before fitting
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 50);
    }
  }, [terminalSize.size]);

  return (
    <div className="w-full h-full p-2 bg-[#0d0d0d] overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
