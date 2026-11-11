import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';

const SuccessCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  
  const firstName = location.state?.firstName || 'Студент';
  const userData = location.state?.userData;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Вот здесь мы сохраняем юзера в контекст и пускаем в ЛК!
      if (userData) {
        login({ 
          access: localStorage.getItem('access_token'), 
          refresh: localStorage.getItem('refresh_token'), 
          user: userData 
        });
      }
      navigate('/student'); 
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, login, userData]);

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
        <div aria-hidden className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />
        <h1 className="mt-8 text-4xl font-semibold text-black">Привет, {firstName}</h1>
        <p className="mt-2 text-sm text-gray">Вы успешно создали аккаунт</p>
        <div className="flex flex-1 items-center justify-center mb-12">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0D0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
      </div>
    </div>
  );
};

export default SuccessCheck;