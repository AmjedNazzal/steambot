import { ReactNode, createContext, useState } from "react";
import { Message } from "../lib/validators/message";
import { nanoid } from "nanoid";

export const MessagesContext = createContext<{
  messages: Message[];
  isMessageUpdating: boolean;
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
  updateMessage: (id: string, updateFn: (prevText: string) => string) => void;
  setIsMessageUpdating: (isUpdating: boolean) => void;
}>({
  messages: [],
  isMessageUpdating: false,
  addMessage: () => {},
  removeMessage: () => {},
  updateMessage: () => {},
  setIsMessageUpdating: () => {},
});

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nanoid(),
      text: "Hello, how can I help you?",
      isUserMessage: false,
    },
  ]);

  const [isMessageUpdating, setIsMessageUpdating] = useState<boolean>(false);
  const [isMessagePending, setIsMessagePending] = useState<boolean>(false);

  const addMessage = (message: Message) => {
    const placeholderMessage = {
      id: nanoid(),
      text: "...",
      isUserMessage: false,
    };
    setMessages((prev) => [...prev, message, placeholderMessage]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  };

  const updateMessage = (
    id: string,
    updateFn: (prevText: string) => string
  ) => {
    setMessages((prev) => {
      const filteredMessages = prev.filter((message) => message.text !== "...");

      return filteredMessages.map((message) => {
        if (message.id === id) {
          return { ...message, text: updateFn(message.text) };
        }
        return message;
      });
    });
  };

  return (
    <MessagesContext.Provider
      value={{
        messages,
        addMessage,
        removeMessage,
        updateMessage,
        isMessageUpdating,
        setIsMessageUpdating,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
