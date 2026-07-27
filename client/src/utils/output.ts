export const normalizeOutput = (output: string): string => {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n') // Normalize CRLF to LF
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing spaces per line
    .join('\n')
    .trim(); // Remove leading/trailing blank lines
};
