import { useState } from 'react'
import { X, Copy, Check, Calendar, Smartphone } from 'lucide-react'
import { useStore } from '../store/useStore'

// Relative to the current origin: works on loznik.web.app and localhost
const BASE_URL = `${window.location.origin}/api/calendar`

interface Props { onClose: () => void }

export default function SubscribeModal({ onClose }: Props) {
  const { layers, classes } = useStore()
  const [copied, setCopied] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  const feedUrl = selectedClass
    ? `${BASE_URL}?class=${selectedClass}`
    : selectedLayer
    ? `${BASE_URL}?layer=${selectedLayer}`
    : BASE_URL

  const webcalUrl = feedUrl.replace('https://', 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`

  const copyUrl = async () => {
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredClasses = selectedLayer
    ? classes.filter(c => c.layerId === selectedLayer && c.isActive)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">הוספה ללוח שנה</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">מתעדכן אוטומטית</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Filter */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">סינון אירועים (אופציונלי):</p>
            <select
              value={selectedLayer}
              onChange={e => { setSelectedLayer(e.target.value); setSelectedClass('') }}
              className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">כל השכבות</option>
              {layers.map(l => <option key={l.id} value={l.id}>שכבת {l.name}</option>)}
            </select>

            {selectedLayer && filteredClasses.length > 0 && (
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">כל הכיתות בשכבה</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            )}
          </div>

          {/* URL copy */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">קישור להרשמה:</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
              <span className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate font-mono">{feedUrl}</span>
              <button
                onClick={copyUrl}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="העתק"
              >
                {copied ? <Check className="w-4 h-4 text-primary-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <a
              href={webcalUrl}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-5 h-5" />
              הוסף ל-Apple Calendar
            </a>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              הוסף ל-Google Calendar
            </a>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            הלוח מתעדכן אוטומטית מדי שעה בכל האפליקציות
          </p>
        </div>
      </div>
    </div>
  )
}
