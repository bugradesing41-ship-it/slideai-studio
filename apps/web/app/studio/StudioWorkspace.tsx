"use client";

import { useMemo, useState } from "react";
import { sampleDeck, validateDeck, type DeckTheme, type SlideSpec } from "@slideai/shared";
import {
  ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronDown as MoveDown, ChevronUp as MoveUp, Copy, Download, ImagePlus,
  LayoutTemplate, MessageSquare, MoreHorizontal, Plus, Send, Settings2,
  Sparkles, Trash2, Type, WandSparkles, ZoomIn, ZoomOut
} from "lucide-react";

type Slide = SlideSpec;

export default function StudioWorkspace() {
  const [slides, setSlides] = useState<Slide[]>(sampleDeck.slides);
  const [activeId, setActiveId] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Your starting deck is ready. Tell me what you would like to change, or select any text on the slide to edit it." }
  ]);
  const [title, setTitle] = useState(sampleDeck.title);
  const [zoom, setZoom] = useState(82);
  const [theme, setTheme] = useState<DeckTheme>("violet");
  const activeSlide = useMemo(() => slides.find((slide) => slide.id === activeId) ?? slides[0], [slides, activeId]);

  function updateActive(patch: Partial<Slide>) {
    setSlides((current) => {
      const nextSlides = current.map((slide) => slide.id === activeId ? { ...slide, ...patch } : slide);
      const validation = validateDeck({ ...sampleDeck, title, theme, slides: nextSlides });
      return validation.success ? validation.data.slides : current;
    });
  }

  function addSlide() {
    const id = Math.max(...slides.map((slide) => slide.id)) + 1;
    const next: Slide = { id, title: "A new perspective", eyebrow: "04 — EXPLORE", body: "Add your key message here. Keep the idea focused, clear and memorable.", kind: "content", layout: "title-and-body" };
    setSlides((current) => {
      const nextSlides = [...current, next];
      const validation = validateDeck({ ...sampleDeck, title, theme, slides: nextSlides });
      return validation.success ? validation.data.slides : current;
    });
    setActiveId(id);
  }

  function duplicateSlide() {
    const source = activeSlide;
    if (!source) return;
    const id = Math.max(...slides.map((slide) => slide.id)) + 1;
    const duplicate: Slide = { ...source, id, title: `${source.title} (copy)` };
    const sourceIndex = slides.findIndex((slide) => slide.id === activeId);
    const nextSlides = [...slides];
    nextSlides.splice(sourceIndex + 1, 0, duplicate);
    const validation = validateDeck({ ...sampleDeck, title, theme, slides: nextSlides });
    if (validation.success) {
      setSlides(validation.data.slides);
      setActiveId(id);
    }
  }

  function deleteSlide() {
    if (slides.length <= 1) return;
    const index = slides.findIndex((slide) => slide.id === activeId);
    const nextSlides = slides.filter((slide) => slide.id !== activeId);
    const validation = validateDeck({ ...sampleDeck, title, theme, slides: nextSlides });
    if (validation.success) {
      setSlides(validation.data.slides);
      setActiveId(nextSlides[Math.max(0, index - 1)].id);
    }
  }

  function moveSlide(direction: -1 | 1) {
    const index = slides.findIndex((slide) => slide.id === activeId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= slides.length) return;
    const nextSlides = [...slides];
    [nextSlides[index], nextSlides[target]] = [nextSlides[target], nextSlides[index]];
    const validation = validateDeck({ ...sampleDeck, title, theme, slides: nextSlides });
    if (validation.success) setSlides(validation.data.slides);
  }

  function sendPrompt() {
    const clean = prompt.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }, { role: "assistant", text: "I’ve added that to our editing queue. The AI connection is not configured yet, so this preview is using local sample content." }]);
    setPrompt("");
  }

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <a className="studio-back" href="/"><ArrowLeft size={16} /><span>Back to workspace</span></a>
        <div className="studio-doc-title"><span className="doc-icon"><LayoutTemplate size={15} /></span><span>{title}</span><span className="saved-pill"><Check size={12} /> Saved</span></div>
        <div className="studio-top-actions"><button className="icon-button" aria-label="More options"><MoreHorizontal size={18}/></button><button className="share-button">Share <ArrowUpRight size={14}/></button><button className="export-button"><Download size={14}/> Export</button></div>
      </header>

      <div className="studio-body">
        <aside className="chat-panel">
          <div className="panel-heading"><div className="panel-heading-icon"><Sparkles size={16}/></div><div><strong>AI assistant</strong><span>Your creative partner</span></div><button className="icon-button"><MoreHorizontal size={17}/></button></div>
          <div className="chat-context"><span className="context-dot"/> WORKING ON THIS PRESENTATION</div>
          <div className="chat-messages">
            {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.role === "assistant" && <span className="message-avatar"><WandSparkles size={13}/></span>}<p>{message.text}</p></div>)}
          </div>
          <div className="suggestion-area"><span>TRY ASKING</span><button onClick={() => setPrompt("Make this slide more visual")}>Make this slide more visual <ArrowUpRight size={12}/></button><button onClick={() => setPrompt("Create a stronger opening")}>Create a stronger opening <ArrowUpRight size={12}/></button></div>
          <div className="chat-composer"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendPrompt(); } }} placeholder="Ask AI to edit your presentation..." aria-label="Message AI assistant"/><div><span><Sparkles size={12}/> AI can make mistakes</span><button onClick={sendPrompt} disabled={!prompt.trim()} aria-label="Send message"><Send size={15}/></button></div></div>
        </aside>

        <section className="editor-main">
          <div className="editor-toolbar"><div className="toolbar-left"><span className="toolbar-label">SLIDE {String(slides.findIndex((slide) => slide.id === activeId) + 1).padStart(2,"0")} <i>/ {String(slides.length).padStart(2,"0")}</i></span><span className="toolbar-divider"/><button className="tool-button"><Type size={14}/> Text</button><button className="tool-button"><ImagePlus size={14}/> Image</button><button className="tool-button"><LayoutTemplate size={14}/> Layout</button></div><div className="toolbar-right"><button className="icon-button" onClick={() => setZoom((value) => Math.max(50,value-5))} aria-label="Zoom out"><ZoomOut size={15}/></button><span className="zoom-value">{zoom}%</span><button className="icon-button" onClick={() => setZoom((value) => Math.min(110,value+5))} aria-label="Zoom in"><ZoomIn size={15}/></button></div></div>

          <div className={`canvas-stage theme-${theme}`}><div className="slide-canvas" style={{ transform: `scale(${zoom/100})` }}>
            <div className="slide-decoration"/><div className="slide-topline"><span>SLIDEAI / FIELD NOTES</span><span>2026&nbsp;&nbsp;—&nbsp;&nbsp;01</span></div>
            <div className="slide-content">
              <span className="slide-eyebrow" contentEditable suppressContentEditableWarning onBlur={(event) => updateActive({eyebrow:event.currentTarget.textContent ?? ""})}>{activeSlide.eyebrow}</span>
              <h1 className={activeSlide.kind === "cover" ? "cover-title" : ""} contentEditable suppressContentEditableWarning onBlur={(event) => { const value = event.currentTarget.textContent ?? ""; updateActive({title:value}); setTitle(value.replace(/\n/g," ")); }}>{activeSlide.title}</h1>
              <p contentEditable suppressContentEditableWarning onBlur={(event) => updateActive({body:event.currentTarget.textContent ?? ""})}>{activeSlide.body}</p>
              {activeSlide.kind === "stats" && <div className="slide-stats"><div><strong>72<span>%</span></strong><small>Faster first drafts</small></div><div><strong>3.4<span>×</span></strong><small>More ideas explored</small></div><div><strong>24<span>/7</span></strong><small>Creative momentum</small></div></div>}
              {activeSlide.kind === "quote" && <blockquote>“Technology is most powerful when it gives people more room to be human.”</blockquote>}
            </div>
            <div className="slide-footer"><span>THINK CLEARLY. CREATE BOLDLY.</span><span>0{activeId}</span></div>
          </div></div>

          <div className="filmstrip"><div className="filmstrip-label">SLIDES <span>{slides.length}</span></div><div className="thumbnail-list">{slides.map((slide,index) => <button className={`thumbnail ${activeId===slide.id?"selected":""}`} key={slide.id} onClick={() => setActiveId(slide.id)}><div className={`thumbnail-art thumb-${slide.kind}`}><small>{slide.eyebrow}</small><strong>{slide.title}</strong><i/><i/></div><span>{String(index+1).padStart(2,"0")}</span></button>)}<button className="add-slide" onClick={addSlide}><Plus size={18}/><span>Add slide</span></button></div></div>
        </section>

        <aside className="inspector-panel"><div className="inspector-heading"><strong>Design</strong><button className="icon-button"><Settings2 size={16}/></button></div><div className="inspector-section"><div className="inspector-label">THEME <ChevronDown size={13}/></div><div className="theme-options"><button className={`theme-swatch violet-swatch ${theme==="violet"?"chosen":""}`} onClick={() => setTheme("violet")} aria-label="Violet theme"/><button className={`theme-swatch blue-swatch ${theme==="blue"?"chosen":""}`} onClick={() => setTheme("blue")} aria-label="Blue theme"/><button className={`theme-swatch light-swatch ${theme==="light"?"chosen":""}`} onClick={() => setTheme("light")} aria-label="Light theme"/></div><p className="inspector-hint">Choose a visual direction for your deck.</p></div><div className="inspector-section"><div className="inspector-label">SLIDE CONTENT <ChevronDown size={13}/></div><label className="field-label">Slide title</label><input className="inspector-input" value={activeSlide.title} onChange={(event) => updateActive({title:event.target.value})}/><label className="field-label">Description</label><textarea className="inspector-textarea" value={activeSlide.body} onChange={(event) => updateActive({body:event.target.value})}/></div><div className="inspector-section"><div className="inspector-label">SLIDE ACTIONS</div><button className="quick-action" onClick={duplicateSlide}><Copy size={14}/> Duplicate slide</button><button className="quick-action" onClick={() => moveSlide(-1)} disabled={slides.findIndex((slide) => slide.id === activeId) === 0}><MoveUp size={14}/> Move slide up</button><button className="quick-action" onClick={() => moveSlide(1)} disabled={slides.findIndex((slide) => slide.id === activeId) === slides.length - 1}><MoveDown size={14}/> Move slide down</button><button className="quick-action danger-action" onClick={deleteSlide} disabled={slides.length <= 1}><Trash2 size={14}/> Delete slide</button><div className="inspector-label action-subheading">QUICK ACTIONS</div><button className="quick-action" onClick={() => updateActive({kind:"quote",layout:"featured-quote"})}><MessageSquare size={14}/> Turn into a quote</button><button className="quick-action" onClick={() => updateActive({kind:"content",layout:"title-and-body"})}><Type size={14}/> Standard content layout</button></div><div className="inspector-tip"><Sparkles size={15}/><div><strong>Design tip</strong><p>Keep one clear message per slide. Let the layout support your story.</p></div></div></aside>
      </div>
    </main>
  );
}
