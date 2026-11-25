import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Spinner } from './components/common/PageState';
import { Login } from './pages/Login/Login';

// Every screen except the login page is loaded on demand, so the first visit downloads only what it needs.
const page = <T extends Record<string, React.ComponentType>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const ForgotPassword = page(() => import('./pages/ForgotPassword/ForgotPassword'), 'ForgotPassword');
const ResetPassword = page(() => import('./pages/ResetPassword/ResetPassword'), 'ResetPassword');
const Dashboard = page(() => import('./pages/Dashboard/Dashboard'), 'Dashboard');
const Sessions = page(() => import('./pages/Sessions/Sessions'), 'Sessions');
const Availability = page(() => import('./pages/Availability/Availability'), 'Availability');
const AvailabilityEdit = page(() => import('./pages/Availability/AvailabilityEdit'), 'AvailabilityEdit');
const Clients = page(() => import('./pages/Clients/Clients'), 'Clients');
const EmployeeProfile = page(() => import('./pages/Coaching/EmployeeProfile'), 'EmployeeProfile');
const SessionPrepare = page(() => import('./pages/Coaching/SessionPrepare'), 'SessionPrepare');
const SessionRunner = page(() => import('./pages/Coaching/SessionRunner'), 'SessionRunner');
const Settings = page(() => import('./pages/Settings/Settings'), 'Settings');
const Calendar = page(() => import('./pages/Calendar/Calendar'), 'Calendar');
const Escalations = page(() => import('./pages/Ops/Escalations'), 'Escalations');
const Playbook = page(() => import('./pages/Ops/Playbook'), 'Playbook');
const Tools = page(() => import('./pages/Ops/Tools'), 'Tools');
const Homework = page(() => import('./pages/Ops/Homework'), 'Homework');
const Learning = page(() => import('./pages/Ops/Learning'), 'Learning');

/** Catches render errors per route and shows the loading state while a screen's code downloads. */
const Screens: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<Spinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

import PageMeta from './components/PageMeta';

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <Router>
          <PageMeta />
          <Screens>
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
          </Screens>
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
