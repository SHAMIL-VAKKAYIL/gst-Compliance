# GST Invoice Compliance Platform

A tool that extracts data from Indian GST invoices (PDF or image) and runs it through a set of compliance checks, catching errors a human reviewer would otherwise have to spot manually: bad GSTIN checksums, wrong tax type for the transaction, mismatched HSN/SAC rates, and more.

**Live demo:** [add your deployed link here]

## What it does

1. Upload an invoice (PDF, JPG, PNG).
2. Gemini extracts structured data: seller/buyer GSTIN, invoice number, date, line items, tax amounts.
3. Nine validation rules run against the extracted data.
4. An LLM-generated plain-language summary explains what passed, failed, or couldn't be verified.

## Validation rules

| Rule | What it checks |
|---|---|
| `seller_gstin_format_valid` / `buyer_gstin_format_valid` | GSTIN matches the required 15-character pattern |
| `seller_gstin_checksum_valid` / `buyer_gstin_checksum_valid` | MOD-36 checksum on the GSTIN — catches mistyped or fabricated numbers that happen to look right |
| `line_items_sum_matches_total` | Line item totals reconcile with the invoice grand total |
| `per_line_tax_calculation_correct` | Tax charged per line matches taxable value × rate |
| `hsn_rate_check` | Tax rate charged matches the official GST rate for that HSN/SAC code, checked against [hsn-code-package](https://www.npmjs.com/package/hsn-code-package) |
| `future_date_check` | Invoice isn't dated in the future |
| `state_tax_type_consistent` | CGST+SGST charged for same-state transactions, IGST for cross-state — derived from seller/buyer GSTIN state codes |

Buyer-specific rules pass cleanly (not fail) when there's no buyer GSTIN, since most invoices are B2C and that's expected, not an error. Rules that can't be conclusively verified (an SAC code has no published rate data, for instance) return a `WARNING`, distinct from a confirmed `ERROR`, so "we couldn't check this" is never displayed the same way as "this is correct."

## Example results

**Real invoice, no line items (municipality receipt):** Most checks pass or correctly report "not applicable." No false positives from a legitimately simple document.

**B2B invoice, correct tax type:** All nine rules pass, including an HSN rate check against the reference dataset and a state-consistency check confirming CGST+SGST is right for a same-state transaction.

**B2B invoice, wrong tax type:** Seller in Kerala, buyer in Maharashtra, but the invoice charged CGST+SGST instead of IGST. `state_tax_type_consistent` catches it:
> Seller (state 32) and buyer (state 27) are in different states, so IGST applies, but CGST/SGST was charged.

Every other rule passes on the same invoice — this demonstrates the checks are independent, not one big pass/fail gate.

## Architecture

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend:** React, Vite
- **Extraction:** Gemini, prompted to extract structured fields and copy identifiers (GSTIN, PAN, invoice number) verbatim rather than "correcting" them
- **Validation:** a set of independent rule modules, each returning `{ ruleCode, passed, severity, message }`; the service layer composes them and gates only where one rule's output is meaningless without another (e.g. checksum is skipped if format already failed)

### Design notes

- **Ownership is enforced at the query layer.** Every invoice lookup filters on the authenticated user's ID, not just the invoice ID, so one user can't read or validate another user's data by guessing a URL.
- **Revalidation replaces prior results** in a single transaction, rather than accumulating duplicate rows across runs.
- **Numeric fields are explicitly coerced** before comparison. Prisma returns `Decimal` fields as `Decimal.js` instances, not plain numbers — comparing them directly with `!==` silently fails even when the values match, so every rule normalizes with a shared `toNumber()` helper first.

## How I'd scale this

The current version runs extraction and summary generation synchronously against the request, which is correct for the load this gets today. If this needed to handle production traffic:

- Move extraction and summary generation onto a Redis + BullMQ queue with a horizontal worker pool.
- Start the timeout clock at enqueue time, not at worker pickup, so a job stuck in the queue is still caught.
- Two failure-detection paths: a worker catches its own API failures after exhausting backoff, and a periodic sweep catches jobs where the worker crashed entirely and never wrote a result.
- Client polls a history endpoint rather than using WebSockets — pub/sub coordination across stateless API instances isn't worth it at this scale.
- Multiple API instances behind a load balancer, justified by availability/failover rather than throughput.

This isn't built into the current version deliberately — it would add operational complexity the project doesn't need yet.

## Known limitations

- HSN/SAC rate data is chapter-level (per the reference package), not verified against every individual government notification. Treated as a portfolio-appropriate approximation, not a source of legal/filing truth.
- SAC (services) codes are checked for existence only — no public rate dataset was available to verify the rate charged against the code.
- Buyer GSTIN extraction has less test coverage than seller GSTIN, since most real invoices used during development were B2C.

## Running locally

```bash
# backend
cd server
pnpm install
pnpm prisma migrate dev
pnpm dev

# frontend
cd client
pnpm install
pnpm dev
```

Requires a `.env` with `DATABASE_URL` and a Gemini API key.