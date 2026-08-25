import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Pages
import Login from './pages/Login';
import OfficerDashboard from './pages/OfficerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewInspection from './pages/NewInspection';
import ExtractionReview from './pages/ExtractionReview';
import ComplianceResult from './pages/ComplianceResult';
import InspectionDetails from './pages/InspectionDetails';
import InspectionsList from './pages/InspectionsList';
import ReportsPage from './pages/ReportsPage';
import SupervisorReview from './pages/SupervisorReview';
import RulesManager from './pages/RulesManager';
import NotFound from './pages/NotFound';

// Smart Dashboard Router: Routes user to their appropriate role home
const SmartDashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  if (user?.role === 'SUPERVISOR') {
    return <SupervisorDashboard />;
  }
  return <OfficerDashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Enforcement Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default Landing: Smart Role-Based Workspace */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<SmartDashboardRedirect />} />

        {/* Officer Inspections & Screening */}
        <Route path="inspections" element={<InspectionsList />} />
        <Route path="inspections/new" element={<NewInspection />} />
        <Route path="inspections/:id" element={<InspectionDetails />} />
        <Route path="inspections/:id/extraction-review" element={<ExtractionReview />} />
        <Route path="inspections/:id/extraction" element={<ExtractionReview />} />
        <Route path="inspections/:id/compliance" element={<ComplianceResult />} />
        <Route path="inspections/:id/results" element={<InspectionDetails />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Supervisor Routes (Protected to SUPERVISOR and ADMIN) */}
        <Route
          path="supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="supervisor/inspections"
          element={
            <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
              <SupervisorReview />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (Protected to ADMIN only) */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/rules"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RulesManager />
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 inside layout */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
