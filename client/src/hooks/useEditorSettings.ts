import { useState, useEffect } from 'react';

export const EDITOR_DEFAULTS = {
  fontSize: 14,
  theme: 'vs-dark',
  minimap: true,
  wordWrap: true,
  lineNumbers: true,
  highlightActiveLine: true,
  autoSave: true,
};

export function useEditorSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('editor_settings');
    if (saved) {
      try {
        return { ...EDITOR_DEFAULTS, ...JSON.parse(saved) };
      } catch {
        return EDITOR_DEFAULTS;
      }
    }
    return EDITOR_DEFAULTS;
  });

  useEffect(() => {
    localStorage.setItem('editor_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof typeof EDITOR_DEFAULTS>(
    key: K,
    value: (typeof EDITOR_DEFAULTS)[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(EDITOR_DEFAULTS);
    localStorage.setItem('editor_settings', JSON.stringify(EDITOR_DEFAULTS));
  };

  return { settings, updateSetting, resetSettings };
}
