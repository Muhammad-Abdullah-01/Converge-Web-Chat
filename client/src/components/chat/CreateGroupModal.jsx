import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupRoomSchema } from '../../validations/schema';
import api from '../../services/api';
import { X, Search, Loader2, Check } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, onRoomCreated }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      participants: [],
    },
  });

  // Sync selected participants list with React Hook Form state
  useEffect(() => {
    setValue('participants', selectedParticipants);
  }, [selectedParticipants, setValue]);

  // Fetch search users results via TanStack Query
  const { data: searchResults, isPending: isSearching } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const response = await api.get(`/users/search?query=${searchQuery}`);
      return response.data.users || [];
    },
    enabled: searchQuery.length > 1,
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/chat/group', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onRoomCreated(data.room._id);
      handleClose();
    },
  });

  const handleClose = () => {
    reset();
    setSelectedParticipants([]);
    setSearchQuery('');
    onClose();
  };

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <h2 className="text-xl font-bold text-white font-heading">Create Group Chat</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {mutation.error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {mutation.error.response?.data?.message || 'Failed to create group.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Group Name
            </label>
            <input
              type="text"
              placeholder="Project Alpha Group"
              className={`mt-2 w-full rounded-lg bg-slate-900 border ${
                errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
              } px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition duration-200`}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              placeholder="Talk about tasks, milestones..."
              rows={2}
              className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none resize-none transition duration-200"
              {...register('description')}
            />
          </div>

          {/* Participants Selection Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Participants
            </label>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-600 outline-none transition duration-200"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Selected Pills */}
            {selectedParticipants.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedParticipants.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 border border-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 font-semibold"
                  >
                    User ID: {id.substring(0, 5)}...
                    <button
                      type="button"
                      onClick={() => toggleParticipant(id)}
                      className="ml-1 text-indigo-400 hover:text-indigo-200"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errors.participants && (
              <p className="mt-1 text-xs text-red-400">{errors.participants.message}</p>
            )}

            {/* Search Results List */}
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-900 bg-slate-950 p-1 space-y-1">
              {isSearching && (
                <div className="flex justify-center p-3">
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                </div>
              )}

              {!isSearching && searchResults?.length === 0 && searchQuery.length > 1 && (
                <p className="text-center text-xs text-slate-600 py-3">No users found.</p>
              )}

              {!isSearching && (!searchResults || searchResults.length === 0) && searchQuery.length <= 1 && (
                <p className="text-center text-xs text-slate-600 py-3">Search above to find users.</p>
              )}

              {searchResults?.map((usr) => {
                const isSelected = selectedParticipants.includes(usr._id);
                return (
                  <button
                    key={usr._id}
                    type="button"
                    onClick={() => toggleParticipant(usr._id)}
                    className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-slate-900 transition duration-150"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <img
                        src={usr.avatar}
                        alt={usr.username}
                        className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{usr.username}</p>
                        <p className="text-[10px] text-slate-500">{usr.email}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="rounded-full bg-indigo-500 p-0.5 text-white">
                        <Check size={10} />
                      </div>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-slate-700"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 px-4 py-2 text-xs font-semibold text-white transition duration-200"
            >
              {mutation.isPending && <Loader2 size={12} className="animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
