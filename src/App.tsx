import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, X } from 'lucide-react'
import { AppHeader } from './components/AppHeader'
import { DocumentWorkspace } from './components/DocumentWorkspace'
import { UploadPanel } from './components/UploadPanel'
import { loadDraft, removeDraft, saveDraft } from './lib/storage'
import type { FormValue, LoadedDocument } from './types'
import './App.css'

type Notice = { kind: 'success' | 'error'; message: string } | null

function makeObjectUrl(bytes: Uint8Array): string {
  return URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }))
}

function App() {
  const [document, setDocument] = useState<LoadedDocument | null>(null)
  const [values, setValues] = useState<Record<string, FormValue>>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDirty, setPreviewDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const previewUrlRef = useRef<string | null>(null)

  const replacePreviewUrl = useCallback((nextUrl: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (!document) return
    const timeout = window.setTimeout(() => {
      const draft = saveDraft(document.fingerprint, document.fileName, values)
      setLastSavedAt(draft.updatedAt)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [document, values])

  const openBytes = useCallback(
    async (bytes: Uint8Array, fileName: string, fileSize: number) => {
      setIsLoading(true)
      setNotice(null)
      try {
        const { inspectPdf } = await import('./lib/pdf')
        const parsed = await inspectPdf(bytes, fileName, fileSize)
        const draft = loadDraft(parsed.fingerprint)
        const nextValues = draft ? { ...parsed.initialValues, ...draft.values } : parsed.initialValues

        setDocument(parsed)
        setValues(nextValues)
        setPreviewDirty(Boolean(draft))
        setLastSavedAt(draft?.updatedAt ?? null)
        replacePreviewUrl(makeObjectUrl(bytes))

        if (draft) {
          setNotice({ kind: 'success', message: 'Your saved draft was restored on this device.' })
        } else if (parsed.fields.length === 0) {
          setNotice({
            kind: 'error',
            message: 'This PDF has no interactive fields. You can review it, but guided completion is unavailable.',
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The PDF could not be opened.'
        setNotice({ kind: 'error', message })
      } finally {
        setIsLoading(false)
      }
    },
    [replacePreviewUrl],
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setNotice({ kind: 'error', message: 'Choose a PDF file.' })
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        setNotice({ kind: 'error', message: 'Choose a PDF smaller than 20 MB.' })
        return
      }
      const bytes = new Uint8Array(await file.arrayBuffer())
      await openBytes(bytes, file.name, file.size)
    },
    [openBytes],
  )

  const handleSample = useCallback(async () => {
    setIsLoading(true)
    try {
      const { createSamplePdf } = await import('./lib/pdf')
      const bytes = await createSamplePdf()
      await openBytes(bytes, 'papersteps-sample.pdf', bytes.byteLength)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The sample form could not be created.'
      setNotice({ kind: 'error', message })
      setIsLoading(false)
    }
  }, [openBytes])

  const handleValueChange = useCallback((fieldId: string, value: FormValue) => {
    setValues((current) => ({ ...current, [fieldId]: value }))
    setPreviewDirty(true)
  }, [])

  const buildFilledPdf = useCallback(async () => {
    if (!document) throw new Error('No PDF is open.')
    const { fillPdf } = await import('./lib/pdf')
    return fillPdf(document.bytes, document.fields, values)
  }, [document, values])

  const handleRefreshPreview = useCallback(async () => {
    setIsExporting(true)
    try {
      const bytes = await buildFilledPdf()
      replacePreviewUrl(makeObjectUrl(bytes))
      setPreviewDirty(false)
      setNotice({ kind: 'success', message: 'Document preview updated.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The preview could not be updated.'
      setNotice({ kind: 'error', message })
    } finally {
      setIsExporting(false)
    }
  }, [buildFilledPdf, replacePreviewUrl])

  const handleDownloadPdf = useCallback(async () => {
    if (!document) return
    setIsExporting(true)
    try {
      const bytes = await buildFilledPdf()
      const url = makeObjectUrl(bytes)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = document.fileName.replace(/\.pdf$/i, '') + '-completed.pdf'
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice({ kind: 'success', message: 'Completed PDF downloaded.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The completed PDF could not be created.'
      setNotice({ kind: 'error', message })
    } finally {
      setIsExporting(false)
    }
  }, [buildFilledPdf, document])

  const handleExportJson = useCallback(() => {
    if (!document) return
    const exportData = {
      schemaVersion: 1,
      document: {
        fileName: document.fileName,
        fingerprint: document.fingerprint,
        title: document.title,
      },
      exportedAt: new Date().toISOString(),
      fields: document.fields.map((field) => ({
        name: field.name,
        label: field.label,
        kind: field.kind,
        required: field.required,
        value: values[field.id],
      })),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
    )
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = document.fileName.replace(/\.pdf$/i, '') + '-data.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [document, values])

  const handleCloseDocument = useCallback(() => {
    setDocument(null)
    setValues({})
    setLastSavedAt(null)
    setPreviewDirty(false)
    replacePreviewUrl(null)
  }, [replacePreviewUrl])

  const handleDiscardDraft = useCallback(() => {
    if (!document) return
    removeDraft(document.fingerprint)
    setValues(document.initialValues)
    setLastSavedAt(null)
    setPreviewDirty(true)
    setNotice({ kind: 'success', message: 'Local draft cleared.' })
  }, [document])

  const statusLabel = useMemo(() => {
    if (isLoading) return 'Opening PDF'
    if (isExporting) return 'Preparing document'
    return 'Files stay on this device'
  }, [isExporting, isLoading])

  return (
    <div className="app-shell">
      <AppHeader statusLabel={statusLabel} />

      {notice && (
        <div className={`notice notice--${notice.kind}`} role="status">
          {notice.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
          <button className="icon-button" onClick={() => setNotice(null)} title="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {isLoading && !document ? (
        <main className="loading-view" aria-live="polite">
          <LoaderCircle className="spin" size={30} />
          <h1>Opening your document</h1>
          <p>Reading its fillable fields locally.</p>
        </main>
      ) : document ? (
        <DocumentWorkspace
          document={document}
          values={values}
          previewUrl={previewUrl}
          previewDirty={previewDirty}
          lastSavedAt={lastSavedAt}
          isExporting={isExporting}
          onValueChange={handleValueChange}
          onRefreshPreview={handleRefreshPreview}
          onDownloadPdf={handleDownloadPdf}
          onExportJson={handleExportJson}
          onDiscardDraft={handleDiscardDraft}
          onCloseDocument={handleCloseDocument}
        />
      ) : (
        <UploadPanel onFile={handleFile} onSample={handleSample} isLoading={isLoading} />
      )}

      <footer className="app-footer">
        <span><FileText size={14} /> PaperSteps processes PDFs in your browser.</span>
        <a href="https://www.w3.org/WAI/tutorials/forms/" target="_blank" rel="noreferrer">
          Accessible form guidance
        </a>
      </footer>
    </div>
  )
}

export default App
