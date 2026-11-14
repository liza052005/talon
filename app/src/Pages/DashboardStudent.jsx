import React, { useMemo, useState, useEffect } from 'react';
import api from '../api/client';
import AdminSidebar from '../components/AdminSidebar';

// ВАЖНО: ID здесь должны совпадать с ID в твоей базе данных!
const CATEGORIES = [
  { id: 1, label: 'Общежитие', stroke: '#FF6C71', fill: 'rgba(255, 108, 113, 0.1)' },
  { id: 2, label: 'Соцгруппа', stroke: '#23D966', fill: 'rgba(108, 255, 162, 0.1)' },
  { id: 3, label: 'Специальность', stroke: '#846CFF', fill: 'rgba(132, 108, 255, 0.1)' },
];

const PAGE_SIZE = 25;

const formatDate = (date) => {
  if (!date || isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
};

const activityLabel = (date) => {
  if (!date || isNaN(date.getTime())) return '-';
  const today = new Date();
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (diff <= 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  return `${diff} дней назад`;
};

const CategoryBadge = ({ categoryId }) => {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;
  return (
    <span className="rounded-full border px-3 py-1 text-sm leading-[120%]"
      style={{ borderColor: category.stroke, color: category.stroke, backgroundColor: category.fill }}>
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

const FieldLabel = ({ children }) => <p className="mb-2 text-sm font-medium text-black">{children}</p>;

const TextInput = (props) => (
  <input {...props} className="h-11 w-full rounded-lg border border-gray/40 bg-transparent px-4 text-sm text-black placeholder-gray focus:border-black focus:outline-none" />
);

const StudentFormModal = ({ title, submitLabel, initial, groupOptions, onClose, onSubmit, loading }) => {
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [categories, setCategories] = useState(initial?.categories ?? []);
  const [email, setEmail] = useState(initial?.email === '—' ? '' : initial?.email ?? '');
  
  const isRegistered = initial?.isRegistered;
  const isValid = fullName.trim() !== '' && group.trim() !== '' && (!isRegistered || email.includes('@'));

  const toggleCategory = (id) =>
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <ModalShell title={title} onClose={onClose}>
      <form className="mt-6 flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (isValid && !loading) onSubmit({ fullName: fullName.trim(), group: group.trim(), categories, email: email.trim() }); }}>
        <div>
          <FieldLabel>ФИО</FieldLabel>
          <TextInput placeholder="Иванов Иван Иванович" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <FieldLabel>Группа</FieldLabel>
          <TextInput list="group-options" placeholder="10-116" value={group} onChange={(e) => setGroup(e.target.value)} />
          <datalist id="group-options">
            {groupOptions.map((g) => <option key={g} value={g} />)}
          </datalist>
        </div>

        <div>
          <FieldLabel>Категории</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => {
              const isSelected = categories.includes(category.id);
              return (
                <button key={category.id} type="button" onClick={() => toggleCategory(category.id)} className="rounded-full border px-4 py-2 text-sm leading-[120%] transition-colors"
                  style={{ borderColor: category.stroke, color: isSelected ? '#FFFFFF' : category.stroke, backgroundColor: isSelected ? category.stroke : 'transparent' }}>
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {isRegistered ? (
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput type="email" placeholder="student@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">Студент укажет свой email при регистрации.</div>
        )}

        <div className="mt-1 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отмена</button>
          <button type="submit" disabled={!isValid || loading} className={`h-11 rounded-lg text-sm font-medium transition-colors ${isValid && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/20 text-gray'}`}>
            {loading ? 'Загрузка...' : submitLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DashboardStudent = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students/');
      const formatted = res.data.map(s => ({
        id: s.id,
        fullName: s.full_name,
        group: s.group,
        email: s.email || '—',
        categories: s.categories || [], 
        lastActivity: new Date(), 
        registeredAt: new Date(s.registered_at),
        isRegistered: s.is_registered
      }));
      setStudents(formatted);
    } catch (err) {
      console.error('Ошибка загрузки студентов', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => { setToast(message); setTimeout(() => setToast(null), 3000); };

  const groupOptions = useMemo(() => [...new Set(students.map((s) => s.group))], [students]);
  const categoryOptions = useMemo(() => [...new Set(students.flatMap((s) => s.categories))], [students]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = query === '' || student.fullName.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
      const matchesGroup = filterGroup === 'all' || student.group === filterGroup;
      const matchesCategory = filterCategory === 'all' || student.categories.includes(Number(filterCategory));
      return matchesSearch && matchesGroup && matchesCategory;
    });
  }, [students, search, filterGroup, filterCategory]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getPageList = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '…', total];
    if (current >= total - 2) return [1, '…', total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  };

  const handleAdd = async (data) => {
    setActionLoading(true);
    try {
      await api.post('/admin/students/create/', {
        fullName: data.fullName,
        group: data.group,
        categories: data.categories, 
      });
      showToast('Студент добавлен');
      setModal(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка добавления');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (id, data) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/students/${id}/`, {
        fullName: data.fullName,
        group: data.group,
        categories: data.categories,
        email: data.email,
      });
      showToast('Изменения применены');
      setModal(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка редактирования');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/students/${id}/`);
      showToast('Студент удален');
      setModal(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    } finally { setActionLoading(false); }
  };

  const handleReset = async (id) => {
    try {
      await api.post(`/admin/students/${id}/reset/`);
      showToast('Попытка получения сброшена');
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка сброса');
    }
  };

  const selectClass = 'h-10 appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-gray focus:border-black focus:outline-none';
  const SelectArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"><path d="M6 9l6 6 6-6" /></svg>
  );

  return (
    <div className="min-h-screen w-full bg-secondary flex">
      <AdminSidebar active="students" />
      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">Студенты</h1>
        <p className="mt-1 text-sm leading-[120%] text-gray">Управление базой данных студентов</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setModal('add')} className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Добавить студента
          </button>
          <div className="relative ml-auto w-full max-w-[280px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="text" placeholder="Поиск по ФИО или email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-black placeholder-gray focus:outline-none" />
          </div>
        </div>

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
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <SelectArrow />
          </div>
        </div>

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
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray">Загрузка...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray">Список пуст</td></tr>
              ) : (
                pageItems.map((student) => (
                  <tr key={student.id} className="border-b border-gray/10">
                    <td className="px-4 py-4 text-sm text-black">{student.fullName}</td>
                    <td className="px-4 py-4 text-sm text-black">{student.group}</td>
                    <td className="px-4 py-4 text-sm text-black">
                      {student.isRegistered ? activityLabel(student.lastActivity) : <span className="text-gray-400">Ожидает регистрации</span>}
                    </td>
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
                        {student.isRegistered && (
                          <button type="button" aria-label="Сбросить попытку" className="text-black" onClick={() => handleReset(student.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6 M20 4v4h-4" /></svg>
                          </button>
                        )}
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

        {filtered.length > 0 && (
          <>
            <p className="mt-4 text-sm text-black">Показано {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length} студентов</p>
            <div className="mt-4 flex items-center gap-2">
              <button type="button" aria-label="Назад" disabled={safePage === 1} className="p-2 text-black disabled:opacity-30" onClick={() => setPage(safePage - 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {getPageList(safePage, pageCount).map((item, index) => item === '…' ? <span key={`e-${index}`} className="px-2 text-sm text-gray">…</span> : (
                <button key={item} type="button" onClick={() => setPage(item)} className={`h-10 w-10 rounded-lg text-sm ${item === safePage ? 'bg-accent font-medium text-black' : 'text-black hover:bg-gray/10'}`}>{item}</button>
              ))}
              <button type="button" aria-label="Вперед" disabled={safePage === pageCount} className="p-2 text-black disabled:opacity-30" onClick={() => setPage(safePage + 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </>
        )}
      </main>

      {modal === 'add' && <StudentFormModal title="Добавить студента" submitLabel="Добавить" groupOptions={groupOptions} onClose={() => setModal(null)} onSubmit={handleAdd} loading={actionLoading} />}
      {modal?.type === 'edit' && <StudentFormModal title="Изменить данные" submitLabel="Сохранить" initial={modal.student} groupOptions={groupOptions} onClose={() => setModal(null)} onSubmit={(data) => handleEdit(modal.student.id, data)} loading={actionLoading} />}
      
      {modal?.type === 'delete' && (
        <ModalShell title="Удалить аккаунт студента?" onClose={() => setModal(null)}>
          <p className="mt-4 text-sm leading-[120%] text-gray">{modal.student.fullName} будет удален из базы безвозвратно.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setModal(null)} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отменить</button>
            <button type="button" disabled={actionLoading} onClick={() => handleDelete(modal.student.id)} className="h-11 rounded-lg bg-[#F24444] text-sm font-medium text-primary">{actionLoading ? '...' : 'Удалить'}</button>
          </div>
        </ModalShell>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm text-primary shadow-lg">{toast}</div>}
    </div>
  );
};

export default DashboardStudent;