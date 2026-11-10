import React, { createContext, useState, useEffect } from 'react';
import api from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При перезагрузке страницы проверяем: не залогинен ли уже юзер?
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me/');
          setUser(res.data); // Сохраняем данные юзера (email, role)
        } catch (err) {
          console.error('Ошибка авторизации', err);
        }
      }
      setLoading(false); // Загрузка завершена
    };
    checkAuth();
  }, []);

  // Функция вызывается после успешного ввода 2FA кода
  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setUser(data.user); // data.user приходит с бэкенда
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // Пока проверяем токен — показываем "Загрузку", чтобы не мигали экраны
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};