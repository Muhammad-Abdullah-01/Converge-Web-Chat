import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { profileSchema, changePasswordSchema } from '../validations/schema';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, User, KeyRound, Check, RefreshCw } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Form 1: Profile info
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
    },
  });

  // Form 2: Password change
  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwdForm,
    formState: { errors: pwdErrors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data) => {
      const result = await updateProfile(data);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    },
    onError: (error) => {
      setProfileError(error.message);
      setTimeout(() => setProfileError(''), 4000);
    },
  });

  const pwdMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setPwdSuccess('Password changed successfully.');
      resetPwdForm();
      setTimeout(() => setPwdSuccess(''), 4000);
    },
    onError: (error) => {
      setPwdError(error.response?.data?.message || 'Password update failed.');
      setTimeout(() => setPwdError(''), 4000);
    },
  });

  const onProfileSubmit = (data) => {
    setProfileError('');
    setProfileSuccess('');
    profileMutation.mutate(data);
  };

  const onPwdSubmit = (data) => {
    setPwdError('');
    setPwdSuccess('');
    pwdMutation.mutate(data);
  };

  const generateNewAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    setProfileValue('avatar', newAvatar);
  };

  const currentAvatar = watchProfile('avatar') || user?.avatar;

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">
            Profile Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your account settings, avatar, and password credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Profile Form (Left side/Wide) */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel rounded-2xl p-6 shadow-xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white font-heading mb-6">
                <User size={18} className="text-indigo-400" />
                Personal Info
              </h2>

              {profileSuccess && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                {/* Avatar Display & Randomizer */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={currentAvatar}
                    alt="Current Avatar"
                    className="h-20 w-20 rounded-full border-2 border-slate-800 bg-slate-900 object-cover shadow-lg"
                  />
                  <div>
                    <button
                      type="button"
                      onClick={generateNewAvatar}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 transition duration-200"
                    >
                      <RefreshCw size={12} />
                      Randomize Avatar
                    </button>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Generated from DiceBear bottts library.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Username
                  </label>
                  <input
                    type="text"
                    className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                      profileErrors.username
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                    {...registerProfile('username')}
                  />
                  {profileErrors.username && (
                    <p className="mt-1 text-xs text-red-400">{profileErrors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                      profileErrors.email
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                    {...registerProfile('email')}
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-xs text-red-400">{profileErrors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200"
                >
                  {profileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Password Form (Right side/Narrow) */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 shadow-xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white font-heading mb-6">
                <KeyRound size={18} className="text-indigo-400" />
                Change Password
              </h2>

              {pwdSuccess && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                  {pwdSuccess}
                </div>
              )}
              {pwdError && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {pwdError}
                </div>
              )}

              <form onSubmit={handlePwdSubmit(onPwdSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                      pwdErrors.currentPassword
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                    {...registerPwd('currentPassword')}
                  />
                  {pwdErrors.currentPassword && (
                    <p className="mt-1 text-xs text-red-400">{pwdErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                      pwdErrors.newPassword
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                    {...registerPwd('newPassword')}
                  />
                  {pwdErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-400">{pwdErrors.newPassword.message}</p>
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
                      pwdErrors.confirmNewPassword
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
                    {...registerPwd('confirmNewPassword')}
                  />
                  {pwdErrors.confirmNewPassword && (
                    <p className="mt-1 text-xs text-red-400">{pwdErrors.confirmNewPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwdMutation.isPending}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200"
                >
                  {pwdMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
