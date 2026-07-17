import { useResizable } from './useResizable';

export const WORKSPACE_DEFAULTS = {
  sidebarWidth: 320,
  terminalHeight: 250,
  chatHeight: 300,
};

export function useWorkspace() {
  const sidebar = useResizable({
    direction: 'horizontal',
    initialSize: WORKSPACE_DEFAULTS.sidebarWidth,
    minSize: 280,
    maxSize: 800,
    localStorageKey: 'workspace_sidebarWidth',
    reverse: true, // Dragging left increases size because it's pinned to the right
  });

  const terminal = useResizable({
    direction: 'vertical',
    initialSize: WORKSPACE_DEFAULTS.terminalHeight,
    minSize: 150,
    maxSize: 800,
    localStorageKey: 'workspace_terminalHeight',
    reverse: true, // Pinned to the bottom
  });

  const chat = useResizable({
    direction: 'vertical',
    initialSize: WORKSPACE_DEFAULTS.chatHeight,
    minSize: 180,
    maxSize: 800,
    localStorageKey: 'workspace_chatHeight',
    reverse: true, // Pinned to the bottom (below Participants)
  });

  const isDraggingAny = sidebar.isDragging || terminal.isDragging || chat.isDragging;

  const resetLayout = () => {
    sidebar.resetSize(WORKSPACE_DEFAULTS.sidebarWidth);
    terminal.resetSize(WORKSPACE_DEFAULTS.terminalHeight);
    chat.resetSize(WORKSPACE_DEFAULTS.chatHeight);
  };

  return {
    sidebar,
    terminal,
    chat,
    isDraggingAny,
    resetLayout,
  };
}
