import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../store/AuthContext';
import AdminSidebar from '../components/AdminSidebar';

const PAGE_SIZE = 25;

/* Роли сотрудников и их цвета (stroke / fill 10%) */
const ROLES = [
  { id: 'admin', label: 'Админ', stroke: '#FF6C71', fill: 'rgba(255, 108, 113, 0.1)' },
  { id: 'canteen', label: 'Сотрудник выдачи', stroke: '#23D966', fill: 'rgba(108, 255, 162, 0.1)' },
  { id: 'moderator', label: 'Модератор', stroke: '#846CFF', fill: 'rgba(132, 108, 255, 0.1)' },
];

/* ---------- UI компоненты ---------- */

const RoleBadge = ({ roleId }) => {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return <span className="text-sm text-gray">{roleId}</span>;
  return (
    <span
      className="inline-block rounded-full border px-3 py-1 text-sm leading-[120%]"
      style={{ borderColor: role.stroke, color: role.stroke, backgroundColor: role.fill }}
    >
      {role.label}
    </span>
  );
};

const ModalShell = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#676565]/40 px-5">
    <div className="w-full max-w-[420px] rounded-2xl bg-primary p-6 shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl leading-[105%] font-semibold text-black laptop:text-[32px]">{title}</h2>
        <button 
          type="button" 
          aria-label="Закрыть" 
          onClick={onClose} 
          className="p-1 text-gray hover:text-black transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="mb-2 block text-sm font-medium text-black">{children}</label>
);

const TextInput = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`h-11 w-full rounded-lg border border-gray/40 bg-transparent px-4 text-sm text-black placeholder-gray focus:border-black focus:outline-none transition-colors ${className}`}
  />
);

/* ---------- Модалка добавления / редактирования ---------- */

const StaffFormModal = ({ mode, initial, onClose, onSubmit }) => {
  const isAdd = mode === 'add';

  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState(initial?.role ?? 'canteen');
  const [password, setPassword] = useState(initial?.password ?? '');

  const isValid =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    email.includes('@') &&
    (isAdd ? password.trim() !== '' : true);

  return (
    <ModalShell title={isAdd ? 'Добавить сотрудника' : 'Изменить данные'} onClose={onClose}>
      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValid) return;
          onSubmit({ fullName: fullName.trim(), email: email.trim(), role, password });
        }}
      >
        <div>
          <FieldLabel>ФИО</FieldLabel>
          <TextInput
            placeholder="Иванова Марина Ивановна"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            type="email"
            placeholder="i.ivanova@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <FieldLabel>Роль</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {ROLES.map((current) => {
              const isSelected = role === current.id;
              return (
                <button
                  key={current.id}
                  type="button"
                  onClick={() => setRole(current.id)}
                  className="rounded-full border px-4 py-2 text-sm leading-[120%] transition-all"
                  style={{
                    borderColor: current.stroke,
                    color: isSelected ? '#FFFFFF' : current.stroke,
                    backgroundColor: isSelected ? current.stroke : 'transparent',
                  }}
                >
                  {current.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>
            {isAdd ? 'Пароль для входа' : 'Новый пароль (оставьте пустым, чтобы не менять)'}
          </FieldLabel>
          <TextInput
            type="text"
            placeholder={isAdd ? 'qwerty123' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mt-1 grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            disabled={!isValid} 
            className={`h-11 rounded-lg text-sm font-medium transition-colors ${
              isValid 
                ? 'bg-accent text-black hover:bg-accent/90' 
                : 'cursor-not-allowed bg-gray/20 text-gray'
            }`}
          >
            {isAdd ? 'Добавить' : 'Изменить и сохранить'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ---------- Основная страница ---------- */

const AdminStaff = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [staff, setStaff] = useState([]); // ← список пустой
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  /* Загрузка списка сотрудников (пока отключено — backend не готов) */
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff/');
      setStaff(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('У вас нет прав для просмотра этой страницы.');
      } else {
        setError('Не удалось загрузить список сотрудников.');
      }
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchStaff();
  // }, []);

  /* Опции фильтра появляются только при наличии данных */
  const roleOptions = useMemo(() => [...new Set(staff.map((m) => m.role))], [staff]);

  /* Поиск + фильтр */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((m) => {
      const full = `${m.last_name ?? ''} ${m.first_name ?? ''}`.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        full.includes(query) ||
        (m.email ?? '').toLowerCase().includes(query);
      const matchesRole = filterRole === 'all' || m.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, filterRole]);

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

  /* Вспомогательные функции */
  const getFullName = (s) => `${s.last_name ?? ''} ${s.first_name ?? ''}`.trim();

  /* CRUD операции */
  const handleSave = async (data) => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/auth/staff/${modal.member.id}/`, data);
        showToast('Изменения применены');
      } else {
        await api.post('/auth/staff/', data);
        showToast('Сотрудник добавлен');
      }
      setModal(null);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (memberId) => {
    try {
      await api.delete(`/auth/staff/${memberId}/`);
      setModal(null);
      fetchStaff();
      showToast('Сотрудник удален');
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const selectClass =
    'h-10 w-full appearance-none rounded-lg border border-gray/40 bg-transparent pl-4 pr-9 text-sm text-gray focus:border-black focus:outline-none transition-colors';

  const SelectArrow = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-secondary flex">
      <AdminSidebar active="staff" onLogout={handleLogout} />

      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">
          Сотрудники
        </h1>
        <p className="mt-1 text-sm leading-[120%] text-gray">Управление доступом сотрудников</p>

        {/* Ошибка загрузки */}
        {error && (
          <div className="mt-4 rounded-xl border border-[rgba(242,68,68,0.3)] bg-[rgba(242,68,68,0.08)] p-4 text-sm text-[#F24444]">
            {error}
          </div>
        )}

        {/* Панель действий */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setModal({ type: 'add' })}
            className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black transition-colors hover:bg-accent/90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить сотрудника
          </button>

          {/* Поиск */}
          <div className="relative ml-auto w-full max-w-[320px]">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по сотруднику"
              value={search}
              onChange={(e) => { 
                setSearch(e.target.value); 
                setPage(1); 
              }}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-black placeholder-gray focus:outline-none"
            />
          </div>
        </div>

        {/* Фильтр по роли */}
        {staff.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="relative w-full max-w-[240px]">
              <select 
                value={filterRole} 
                onChange={(e) => { 
                  setFilterRole(e.target.value); 
                  setPage(1); 
                }} 
                className={selectClass}
              >
                <option value="all">Роль: Все</option>
                {roleOptions.map((r) => {
                  const role = ROLES.find((item) => item.id === r);
                  return <option key={r} value={r}>{role?.label ?? r}</option>;
                })}
              </select>
              <SelectArrow />
            </div>
          </div>
        )}

        {/* Таблица */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[800px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-gray/10">
                {['ФИО', 'Логин (Email)', 'Роль', 'Действия'].map((head) => (
                  <th key={head} className="px-4 py-3 text-sm font-medium text-black first:rounded-l-lg last:rounded-r-lg">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-gray">
                    Загрузка...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm text-gray">
                    {staff.length === 0
                      ? 'Список пуст — добавьте первого сотрудника'
                      : 'Ничего не найдено по вашему запросу'}
                  </td>
                </tr>
              ) : (
                pageItems.map((member) => (
                  <tr key={member.id} className="border-b border-gray/10 hover:bg-gray/5 transition-colors">
                    <td className="px-4 py-4 text-sm text-black">{getFullName(member)}</td>
                    <td className="px-4 py-4 text-sm text-gray">{member.email}</td>
                    <td className="px-4 py-4">
                      <RoleBadge roleId={member.role} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Редактировать"
                          className="text-gray transition-colors hover:text-black"
                          onClick={() => setModal({ type: 'edit', member })}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                            <path d="M4 20l4-1L20 7l-3-3L5 16l-1 4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Удалить"
                          className="text-[#F24444] transition-colors hover:text-[#F24444]/80"
                          onClick={() => setModal({ type: 'delete', member })}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16 M9 7V5h6v2 M6 7l1 13h10l1-13 M10 11v6 M14 11v6" />
                          </svg>
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
        {filtered.length > 0 && !loading && (
          <>
            <p className="mt-4 text-sm text-black">
              Показано {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length} сотрудников
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button 
                type="button" 
                aria-label="Назад" 
                disabled={safePage === 1} 
                className="p-2 text-black disabled:opacity-30 transition-opacity" 
                onClick={() => setPage(safePage - 1)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              {getPageList(safePage, pageCount).map((item, index) =>
                item === '…' ? (
                  <span key={`e-${index}`} className="px-2 text-sm text-gray">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`h-10 w-10 rounded-lg text-sm transition-colors ${
                      item === safePage 
                        ? 'bg-accent font-medium text-black' 
                        : 'text-black hover:bg-gray/10'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
              <button 
                type="button" 
                aria-label="Вперед" 
                disabled={safePage === pageCount} 
                className="p-2 text-black disabled:opacity-30 transition-opacity" 
                onClick={() => setPage(safePage + 1)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Модальные окна */}
      {modal?.type === 'add' && (
        <StaffFormModal
          mode="add"
          initial={{ password: 'qwerty123', role: 'canteen' }}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
        />
      )}

      {modal?.type === 'edit' && (
        <StaffFormModal
          mode="edit"
          initial={{
            fullName: getFullName(modal.member),
            email: modal.member.email,
            role: modal.member.role,
            password: '',
          }}
          onClose={() => setModal(null)}
          onSubmit={handleSave}
        />
      )}

      {modal?.type === 'delete' && (
        <ModalShell title="Удалить аккаунт сотрудника?" onClose={() => setModal(null)}>
          <p className="mt-4 text-sm leading-[120%] text-gray">
            {getFullName(modal.member)} будет удален из базы безвозвратно.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setModal(null)} 
              className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black"
            >
              Отменить
            </button>
            <button 
              type="button" 
              onClick={() => handleDelete(modal.member.id)} 
              className="h-11 rounded-lg bg-[#F24444] text-sm font-medium text-primary transition-colors hover:bg-[#F24444]/90"
            >
              Удалить
            </button>
          </div>
        </ModalShell>
      )}

      {/* Тост */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm text-primary shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminStaff;