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
    <div className="chat-message-group">
      {/* User question */}
      <div className="chat-bubble user-bubble">
        <div className="bubble-avatar user-av"><User size={14} /></div>
        <div className="bubble-content user-content">{msg.question}</div>
      </div>

      {/* AI response */}
      <div className="chat-bubble ai-bubble">
        <div className="bubble-avatar ai-av"><Bot size={14} /></div>
        <div className="bubble-content ai-content">
          {isTemp || !msg.response ? (
            <span className="typing-indicator">
              <span /><span /><span />
            </span>
          ) : (
            <>
              <div className="response-text">{msg.response}</div>
              <div className="bubble-footer">
                <span className="bubble-time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                <button
                  className="delete-chat-btn"
                  onClick={() => deleteChat(pdfId, msg._id)}
                  title="Delete message"
                >
                  <Trash2 size={12} />
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (pdfId) fetchChats(pdfId);
  }, [pdfId, fetchChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const handleSend = async () => {
    if (!question.trim() || isSending) return;
    const q = question.trim();
    setQuestion('');
    await sendMessage(pdfId, q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-window">
      {/* Messages */}
      <div className="chat-messages">
        {isLoading && chats.length === 0 ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading conversation...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} style={{ margin: '0 auto 1rem', opacity: .3 }} />
            <h3>Ask anything about this document</h3>
            <p>Type your question below to get started</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chats.map((msg) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .25 }}
              >
                <MessageBubble msg={msg} pdfId={pdfId} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this document... (Enter to send)"
          rows={2}
          disabled={isSending}
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={handleSend}
          disabled={!question.trim() || isSending}
        >
          {isSending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </div>

      <style>{`
        .chat-window {
          display: flex; flex-direction: column; height: 100%;
          background: var(--bg-secondary); border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-message-group { display: flex; flex-direction: column; gap: .5rem; }
        .chat-bubble { display: flex; gap: .6rem; align-items: flex-start; }
        .user-bubble { flex-direction: row-reverse; }
        .bubble-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .user-av { background: var(--accent-gradient); color: #fff; }
        .ai-av { background: rgba(59,130,246,.2); color: var(--accent-blue); }
        .bubble-content {
          max-width: 80%; padding: .75rem 1rem;
          border-radius: var(--radius-md); font-size: .9rem; line-height: 1.6;
        }
        .user-content {
          background: var(--accent-gradient); color: #fff;
          border-radius: var(--radius-md) 4px var(--radius-md) var(--radius-md);
        }
        .ai-content {
          background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border);
          border-radius: 4px var(--radius-md) var(--radius-md) var(--radius-md);
        }
        .response-text { white-space: pre-wrap; }
        .bubble-footer {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: .5rem; padding-top: .5rem; border-top: 1px solid var(--border);
        }
        .bubble-time { font-size: .75rem; color: var(--text-muted); }
        .delete-chat-btn {
          background: none; color: var(--text-muted); padding: 2px 4px; border-radius: 4px;
          transition: var(--transition);
        }
        .delete-chat-btn:hover { color: var(--error); }
        .typing-indicator { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .typing-indicator span {
          width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
          animation: bounce 1.2s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: .2s; }
        .typing-indicator span:nth-child(3) { animation-delay: .4s; }
        @keyframes bounce { 0%,80%,100% { transform: scale(.8); opacity: .5; } 40% { transform: scale(1.2); opacity: 1; } }
        .chat-input-area {
          padding: 1rem; border-top: 1px solid var(--border);
          display: flex; gap: .75rem; align-items: flex-end;
        }
        .chat-textarea {
          flex: 1; background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-primary);
          padding: .65rem 1rem; font-size: .9rem; font-family: inherit;
          resize: none; transition: var(--transition); line-height: 1.5;
        }
        .chat-textarea:focus { outline: none; border-color: var(--accent-purple); box-shadow: 0 0 0 3px rgba(139,92,246,.15); }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-send-btn { padding: .7rem; border-radius: var(--radius-md); flex-shrink: 0; }
        .spin { animation: spin .7s linear infinite; }
      `}</style>
    </div>
  );
}
