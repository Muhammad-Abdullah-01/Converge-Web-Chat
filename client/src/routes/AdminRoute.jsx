import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500"></div>
      </div>
    );
  }

  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/chat" replace />;
};

export default AdminRoute;
