import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { forgotPasswordSchema } from '../validations/schema';
import api from '../services/api';
import { Loader2, MailCheck } from 'lucide-react';

const ForgotPassword = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Password reset link sent to your email.');
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || 'Something went wrong. Please check your email.');
    },
  });

  const onSubmit = (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    mutation.mutate(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white font-heading">Reset Password</h2>
      <p className="mt-1 text-sm text-slate-400">
        Enter your email to receive a password reset link
      </p>

      {errorMessage && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {successMessage ? (
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <MailCheck size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white font-heading">Email Sent</h3>
          <p className="mt-2 text-sm text-slate-400">{successMessage}</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition duration-200"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
              } px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
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
              'Send Reset Link'
            )}
          </button>
          
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-300 transition duration-200"
            >
              Cancel and go back
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
