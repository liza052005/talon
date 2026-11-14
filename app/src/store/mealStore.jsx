import { create } from 'zustand';
import api from '../api/client';

export const useMealStore = create((set) => ({
  students: [],
  issues: [],
  isLoading: false,
  
  fetchData: async () => {
    set({ isLoading: true });
    try {
      // 1. Загружаем студентов
      const resStudents = await api.get('/admin/students/');
      const students = resStudents.data.map(s => ({
        id: s.id,
        fullName: s.full_name,
        group: s.group,
        email: s.email,
        categories: s.categories || [],
      }));

      // 2. Загружаем логи выдач
      const resLogs = await api.get('/admin/meal-logs/');
      const issues = resLogs.data;

      set({ students, issues, isLoading: false });
    } catch (err) {
      console.error('Ошибка загрузки данных для отчётов', err);
      set({ isLoading: false });
    }
  }
}));