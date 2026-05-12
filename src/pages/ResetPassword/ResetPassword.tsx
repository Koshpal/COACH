import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export const ResetPassword: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token, newPassword);
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md p-6 shadow-lg rounded-2xl sm:p-8 bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)]">
        <div className="mb-6">
          <Link to="/login" className="text-sm font-semibold text-[var(--color-secondary)] hover:opacity-80">Back to login</Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Create a new password</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Choose a strong password for your coach account.</p>
        </div>

        {message && <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success-darkest)]">{message}</div>}
        {error && <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-error-light)] text-[var(--color-error)]">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]">New Password</label>
            <div className="relative">
              <Lock className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)]"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-[var(--color-text-tertiary)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold rounded-lg transition-all disabled:opacity-50 text-[var(--color-text-inverse)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
          >
            {loading ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
};