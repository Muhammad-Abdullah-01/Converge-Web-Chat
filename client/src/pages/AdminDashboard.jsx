import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Users,
  MessageSquare,
  MessageCircle,
  AlertOctagon,
  Activity,
  Trash2,
  Shield,
  ShieldAlert,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'users', 'rooms', 'reports'

  // 1. Fetch Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.stats;
    },
    enabled: activeTab === 'stats',
  });

  // 2. Fetch Users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data.users || [];
    },
    enabled: activeTab === 'users',
  });

  // 3. Fetch Rooms
  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: async () => {
      const response = await api.get('/admin/rooms');
      return response.data.rooms || [];
    },
    enabled: activeTab === 'rooms',
  });

  // 4. Fetch Reports
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const response = await api.get('/admin/reports');
      return response.data.reports || [];
    },
    enabled: activeTab === 'reports',
  });

  // Mutations
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await api.put(`/admin/users/${userId}`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId) => {
      const response = await api.delete(`/admin/rooms/${roomId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, action }) => {
      const response = await api.put(`/admin/reports/${reportId}`, { action });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const handleRoleToggle = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (confirm(`Are you sure you want to change user role to ${newRole}?`)) {
      toggleRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleDeleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user? All their messages and conversations will be deleted!')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleDeleteRoom = (roomId) => {
    if (confirm('Are you sure you want to delete this chat room and all its messages?')) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  const handleResolveReport = (reportId, action) => {
    // action: 'dismiss' or 'delete_message'
    const promptMsg =
      action === 'delete_message'
        ? 'Delete the reported message and resolve report?'
        : 'Dismiss this report without deleting the message?';
    if (confirm(promptMsg)) {
      resolveReportMutation.mutate({ reportId, action });
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor activity, manage users, audit rooms, and review reported content.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-900 gap-6">
          {[
            { id: 'stats', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'rooms', label: 'Chat Rooms', icon: MessageCircle },
            { id: 'reports', label: 'Reports', icon: AlertOctagon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-semibold transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="py-4">
          {/* OVERVIEW TAB */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {isLoadingStats ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div className="glass-panel rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-indigo-400">
                      <Users size={20} />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-white">{statsData?.totalUsers}</p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Users</p>
                  </div>

                  <div className="glass-panel rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-indigo-400">
                      <MessageCircle size={20} />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-white">{statsData?.totalRooms}</p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Rooms</p>
                  </div>

                  <div className="glass-panel rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-indigo-400">
                      <MessageSquare size={20} />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-white">{statsData?.totalMessages}</p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Messages Sent</p>
                  </div>

                  <div className="glass-panel rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-rose-500">
                      <AlertOctagon size={20} />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-white">{statsData?.totalReports}</p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Reports</p>
                  </div>

                  <div className="glass-panel rounded-xl p-5 shadow-lg col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-emerald-400">
                      <Activity size={20} className="animate-pulse" />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold text-white">{statsData?.onlineUsers}</p>
                    <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">Online Users</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 shadow-xl">
              {isLoadingUsers ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {usersData.map((usr) => (
                        <tr key={usr._id} className="hover:bg-slate-900/20">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img
                              src={usr.avatar}
                              alt={usr.username}
                              className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                            />
                            <span className="font-semibold text-white">{usr.username}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{usr.email}</td>
                          <td className="px-6 py-4 capitalize">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                usr.role === 'admin'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700/30'
                              }`}
                            >
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                usr.status === 'online'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}
                            >
                              {usr.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRoleToggle(usr._id, usr.role)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition duration-150"
                                title="Toggle Admin Role"
                              >
                                <Shield size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(usr._id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition duration-150"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CHAT ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 shadow-xl">
              {isLoadingRooms ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Room Name / Participants</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Creator</th>
                        <th className="px-6 py-4">Participants Count</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {roomsData.map((rm) => {
                        const name = rm.isGroup
                          ? rm.name
                          : rm.participants?.map((p) => p.username).join(' & ');
                        const creator = rm.creator?.username || 'System (Private)';
                        
                        return (
                          <tr key={rm._id} className="hover:bg-slate-900/20">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {rm.avatar ? (
                                  <img
                                    src={rm.avatar}
                                    alt={name}
                                    className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold">
                                    {rm.isGroup ? rm.name[0]?.toUpperCase() : 'P'}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{name}</p>
                                  <p className="text-[10px] text-slate-500 truncate max-w-xs">{rm.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 capitalize">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  rm.isGroup
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {rm.isGroup ? 'Group' : 'Private'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">{creator}</td>
                            <td className="px-6 py-4 text-slate-400">{rm.participants?.length}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteRoom(rm._id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition duration-150"
                                title="Delete Room"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 shadow-xl">
              {isLoadingReports ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              ) : reportsData.length === 0 ? (
                <p className="text-center text-slate-500 py-20 text-sm">No reported messages found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Reporter</th>
                        <th className="px-6 py-4">Offender</th>
                        <th className="px-6 py-4">Message</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {reportsData.map((rp) => (
                        <tr
                          key={rp._id}
                          className={`hover:bg-slate-900/20 ${rp.status === 'pending' ? 'bg-rose-500/[0.02]' : ''}`}
                        >
                          <td className="px-6 py-4 font-semibold text-white">{rp.reporter?.username}</td>
                          <td className="px-6 py-4 font-semibold text-rose-400">{rp.reportedUser?.username}</td>
                          <td className="px-6 py-4">
                            <div className="rounded bg-slate-950 border border-slate-900 p-2 text-slate-300 max-w-xs break-words">
                              {rp.message?.text || <span className="text-slate-600 italic">Deleted</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{rp.reason}</td>
                          <td className="px-6 py-4 capitalize">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                rp.status === 'pending'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {rp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {rp.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleResolveReport(rp._id, 'dismiss')}
                                  className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 transition duration-150"
                                >
                                  <CheckCircle size={10} />
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleResolveReport(rp._id, 'delete_message')}
                                  className="flex items-center gap-1 rounded bg-rose-600 hover:bg-rose-500 px-2 py-1 text-[10px] font-semibold text-white transition duration-150 shadow"
                                >
                                  <ShieldAlert size={10} />
                                  Delete Msg
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
