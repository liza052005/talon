import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterStep2 = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    // TODO: сохранить данные шага (state store / backend)
    navigate('/register/step-3');
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">

        {/* Кнопка назад */}
        <button
          type="button"
          aria-label="Назад"
          onClick={() => navigate(-1)}
          className="mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Декоративный градиентный блик */}
        <div
          aria-hidden
          className="pointer-events-none mx-auto mt-4 h-[170px] w-[260px] rotate-[-20deg]"
          style={{
            background:
              'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
          }}
        />

        {/* Заголовок */}
        <h1 className="mt-16 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
          Регистрация
        </h1>

        {/* Подзаголовок */}
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Заполните поля своими данными
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <input
            type="email"
            placeholder="email.vsk@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-8 h-12 w-full bg-transparent text-base text-black placeholder-gray
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

          {/* Кнопка */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`mt-8 h-12 w-full rounded-full text-sm transition-colors
              ${isFormValid
                ? 'bg-accent text-black'
                : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            Продолжить
          </button>
        </form>

        {/* Условия */}
        <p className="mt-4 text-center text-sm leading-[120%] text-gray">
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

        {/* Индикатор шагов: 2 из 3 */}
        <div className="mt-auto flex gap-2.5 pb-10 pt-8">
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-gray/50" />
        </div>
      </div>
    </div>
  );
};

export default RegisterStep2;