import { useState, useRef, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { useStore } from '../store/useStore';

const TEACHER_HASH = import.meta.env.VITE_TEACHER_PASSWORD_HASH as string | undefined;

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function StaffLoginModal() {
  const { setShowStaffLogin, setStaffMode } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (!TEACHER_HASH) { setError('לא הוגדרה סיסמת צוות בסביבה'); setIsLoading(false); return; }
    const inputHash = await sha256(password);
    if (inputHash === TEACHER_HASH) {
      setStaffMode(true);
      setShowStaffLogin(false);
    } else {
      setError('סיסמה שגויה');
      setPassword('');
      inputRef.current?.focus();
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStaffLogin(false)} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">כניסת צוות</h2>
          </div>
          <button onClick={() => setShowStaffLogin(false)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">כניסת מורים ואנשי צוות — גישה לאירועים פנימיים</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">סיסמה</label>
            <input ref={inputRef} type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className={`w-full px-3 py-2.5 rounded-lg border text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="סיסמת צוות" autoComplete="current-password" />
            {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
          </div>
          <button type="submit" disabled={isLoading || !password}
            className="w-full py-2.5 text-base font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {isLoading ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Users className="w-4 h-4" />}
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
