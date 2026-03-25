import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Sparkles, Table, Image, GitBranch, ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  { icon: MessageSquare, color: '#8b5cf6', title: 'Chat with PDFs', desc: 'Ask questions and get AI-powered answers directly from your documents.' },
  { icon: Sparkles, color: '#3b82f6', title: 'AI Summaries', desc: 'Get concise, intelligent summaries of long documents in seconds.' },
  { icon: GitBranch, color: '#10b981', title: 'Document Flow', desc: 'Visualize the structure and outline of your document automatically.' },
  { icon: Table, color: '#f59e0b', title: 'Table Extraction', desc: 'Automatically extract all tables with CSV export support.' },
  { icon: Image, color: '#ef4444', title: 'Image Extraction', desc: 'Extract page images from PDF documents with a single click.' },
  { icon: FileText, color: '#8b5cf6', title: 'Secure Storage', desc: 'Your documents are safely stored and accessible from anywhere.' },
];

const highlights = [
  'No credit card required',
  'Powered by Gemini 1.5 Flash AI',
  'Supports PDFs up to 10MB',
  'Complete conversation history',
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .6 }}
          >
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Powered by Gemini 1.5 Flash AI</span>
            </div>
            <h1 className="hero-title">
              Chat with your <span className="gradient-text">PDF documents</span> intelligently
            </h1>
            <p className="hero-subtitle">
              Upload any PDF and instantly chat with it, extract tables, generate summaries, visualize document flow, and more — all powered by cutting-edge AI.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
            <div className="hero-highlights">
              {highlights.map((h) => (
                <span key={h} className="highlight-item">
                  <CheckCircle size={14} color="var(--success)" />
                  {h}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: .95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .6, delay: .2 }}
          >
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="hero-card-dots">
                  <span /><span /><span />
                </div>
                <span className="hero-card-title">ChatMyDoc — AI Assistant</span>
              </div>
              <div className="hero-card-body">
                <div className="hero-msg ai">
                  <span>Hello! I've analyzed your document. What would you like to know?</span>
                </div>
                <div className="hero-msg user">
                  <span>What are the key findings in this research paper?</span>
                </div>
                <div className="hero-msg ai">
                  <span>Based on the document, there are 3 key findings: 1) Performance improved by 40%, 2) Cost reduction achieved...</span>
                </div>
                <div className="hero-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Everything you need</h2>
            <p>Powerful tools to work smarter with your documents</p>
          </motion.div>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * .08 }}
                whileHover={{ y: -4, transition: { duration: .2 } }}
              >
                <div className="feature-icon" style={{ background: `${f.color}20`, color: f.color }}>
                  <f.icon size={22} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to transform how you read?</h2>
            <p>Join thousands of users who already use ChatMyDoc to work smarter with their documents.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-logo">
            <div className="logo-icon" style={{ width: 28, height: 28, borderRadius: 6 }}>
              <FileText size={14} />
            </div>
            <span>ChatMyDoc</span>
          </div>
          <p className="footer-copy">© 2025 ChatMyDoc. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .landing { min-height: 100vh; }
        .hero {
          padding: 5rem 0 4rem; background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,.15), transparent);
        }
        .hero .container {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        .hero-content { display: flex; flex-direction: column; gap: 1.5rem; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .35rem .9rem; border-radius: 99px;
          background: rgba(139,92,246,.15); border: 1px solid rgba(139,92,246,.3);
          color: var(--accent-purple); font-size: .8rem; font-weight: 600; width: fit-content;
        }
        .hero-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; line-height: 1.2; color: var(--text-primary); }
        .hero-subtitle { font-size: 1rem; color: var(--text-secondary); line-height: 1.7; max-width: 480px; }
        .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; }
        .hero-highlights { display: flex; flex-wrap: wrap; gap: .75rem; }
        .highlight-item { display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: var(--text-muted); }
        
        .hero-visual { display: flex; justify-content: center; }
        .hero-card {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl);
          overflow: hidden; width: 100%; max-width: 400px; box-shadow: var(--shadow-glow);
        }
        .hero-card-header {
          padding: .85rem 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: .75rem;
        }
        .hero-card-dots { display: flex; gap: 6px; }
        .hero-card-dots span { width: 12px; height: 12px; border-radius: 50%; background: var(--border-light); }
        .hero-card-title { font-size: .8rem; color: var(--text-muted); font-weight: 500; }
        .hero-card-body { padding: 1.25rem; display: flex; flex-direction: column; gap: .75rem; }
        .hero-msg { display: flex; }
        .hero-msg span {
          padding: .65rem .9rem; border-radius: 12px; font-size: .82rem; line-height: 1.5;
          max-width: 85%;
        }
        .hero-msg.ai span { background: var(--bg-secondary); color: var(--text-secondary); border-radius: 4px 12px 12px 12px; }
        .hero-msg.user { justify-content: flex-end; }
        .hero-msg.user span { background: var(--accent-gradient); color: #fff; border-radius: 12px 4px 12px 12px; }
        .hero-typing { display: flex; gap: 4px; align-items: center; padding: .4rem .5rem; }
        .hero-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: bounce 1.2s infinite; }
        .hero-typing span:nth-child(2) { animation-delay: .2s; }
        .hero-typing span:nth-child(3) { animation-delay: .4s; }

        .features { padding: 5rem 0; }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-header h2 { font-size: 2rem; font-weight: 700; margin-bottom: .5rem; }
        .section-header p { color: var(--text-secondary); font-size: 1rem; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .feature-card { display: flex; flex-direction: column; gap: .75rem; }
        .feature-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; }
        .feature-title { font-size: 1rem; font-weight: 600; }
        .feature-desc { font-size: .875rem; color: var(--text-secondary); line-height: 1.6; }

        .cta-section { padding: 4rem 0 5rem; }
        .cta-card {
          background: linear-gradient(135deg, rgba(139,92,246,.15), rgba(59,130,246,.15));
          border: 1px solid rgba(139,92,246,.3); border-radius: var(--radius-xl);
          padding: 3.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
        }
        .cta-card h2 { font-size: 1.8rem; font-weight: 700; }
        .cta-card p { color: var(--text-secondary); max-width: 440px; }

        .footer { padding: 2rem 0; border-top: 1px solid var(--border); }
        .footer .container { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .footer-logo { display: flex; align-items: center; gap: .5rem; font-weight: 700; font-size: .95rem; }
        .footer-copy { font-size: .8rem; color: var(--text-muted); }

        @media (max-width: 768px) {
          .hero .container { grid-template-columns: 1fr; text-align: center; gap: 2.5rem; }
          .hero-subtitle { max-width: 100%; }
          .hero-cta { justify-content: center; }
          .hero-highlights { justify-content: center; }
          .hero-visual { display: none; }
          .cta-card { padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
}
