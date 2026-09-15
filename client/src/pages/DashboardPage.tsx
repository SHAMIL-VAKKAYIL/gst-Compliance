import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { StatusSummary } from '../components/dashboard/StatusSummary'
import { listInvoices, statusCounts } from '../lib/invoiceStore'

export function DashboardPage() {
  const invoices = useMemo(() => listInvoices(), [])
  const counts = statusCounts(invoices)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Session overview of recent extractions invoices. Server-side listing is not available yet.
          </p>
        </div>
        <Link to="/invoices/upload" className="btn btn-primary">
          Upload invoice
        </Link>
      </header>

      <StatusSummary counts={counts} total={invoices.length} />

      <section className="panel">
        <h2>Recent in this session</h2>
        {invoices.length === 0 ? (
          <p className="muted">
            No uploads yet. <Link to="/invoices/upload">Upload an invoice</Link> to get started.
          </p>
        ) : (
          <ul className="invoice-list">
            {invoices.slice(0, 8).map((inv) => (
              <li key={inv.localId}>
                <Link to={`/invoices/${inv.localId}`}>
                  <strong>{inv.data.invoiceNumber || inv.fileName}</strong>
                  <span className="muted">
                    {inv.data.vendorName || 'Unknown vendor'} · {inv.extractionStatus ?? 'UNKNOWN'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
