export interface RuleResult {
  ruleCode: string;
  passed: boolean;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface Invoice {
  gstin: string;
  invoiceNumber: string | null;
  vendorName: string | null;
  invoiceDate: Date | null;
  amount: number | null;
}

export interface Rule {
  code: string;
  evaluate(invoice: Invoice): RuleResult;
}