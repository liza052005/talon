import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AccountCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/success', { state: location.state });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, location]);

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div aria-hidden className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />
        <h1 className="mt-16 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">Подождите</h1>
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">Мы проверяем Ваш аккаунт</p>
        <div className="mt-auto mb-20 flex justify-center gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-gray" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-black" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-gray" style={{ animationDelay: '300ms' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-gray" style={{ animationDelay: '450ms' }} />
        </div>
      </div>
    </div>
  );
};

export default AccountCheck;