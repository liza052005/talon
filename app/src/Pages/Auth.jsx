import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Кнопка активна только когда заполнены оба поля
  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleGetCode = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    // TODO: запрос к backend за кодом подтверждения
    navigate('/code');
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">

        {/* Декоративный градиентный блик (эллипс с кольцами, как в референсе) */}
        <div
          aria-hidden
          className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg]"
          style={{
            background:
              'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
          }}
        />

        {/* Заголовок */}
        <h1 className="mt-12 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
          Вход
        </h1>

        {/* Подзаголовок */}
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Введите данные аккаунта, чтобы получить код для входа
        </p>

        <form onSubmit={handleGetCode} noValidate className="mt-8">
          {/* Email */}
          <input
            type="email"
            placeholder="email.vsk@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full bg-transparent text-base text-black placeholder-gray
                       focus:outline-none laptop:text-xl desktop:text-sm"
          />

          {/* Пароль + переключатель видимости */}
          <div className="relative mt-3">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full bg-transparent pr-12 text-base text-black placeholder-gray
                         focus:outline-none laptop:text-xl desktop:text-sm"
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

          {/* Забыли пароль? */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="text-sm leading-[120%] text-gray"
              onClick={() => navigate('/forgot-password')}
            >
              Забыли пароль?
            </button>
          </div>

          {/* Кнопка получения кода */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`mt-6 h-12 w-full rounded-full text-sm transition-colors
              ${isFormValid
                ? 'bg-accent text-black'
                : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            Получить код
          </button>
        </form>

        {/* Условия */}
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

        {/* Футер с переходом на регистрацию */}
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