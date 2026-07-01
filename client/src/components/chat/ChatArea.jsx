import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Send, AlertTriangle, ShieldAlert, Check, CheckCheck, Loader2, ArrowLeft } from 'lucide-react';

const ChatArea = ({ roomId, onBack }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // 1. Fetch Room Details
  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      // Find room in rooms list or query DB (using room list query is easy, but let's find it in cache)
      const rooms = queryClient.getQueryData(['rooms']) || [];
      let r = rooms.find((x) => x._id === roomId);
      if (!r) {
        // Fallback: fetch rooms
        const response = await api.get('/chat/rooms');
        r = response.data.rooms.find((x) => x._id === roomId);
      }
      return r;
    },
    enabled: !!roomId,
  });

  // 2. Fetch Messages for this room
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      const response = await api.get(`/chat/rooms/${roomId}/messages`);
      return response.data.messages || [];
    },
    enabled: !!roomId,
  });

  // 3. Mutation to submit report
  const reportMutation = useMutation({
    mutationFn: async ({ messageId, reason }) => {
      const response = await api.post(`/chat/messages/${messageId}/report`, { reason });
      return response.data;
    },
    onSuccess: () => {
      setReportSuccess('Message reported successfully.');
      setReportReason('');
      setTimeout(() => {
        setReportingMessage(null);
        setReportSuccess('');
      }, 2000);
    },
  });

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle Socket Events & Read Receipts
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join the room on socket
    socket.emit('join_room', roomId);

    // Send delivered receipt for any unread messages we received
    const unreadMsgIds = messages
      .filter((m) => m.sender?._id !== user?._id && !m.deliveredTo?.includes(user?._id))
      .map((m) => m._id);

    if (unreadMsgIds.length > 0) {
      socket.emit('mark_delivered', { roomId, messageIds: unreadMsgIds });
    }

    // Send read receipt immediately upon loading
    const unreadReadMsgIds = messages
      .filter((m) => m.sender?._id !== user?._id && !m.readBy?.includes(user?._id))
      .map((m) => m._id);

    if (unreadReadMsgIds.length > 0) {
      socket.emit('mark_read', { roomId, messageIds: unreadReadMsgIds });
    }

    // Socket Event: Message Received
    const handleMessageReceived = (newMessage) => {
      if (newMessage.room === roomId) {
        // Append to cache
        queryClient.setQueryData(['messages', roomId], (oldMessages = []) => {
          if (oldMessages.some((m) => m._id === newMessage._id)) return oldMessages;
          return [...oldMessages, newMessage];
        });

        // Send delivery & read status if we are currently looking at the chat
        if (newMessage.sender?._id !== user?._id) {
          socket.emit('mark_delivered', { roomId, messageIds: [newMessage._id] });
          socket.emit('mark_read', { roomId, messageIds: [newMessage._id] });
        }

        // Trigger refetch of rooms to update sidebar lastMessage
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }
    };

    // Socket Event: User Typing
    const handleUserTyping = ({ userId: typingId, username: typingName, roomId: typedRoomId }) => {
      if (typedRoomId === roomId && typingId !== user?._id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.id === typingId)) return prev;
          return [...prev, { id: typingId, username: typingName }];
        });
      }
    };

    // Socket Event: User Stop Typing
    const handleUserStopTyping = ({ userId: typingId, roomId: typedRoomId }) => {
      if (typedRoomId === roomId) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== typingId));
      }
    };

    // Socket Event: Messages Read Receipt
    const handleMessagesReadReceipt = ({ readerId, messageIds }) => {
      queryClient.setQueryData(['messages', roomId], (oldMessages = []) => {
        return oldMessages.map((m) => {
          if (messageIds.includes(m._id)) {
            return {
              ...m,
              status: 'read',
              readBy: [...new Set([...(m.readBy || []), readerId])],
            };
          }
          return m;
        });
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    };

    // Socket Event: Messages Delivered Receipt
    const handleMessagesDeliveredReceipt = ({ receiverId, messageIds }) => {
      queryClient.setQueryData(['messages', roomId], (oldMessages = []) => {
        return oldMessages.map((m) => {
          if (messageIds.includes(m._id)) {
            return {
              ...m,
              status: m.status === 'read' ? 'read' : 'delivered',
              deliveredTo: [...new Set([...(m.deliveredTo || []), receiverId])],
            };
          }
          return m;
        });
      });
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read_receipt', handleMessagesReadReceipt);
    socket.on('messages_delivered_receipt', handleMessagesDeliveredReceipt);

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('message_received', handleMessageReceived);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read_receipt', handleMessagesReadReceipt);
      socket.off('messages_delivered_receipt', handleMessagesDeliveredReceipt);
    };
  }, [socket, roomId, messages, user?._id, queryClient]);

  // Handle Typing Actions
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !roomId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { roomId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId });
      isTypingRef.current = false;
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !roomId) return;

    // Clear typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId });
    isTypingRef.current = false;

    // Emit message to server
    socket.emit('send_message', { roomId, text: inputText });
    setInputText('');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportingMessage) return;
    reportMutation.mutate({ messageId: reportingMessage._id, reason: reportReason });
  };

  if (!roomId) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950/20 text-slate-500">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold text-white font-heading">No Chat Selected</h2>
          <p className="mt-2 text-xs text-slate-400">
            Pick a user to message or create a group chat from the conversations list to begin.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingRoom || isLoadingMessages) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950/20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Get recipient (1-to-1)
  const isGroup = room?.isGroup;
  const getRecipient = () => room?.participants.find((p) => p._id !== user?._id);
  const chatName = isGroup ? room.name : getRecipient()?.username;
  const chatAvatar = isGroup ? room.avatar : getRecipient()?.avatar;
  const isRecipientOnline = !isGroup && getRecipient()?.status === 'online';

  return (
    <div className="flex h-full w-full flex-col bg-slate-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden mr-1 p-1 text-slate-400 hover:text-white transition duration-150"
              title="Back to Chats"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="relative">
            <img
              src={chatAvatar}
              alt={chatName}
              className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 object-cover"
            />
            {isRecipientOnline && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-950"></div>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">{chatName}</h3>
            <p className="text-[10px] text-slate-500 capitalize">
              {isGroup
                ? `${room.participants?.length} participants`
                : isRecipientOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Contain */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
            <p className="text-xs font-medium">No messages in this chat yet.</p>
            <p className="text-[10px] mt-0.5 text-slate-500">Send a message below to start the thread.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id;
            const msgStatus = msg.status || 'sent';

            return (
              <div
                key={msg._id}
                className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isMe && (
                  <img
                    src={msg.sender?.avatar}
                    alt={msg.sender?.username}
                    className="h-8 w-8 rounded-full bg-slate-900 object-cover self-end flex-shrink-0"
                  />
                )}
                
                <div className="space-y-1">
                  {!isMe && isGroup && (
                    <span className="text-[10px] text-slate-500 font-semibold ml-1">
                      {msg.sender?.username}
                    </span>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`relative group rounded-2xl px-4 py-2.5 text-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-900 text-slate-100 rounded-bl-none'
                    } shadow-md`}
                  >
                    <p className="leading-relaxed break-words">{msg.text}</p>
                    
                    {/* Timestamp & Status tick */}
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-slate-400 select-none">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && (
                        <span>
                          {msgStatus === 'read' ? (
                            <CheckCheck size={12} className="text-sky-400" />
                          ) : msgStatus === 'delivered' ? (
                            <CheckCheck size={12} className="text-slate-400" />
                          ) : (
                            <Check size={12} className="text-slate-500" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Report message option */}
                    {!isMe && (
                      <button
                        onClick={() => setReportingMessage(msg)}
                        className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 rounded-full bg-slate-800 border border-slate-700 p-1 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition duration-150 shadow-lg z-20"
                        title="Report Message"
                      >
                        <AlertTriangle size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicators */}
        {typingUsers.map((typingUsr) => (
          <div key={typingUsr.id} className="flex items-center gap-2 mr-auto max-w-[80%]">
            <span className="text-[10px] text-indigo-400 font-medium italic animate-pulse">
              {typingUsr.username} is typing...
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="flex h-16 flex-shrink-0 items-center gap-3 border-t border-slate-900 bg-slate-950/80 px-6"
      >
        <input
          type="text"
          placeholder="Write your message..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 rounded-full bg-slate-900 border border-slate-800 focus:border-indigo-500 px-5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition duration-200"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white disabled:bg-slate-900 disabled:text-slate-600 shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition duration-200"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Report Dialog Modal */}
      {reportingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <ShieldAlert className="text-red-500" size={18} />
              <h2 className="text-base font-bold text-white font-heading">Report Message</h2>
            </div>
            
            {reportSuccess ? (
              <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 text-center">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
                <div className="rounded-lg bg-slate-900/50 p-3 text-xs border border-slate-900 italic text-slate-400">
                  "{reportingMessage.text}"
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Reason for report
                  </label>
                  <textarea
                    required
                    placeholder="Describe why this message violates terms (e.g. spam, harassment)..."
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none resize-none transition duration-200"
                  />
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReportingMessage(null)}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportMutation.isPending || !reportReason.trim()}
                    className="flex items-center justify-center gap-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 px-3.5 py-2 text-xs font-semibold text-white transition duration-200"
                  >
                    {reportMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
