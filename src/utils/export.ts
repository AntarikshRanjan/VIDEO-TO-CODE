import JSZip from 'jszip';
import { FileStructure } from '@/types';

export async function generateZipFile(files: FileStructure[]): Promise<Blob> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Add a README file
  const readme = `# Generated Website

This website was generated from a video using AI.

## Files
${files.map((f) => `- ${f.path}`).join('\n')}

## Usage
1. Open index.html in a web browser
2. Or serve using a local server:
   \`\`\`bash
   npx serve .
   \`\`\`

Generated on ${new Date().toLocaleString()}
`;

  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

