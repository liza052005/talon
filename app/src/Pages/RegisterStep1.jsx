import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterStep1 = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [group, setGroup] = useState('');
  const [isBudget, setIsBudget] = useState(false);

  // Кнопка активна: ФИО + группа + галочка бюджета
  const isFormValid = fullName.trim() !== '' && group.trim() !== '' && isBudget;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    // TODO: сохранить данные шага (state store / backend)
    navigate('/register/step-2');
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">

        {/* Декоративный градиентный блик (на 1-м шаге нет кнопки назад) */}
        <div
          aria-hidden
          className="pointer-events-none mx-auto mt-[88px] h-[170px] w-[260px] rotate-[-20deg]"
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
          {/* ФИО */}
          <input
            type="text"
            placeholder="ФИО полностью"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-8 h-12 w-full bg-transparent text-base text-black placeholder-gray
                       focus:outline-none laptop:text-xl desktop:text-sm"
          />

          {/* Номер группы */}
          <input
            type="text"
            placeholder="Номер группы"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="mt-3 h-12 w-full bg-transparent text-base text-black placeholder-gray
                       focus:outline-none laptop:text-xl desktop:text-sm"
          />

          {/* Чекбокс бюджетной основы */}
          <label className="mt-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isBudget}
              onChange={(e) => setIsBudget(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-black
                         transition-colors ${isBudget ? 'bg-black' : 'bg-transparent'}`}
            >
              {isBudget && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className="text-sm leading-[120%] text-gray laptop:text-xl desktop:text-sm">
              Подтверждаю, что обучаюсь на бюджетной основе
            </span>
          </label>

          {/* Кнопка */}
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

        {/* Футер */}
        <p className="mt-auto pb-4 pt-8 text-center text-sm leading-[120%] text-gray">
          Есть аккаунт?{' '}
          <button
            type="button"
            className="font-medium text-black"
            onClick={() => navigate('/')}
          >
            Войти
          </button>
        </p>

        {/* Индикатор шагов: 1 из 3 */}
        <div className="flex gap-2.5 pb-10">
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-gray/50" />
          <div className="h-1 flex-1 rounded-full bg-gray/50" />
        </div>
      </div>
    </div>
  );
};

export default RegisterStep1;