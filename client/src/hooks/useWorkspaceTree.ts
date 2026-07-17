import { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceNode,
  getWorkspace,
  createNode,
  updateNode,
  deleteNode,
} from '../api/workspace.api';

export interface Tab {
  id: string; // node id
  name: string;
  language: string;
  isDirty?: boolean;
}

export function useWorkspaceTree(roomId: string) {
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [openTabs, setOpenTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem(`workspace_tabs_${roomId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`workspace_active_${roomId}`) || null;
    } catch {
      return null;
    }
  });

  // Save tabs to local storage
  useEffect(() => {
    localStorage.setItem(`workspace_tabs_${roomId}`, JSON.stringify(openTabs));
  }, [openTabs, roomId]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem(`workspace_active_${roomId}`, activeFileId);
    } else {
      localStorage.removeItem(`workspace_active_${roomId}`);
    }
  }, [activeFileId, roomId]);

  const loadTree = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const data = await getWorkspace(roomId);
      setNodes(data);

      // If no active file, open the first file automatically
      if (!activeFileId) {
        const firstFile = data.find((n) => n.type === 'FILE');
        if (firstFile) {
          openFile(firstFile);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId, activeFileId]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Tab management
  const openFile = useCallback((node: WorkspaceNode) => {
    if (node.type !== 'FILE') return;

    setOpenTabs((prev) => {
      const exists = prev.find((t) => t.id === node.id);
      if (exists) return prev;
      return [...prev, { id: node.id, name: node.name, language: node.language || 'txt' }];
    });
    setActiveFileId(node.id);
  }, []);

  const closeTab = useCallback(
    (nodeId: string) => {
      setOpenTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== nodeId);
        if (activeFileId === nodeId) {
          // Switch to the previous tab
          const idx = prev.findIndex((t) => t.id === nodeId);
          if (newTabs.length > 0) {
            const nextTab = newTabs[Math.max(0, idx - 1)];
            setActiveFileId(nextTab.id);
          } else {
            setActiveFileId(null);
          }
        }
        return newTabs;
      });
    },
    [activeFileId],
  );

  // Tree CRUD
  const handleCreateNode = async (
    parentId: string | null,
    type: 'FILE' | 'FOLDER',
    name: string,
    language?: string,
  ) => {
    const newNode = await createNode(roomId, { parentId, type, name, language });
    setNodes((prev) => [...prev, newNode]);
    if (type === 'FILE') {
      openFile(newNode);
    }
    return newNode;
  };

  const handleUpdateNode = async (
    nodeId: string,
    updates: { name?: string; parentId?: string | null; content?: string; language?: string },
  ) => {
    const updated = await updateNode(nodeId, updates);
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...updated } : n)));

    // Update tab info if name/language changed
    if (updates.name || updates.language) {
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.id === nodeId
            ? { ...t, name: updated.name, language: updated.language || t.language }
            : t,
        ),
      );
    }
    return updated;
  };

  const handleDeleteNode = async (nodeId: string) => {
    await deleteNode(nodeId);

    // Deleting a folder recursively deletes children. We should reload tree or manually traverse and remove.
    // For safety, let's just reload the tree.
    loadTree();

    // Close tab if it was deleted (or if its parent was deleted, loadTree will handle tabs if we want,
    // but simplest is just checking if active tab still exists after reload).
  };

  // When nodes change, verify tabs still exist
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      setOpenTabs((prev) => {
        const valid = prev.filter((t) => nodes.some((n) => n.id === t.id));
        if (valid.length !== prev.length) return valid;
        return prev;
      });
      if (activeFileId && !nodes.some((n) => n.id === activeFileId)) {
        setActiveFileId(null);
      }
    }
  }, [nodes, loading, activeFileId]);

  // Helper to get active node
  const activeNode = nodes.find((n) => n.id === activeFileId) || null;

  return {
    nodes,
    loading,
    error,
    activeFileId,
    setActiveFileId,
    openTabs,
    openFile,
    closeTab,
    activeNode,
    createNode: handleCreateNode,
    updateNode: handleUpdateNode,
    deleteNode: handleDeleteNode,
    refresh: loadTree,
  };
}
