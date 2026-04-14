import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Lookup from './pages/Lookup';
import Pipeline from './pages/Pipeline';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleProtectedRoute, PermissionProtectedRoute } from './components/Guards';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Sidebar />
                    <main className="page-content">
                      <Routes>
                        <Route path="/"         element={<Dashboard />} />
                         <Route 
                           path="/lookup" 
                           element={
                             <PermissionProtectedRoute requiredPermission="recommendations_view">
                               <Lookup />
                             </PermissionProtectedRoute>
                           } 
                         />
                          <Route 
                            path="/pipeline" 
                            element={
                              <PermissionProtectedRoute requiredPermission="pipeline_run">
                                <Pipeline />
                              </PermissionProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/users" 
                            element={
                              <PermissionProtectedRoute requiredPermission="user_manage">
                                <UserManagement />
                              </PermissionProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/roles" 
                            element={
                              <PermissionProtectedRoute requiredPermission="user_manage">
                                <RoleManagement />
                              </PermissionProtectedRoute>
                            } 
                          />
                       </Routes>

                    </main>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
