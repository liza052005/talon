import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'talon-meal-store-v1';

const load = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let state = load() ?? { students: [], issues: [] };
const listeners = new Set();

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getState = () => state;

export const useMealStore = () => useSyncExternalStore(subscribe, getState);

/* Регистрация студента (вызывается из RegisterStep3 после успешной регистрации) */
export const registerStudent = ({ fullName, group, categories }) => {
  const exists = state.students.some(
    (s) => s.fullName === fullName && s.group === group
  );
  if (exists) return;
  state = {
    ...state,
    students: [
      ...state.students,
      { id: `st-${Date.now()}`, fullName, group, categories: categories ?? [] },
    ],
  };
  emit();
};

/* Выдача питания (вызывается из StaffQr после успешного скана) */
export const issueMeal = ({ fullName, group, category, at = new Date() }) => {
  const date = at instanceof Date ? at : new Date(at);
  state = {
    ...state,
    issues: [
      ...state.issues,
      {
        id: `is-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fullName,
        group,
        category,
        dateISO: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        monthKey: `${date.getFullYear()}-${date.getMonth() + 1}`,
      },
    ],
  };
  emit();
};