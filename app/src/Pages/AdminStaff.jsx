import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../store/AuthContext';

const AdminStaff = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext); // Добавили logout
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Добавили состояние ошибки
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'canteen' });

  const fetchStaff = async () => {
    try {
      const res = await api.get('/auth/staff/');
      setStaff(res.data);
      setError('');
    } catch (err) {
      // Если бэкенд вернул 403 — показываем текст, НЕ выкидываем на главную
      if (err.response?.status === 403) {
        setError('У вас нет прав для просмотра этой страницы (нужна роль Админ или Модератор).');
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

 

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/staff/', formData);
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', role: 'canteen' });
      fetchStaff(); // Обновляем список
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка');
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

        {/* ДОБАВЛЯЕМ КНОПКУ ВЫХОДА СЮДА */}
        <button 
          onClick={() => { logout(); navigate('/'); }} 
          className="mt-auto text-left px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
        >
          Выйти из аккаунта
        </button>
      </aside>
     
      

      {/* Контент */}
      <main className="flex-1 p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold mb-2">Сотрудники</h1>
          <p className="text-gray-500 mb-6">Управление доступом сотрудников</p>
          
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setIsModalOpen(true)} className="bg-[#88FF00] px-6 py-3 rounded-xl font-medium hover:bg-[#7AE600] transition-colors">
              + Добавить сотрудника
            </button>
            <div className="flex gap-4">
              <select className="border border-gray-200 rounded-xl px-4 py-2 bg-white outline-none">
                <option>Роль: Все</option>
                <option>Админ</option>
                <option>Модератор</option>
              </select>
              <input type="text" placeholder="Поиск по сотруднику" className="border border-gray-200 rounded-xl px-4 py-2 bg-white outline-none w-64" />
            </div>
          </div>

          {/* Таблица */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-normal">ФИО</th>
                  <th className="p-4 font-normal">Логин</th>
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
                      <button className="hover:text-black">✏️</button>
                      <button className="hover:text-black">🔄</button>
                      <button className="hover:text-red-500">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Модалка добавления */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Добавить сотрудника</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
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
              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-gray-300 rounded-xl py-3 font-medium hover:bg-gray-50">Отмена</button>
                <button type="submit" className="flex-1 bg-[#88FF00] rounded-xl py-3 font-medium hover:bg-[#7AE600]">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;