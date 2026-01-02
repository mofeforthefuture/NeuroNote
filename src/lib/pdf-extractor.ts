/**
 * PDF Text Extraction Service
 * Extracts text content from PDF files for AI processing
 */

// Initialize worker source once
let workerInitialized = false

async function initializePDFWorker() {
  if (workerInitialized) return
  
  const pdfjsLib = await import('pdfjs-dist')
  
  // For Vite, use jsDelivr CDN which is reliable and works with the installed version
  // Using version 5.4.530 to match package.json
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`
  
  workerInitialized = true
}

/**
 * Extract text from PDF file using PDF.js
 * This runs client-side for privacy
 */
export async function extractTextFromPDF(file: File): Promise<{
  text: string
  pageCount: number
  error?: string
}> {
  try {
    // Initialize worker
    await initializePDFWorker()
    
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist')

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
    }).promise
    const pageCount = pdf.numPages

    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`
    }

    return {
      text: fullText.trim(),
      pageCount,
    }
  } catch (error) {
    return {
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'PDF extraction failed',
    }
  }
}

/**
 * Extract text from specific pages
 */
export async function extractTextFromPages(
  file: File,
  pageNumbers: number[]
): Promise<{
  text: string
  error?: string
}> {
  try {
    // Initialize worker
    await initializePDFWorker()
    
    const pdfjsLib = await import('pdfjs-dist')

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
    }).promise

    let fullText = ''

    for (const pageNum of pageNumbers) {
      if (pageNum > pdf.numPages) continue

      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`
    }

    return {
      text: fullText.trim(),
    }
  } catch (error) {
    return {
      text: '',
      error: error instanceof Error ? error.message : 'PDF extraction failed',
    }
  }
}

