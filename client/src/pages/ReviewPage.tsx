import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getInvoice, updateInvoice } from '../lib/invoiceStore'
import { validateInvoice } from '../api/validation'
import { ApiError } from '../api/client'
import { InvoiceHeaderForm } from '../components/review/InvoiceHeaderForm'
import { LineItemsTable } from '../components/review/LineItemsTable'
import { FieldValidityBadges } from '../components/review/FieldValidityBadges'
import { ValidationResultsList } from '../components/review/ValidationResultsList'
import { ComplianceSummaryCard } from '../components/review/ComplianceSummaryCard'
import type { ExtractedInvoiceData, RuleResult } from '../types'

export function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const stored = useMemo(() => (id ? getInvoice(id) : undefined), [id])
  const [data, setData] = useState<ExtractedInvoiceData | null>(stored?.data ?? null)
  const [ruleResults, setRuleResults] = useState<RuleResult[] | undefined>(stored?.ruleResults)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!stored || !data || !id) {
    return (
      <div className="page">
        <h1>Invoice not found</h1>
        <p className="muted">
          This review session may have expired. <Link to="/invoices/upload">Upload again</Link>.
        </p>
      </div>
    )
  }

  function handleChange(next: ExtractedInvoiceData) {
    setData(next)
    updateInvoice(id!, { data: next })
  }

  async function runValidation() {
    setValidating(true)
    setValidationError(null)
    try {
      const response = await validateInvoice(stored!.id, {
        gstin: data!.gstin,
        invoiceNumber: data!.invoiceNumber || null,
        vendorName: data!.vendorName || null,
        invoiceDate: data!.invoiceDate,
        amount: data!.totalAmount ?? data!.invoiceAmount ?? null,
        lineItems: data!.lineItems,
      })
      setRuleResults(response.validationResults)
      updateInvoice(id!, { ruleResults: response.validationResults })
    } catch (err) {
      if (err instanceof ApiError) {
        setValidationError(err.message)
      } else if (err instanceof TypeError) {
        setValidationError('Could not reach validation API. Is it mounted on the server?')
      } else {
        setValidationError(err instanceof Error ? err.message : 'Validation failed')
      }
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{stored.fileName}</p>
          <h1>Review extraction</h1>
          <p className="muted">
            Status: <strong>{stored.extractionStatus ?? 'UNKNOWN'}</strong>
            {stored.confidence != null ? ` · Confidence ${(stored.confidence * 100).toFixed(0)}%` : ''}
          </p>
        </div>
        <Link to="/invoices/upload" className="btn btn-ghost">
          Upload another
        </Link>
      </header>

      {stored.extractionStatus === 'NEEDS_CORRECTION' ? (
        <div className="banner banner-warn">
          Extraction needs correction — review and fix fields below before relying on this invoice.
        </div>
      ) : null}

      <FieldValidityBadges metrics={stored.fieldValidation} />
      <InvoiceHeaderForm
        value={data}
        onChange={handleChange}
        fieldValidation={stored.fieldValidation}
      />
      <LineItemsTable items={data.lineItems ?? []} />
      <ValidationResultsList
        results={ruleResults}
        loading={validating}
        error={validationError}
        onRun={runValidation}
      />
      <ComplianceSummaryCard summary={stored.summary} />
    </div>
  )
}
