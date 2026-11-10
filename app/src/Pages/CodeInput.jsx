import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 59;

const CodeInput = () => {
  const navigate = useNavigate();

  // Код: 6 отдельных символов
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const inputsRef = useRef([]);

  // Таймер повторной отправки
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const isCodeComplete = code.every((digit) => digit !== '');
  const canResend = secondsLeft <= 0;

  // Обратный отсчёт
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  // Ввод цифры + автопереход на следующий сегмент
  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Backspace на пустом сегменте — возврат назад
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!isCodeComplete) return;
    // TODO: запрос к backend для проверки кода
    // TODO: navigate('/home') — главная страница студента (сверстаем после макета)
  };

  const handleResend = () => {
    if (!canResend) return;
    // TODO: запрос к backend за повторным кодом
    setSecondsLeft(RESEND_SECONDS);
    setCode(Array(CODE_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
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
          Подтверждение входа
        </h1>

        {/* Подзаголовок */}
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Код отправлен на email
        </p>

        <form onSubmit={handleConfirm} noValidate>
          {/* Сегменты ввода кода */}
          <div className="mt-12 flex items-center justify-center gap-1.5">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={2}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`Цифра кода ${index + 1}`}
                className={`h-10 w-6 border-b-2 bg-transparent text-center text-base text-black
                           focus:outline-none focus:border-black laptop:text-xl desktop:text-sm
                           ${digit ? 'border-black' : 'border-gray/50'}`}
              />
            ))}
          </div>

          {/* Кнопка подтверждения */}
          <button
            type="submit"
            disabled={!isCodeComplete}
            className={`mt-4 h-12 w-full rounded-full text-sm transition-colors
              ${isCodeComplete
                ? 'bg-accent text-black'
                : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            Подтвердить
          </button>
        </form>

        {/* Таймер повторной отправки */}
        <p className="mt-6 text-center text-sm leading-[120%] text-gray">
          Отправить повторно через:{' '}
          <span className="font-medium text-black">{mm}:{ss}</span>
        </p>

        {/* Повторный запрос кода */}
        <button
          type="button"
          onClick={handleResend}
          className={`mt-2 mx-auto text-sm leading-[120%] transition-colors
            ${canResend ? 'text-black' : 'cursor-not-allowed text-gray'}`}
        >
          Запросить код повторно
        </button>
      </div>
    </div>
  );
};

export default CodeInput;