import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  applyTheme, getRoleDefaultTheme, getUserTheme,
  saveUserTheme, ThemeId,
} from '../lib/theme'

export function useTheme() {
  const { isAdminMode, isStaffMode } = useStore()

  // Apply theme whenever role changes
  useEffect(() => {
    const userChoice = getUserTheme()
    const roleDefault = getRoleDefaultTheme(isAdminMode, isStaffMode)
    applyTheme(userChoice ?? roleDefault)
  }, [isAdminMode, isStaffMode])

  const setTheme = (themeId: ThemeId | null) => {
    saveUserTheme(themeId)
    const roleDefault = getRoleDefaultTheme(isAdminMode, isStaffMode)
    applyTheme(themeId ?? roleDefault)
  }

  const currentThemeId = (): ThemeId => {
    const userChoice = getUserTheme()
    return userChoice ?? getRoleDefaultTheme(isAdminMode, isStaffMode)
  }

  const isCustomized = (): boolean => getUserTheme() !== null

  return { setTheme, currentThemeId, isCustomized }
}
