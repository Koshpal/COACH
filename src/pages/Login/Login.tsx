import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { User } from '../../types/coach.types';

const normalizeUser = (userData: any): User | null => {
  if (!userData) return null;
  const source = userData.user || userData;
  const normalizedId = source.id || source.userId || source._id;

  if (!normalizedId) return null;

  return {
    ...source,
    id: normalizedId,
  };
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'COACH') {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await authService.login(email, password);
      const user = normalizeUser(response.user || response);
      
      if (!user || user.role !== 'COACH') {
        setError('Access denied. This portal is for coaches only.');
        localStorage.removeItem('user');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      showToast('Welcome back!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="relative w-full max-w-md p-6 shadow-lg rounded-2xl sm:p-8 bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <img src="/logo.png" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-lg font-bold sm:text-xl text-[var(--color-text-primary)]">
            Koshpal
          </span>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl text-[var(--color-text-primary)]">
            Welcome back
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
            Sign in to your coach portal
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-error-light)] text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label className="block mb-2 text-xs font-semibold sm:text-sm text-[var(--color-text-primary)]">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 sm:w-5 sm:h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={loading}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)]"
              />
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="block mb-2 text-xs font-semibold sm:text-sm text-[var(--color-text-primary)]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 sm:w-5 sm:h-5 text-[var(--color-text-tertiary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute transform -translate-y-1/2 cursor-pointer right-3 top-1/2 hover:opacity-70 disabled:opacity-50 text-[var(--color-text-tertiary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-5 sm:mb-6">
            <label className="flex items-center flex-shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-[var(--color-primary)] border-[var(--color-input-border)]"
              />
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm whitespace-nowrap text-[var(--color-text-secondary)]">
                Remember me
              </span>
            </label>
            <Link to="/forgot-password" className="text-xs font-medium sm:text-sm whitespace-nowrap hover:opacity-80 text-[var(--color-secondary)]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[var(--color-text-inverse)] shadow-[var(--shadow-md)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
