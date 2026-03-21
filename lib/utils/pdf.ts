/**
 * Shared PDF generation utilities for invoices.
 * Uses html2pdf.js (client-side only) to capture the visible .invoice-content element.
 */

/**
 * Returns the visible .invoice-content DOM element or throws if not found.
 */
function getInvoiceElement(): HTMLElement {
  const el = document.querySelector('.invoice-content') as HTMLElement;
  if (!el) {
    throw new Error('Invoice content not found on page');
  }
  return el;
}

/**
 * Shared html2pdf options for consistent PDF output.
 */
function pdfOptions(filename: string) {
  return {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' as const },
  };
}

/**
 * Generate and trigger a PDF download for the invoice currently displayed on screen.
 */
export async function downloadInvoicePdf(invoiceNumber: number): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = getInvoiceElement();

  await html2pdf()
    .set(pdfOptions(`Invoice-${invoiceNumber}.pdf`))
    .from(element)
    .save();
}

/**
 * Generate a PDF for the invoice currently displayed on screen and return it as a base64 string.
 * Returns undefined if generation fails (caller can decide to proceed without attachment).
 */
export async function generateInvoicePdfBase64(invoiceNumber: number): Promise<string | undefined> {
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = getInvoiceElement();

    const pdfBlob: Blob = await html2pdf()
      .set(pdfOptions(`Invoice-${invoiceNumber}.pdf`))
      .from(element)
      .outputPdf('blob');

    const arrayBuffer = await pdfBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('PDF generation failed:', error);
    return undefined;
  }
}
