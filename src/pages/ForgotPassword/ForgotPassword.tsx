import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setMessage('If the email exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md p-6 shadow-lg rounded-2xl sm:p-8 bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)]">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-secondary)] hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">We’ll email a reset link to your coach account.</p>
        </div>

        {message && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-success-bg)] text-[var(--color-success-darkest)] border border-[var(--color-success-light)]">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 mb-4 text-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Work Email</label>
          <div className="relative mb-4">
            <Mail className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-input-bg)] border border-[var(--color-input-border)] text-[var(--color-input-text)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold rounded-lg transition-all disabled:opacity-50 text-[var(--color-text-inverse)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};