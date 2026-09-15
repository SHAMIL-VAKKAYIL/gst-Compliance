import type { LineItem } from '../../types'

interface LineItemsTableProps {
  items: LineItem[]
}

export function LineItemsTable({ items }: LineItemsTableProps) {
  if (!items.length) {
    return (
      <section className="panel">
        <h2>Line items</h2>
        <p className="muted">No line items were extracted.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Line items</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Taxable</th>
              <th>Rate %</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description ?? '—'}</td>
                <td>{item.hsnCode ?? '—'}</td>
                <td>{fmt(item.quantity)}</td>
                <td>{fmt(item.unitPrice)}</td>
                <td>{fmt(item.taxableValue)}</td>
                <td>{fmt(item.taxRate)}</td>
                <td>{fmt(item.cgstAmount)}</td>
                <td>{fmt(item.sgstAmount)}</td>
                <td>{fmt(item.igstAmount)}</td>
                <td>{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function fmt(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
