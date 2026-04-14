import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchHealth } from '../api/client';
import { PermissionGuard } from './Guards';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',          icon: '📊', label: 'Dashboard',       permission: 'stats_view' },
  { to: '/lookup',    icon: '🔍', label: 'Customer Lookup', permission: 'recommendations_view' },
  { to: '/pipeline',  icon: '⚙️', label: 'Pipeline',        permission: 'pipeline_run' },
  { to: '/users',     icon: '👥', label: 'User Management', permission: 'user_manage' },
  { to: '/roles',     icon: '🛡️', label: 'Roles & Perms',   permission: 'user_manage' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const [mockMode, setMockMode] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth().then(h => setMockMode(h.mock_mode)).catch(() => setMockMode(null));
  }, []);

  return (
    <nav className="sidebar">

      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div>
          <div className="sidebar-logo-text">RecoServe</div>
          <div className="sidebar-logo-sub">Recommendation Platform</div>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      {navItems.map(item => (
        <PermissionGuard key={item.to} requiredPermission={item.permission}>
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        </PermissionGuard>
      ))}

       <div className="sidebar-footer">
          <button 
            onClick={logout} 
            className="nav-item" 
            style={{ 
              width: '100%', textAlign: 'left', cursor: 'pointer', 
              border: 'none', background: 'none', fontSize: 'inherit', 
              fontFamily: 'inherit', color: 'inherit', display: 'flex', 
              alignItems: 'center', gap: '12px', marginBottom: '16px' 
            }}
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>

          {mockMode !== null && (
            <div className="sidebar-badge">
              <span>{mockMode ? '🟢' : '🔵'}</span>
              <span>{mockMode ? 'Mock Mode Active' : 'Production Mode'}</span>
            </div>
          )}
        </div>

    </nav>
  );
}
