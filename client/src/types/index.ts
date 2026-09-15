export type ExtractionStatus = 'COMPLETE' | 'FAILED' | 'NEEDS_CORRECTION' | null

export type FailureReason =
  | 'CORRUPTED_FILE'
  | 'UNREADABLE_SCAN'
  | 'MISSING_REQUIRED_FIELDS'
  | string

export interface LineItem {
  description: string | null
  hsnCode: string | null
  quantity: number | null
  unitPrice: number | null
  taxableValue: number | null
  taxRate: number | null
  igstAmount: number | null
  cgstAmount: number | null
  sgstAmount: number | null
  lineTotal: number | null
}

export interface ValidationMetrics {
  invoiceNumberValid: boolean
  dateValid: boolean
  vendorValid: boolean
  gstnValid: boolean
  totalValid: boolean
  validFieldCount: number
}

export interface ExtractedInvoiceData {
  id?: string
  invoiceNumber: string
  vendorName: string
  gstin: string
  invoiceDate: string | null
  invoiceAmount: number
  tax: number
  totalAmount: number
  extractionStatus?: ExtractionStatus
  lineItems: LineItem[]
}

export interface ExtractionResult {
  success: boolean
  data?: ExtractedInvoiceData
  extractionStatus?: ExtractionStatus
  failureReason?: FailureReason | null
  error?: string
  confidence?: number
  validationResults?: ValidationMetrics
}

export interface RuleResult {
  ruleCode: string
  passed: boolean
  severity: 'ERROR' | 'WARNING'
  message: string
}

export interface ValidationResponse {
  invoiceId: string
  validationResults: RuleResult[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  userId: string
  isNewAccount?: boolean
}

export interface StoredInvoice {
  localId: string
  id: string
  fileName: string
  uploadedAt: string
  extractionStatus: ExtractionStatus
  data: ExtractedInvoiceData
  confidence?: number
  fieldValidation?: ValidationMetrics
  ruleResults?: RuleResult[]
  summary?: string | null
}
