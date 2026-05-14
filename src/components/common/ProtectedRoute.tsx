import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import api from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Always verify against the server — this validates the httpOnly cookie
        // (sent automatically because the api instance has withCredentials: true).
        // This is the ONLY reliable way to authenticate cross-subdomain SSO flows
        // where localStorage is empty but the .koshpal.com cookie is already set.
        const response = await api.get('/auth/me');
        const me = response.data;

        if (!me || me.role !== 'COACH') {
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          return;
        }

        // Write back to localStorage so the UI can read display data without
        // an extra round-trip (e.g. Sidebar showing the user's name).
        localStorage.setItem('user', JSON.stringify(me));
        setIsAuthenticated(true);
      } catch (error: any) {
        localStorage.removeItem('user');

        if (error.response?.status === 403) {
          // Account deactivated — revoke server-side session too
          try { await authService.logout(); } catch { /* ignore */ }
        }

        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Run once on mount — the 401 interceptor in api.ts handles token refresh

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
