import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client'; // Проверь путь!
import { AuthContext } from '../store/AuthContext'; // Проверь путь!

const CODE_LENGTH = 6;

const StaffCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  
  const email = location.state?.email;
  const mode = location.state?.mode; // Получаем режим (setup или verify)

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCodeComplete = code.length === CODE_LENGTH;

  // Если зашли напрямую без email — на вход
  useEffect(() => {
    if (!email) navigate('/staff/login');
  }, [email, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isCodeComplete || loading) return;

    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'setup' 
        ? '/auth/staff/totp-setup/' 
        : '/auth/staff/verify-totp/';

      const res = await api.post(endpoint, { email, code });
      
      // 1. Принудительно сохраняем в localStorage (на всякий случай)
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      // 2. Вызываем login из контекста
      login(res.data);
      
      // 3. Переходим на экран планшета
      navigate('/staff/qr');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Неверный код. Попробуйте еще раз.');
      }
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
        <div aria-hidden className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg] laptop:mt-24 laptop:h-[400px] laptop:w-[600px]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />

        <h1 className="mt-12 text-center text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">Введите код</h1>
        <p className="mt-2 text-center text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          {mode === 'setup' 
            ? 'Введите код из Google Authenticator, чтобы завершить настройку'
            : 'Введите код из Google Authenticator для входа в аккаунт'}
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            disabled={loading}
            aria-label="Код из Google Authenticator"
            className="mt-10 w-full bg-transparent text-center text-3xl tracking-[0.35em] text-black placeholder-gray/40 focus:outline-none laptop:mt-12 laptop:text-4xl desktop:text-[32px] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!isCodeComplete || loading}
            className={`mt-10 h-12 w-full rounded-full text-sm transition-colors laptop:mt-12 laptop:h-16 laptop:text-xl desktop:text-sm ${isCodeComplete && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/50 text-primary'}`}
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffCode;