import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { validateInvoice } from '../api/validation'
import { ApiError } from '../api/client'
import { InvoiceHeaderForm } from '../components/review/InvoiceHeaderForm'
import { LineItemsTable } from '../components/review/LineItemsTable'
import { ValidationResultsList } from '../components/review/ValidationResultsList'
import { ComplianceSummaryCard } from '../components/review/ComplianceSummaryCard'
import { checkGeneratedSummary, getInvoiceById } from '../api/invoices'

export function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [checking, setChecking] = useState<boolean>(false)


  useEffect(() => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    getInvoiceById(id)
      .then(setInvoice)
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load invoice')
      })
      .finally(() => setLoading(false))
  }, [id])

  console.log(invoice);



  async function runValidation() {
    if (!id) return
    setValidating(true)
    setValidationError(null)
    try {
      const response = await validateInvoice(id, invoice)
      setInvoice((prev: any) =>
        prev ? { ...prev, validationResults: response.validationResults } : prev
      )
    } catch (err) {
      setValidationError(err instanceof ApiError ? err.message : 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  async function checkSummary() {
    if (!id) return
    setChecking(true)
    try {
      const response: any = await checkGeneratedSummary(id)

      setInvoice((prev: any) =>
        prev
          ? {
            ...prev,
            summary: response.summary,
            summaryStatus: response.summaryStatus
          }
          : prev
      )

    } catch (err) {
      setValidationError(err instanceof ApiError ? err.message : 'summary generation failed')
    }

  }

  if (loading) {
    return <div className="page"><p className="muted">Loading invoice…</p></div>
  }

  if (loadError || !invoice) {
    return (
      <div className="page">
        <h1>Invoice not found</h1>
        <p className="muted">
          {loadError ?? 'This invoice could not be loaded.'} <Link to="/invoices">Back to invoices</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{invoice.vendorName}</p>
          <h1>Review invoice</h1>
          <p className="muted">
            Status: <strong>{invoice.extractionStatus}</strong>
          </p>
        </div>
        <Link to="/invoices" className="btn btn-ghost">Back to invoices</Link>
      </header>

      {invoice.extractionStatus === 'NEEDS_CORRECTION' ? (
        <div className="banner banner-warn">
          Extraction needs correction — review and fix fields below before relying on this invoice.
        </div>
      ) : null}

      <InvoiceHeaderForm value={invoice} readOnly={true} />
      <LineItemsTable items={invoice.lineItems ?? []} />
      <ValidationResultsList
        results={invoice.validationResults}
        loading={validating}
        error={validationError}
        onRun={runValidation}
      />
      {invoice.validationResults.length > 0 && <ComplianceSummaryCard summary={invoice.summary} checking={checking} onCheckSummary={checkSummary} />}
    </div>
  )
}