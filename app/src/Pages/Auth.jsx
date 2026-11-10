import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client'; // Убедись, что путь до client.js верный

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Состояния для логики запроса
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Кнопка активна только когда заполнены оба поля и нет загрузки
  const isFormValid = email.trim() !== '' && password.trim() !== '' && !loading;

  const handleGetCode = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      // Стучимся в наш Django (эндпоинт login)
      await api.post('/auth/login/', { email, password });
      
      // Переходим на экран ввода 2FA кода, передаем email И пароль
      // Пароль нужен для функции "Запросить код повторно" на следующем экране
      navigate('/code', { state: { email, password } });
    } catch (err) {
      // Обработка ошибок из Django (400, 429, 500)
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail); // Сюда падают 429 (слишком много попыток)
      } else if (err.response?.data?.email) {
         setError(err.response.data.email[0]); // Ошибки валидации поля
      } else {
        setError('Ошибка сервера. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">

        {/* Декоративный градиентный блик */}
        <div
          aria-hidden
          className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg]"
          style={{
            background:
              'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
          }}
        />

        <h1 className="mt-12 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
          Вход
        </h1>

        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Введите данные аккаунта, чтобы получить код для входа
        </p>

        {/* Плашка с ошибкой (появляется, если есть error) */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleGetCode} noValidate className="mt-8">
          {/* Email */}
          <input
            type="email"
            placeholder="email.vsk@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-12 w-full bg-transparent text-base text-black placeholder-gray
                       focus:outline-none laptop:text-xl desktop:text-sm disabled:opacity-50"
          />

          {/* Пароль + переключатель видимости */}
          <div className="relative mt-3">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-12 w-full bg-transparent pr-12 text-base text-black placeholder-gray
                         focus:outline-none laptop:text-xl desktop:text-sm disabled:opacity-50"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray"
            >
              {showPassword ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M4 4l16 16" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="text-sm leading-[120%] text-gray"
              onClick={() => navigate('/forgot-password')}
            >
              Забыли пароль?
            </button>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`mt-6 h-12 w-full rounded-full text-sm transition-colors
              ${isFormValid
                ? 'bg-accent text-black'
                : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm leading-[120%] text-gray">
          Продолжая, я принимаю условия
          <br />
          <button
            type="button"
            className="text-sm font-medium text-black"
            onClick={() => navigate('/privacy')}
          >
            Политики конфиденциальности
          </button>
        </p>

        <p className="mt-auto pb-10 pt-16 text-center text-sm leading-[120%] text-gray">
          Нет аккаунта?{' '}
          <button
            type="button"
            className="text-black"
            onClick={() => navigate('/register')}
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;