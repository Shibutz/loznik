import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function LogoLightbox({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer transition-opacity hover:opacity-80 ${className ?? ''}`}
        onClick={() => setOpen(true)}
        title="לחץ להגדלה"
      />
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
