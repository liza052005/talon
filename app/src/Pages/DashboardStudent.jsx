import React, { useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

/* Категории и их цвета: stroke — обводка/текст, fill — фон 10% */
const CATEGORIES = [
  { id: 'dormitory', label: 'Общежитие', stroke: '#FF6C71', fill: 'rgba(255, 108, 113, 0.1)' },
  { id: 'social', label: 'Соцгруппа', stroke: '#23D966', fill: 'rgba(108, 255, 162, 0.1)' },
  { id: 'specialty', label: 'Специальность', stroke: '#846CFF', fill: 'rgba(132, 108, 255, 0.1)' },
];

const PAGE_SIZE = 25;

const formatDate = (date) =>
  `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

const activityLabel = (date) => {
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (diff <= 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return `${diff} дней назад`;
};

/* ---------- Мелкие UI-кусочки ---------- */

const CategoryBadge = ({ categoryId }) => {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;
  return (
    <span
      className="rounded-full border px-3 py-1 text-sm leading-[120%]"
      style={{ borderColor: category.stroke, color: category.stroke, backgroundColor: category.fill }}
    >
      {category.label}
    </span>
  );
};

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#676565]/40 px-5">
    <div className="w-full max-w-[420px] rounded-2xl bg-primary p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl leading-[105%] font-semibold text-black laptop:text-[32px]">{title}</h2>
        <button type="button" aria-label="Закрыть" onClick={onClose} className="p-1 text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="mb-2 text-sm font-medium text-black">{children}</p>
);

const TextInput = (props) => (
  <input
    {...props}
    className="h-11 w-full rounded-lg border border-gray/40 bg-transparent px-4 text-sm text-black placeholder-gray focus:border-black focus:outline-none"
  />
);

/* ---------- Модальное окно добавления / редактирования ---------- */

const StudentFormModal = ({ title, submitLabel, initial, groupOptions, onClose, onSubmit }) => {
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [categories, setCategories] = useState(initial?.categories ?? []);
  const [email, setEmail] = useState(initial?.email ?? '');

  const isValid =
    fullName.trim() !== '' &&
    group.trim() !== '' &&
    categories.length > 0 &&
    email.trim() !== '' &&
    email.includes('@');

  const toggleCategory = (id) =>
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValid) return;
          onSubmit({ fullName: fullName.trim(), group: group.trim(), categories, email: email.trim() });
        }}
      >
        <div>
          <FieldLabel>ФИО</FieldLabel>
          <TextInput placeholder="Иванов Иван Иванович" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <FieldLabel>Группа</FieldLabel>
          {/* input + datalist: можно ввести новую группу или выбрать существующую */}
          <TextInput list="group-options" placeholder="10-116" value={group} onChange={(e) => setGroup(e.target.value)} />
          <datalist id="group-options">
            {groupOptions.map((g) => <option key={g} value={g} />)}
          </datalist>
        </div>

        <div>
          <FieldLabel>Категории</FieldLabel>
          <div className="flex flex-wrap gap-4">
            {CATEGORIES.map((category) => {
              const isSelected = categories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`rounded-full text-sm leading-[120%] transition-colors ${isSelected ? 'border px-3 py-1' : 'px-0 py-1'}`}
                  style={{
                    color: category.stroke,
                    borderColor: isSelected ? category.stroke : 'transparent',
                    backgroundColor: isSelected ? category.fill : 'transparent',
                  }}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput type="email" placeholder="student@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="mt-1 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">
            Отмена
          </button>
          <button type="submit" disabled={!isValid} className={`h-11 rounded-lg text-sm font-medium transition-colors ${isValid ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/20 text-gray'}`}>
            {submitLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ---------- Страница ---------- */

const DashboardStudent = () => {
  // Backend ещё не подключён: список пустой, все действия работают локально
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [page, setPage] = useState(1);

  // 'add' | { type: 'edit', student } | { type: 'delete', student } | 'upload' | null
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  /* Опции фильтров появляются только когда в данных есть значения */
  const groupOptions = useMemo(() => [...new Set(students.map((s) => s.group))], [students]);
  const categoryOptions = useMemo(() => [...new Set(students.flatMap((s) => s.categories))], [students]);
  const activityOptions = useMemo(() => [...new Set(students.map((s) => activityLabel(s.lastActivity)))], [students]);

  /* Фильтрация + поиск */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        query === '' ||
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesGroup = filterGroup === 'all' || student.group === filterGroup;
      const matchesCategory = filterCategory === 'all' || student.categories.includes(filterCategory);
      const matchesActivity = filterActivity === 'all' || activityLabel(student.lastActivity) === filterActivity;
      return matchesSearch && matchesGroup && matchesCategory && matchesActivity;
    });
  }, [students, search, filterGroup, filterCategory, filterActivity]);

  /* Пагинация */
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getPageList = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '…', total];
    if (current >= total - 2) return [1, '…', total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  };

  /* Действия */
  const handleAdd = (data) => {
    const now = new Date();
    setStudents((prev) => [...prev, { id: Date.now(), ...data, registeredAt: now, lastActivity: now }]);
    setModal(null);
  };

  const handleEdit = (studentId, data) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...data } : s)));
    setModal(null);
    showToast('Изменения применены');
  };

  const handleDelete = (studentId) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setModal(null);
    showToast('Студент удален');
  };

  const selectClass =
    'h-10 appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-gray focus:border-black focus:outline-none';

  const SelectArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"><path d="M6 9l6 6 6-6" /></svg>
  );

  return (
    <div className="min-h-screen w-full bg-secondary flex">
      <AdminSidebar active="students" />

      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        {/* Заголовок */}
        <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">
          Студенты
        </h1>
        <p className="mt-1 text-sm leading-[120%] text-gray">Управление базой данных студентов</p>

        {/* Панель действий */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setModal('add')}
            className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Добавить студента
          </button>

          <button
            type="button"
            onClick={() => setModal('upload')}
            className="flex h-11 items-center gap-2 px-2 text-sm text-gray transition-colors hover:text-black"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V5 M8 8l4-4 4 4 M4 17v2h16v-2" /></svg>
            Загрузить список
          </button>

          {/* Поиск */}
          <div className="relative ml-auto w-full max-w-[280px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input
              type="text"
              placeholder="Поиск по ФИО или email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-black placeholder-gray focus:outline-none"
            />
          </div>
        </div>

        {/* Фильтры */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="relative w-full max-w-[240px]">
            <select value={filterGroup} onChange={(e) => { setFilterGroup(e.target.value); setPage(1); }} className={`${selectClass} w-full`}>
              <option value="all">Группа: Все</option>
              {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <SelectArrow />
          </div>
          <div className="relative w-full max-w-[240px]">
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className={`${selectClass} w-full`}>
              <option value="all">Категории: Все</option>
              {categoryOptions.map((c) => {
                const category = CATEGORIES.find((item) => item.id === c);
                return <option key={c} value={c}>{category?.label}</option>;
              })}
            </select>
            <SelectArrow />
          </div>
          <div className="relative w-full max-w-[240px]">
            <select value={filterActivity} onChange={(e) => { setFilterActivity(e.target.value); setPage(1); }} className={`${selectClass} w-full`}>
              <option value="all">Активность: Все</option>
              {activityOptions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <SelectArrow />
          </div>
        </div>

        {/* Таблица */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-gray/10">
                {['ФИО', 'Группа', 'Активность', 'Категории', 'E-mail', 'Дата регистрации', 'Действия'].map((head) => (
                  <th key={head} className="px-4 py-3 text-sm font-medium text-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray">
                    Список пуст — добавьте первого студента или загрузите список
                  </td>
                </tr>
              ) : (
                pageItems.map((student) => (
                  <tr key={student.id} className="border-b border-gray/10">
                    <td className="px-4 py-4 text-sm text-black">{student.fullName}</td>
                    <td className="px-4 py-4 text-sm text-black">{student.group}</td>
                    <td className="px-4 py-4 text-sm text-black">{activityLabel(student.lastActivity)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {student.categories.map((c) => <CategoryBadge key={c} categoryId={c} />)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-black">{student.email}</td>
                    <td className="px-4 py-4 text-sm text-black">{formatDate(student.registeredAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label="Редактировать" className="text-gray transition-colors hover:text-black" onClick={() => setModal({ type: 'edit', student })}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /></svg>
                        </button>
                        <button type="button" aria-label="Сбросить попытку" className="text-black" onClick={() => { /* TODO: сброс попытки получения питания */ }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6 M20 4v4h-4" /></svg>
                        </button>
                        <button type="button" aria-label="Удалить" className="text-[#F24444]" onClick={() => setModal({ type: 'delete', student })}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16 M9 7V5h6v2 M6 7l1 13h10l1-13 M10 11v6 M14 11v6" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {filtered.length > 0 && (
          <>
            <p className="mt-4 text-sm text-black">
              Показано {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length} студентов
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button type="button" aria-label="Назад" disabled={safePage === 1} className="p-2 text-black disabled:opacity-30" onClick={() => setPage(safePage - 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {getPageList(safePage, pageCount).map((item, index) =>
                item === '…' ? (
                  <span key={`e-${index}`} className="px-2 text-sm text-gray">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-10 w-10 rounded-lg text-sm ${item === safePage ? 'bg-accent font-medium text-black' : 'text-black hover:bg-gray/10'}`}
                  >
                    {item}
                  </button>
                )
              )}
              <button type="button" aria-label="Вперед" disabled={safePage === pageCount} className="p-2 text-black disabled:opacity-30" onClick={() => setPage(safePage + 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* ---------- Модальные окна ---------- */}

      {modal === 'add' && (
        <StudentFormModal
          title="Добавить студента"
          submitLabel="Добавить"
          groupOptions={groupOptions}
          onClose={() => setModal(null)}
          onSubmit={handleAdd}
        />
      )}

      {modal?.type === 'edit' && (
        <StudentFormModal
          title="Изменить данные"
          submitLabel="Сохранить"
          initial={modal.student}
          groupOptions={groupOptions}
          onClose={() => setModal(null)}
          onSubmit={(data) => handleEdit(modal.student.id, data)}
        />
      )}

      {modal?.type === 'delete' && (
        <ModalShell title="Удалить аккаунт студента?" onClose={() => setModal(null)}>
          <p className="mt-4 text-sm leading-[120%] text-gray">
            {modal.student.fullName} будет удален из базы безвозвратно.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setModal(null)} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">
              Отменить
            </button>
            <button type="button" onClick={() => handleDelete(modal.student.id)} className="h-11 rounded-lg bg-[#F24444] text-sm font-medium text-primary">
              Удалить
            </button>
          </div>
        </ModalShell>
      )}

      {modal === 'upload' && <UploadModal onClose={() => setModal(null)} />}

      {/* Тост внизу по центру */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm text-primary shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

/* ---------- Модалка импорта Excel ---------- */

const UploadModal = ({ onClose }) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = React.useRef(null);

  const acceptFile = (file) => {
    if (!file) return;
    const isExcel = /\.(xlsx|xls)$/.test(file.name);
    if (!isExcel) {
      setError('Можно загрузить только файл Excel (.xlsx, .xls)');
      setFileName('');
      return;
    }
    setError('');
    setFileName(file.name);
  };

  return (
    <ModalShell title="Загрузить список студентов" onClose={onClose}>
      {/* Зона drag-and-drop */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className="mt-6 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-accent px-6 py-10"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
          <path d="M7 16a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 8.5 4 4 0 0 1 18 16 M12 12v7 M9 15l3-3 3 3" />
        </svg>
        {fileName ? (
          <p className="text-sm font-medium text-black">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-black">Перетащите файл сюда</p>
            <p className="text-xs text-gray">или нажмите, чтобы выбрать файл</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-xs text-[#F24444]">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">
          Отмена
        </button>
        <button
          type="button"
          disabled={fileName === ''}
          onClick={() => {
            // TODO: отправка файла на backend для парсинга (структура согласуется позже)
            onClose();
          }}
          className={`h-11 rounded-lg text-sm font-medium transition-colors ${fileName ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/20 text-gray'}`}
        >
          Подтвердить импорт
        </button>
      </div>
    </ModalShell>
  );
};

export default DashboardStudent;