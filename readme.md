GST Invoice Compliance Platform 

A full-stack platform for validating GST invoices against Indian tax compliance rules, combining a deterministic rule engine with LLM-powered compliance summaries.

What it does

Extracts structured data from uploaded GST invoices (PDF or scanned images) using OCR/text parsing
Validates invoices against GST rules: GSTIN checksum verification, CGST/SGST/IGST split correctness based on inter/intra-state supply, HSN code presence and format, mandatory field checks
Generates plain-English compliance summaries via the Claude API, using structured JSON prompting so flagged issues render cleanly in the UI
Tracks invoice status and validation history per user

Tech stack

Backend: Node.js, TypeScript, Express
Database: PostgreSQL (raw SQL)
Frontend: React, Vite
LLM: Claude API (Anthropic)
OCR/Extraction: pdf-parse / Tesseract.js
Auth: JWT

gst-compliance-platform/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.types.ts
│   │   │   └── auth.repository.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── invoices.controller.ts
│   │   │   ├── invoices.service.ts
│   │   │   ├── invoices.routes.ts
│   │   │   ├── invoices.types.ts
│   │   │   ├── invoices.repository.ts
│   │   │   ├── extraction.service.ts 
│   │   │   └── parsers/
│   │   │       ├── pdf-parser.ts
│   │   │       └── ocr-parser.ts
│   │   │
│   │   │
│   │   ├── validation/
│   │   │   ├── validation.service.ts       # runs all rules, returns results
│   │   │   ├── validation.types.ts
│   │   │   ├── validation.repository.ts
│   │   │   └── rules/
│   │   │       ├── gstin-checksum.rule.ts
│   │   │       ├── tax-split.rule.ts
│   │   │       ├── hsn-code.rule.ts
│   │   │       └── mandatory-fields.rule.ts
│   │   │
│   │   └── llm-summary/
│   │       ├── llm-summary.service.ts      # Claude API calls, prompt building
│   │       ├── llm-summary.types.ts
│   │       ├── llm-summary.repository.ts
│   │       └── prompts/
│   │           └── compliance-summary.prompt.ts
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error-handler.middleware.ts
│   │   │   └── upload.middleware.ts        # multer config
│   │   ├── database/
│   │   │   ├── db.ts                       # pg pool
│   │   │   └── migrations/
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── async-handler.ts
│   │   └── errors/
│   │       └── app-error.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── constants.ts                    # HSN→rate table, state codes, etc.
│   │
│   ├── app.ts                              # express app setup, mounts routes
│   └── server.ts                           # entry point, starts listener
│
├── tests/
│   └── (mirror src/modules structure)
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md

[text](../../../..)