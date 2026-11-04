"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, FolderOpen, Layers3, Plus, Sparkles, Info, Presentation } from "lucide-react";

type Format = "landscape" | "portrait" | "tiktok" | "square" | "a4" | "custom";
type SavedProject = { id: string; updatedAt?: string; title?: string; description?: string; slides?: unknown[]; canvasWidth?: number; canvasHeight?: number };

const formatSizes: Record<Exclude<Format, "custom">, { width: number; height: number; label: string }> = {
  landscape: { width: 1280, height: 720, label: "Landscape · 16:9" },
  portrait: { width: 720, height: 1280, label: "Portrait · 9:16" },
  tiktok: { width: 1080, height: 1920, label: "TikTok / Reels · 9:16" },
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  a4: { width: 794, height: 1123, label: "A4 · Portrait" },
};

export default function Home() {
  const router = useRouter();
  const [format, setFormat] = useState<Format>("landscape");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [background, setBackground] = useState("#ffffff");
  const [presentationTitle, setPresentationTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);

  useEffect(() => {
    try {
      const registryKey = "slideai-studio-projects-v1";
      const rawRegistry = localStorage.getItem(registryKey);
      let projects = rawRegistry ? JSON.parse(rawRegistry) as SavedProject[] : [];
      if (!Array.isArray(projects)) projects = [];
      const legacyRaw = localStorage.getItem("slideai-studio-local-project-v1");
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as Omit<SavedProject, "id">;
        const legacyAlreadyListed = projects.some((project) => {
          const { id: _id, updatedAt: _updatedAt, ...savedData } = project;
          return JSON.stringify(savedData) === JSON.stringify(legacy);
        });
        if (!legacyAlreadyListed && !projects.some((project) => project.id === "legacy-imported")) {
          projects = [...projects, { ...legacy, id: "legacy-imported", updatedAt: new Date().toISOString() }];
          localStorage.setItem(registryKey, JSON.stringify(projects));
        }
      }
      setSavedProjects(projects.sort((a,b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || "")));
    } catch { /* Ignore invalid local data and keep the dashboard usable. */ }
    const refresh = () => {
      try { const value = JSON.parse(localStorage.getItem("slideai-studio-projects-v1") || "[]") as SavedProject[]; if (Array.isArray(value)) setSavedProjects(value.sort((a,b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""))); } catch { /* Keep the last valid list. */ }
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("slideai-projects-updated", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("slideai-projects-updated", refresh); };
  }, []);

  function chooseFormat(next: Format) {
    setFormat(next);
    if (next !== "custom") {
      setWidth(formatSizes[next].width);
      setHeight(formatSizes[next].height);
    }
  }

  function createPresentation() {
    const params = new URLSearchParams({
      blank: "1",
      projectId: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `project-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      width: String(width),
      height: String(height),
      background,
      title: presentationTitle.trim() || "Untitled presentation",
      description: description.trim(),
    });
    router.push("/studio?" + params.toString());
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="SlideAI Studio home">
          <span className="brand-mark"><Layers3 size={19} strokeWidth={2.3} /></span>
          <span>slideai<span className="brand-light">studio</span></span>
        </Link>
        <a className="new-button" href="#create"><Plus size={17} /> New presentation <span className="shortcut">⌘ K</span></a>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-item active" href="#recent"><Layers3 size={17} /> My presentations</a>
          <a className="nav-item" href="#create"><FolderOpen size={17} /> Create new</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={16} /></div>
            <strong>Your ideas, elevated.</strong>
            <p>Make room for better storytelling.</p>
            <a href="#create">Explore Studio <ArrowUpRight size={13} /></a>
          </div>
          <div className="profile"><div className="avatar">B</div><div className="profile-copy"><strong>My workspace</strong><span>Free plan</span></div><span className="more">···</span></div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="top-actions"><span className="status-dot" /> Local workspace <button className="help-button" title="Your projects are saved in this browser">?</button></div>
        </header>

        <div className="content-wrap">
          <section className="welcome">
            <div className="eyebrow"><span /> YOUR CREATIVE WORKSPACE</div>
            <h1>Good ideas deserve<br /><em>great presentations.</em></h1>
            <p>Create a presentation in the format you need, then design every detail in the editor.</p>
          </section>

          <section className="create-panel" id="create">
            <div className="create-heading"><div className="ai-orb"><Presentation size={19} /></div><div><strong>Create a blank presentation</strong><span>Choose your canvas format, background and project details. These details will not appear on your slides.</span></div></div>
            <div className="presentation-setup">
              <label className="setup-field setup-format-field">Canvas format
                <select value={format} onChange={(event) => chooseFormat(event.target.value as Format)}>
                  <option value="landscape">Landscape · 16:9 (1280 × 720)</option>
                  <option value="portrait">Portrait · 9:16 (720 × 1280)</option>
                  <option value="tiktok">TikTok / Reels · 9:16 (1080 × 1920)</option>
                  <option value="square">Square · 1:1 (1080 × 1080)</option>
                  <option value="a4">A4 · Portrait (794 × 1123)</option>
                  <option value="custom">Custom size</option>
                </select>
              </label>
              {format === "custom" && <div className="custom-size-fields">
                <label className="setup-field">Width (px)<input type="number" min="320" max="4096" value={width} onChange={(event) => setWidth(Math.max(320, Math.min(4096, Number(event.target.value) || 320)))} /></label>
                <label className="setup-field">Height (px)<input type="number" min="320" max="4096" value={height} onChange={(event) => setHeight(Math.max(320, Math.min(4096, Number(event.target.value) || 320)))} /></label>
              </div>}
              <label className="setup-field">Background color
                <span className="setup-color-control"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /><span>{background.toUpperCase()}</span></span>
              </label>
              <label className="setup-field">Presentation title
                <input type="text" maxLength={120} value={presentationTitle} onChange={(event) => setPresentationTitle(event.target.value)} placeholder="e.g. Product launch presentation" />
              </label>
              <label className="setup-field setup-description-field">Description <span className="optional-label">Optional · only shown in your workspace</span>
                <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a private note about this presentation..." rows={3} />
              </label>
            </div>
            <div className="create-footer"><span><Layers3 size={14} /> {width} × {height} px · Blank canvas</span><button className="create-button" onClick={createPresentation}>Create blank presentation <ArrowUpRight size={16} /></button></div>
          </section>

          <section className="quick-start">
            <div className="section-title">Designed for every format <span>START WITH A CANVAS THAT FITS</span></div>
            <div className="format-chips">
              <button onClick={() => { chooseFormat("landscape"); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }}>16:9 Presentation</button>
              <button onClick={() => { chooseFormat("portrait"); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }}>9:16 Portrait</button>
              <button onClick={() => { chooseFormat("tiktok"); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }}>TikTok / Reels</button>
              <button onClick={() => { chooseFormat("square"); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }}>Square post</button>
            </div>
          </section>

          <section className="recent" id="recent">
            <div className="recent-heading"><div><h2>My presentations</h2><p>{savedProjects.length} presentation{savedProjects.length === 1 ? "" : "s"} saved in this browser.</p></div><Link className="view-all" href="#create">Create new <Plus size={14} /></Link></div>
            {savedProjects.length ? <div className="project-grid saved-project-grid">
              {savedProjects.map((project) => {
                const projectTitle = project.title || "Untitled presentation";
                const projectDescription = project.description || "";
                const editorUrl = `/studio?projectId=${encodeURIComponent(project.id)}`;
                const expanded = expandedDescription === project.id;
                return <article className="project-card saved-project-card" key={project.id}>
                  <Link href={editorUrl} className="project-preview violet saved-project-preview"><div className="preview-lines"><i /><i /><i /></div><span><Layers3 size={42} /></span><div className="preview-caption">{project.canvasWidth || 1280} × {project.canvasHeight || 720} PX</div></Link>
                  <div className="project-info"><div><strong>{projectTitle}</strong><span>{project.slides?.length || 1} slides · Saved locally</span></div>
                    {projectDescription && <button className="description-info-button" aria-label={`Read ${projectTitle} description`} aria-expanded={expanded} onClick={() => setExpandedDescription(expanded ? null : project.id)}><Info size={15} /></button>}
                  </div>
                  {projectDescription && <div className={"saved-description-popover" + (expanded ? " is-open" : "")} aria-hidden={!expanded}><p>{projectDescription}</p></div>}
                  <div className="saved-project-actions"><Link href={editorUrl}>Continue editing <ArrowUpRight size={13} /></Link></div>
                </article>;
              })}
            </div> : <div className="empty-project-state"><Layers3 size={23} /><strong>No presentations yet</strong><span>Create your first blank presentation above. It will appear here when saved.</span></div>}
          </section>
          <footer className="page-footer">Made for ideas that move people. <span>SLIDEAI STUDIO · 2026</span></footer>
        </div>
      </section>
    </main>
  );
}
