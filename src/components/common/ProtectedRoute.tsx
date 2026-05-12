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
  const userStr = localStorage.getItem('user');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!userStr) {
          setIsAuthenticated(false);
          return;
        }

        const user = JSON.parse(userStr);

        if (user.role !== 'COACH') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          return;
        }

        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch (error: any) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        if (error.response?.status === 403) {
          try {
            await authService.logout();
          } catch (logoutError) {
            console.log('Logout failed, but continuing with redirect');
          }
        }
        
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [userStr]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
