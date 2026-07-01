import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resetPasswordSchema } from '../validations/schema';
import api from '../services/api';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ password }) => {
      const response = await api.put(`/auth/resetpassword/${token}`, { password });
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Password reset successfully.');
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || 'Token is invalid or has expired.');
    },
  });

  const onSubmit = (data) => {
    setErrorMessage('');
    mutation.mutate(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white font-heading">Choose Password</h2>
      <p className="mt-1 text-sm text-slate-400">Enter a new secure password for your account</p>

      {errorMessage && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {successMessage ? (
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white font-heading">Success!</h3>
          <p className="mt-2 text-sm text-slate-400">{successMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition duration-200"
          >
            Sign In Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              New Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full rounded-lg bg-slate-900 border ${
                  errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
                } px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
              } px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200"
          >
            {mutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
