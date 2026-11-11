import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; // Импортируем генератор QR
import api from '../api/client'; // Проверь путь!

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const getWeekDays = () => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const StaffQr = () => {
  const navigate = useNavigate();
  const today = new Date();
  const weekDays = getWeekDays();

  // Состояния для QR-кода и счетчика
  const [qrToken, setQrToken] = useState(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Оверлей успеха (пока оставим, логику выдачи на планшете подключим позже)
  const [issuedStudent, setIssuedStudent] = useState(null);

  // Функция получения нового токена
  const fetchNewToken = async () => {
    try {
      const res = await api.post('/qr/sessions/');
      setQrToken(res.data.token);
      setIssuedCount(res.data.issued_today);
      setError('');
    } catch (err) {
      setError('Ошибка обновления QR-кода');
      if (err.response?.status === 401) {
        navigate('/staff/login'); // Если токен протух — выкидываем на вход
      }
    } finally {
      setLoading(false);
    }
  };

  // Функция получения только счетчика (чтобы не спамить новыми токенами)
  const fetchStats = async () => {
    try {
      const res = await api.get('/qr/stats/today/');
      setIssuedCount(res.data.issued_today);
    } catch (err) {
      console.error('Не удалось обновить счетчик', err);
    }
  };

  useEffect(() => {
    // При монтировании сразу получаем токен
    fetchNewToken();

    // Обновляем токен каждые 2.5 минуты (150 000 мс), чтобы он не истекал (живет 3 мин)
    const tokenInterval = setInterval(fetchNewToken, 150000);

    // Обновляем счетчик каждые 10 секунд
    const statsInterval = setInterval(fetchStats, 10000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    if (!issuedStudent) return undefined;
    const timer = setTimeout(() => setIssuedStudent(null), 4000);
    return () => clearTimeout(timer);
  }, [issuedStudent]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/staff/login');
  };

  return (
    <div className="relative min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col">

        {/* Шапка */}
        <header className="flex items-center justify-between pt-6 laptop:pt-8">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#0D0C0C" aria-hidden>
              <path d="M2 4 L22 12 L2 20 L8 12 Z" />
            </svg>
            <span className="text-2xl font-semibold text-black laptop:text-[32px]">
              Талон
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-black hover:text-red-500 transition-colors"
            title="Выйти"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </header>

        {/* Месяц + иконка календаря */}
        <div className="mt-10 flex items-center justify-between laptop:mt-16">
          <h1 className="text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
            {MONTHS[today.getMonth()]} {today.getFullYear()}
          </h1>
          <button type="button" className="p-2 text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
          </button>
        </div>

        {/* Полоса недели */}
        <div className="mt-6 grid grid-cols-7 gap-1.5 laptop:gap-3">
          {weekDays.map((day) => {
            const isActive = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className={`flex h-14 flex-col items-center justify-center rounded-lg laptop:h-[72px] ${isActive ? 'bg-black' : ''}`}>
                <span className={`text-lg font-semibold laptop:text-2xl ${isActive ? 'text-primary' : 'text-black'}`}>
                  {String(day.getDate()).padStart(2, '0')}
                </span>
                <span className={`text-xs laptop:text-sm ${isActive ? 'text-primary/60' : 'text-gray'}`}>
                  {WEEKDAYS[day.getDay()]}
                </span>
              </div>
            );
          })}
        </div>

        {/* ЗАМЕНА QR-КОДА */}
        <div className="mx-auto mt-10 aspect-square w-full max-w-[600px] laptop:mt-14">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center bg-gray/10 rounded-xl">
              <span className="text-gray">Генерация QR-кода...</span>
            </div>
          ) : error ? (
            <div className="flex h-full w-full items-center justify-center bg-red-50 rounded-xl text-red-600">
              {error}
            </div>
          ) : qrToken ? (
            <div className="flex h-full w-full bg-white p-4 rounded-xl shadow-sm justify-center items-center">
              <QRCodeSVG 
                value={qrToken} 
                size={512} // Задаем большой размер для планшета
                bgColor={"#ffffff"}
                fgColor={"#0D0C0C"}
                level={"L"}
                className="w-full h-full max-w-[500px] max-h-[500px]"
              />
            </div>
          ) : (
             <div className="flex h-full w-full items-center justify-center bg-gray/10 rounded-xl">
              <span className="text-gray">Нет токена</span>
            </div>
          )}
        </div>

        {/* Счётчик порций */}
        <p className="mt-8 flex items-center justify-center gap-3 pb-10 text-center text-xl font-semibold text-black laptop:mt-10 laptop:text-[32px]">
          Сегодня выдано порций:
          <span className="rounded-lg bg-accent px-4 py-1 text-xl font-semibold text-black laptop:text-[28px]">
            {issuedCount}
          </span>
        </p>
      </div>

      {/* Оверлей успеха */}
      {issuedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="flex w-full max-w-[400px] flex-col items-center rounded-2xl bg-accent px-8 py-10">
            <p className="text-center text-2xl leading-[110%] font-semibold text-black laptop:text-[32px]">
              {issuedStudent.name} ({issuedStudent.group})
            </p>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0D0C0C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-6" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffQr;