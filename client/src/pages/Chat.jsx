import React, { useState } from 'react';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';

const Chat = () => {
  const [activeRoomId, setActiveRoomId] = useState(null);

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden">
      {/* Sidebar Panel: Show on desktop always, on mobile only when no activeRoomId is selected */}
      <div className={`h-full w-full md:w-80 flex-shrink-0 ${activeRoomId ? 'hidden md:block' : 'block'}`}>
        <Sidebar activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
      </div>

      {/* Chat Area Panel: Show on desktop always, on mobile only when activeRoomId is selected */}
      <div className={`h-full flex-1 ${!activeRoomId ? 'hidden md:block' : 'block'}`}>
        <ChatArea roomId={activeRoomId} onBack={() => setActiveRoomId(null)} />
      </div>
    </div>
  );
};

export default Chat;
