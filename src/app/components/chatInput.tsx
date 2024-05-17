"use client";
import React, { FC, HTMLAttributes, useContext, useRef, useState } from "react";
import { cn } from "../utils/utils";
import TextareaAutosize from "react-textarea-autosize";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { Message } from "../lib/validators/message";
import { MessagesContext } from "../context/messages";
import { Loader2, CornerDownLeft } from "lucide-react";
import { toast } from "react-hot-toast";

interface ChatInputProps extends HTMLAttributes<HTMLDivElement> {}

const ChatInput: FC<ChatInputProps> = ({ className, ...props }) => {
  const [input, setInput] = useState<string>("");
  const [inputFallback, setInputFallback] = useState<string>("");
  const {
    messages,
    addMessage,
    removeMessage,
    updateMessage,
    isMessageUpdating,
    setIsMessageUpdating,
  } = useContext(MessagesContext);
  const textareaAutoRef = useRef<null | HTMLTextAreaElement>(null);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (message: Message) => {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error();
      }

      return response.body;
    },
    onMutate(message) {
      addMessage(message);
      setInputFallback(input);
      setInput("");
    },
    onSuccess: async (stream) => {
      if (!stream) throw new Error("Something went wrong");
      const id = nanoid();
      const responseMessage: Message = {
        id,
        isUserMessage: false,
        text: "",
      };
      addMessage(responseMessage);
      setIsMessageUpdating(true);

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        updateMessage(id, (prev) => prev + chunkValue);
      }

      setIsMessageUpdating(false);
      setTimeout(() => {
        textareaAutoRef.current?.focus();
      }, 10);
    },
    onError: (_, message) => {
      toast.error("Something went wrong. Please try again.");
      removeMessage(message.id);
      setInput(inputFallback);
      setIsMessageUpdating(false);
      setTimeout(() => {
        textareaAutoRef.current?.focus();
      }, 10);
    },
  });

  return (
    <div {...props} className={cn("border-t border-gray-500", className)}>
      <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border-none outline-none">
        <TextareaAutosize
          style={{ background: "rgba( 0, 0, 0, 0.2 )" }}
          ref={textareaAutoRef}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              const message: Message = {
                id: nanoid(),
                isUserMessage: true,
                text: input,
              };

              sendMessage(message);
            }
          }}
          disabled={isPending}
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="Write a message..."
          className="peer disabled:opacity-50 resize-none block w-full border-0 py-3 px-5 text-gray-200 focus:ring-0 text-sm sm:leading-6"
        />

        <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
          <kbd className="inline-flex items-center rounded border bg-[#2e4969] border-none px-1 font-sans text-xs text-gray-200">
            {isPending || isMessageUpdating ? (
              <Loader2 className="h-3 animate-spin" />
            ) : (
              <CornerDownLeft className="h-3" />
            )}
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
