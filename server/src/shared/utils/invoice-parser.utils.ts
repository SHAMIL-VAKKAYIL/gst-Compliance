import { ExtractedInvoiceData } from '../../modules/invoices/invoices.types';

export interface InvoiceTextPatterns {
  invoiceNumber: RegExp;
  date: RegExp;
  vendor: RegExp;
  gstin: RegExp;
  total: RegExp;
  tax: RegExp;
}

export function parseInvoiceText(
  text: string,
  patterns: InvoiceTextPatterns
): ExtractedInvoiceData {
  const invoiceNumberMatch = text.match(patterns.invoiceNumber);
  const dateMatch = text.match(patterns.date);
  const vendorMatch = text.match(patterns.vendor);
  const gstinMatch = text.match(patterns.gstin);
  const totalMatch = text.match(patterns.total);
  const taxMatch = text.match(patterns.tax);
  const totalAmount = parseAmount(totalMatch?.[1]);

  return {
    invoiceNumber: invoiceNumberMatch?.[1].trim() ?? 'UNKNOWN',
    vendorName: vendorMatch?.[1].trim() ?? 'UNKNOWN',
    gstin: gstinMatch?.[1].trim() ?? 'UNKNOWN',
    invoiceDate: dateMatch ? formatDate(dateMatch[1]) : null,
    invoiceAmount: totalAmount,
    tax: parseAmount(taxMatch?.[1]),
    totalAmount
  };
}

function parseAmount(value?: string): number {
  return value ? parseFloat(value.replace(/,/g, '')) : 0;
}

function formatDate(dateStr: string): string | null {
  const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(dateStr);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  const ymd = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(dateStr);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  return null;
}