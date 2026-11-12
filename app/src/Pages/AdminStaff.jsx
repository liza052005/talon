import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../store/AuthContext';

const AdminStaff = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Добавили поле password в стейт
  const [formData, setFormData] = useState({ 
    lastName: '', 
    email: '', 
    role: 'canteen', 
    password: 'qwerty123' 
  });

  const fetchStaff = async () => {
    try {
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

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    // При создании ставим дефолтный пароль
    setFormData({ lastName: '', email: '', role: 'canteen', password: 'qwerty123' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingId(s.id);
    // При редактировании пароль пустой (чтобы не менять, если не ввели)
    setFormData({ 
      lastName: `${s.last_name} ${s.first_name}`.trim(), 
      email: s.email, 
      role: s.role,
      password: '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Если пароль пустой при редактировании, бэкенд его проигнорирует
        await api.put(`/auth/staff/${editingId}/`, formData);
      } else {
        await api.post('/auth/staff/', formData);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    try {
      await api.delete(`/auth/staff/${id}/`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="px-3 py-1 text-xs rounded-full border border-red-400 text-red-500">Админ</span>;
    if (role === 'canteen') return <span className="px-3 py-1 text-xs rounded-full border border-green-500 text-green-600">Сотрудник выдачи</span>;
    return <span className="px-3 py-1 text-xs rounded-full border border-purple-400 text-purple-500">Модератор</span>;
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      {/* Сайдбар */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M2 4 L22 12 L2 20 L8 12 Z" /></svg>
          <span className="text-xl font-bold">Талон</span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button className="text-left px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium">Студенты</button>
          <button className="text-left px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium">Группы</button>
          <button className="text-left px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium">Категории питания</button>
          <button className="text-left px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium">Отчеты</button>
          <button className="text-left px-4 py-3 bg-[#88FF00] text-black rounded-xl font-medium">Сотрудники</button>
        </nav>

        <button onClick={() => { logout(); navigate('/'); }} className="mt-auto text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors">
          Выйти из аккаунта
        </button>
      </aside>

      {/* Контент */}
      <main className="flex-1 p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold mb-2">Сотрудники</h1>
          <p className="text-gray-500 mb-6">Управление доступом сотрудников</p>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

          <div className="flex justify-between items-center mb-6">
            <button onClick={handleOpenCreate} className="bg-[#88FF00] px-6 py-3 rounded-xl font-medium hover:bg-[#7AE600] transition-colors">
              + Добавить сотрудника
            </button>
          </div>

          {/* Таблица */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-normal">ФИО</th>
                  <th className="p-4 font-normal">Логин (Email)</th>
                  <th className="p-4 font-normal">Роль</th>
                  <th className="p-4 font-normal text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="p-4">{s.last_name} {s.first_name}</td>
                    <td className="p-4 text-gray-500">{s.email}</td>
                    <td className="p-4">{getRoleBadge(s.role)}</td>
                    <td className="p-4 flex justify-end gap-3 text-gray-400">
                      <button onClick={() => handleOpenEdit(s)} className="hover:text-black" title="Редактировать">✏️</button>
                      <button onClick={() => handleDelete(s.id)} className="hover:text-red-500" title="Удалить">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Модалка добавления/редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {editingId ? 'Изменить данные' : 'Добавить сотрудника'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ФИО</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black" placeholder="Иванова Марина Ивановна" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black" placeholder="i.ivanova@gmail.com" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Роль</label>
                <div className="flex gap-2">
                  {['admin', 'canteen', 'moderator'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, role})}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${formData.role === role ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-600'}`}
                    >
                      {role === 'admin' ? 'Админ' : role === 'canteen' ? 'Сотрудник выдачи' : 'Модератор'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Поле пароля */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  {editingId ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль для входа'}
                </label>
                <input 
                  type="text" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black" 
                  placeholder={editingId ? "••••••••" : "qwerty123"} 
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-gray-300 rounded-xl py-3 font-medium hover:bg-gray-50">Отмена</button>
                <button type="submit" className="flex-1 bg-[#88FF00] rounded-xl py-3 font-medium hover:bg-[#7AE600]">
                  {editingId ? 'Изменить и сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;