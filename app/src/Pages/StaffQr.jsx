import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/client';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// Функция для получения дней текущей недели (для полосы над QR-кодом)
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

  // --- Стейты для QR и счетчика ---
  const [qrToken, setQrToken] = useState(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Стейты для календаря ---
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarStats, setCalendarStats] = useState({});
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [calendarLoading, setCalendarLoading] = useState(false);

  // --- Логика для QR ---
  const fetchNewToken = async () => {
    try {
      const res = await api.post('/qr/sessions/');
      setQrToken(res.data.token);
      setIssuedCount(res.data.issued_today);
      setError('');
    } catch (err) {
      console.error("Ошибка обновления QR", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/staff/login');
      } else {
        setError('Ошибка обновления QR-кода');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Генерируем первый токен при загрузке
    fetchNewToken();

    // 2. Ставим интервал на обновление токена каждые 60 секунд (1 минута)
    const tokenInterval = setInterval(() => {
      fetchNewToken();
    }, 60000); // 60 000 мс = 1 минута (токен живет 3 минуты, так что запас есть)

    // 3. Обновляем счетчик каждые 10 секунд
    const statsInterval = setInterval(fetchStats, 10000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/qr/stats/today/');
      setIssuedCount(res.data.issued_today);
    } catch (err) {
      console.error('Не удалось обновить счетчик', err);
    }
  };

  // --- Логика для Календаря ---
  const fetchCalendarStats = async () => {
    setCalendarLoading(true);
    try {
      const res = await api.get(`/qr/stats/month/?year=${currentYear}&month=${currentMonth + 1}`);
      setCalendarStats(res.data.stats);
    } catch (err) {
      console.error('Ошибка загрузки календаря', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchNewToken();
    const tokenInterval = setInterval(fetchNewToken, 150000); // Обновляем QR каждые 2.5 мин
    const statsInterval = setInterval(fetchStats, 10000); // Обновляем счетчик каждые 10 сек
    return () => {
      clearInterval(tokenInterval);
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    if (isCalendarOpen) {
      fetchCalendarStats();
    }
  }, [isCalendarOpen, currentMonth, currentYear]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/staff/login');
  };

  // --- Отрисовка сетки календаря ---
  const renderCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Сдвиг, чтобы неделя начиналась с Пн

    const daysArray = [];
    // Пустые ячейки в начале месяца
    for (let i = 0; i < startOffset; i++) {
      daysArray.push(null);
    }
    // Дни месяца
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }

    return daysArray.map((day, index) => {
      if (!day) return <div key={`empty-${index}`} className="h-10 w-10"></div>;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = calendarStats[dateStr] || 0;

      return (
        <div key={day} className="relative flex flex-col items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 cursor-default transition-colors">
          <span className="text-sm font-medium text-gray-800">{day}</span>
          {count > 0 && (
            <span className="absolute -bottom-1 text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-1.5 border border-green-200">
              {count}
            </span>
          )}
        </div>
      );
    });
  };

  // Переключение месяцев
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
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
            <span className="text-2xl font-semibold text-black laptop:text-[32px]">Талон</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-black hover:text-red-500 transition-colors" title="Выйти">
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
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="p-3 text-black hover:bg-gray-200 rounded-2xl transition-colors"
            title="Открыть календарь выдачи"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* QR-код */}
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
                size={512}
                bgColor={"#ffffff"}
                fgColor={"#0D0C0C"}
                level={"L"}
                className="w-full h-full max-w-[500px] max-h-[500px]"
              />
            </div>
          ) : null}
        </div>

        {/* Счётчик порций */}
        <p className="mt-8 flex items-center justify-center gap-3 pb-10 text-center text-xl font-semibold text-black laptop:mt-10 laptop:text-[32px]">
          Сегодня выдано порций:
          <span className="rounded-lg bg-accent px-4 py-1 text-xl font-semibold text-black laptop:text-[28px]">
            {issuedCount}
          </span>
        </p>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО КАЛЕНДАРЯ --- */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            
            {/* Кнопка закрытия */}
            <button 
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-6 text-black">Статистика выдачи</h2>

            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h3 className="text-lg font-medium">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-gray-400">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {calendarLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400">Загрузка...</div>
            ) : (
              <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {renderCalendarDays()}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Всего за месяц:</span>
              <span className="text-lg font-bold text-green-600">
                {Object.values(calendarStats).reduce((a, b) => a + b, 0)} порций
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StaffQr;