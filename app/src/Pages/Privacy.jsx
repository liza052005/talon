import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 self-start text-sm text-gray"
        >
          ← Назад
        </button>
        <h1 className="mt-12 text-4xl leading-[105%] font-semibold text-black">
          Политика конфиденциальности
        </h1>
        <p className="mt-2 text-sm leading-[120%] text-gray">
          Здесь будет текст политики
        </p>
      </div>
    </div>
  );
};

export default Privacy;