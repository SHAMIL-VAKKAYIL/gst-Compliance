// Invoice data structure extracted from PDF/Image
export interface ExtractedInvoiceData {
  invoiceNumber: string;
  vendorName: string;
  vendorGSTIN: string;
  invoiceDate: string;
  invoiceAmount: number;
  tax: number;
  totalAmount: number;
  lineItems: LineItem[];
  description?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
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
  error?: string;
  confidence?: number; // For OCR accuracy
  validationResults?: ValidationMetrics; // Field validation results
}
