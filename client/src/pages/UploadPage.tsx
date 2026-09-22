import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractInvoice } from '../api/invoices'
import { ApiError } from '../api/client'
import { InvoiceDropzone } from '../components/upload/InvoiceDropzone'
import { UploadProgress } from '../components/upload/UploadProgress'
import { ExtractionErrorBanner } from '../components/upload/ExtractionErrorBanner'
import type { ExtractionResult } from '../types'

export function UploadPage() {
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorResult, setErrorResult] = useState<ExtractionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setLoading(true)
    setErrorResult(null)
    setErrorMessage(null)

    try {
      const result = await extractInvoice(file)

      if (!result.success || !result.data) {
        setErrorResult(result)
        return
      }

      // Real invoice now exists in the DB — go review it there, no local copy needed
      navigate(`/invoices/${result.data.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        setErrorResult(err.body as ExtractionResult)
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Upload failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Upload invoice</h1>
          <p className="muted">
            {/* Sends the file to <code>POST /api/invoice/v1/extraction</code> for OCR/LLM extraction. */}
          </p>
        </div>
      </header>

      <InvoiceDropzone onFileSelected={handleFile} disabled={loading} />
      <UploadProgress fileName={fileName} active={loading} />

      {errorResult ? (
        <ExtractionErrorBanner
          error={errorResult.error ?? 'Extraction failed'}
          failureReason={errorResult.failureReason}
          extractionStatus={errorResult.extractionStatus}
        />
      ) : null}
      {errorMessage ? <ExtractionErrorBanner error={errorMessage} /> : null}
    </div>
  )
}