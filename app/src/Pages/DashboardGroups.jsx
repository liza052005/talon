import React, { useMemo, useState, useEffect, useRef } from 'react';
import api from '../api/client';
import AdminSidebar from '../components/AdminSidebar';

const PAGE_SIZE = 25;

const STATUS = {
  study: { label: 'На учебе', stroke: '#23D966', fill: 'rgba(108, 255, 162, 0.1)' },
  practice: { label: 'На практике', stroke: '#FF6C71', fill: 'rgba(255, 108, 113, 0.1)' },
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

const StatusBadge = ({ status }) => {
  const current = STATUS[status];
  if (!current) return null;
  return (
    <span className="rounded-full border px-3 py-1 text-sm leading-[120%]"
      style={{ borderColor: current.stroke, color: current.stroke, backgroundColor: current.fill }}>
      {current.label}
    </span>
  );
};

const GroupFormModal = ({ mode, initial, onClose, onSubmit, loading }) => {
  const isAdd = mode === 'add';
  const [number, setNumber] = useState(initial?.number ?? '');
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '');
  const [count, setCount] = useState(initial ? String(initial.studentsCount) : '0');
  const [status, setStatus] = useState(initial?.status ?? 'study');
  const [curator, setCurator] = useState(initial?.curator ?? '');

  const isValid = number.trim() !== '' && count.trim() !== '' && curator.trim() !== '';

  const step = (delta) => {
    const current = parseInt(count, 10);
    const next = Number.isNaN(current) ? (delta > 0 ? 1 : 0) : Math.max(0, current + delta);
    setCount(String(next));
  };

  return (
    <ModalShell title={isAdd ? 'Добавить группу' : 'Изменить данные группы'} onClose={onClose}>
      <form className="mt-6 flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (isValid && !loading) onSubmit({ number, specialty, studentsCount: parseInt(count, 10), status, curator }); }}>
        <div>
          <FieldLabel>Номер группы</FieldLabel>
          <TextInput placeholder="10-116" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Специальность</FieldLabel>
          <TextInput placeholder="Мехатроника и робототехника" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Кол-во студентов</FieldLabel>
          <div className="flex h-11 items-center rounded-lg border border-gray/40 pl-4 pr-3 focus-within:border-black">
            <input inputMode="numeric" placeholder="24" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-sm text-black placeholder-gray focus:outline-none" />
            <div className="flex items-center gap-2 text-gray">
              <button type="button" aria-label="Уменьшить" onClick={() => step(-1)} className="p-1 transition-colors hover:text-black"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
              <button type="button" aria-label="Увеличить" onClick={() => step(1)} className="p-1 transition-colors hover:text-black"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
            </div>
          </div>
        </div>
        <div>
          <FieldLabel>Статус группы</FieldLabel>
          <div className="flex gap-3">
            {Object.entries(STATUS).map(([id, current]) => {
              const isSelected = status === id;
              return (
                <button key={id} type="button" onClick={() => setStatus(id)} className={`rounded-full border px-4 py-2 text-sm leading-[120%] transition-colors ${isSelected ? 'font-medium' : ''}`}
                  style={{ borderColor: current.stroke, color: isSelected ? '#FFFFFF' : current.stroke, backgroundColor: isSelected ? current.stroke : 'transparent' }}>
                  {current.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel>Куратор</FieldLabel>
          <TextInput placeholder="Иванов Иван Иванович" value={curator} onChange={(e) => setCurator(e.target.value)} />
        </div>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отмена</button>
          <button type="submit" disabled={!isValid || loading} className={`h-11 rounded-lg text-sm font-medium transition-colors ${isValid && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/20 text-gray'}`}>
            {loading ? 'Загрузка...' : (isAdd ? 'Добавить' : 'Изменить и сохранить')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const DashboardGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/admin/groups/');
      setGroups(res.data);
    } catch (err) {
      console.error('Ошибка загрузки групп', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => { setToast(message); setTimeout(() => setToast(null), 3000); };

  const numberOptions = useMemo(() => [...new Set(groups.map((g) => g.number))], [groups]);
  const activityOptions = useMemo(() => [...new Set(groups.map((g) => STATUS[g.status]?.label))].filter(Boolean), [groups]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesSearch = query === '' || group.number.toLowerCase().includes(query) || group.curator.toLowerCase().includes(query);
      const matchesGroup = filterGroup === 'all' || group.number === filterGroup;
      const matchesActivity = filterActivity === 'all' || STATUS[group.status]?.label === filterActivity;
      return matchesSearch && matchesGroup && matchesActivity;
    });
  }, [groups, search, filterGroup, filterActivity]);

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
      await api.post('/admin/groups/', data);
      showToast('Группа добавлена');
      setModal(null);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка добавления');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (id, data) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/groups/${id}/`, data);
      showToast('Изменения применены');
      setModal(null);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка редактирования');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/groups/${id}/`);
      showToast('Группа удалена');
      setModal(null);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    } finally { setActionLoading(false); }
  };

  const selectClass = 'h-10 w-full appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-gray focus:border-black focus:outline-none';
  const SelectArrow = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"><path d="M6 9l6 6 6-6" /></svg>
  );

  return (
    <div className="min-h-screen w-full bg-secondary flex">
      <AdminSidebar active="groups" />
      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">Группы</h1>
        <p className="mt-1 text-sm leading-[120%] text-gray">Управление базой данных групп</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setModal('add')} className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Добавить группу
          </button>
          <div className="relative ml-auto w-full max-w-[320px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input type="text" placeholder="Поиск по №группы или по куратору" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-black placeholder-gray focus:outline-none" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="relative w-full max-w-[240px]">
            <select value={filterGroup} onChange={(e) => { setFilterGroup(e.target.value); setPage(1); }} className={selectClass}>
              <option value="all">Группа: Все</option>
              {numberOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <SelectArrow />
          </div>
          <div className="relative w-full max-w-[240px]">
            <select value={filterActivity} onChange={(e) => { setFilterActivity(e.target.value); setPage(1); }} className={selectClass}>
              <option value="all">Активность: Все</option>
              {activityOptions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <SelectArrow />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-gray/10">
                {['Номер группы и специальности', 'Количество студентов', 'Статус', 'Куратор', 'Действия'].map((head) => (
                  <th key={head} className="px-4 py-3 text-sm font-medium text-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-gray">Загрузка...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-gray">Список пуст</td></tr>
              ) : (
                pageItems.map((group) => (
                  <tr key={group.id} className="border-b border-gray/10">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 rounded-lg bg-gray/15 px-3 py-1 text-sm text-black">{group.number}</span>
                        <span className="text-sm text-black">{group.specialty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-black">{group.studentsCount}</td>
                    <td className="px-4 py-4"><StatusBadge status={group.status} /></td>
                    <td className="px-4 py-4 text-sm text-black">{group.curator}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label="Редактировать" className="text-gray transition-colors hover:text-black" onClick={() => setModal({ type: 'edit', group })}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /></svg>
                        </button>
                        <button type="button" aria-label="Удалить" className="text-[#F24444]" onClick={() => setModal({ type: 'delete', group })}>
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
            <p className="mt-4 text-sm text-black">Показано {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length} групп</p>
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

      {modal === 'add' && <GroupFormModal mode="add" onClose={() => setModal(null)} onSubmit={handleAdd} loading={actionLoading} />}
      {modal?.type === 'edit' && <GroupFormModal mode="edit" initial={modal.group} onClose={() => setModal(null)} onSubmit={(data) => handleEdit(modal.group.id, data)} loading={actionLoading} />}
      
      {modal?.type === 'delete' && (
        <ModalShell title="Удалить группу?" onClose={() => setModal(null)}>
          <p className="mt-4 text-sm leading-[120%] text-gray">Группа {modal.group.number} будет удалена из базы безвозвратно.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setModal(null)} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отменить</button>
            <button type="button" disabled={actionLoading} onClick={() => handleDelete(modal.group.id)} className="h-11 rounded-lg bg-[#F24444] text-sm font-medium text-primary">{actionLoading ? '...' : 'Удалить'}</button>
          </div>
        </ModalShell>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm text-primary shadow-lg">{toast}</div>}
    </div>
  );
};

export default DashboardGroups;