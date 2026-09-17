import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';

const TOLERANCE = 1.00; // allow up to ₹1 rounding drift across many line items

export const lineItemsSumRule: Rule = {
  code: 'line_items_sum_matches_total',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      return {
        ruleCode: this.code,
        passed: true,
        severity: 'WARNING',
        message: 'No line items to verify against total'
      };
    }

    const sum = invoice.lineItems.reduce((total, item) => {
      return total + (item.lineTotal != null ? Number(item.lineTotal) : 0);
    }, 0);

    const invoiceAmount = invoice.amount != null ? Number(invoice.amount) : 0;
    const difference = Math.abs(sum - invoiceAmount);
    const passed = difference <= TOLERANCE;

    return {
      ruleCode: this.code,
      passed,
      severity: 'ERROR',
      message: passed
        ? 'Line item totals match invoice amount'
        : `Line items sum to ${sum.toFixed(2)} but invoice total is ${invoiceAmount.toFixed(2)} (difference: ${difference.toFixed(2)})`
    };
  }
};