import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileJson,
  FileText,
  ListChecks,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Save,
  SquarePen,
  X,
} from 'lucide-react'
import { getRequiredIssues, groupNameForField, isFieldComplete } from '../lib/fields'
import type { FormFieldDefinition, FormValue, LoadedDocument } from '../types'
import { FieldEditor } from './FieldEditor'
import { PdfPreview } from './PdfPreview'

interface DocumentWorkspaceProps {
  document: LoadedDocument
  values: Record<string, FormValue>
  previewUrl: string | null
  previewDirty: boolean
  lastSavedAt: string | null
  isExporting: boolean
  onValueChange: (fieldId: string, value: FormValue) => void
  onRefreshPreview: () => void
  onDownloadPdf: () => void
  onExportJson: () => void
  onDiscardDraft: () => void
  onCloseDocument: () => void
}

type MobilePanel = 'fields' | 'document' | 'complete'

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatSavedTime(iso: string | null): string {
  if (!iso) return 'Draft starts after your first edit'
  return `Saved locally at ${new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function DocumentWorkspace({
  document,
  values,
  previewUrl,
  previewDirty,
  lastSavedAt,
  isExporting,
  onValueChange,
  onRefreshPreview,
  onDownloadPdf,
  onExportJson,
  onDiscardDraft,
  onCloseDocument,
}: DocumentWorkspaceProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('fields')
  const [menuOpen, setMenuOpen] = useState(false)
  const fields = document.fields
  const activeField = fields[activeIndex]
  const requiredIssues = useMemo(() => getRequiredIssues(fields, values), [fields, values])
  const completedCount = fields.filter((field) => isFieldComplete(field, values[field.id])).length
  const completion = fields.length ? Math.round((completedCount / fields.length) * 100) : 0

  const groups = useMemo(() => {
    const grouped = new Map<string, Array<{ field: FormFieldDefinition; index: number }>>()
    fields.forEach((field, index) => {
      const name = groupNameForField(field)
      const group = grouped.get(name) ?? []
      group.push({ field, index })
      grouped.set(name, group)
    })
    return grouped
  }, [fields])

  const selectField = (index: number) => {
    setActiveIndex(index)
    setMobilePanel('complete')
  }

  return (
    <main className="workspace">
      <div className="document-bar">
        <div className="document-identity">
          <span className="document-icon"><FileText size={19} /></span>
          <span>
            <strong>{document.title}</strong>
            <small>{document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'} · {formatFileSize(document.fileSize)}</small>
          </span>
        </div>
        <div className="document-actions">
          <button className="secondary-button" onClick={onRefreshPreview} disabled={!previewDirty || isExporting}>
            <RefreshCw size={16} className={isExporting ? 'spin' : ''} />
            {previewDirty ? 'Update preview' : 'Preview current'}
          </button>
          <button className="primary-button" onClick={onDownloadPdf} disabled={isExporting}>
            <Download size={16} /> Download PDF
          </button>
          <div className="menu-wrap">
            <button className="icon-button icon-button--bordered" onClick={() => setMenuOpen((open) => !open)} title="More document actions">
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="action-menu">
                <button onClick={() => { onExportJson(); setMenuOpen(false) }}><FileJson size={16} /> Export field data</button>
                <button onClick={() => { onDiscardDraft(); setMenuOpen(false) }}><RotateCcw size={16} /> Clear local draft</button>
                <button onClick={onCloseDocument}><X size={16} /> Close document</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mobile-panel-tabs" role="tablist" aria-label="Document workspace panels">
        <button className={mobilePanel === 'fields' ? 'active' : ''} onClick={() => setMobilePanel('fields')}><ListChecks size={16} /> Fields</button>
        <button className={mobilePanel === 'document' ? 'active' : ''} onClick={() => setMobilePanel('document')}><Eye size={16} /> Document</button>
        <button className={mobilePanel === 'complete' ? 'active' : ''} onClick={() => setMobilePanel('complete')}><SquarePen size={16} /> Edit</button>
      </div>

      <div className="workspace-grid">
        <aside className={`field-navigation mobile-panel ${mobilePanel === 'fields' ? 'mobile-panel--active' : ''}`}>
          <div className="progress-block">
            <div><span>Completion</span><strong>{completion}%</strong></div>
            <div className="progress-track" aria-label={`${completion}% complete`}><span style={{ width: `${completion}%` }} /></div>
            <small>{completedCount} of {fields.length} fields answered</small>
          </div>

          {fields.length === 0 ? (
            <div className="empty-fields">
              <FileText size={22} />
              <strong>No fillable fields found</strong>
              <p>This document can still be reviewed in the document panel.</p>
            </div>
          ) : (
            <div className="field-groups">
              {Array.from(groups.entries()).map(([groupName, groupFields]) => (
                <section key={groupName}>
                  <h2>{groupName}</h2>
                  {groupFields.map(({ field, index }) => {
                    const complete = isFieldComplete(field, values[field.id])
                    return (
                      <button
                        key={field.id}
                        className={`field-nav-item${index === activeIndex ? ' field-nav-item--active' : ''}`}
                        onClick={() => selectField(index)}
                      >
                        <span className={`field-status${complete ? ' field-status--complete' : ''}`}>
                          {complete ? <Check size={13} /> : index + 1}
                        </span>
                        <span><strong>{field.label}</strong><small>{field.required ? 'Required' : 'Optional'}</small></span>
                      </button>
                    )
                  })}
                </section>
              ))}
            </div>
          )}
        </aside>

        <section className={`document-preview mobile-panel ${mobilePanel === 'document' ? 'mobile-panel--active' : ''}`}>
          <div className="preview-status">
            <span>{previewDirty ? 'Preview has unapplied edits' : 'Preview matches your draft'}</span>
            {previewDirty && <button onClick={onRefreshPreview}>Update now</button>}
          </div>
          {previewUrl ? (
            <PdfPreview url={previewUrl} title={document.title} />
          ) : (
            <div className="preview-unavailable">Document preview unavailable</div>
          )}
        </section>

        <aside className={`editor-panel mobile-panel ${mobilePanel === 'complete' ? 'mobile-panel--active' : ''}`}>
          {activeField ? (
            <FieldEditor
              field={activeField}
              value={values[activeField.id]}
              index={activeIndex}
              total={fields.length}
              onChange={(value) => onValueChange(activeField.id, value)}
              onPrevious={() => setActiveIndex((current) => Math.max(0, current - 1))}
              onNext={() => setActiveIndex((current) => Math.min(fields.length - 1, current + 1))}
            />
          ) : (
            <div className="completion-panel">
              <CheckCircle2 size={30} />
              <h2>Document review</h2>
              <p>No interactive fields were found. Review the original PDF before downloading it.</p>
            </div>
          )}

          <div className="draft-status"><Save size={14} /> {formatSavedTime(lastSavedAt)}</div>

          <div className={`completion-summary${requiredIssues.length === 0 ? ' completion-summary--ready' : ''}`}>
            <div>
              {requiredIssues.length === 0 ? <CheckCircle2 size={20} /> : <ChevronDown size={20} />}
              <span>
                <strong>{requiredIssues.length === 0 ? 'Required fields complete' : `${requiredIssues.length} required left`}</strong>
                <small>{requiredIssues.length === 0 ? 'Ready for your final review' : 'Complete these before exporting'}</small>
              </span>
            </div>
            {requiredIssues.length > 0 && (
              <div className="required-issues">
                {requiredIssues.map((field) => (
                  <button key={field.id} onClick={() => selectField(fields.indexOf(field))}>{field.label}</button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
