import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useMealStore } from '../store/mealStore';

/* ---------- Календарные справочники ---------- */

const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const WEEKDAYS_NOM = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const WEEKDAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

const CATEGORY_LABEL = { dormitory: 'Общежитие', social: 'Соцгруппа', specialty: 'Специальность' };

/* Учебный год: сентябрь 2026 – июль 2027 */
const ACADEMIC_MONTHS = [
  { y: 2026, m: 9 }, { y: 2026, m: 10 }, { y: 2026, m: 11 }, { y: 2026, m: 12 },
  { y: 2027, m: 1 }, { y: 2027, m: 2 }, { y: 2027, m: 3 }, { y: 2027, m: 4 },
  { y: 2027, m: 5 }, { y: 2027, m: 6 }, { y: 2027, m: 7 },
];
/* График как в макете: 12 колонок Сен 2026 → Авг 2027 */
const CHART_MONTHS = [...ACADEMIC_MONTHS, { y: 2027, m: 8 }];

const monthKey = (y, m) => `${y}-${m}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const vladParts = (date) => {
  const p = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Vladivostok',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t) => p.find((x) => x.type === t)?.value ?? '00';
  return {
    y: +get('year'), m: +get('month'), d: +get('day'),
    hh: get('hour'), mm: get('minute'), ss: get('second'),
    weekday: WEEKDAYS_NOM[new Date(+get('year'), +get('month') - 1, +get('day')).getDay()],
  };
};

/* ---------- Excel-экспорт (открывается в Excel без зависимостей) ---------- */

const escapeCell = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const downloadExcel = (filename, sheetName, headers, rows) => {
  const table =
    `<table border="1"><tr>${headers.map((h) => `<th>${escapeCell(h)}</th>`).join('')}</tr>` +
    rows.map((r) => `<tr>${r.map((c) => `<td>${escapeCell(c)}</td>`).join('')}</tr>`).join('') +
    `</table>`;
  const html =
    `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">` +
    `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>` +
    `<x:Name>${escapeCell(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>` +
    `</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->` +
    `</head><body>${table}</body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ---------- UI-кусочки ---------- */

const ModalShell = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#676565]/40 px-5">
    <div className={`w-full ${wide ? 'max-w-[720px]' : 'max-w-[420px]'} rounded-2xl bg-primary p-6 shadow-xl`}>
      <div className="flex items-start justify-between">
        <h2 className="text-2xl leading-[105%] font-semibold text-black laptop:text-[32px]">{title}</h2>
        <button type="button" aria-label="Закрыть" onClick={onClose} className="p-1 text-black transition-colors hover:text-gray">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const CircleIcon = ({ children }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-primary">{children}</span>
);

const ArrowOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black"><path d="M7 17L17 7 M9 7h8v8" /></svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V5 M8 8l4-4 4 4 M4 17v2h16v-2" /></svg>
);

/* Размытые зелёные волны героя (как в макете) */
const HeroWaves = () => (
  <>
    <svg aria-hidden className="pointer-events-none absolute -left-10 top-0 h-full w-[420px] blur-2xl" viewBox="0 0 420 460" fill="none">
      <defs>
        <linearGradient id="waveL" x1="0" y1="0" x2="420" y2="460" gradientUnits="userSpaceOnUse">
          <stop stopColor="#23D966" /><stop offset="1" stopColor="#88FF00" />
        </linearGradient>
      </defs>
      <path d="M60 440 L120 340 L100 260 L180 180 L160 110 L250 40" stroke="url(#waveL)" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <svg aria-hidden className="pointer-events-none absolute -right-10 top-0 h-full w-[420px] blur-2xl" viewBox="0 0 420 460" fill="none">
      <defs>
        <linearGradient id="waveR" x1="420" y1="0" x2="0" y2="460" gradientUnits="userSpaceOnUse">
          <stop stopColor="#23D966" /><stop offset="1" stopColor="#88FF00" />
        </linearGradient>
      </defs>
      <path d="M360 20 L300 120 L320 200 L240 280 L260 350 L170 430" stroke="url(#waveR)" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <svg aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[240px] w-[220px] -translate-x-1/2 blur-2xl" viewBox="0 0 220 240" fill="none">
      <path d="M110 0 L130 80 L100 150 L120 230" stroke="#23D966" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </>
);

/* ---------- Карточка статистики ---------- */

const StatCard = ({ icon, title, value, subtitle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col rounded-2xl bg-[#F7F7F7] p-6 text-left transition-shadow hover:shadow-lg"
  >
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <CircleIcon>{icon}</CircleIcon>
        <span className="text-base font-medium text-black laptop:text-lg">{title}</span>
      </div>
      <ArrowOut />
    </div>
    <p className="mt-8 text-3xl font-semibold text-black laptop:text-4xl">{value}</p>
    <p className="mt-2 text-xs leading-[120%] text-gray">{subtitle}</p>
  </button>
);

/* ---------- Модалка выбора даты ---------- */

const DatePickerModal = ({ selected, onCommit, onClose }) => {
  const [viewYear, setViewYear] = useState(selected.y);
  const [viewMonth, setViewMonth] = useState(selected.m);
  const [pending, setPending] = useState(selected);

  const allowedMonths = ACADEMIC_MONTHS.filter((a) => a.y === viewYear).map((a) => a.m);

  const changeYear = (y) => {
    setViewYear(y);
    const allowed = ACADEMIC_MONTHS.filter((a) => a.y === y).map((a) => a.m);
    if (!allowed.includes(viewMonth)) setViewMonth(allowed[0]);
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth - 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const trailing = (7 - ((offset + daysInMonth) % 7)) % 7;

  return (
    <ModalShell title="Выберите дату" onClose={onClose}>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="relative">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(+e.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-black focus:border-black focus:outline-none"
          >
            {allowedMonths.map((m) => <option key={m} value={m}>{MONTHS_NOM[m - 1]}</option>)}
          </select>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"><path d="M6 9l6 6 6-6" /></svg>
        </div>
        <div className="relative">
          <select
            value={viewYear}
            onChange={(e) => changeYear(+e.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-black focus:border-black focus:outline-none"
          >
            {[2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center text-xs text-gray">
        {WEEKDAYS_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`p-${i}`} className="flex h-10 items-center justify-center text-sm text-gray/50">{daysInPrev - offset + i + 1}</div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isSel = pending.y === viewYear && pending.m === viewMonth && pending.d === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setPending({ y: viewYear, m: viewMonth, d: day })}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors ${
                isSel ? 'bg-accent font-medium text-black' : 'text-black hover:bg-gray/10'
              }`}
            >
              {day}
            </button>
          );
        })}
        {Array.from({ length: trailing }).map((_, i) => (
          <div key={`t-${i}`} className="flex h-10 items-center justify-center text-sm text-gray/50">{i + 1}</div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отмена</button>
        <button type="button" onClick={() => onCommit(pending)} className="h-11 rounded-lg bg-accent text-sm font-medium text-black transition-colors hover:bg-accent/90">Смотреть отчёт</button>
      </div>
    </ModalShell>
  );
};

/* ---------- Модалка детализации ---------- */

const DetailModal = ({ title, headers, rows, emptyText, onClose, onDownload }) => (
  <ModalShell title={title} onClose={onClose} wide>
    <div className="talon-scroll mt-4 max-h-[420px] overflow-y-auto">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-primary">
          <tr className="border-b border-gray/20">
            {headers.map((h) => <th key={h} className="px-4 py-3 text-sm font-medium text-black">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-gray">{emptyText}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-b border-gray/10">
              {r.map((c, j) => <td key={j} className="px-4 py-3 text-sm text-black">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Закрыть</button>
      <button type="button" onClick={onDownload} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-black transition-colors hover:bg-accent/90"><DownloadIcon /> Скачать отчёт</button>
    </div>
  </ModalShell>
);

/* ---------- Страница ---------- */

const DashboardReports = () => {
  const { students, issues, isLoading, fetchData } = useMealStore();

  // Загружаем данные с бэкенда при входе
  useEffect(() => {
    fetchData();
  }, []);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = vladParts(now);
  const [manual, setManual] = useState(false);
  const [selected, setSelected] = useState(() => vladParts(new Date()));
  
  useEffect(() => {
    if (!manual) setSelected(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.y, today.m, today.d, manual]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeMonth, setActiveMonth] = useState(monthKey(today.y, today.m));

  const selectedISO = `${selected.y}-${String(selected.m).padStart(2, '0')}-${String(selected.d).padStart(2, '0')}`;

  /* Производные данные за выбранный день */
  const dayIssues = useMemo(() => issues.filter((i) => i.dateISO === selectedISO), [issues, selectedISO]);
  const totalPortions = dayIssues.length;
  const eligibleStudents = students.length;
  const groupsTotal = useMemo(() => [...new Set(students.map((s) => s.group))], [students]);
  const groupsServed = useMemo(() => [...new Set(dayIssues.map((i) => i.group))], [dayIssues]);
  const topGroup = useMemo(() => {
    const counts = {};
    dayIssues.forEach((i) => { counts[i.group] = (counts[i.group] ?? 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0] ?? null;
  }, [dayIssues]);

  /* График по месяцам */
  const monthCounts = useMemo(() => {
    const map = {};
    issues.forEach((i) => { map[i.monthKey] = (map[i.monthKey] ?? 0) + 1; });
    return CHART_MONTHS.map((m) => ({ ...m, key: monthKey(m.y, m.m), count: map[monthKey(m.y, m.m)] ?? 0 }));
  }, [issues]);
  const maxCount = Math.max(1, ...monthCounts.map((m) => m.count));
  const active = monthCounts.find((m) => m.key === activeMonth) ?? monthCounts[0];

  /* Экспорты */
  const exportDay = () => {
    const rows = dayIssues.map((i) => [i.time, i.fullName, i.group, CATEGORY_LABEL[i.category] ?? i.category]);
    rows.push(['Итого', totalPortions, '', '']);
    downloadExcel(`Отчёт за ${selectedISO}`, 'День', ['Время', 'ФИО', 'Группа', 'Категория'], rows);
  };

  const exportMonth = (target = active) => {
    const days = new Date(target.y, target.m, 0).getDate();
    const rows = Array.from({ length: days }).map((_, i) => {
      const d = i + 1;
      const iso = `${target.y}-${String(target.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = issues.filter((x) => x.dateISO === iso).length;
      return [`${String(d).padStart(2, '0')}.${String(target.m).padStart(2, '0')}.${target.y}`, count];
    });
    rows.push(['Итого за месяц', rows.reduce((s, r) => s + r[1], 0)]);
    downloadExcel(`Отчёт за ${MONTHS_NOM[target.m - 1]} ${target.y}`, 'Месяц', ['Дата', 'Выдано порций'], rows);
  };

  /* Детализации карточек */
  const openPortions = () => setDetail({
    title: 'Всего порций выдано',
    headers: ['Время', 'ФИО', 'Группа', 'Категория'],
    rows: dayIssues.map((i) => [i.time, i.fullName, i.group, CATEGORY_LABEL[i.category] ?? i.category]),
    emptyText: 'За выбранный день выдач ещё не было',
    onDownload: exportDay,
  });

  const openStudents = () => setDetail({
    title: 'Студенты с питанием',
    headers: ['ФИО', 'Группа', 'Категории'],
    rows: students.map((s) => [s.fullName, s.group, s.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(', ')]),
    emptyText: 'Пока ни один студент не зарегистрировался',
    onDownload: () => downloadExcel('Студенты с питанием', 'Студенты', ['ФИО', 'Группа', 'Категории'], students.map((s) => [s.fullName, s.group, s.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(', ')])),
  });

  const openGroups = () => setDetail({
    title: 'Кол-во групп',
    headers: ['Группа', 'Студентов', 'Порций за день'],
    rows: groupsTotal.map((g) => [g, students.filter((s) => s.group === g).length, dayIssues.filter((i) => i.group === g).length]),
    emptyText: 'Групп пока нет — появятся после первой регистрации',
    onDownload: () => downloadExcel('Группы', 'Группы', ['Группа', 'Студентов', 'Порций за день'], groupsTotal.map((g) => [g, students.filter((s) => s.group === g).length, dayIssues.filter((i) => i.group === g).length])),
  });

  const openTop = () => setDetail({
    title: topGroup ? `Группа «Прожор»: ${topGroup[0]}` : 'Группа «Прожор»',
    headers: ['ФИО', 'Порций за день'],
    rows: topGroup
      ? students.filter((s) => s.group === topGroup[0]).map((s) => [s.fullName, dayIssues.filter((i) => i.fullName === s.fullName).length])
      : [],
    emptyText: 'Лидер дня появится после первой выдачи',
    onDownload: exportDay,
  });

  const selectedWeekday = WEEKDAYS_NOM[new Date(selected.y, selected.m - 1, selected.d).getDay()];
  const heroDate = `${cap(selectedWeekday)}, ${selected.d} ${cap(MONTHS_GEN[selected.m - 1])}`;

  // Если идет загрузка, показываем красивый лоадер
  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-primary">
        <AdminSidebar active="reports" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray animate-pulse">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-primary flex">
      <AdminSidebar active="reports" />

      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        {/* Шапка */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">Отчёты</h1>
            <p className="mt-1 text-sm leading-[120%] text-gray">Аналитика по выдаче питания за выбранный период</p>
          </div>
          <button type="button" onClick={exportDay} className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black transition-colors hover:bg-accent/90">
            <DownloadIcon /> Скачать отчёт за день
          </button>
        </div>

        {/* Герой-баннер */}
        <section className="relative mt-6 overflow-hidden bg-[#F7F7F7] px-6 py-20 text-center">
          <HeroWaves />
          <p className="absolute right-5 top-4 text-xs tabular-nums text-gray">
            Владивосток · {today.hh}:{today.mm}:{today.ss}
          </p>
          <div className="relative">
            <h2 className="text-3xl font-semibold text-black laptop:text-[40px]">{heroDate}</h2>
            <p className="mt-3 text-sm text-black">Успейте просмотреть статистику за день</p>
            <button type="button" onClick={() => setPickerOpen(true)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black transition-colors hover:bg-accent/90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4 M21 3v6h-6" /></svg>
              Изменить дату
            </button>
          </div>
        </section>

        {/* Сетка карточек + график */}
        <div className="mt-6 grid gap-4 laptop:grid-cols-[1fr_1fr_2.15fr]">
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 3v8 M5 3v4a2 2 0 0 0 4 0V3 M7 11v10 M17 3c-2 2-3 5-3 8h3v10" /></svg>}
            title="Всего порций выдано"
            value={totalPortions}
            subtitle="За день"
            onClick={openPortions}
          />
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" /></svg>}
            title="Студенты с питанием"
            value={eligibleStudents}
            subtitle="Число тех, кто претендует на питание"
            onClick={openStudents}
          />

          {/* График (span 2 rows) */}
          <section className="flex flex-col rounded-2xl bg-[#F7F7F7] p-6 laptop:row-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CircleIcon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
                </CircleIcon>
                <span className="text-base font-medium text-black laptop:text-lg">График получения питания</span>
              </div>
              <button type="button" onClick={() => exportMonth()} className="flex items-center gap-2 text-sm text-gray transition-colors hover:text-black">
                <DownloadIcon /> Скачать отчёт
              </button>
            </div>

            <div className="mt-10 flex flex-1 items-end gap-2 laptop:gap-3">
              {monthCounts.map((m) => {
                const isActive = m.key === active.key;
                const height = m.count === 0 ? 3 : Math.max(14, (m.count / maxCount) * 190);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setActiveMonth(m.key)}
                    className="group relative flex h-[240px] flex-1 flex-col items-center justify-end"
                    title={`${MONTHS_NOM[m.m - 1]} ${m.y}: ${m.count} порций`}
                  >
                    {isActive && (
                      <span className="absolute z-10 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-primary" style={{ bottom: height + 26 }}>
                        {m.count} порций
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute w-px bg-black" style={{ bottom: height + 4, height: 22 }} />
                    )}
                    <span
                      className={`w-full max-w-[46px] rounded-t-xl transition-all ${
                        m.count === 0
                          ? 'bg-gray/30'
                          : isActive
                            ? 'bg-accent'
                            : 'bg-[repeating-linear-gradient(45deg,rgba(136,255,0,0.5)_0_5px,rgba(136,255,0,0.18)_5px_10px)]'
                      }`}
                      style={{ height }}
                    />
                    <span className="mt-3 text-center text-xs leading-[130%] text-gray">
                      {MONTHS_SHORT[m.m - 1]}<br />{m.y}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3 19c1.2-3 3.4-4.5 6-4.5s4.8 1.5 6 4.5 M16 8a3 3 0 1 1 2 5.2 M18 14.7c1.6.7 2.7 2 3.3 4.3" /></svg>}
            title="Кол-во групп"
            value={`${groupsServed.length} / ${groupsTotal.length}`}
            subtitle="Группы, которые получают питание"
            onClick={openGroups}
          />
          <StatCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0V4Z M7 6H4a3 3 0 0 0 3 4 M17 6h3a3 3 0 0 1-3 4" /></svg>}
            title="Группа “Прожор”"
            value={topGroup ? topGroup[0] : '—'}
            subtitle="Группа, которая получает больше всего порций"
            onClick={openTop}
          />
        </div>
      </main>

      {/* Модалки */}
      {pickerOpen && (
        <DatePickerModal
          selected={selected}
          onCommit={(d) => { setSelected(d); setManual(true); setActiveMonth(monthKey(d.y, d.m)); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {detail && (
        <DetailModal
          title={detail.title}
          headers={detail.headers}
          rows={detail.rows}
          emptyText={detail.emptyText}
          onClose={() => setDetail(null)}
          onDownload={detail.onDownload}
        />
      )}
    </div>
  );
};

export default DashboardReports;