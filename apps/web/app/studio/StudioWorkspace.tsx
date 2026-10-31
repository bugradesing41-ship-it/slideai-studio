"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import DesignCanvas, { type Tool } from "./DesignCanvas";
import { sampleDeck, validateDeck, type DeckTheme, type SlideSpec } from "@slideai/shared";
import {
  ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronDown as MoveDown, ChevronUp as MoveUp, Copy, Download, ImagePlus,
  LayoutTemplate, MessageSquare, MoreHorizontal, Plus, Send, Settings2,
  Sparkles, Trash2, Type, WandSparkles, ZoomIn, ZoomOut, MousePointer2,
  Pencil, Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus,
  MoveUpRight, Star, Undo2, Redo2, Layers3, Paintbrush, Diamond, Hexagon, Pentagon, Heart, MessageSquareText
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
  const [tool, setTool] = useState<Tool>("select");
  const [fill, setFill] = useState("#a78bfa");
  const [stroke, setStroke] = useState("#d8ccff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontFamily, setFontFamily] = useState("Manrope");
  const [fontSize, setFontSize] = useState(32);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [canvasDataBySlide, setCanvasDataBySlide] = useState<Record<number, string>>({});
  const [transitionPreset, setTransitionPreset] = useState("fade");
  const [history, setHistory] = useState<Record<number, string[]>>({});
  const [historyIndex, setHistoryIndex] = useState<Record<number, number>>({});
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

  function saveCanvas(json: string) {
    setCanvasDataBySlide((current) => ({ ...current, [activeId]: json }));
    setHistory((current) => {
      const entries = current[activeId] ?? [];
      if (entries[entries.length - 1] === json) return current;
      return { ...current, [activeId]: [...entries.slice(-29), json] };
    });
    setHistoryIndex((current) => ({ ...current, [activeId]: (current[activeId] ?? 0) + 1 }));
  }

  function applyStylePreset(preset: "violet" | "glass" | "neon" | "outline" | "sunset") {
    const presets = {
      violet: { fill: "#8b5cf6", stroke: "#c4b5fd", shadow: true },
      glass: { fill: "rgba(255,255,255,0.16)", stroke: "rgba(255,255,255,0.72)", shadow: false },
      neon: { fill: "#211338", stroke: "#e879f9", shadow: true },
      outline: { fill: "rgba(0,0,0,0)", stroke: "#a78bfa", shadow: false },
      sunset: { fill: "#f97316", stroke: "#fed7aa", shadow: true },
    };
    const selected = presets[preset];
    setFill(selected.fill);
    setStroke(selected.stroke);
    setShadowEnabled(selected.shadow);
  }

  function applyStylePreset(preset: string) {
    const presets: Record<string, { fill: string; stroke: string; shadow: boolean }> = {
      violet: { fill: "#8b5cf6", stroke: "#c4b5fd", shadow: true },
      glass: { fill: "rgba(255,255,255,0.16)", stroke: "rgba(255,255,255,0.72)", shadow: false },
      neon: { fill: "#211338", stroke: "#e879f9", shadow: true },
      outline: { fill: "rgba(0,0,0,0)", stroke: "#a78bfa", shadow: false },
      sunset: { fill: "#f97316", stroke: "#fed7aa", shadow: true }
    };
    const selected = presets[preset];
    if (!selected) return;
    setFill(selected.fill);
    setStroke(selected.stroke);
    setShadowEnabled(selected.shadow);
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
          <div className="editor-toolbar editor-toolbar-advanced">
            <div className="toolbar-left toolbar-tools">
              <span className="toolbar-label">SLIDE {String(slides.findIndex((slide) => slide.id === activeId) + 1).padStart(2,"0")} <i>/ {String(slides.length).padStart(2,"0")}</i></span>
              <span className="toolbar-divider"/>
              <button className={`tool-button ${tool==="select"?"active-tool":""}`} onClick={() => setTool("select")} title="Select"><MousePointer2 size={15}/></button>
              <button className={`tool-button ${tool==="draw"?"active-tool":""}`} onClick={() => setTool("draw")} title="Free draw"><Pencil size={15}/></button>
              <button className={`tool-button ${tool==="rect"?"active-tool":""}`} onClick={() => setTool("rect")} title="Rectangle"><Square size={15}/></button>
              <button className={`tool-button ${tool==="circle"?"active-tool":""}`} onClick={() => setTool("circle")} title="Circle"><CircleIcon size={15}/></button>
              <button className={`tool-button ${tool==="triangle"?"active-tool":""}`} onClick={() => setTool("triangle")} title="Triangle"><TriangleIcon size={15}/></button>
              <button className={`tool-button ${tool==="line"?"active-tool":""}`} onClick={() => setTool("line")} title="Line"><Minus size={15}/></button>
              <button className={`tool-button ${tool==="arrow"?"active-tool":""}`} onClick={() => setTool("arrow")} title="Arrow"><MoveUpRight size={15}/></button>
              <button className={`tool-button ${tool==="star"?"active-tool":""}`} onClick={() => setTool("star")} title="Star"><Star size={15}/></button>
              <button className={`tool-button ${tool==="diamond"?"active-tool":""}`} onClick={() => setTool("diamond")} title="Diamond"><Diamond size={15}/></button>
              <button className={`tool-button ${tool==="hexagon"?"active-tool":""}`} onClick={() => setTool("hexagon")} title="Hexagon"><Hexagon size={15}/></button>
              <button className={`tool-button ${tool==="pentagon"?"active-tool":""}`} onClick={() => setTool("pentagon")} title="Pentagon"><Pentagon size={15}/></button>
              <button className={`tool-button ${tool==="heart"?"active-tool":""}`} onClick={() => setTool("heart")} title="Heart"><Heart size={15}/></button>
              <button className={`tool-button ${tool==="speech"?"active-tool":""}`} onClick={() => setTool("speech")} title="Speech bubble"><MessageSquareText size={15}/></button>
              <button className={`tool-button ${tool==="text"?"active-tool":""}`} onClick={() => setTool("text")} title="Add text"><Type size={15}/></button>
            </div>
            <div className="toolbar-right">
              <button className="icon-button" onClick={() => setZoom((value) => Math.max(50,value-5))} aria-label="Zoom out"><ZoomOut size={15}/></button>
              <span className="zoom-value">{zoom}%</span>
              <button className="icon-button" onClick={() => setZoom((value) => Math.min(110,value+5))} aria-label="Zoom in"><ZoomIn size={15}/></button>
            </div>
          </div>

          <div className="canvas-stage advanced-canvas-stage">
            <div className="canvas-zoom-frame" style={{ transform: `scale(${zoom / 100})` }}>
              <motion.div key={activeId + transitionPreset} className="canvas-motion-frame" initial={transitionPreset==="rise"?{opacity:0,y:24}:transitionPreset==="zoom"?{opacity:0,scale:.94}:transitionPreset==="slide"?{opacity:0,x:28}:{opacity:0}} animate={{opacity:1,x:0,y:0,scale:1}} transition={{duration:.32,ease:"easeOut"}}>
              <DesignCanvas
                slideId={activeId}
                title={activeSlide.title}
                eyebrow={activeSlide.eyebrow}
                body={activeSlide.body}
                theme={theme}
                tool={tool}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fontFamily={fontFamily}
                fontSize={fontSize}
                shadowEnabled={shadowEnabled}
                opacity={opacity}
                initialData={canvasDataBySlide[activeId]}
                onChange={saveCanvas}
                onSelectionChange={() => {}}
                onTextChange={(name, value) => {
                  if (name === "slide-title") { updateActive({ title: value }); setTitle(value); }
                  if (name === "slide-eyebrow") updateActive({ eyebrow: value });
                  if (name === "slide-body") updateActive({ body: value });
                }}
              />
              </motion.div>
            </div>
          </div>

          <div className="filmstrip"><div className="filmstrip-label">SLIDES <span>{slides.length}</span></div><div className="thumbnail-list">{slides.map((slide,index) => <button className={`thumbnail ${activeId===slide.id?"selected":""}`} key={slide.id} onClick={() => setActiveId(slide.id)}><div className={`thumbnail-art thumb-${slide.kind}`}><small>{slide.eyebrow}</small><strong>{slide.title}</strong><i/><i/></div><span>{String(index+1).padStart(2,"0")}</span></button>)}<button className="add-slide" onClick={addSlide}><Plus size={18}/><span>Add slide</span></button></div></div>
        </section>

        <aside className="inspector-panel advanced-inspector">
          <div className="inspector-heading"><strong>Design studio</strong><button className="icon-button"><Settings2 size={16}/></button></div>
          <div className="inspector-section">
            <div className="inspector-label">THEME <ChevronDown size={13}/></div>
            <div className="theme-options">
              <button className={`theme-swatch violet-swatch ${theme==="violet"?"chosen":""}`} onClick={() => setTheme("violet")} aria-label="Violet theme"/>
              <button className={`theme-swatch blue-swatch ${theme==="blue"?"chosen":""}`} onClick={() => setTheme("blue")} aria-label="Blue theme"/>
              <button className={`theme-swatch light-swatch ${theme==="light"?"chosen":""}`} onClick={() => setTheme("light")} aria-label="Light theme"/>
            </div>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">COLORS & STROKE</div>
            <div className="color-control-row"><label>Fill <input type="color" value={fill} onChange={(event) => setFill(event.target.value)}/></label><label>Border <input type="color" value={stroke} onChange={(event) => setStroke(event.target.value)}/></label></div>
            <label className="range-label">Stroke width <span>{strokeWidth}px</span></label><input className="range-control" type="range" min="1" max="18" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))}/>
            <label className="range-label">Opacity <span>{Math.round(opacity * 100)}%</span></label><input className="range-control" type="range" min="10" max="100" value={Math.round(opacity * 100)} onChange={(event) => setOpacity(Number(event.target.value) / 100)}/>
<div className="inspector-label preset-label">QUICK STYLE PRESETS</div>
            <div className="style-preset-grid">
              <button onClick={() => applyStylePreset("violet")}><i className="preset-violet"/>Violet</button>
              <button onClick={() => applyStylePreset("glass")}><i className="preset-glass"/>Glass</button>
              <button onClick={() => applyStylePreset("neon")}><i className="preset-neon"/>Neon</button>
              <button onClick={() => applyStylePreset("outline")}><i className="preset-outline"/>Outline</button>
              <button onClick={() => applyStylePreset("sunset")}><i className="preset-sunset"/>Sunset</button>
            </div>
            <div className="inspector-label preset-label">QUICK STYLE PRESETS</div>
            <div className="style-preset-grid">
              <button onClick={() => applyStylePreset("violet")}><i className="preset-violet"/>Violet</button>
              <button onClick={() => applyStylePreset("glass")}><i className="preset-glass"/>Glass</button>
              <button onClick={() => applyStylePreset("neon")}><i className="preset-neon"/>Neon</button>
              <button onClick={() => applyStylePreset("outline")}><i className="preset-outline"/>Outline</button>
              <button onClick={() => applyStylePreset("sunset")}><i className="preset-sunset"/>Sunset</button>
            </div>
            <button className={`quick-action ${shadowEnabled?"selected-effect":""}`} onClick={() => setShadowEnabled((value) => !value)}><Layers3 size={14}/> {shadowEnabled?"Shadow enabled":"Add soft shadow"}</button>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">TYPOGRAPHY</div>
            <label className="field-label">Font family</label>
            <select className="inspector-input" value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
              <option>Inter</option><option>DM Sans</option><option>Manrope</option><option>Space Grotesk</option><option>Playfair Display</option><option>Montserrat</option><option>Lora</option>
            </select>
            <label className="range-label">Font size <span>{fontSize}px</span></label><input className="range-control" type="range" min="12" max="100" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}/>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">SLIDE TRANSITION</div>
            <select className="inspector-input" value={transitionPreset} onChange={(event) => setTransitionPreset(event.target.value)}>
              <option value="fade">Fade</option><option value="rise">Rise</option><option value="zoom">Zoom</option><option value="slide">Slide in</option>
            </select>
            <p className="inspector-hint">Preview transitions when switching between slides. Motion-powered.</p>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">SLIDE CONTENT</div>
            <label className="field-label">Slide title</label><input className="inspector-input" value={activeSlide.title} onChange={(event) => { updateActive({title:event.target.value}); }}/>
            <label className="field-label">Description</label><textarea className="inspector-textarea" value={activeSlide.body} onChange={(event) => updateActive({body:event.target.value})}/>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">OBJECT ACTIONS</div>
            <button className="quick-action" onClick={duplicateSlide}><Copy size={14}/> Duplicate slide</button>
            <button className="quick-action" onClick={() => moveSlide(-1)} disabled={slides.findIndex((slide) => slide.id === activeId) === 0}><MoveUp size={14}/> Move slide up</button>
            <button className="quick-action" onClick={() => moveSlide(1)} disabled={slides.findIndex((slide) => slide.id === activeId) === slides.length - 1}><MoveDown size={14}/> Move slide down</button>
            <button className="quick-action danger-action" onClick={deleteSlide} disabled={slides.length <= 1}><Trash2 size={14}/> Delete slide</button>
          </div>
          <div className="inspector-tip"><Sparkles size={15}/><div><strong>Pro tip</strong><p>Select any shape or text on the canvas to resize, rotate, recolor and layer it.</p></div></div>
        </aside>
      </div>
    </main>
  );
}
