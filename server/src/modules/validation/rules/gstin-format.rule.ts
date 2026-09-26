import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/i;

function checkFormat(gstin: string, label: string, ruleCode: string): RuleResult {
  const passed = GSTIN_PATTERN.test(gstin);
  return {
    ruleCode,
    passed,
    severity: 'ERROR',
    message: passed
      ? `${label} GSTIN format is valid`
      : `${label} GSTIN "${gstin}" does not match the required 15-character GST format`
  };
}

export const sellerGstinFormatRule: Rule = {
  code: 'seller_gstin_format_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    return checkFormat(invoice.gstin, 'Seller', this.code);
  }
};

export const buyerGstinFormatRule: Rule = {
  code: 'buyer_gstin_format_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    if (!invoice.buyerGstin) {
      return {
        ruleCode: this.code,
        passed: true,
        severity: 'ERROR',
        message: 'No buyer GSTIN present (B2C invoice) — check not applicable'
      };
    }
    return checkFormat(invoice.buyerGstin, 'Buyer', this.code);
  }
};