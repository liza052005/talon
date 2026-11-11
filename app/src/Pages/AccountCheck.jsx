import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AccountCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: запрос к backend: проверка аккаунта
    // При успехе: navigate('/home') — главная студента (сверстаем позже)
    // При ошибке: navigate('/error') или показать ошибку на месте (ждём макет)
  }, [navigate]);

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
          Подождите
        </h1>

        {/* Подзаголовок */}
        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Мы проверяем Ваш аккаунт
        </p>

        {/* Лоадер: 4 символа с волновой анимацией */}
        <div className="flex flex-1 items-center justify-center pb-16">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <svg
                key={index}
                className="loader-item"
                style={{ animationDelay: `${index * 0.2}s` }}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                {/* Круг с вырезанным сектором сверху-справа (как в макете) */}
                <path d="M12 12 L21.1 7.8 A10 10 0 1 1 15.4 2.6 Z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountCheck;