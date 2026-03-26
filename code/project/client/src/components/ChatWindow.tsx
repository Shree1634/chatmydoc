import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { useChatStore, ChatMessage } from '../store/chatStore';

interface ChatWindowProps {
  pdfId: string;
}

function MessageBubble({ msg, pdfId }: { msg: ChatMessage; pdfId: string }) {
  const { deleteChat } = useChatStore();
  const isTemp = msg._id.startsWith('temp-');

  return (
    <div className="flex flex-col gap-2">
      {/* User question */}
      <div className="flex justify-end gap-2 items-start">
        <div className="max-w-[80%] btn-gradient text-white text-sm px-3.5 py-2.5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl leading-relaxed">
          {msg.question}
        </div>
        <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={13} className="text-purple-400" />
        </div>
      </div>

      {/* AI response */}
      <div className="flex gap-2 items-start">
        <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={13} className="text-blue-400" />
        </div>
        <div className="max-w-[80%] bg-[#16161f] border border-[#2a2a3a] text-[#f0f0ff] text-sm px-3.5 py-2.5 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl">
          {isTemp || !msg.response ? (
            <span className="flex items-center gap-1 py-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-[#606078] rounded-full typing-dot" style={{ animationDelay: `${d}s` }} />
              ))}
            </span>
          ) : (
            <>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.response}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a3a]">
                <span className="text-xs text-[#606078]">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                <button
                  onClick={() => deleteChat(pdfId, msg._id)}
                  className="text-[#606078] hover:text-red-400 p-0.5 rounded transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ pdfId }: ChatWindowProps) {
  const { chats, isLoading, isSending, fetchChats, sendMessage } = useChatStore();
  const [question, setQuestion] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (pdfId) fetchChats(pdfId); }, [pdfId, fetchChats]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats]);

  const handleSend = async () => {
    if (!question.trim() || isSending) return;
    const q = question.trim();
    setQuestion('');
    await sendMessage(pdfId, q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full bg-[#111118] rounded-2xl overflow-hidden border border-[#2a2a3a]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="spinner w-6 h-6" />
              <p className="text-sm text-[#606078]">Loading conversation...</p>
            </div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Bot size={44} className="text-[#2a2a3a]" />
            <div>
              <h3 className="font-semibold text-[#a0a0b8] mb-1">Ask anything about this document</h3>
              <p className="text-sm text-[#606078]">Type your question below to get started</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chats.map(msg => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <MessageBubble msg={msg} pdfId={pdfId} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#2a2a3a] flex gap-2 items-end">
        <textarea
          className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-3 py-2.5 text-sm text-[#f0f0ff] placeholder-[#606078] outline-none resize-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all leading-snug"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send)"
          rows={2}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!question.trim() || isSending}
          className="btn-gradient p-2.5 rounded-xl text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
