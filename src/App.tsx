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
import { AvailabilityEdit } from './pages/Availability/AvailabilityEdit';
import { Clients } from './pages/Clients/Clients';
import { ClientOverview } from './pages/Clients/ClientOverview';
import { Settings } from './pages/Settings/Settings';
import { Calendar } from './pages/Calendar/Calendar';

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
              <Route path="/availability/edit" element={<AvailabilityEdit />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientOverview />} />
              <Route path="/client-overview" element={<Navigate to="/clients/1" replace />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/settings" element={<Settings />} />
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
