import { X } from 'lucide-react'
import { THEMES } from '../lib/theme'
import { useTheme } from '../hooks/useTheme'
import { useStore } from '../store/useStore'

interface Props { onClose: () => void }

export default function ThemeSelector({ onClose }: Props) {
  const { setTheme, currentThemeId, isCustomized } = useTheme()
  const { isAdminMode, isStaffMode } = useStore()

  const roleThemes = THEMES.filter(t => t.roleDefault)
  const customThemes = THEMES.filter(t => !t.roleDefault)
  const active = currentThemeId()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">ערכת צבעים</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Role defaults */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              ברירות מחדל לפי תפקיד
            </p>
            <div className="grid grid-cols-3 gap-2">
              {roleThemes.map(theme => {
                const isRoleActive =
                  (theme.roleDefault === 'admin' && isAdminMode) ||
                  (theme.roleDefault === 'staff' && isStaffMode && !isAdminMode) ||
                  (theme.roleDefault === 'public' && !isAdminMode && !isStaffMode)

                return (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      active === theme.id
                        ? 'border-gray-900 dark:border-gray-100 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full shadow-md"
                      style={{ background: `linear-gradient(135deg, ${theme.lightHex}, ${theme.hex})` }}
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {theme.label}
                    </span>
                    {isRoleActive && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom themes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              ערכות נוספות
            </p>
            <div className="grid grid-cols-4 gap-2">
              {customThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    active === theme.id
                      ? 'border-gray-900 dark:border-gray-100 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${theme.lightHex}, ${theme.hex})` }}
                  />
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset to role default */}
          {isCustomized() && (
            <button
              onClick={() => setTheme(null)}
              className="w-full py-2 text-sm font-medium rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              אפס לברירת המחדל של התפקיד
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
