export interface Rule {
    code: string;
    evaluate(invoice: InvoiceForValidation): RuleResult;
}

export interface RuleResult {
    ruleCode: string;
    passed: boolean;
    severity: 'ERROR' | 'WARNING';
    message: string;
}

export interface InvoiceForValidation {
    gstin: string;
    invoiceNumber: string | null;
    vendorName: string | null;
    invoiceDate: Date | null;
    amount: number | null;
    lineItems?: {
        description: string | null;
        taxableValue: number | null;
        taxRate: number | null;
        hsnCode: string | null
        igstAmount: number | null;
        cgstAmount: number | null;
        sgstAmount: number | null;
        lineTotal: number | null;
    }[];
}

export interface SummaryResult {
    summary: string;
    invoiceId: string
}