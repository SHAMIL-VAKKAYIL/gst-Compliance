// Invoice data structure extracted from PDF/Image
export interface ExtractedInvoiceData {
  invoiceNumber: string;
  vendorName: string;
  gstin: string;
  invoiceDate: string | null;
  invoiceAmount: number;
  tax: number;
  totalAmount: number;
  extractionStatus?: 'COMPLETE' | 'NEEDS_CORRECTION' | 'FAILED' | null;
  lineItems: LineItem[];
  // failureReason: '  CORRUPTED_FILE' | 'UNREADABLE_SCAN' | 'MISSING_REQUIRED_FIELDS'| null;

}

export interface LineItem {
  description: string | null;
  hsnCode: string | null;
  quantity: number | null;
  unitPrice: number | null;
  taxableValue: number | null;
  taxRate: number | null;
  igstAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  lineTotal: number | null;
}

export interface ValidationMetrics {
  invoiceNumberValid: boolean;
  dateValid: boolean;
  vendorValid: boolean;
  gstnValid: boolean;
  totalValid: boolean;
  validFieldCount: number;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedInvoiceData;
  rawText?: string; // Raw extracted text from PDF or OCR
  extractionStatus?: 'COMPLETE' | 'FAILED' | 'NEEDS_CORRECTION' | null;
  failureReason?: string | null;
  error?: string;
  confidence?: number; // For OCR accuracy
  validationResults?: ValidationMetrics; // Field validation results
  lineItems?: LineItem[]; // Optional: extracted line items
}