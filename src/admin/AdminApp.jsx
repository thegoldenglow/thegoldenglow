import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import admin components
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserManagement from './components/users/UserManagement';
import TaskManagement from './components/tasks/TaskManagement';
import AdManagement from './components/ads/AdManagement';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import SystemSettings from './components/system/SystemSettings';
import AdminSidebar from './components/dashboard/AdminSidebar';
import AdminHeader from './components/dashboard/AdminHeader';
import QuestionManagement from './components/questions/QuestionManagement';

// Import admin contexts
import { AdminAuthProvider } from './contexts/AdminAuthContext';

// Main layout component for authenticated routes
const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-deepLapis text-textLight">
      {/* Sidebar component */}
      <AdminSidebar isOpen={sidebarOpen} currentPath={location.pathname} />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header with controls */}
        <AdminHeader toggleSidebar={toggleSidebar} />
        
        {/* Main content with scrolling */}
        <main className="flex-1 overflow-y-auto bg-deepLapis bg-pattern-stars p-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Route wrapper (authentication removed)
const ProtectedRoute = ({ children }) => {
  return <AdminLayout>{children}</AdminLayout>;
};

// Main AdminApp component
function AdminApp() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/ads" element={
            <ProtectedRoute>
              <AdManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/system" element={
            <ProtectedRoute>
              <SystemSettings />
            </ProtectedRoute>
          } />
          
          <Route path="/questions" element={
            <ProtectedRoute>
              <QuestionManagement />
            </ProtectedRoute>
          } />
          
          {/* Default redirect for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default AdminApp;