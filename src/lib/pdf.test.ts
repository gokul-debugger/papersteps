import { describe, expect, it } from 'vitest'
import { createSamplePdf, fillPdf, inspectPdf } from './pdf'

describe('PDF workflow', () => {
  it('creates and inspects the fillable sample form', async () => {
    const bytes = await createSamplePdf()
    const document = await inspectPdf(bytes, 'sample.pdf', bytes.byteLength)

    expect(document.pageCount).toBe(1)
    expect(document.fields).toHaveLength(8)
    expect(document.fields.filter((field) => field.required)).toHaveLength(5)
    expect(Object.fromEntries(document.fields.map((field) => [field.name, field.kind]))).toEqual({
      'applicant.fullName': 'text',
      'applicant.email': 'text',
      'applicant.dateOfBirth': 'text',
      'applicant.address': 'text',
      'preferences.language': 'dropdown',
      'preferences.contactMethod': 'radio',
      'preferences.accessibilitySupport': 'checkbox',
      'declaration.confirmed': 'checkbox',
    })
  })

  it('writes values back to a new PDF without modifying the source', async () => {
    const source = await createSamplePdf()
    const document = await inspectPdf(source, 'sample.pdf', source.byteLength)
    const fieldId = (name: string) => {
      const field = document.fields.find((candidate) => candidate.name === name)
      if (!field) throw new Error(`Missing sample field: ${name}`)
      return field.id
    }
    const values = {
      ...document.initialValues,
      [fieldId('applicant.fullName')]: 'Gokul Krishna',
      [fieldId('applicant.email')]: 'gokul@example.com',
      [fieldId('applicant.address')]: '42 Example Street',
      [fieldId('preferences.contactMethod')]: 'Email',
      [fieldId('declaration.confirmed')]: true,
    }

    const completed = await fillPdf(source, document.fields, values)
    const reopened = await inspectPdf(completed, 'completed.pdf', completed.byteLength)

    const reopenedValues = Object.fromEntries(
      reopened.fields.map((field) => [field.name, reopened.initialValues[field.id]]),
    )
    expect(reopenedValues['applicant.fullName']).toBe('Gokul Krishna')
    expect(reopenedValues['applicant.address']).toBe('42 Example Street')
    expect(reopenedValues['preferences.contactMethod']).toBe('Email')
    expect(reopenedValues['declaration.confirmed']).toBe(true)
    expect(source).not.toEqual(completed)
  })
})
