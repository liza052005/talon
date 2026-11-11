import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { RegisterContext } from '../store/RegisterContext';

const CATEGORIES = [
  { id: 1, label: 'Проживаешь в общежитии' },
  { id: 2, label: 'Принадлежишь к социальной группе' },
  { id: 3, label: 'Обучаешься по специальности, подлежащей кормлению' },
];

const RegisterStep3 = () => {
  const navigate = useNavigate();
  const { formData } = useContext(RegisterContext);
  
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCategory = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const isFormValid = selected.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError('');
    setLoading(true);

    try {
      const payload = {
        full_name: formData.fullName,
        group_name: formData.group,
        is_budget: formData.isBudget,
        email: formData.email,
        password: formData.password,
        category_ids: selected,
      };

      const res = await api.post('/auth/register/', payload);
      
      // СОХРАНЯЕМ ТОКЕНЫ НАПРЯМУЮ, НЕ ВЫЗЫВАЯ LOGIN
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      const firstName = formData.fullName.trim().split(' ')[1] || 'Студент';

      // Переходим на экран проверки
      navigate('/check', { state: { firstName, userData: res.data.user } });
      
    } catch (err) {
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response?.data?.email) {
        setError(err.response.data.email[0]);
      } else {
        setError('Ошибка при регистрации. Проверьте данные.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-secondary flex flex-col px-5">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <button type="button" onClick={() => navigate(-1)} disabled={loading} className="mt-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div aria-hidden className="pointer-events-none mx-auto mt-4 h-[170px] w-[260px] rotate-[-20deg]" style={{ background: 'radial-gradient(ellipse closest-side at center, #FF6600 0%, #FFCC00 36%, #FF0055 75%, rgba(255, 0, 85, 0) 100%)' }} />

        <h1 className="mt-16 text-4xl leading-[105%] font-semibold text-black laptop:text-[64px] desktop:text-[32px]">Регистрация</h1>

        <p className="mt-2 text-sm leading-[120%] text-gray laptop:text-xl laptop:font-normal desktop:text-sm desktop:font-medium">
          Выберите основание для получения питания
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mt-8 flex flex-col gap-6">
            {CATEGORIES.map((category) => {
              const isChecked = selected.includes(category.id);
              return (
                <label key={category.id} className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCategory(category.id)} disabled={loading} className="sr-only" />
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-black transition-colors ${isChecked ? 'bg-black' : 'bg-transparent'}`}>
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </span>
                  <span className="text-sm leading-[120%] text-black laptop:text-xl desktop:text-sm">{category.label}</span>
                </label>
              );
            })}
          </div>

          <button type="submit" disabled={!isFormValid || loading} className={`mt-8 h-12 w-full rounded-full text-sm transition-colors ${isFormValid && !loading ? 'bg-accent text-black' : 'cursor-not-allowed bg-gray/50 text-primary'}`}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-auto flex gap-2.5 pb-10 pt-8">
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-black" />
          <div className="h-1 flex-1 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
};

export default RegisterStep3;