"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type TargetAndTransition, type Transition } from "motion/react";
import Link from "next/link";
import DesignCanvas, { type Tool } from "./DesignCanvas";
import AssetLibrary, { type StudioAsset } from "./AssetLibrary";
import { sampleDeck, validateDeck, type SlideSpec } from "@slideai/shared";
import {
  ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronDown as MoveDown, ChevronUp as MoveUp, Copy, Download, ImagePlus,
  LayoutTemplate, MoreHorizontal, Plus, Send, Settings2,
  Sparkles, Trash2, Type, WandSparkles, ZoomIn, ZoomOut, MousePointer2,
  Pencil, Square, Play, Users, Circle as CircleIcon, Triangle as TriangleIcon, Minus,
  MoveUpRight, Star, Undo2, Redo2, Layers3, Diamond, Hexagon, Pentagon, Heart, MessageSquareText
} from "lucide-react";

type Slide = SlideSpec;

const TEXT_ANIMATIONS=["Fade in","Typewriter","Rise up","Slide from left","Slide from right","Zoom in","Pop","Bounce","Elastic","Soft focus","Flip X","Flip Y","Rotate in","Float up","Drop in","Stretch","Swing","Wave","Pulse","Glitch","Tracking reveal","Slide reveal","Focus in","Overshoot","Spring settle"];
const ITEM_ANIMATIONS=["Fade","Scale in","Pop","Bounce","Elastic","Spin in","Flip horizontal","Flip vertical","Slide left","Slide right","Slide up","Slide down","Float","Drift","Swing","Wobble","Pulse","Heartbeat","Shake","Jelly","Rubber band","Zoom through","Arc in","Drop","Spring"];
const SLIDE_ANIMATIONS=["Fade","Slide left","Slide right","Rise","Zoom","Flip","Blur","Wipe","Rotate","Bounce"];
const FONT_WEIGHT_OPTIONS: Record<string, number[]> = {
  "Inter Variable":[300,400,500,600,700,800], "DM Sans Variable":[300,400,500,600,700,800], "Manrope Variable":[300,400,500,600,700,800], "Space Grotesk Variable":[300,400,500,600,700], "Outfit Variable":[300,400,500,600,700,800], "Roboto Variable":[300,400,500,600,700,800], "Nunito Sans Variable":[300,400,500,600,700,800], "Playfair Display Variable":[400,500,600,700,800], "Montserrat Variable":[300,400,500,600,700,800], "Lora":[400,700], "Poppins":[400,500,600,700], "Oswald":[400,500,700], "Merriweather":[400,700], "Archivo":[400,500,700], "Bebas Neue":[400], "Caveat":[400,700]
};
const TEXT_EFFECTS=["Soft shadow","Deep shadow","Neon glow","Violet glow","Glass highlight","Frosted highlight","Outline","Double outline","Engraved","Wide tracking","Bold impact","Soft highlight","Glass text","Retro offset","3D depth","Metallic shadow","Underline accent","Overline accent","Pill highlight","Blur shadow","Long shadow","Warm glow","Cool glow","High contrast","Editorial italic"];
const ITEM_EFFECTS=["Soft shadow","Deep shadow","Neon glow","Violet glow","Glass","Frosted glass","Outline","Double border","Dashed border","Dotted border","Inner depth","Emboss","3D lift","Long shadow","Soft blur shadow","Glow edge","Duotone tint","High contrast","Vintage fade","Pastel tint","Vivid color","Monochrome","Holographic feel","Sticker edge","Floating"];


export default function StudioWorkspace() {
  const [slides, setSlides] = useState<Slide[]>(sampleDeck.slides);
  const [activeId, setActiveId] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Your starting deck is ready. Tell me what you would like to change, or select any text on the slide to edit it." }
  ]);
  const [title, setTitle] = useState(sampleDeck.title);
  const [zoom, setZoom] = useState(82);
  const [theme, setTheme] = useState<"violet" | "blue" | "light">("violet");
  const [tool, setTool] = useState<Tool>("select");
  const [fill, setFill] = useState("#a78bfa");
  const [stroke, setStroke] = useState("#d8ccff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontFamily, setFontFamily] = useState("Manrope Variable");
  const [fontSize, setFontSize] = useState(32);
  const [fontWeight, setFontWeight] = useState("400");
  const [cornerRadius, setCornerRadius] = useState(18);
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number,string>>({});
  const [slideAnimations, setSlideAnimations] = useState<Record<number,string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectionType, setSelectionType] = useState("");
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [canvasDataBySlide, setCanvasDataBySlide] = useState<Record<number, string>>({});
  const [assetLibraryCategory, setAssetLibraryCategory] = useState("All assets");
  const [canvasCommand, setCanvasCommand] = useState({ action: "", token: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [assetCommand, setAssetCommand] = useState<{symbol:string;label:string;imageUrl?:string;token:number}>({ symbol: "", label: "", token: 0 });
  const [imageCommand, setImageCommand] = useState({ dataUrl: "", name: "", token: 0 });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [textAnimation, setTextAnimation] = useState("Fade in");
  const [itemAnimation, setItemAnimation] = useState("Fade");
  const activeSlideAnimation = slideAnimations[activeId] ?? "Fade";
  const backgroundColor = slideBackgrounds[activeId] ?? (theme === "light" ? "#f1eee7" : theme === "blue" ? "#102333" : "#171525");
  const isTextSelection = ["textbox","i-text","text"].includes(selectionType.toLowerCase());
  const SLIDE_MOTION:Record<string,{initial:TargetAndTransition;animate:TargetAndTransition;transition:Transition}> = {
    "Fade":{initial:{opacity:0},animate:{opacity:[0,1]},transition:{duration:.72,ease:"easeOut"}},
    "Slide left":{initial:{x:760},animate:{x:[760,0]},transition:{duration:.78,ease:"easeOut"}},
    "Slide right":{initial:{x:-760},animate:{x:[-760,0]},transition:{duration:.78,ease:[.22,1,.36,1]}},
    "Rise":{initial:{y:460,opacity:0},animate:{y:[460,0],opacity:[0,1]},transition:{duration:.8,ease:"circOut"}},
    "Zoom":{initial:{scale:.28,opacity:0},animate:{scale:[.28,1.04,1],opacity:[0,1,1]},transition:{duration:.82,times:[0,.72,1],ease:"easeOut"}},
    "Flip":{initial:{rotateY:-105,opacity:.35},animate:{rotateY:[-105,12,0],opacity:[.35,1,1]},transition:{duration:.86,times:[0,.78,1],ease:"easeOut"}},
    "Blur":{initial:{filter:"blur(30px)",opacity:.15},animate:{filter:["blur(30px)","blur(0px)"],opacity:[.15,1]},transition:{duration:.9,ease:"easeOut"}},
    "Wipe":{initial:{clipPath:"inset(0 100% 0 0)"},animate:{clipPath:["inset(0 100% 0 0)","inset(0 0% 0 0)"]},transition:{duration:.8,ease:"easeInOut"}},
    "Rotate":{initial:{rotate:-24,scale:.78,opacity:0},animate:{rotate:[-24,5,0],scale:[.78,1.03,1],opacity:[0,1,1]},transition:{duration:.86,times:[0,.72,1],ease:"easeOut"}},
    "Bounce":{initial:{y:-300,opacity:0},animate:{y:[-300,0,-28,0],opacity:[0,1,1,1]},transition:{duration:1.05,times:[0,.62,.82,1],ease:"easeOut"}}
  };
  const slideMotion = SLIDE_MOTION[activeSlideAnimation] ?? SLIDE_MOTION.Fade;
  const [textEffect, setTextEffect] = useState("Soft shadow");
  const [itemEffect, setItemEffect] = useState("Soft shadow");
  const activeSlide = useMemo(() => slides.find((slide) => slide.id === activeId) ?? slides[0], [slides, activeId]);
  useEffect(() => {
    if (!isPlaying) return;
    const index = slides.findIndex((slide) => slide.id === activeId);
    const timer = window.setTimeout(() => { if (index >= slides.length - 1) setIsPlaying(false); else setActiveId(slides[index + 1].id); }, 2300);
    return () => window.clearTimeout(timer);
  }, [isPlaying, activeId, slides]);

  useEffect(() => {
    function handleEditorShortcut(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPlaying(false);
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setCanvasCommand((current) => ({ action: event.shiftKey ? "redo" : "undo", token: current.token + 1 }));
      } else if (modifier && event.key.toLowerCase() === "d" && hasSelection) {
        event.preventDefault();
        setCanvasCommand((current) => ({ action: "duplicate", token: current.token + 1 }));
      } else if ((event.key === "Delete" || event.key === "Backspace") && hasSelection) {
        event.preventDefault();
        setCanvasCommand((current) => ({ action: "delete", token: current.token + 1 }));
      }
    }
    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
  }, [hasSelection]);


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
  }

  function issueCanvasCommand(action: string) {
    setCanvasCommand((current) => ({ action, token: current.token + 1 }));
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
        <Link className="studio-back" href="/"><ArrowLeft size={16} /><span>Back to workspace</span></Link>
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
              <button className="tool-button" onClick={() => issueCanvasCommand("undo")} disabled={!canUndo} title="Undo"><Undo2 size={15}/></button>
              <button className="tool-button" onClick={() => issueCanvasCommand("redo")} disabled={!canRedo} title="Redo"><Redo2 size={15}/></button>
              <button className="tool-button asset-launch-button" onClick={() => {setAssetLibraryCategory("All assets");setAssetLibraryOpen(true);}} title="Open asset library"><ImagePlus size={15}/><span>Assets</span></button>
              <button className="tool-button" onClick={() => {setAssetLibraryCategory("Characters");setAssetLibraryOpen(true);}} title="Add a character"><Users size={15}/><span>Characters</span></button>
              <button className="tool-button" onClick={() => {setIsPlaying(true);setActiveId(slides[0].id);}} title="Play all slides"><Play size={15}/><span>Play all</span></button>
              {isPlaying && <button className="tool-button active-tool" onClick={() => setIsPlaying(false)} title="Stop presentation preview"><Square size={14}/><span>Stop</span></button>}
              <button className="tool-button" onClick={() => imageInputRef.current?.click()} title="Add image from computer"><ImagePlus size={15}/><span>Image</span></button>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden onChange={(event) => { const file=event.target.files?.[0]; if(!file)return; if(file.size>12*1024*1024){window.alert("Please choose an image smaller than 12 MB.");event.target.value="";return;} const reader=new FileReader(); reader.onload=()=>{if(typeof reader.result==="string")setImageCommand(current=>({dataUrl:reader.result as string,name:file.name,token:current.token+1}));}; reader.readAsDataURL(file); event.target.value=""; }} />
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
              <motion.div key={activeId + activeSlideAnimation} className="canvas-motion-frame" style={{transformPerspective:1200}} initial={slideMotion.initial} animate={slideMotion.animate} transition={slideMotion.transition}>
              <DesignCanvas
                slideId={activeId}
                slideNumber={`${String(slides.findIndex((slide) => slide.id === activeId) + 1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`}
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
                fontWeight={Number(fontWeight)}
                cornerRadius={cornerRadius}
                backgroundColor={backgroundColor}
                shadowEnabled={shadowEnabled}
                opacity={opacity}
                initialData={canvasDataBySlide[activeId]}
                onChange={saveCanvas}
                onSelectionChange={(selected, type) => {setHasSelection(selected);setSelectionType(type ?? "");}}
                command={canvasCommand}
                assetCommand={assetCommand}
                imageCommand={imageCommand}
                onHistoryChange={(undo, redo) => { setCanUndo(undo); setCanRedo(redo); }}
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
            <div className="inspector-label">SLIDE BACKGROUND</div>
            <div className="color-control-row"><label>Background <input type="color" value={backgroundColor} onChange={(event) => setSlideBackgrounds((current) => ({...current,[activeId]:event.target.value}))}/></label><button className="quick-action" onClick={() => setSlideBackgrounds((current) => {const next={...current};delete next[activeId];return next;})}>Reset background</button></div>
            <div className="inspector-label preset-label">COLORS & STROKE</div>
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
            <select className="inspector-input" value={fontFamily} onChange={(event) => {const family=event.target.value;setFontFamily(family);if(!(FONT_WEIGHT_OPTIONS[family]??[400,700]).includes(Number(fontWeight)))setFontWeight("400");}}>
              <option>Inter Variable</option><option>DM Sans Variable</option><option>Manrope Variable</option><option>Space Grotesk Variable</option><option>Outfit Variable</option><option>Roboto Variable</option><option>Nunito Sans Variable</option><option>Playfair Display Variable</option><option>Montserrat Variable</option><option>Lora</option><option>Poppins</option><option>Oswald</option><option>Merriweather</option><option>Archivo</option><option>Bebas Neue</option><option>Caveat</option>
            </select>
            <label className="range-label">Font weight <span>{fontWeight}</span></label><select className="inspector-input" value={fontWeight} onChange={(event) => setFontWeight(event.target.value)}>{(FONT_WEIGHT_OPTIONS[fontFamily]??[400,700]).map((weight) => <option key={weight} value={String(weight)}>{weight===300?"Light":weight===400?"Regular":weight===500?"Medium":weight===600?"Semi bold":weight===700?"Bold":"Extra bold"} {weight}</option>)}</select>
            <label className="range-label">Font size <span>{fontSize}px</span></label><input className="range-control" type="range" min="12" max="100" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}/>
          </div>
          <div className="inspector-section motion-library-section">
            <div className="inspector-label">TEXT ANIMATIONS <span>25 PRESETS</span></div>
            <select className="inspector-input" value={textAnimation} disabled={!hasSelection || !isTextSelection} onChange={event=>{setTextAnimation(event.target.value);issueCanvasCommand("preview-animation:text:"+event.target.value);}}>{TEXT_ANIMATIONS.map(name=><option key={name}>{name}</option>)}</select>
            <p className="inspector-hint">Select text, then choose an animation to preview it instantly. Nothing is permanently applied.</p>
            <div className="inspector-label preset-label">ITEM ANIMATIONS <span>25 PRESETS</span></div>
            <select className="inspector-input" value={itemAnimation} disabled={!hasSelection || isTextSelection} onChange={event=>{setItemAnimation(event.target.value);issueCanvasCommand("preview-animation:item:"+event.target.value);}}>{ITEM_ANIMATIONS.map(name=><option key={name}>{name}</option>)}</select>
            <p className="inspector-hint">Select a product, image or shape, then choose an animation for an instant preview.</p>
            <div className="inspector-label preset-label">TEXT EFFECTS <span>25 PRESETS</span></div>
            <select className="inspector-input" value={textEffect} onChange={event=>setTextEffect(event.target.value)}>{TEXT_EFFECTS.map(name=><option key={name}>{name}</option>)}</select>
            <button className="quick-action" onClick={()=>issueCanvasCommand("effect:text:"+TEXT_EFFECTS.indexOf(textEffect)+"-"+textEffect.toLowerCase().replace(/[^a-z0-9]+/g,"-"))} disabled={!hasSelection}>Apply text effect</button>
            <div className="inspector-label preset-label">ITEM EFFECTS <span>25 PRESETS</span></div>
            <select className="inspector-input" value={itemEffect} onChange={event=>setItemEffect(event.target.value)}>{ITEM_EFFECTS.map(name=><option key={name}>{name}</option>)}</select>
            <button className="quick-action" onClick={()=>issueCanvasCommand("effect:item:"+ITEM_EFFECTS.indexOf(itemEffect)+"-"+itemEffect.toLowerCase().replace(/[^a-z0-9]+/g,"-"))} disabled={!hasSelection}>Apply item effect</button>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">THIS SLIDE ANIMATION <span>10 OPTIONS</span></div>
            <select className="inspector-input" value={activeSlideAnimation} onChange={(event) => setSlideAnimations((current) => ({...current,[activeId]:event.target.value}))}>{SLIDE_ANIMATIONS.map((name) => <option key={name}>{name}</option>)}</select>
            <p className="inspector-hint">Each slide keeps its own entrance animation. Use Play all to preview the complete presentation.</p>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">SLIDE CONTENT</div>
            <label className="field-label">Slide title</label><input className="inspector-input" value={activeSlide.title} onChange={(event) => { updateActive({title:event.target.value}); }}/>
            <label className="field-label">Description</label><textarea className="inspector-textarea" value={activeSlide.body} onChange={(event) => updateActive({body:event.target.value})}/>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">OBJECT CORNERS</div>
            <label className="range-label">Corner radius <span>{cornerRadius}px</span></label><input className="range-control" type="range" min="0" max="80" value={cornerRadius} onChange={(event) => setCornerRadius(Number(event.target.value))} disabled={!hasSelection}/>
            <p className="inspector-hint">Adjusts the selected shape, image or text container. Set to 0 for square corners.</p>
          </div>
          <div className="inspector-section">
            <div className="inspector-label">SELECTED OBJECT</div>
            <button className="quick-action" onClick={() => issueCanvasCommand("duplicate")} disabled={!hasSelection}><Copy size={14}/> Duplicate object</button>
            <button className="quick-action" onClick={() => issueCanvasCommand("front")} disabled={!hasSelection}><MoveUp size={14}/> Bring to front</button>
            <button className="quick-action" onClick={() => issueCanvasCommand("back")} disabled={!hasSelection}><MoveDown size={14}/> Send to back</button>
            <button className="quick-action danger-action" onClick={() => issueCanvasCommand("delete")} disabled={!hasSelection}><Trash2 size={14}/> Delete object</button>
            <div className="inspector-label action-subheading">SLIDE ACTIONS</div>
            <button className="quick-action" onClick={duplicateSlide}><Copy size={14}/> Duplicate slide</button>
            <button className="quick-action" onClick={() => moveSlide(-1)} disabled={slides.findIndex((slide) => slide.id === activeId) === 0}><MoveUp size={14}/> Move slide up</button>
            <button className="quick-action" onClick={() => moveSlide(1)} disabled={slides.findIndex((slide) => slide.id === activeId) === slides.length - 1}><MoveDown size={14}/> Move slide down</button>
            <button className="quick-action danger-action" onClick={deleteSlide} disabled={slides.length <= 1}><Trash2 size={14}/> Delete slide</button>
          </div>
          <div className="inspector-tip"><Sparkles size={15}/><div><strong>Pro tip</strong><p>Select any shape or text on the canvas to resize, rotate, recolor and layer it.</p></div></div>
        </aside>
      </div>
      {assetLibraryOpen && <AssetLibrary initialCategory={assetLibraryCategory} onClose={() => setAssetLibraryOpen(false)} onChoose={(asset: StudioAsset) => { setAssetCommand((current) => ({ symbol: asset.symbol, label: asset.label, imageUrl: asset.imageUrl, token: current.token + 1 })); setAssetLibraryOpen(false); setTool("select"); }} />}
    </main>
  );
}
