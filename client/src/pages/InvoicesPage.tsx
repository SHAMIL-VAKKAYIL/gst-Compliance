import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { invoices as fetchInvoicesApi } from '../api/invoices'

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoices() {
      try {
        const response: any = await fetchInvoicesApi()
        if (response && response.success && response.data) {
          setInvoices(response.data)
        } else if (Array.isArray(response)) {
          setInvoices(response)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    loadInvoices()
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="muted">
            All your processed invoices
          </p>
        </div>
        <Link to="/invoices/upload" className="btn btn-primary">
          Upload
        </Link>
      </header>

      <section className="panel">
        {loading ? (
          <p className="muted">Loading invoices...</p>
        ) : error ? (
          <p className="error" style={{ color: 'red' }}>{error}</p>
        ) : invoices.length === 0 ? (
          <p className="muted">No invoices found.</p>
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
                {invoices.map((inv) => {
                  // Handle both nested .data and flat objects depending on API response
                  const invoiceNumber = inv.data?.invoiceNumber || inv.invoiceNumber || '—'
                  const vendorName = inv.data?.vendorName || inv.vendorName || '—'
                  const gstin = inv.data?.gstin || inv.gstin || '—'
                  const status = inv.extractionStatus || 'UNKNOWN'
                  const dateStr = inv.uploadedAt || inv.createdAt || inv.invoiceDate
                  const displayDate = dateStr ? new Date(dateStr).toLocaleString() : '—'
                  const id = inv.id || inv.localId

                  return (
                    <tr key={id}>
                      <td>{invoiceNumber}</td>
                      <td>{vendorName}</td>
                      <td>{gstin}</td>
                      <td>
                        <span className={`badge status-${status}`}>
                          {status}
                        </span>
                      </td>
                      <td>{displayDate}</td>
                      <td>
                        <Link to={`/invoices/${id}`}>Review</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
