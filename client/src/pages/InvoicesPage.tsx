import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { listInvoices } from '../lib/invoiceStore'

export function InvoicesPage() {
  const invoices = useMemo(() => listInvoices(), [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="muted">
            Local session list only — a server GET endpoint for invoices is not available yet.
          </p>
        </div>
        <Link to="/invoices/upload" className="btn btn-primary">
          Upload
        </Link>
      </header>

      <section className="panel">
        {invoices.length === 0 ? (
          <p className="muted">No invoices in this browser session.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Vendor</th>
                  <th>GSTIN</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.localId}>
                    <td>{inv.data.invoiceNumber || '—'}</td>
                    <td>{inv.data.vendorName || '—'}</td>
                    <td>{inv.data.gstin || '—'}</td>
                    <td>
                      <span className={`badge status-${inv.extractionStatus ?? 'UNKNOWN'}`}>
                        {inv.extractionStatus ?? 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{new Date(inv.uploadedAt).toLocaleString()}</td>
                    <td>
                      <Link to={`/invoices/${inv.localId}`}>Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
