import hsn from 'hsn-code-package';
import { InvoiceForValidation, Rule, RuleResult } from '../validation.types';
import { toNumber } from '../../../shared/utils/number';
// const hsn = hsnPkg.default ?? hsnPkg;

interface RateLookupResult {
    rate: number | null;
    confident: boolean;
    reason: string;
}

function isServiceCode(code: string): boolean {
    return code.startsWith('99');
}


function lookupHsnRate(code: string): RateLookupResult {
    // exact 8-digit match — highest confidence
    if (code.length === 8) {
        const rateInfo = hsn.getGstRateByCode(code);
        if (rateInfo) {
            return { rate: rateInfo.igstRate, confident: true, reason: `exact match (${rateInfo.rateSource})` };
        }
        return { rate: null, confident: false, reason: 'code not found in reference data' };
    }

    // shorter code (heading/sub-heading level) — prefix match against full dataset
    const allHsn = hsn.getAllHsn();
    const matchingCodes = allHsn.filter((entry: any) => entry.code.startsWith(code));

    if (matchingCodes.length === 0) {
        return { rate: null, confident: false, reason: 'no matching codes found under this heading' };
    }

    const rates = matchingCodes
        .map((entry: any) => hsn.getGstRateByCode(entry.code))
        .filter((r: any): r is NonNullable<typeof r> => r !== null);

    if (rates.length === 0) {
        return { rate: null, confident: false, reason: 'matching codes found but no rate data available' };
    }

    const distinctRates = new Set(rates.map((r: any) => r.igstRate));
    if (distinctRates.size > 1) {
        return { rate: null, confident: false, reason: `inconsistent rates under this heading (${[...distinctRates].join('/')}%), cannot verify a 4-digit code confidently` };
    }

    return { rate: rates[0].igstRate, confident: true, reason: `inferred from ${rates.length} sub-codes under this heading` };
}

export const hsnRateValidationRule: Rule = {
    code: "hsn_rate_check",

    evaluate(invoice: InvoiceForValidation): RuleResult {
        const issues: string[] = [];
        let anyUnverified = false;

        for (const item of invoice.lineItems ?? []) {
            const rawCode = item.hsnCode;
            if (!rawCode) {
                issues.push(`Line item "${item.description ?? 'unknown'}": no HSN/SAC code extracted`);
                anyUnverified = true;
                continue;
            }

            const code = rawCode.replace(/[^0-9]/g, '');

            if (isServiceCode(code)) {
                const sacEntry = hsn.getSacByCode(code);
                if (!sacEntry) {
                    issues.push(`SAC ${code}: code not found in reference data`);
                    anyUnverified = true;
                } else {
                    // no rate data available for SAC in this package — existence-only check
                    issues.push(`SAC ${code}: code exists, rate not independently verifiable`);
                    anyUnverified = true;
                }
                continue;
            }

            const result = lookupHsnRate(code);
            if (!result.confident) {
                issues.push(`HSN ${code}: ${result.reason}`);
                anyUnverified = true;
                continue;
            }

            const chargedRate = toNumber(item.taxRate);

            if (chargedRate === null) {
                issues.push(`HSN ${code}: taxRate on this line item is missing or unparseable`);
                anyUnverified = true;
                continue;
            }

            if (chargedRate !== result.rate) {
                issues.push(`HSN ${code}: charged ${chargedRate}%, expected ${result.rate}% (${result.reason})`);
            }
        }

        // decide deliberately: does "unverified" fail the rule, or pass with a warning severity?
        const hasHardMismatch = issues.some(i => i.includes('charged'));
        const passed = !hasHardMismatch;
        const uniqueIssues = [...new Set(issues)];

        return {
            ruleCode: this.code,
            passed,
            severity: hasHardMismatch ? 'ERROR' : (anyUnverified ? 'WARNING' : 'ERROR'),
            message: uniqueIssues.length > 0 ? uniqueIssues.join('; ') : 'All HSN/SAC codes and rates verified'
        };
    }
}
