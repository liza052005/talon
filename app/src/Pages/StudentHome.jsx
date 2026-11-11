import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../store/AuthContext';

const StudentHome = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/students/me/status/');
        setStatus(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <div className="min-h-screen bg-secondary flex items-center justify-center">Загрузка...</div>;

  const isIssued = status?.status_today === 'issued';
  const firstName = status?.full_name ? status.full_name.split(' ')[1] : 'Студент';

  // Генерируем 6 дней для календаря (как на скриншоте)
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  const nextDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      num: String(d.getDate()).padStart(2, '0'),
      dayName: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
      isToday: i === 0
    };
  });

  const monthName = today.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pb-8">
        
        {/* Шапка с логотипом */}
        <header className="flex justify-between items-center pt-12 pb-4">
          <div className="flex items-center gap-1">
             {/* Твой логотип-галочка */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M4 12L20 4V10L10 14L20 20V12" fill="#0D0C0C"/>
            </svg>
            <span className="font-semibold text-[17px] tracking-tight">Талон</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="text-black font-bold text-xl pb-2">
            ...
          </button>
        </header>

        {/* Блик (строго по центру, овальный) */}
        <div className="flex justify-center mt-2 mb-6">
          <div
            className="h-[150px] w-[240px] rounded-full blur-[20px] opacity-90"
            style={{
              background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
            }}
          />
        </div>

        {/* Приветствие */}
        <h1 className="text-[34px] leading-[110%] font-semibold text-black tracking-tight">
          Привет, {firstName}
        </h1>
        <div className="mt-3">
          <span className="bg-black text-white px-2.5 py-1 rounded-[6px] text-[13px] font-medium">
            Группа {status?.group}
          </span>
        </div>

        {/* Календарь */}
        <div className="mt-10 flex justify-between items-center">
          <h2 className="text-[18px] font-semibold">{capitalizedMonth}</h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>

        {/* Дни (черный квадрат у сегодняшнего) */}
        <div className="mt-4 flex justify-between gap-1">
          {nextDays.map((d, i) => (
            <div key={i} className={`flex flex-col items-center justify-center w-[42px] h-[56px] rounded-lg ${d.isToday ? 'bg-black text-white' : 'text-gray'}`}>
              <span className={`text-[15px] ${d.isToday ? 'font-semibold' : 'font-medium'}`}>{d.num}</span>
              <span className="text-[11px] opacity-80 mt-0.5">{d.dayName}</span>
            </div>
          ))}
        </div>

        {/* Плашка */}
        <div className={`mt-8 rounded-[20px] px-5 py-6 transition-colors duration-300 ${
          isIssued ? 'bg-[#FF0000]' : 'bg-[#88FF00]'
        }`}>
          <h3 className="text-[22px] font-bold text-black leading-tight tracking-tight">
            {isIssued ? 'Вы уже забрали свою еду' : 'Можно забрать еду!'}
          </h3>
        </div>

        {/* Описание */}
        <p className="mt-3 text-[13px] leading-[130%] text-gray pr-4">
          {isIssued 
            ? 'В день вы можете получить только одну порцию еды, следующая будет доступна на следующий день'
            : 'Спускайся быстрее в столовую, забирай свою еду и кушай на здоровье'}
        </p>

        {/* Кнопка Сканера */}
        <div className="mt-auto pt-8">
          <button
            type="button"
            disabled={isIssued}
            onClick={() => navigate('/student/scan')}
            className={`h-[56px] w-full rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-medium transition-colors
              ${isIssued 
                ? 'bg-[#979797] text-white/70 cursor-not-allowed' 
                : 'bg-[#0D0C0C] text-white hover:bg-black/80'}`}
          >
            {/* Иконка QR */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
            Отсканировать QR-код
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentHome;