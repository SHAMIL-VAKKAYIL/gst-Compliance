import { Rule, RuleResult, InvoiceForValidation } from '../validation.types'


const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/i;


export const gstinFormatRule: Rule = {
  code: 'gstin_format_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    const passed = GSTIN_PATTERN.test(invoice.gstin);
    return {
      ruleCode: this.code,
      passed,
      severity: 'ERROR',
      message: passed
        ? 'GSTIN format is valid'
        : `GSTIN "${invoice.gstin}" does not match the required 15-character GST format`
    };
  }
};
