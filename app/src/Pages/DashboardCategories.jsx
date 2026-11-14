import React, { useMemo, useState, useEffect } from 'react';
import api from '../api/client';
import AdminSidebar from '../components/AdminSidebar';

const PAGE_SIZE = 25;

/* ---------- Мелкие UI-кусочки ---------- */

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

/* ---------- Модалка добавления / редактирования категории ---------- */

const CategoryFormModal = ({ mode, initial, existingNames, onClose, onSubmit, loading }) => {
  const isAdd = mode === 'add';
  const [name, setName] = useState(initial?.name ?? '');

  const trimmed = name.trim();
  const isDuplicate =
    trimmed !== '' &&
    existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase() && n !== initial?.name);
  const isValid = trimmed !== '' && !isDuplicate;

  return (
    <ModalShell title={isAdd ? 'Добавить категорию питания' : 'Изменить категорию питания'} onClose={onClose}>
      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValid && !loading) return;
          onSubmit({ name: trimmed });
        }}
      >
        <div>
          <FieldLabel>Название категории</FieldLabel>
          <TextInput
            placeholder="Проживание в общежитии"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {isDuplicate && (
            <p className="mt-2 text-xs text-[#F24444]">Категория с таким названием уже существует</p>
          )}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">
            Отмена
          </button>
          <button type="submit" disabled={!isValid || loading} className={`h-11 rounded-lg text-sm font-medium transition-colors ${isValid && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/20 text-gray'}`}>
            {loading ? 'Загрузка...' : (isAdd ? 'Добавить' : 'Изменить и сохранить')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ---------- Страница ---------- */

const DashboardCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Ошибка загрузки категорий', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  /* Поиск по названию категории */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === '') return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, search]);

  /* Пагинация */
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Действия */
  const handleAdd = async ({ name }) => {
    setActionLoading(true);
    try {
      await api.post('/admin/categories/', { name });
      showToast('Категория добавлена');
      setModal(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка добавления');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (id, { name }) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/categories/${id}/`, { name });
      showToast('Изменения применены');
      setModal(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка редактирования');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/categories/${id}/`);
      showToast('Категория удалена');
      setModal(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    } finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex">
      <AdminSidebar active="categories" />

      <main className="flex-1 overflow-x-hidden px-5 py-8 laptop:px-10">
        <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[40px] desktop:text-[32px]">
          Категории питания
        </h1>
        <p className="mt-1 text-sm leading-[120%] text-gray">Управление базой данных категорий питания</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setModal('add')}
            className="flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Добавить категорию
          </button>

          <div className="relative ml-auto w-full max-w-[320px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input
              type="text"
              placeholder="Поиск по категории питания"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-black placeholder-gray focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-gray/10">
                {['Название категории', 'Количество студентов', 'Действия'].map((head) => (
                  <th key={head} className="px-4 py-3 text-sm font-medium text-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-16 text-center text-sm text-gray">Загрузка...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-16 text-center text-sm text-gray">
                    {categories.length === 0 ? 'Список пуст — добавьте первую категорию' : 'Ничего не найдено по вашему запросу'}
                  </td>
                </tr>
              ) : (
                pageItems.map((category) => (
                  <tr key={category.id} className="border-b border-gray/10">
                    <td className="px-4 py-4 text-sm text-black">{category.name}</td>
                    <td className="px-4 py-4 text-sm text-black">{category.count}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label="Редактировать" className="text-gray transition-colors hover:text-black" onClick={() => setModal({ type: 'edit', category })}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /></svg>
                        </button>
                        <button type="button" aria-label="Удалить" className="text-[#F24444]" onClick={() => setModal({ type: 'delete', category })}>
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
      </main>

      {/* Модалки */}
      {modal === 'add' && (
        <CategoryFormModal mode="add" existingNames={categories.map((c) => c.name)} onClose={() => setModal(null)} onSubmit={handleAdd} loading={actionLoading} />
      )}
      {modal?.type === 'edit' && (
        <CategoryFormModal mode="edit" initial={modal.category} existingNames={categories.map((c) => c.name)} onClose={() => setModal(null)} onSubmit={(data) => handleEdit(modal.category.id, data)} loading={actionLoading} />
      )}
      {modal?.type === 'delete' && (
        <ModalShell title="Удалить категорию питания?" onClose={() => setModal(null)}>
          <p className="mt-4 text-sm leading-[120%] text-gray">
            Категория «{modal.category.name}» будет удалена из базы безвозвратно.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setModal(null)} className="h-11 rounded-lg bg-gray/10 text-sm text-gray transition-colors hover:text-black">Отменить</button>
            <button type="button" disabled={actionLoading} onClick={() => handleDelete(modal.category.id)} className="h-11 rounded-lg bg-[#F24444] text-sm font-medium text-primary">{actionLoading ? '...' : 'Удалить'}</button>
          </div>
        </ModalShell>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-sm text-primary shadow-lg">{toast}</div>
      )}
    </div>
  );
};

export default DashboardCategories;