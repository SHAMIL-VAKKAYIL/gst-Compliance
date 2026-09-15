import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'

const ACCEPTED =
  'application/pdf,image/jpeg,image/png,image/gif,image/bmp,image/webp,image/tiff'
const MAX_BYTES = 10 * 1024 * 1024

interface InvoiceDropzoneProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export function InvoiceDropzone({ onFileSelected, disabled }: InvoiceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const acceptFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      setLocalError(null)
      if (file.size > MAX_BYTES) {
        setLocalError('File must be 10MB or smaller.')
        return
      }
      onFileSelected(file)
    },
    [onFileSelected],
  )

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    acceptFile(e.dataTransfer.files?.[0])
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) inputRef.current?.click()
          }
        }}
      >
        <p className="dropzone-title">Drop invoice PDF or image</p>
        <p className="muted">PDF, JPEG, PNG, GIF, BMP, WEBP, TIFF — max 10MB</p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          hidden
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      {localError ? <p className="form-error">{localError}</p> : null}
    </div>
  )
}
