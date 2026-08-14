export type FieldKind =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'option-list'
  | 'unsupported'

export type FormValue = string | boolean | string[]

export interface FormFieldDefinition {
  id: string
  name: string
  label: string
  kind: FieldKind
  required: boolean
  readOnly: boolean
  options: string[]
  multiline: boolean
  maxLength?: number
  helper: string
}

export interface LoadedDocument {
  bytes: Uint8Array
  fingerprint: string
  fileName: string
  fileSize: number
  pageCount: number
  title: string
  fields: FormFieldDefinition[]
  initialValues: Record<string, FormValue>
}

export interface SavedDraft {
  fileName: string
  updatedAt: string
  values: Record<string, FormValue>
}
