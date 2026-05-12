import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { Login } from './pages/Login/Login';
import { ForgotPassword } from './pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword/ResetPassword';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Sessions } from './pages/Sessions/Sessions';
import { Availability } from './pages/Availability/Availability';
import { Clients } from './pages/Clients/Clients';
import { ClientOverview } from './pages/Clients/ClientOverview';
import { Settings } from './pages/Settings/Settings';
import { Payments } from './pages/Payments/Payments';
import { Calendar } from './pages/Calendar/Calendar';

// Placeholder components for routes that are not implemented yet
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[var(--color-bg-card)] rounded-2xl shadow-[var(--shadow-md)] p-8 animate-fade-in border border-[var(--color-border-primary)]">
    <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6">
      <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-heading mb-4">{name}</h1>
    <p className="text-[var(--color-text-secondary)] text-center max-w-md font-medium">
      This route is not connected to a backend feature yet.
    </p>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/client-overview" element={<ClientOverview />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Placeholder name="Reports" />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
