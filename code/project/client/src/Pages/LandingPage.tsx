import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Sparkles, Table, Image, GitBranch, ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  { icon: MessageSquare, color: 'bg-purple-500/20 text-purple-400', title: 'Chat with PDFs', desc: 'Ask questions and get AI-powered answers directly from your documents.' },
  { icon: Sparkles, color: 'bg-blue-500/20 text-blue-400', title: 'AI Summaries', desc: 'Get concise, intelligent summaries of long documents in seconds.' },
  { icon: GitBranch, color: 'bg-emerald-500/20 text-emerald-400', title: 'Document Flow', desc: 'Visualize the structure and outline of your document automatically.' },
  { icon: Table, color: 'bg-amber-500/20 text-amber-400', title: 'Table Extraction', desc: 'Automatically extract all tables with CSV export support.' },
  { icon: Image, color: 'bg-red-500/20 text-red-400', title: 'Image Extraction', desc: 'Extract page images from PDF documents with a single click.' },
  { icon: FileText, color: 'bg-purple-500/20 text-purple-400', title: 'Secure Storage', desc: 'Your documents are safely stored and accessible from anywhere.' },
];

const highlights = [
  'No credit card required',
  'Powered by Gemini 1.5 Flash AI',
  'Supports PDFs up to 10MB',
  'Complete conversation history',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0ff]">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="px-4 py-20 bg-hero-glow">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-sm font-semibold w-fit">
              <Sparkles size={14} />
              Powered by Gemini 1.5 Flash AI
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Chat with your{' '}
              <span className="gradient-text">PDF documents</span>{' '}
              intelligently
            </h1>

            <p className="text-base text-[#a0a0b8] leading-relaxed max-w-lg">
              Upload any PDF and instantly chat with it, extract tables, generate summaries, visualize document flow, and more — all powered by cutting-edge AI.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-[#16161f] border border-[#2a2a3a] text-[#f0f0ff] hover:border-[#3a3a4a] transition-colors">
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              {highlights.map(h => (
                <span key={h} className="flex items-center gap-1.5 text-xs text-[#606078]">
                  <CheckCircle size={13} className="text-emerald-400" />
                  {h}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — Chat Preview Card */}
          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-full max-w-sm bg-[#16161f] border border-[#2a2a3a] rounded-2xl overflow-hidden shadow-glow">
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#111118] border-b border-[#2a2a3a]">
                <div className="flex gap-1.5">
                  {['bg-[#3a3a4a]', 'bg-[#3a3a4a]', 'bg-[#3a3a4a]'].map((c, i) => (
                    <span key={i} className={`w-3 h-3 ${c} rounded-full`} />
                  ))}
                </div>
                <span className="text-xs text-[#606078] font-medium">ChatMyDoc — AI Assistant</span>
              </div>
              {/* Messages */}
              <div className="p-4 flex flex-col gap-3">
                <div className="flex">
                  <span className="bg-[#111118] text-[#a0a0b8] text-xs px-3 py-2 rounded-tl rounded-bl-2xl rounded-br-2xl rounded-tr-2xl max-w-[85%] leading-relaxed">
                    Hello! I've analyzed your document. What would you like to know?
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="btn-gradient text-white text-xs px-3 py-2 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl max-w-[85%] leading-relaxed">
                    What are the key findings in this research paper?
                  </span>
                </div>
                <div className="flex">
                  <span className="bg-[#111118] text-[#a0a0b8] text-xs px-3 py-2 rounded-tl rounded-bl-2xl rounded-br-2xl rounded-tr-2xl max-w-[85%] leading-relaxed">
                    Based on the document, there are 3 key findings: 1) Performance improved by 40%, 2) Cost reduction achieved...
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-[#606078] rounded-full typing-dot" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-2">Everything you need</h2>
            <p className="text-[#a0a0b8]">Powerful tools to work smarter with your documents</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#3a3a4a] transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-base text-[#f0f0ff]">{f.title}</h3>
                <p className="text-sm text-[#a0a0b8] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-12 text-center flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold">Ready to transform how you read?</h2>
            <p className="text-[#a0a0b8] max-w-md">Join thousands of users who already use ChatMyDoc to work smarter with their documents.</p>
            <Link to="/register" className="btn-gradient flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white">
              Start for Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#2a2a3a] py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="w-7 h-7 btn-gradient rounded-lg flex items-center justify-center">
              <FileText size={13} className="text-white" />
            </div>
            ChatMyDoc
          </div>
          <p className="text-xs text-[#606078]">© 2025 ChatMyDoc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
