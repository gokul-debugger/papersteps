import { useRef, useState } from 'react'
import { FilePlus2, LockKeyhole, Sparkles, Upload } from 'lucide-react'

interface UploadPanelProps {
  onFile: (file: File) => void
  onSample: () => void
  isLoading: boolean
}

export function UploadPanel({ onFile, onSample, isLoading }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <main className="intake-layout">
      <aside className="intake-sidebar">
        <span className="eyebrow">Private document workspace</span>
        <h1>Complete a form with fewer surprises.</h1>
        <p>
          Open a fillable PDF, review each field, and export the completed document from this browser.
        </p>
        <div className="trust-list">
          <div><LockKeyhole size={18} /><span><strong>Local by default</strong>Your file is not uploaded.</span></div>
          <div><FilePlus2 size={18} /><span><strong>PDF-safe output</strong>The source document remains unchanged.</span></div>
        </div>
      </aside>

      <section className="intake-main" aria-labelledby="upload-title">
        <div
          className={`drop-zone${isDragging ? ' drop-zone--active' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            const file = event.dataTransfer.files[0]
            if (file) onFile(file)
          }}
        >
          <span className="drop-zone__icon"><Upload size={25} /></span>
          <div>
            <h2 id="upload-title">Choose a fillable PDF</h2>
            <p>PDF only, up to 20 MB</p>
          </div>
          <button className="primary-button" onClick={() => inputRef.current?.click()} disabled={isLoading}>
            <Upload size={17} /> Open PDF
          </button>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onFile(file)
              event.currentTarget.value = ''
            }}
          />
        </div>

        <div className="sample-row">
          <div>
            <span className="sample-icon"><Sparkles size={18} /></span>
            <span><strong>No form nearby?</strong> Open a safe sample with eight fields.</span>
          </div>
          <button className="secondary-button" onClick={onSample} disabled={isLoading}>
            Try sample
          </button>
        </div>

        <p className="format-note">
          Scanned documents can be viewed, but this version only guides PDFs that already contain interactive fields.
        </p>
      </section>
    </main>
  )
}
