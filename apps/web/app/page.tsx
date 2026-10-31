import Link from "next/link";
import {
  ArrowUpRight,
  FolderOpen,
  Layers3,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const recentProjects = [
  {
    title: "The Future of Artificial Intelligence",
    detail: "12 slides · Edited just now",
    tone: "violet",
    initials: "AI",
  },
  {
    title: "Q4 Product Strategy",
    detail: "18 slides · Edited yesterday",
    tone: "blue",
    initials: "Q4",
  },
  {
    title: "Brand Identity Guidelines",
    detail: "9 slides · Edited 3 days ago",
    tone: "orange",
    initials: "BI",
  },
];

const prompts = [
  "The future of sustainable cities",
  "A pitch deck for a productivity startup",
  "How modern teams use artificial intelligence",
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="SlideAI Studio home">
          <span className="brand-mark"><Layers3 size={19} strokeWidth={2.3} /></span>
          <span>slideai<span className="brand-light">studio</span></span>
        </Link>

        <Link className="new-button" href="/studio">
          <Plus size={17} /> New presentation
          <span className="shortcut">⌘ K</span>
        </Link>

        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-item active" href="#"><Layers3 size={17} /> My presentations</a>
          <a className="nav-item" href="#"><FolderOpen size={17} /> Templates</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={16} /></div>
            <strong>Your ideas, elevated.</strong>
            <p>Make room for better storytelling.</p>
            <a href="#">Explore Studio <ArrowUpRight size={13} /></a>
          </div>
          <div className="profile">
            <div className="avatar">B</div>
            <div className="profile-copy"><strong>My workspace</strong><span>Free plan</span></div>
            <span className="more">···</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="top-actions"><span className="status-dot" /> All changes saved <button className="help-button">?</button></div>
        </header>

        <div className="content-wrap">
          <section className="welcome">
            <div className="eyebrow"><span /> YOUR CREATIVE WORKSPACE</div>
            <h1>Good ideas deserve<br /><em>great presentations.</em></h1>
            <p>From a first thought to a polished story. Create something worth sharing.</p>
          </section>

          <section className="create-panel">
            <div className="create-heading"><div className="ai-orb"><WandSparkles size={19} /></div><div><strong>What are we creating today?</strong><span>Describe your idea. Let AI shape the story.</span></div></div>
            <textarea aria-label="Presentation idea" placeholder="e.g. Create a 10-slide presentation about the future of renewable energy..." />
            <div className="create-footer"><span><Sparkles size={14} /> AI-powered creation</span><Link className="create-button" href="/studio">Create presentation <ArrowUpRight size={16} /></Link></div>
          </section>

          <section className="quick-start">
            <div className="section-title">A little inspiration <span>START WITH AN IDEA</span></div>
            <div className="prompt-list">
              {prompts.map((prompt) => <button className="prompt-chip" key={prompt}>{prompt}<ArrowUpRight size={13} /></button>)}
            </div>
          </section>

          <section className="recent">
            <div className="recent-heading"><div><h2>Recent presentations</h2><p>Pick up where you left off.</p></div><button className="view-all">View all <ArrowUpRight size={14} /></button></div>
            <div className="project-grid">
              {recentProjects.map((project) => (
                <article className="project-card" key={project.title}>
                  <div className={`project-preview ${project.tone}`}><div className="preview-lines"><i /><i /><i /></div><span>{project.initials}</span><div className="preview-caption">A STORY IN EVERY SLIDE</div></div>
                  <div className="project-info"><div><strong>{project.title}</strong><span>{project.detail}</span></div><button aria-label={`Open ${project.title}`}>···</button></div>
                </article>
              ))}
            </div>
          </section>
          <footer className="page-footer">Made for ideas that move people. <span>SLIDEAI STUDIO · 2026</span></footer>
        </div>
      </section>
    </main>
  );
}
