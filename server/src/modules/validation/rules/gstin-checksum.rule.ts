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

function checkChecksum(gstin: string, label: string, ruleCode: string): RuleResult {
  const normalized = gstin.toUpperCase();
  const passed = isValidGstinChecksum(normalized);
  return {
    ruleCode,
    passed,
    severity: 'ERROR',
    message: passed
      ? `${label} GSTIN checksum is valid`
      : `${label} GSTIN "${gstin}" fails checksum verification — likely mistyped or fabricated`
  };
}

export const sellerGstinChecksumRule: Rule = {
  code: 'seller_gstin_checksum_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    return checkChecksum(invoice.gstin, 'Seller', this.code);
  }
};

export const buyerGstinChecksumRule: Rule = {
  code: 'buyer_gstin_checksum_valid',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    if (!invoice.buyerGstin) {
      return {
        ruleCode: this.code,
        passed: true,
        severity: 'ERROR',
        message: 'No buyer GSTIN present (B2C invoice) — check not applicable'
      };
    }
    return checkChecksum(invoice.buyerGstin, 'Buyer', this.code);
  }
};