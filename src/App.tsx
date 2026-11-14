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
import { EmployeeProfile } from './pages/Coaching/EmployeeProfile';
import { SessionPrepare } from './pages/Coaching/SessionPrepare';
import { SessionRunner } from './pages/Coaching/SessionRunner';
import { Settings } from './pages/Settings/Settings';
import { Calendar } from './pages/Calendar/Calendar';
import { Escalations } from './pages/Ops/Escalations';
import { Playbook } from './pages/Ops/Playbook';
import { Tools } from './pages/Ops/Tools';
import { Homework } from './pages/Ops/Homework';
import { Learning } from './pages/Ops/Learning';

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
              <Route path="/clients/:id" element={<EmployeeProfile />} />
              <Route path="/sessions/:id/prepare" element={<SessionPrepare />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/escalations" element={<Escalations />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Session Runner is deliberately outside the sidebar layout: distraction-free, full width */}
            <Route path="/sessions/:id/run" element={<ProtectedRoute><SessionRunner /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
