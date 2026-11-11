import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const MealConfirm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Подтверждаем получение еды на бэкенде
      await api.post('/meals/confirm/');
      
      // Если успех — идем на экран успеха
      navigate('/student/success');
    } catch (err) {
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('К сожалению, вам питание не доступно.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-primary flex flex-col px-6">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-10 pb-8">
        
        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/student')}
          className="self-start flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Блик (как на макете) */}
        <div className="flex justify-center mt-12 mb-8">
          <div
            className="h-[250px] w-[250px] rounded-[40px] blur-[30px] opacity-80"
            style={{
              background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)',
            }}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Текст */}
        <h1 className="text-2xl font-bold text-black leading-tight">
          Вы хотите забрать питание?
        </h1>
        <p className="mt-3 text-sm text-gray leading-[130%]">
          У Вас есть только один шанс забрать еду, нажимай на кнопку "Хочу забрать еду"
        </p>

        {/* Кнопка подтверждения */}
        <div className="mt-auto pt-8">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="h-14 w-full rounded-full bg-black text-white text-base font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {loading ? 'Подождите...' : 'Хочу забрать еду'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MealConfirm;