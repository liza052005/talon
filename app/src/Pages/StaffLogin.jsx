import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client'; // Проверь путь!

const StaffLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() !== '' && password.trim() !== '' && !loading;

  const handleGetCode = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/staff/login/', { email, password });
      
      if (res.data.mode === 'setup') {
        // Первый вход: TOTP еще не привязан. 
        // ВРЕМЕННО показываем alert с секретом (потом сделаем красивый экран).
        alert(`ПЕРВЫЙ ВХОД!\nДобавьте этот секрет в Google Authenticator:\n\n${res.data.secret}`);
        
        // Переходим на ввод кода, передавая режим setup
        navigate('/staff/code', { state: { email, mode: 'setup' } });
      } else {
        // Обычный вход (mode === 'verify')
        navigate('/staff/code', { state: { email, mode: 'verify' } });
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Ошибка сервера. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
        {/* Блик */}
        <div aria-hidden className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg] laptop:mt-24 laptop:h-[400px] laptop:w-[600px]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />

        <h1 className="mt-12 text-center text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">Вход</h1>
        <p className="mt-2 text-center text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Введите данные аккаунта, чтобы получить код для входа
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleGetCode} noValidate>
          <input
            type="email"
            placeholder="email.vsk@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="mt-10 h-12 w-full bg-transparent text-base text-black placeholder-gray focus:outline-none laptop:mt-12 laptop:text-xl desktop:text-sm disabled:opacity-50"
          />

          <div className="relative mt-3 laptop:mt-8">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-12 w-full bg-transparent pr-12 text-base text-black placeholder-gray focus:outline-none laptop:text-xl desktop:text-sm disabled:opacity-50"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray">
              {/* Иконки глаза оставь свои */}
              {showPassword ? 'Скрыть' : 'Показать'} 
            </button>
          </div>

          <div className="mt-6 flex justify-end laptop:mt-8">
            <button type="button" className="text-sm leading-[120%] text-gray laptop:text-base" onClick={() => navigate('/forgot-password')}>
              Забыли пароль?
            </button>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`mt-6 h-12 w-full rounded-full text-sm transition-colors laptop:mt-8 laptop:h-16 laptop:text-xl desktop:text-sm ${isFormValid ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            {loading ? 'Загрузка...' : 'Получить код'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm leading-[120%] text-gray laptop:mt-8 laptop:text-xl desktop:text-sm">
          Продолжая, я принимаю условия<br />
          <button type="button" className="font-medium text-black" onClick={() => navigate('/privacy')}>
            Политики конфиденциальности
          </button>
        </p>
      </div>
    </div>
  );
};

export default StaffLogin;