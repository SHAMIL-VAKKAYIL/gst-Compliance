import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';

const GSTIN_CODEPOINTS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function isValidGstinChecksum(gstin: string): boolean {
  if (gstin.length !== 15) return false;

  const factor = [1, 2];
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const codePoint = GSTIN_CODEPOINTS.indexOf(gstin[i]);
    if (codePoint === -1) return false;

    const product = codePoint * factor[i % 2];
    sum += Math.floor(product / 36) + (product % 36);
  }

  const checkCodePoint = (36 - (sum % 36)) % 36;
  return gstin[14] === GSTIN_CODEPOINTS[checkCodePoint];
}

export const gstinChecksumRule: Rule = {
  code: 'gstin_checksum_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    const passed = isValidGstinChecksum(invoice.gstin.toUpperCase());
    return {
      ruleCode: this.code,
      passed,
      severity: 'ERROR',
      message: passed
        ? 'GSTIN checksum is valid'
        : `GSTIN "${invoice.gstin}" fails checksum verification — likely mistyped or fabricated`
    };
  }
};