import { Rule, RuleResult, InvoiceForValidation } from '../validation.types';
import { toNumber } from '../../../shared/utils/number';

const STATE_CODE_PATTERN = /^\d{2}$/;
const EPSILON = 0.01;

function notApplicable(code: string, reason: string): RuleResult {
  return {
    ruleCode: code,
    passed: true,
    severity: 'WARNING',
    message: `State consistency check not applicable: ${reason}`
  };
}

export const stateConsistencyRule: Rule = {
  code: 'state_tax_type_consistent',
  evaluate(invoice: InvoiceForValidation): RuleResult {
    if (!invoice.buyerGstin) {
      return notApplicable(this.code, 'no buyer GSTIN (B2C invoice)');
    }

    const sellerState = invoice.gstin?.slice(0, 2);
    const buyerState = invoice.buyerGstin.slice(0, 2);

    if (!STATE_CODE_PATTERN.test(sellerState ?? '') || !STATE_CODE_PATTERN.test(buyerState)) {
      return notApplicable(this.code, 'could not read a state code from one of the GSTINs');
    }

    let igst = 0;
    let cgst = 0;
    let sgst = 0;
    for (const item of invoice.lineItems ?? []) {
      igst += toNumber(item.igstAmount) ?? 0;
      cgst += toNumber(item.cgstAmount) ?? 0;
      sgst += toNumber(item.sgstAmount) ?? 0;
    }

    if (igst + cgst + sgst < EPSILON) {
      return notApplicable(this.code, 'no tax amounts on the line items');
    }

    const intraState = sellerState === buyerState;

    if (intraState && igst > EPSILON) {
      return {
        ruleCode: this.code,
        passed: false,
        severity: 'ERROR',
        message: `Seller and buyer are both in state ${sellerState}, so CGST+SGST applies, but IGST of ${igst.toFixed(2)} was charged`
      };
    }

    if (!intraState && (cgst > EPSILON || sgst > EPSILON)) {
      return {
        ruleCode: this.code,
        passed: false,
        severity: 'ERROR',
        message: `Seller (state ${sellerState}) and buyer (state ${buyerState}) are in different states, so IGST applies, but CGST/SGST was charged`
      };
    }

    return {
      ruleCode: this.code,
      passed: true,
      severity: 'ERROR',
      message: intraState
        ? `Intra-state supply (state ${sellerState}), CGST+SGST charged correctly`
        : `Inter-state supply (${sellerState} to ${buyerState}), IGST charged correctly`
    };
  }
};