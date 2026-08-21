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