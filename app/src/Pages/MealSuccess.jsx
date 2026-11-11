import React from 'react';
import { useNavigate } from 'react-router-dom';

const MealSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-20 pb-8">
        
        <h1 className="text-3xl font-semibold text-center text-black">
          Вы получили еду
        </h1>

        {/* Огромная галочка */}
        <div className="flex flex-1 items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#0D0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Кнопка */}
        <button
          onClick={() => navigate('/student')}
          className="h-14 w-full rounded-full bg-black text-white text-base font-medium hover:bg-gray-900 transition-colors"
        >
          Вернуться на главную
        </button>

      </div>
    </div>
  );
};

export default MealSuccess;