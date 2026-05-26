import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export const ResetPassword: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token, newPassword);
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md p-6 rounded-2xl sm:p-8 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] shadow-[var(--shadow-lg)]">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-secondary)] hover:opacity-80 transition-opacity"
          >
            ← Back to login
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Create a new password</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Choose a strong password (min. 8 characters) for your coach account.
          </p>
        </div>

        {message && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] border border-[var(--color-success-light)]">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-[var(--color-text-tertiary)]" />
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                required
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                disabled={loading}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-[var(--color-text-tertiary)]" />
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                placeholder="Repeat your new password"
                className="w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={loading}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-inverse)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
