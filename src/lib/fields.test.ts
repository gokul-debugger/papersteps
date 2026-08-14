import { describe, expect, it } from 'vitest'
import { getRequiredIssues, humanizeFieldName, isFieldComplete } from './fields'
import type { FormFieldDefinition } from '../types'

const requiredTextField: FormFieldDefinition = {
  id: '0:applicant.fullName',
  name: 'applicant.fullName',
  label: 'Full name',
  kind: 'text',
  required: true,
  readOnly: false,
  options: [],
  multiline: false,
  helper: '',
}

describe('field helpers', () => {
  it('turns PDF identifiers into readable labels', () => {
    expect(humanizeFieldName('applicant.fullLegalName')).toBe('Full Legal Name')
    expect(humanizeFieldName('contact_phone-number')).toBe('Contact phone number')
  })

  it('treats whitespace-only text as incomplete', () => {
    expect(isFieldComplete(requiredTextField, '   ')).toBe(false)
    expect(isFieldComplete(requiredTextField, 'Gokul Krishna')).toBe(true)
  })

  it('returns only required fields that still need a value', () => {
    const optionalField = { ...requiredTextField, id: '1:notes', required: false }
    expect(getRequiredIssues([requiredTextField, optionalField], {})).toEqual([requiredTextField])
  })
})
