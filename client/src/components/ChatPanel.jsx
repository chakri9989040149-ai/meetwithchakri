import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Smile } from 'lucide-react';

export default function ChatPanel({
  messages = [],
  currentUserId,
  onSendMessage,
  onClose
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-white border-l border-slate-200/80 shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">In-call Messages</h3>
            <p className="text-[11px] text-slate-500">Messages are visible to everyone</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-medium text-slate-600">No messages yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Start the discussion! Messages will be shared live with everyone in the meeting.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const timeStr = msg.sentAt
              ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Now';

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[11px] font-semibold text-slate-600 mb-1 px-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm break-words ${
                    isMe
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 px-1">{timeStr}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 shadow-sm transition-all">
          <input
            type="text"
            placeholder="Send a message to everyone..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
