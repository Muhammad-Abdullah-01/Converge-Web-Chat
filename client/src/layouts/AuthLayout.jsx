import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  // Redirect to chat if already logged in
  if (user && !loading) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"></div>
      
      {/* Dot Grid Overlay */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md">
        <div className="glass-panel w-full rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white font-heading">
              ⚡ CONVERGE
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Real-time messaging simplified
            </p>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
