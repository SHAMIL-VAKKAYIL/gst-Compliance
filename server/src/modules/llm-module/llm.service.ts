import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../shared/errors/app-error';
import { LLMExtractedData, RuleResult } from './llm.types';



export class LLMService {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async extractAll(rawText: string): Promise<LLMExtractedData | null> {
    if (!rawText || rawText.trim().length === 0) {
      return null;
    }

    const prompt = `Extract the following data from this invoice or receipt text. Respond with ONLY valid JSON, no markdown formatting, no explanation, no code fences.

Top-level fields:

- gstin: the seller's GST identification number (15-character alphanumeric code)
- buyerGstin: the buyer's GSTIN, only present on B2B invoices where the buyer is a registered business.
  Many invoices are B2C and will have no buyer GSTIN — that's expected, use null.
  Only extract it if clearly attributable to the buyer/customer (e.g. under "Bill To"), do not guess.
- invoiceNumber: the invoice or receipt number/ID
- invoiceDate: the date in YYYY-MM-DD format
- vendorName: the business or organization that issued this document (the seller, not the buyer)
- amount: the grand total / final payable amount, tax-inclusive, as a plain number, no currency symbols or commas

Line items: extract every line item row from any itemized table in the document, as an array called "lineItems". For each line item:
- description: the item or service description
- hsnCode: the HSN or SAC code, if present
- quantity: numeric quantity
- unitPrice: price per unit
- taxableValue: the pre-tax value for this line
- taxRate: the GST rate applied, as a plain number (e.g. 18 for 18%)
- igstAmount: IGST amount for this line, if applicable (inter-state transactions)
- cgstAmount: CGST amount for this line, if applicable (intra-state transactions)
- sgstAmount: SGST amount for this line, if applicable (intra-state transactions)
- lineTotal: the tax-inclusive total for this line

If a field cannot be confidently found, use null for that field. If there are no line items, return an empty array. Do not guess or invent values.

Text:
"""
${rawText}
"""`;

    try {
      const model = this.client.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      console.log(parsed);

      return {
        gstin: parsed.gstin ?? null,
        buyerGstin: parsed.buyerGstin ?? null,
        invoiceNumber: parsed.invoiceNumber ?? null,
        invoiceDate: parsed.invoiceDate ?? null,
        vendorName: parsed.vendorName ?? null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      };
    } catch (error) {
      console.error('[LLMExtractionService] extraction failed:', error);
      return null;
    }
  }

  async descriptionGenerate(invoiceId: string, invoice: any, results: RuleResult[]) {
    try {

      const prompt = `You are summarizing GST invoice validation results for a business owner, in plain English, 2-3 sentences.
      Invoice: GSTIN ${invoice.gstin}, vendor ${invoice.vendorName}, amount ${invoice.amount}.
      Validation results:${results.map(r => `- ${r.ruleCode}: ${r.passed ? 'PASSED' : 'FAILED'} — ${r.message}`).join('\n')}
      
      If everything passed, say so plainly and briefly. If there are failures, lead with the most serious one (ERROR severity before WARNING). Do not repeat rule codes verbatim — describe issues in plain business language.`;

      const model = this.client.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: { temperature: 0.3 }, // slight variation is fine for prose, unlike extraction
      })

      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim();
      return { invoiceId, summary }

    } catch (error) {
      console.log(error);
      throw new AppError('failed generate summary')

    }

  }
}

