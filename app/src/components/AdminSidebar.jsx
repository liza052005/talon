import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Icon = ({ path, extra }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={path} />
    {extra}
  </svg>
);

const NAV_ITEMS = [
  {
    id: 'students',
    label: 'Студенты',
    path: '/admin/students',
    icon: <Icon path="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" extra={<circle cx="12" cy="8" r="3.5" strokeWidth="2" />} />,
  },
  {
    id: 'groups',
    label: 'Группы',
    path: '/admin/groups',
    icon: <Icon path="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2Z M12 6v14" />,
  },
  {
    id: 'categories',
    label: 'Категории питания',
    path: '/admin/categories',
    icon: <Icon path="M3 5h18v16H3Z M8 3v4 M16 3v4 M3 10h18" />,
  },
  {
    id: 'reports',
    label: 'Отчеты',
    path: '/admin/reports',
    icon: <Icon path="M5 20v-10 M12 20V4 M19 20v-7" />,
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    path: '/admin/staff',
    icon: <Icon path="M12 20s-7-4.5-9-9c-1.2-2.8.6-6 3.8-6 2 0 3.6 1.2 5.2 3 1.6-1.8 3.2-3 5.2-3 3.2 0 5 3.2 3.8 6-2 4.5-9 9-9 9Z" />,
  },
];

const AdminSidebar = ({ active }) => {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-4 py-6 md:flex laptop:px-6">
      {/* Логотип */}
      <div className="flex items-center gap-3 px-2">
        <img src={logo} alt="Талон" className="" />
      </div>

      {/* Навигация */}
      <p className="mt-8 px-3 text-xs leading-[120%] text-gray">Навигация</p>
      <nav className="mt-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors
              ${active === item.id ? 'bg-accent font-medium text-black' : 'text-gray hover:text-black'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;