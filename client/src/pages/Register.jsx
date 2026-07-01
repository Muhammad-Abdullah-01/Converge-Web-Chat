import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerSchema } from '../validations/schema';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ username, email, password }) => {
      const result = await signup(username, email, password);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      navigate('/chat');
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const onSubmit = (data) => {
    setErrorMessage('');
    mutation.mutate(data);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white font-heading">Get Started</h2>
      <p className="mt-1 text-sm text-slate-400">Create an account to start chatting</p>

      {errorMessage && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Username
          </label>
          <input
            type="text"
            placeholder="johndoe"
            className={`mt-2 w-full rounded-lg bg-slate-900 border ${
              errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
            } px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
            {...register('username')}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
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
            'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition duration-200"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
