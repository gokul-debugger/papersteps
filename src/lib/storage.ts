import type { FormValue, SavedDraft } from '../types'

const STORAGE_PREFIX = 'papersteps:draft:'

export function loadDraft(fingerprint: string): SavedDraft | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${fingerprint}`)
    return raw ? (JSON.parse(raw) as SavedDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(
  fingerprint: string,
  fileName: string,
  values: Record<string, FormValue>,
): SavedDraft {
  const draft: SavedDraft = {
    fileName,
    updatedAt: new Date().toISOString(),
    values,
  }
  localStorage.setItem(`${STORAGE_PREFIX}${fingerprint}`, JSON.stringify(draft))
  return draft
}

export function removeDraft(fingerprint: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${fingerprint}`)
}
