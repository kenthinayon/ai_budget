"use client";

import { useRef, useEffect, useState } from "react";
import { useChat, type Message } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Bot, Send, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_QUESTIONS = [
  "How is my budget looking?",
  "Explain the 50/30/20 rule",
  "How can I save more?",
  "Analyze my food spending",
];

export function ChatInterface() {
  const { messages, setMessages, input, handleInputChange, handleSubmit, setInput, isLoading } = useChat({
    api: "/api/chat",
  });

  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch history from the database when the component mounts
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/chat/history");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    
    fetchHistory();
  }, [setMessages]);

  const handleClearChat = async () => {
    if (window.confirm("Start a new conversation and clear chat history?")) {
      try {
        await fetch("/api/chat/history", { method: "DELETE" });
        setMessages([]);
      } catch (err) {
        console.error("Failed to clear chat history:", err);
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickQuestionClick = (question: string) => {
    setInput(question);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Only submit if there's text
      if (input.trim()) {
        const fakeEvent = new Event("submit") as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(fakeEvent);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] w-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Kent AI
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Your personal financial advisor
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message: Message) => {
          const isAi = message.role === "assistant";
          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4 max-w-[85%]",
                isAi ? "mr-auto" : "ml-auto flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div 
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1",
                  isAi 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {isAi ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "flex flex-col",
                  isAi ? "items-start" : "items-end"
                )}
              >
                <div
                  className={cn(
                    "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed",
                    isAi
                      ? "bg-slate-100 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 rounded-tl-sm prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:m-0 max-w-none break-words"
                      : "bg-emerald-500 text-white rounded-tr-sm"
                  )}
                >
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
                {/* Optional Timestamp below bubble can go here */}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-4 max-w-[85%] mr-auto">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1 bg-emerald-500 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900/50 rounded-tl-sm flex items-center gap-1.5">
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
        
        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 px-1">
              Quick questions:
            </h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickQuestionClick(q)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-1 focus-within:ring-emerald-500 transition-shadow p-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Ask me anything about your finances..."
            className="min-h-[56px] max-h-32 w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-3 py-3.5 text-base placeholder:text-slate-400 scrollbar-hide"
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-opacity disabled:opacity-50 mb-0.5 mr-0.5"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <div className="text-center mt-3">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Press Enter to send • Shift + Enter for new line
          </span>
        </div>
      </div>

    </div>
  );
}
