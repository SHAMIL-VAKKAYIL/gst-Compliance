export interface LLMLineItem {
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

export interface LLMExtractedData {
  gstin: string | null;
  buyerGstin: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  vendorName: string | null;
  amount: number | null;
  lineItems: LLMLineItem[];
}


export interface RuleResult {
  ruleCode: string;
  passed: boolean;
  severity: 'ERROR' | 'WARNING';
  message: string;
}


