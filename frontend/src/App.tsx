import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { PageContainer } from './components/layout/PageContainer';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardRouter } from './pages/dashboard';
import { SmartQueuePage } from './pages/queue/SmartQueuePage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { CallLogPage } from './pages/customers/CallLogPage';
import { NewCallLogPage } from './pages/customers/NewCallLogPage';
import { CustomerRemarksPage } from './pages/customers/CustomerRemarksPage';
import { OverdueFollowupsPage } from './pages/followups/OverdueFollowupsPage';
import { RechargeListPage } from './pages/recharges/RechargeListPage';
import { ChurnReasonPage } from './pages/analytics/ChurnReasonPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { CustomerImportPage } from './pages/admin/CustomerImportPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { AgentMetricDetailsPage } from './pages/dashboard/AgentMetricDetailsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <PageContainer>{children}</PageContainer>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/dashboard/agent/details" element={<ProtectedRoute><AgentMetricDetailsPage /></ProtectedRoute>} />
        <Route path="/queue" element={<ProtectedRoute><SmartQueuePage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomerListPage /></ProtectedRoute>} />
        <Route path="/new-call-log" element={<ProtectedRoute><NewCallLogPage /></ProtectedRoute>} />
        <Route path="/customers/:id/remarks" element={<ProtectedRoute><CustomerRemarksPage /></ProtectedRoute>} />
        <Route path="/customers/:id/log" element={<ProtectedRoute><CallLogPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/followups" element={<ProtectedRoute><OverdueFollowupsPage /></ProtectedRoute>} />
        <Route path="/recharges" element={<ProtectedRoute><RechargeListPage /></ProtectedRoute>} />
        <Route path="/analytics/churn" element={<ProtectedRoute><ChurnReasonPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/import" element={<ProtectedRoute><CustomerImportPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
