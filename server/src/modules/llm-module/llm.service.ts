import { GoogleGenerativeAI } from '@google/generative-ai';

interface LLMLineItem {
  description: string | null;
  hsnCode: string | null;
  quantity: number | null;
  unitPrice: number | null;
  taxableValue: number | null;
  taxRate: number | null;
  igstAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  lineTotal: number | null;
}

interface LLMExtractedData {
  gstin: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  vendorName: string | null;
  amount: number | null;
  lineItems: LLMLineItem[];
}

export class LLMExtractionService {
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

      return {
        gstin: parsed.gstin ?? null,
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
}