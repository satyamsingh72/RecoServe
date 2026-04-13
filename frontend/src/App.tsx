import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Lookup from './pages/Lookup';
import Pipeline from './pages/Pipeline';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleProtectedRoute } from './components/Guards';

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
                            <RoleProtectedRoute allowedRoles={["Admin"]}>
                              <Lookup />
                            </RoleProtectedRoute>
                          } 
                        />
                         <Route 
                           path="/pipeline" 
                           element={
                             <RoleProtectedRoute allowedRoles={["Admin"]}>
                               <Pipeline />
                             </RoleProtectedRoute>
                           } 
                         />
                         <Route 
                           path="/users" 
                           element={
                             <RoleProtectedRoute allowedRoles={["Admin"]}>
                               <UserManagement />
                             </RoleProtectedRoute>
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
      <style>{`
        .app-layout {
          display: flex;
          width: 100vw;
          height: 100vh;
        }
        .page-content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }
      `}</style>
    </AuthProvider>
  );
}
