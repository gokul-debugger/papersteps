import type { FormFieldDefinition, FormValue } from '../types'

const FIELD_HELPERS: Array<[RegExp, string]> = [
  [/e-?mail/i, 'Use an address you can access. Example: name@example.com'],
  [/phone|mobile|telephone/i, 'Include the country or area code when the form requires it.'],
  [/birth|date|dob/i, 'Check the form for its required date format before continuing.'],
  [/address/i, 'Enter the address exactly as it should appear on the completed document.'],
  [/name/i, 'Enter the name exactly as it appears on the supporting document.'],
  [/signature/i, 'This field may need to be signed after the PDF is downloaded.'],
]

export function humanizeFieldName(name: string): string {
  const leaf = name.split('.').at(-1) ?? name
  const spaced = leaf
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()

  if (!spaced) return 'Unnamed field'
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function getFieldHelper(name: string, kind: FormFieldDefinition['kind']): string {
  const match = FIELD_HELPERS.find(([pattern]) => pattern.test(name))
  if (match) return match[1]

  if (kind === 'checkbox') return 'Select this only when the statement applies.'
  if (kind === 'radio' || kind === 'dropdown' || kind === 'option-list') {
    return 'Choose the option that matches the source document.'
  }
  return 'Review the original form label before entering this value.'
}

export function isFieldComplete(field: FormFieldDefinition, value: FormValue | undefined): boolean {
  if (field.readOnly || field.kind === 'unsupported') return true
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value?.trim())
}

export function getRequiredIssues(
  fields: FormFieldDefinition[],
  values: Record<string, FormValue>,
): FormFieldDefinition[] {
  return fields.filter((field) => field.required && !isFieldComplete(field, values[field.id]))
}

export function groupNameForField(field: FormFieldDefinition): string {
  const segments = field.name.split('.')
  if (segments.length < 2) return 'Form fields'
  return humanizeFieldName(segments[0])
}
