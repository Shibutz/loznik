import { useEffect, useRef } from 'react';
import { Printer, FileDown, FileSpreadsheet, LayoutTemplate } from 'lucide-react';
import { useStore } from '../store/useStore';
import { filterEvents } from '../utils/eventUtils';
import { exportToExcel, exportToPDF, exportWallChart } from '../utils/exportUtils';
import { HEBREW_MONTH_NAMES } from '../utils/dateUtils';

interface ExportMenuProps {
  onOpenPrintStudio: () => void;
}

export default function ExportMenu({ onOpenPrintStudio }: ExportMenuProps) {
  const {
    events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, currentDate, searchQuery, setShowExportMenu,
  } = useStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowExportMenu]);

  const filteredEvents = filterEvents(events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery)
    .filter((e) => e.schoolYearId === activeSchoolYearId);

  const monthName = HEBREW_MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const filename = `loznik-${monthName}-${year}`;

  const menuItems = [
    {
      icon: <Printer className="w-4 h-4" />, label: 'סטודיו הדפסה', sublabel: 'עיצוב והדפסה מתקדמת',
      onClick: () => {
        setShowExportMenu(false);
        onOpenPrintStudio();
      },
    },
    {
      icon: <FileDown className="w-4 h-4" />, label: 'יצוא PDF', sublabel: 'כל האירועים המסוננים',
      onClick: () => {
        setShowExportMenu(false);
        exportToPDF(filteredEvents, layers, classes, categories, filename);
      },
    },
    {
      icon: <FileSpreadsheet className="w-4 h-4" />, label: 'יצוא Excel', sublabel: 'גיליון אלקטרוני',
      onClick: () => {
        setShowExportMenu(false);
        exportToExcel(filteredEvents, layers, classes, categories, filename);
      },
    },
    {
      icon: <LayoutTemplate className="w-4 h-4" />, label: 'לוח קיר (חודש נוכחי)', sublabel: `${monthName} ${year}`,
      onClick: () => {
        setShowExportMenu(false);
        exportWallChart(filteredEvents, currentDate, layers, classes, categories);
      },
    },
  ];

  return (
    <div ref={menuRef}
      className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      <div className="p-1.5">
        {menuItems.map((item, idx) => (
          <button key={idx} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); item.onClick(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-right rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
            <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors flex-shrink-0">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</div>
              {item.sublabel && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.sublabel}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
