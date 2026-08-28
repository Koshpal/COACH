import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { authService } from '../../services/auth.service';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const userName = user.name || user.email?.split('@')[0] || 'Coach';
  const userEmail = user.email || '';

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b lg:px-6 bg-[var(--color-bg-card)] border-[var(--color-border-primary)] h-[89px] relative z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:opacity-80 lg:hidden bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-xl font-semibold lg:text-2xl text-[var(--color-text-primary)] font-heading">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center w-10 h-10 transition-transform rounded-full hover:scale-105 bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
          >
            <span className="text-sm font-bold">{getInitials(userName)}</span>
          </button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden transition-all duration-200 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)]"
              style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
            >
              <div className="px-4 py-4 flex items-center gap-3 border-b border-[var(--color-border-primary)]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[var(--color-primary)] text-[var(--color-text-inverse)]">
                  {getInitials(userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-[15px]">{userName}</p>
                  <p className="text-xs truncate text-[var(--color-text-secondary)]">{userEmail}</p>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <Settings className="w-5 h-5 opacity-70" />
                  <span className="flex-1 text-left">Settings</span>
                </button>

                <div className="h-[1px] my-1 mx-4 bg-[var(--color-border-primary)]"></div>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <HelpCircle className="w-5 h-5 opacity-70" />
                  <span className="flex-1 text-left">Help</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-error)]"
                >
                  <LogOut className="w-5 h-5 opacity-70" />
                  <span className="flex-1 text-left font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
