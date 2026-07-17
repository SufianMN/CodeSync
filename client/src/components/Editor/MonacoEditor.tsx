import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  theme?: string;
  customOptions?: any;
}

export function MonacoEditor({
  language,
  value,
  onChange,
  onMount,
  theme = 'vs-dark',
  customOptions = {},
}: MonacoEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={onMount}
        options={{
          minimap: { enabled: true },
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          fontSize: 14,
          padding: { top: 16 },
          ...customOptions,
        }}
        loading={
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }
      />
    </div>
  );
}
