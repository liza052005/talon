import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Icon = ({ path, extra }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={path} />
    {extra}
  </svg>
);

const NAV_ITEMS = [
  {
    id: 'students',
    label: 'Студенты',
    path: '/admin/students',
    icon: (
      <Icon
        path="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        extra={<circle cx="12" cy="8" r="3.5" strokeWidth="2" />}
      />
    ),
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
    label: 'Отчёты',
    path: '/admin/reports',
    icon: <Icon path="M5 20v-10 M12 20V4 M19 20v-7" />,
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    path: '/admin/staff',
    icon: (
      <Icon path="M12 20s-7-4.5-9-9c-1.2-2.8.6-6 3.8-6 2 0 3.6 1.2 5.2 3 1.6-1.8 3.2-3 5.2-3 3.2 0 5 3.2 3.8 6-2 4.5-9 9-9 9Z" />
    ),
  },
];

const AdminSidebar = ({ active, onLogout, logoutLabel = 'Выйти из аккаунта' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Активный пункт: явный проп active, либо автоопределение по текущему URL
  const currentId =
    active ?? NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.id;

  return (
    <aside className="talon-scroll sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto px-4 py-6 md:flex laptop:px-6">
      {/* Логотип — клик возвращает в раздел «Студенты» */}
      <button
        type="button"
        onClick={() => navigate('/admin/students')}
        aria-label="Талон — на главную раздела"
        className="flex items-center gap-3 rounded-lg px-2 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <img src={logo} alt="Талон" className=" select-none" draggable={false} />
      </button>

      {/* Навигация */}
      <p className="mt-8 px-3 text-xs leading-[120%] text-gray">Разделы</p>
      <nav aria-label="Разделы администратора" className="mt-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? 'bg-accent font-medium text-black'
                  : 'text-gray hover:bg-gray/10 hover:text-black'
              }`}
            >
              <span className={isActive ? 'text-black' : 'text-gray'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Выход — показывается только если передан onLogout */}
      {onLogout && (
        <div className="mt-auto border-t border-gray/15 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#F24444] transition-colors hover:bg-[rgba(242,68,68,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F24444]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5 M15 12H3" />
            </svg>
            {logoutLabel}
          </button>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;