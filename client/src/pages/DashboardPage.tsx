import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { invoices as fetchInvoices } from '../api/invoices'
import { StatusSummary } from '../components/dashboard/StatusSummary'

export function DashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const response:any = await fetchInvoices()
        setInvoices(response.data)
      } catch (error) {
        setError('Could not load invoices')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])
  console.log(invoices);


  const counts = invoices.reduce(
    (acc, inv) => {
      const key = inv.extractionStatus ?? 'UNKNOWN'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of your uploaded invoices.</p>
        </div>
        <Link to="/invoices/upload" className="btn btn-primary">
          Upload invoice
        </Link>
      </header>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : (
        <>
          <StatusSummary counts={counts} total={invoices.length} />

          <section className="panel">
            <h2>Recent invoices</h2>
            {invoices.length === 0 ? (
              <p className="muted">
                No uploads yet. <Link to="/invoices/upload">Upload an invoice</Link> to get started.
              </p>
            ) : (
              <ul className="invoice-list">
                {invoices.slice(0, 8).map((inv) => (
                  <li key={inv.id}>
                    <Link to={`/invoices/${inv.id}/review`}>
                      <strong>{inv.invoiceNumber || 'No invoice number'}</strong>
                      <span className="muted">
                        {inv.vendorName || 'Unknown vendor'} · {inv.extractionStatus ?? 'UNKNOWN'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}