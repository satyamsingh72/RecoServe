import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';

interface Permission {
  name: string;
  description?: string;
}

interface Role {
  name: string;
  permissions: string[];
}

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formRole, setFormRole] = useState({ name: '', permissions: [] as string[] });
  const [formPerm, setFormPerm] = useState({ name: '', description: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const [rolesRes, permsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/roles', { headers }),
        fetch('http://127.0.0.1:8000/roles/permissions', { headers })
      ]);

      if (!rolesRes.ok || !permsRes.ok) throw new Error('Failed to fetch roles or permissions');
      
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formRole),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create role');
      setShowRoleModal(false);
      setFormRole({ name: '', permissions: [] });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/roles/${editingRole.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formRole),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update role');
      setEditingRole(null);
      setShowRoleModal(false);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteRole = async (name: string) => {
    if (!confirm(`Delete role ${name}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/roles/${name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete role');
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/roles/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formPerm),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create permission');
      setShowPermModal(false);
      setFormPerm({ name: '', description: '' });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeletePerm = async (name: string) => {
    if (!confirm(`Delete permission ${name}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/roles/permissions/${name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete permission');
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <Spinner size={28} /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  );

  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Role & Permission Management</h1>
          <p className="page-subtitle">Define access levels and their capabilities</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button 
          className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </button>
        <button 
          className={`btn ${activeTab === 'permissions' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
      </div>

      {activeTab === 'roles' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingRole(null); setFormRole({ name: '', permissions: [] }); setShowRoleModal(true); }}>+ Create Role</button>
          </div>
          <div className="glass-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.name}>
                    <td className="highlight">{r.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {r.permissions.map(p => (
                          <span key={p} style={{ fontSize: 10, padding: '2px 4px', background: 'rgba(0,0,0,0.1)', borderRadius: 3 }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingRole(r); setFormRole(r); setShowRoleModal(true); }}>Edit</button>
                      <button className="btn btn-secondary btn-sm" style={{ color: 'red' }} onClick={() => handleDeleteRole(r.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setFormPerm({ name: '', description: '' }); setShowPermModal(true); }}>+ Create Permission</button>
          </div>
          <div className="glass-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permission Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(p => (
                  <tr key={p.name}>
                    <td className="highlight">{p.name}</td>
                    <td>{p.description || '-'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ color: 'red' }} onClick={() => handleDeletePerm(p.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '500px', background: 'var(--bg-surface)' }}>
            <h2 className="page-title" style={{ fontSize: 20, marginBottom: 20 }}>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}</h2>
            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>ROLE NAME</label>
                <input className="input" style={{ width: '100%' }} value={formRole.name} onChange={e => setFormRole({...formRole, name: e.target.value})} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>PERMISSIONS</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: 12, background: 'rgba(0,0,0,0.02)' }}>
                  {permissions.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <input 
                        type="checkbox" 
                        checked={formRole.permissions.includes(p.name)} 
                        onChange={e => {
                          const next = e.target.checked 
                            ? [...formRole.permissions, p.name] 
                            : formRole.permissions.filter(name => name !== p.name);
                          setFormRole({...formRole, permissions: next});
                        }} 
                      />
                      <label style={{ fontSize: 13 }}>{p.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({p.description})</span></label>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingRole ? 'Save Changes' : 'Create Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface)' }}>
            <h2 className="page-title" style={{ fontSize: 20, marginBottom: 20 }}>Create New Permission</h2>
            <form onSubmit={handleCreatePerm}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>PERMISSION NAME</label>
                <input className="input" style={{ width: '100%' }} value={formPerm.name} onChange={e => setFormPerm({...formPerm, name: e.target.value})} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>DESCRIPTION</label>
                <textarea className="input" style={{ width: '100%', minHeight: '80px' }} value={formPerm.description} onChange={e => setFormPerm({...formPerm, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPermModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Permission</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
