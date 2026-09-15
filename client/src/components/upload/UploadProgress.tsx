interface UploadProgressProps {
  fileName: string
  active: boolean
}

export function UploadProgress({ fileName, active }: UploadProgressProps) {
  if (!active) return null

  return (
    <div className="upload-progress" role="status" aria-live="polite">
      <div className="spinner" aria-hidden />
      <div>
        <p className="upload-progress-title">Extracting invoice data…</p>
        <p className="muted">
          Processing <strong>{fileName}</strong>. OCR and LLM extraction can take a minute.
        </p>
      </div>
    </div>
  )
}
