import React, { createContext, useContext, useState } from 'react';

interface AuthUser {
  username: string;
  role: string;
  permissions: string[];
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, username: string, role: string, permissions: string[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedPerms = localStorage.getItem('permissions');

    if (storedToken && storedUser && storedRole && storedPerms) {
      return {
        token: storedToken,
        username: storedUser,
        role: storedRole,
        permissions: JSON.parse(storedPerms),
      };
    }
    return null;
  });

  const login = (token: string, username: string, role: string, permissions: string[]) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', username);
    localStorage.setItem('role', role);
    localStorage.setItem('permissions', JSON.stringify(permissions));
    setUser({ token, username, role, permissions });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
