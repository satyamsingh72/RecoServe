import React, { useEffect, useState } from 'react';
import { fetchStats } from '../api/client'; // I will need to add user management calls to api/client or use fetch directly
import Spinner from '../components/Spinner';

interface User {
  username: string;
  role: string;
  is_active: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formUser, setFormUser] = useState({ username: '', password: '', role: 'Standard', is_active: true });
  const [formPass, setFormPass] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formUser),
      });
      if (!res.ok) throw new Error('Failed to create user');
      setShowCreateModal(false);
      setFormUser({ username: '', password: '', role: 'Standard', is_active: true });
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/${editingUser.username}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ 
          role: formUser.role, 
          is_active: formUser.is_active 
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/${editingUser.username}/password`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ password: formPass }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      setFormPass('');
      alert('Password updated successfully');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <Spinner size={28} /><span style={{ color: 'var(--text-muted)' }}>Loading users…</span>
    </div>
  );

  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-subtitle">Manage system access and user roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create User</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username}>
                <td className="highlight">{u.username}</td>
                <td>
                  <span style={{ 
                    fontSize: 12, padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: 4, color: 'var(--text-muted)' 
                  }}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <div className={`status-badge ${u.is_active ? 'status-succeeded' : 'status-failed'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => {
                      setEditingUser(u);
                      setFormUser({ ...u });
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ width: '400px', background: 'var(--bg-surface)' }}>
            <h2 className="page-title" style={{ fontSize: 20, marginBottom: 20 }}>Create New User</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>USERNAME</label>
                <input className="input" style={{ width: '100%' }} value={formUser.username} onChange={e => setFormUser({...formUser, username: e.target.value})} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>PASSWORD</label>
                <input className="input" style={{ width: '100%' }} type="password" value={formUser.password} onChange={e => setFormUser({...formUser, password: e.target.value})} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>ROLE</label>
                <select className="input" style={{ width: '100%' }} value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
                  <option value="Standard">Standard</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={formUser.is_active} onChange={e => setFormUser({...formUser, is_active: e.target.checked})} />
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Account Active</label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ width: '450px', background: 'var(--bg-surface)' }}>
            <h2 className="page-title" style={{ fontSize: 20, marginBottom: 20 }}>Edit User: {editingUser.username}</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>ROLE</label>
                <select className="input" style={{ width: '100%' }} value={formUser.role} onChange={e => setFormUser({...formUser, role: e.target.value})}>
                  <option value="Standard">Standard</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={formUser.is_active} onChange={e => setFormUser({...formUser, is_active: e.target.checked})} />
                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Account Active</label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
            
            <div className="divider" />
            
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Reset Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: 10 }}>
              <input 
                className="input" 
                style={{ flex: 1 }} 
                type="password" 
                placeholder="New password" 
                value={formPass} 
                onChange={e => setFormPass(e.target.value)} 
                required 
              />
              <button type="submit" className="btn btn-secondary btn-sm">Update</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
