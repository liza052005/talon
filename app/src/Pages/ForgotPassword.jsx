import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  // Кнопка активна только когда заполнен email
  const isEmailValid = email.trim() !== '';

 // В файле ForgotPassword.jsx
const handleReset = (e) => {
  e.preventDefault();
  if (!isEmailValid) return;
  
  // Т.к. на бэкенде эндпоинта нет, просто показываем alert
  alert('Если такой email существует, инструкция по сбросу отправлена.');
  navigate('/');
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
        <h1 className="mt-8 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
          Забыли пароль?
        </h1>

        {/* Подзаголовок */}
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Введите адрес электронной почты, связанный с вашим аккаунтом, чтобы сбросить пароль
        </p>

        <form onSubmit={handleReset} noValidate>
          {/* Email */}
          <input
            type="email"
            placeholder="email.vsk@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-8 h-12 w-full bg-transparent text-base text-black placeholder-gray
                       focus:outline-none laptop:text-xl desktop:text-sm"
          />

          {/* Кнопка сброса */}
          <button
            type="submit"
            disabled={!isEmailValid}
            className={`mt-6 h-12 w-full rounded-full text-sm transition-colors
              ${isEmailValid
                ? 'bg-accent text-black'
                : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            Сбросить пароль
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;