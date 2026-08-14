import { expect, test } from '@playwright/test'

test('completes a sample field and refreshes the PDF preview', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Complete a form with fewer surprises.' })).toBeVisible()
  await page.getByRole('button', { name: 'Try sample' }).click()

  await expect(page.getByText('Community support application', { exact: true })).toBeVisible()
  const fullNameField = page.getByRole('button', { name: /Full Name Required/ })
  if (await fullNameField.isVisible()) await fullNameField.click()
  await page.getByLabel('Full name').fill('Gokul Krishna')

  const fieldsTab = page.getByRole('button', { name: 'Fields' })
  const documentTab = page.getByRole('button', { name: 'Document', exact: true })
  if (await fieldsTab.isVisible()) await fieldsTab.click()
  await expect(page.getByText('25%')).toBeVisible()

  if (await documentTab.isVisible()) {
    await documentTab.click()
    await page.getByRole('button', { name: 'Update now' }).click()
  } else {
    await page.getByRole('button', { name: 'Update preview' }).click()
  }
  await expect(page.getByText('Document preview updated.')).toBeVisible()

  const canvas = page.locator('.pdf-viewer canvas')
  await expect(canvas).toBeVisible()
  await expect.poll(() => canvas.evaluate((element) => element.width)).toBeGreaterThan(0)
})
