import { useEffect } from 'react';

interface UseShortcutsProps {
  onRunCode: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onCopyLink: () => void;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
}

export function useShortcuts({
  onRunCode,
  onSave,
  onToggleSidebar,
  onToggleTerminal,
  onCopyLink,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
}: UseShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Must use metaKey (Cmd on Mac) or ctrlKey (Windows/Linux)
      const isCtrl = e.ctrlKey || e.metaKey;

      if (!isCtrl) return;

      switch (e.key.toLowerCase()) {
        case 'enter':
          e.preventDefault();
          onRunCode();
          break;
        case 's':
          e.preventDefault();
          onSave();
          break;
        case 'b':
          e.preventDefault();
          onToggleSidebar();
          break;
        case 'j':
          e.preventDefault();
          onToggleTerminal();
          break;
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            onCopyLink();
          }
          break;
        case '=': // Plus key (without shift usually = on most keyboards)
        case '+':
          e.preventDefault();
          onIncreaseFontSize();
          break;
        case '-':
          e.preventDefault();
          onDecreaseFontSize();
          break;
        case '0':
          e.preventDefault();
          onResetFontSize();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onRunCode,
    onSave,
    onToggleSidebar,
    onToggleTerminal,
    onCopyLink,
    onIncreaseFontSize,
    onDecreaseFontSize,
    onResetFontSize,
  ]);
}
