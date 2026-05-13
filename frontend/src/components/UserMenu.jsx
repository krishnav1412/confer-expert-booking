import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { ChevronDownIcon } from './Icons';

const UserMenu = () => {
  const { user, isExpert, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={user.avatar} name={user.name} size="sm" />
        <span className="hidden text-sm font-medium text-ink-700 dark:text-ink-200 sm:inline">
          {user.name.split(' ')[0]}
        </span>
        <ChevronDownIcon className="hidden h-3.5 w-3.5 text-ink-400 sm:inline" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card-hover dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <div className="text-sm font-semibold text-ink-900 dark:text-white">{user.name}</div>
            <div className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</div>
            <div className="mt-2 inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700 dark:bg-ink-800 dark:text-ink-200">
              {isAdmin ? 'Admin' : isExpert ? 'Expert' : 'Member'}
            </div>
          </div>
          <ul className="py-1 text-sm">
            <Item to="/dashboard" onClick={() => setOpen(false)}>Your dashboard</Item>
            {isExpert && <Item to="/expert-dashboard" onClick={() => setOpen(false)}>Expert dashboard</Item>}
            {isAdmin && <Item to="/admin" onClick={() => setOpen(false)}>Admin panel</Item>}
            <Item to="/messages" onClick={() => setOpen(false)}>Messages</Item>
            <Item to="/settings" onClick={() => setOpen(false)}>Profile settings</Item>
            {isExpert && <Item to="/expert-settings" onClick={() => setOpen(false)}>Expert settings</Item>}
            {!isExpert && !isAdmin && <Item to="/become-expert" onClick={() => setOpen(false)}>Become an expert</Item>}
          </ul>
          <div className="border-t border-ink-100 dark:border-ink-800">
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Item = ({ to, onClick, children }) => (
  <li>
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      className="block px-4 py-2 text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
    >
      {children}
    </Link>
  </li>
);

export default UserMenu;
