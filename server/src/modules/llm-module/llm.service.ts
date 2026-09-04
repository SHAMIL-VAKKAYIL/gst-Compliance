import { GoogleGenerativeAI } from '@google/generative-ai';

interface LLMExtractedFields {
  gstin: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  vendorName: string | null;
  amount: number | null;
}

export class LLMExtractionService {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async extractFields(rawText: string): Promise<LLMExtractedFields | null> {
    if (!rawText || rawText.trim().length === 0) {
      return null;
    }

    const prompt = `Extract the following fields from this invoice or receipt text. Respond with ONLY valid JSON, no markdown formatting, no explanation, no code fences.

Fields to extract:
- gstin: the GST identification number (15-character alphanumeric code, format like 22AAAAA0000A1Z5)
- invoiceNumber: the invoice or receipt number/ID
- invoiceDate: the date in YYYY-MM-DD format
- vendorName: the business or organization that issued this document
- amount: the total amount as a plain number, no currency symbols or commas

If a field cannot be confidently found in the text, use null for that field. Do not guess or invent a value.

Text:
"""
${rawText}
"""`;

    try {
      const model = this.client.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json', // forces valid JSON output natively, no markdown-fence issue at all
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
      };
    } catch (error) {
      console.error('[LLMExtractionService] extraction failed:', error);
      return null;
    }
  }
}