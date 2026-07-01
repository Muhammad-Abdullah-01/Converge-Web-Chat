import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Users, MessageSquareCode, Circle } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ activeRoomId, onSelectRoom }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userQuery, setUserQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // 1. Fetch current user's active rooms
  const { data: roomsData, isPending: isLoadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get('/chat/rooms');
      return response.data.rooms || [];
    },
  });

  // 2. Fetch user search list for starting new private chats
  const { data: searchedUsers, isPending: isSearchingUsers } = useQuery({
    queryKey: ['users', 'search', userQuery],
    queryFn: async () => {
      if (!userQuery) return [];
      const response = await api.get(`/users/search?query=${userQuery}`);
      return response.data.users || [];
    },
    enabled: userQuery.length > 1,
  });

  // 3. Mutation to start or join a private chat
  const privateChatMutation = useMutation({
    mutationFn: async (recipientId) => {
      const response = await api.post('/chat/private', { recipientId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onSelectRoom(data.room._id);
      setUserQuery(''); // clear user search
    },
  });

  // Helper: Extract other participant for 1-to-1 chats
  const getRecipient = (room) => {
    return room.participants.find((p) => p._id !== user?._id);
  };

  const handleUserClick = (recipientId) => {
    privateChatMutation.mutate(recipientId);
  };

  // Filter listed rooms based on user input (room filter)
  const filteredRooms = roomsData?.filter((room) => {
    if (room.isGroup) {
      return room.name.toLowerCase().includes(roomFilter.toLowerCase());
    } else {
      const recipient = getRecipient(room);
      return recipient?.username.toLowerCase().includes(roomFilter.toLowerCase());
    }
  }) || [];

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-900 bg-slate-950/40">
      {/* Search Users Input */}
      <div className="p-4 border-b border-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white font-heading">Conversations</h2>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-indigo-600/10 border border-indigo-500/20 px-2.5 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition duration-200"
            title="Create Group"
          >
            <Plus size={14} />
            Group
          </button>
        </div>

        {/* Global User Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users to chat..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="w-full rounded-lg bg-slate-900/60 border border-slate-900 focus:border-indigo-500 px-4 py-2 pl-9 text-xs text-white placeholder-slate-500 outline-none transition duration-200"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>

        {/* User Search Results Popup */}
        {userQuery.length > 1 && (
          <div className="absolute left-4 right-4 z-40 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl space-y-1">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-900 mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Search Results</span>
              <button onClick={() => setUserQuery('')} className="text-[10px] text-slate-400 hover:text-white">Clear</button>
            </div>

            {isSearchingUsers && (
              <p className="text-center text-xs text-slate-500 py-3">Searching...</p>
            )}

            {!isSearchingUsers && searchedUsers?.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-3">No users found.</p>
            )}

            {!isSearchingUsers &&
              searchedUsers?.map((usr) => (
                <button
                  key={usr._id}
                  onClick={() => handleUserClick(usr._id)}
                  disabled={privateChatMutation.isPending}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-900 transition duration-150"
                >
                  <img
                    src={usr.avatar}
                    alt={usr.username}
                    className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{usr.username}</p>
                    <p className="text-[10px] text-slate-500">{usr.email}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Filter Rooms Input */}
      <div className="px-4 py-2 border-b border-slate-900">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter chats..."
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full rounded-lg bg-slate-900/30 border border-slate-950 focus:border-indigo-500 px-4 py-1.5 pl-8 text-[11px] text-slate-300 placeholder-slate-600 outline-none transition duration-200"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingRooms ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-2 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-indigo-500"></div>
            <span className="text-xs">Loading chats...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-600 px-4">
            <MessageSquareCode size={28} className="mb-2 text-slate-700" />
            <p className="text-xs">No active chats found.</p>
            <p className="text-[10px] mt-1 text-slate-500">Search above or create a group to start messaging.</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isActive = room._id === activeRoomId;
            const isGroup = room.isGroup;
            
            // Get proper details depending on chat type
            const chatName = isGroup ? room.name : getRecipient(room)?.username;
            const chatAvatar = isGroup ? room.avatar : getRecipient(room)?.avatar;
            const isOnline = !isGroup && getRecipient(room)?.status === 'online';
            
            const lastMsg = room.lastMessage;
            const lastMsgText = lastMsg
              ? lastMsg.sender?._id === user?._id
                ? `You: ${lastMsg.text}`
                : `${lastMsg.sender?.username}: ${lastMsg.text}`
              : room.description || 'No messages yet';

            return (
              <button
                key={room._id}
                onClick={() => onSelectRoom(room._id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                {/* Avatar with status dot */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chatAvatar}
                    alt={chatName}
                    className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 object-cover"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-950"></div>
                  )}
                  {isGroup && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-indigo-500/20 p-0.5 text-indigo-400 border border-slate-950">
                      <Users size={8} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {chatName}
                    </p>
                    {lastMsg && (
                      <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {lastMsgText}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onRoomCreated={(roomId) => onSelectRoom(roomId)}
      />
    </div>
  );
};

export default Sidebar;
