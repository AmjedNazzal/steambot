import React, { FC } from "react";
import ChatInput from "./chatInput";
import ChatMessages from "./chatMessages";

const Chat: FC = () => {
  return (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
      className="flex flex-grow flex-col w-[70%] h-full p-5 rounded-lg"
    >
      <ChatMessages className="px-2 py-3 flex-1" />
      <ChatInput className="px-4" />
    </div>
  );
};

export default Chat;
