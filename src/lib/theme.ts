export type ThemeId =
  'emerald' | 'blue' | 'violet' | 'rose' | 'orange' | 'cyan' | 'slate'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  hex: string       // primary-600 hex for swatches
  lightHex: string  // primary-100 hex for backgrounds
  roleDefault?: 'public' | 'staff' | 'admin'
}

export const THEMES: ThemeDefinition[] = [
  { id: 'emerald', label: 'ירוק מנטה', hex: '#059669', lightHex: '#d1fae5', roleDefault: 'public' },
  { id: 'blue',    label: 'כחול',       hex: '#2563eb', lightHex: '#dbeafe', roleDefault: 'staff' },
  { id: 'violet',  label: 'סגול',       hex: '#7c3aed', lightHex: '#ede9fe', roleDefault: 'admin' },
  { id: 'rose',    label: 'ורוד',       hex: '#e11d48', lightHex: '#ffe4e6' },
  { id: 'orange',  label: 'כתום',       hex: '#ea580c', lightHex: '#ffedd5' },
  { id: 'cyan',    label: 'תכלת',       hex: '#0891b2', lightHex: '#cffafe' },
  { id: 'slate',   label: 'אפור כהה',   hex: '#475569', lightHex: '#f1f5f9' },
]

export function getRoleDefaultTheme(
  isAdminMode: boolean,
  isStaffMode: boolean
): ThemeId {
  if (isAdminMode) return 'violet'
  if (isStaffMode) return 'blue'
  return 'emerald'
}

export function applyTheme(themeId: ThemeId): void {
  const root = document.documentElement
  if (themeId === 'emerald') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', themeId)
  }
}

export function getCSSVar(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName).trim()
}

export function getPrimaryHex(): string {
  return getCSSVar('--color-primary-hex') || '#059669'
}

export function getPrimaryRGB(shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900): string {
  const value = getCSSVar(`--color-primary-${shade}`)
  return value ? `rgb(${value})` : '#059669'
}

const STORAGE_KEY = 'loznik-theme'

export function getUserTheme(): ThemeId | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved as ThemeId) ?? null
  } catch {
    return null
  }
}

export function saveUserTheme(themeId: ThemeId | null): void {
  try {
    if (themeId === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, themeId)
    }
  } catch { /* ignore */ }
}
