import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'dormitory', label: 'Проживаешь в общежитии' },
  { id: 'social', label: 'Принадлежишь к социальной группе' },
  { id: 'specialty', label: 'Обучаешься по специальности, подлежащей кормлению' },
];

const RegisterStep3 = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const toggleCategory = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Кнопка активна: выбрана хотя бы одна категория
  const isFormValid = selected.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    // TODO: отправка всех данных регистрации на backend
    navigate('/check');
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
          {/* Чекбоксы категорий */}
          <div className="mt-8 flex flex-col gap-6">
            {CATEGORIES.map((category) => {
              const isChecked = selected.includes(category.id);
              return (
                <label key={category.id} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(category.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-black
                               transition-colors ${isChecked ? 'bg-black' : 'bg-transparent'}`}
                  >
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm leading-[120%] text-black laptop:text-xl desktop:text-sm">
                    {category.label}
                  </span>
                </label>
              );
            })}
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
            Зарегистрироваться
          </button>
        </form>

        {/* Индикатор шагов: 3 из 3 */}
        <div className="mt-auto flex gap-2.5 pb-10 pt-8">
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-gray/50" />
        </div>
      </div>
    </div>
  );
};

export default RegisterStep3;