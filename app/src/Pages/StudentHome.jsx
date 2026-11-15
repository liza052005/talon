import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../store/AuthContext';
import logo_mobile from '../assets/logo_mobile.svg';

const StudentHome = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [issuedDates, setIssuedDates] = useState([]); // Массив дат "YYYY-MM-DD"

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, historyRes] = await Promise.all([
          api.get('/students/me/status/'),
          api.get('/students/me/history/')
        ]);
        setStatus(statusRes.data);
        setIssuedDates(historyRes.data.issued_dates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-secondary flex items-center justify-center">Загрузка...</div>;

  const isIssued = status?.status_today === 'issued';
  const firstName = status?.full_name ? status.full_name.split(' ')[1] : 'Студент';

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  
  // Генерация ближайших 6 дней для верхней панели
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

  // --- ЛОГИКА ДЛЯ КАЛЕНДАРЯ ---
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Получаем день недели 1-го числа (0 - Вс, 1 - Пн...)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Сдвиг для сетки, где Пн = 0
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Массив пустых ячеек в начале месяца
  const emptyCells = Array.from({ length: startOffset });
  // Массив дней месяца
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
        
        <header className="relative flex justify-between items-center pt-10 pb-4" ref={menuRef}>
          <div className="flex items-center gap-1">
            <img src={logo_mobile} alt="Талон" className="" />
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="text-black font-bold text-xl pb-2 focus:outline-none"
          >
            ...
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-14 w-56 bg-primary rounded-xl shadow-lg border border-gray/15 z-50 overflow-hidden">
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#F24444] transition-colors hover:bg-[#F24444]/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5 M15 12H3" />
                </svg>
                Выйти из аккаунта
              </button>
            </div>
          )}
        </header>

        <div
          aria-hidden
          className="pointer-events-none mx-auto mt-[0px] h-[170px] w-[260px] rotate-[-20deg]"
          style={{
            background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
          }}
        />

        <h1 className="text-[34px] mt-[60px] leading-[110%] font-semibold text-black tracking-tight">
          Привет, {firstName}
        </h1>
        <div className="mt-3">
          <span className="bg-black text-white px-2.5 py-1 rounded-[6px] text-[13px] font-medium">
            Группа {status?.group}
          </span>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <h2 className="text-[18px] font-semibold">{capitalizedMonth}</h2>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray/10 transition-colors"
            aria-label="Открыть историю питания"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>

        <div className="mt-4 flex justify-between gap-1">
          {nextDays.map((d, i) => (
            <div key={i} className={`flex flex-col items-center justify-center w-[42px] h-[56px] rounded-lg ${d.isToday ? 'bg-black text-white' : 'text-gray'}`}>
              <span className={`text-[15px] ${d.isToday ? 'font-semibold' : 'font-medium'}`}>{d.num}</span>
              <span className="text-[11px] opacity-80 mt-0.5">{d.dayName}</span>
            </div>
          ))}
        </div>

        {/* Карточка получения питания */}
        <div className="relative mt-6">
          <div
            className={`h-[90px] w-full rounded-[12px] transition-colors duration-300 ${
              isIssued ? 'bg-[#FF0009]' : 'bg-[#88FF00]'
            }`}
          />

          <div className="relative -mt-[50px] bg-primary rounded-[12px] px-3 h-[90px] flex items-start pt-6 z-10">
            <h3 className="text-[24px] font-semibold text-black leading-tight tracking-tight">
              {isIssued ? 'Вы уже забрали свою еду' : 'Можно забрать еду!'}
            </h3>
          </div>

          <div className="mt-3">
            <p className="text-sm leading-[130%] text-gray px-3">
              {isIssued
                ? 'В день вы можете получить только одну порцию еды, следующая будет доступна только на следующий день'
                : 'Спускайся быстрее в столовую, забирай свою еду и кушай на здоровье'}
            </p>

            <button
              type="button"
              disabled={isIssued}
              onClick={() => navigate('/student/scan')}
              className={`mt-4 h-[50px] w-full rounded-[12px] flex items-center justify-center text-[15px] transition-colors
                ${isIssued
                  ? 'bg-[#979797] text-white/70 cursor-not-allowed'
                  : 'bg-[#0D0C0C] text-white hover:bg-black/80'}`}
            >
              Отсканировать QR-код
            </button>
          </div>
        </div>

      </div>

      {/* Модальное окно календаря */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#676565]/40 px-5"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div 
            className="w-full max-w-[400px] bg-primary rounded-2xl p-6 shadow-2xl border border-gray/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">{capitalizedMonth}</h2>
              <button 
                onClick={() => setIsCalendarOpen(false)}
                className="p-1.5 rounded-lg text-gray hover:bg-gray/10 hover:text-black transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex gap-4 mb-6 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#88FF00]"></div>
                <span className="text-gray">Забрал питание</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF0009]"></div>
                <span className="text-gray">Не забрал</span>
              </div>
            </div>

            {/* Сетка календаря */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {days.map((d) => (
                <div key={d} className="text-[11px] font-semibold text-gray py-2">
                  {d}
                </div>
              ))}
              
              {/* Пустые ячейки */}
              {emptyCells.map((_, i) => (
                <div key={`empty-${i}`} className="py-2"></div>
              ))}

              {/* Дни */}
              {monthDays.map((day) => {
                // Форматируем дату в "YYYY-MM-DD" для сравнения
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // Проверяем, получал ли студент питание в этот день
                const isIssuedDay = issuedDates.includes(dateStr);
                
                // Определяем, прошел ли этот день (чтобы рисовать красный)
                const isPast = new Date(currentYear, currentMonth, day) < new Date(currentYear, currentMonth, today.getDate());

                // Сегодняшний день
                const isToday = day === today.getDate();

                let bgClass = 'text-black';
                let dotClass = '';

                if (isIssuedDay) {
                  bgClass = 'text-black font-semibold';
                  dotClass = 'bg-[#88FF00]'; // Зеленый кружок
                } else if (isPast) {
                  bgClass = 'text-black font-semibold';
                  dotClass = 'bg-[#FF0009]'; // Красный кружок
                } else if (isToday) {
                  bgClass = 'text-black font-bold border border-black';
                }

                return (
                  <div key={day} className="flex flex-col items-center justify-center py-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] ${bgClass}`}>
                      {day}
                    </div>
                    {dotClass && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${dotClass}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentHome;