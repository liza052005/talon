import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client'; 

const CODE_LENGTH = 6;
const RESEND_SECONDS = 59;

const CodeInput = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const password = location.state?.password; 

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const inputsRef = useRef([]);

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCodeComplete = code.every((digit) => digit !== '');
  const canResend = secondsLeft <= 0;

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!isCodeComplete || loading) return;

    setError('');
    setLoading(true);
    const finalCode = code.join('');

    try {
      const res = await api.post('/auth/verify-2fa/', { email, code: finalCode });
      
      // СОХРАНЯЕМ ТОКЕНЫ НАПРЯМУЮ, НЕ ВЫЗЫВАЯ LOGIN ИЗ КОНТЕКСТА
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      // Переходим на экран проверки, передаем данные юзера
      navigate('/check', { state: { firstName: 'Студент', userData: res.data.user } });
      
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Неверный или истёкший код.');
      }
      setCode(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

 const handleResend = async () => {
    if (!canResend || !password || loading) return;
    
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login/', { email, password });
      setSecondsLeft(RESEND_SECONDS);
      setCode(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      // Достаем настоящую ошибку из ответа Django
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Не удалось отправить код. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <button type="button" onClick={() => navigate(-1)} className="mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div aria-hidden className="pointer-events-none mx-auto mt-4 h-[170px] w-[260px] rotate-[-20deg]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />

        <h1 className="mt-8 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">
          Подтверждение входа
        </h1>

        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Код отправлен на {email}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} noValidate>
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
                disabled={loading}
                className={`h-10 w-6 border-b-2 bg-transparent text-center text-base text-black focus:outline-none focus:border-black laptop:text-xl desktop:text-sm disabled:opacity-50 ${digit ? 'border-black' : 'border-gray/50'}`}
              />
            ))}
          </div>

          <button type="submit" disabled={!isCodeComplete || loading} className={`mt-4 h-12 w-full rounded-full text-sm transition-colors ${isCodeComplete && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/50 text-primary'}`}>
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm leading-[120%] text-gray">
          Отправить повторно через: <span className="font-medium text-black">{mm}:{ss}</span>
        </p>

        <button type="button" onClick={handleResend} disabled={!canResend || loading} className={`mt-2 mx-auto text-sm leading-[120%] transition-colors ${canResend && !loading ? 'text-black hover:underline' : 'cursor-not-allowed text-gray'}`}>
          Запросить код повторно
        </button>
      </div>
    </div>
  );
};

export default CodeInput;