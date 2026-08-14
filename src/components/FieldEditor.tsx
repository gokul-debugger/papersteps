import { AlertTriangle, Check, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react'
import type { FormFieldDefinition, FormValue } from '../types'

interface FieldEditorProps {
  field: FormFieldDefinition
  value: FormValue | undefined
  index: number
  total: number
  onChange: (value: FormValue) => void
  onPrevious: () => void
  onNext: () => void
}

export function FieldEditor({
  field,
  value,
  index,
  total,
  onChange,
  onPrevious,
  onNext,
}: FieldEditorProps) {
  const inputId = `field-${field.id.replace(/[^a-z0-9]/gi, '-')}`

  const control = (() => {
    if (field.readOnly) {
      return <div className="field-state"><LockKeyhole size={17} /> This field is read-only.</div>
    }
    if (field.kind === 'unsupported') {
      return <div className="field-state field-state--warning"><AlertTriangle size={17} /> Complete this field in a PDF editor.</div>
    }
    if (field.kind === 'checkbox') {
      return (
        <label className="checkbox-control" htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="checkbox-box"><Check size={15} /></span>
          <span>{field.label}</span>
        </label>
      )
    }
    if (field.kind === 'radio') {
      return (
        <fieldset className="option-group">
          <legend className="visually-hidden">{field.label}</legend>
          {field.options.map((option) => (
            <label key={option} className="radio-control">
              <input
                type="radio"
                name={inputId}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      )
    }
    if (field.kind === 'dropdown') {
      const selected = Array.isArray(value) ? value[0] ?? '' : String(value ?? '')
      return (
        <select id={inputId} value={selected} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select an option</option>
          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      )
    }
    if (field.kind === 'option-list') {
      const selected = Array.isArray(value) ? value : value ? [String(value)] : []
      return (
        <fieldset className="option-list">
          <legend className="visually-hidden">{field.label}</legend>
          {field.options.map((option) => (
            <label key={option} className="checkbox-control checkbox-control--compact">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option)
                  onChange(next)
                }}
              />
              <span className="checkbox-box"><Check size={15} /></span>
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      )
    }

    const textValue = typeof value === 'string' ? value : ''
    if (field.multiline) {
      return (
        <textarea
          id={inputId}
          value={textValue}
          maxLength={field.maxLength}
          rows={6}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
        />
      )
    }
    return (
      <input
        id={inputId}
        type="text"
        value={textValue}
        maxLength={field.maxLength}
        onChange={(event) => onChange(event.target.value)}
        autoFocus
      />
    )
  })()

  return (
    <div className="field-editor">
      <div className="field-editor__counter">Field {index + 1} of {total}</div>
      {field.kind !== 'checkbox' && (
        <label className="field-label" htmlFor={inputId}>
          {field.label}
          {field.required && <span className="required-mark">Required</span>}
        </label>
      )}
      {control}
      <p className="field-helper">{field.helper}</p>
      <div className="field-source-name" title="Field identifier in the PDF">PDF field: {field.name}</div>
      <div className="field-editor__actions">
        <button className="icon-text-button" onClick={onPrevious} disabled={index === 0}>
          <ChevronLeft size={17} /> Previous
        </button>
        <button className="primary-button" onClick={onNext} disabled={index === total - 1}>
          Next <ChevronRight size={17} />
        </button>
      </div>
    </div>
  )
}
