import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Extracts plain text from a PDF File object using pdfjs-dist.
 * Runs entirely in the browser — no server call required.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to keep initial bundle lean
  const pdfjsLib = await import('pdfjs-dist');

  // Point the worker at the bundled worker file served by Vite
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const textParts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 8); // Cap at 8 pages to keep the prompt manageable

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n').trim();
}
