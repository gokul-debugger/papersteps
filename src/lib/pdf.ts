import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from 'pdf-lib'
import { getFieldHelper, humanizeFieldName } from './fields'
import type { FormFieldDefinition, FormValue, LoadedDocument } from '../types'

function getFieldKind(field: unknown): FormFieldDefinition['kind'] {
  if (field instanceof PDFTextField) return 'text'
  if (field instanceof PDFCheckBox) return 'checkbox'
  if (field instanceof PDFRadioGroup) return 'radio'
  if (field instanceof PDFDropdown) return 'dropdown'
  if (field instanceof PDFOptionList) return 'option-list'
  return 'unsupported'
}

function readFieldValue(field: unknown): FormValue {
  if (field instanceof PDFTextField) return field.getText() ?? ''
  if (field instanceof PDFCheckBox) return field.isChecked()
  if (field instanceof PDFRadioGroup) return field.getSelected() ?? ''
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) return field.getSelected()
  return ''
}

async function fingerprintBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer)
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('')
}

export async function inspectPdf(
  bytes: Uint8Array,
  fileName: string,
  fileSize: number,
): Promise<LoadedDocument> {
  const document = await PDFDocument.load(bytes, { updateMetadata: false })
  const form = document.getForm()
  const fields = form.getFields().map((field, index): FormFieldDefinition => {
    const kind = getFieldKind(field)
    const name = field.getName()
    const options =
      field instanceof PDFRadioGroup || field instanceof PDFDropdown || field instanceof PDFOptionList
        ? field.getOptions()
        : []

    return {
      id: `${index}:${name}`,
      name,
      label: humanizeFieldName(name),
      kind,
      required: field.isRequired(),
      readOnly: field.isReadOnly(),
      options,
      multiline: field instanceof PDFTextField ? field.isMultiline() : false,
      maxLength: field instanceof PDFTextField ? field.getMaxLength() : undefined,
      helper: getFieldHelper(name, kind),
    }
  })

  const initialValues = Object.fromEntries(
    form.getFields().map((field, index) => [`${index}:${field.getName()}`, readFieldValue(field)]),
  )

  return {
    bytes,
    fingerprint: await fingerprintBytes(bytes),
    fileName,
    fileSize,
    pageCount: document.getPageCount(),
    title: document.getTitle() || fileName.replace(/\.pdf$/i, ''),
    fields,
    initialValues,
  }
}

function setFieldValue(field: unknown, value: FormValue): void {
  if (field instanceof PDFTextField && typeof value === 'string') {
    field.setText(value)
  } else if (field instanceof PDFCheckBox && typeof value === 'boolean') {
    if (value) field.check()
    else field.uncheck()
  } else if (field instanceof PDFRadioGroup && typeof value === 'string' && value) {
    field.select(value)
  } else if (field instanceof PDFDropdown && (typeof value === 'string' || Array.isArray(value))) {
    field.select(value)
  } else if (field instanceof PDFOptionList && (typeof value === 'string' || Array.isArray(value))) {
    field.select(value)
  }
}

export async function fillPdf(
  sourceBytes: Uint8Array,
  fields: FormFieldDefinition[],
  values: Record<string, FormValue>,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(sourceBytes)
  const form = document.getForm()
  const sourceFields = form.getFields()

  fields.forEach((definition, index) => {
    if (definition.readOnly || definition.kind === 'unsupported') return
    setFieldValue(sourceFields[index], values[definition.id])
  })

  const font = await document.embedFont(StandardFonts.Helvetica)
  form.updateFieldAppearances(font)
  return document.save()
}

export async function createSamplePdf(): Promise<Uint8Array> {
  const document = await PDFDocument.create()
  document.setTitle('Community support application')
  document.setAuthor('PaperSteps')

  const page = document.addPage([612, 792])
  const form = document.getForm()
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.08, 0.13, 0.18)
  const muted = rgb(0.35, 0.4, 0.43)
  const accent = rgb(0.04, 0.43, 0.4)

  page.drawRectangle({ x: 0, y: 720, width: 612, height: 72, color: rgb(0.94, 0.97, 0.96) })
  page.drawText('Community support application', {
    x: 44,
    y: 750,
    size: 20,
    font: bold,
    color: ink,
  })
  page.drawText('Sample fillable form generated locally by PaperSteps', {
    x: 44,
    y: 731,
    size: 9,
    font: regular,
    color: muted,
  })

  const label = (text: string, x: number, y: number, required = false) => {
    page.drawText(`${text}${required ? ' *' : ''}`, { x, y, size: 9, font: bold, color: ink })
  }

  label('Full legal name', 44, 680, true)
  const name = form.createTextField('applicant.fullName')
  name.enableRequired()
  name.addToPage(page, { x: 44, y: 648, width: 250, height: 24, borderColor: muted, borderWidth: 1 })

  label('Email address', 318, 680, true)
  const email = form.createTextField('applicant.email')
  email.enableRequired()
  email.addToPage(page, { x: 318, y: 648, width: 250, height: 24, borderColor: muted, borderWidth: 1 })

  label('Date of birth (YYYY-MM-DD)', 44, 614)
  const dateOfBirth = form.createTextField('applicant.dateOfBirth')
  dateOfBirth.setMaxLength(10)
  dateOfBirth.addToPage(page, { x: 44, y: 582, width: 160, height: 24, borderColor: muted, borderWidth: 1 })

  label('Preferred language', 228, 614)
  const language = form.createDropdown('preferences.language')
  language.addOptions(['English', 'Hindi', 'Malayalam', 'Tamil', 'Other'])
  language.select('English')
  language.addToPage(page, { x: 228, y: 582, width: 160, height: 24, borderColor: muted, borderWidth: 1 })

  label('Postal address', 44, 548, true)
  const address = form.createTextField('applicant.address')
  address.enableMultiline()
  address.enableRequired()
  address.addToPage(page, { x: 44, y: 472, width: 524, height: 66, borderColor: muted, borderWidth: 1 })

  label('Preferred contact method', 44, 438, true)
  const contact = form.createRadioGroup('preferences.contactMethod')
  contact.enableRequired()
  contact.addOptionToPage('Email', page, { x: 44, y: 408, width: 14, height: 14, borderColor: muted })
  page.drawText('Email', { x: 64, y: 410, size: 10, font: regular, color: ink })
  contact.addOptionToPage('Phone', page, { x: 132, y: 408, width: 14, height: 14, borderColor: muted })
  page.drawText('Phone', { x: 152, y: 410, size: 10, font: regular, color: ink })

  label('Support information', 44, 370)
  const accessibility = form.createCheckBox('preferences.accessibilitySupport')
  accessibility.addToPage(page, { x: 44, y: 338, width: 14, height: 14, borderColor: muted })
  page.drawText('I would like accessibility accommodations.', {
    x: 66,
    y: 340,
    size: 10,
    font: regular,
    color: ink,
  })

  page.drawLine({ start: { x: 44, y: 302 }, end: { x: 568, y: 302 }, thickness: 1, color: rgb(0.82, 0.84, 0.84) })
  label('Declaration', 44, 272, true)
  const declaration = form.createCheckBox('declaration.confirmed')
  declaration.enableRequired()
  declaration.addToPage(page, { x: 44, y: 236, width: 14, height: 14, borderColor: accent })
  page.drawText('I confirm that I reviewed the information entered in this form.', {
    x: 66,
    y: 238,
    size: 10,
    font: regular,
    color: ink,
  })

  page.drawText('* Required field', { x: 44, y: 72, size: 9, font: regular, color: muted })
  page.drawText('This sample does not represent a real service or application.', {
    x: 44,
    y: 54,
    size: 8,
    font: regular,
    color: muted,
  })

  form.updateFieldAppearances(regular)
  return document.save()
}
