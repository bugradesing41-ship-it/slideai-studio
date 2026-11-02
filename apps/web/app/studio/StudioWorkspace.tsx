"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type TargetAndTransition, type Transition } from "motion/react";
import Link from "next/link";
import DesignCanvas, { type Tool } from "./DesignCanvas";
import AssetLibrary, { type StudioAsset } from "./AssetLibrary";
import { sampleDeck, validateDeck, type SlideSpec } from "@slideai/shared";
import {
  ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronDown as MoveDown, ChevronUp as MoveUp, Copy, Download, ImagePlus,
  LayoutTemplate, Plus, Settings2,
  Sparkles, Trash2, Type, ZoomIn, ZoomOut, MousePointer2,
  Pencil, Square, Play, Circle as CircleIcon, Triangle as TriangleIcon, Minus,
  MoveUpRight, Star, Undo2, Redo2, Layers3, Diamond, Hexagon, Pentagon, Heart, MessageSquareText
} from "lucide-react";

type Slide = SlideSpec;

const DEFAULT_FONT_WEIGHTS=[400];
const SLIDE_ANIMATIONS=["Fade","Slide left","Slide right","Rise","Zoom","Flip","Blur","Wipe","Rotate","Bounce"];
const TEXT_OBJECT_ANIMATIONS=["Fade in","Typewriter","Rise up","Slide from left","Slide from right","Pop","Elastic","Soft focus","Flip X","Flip Y","Rotate in","Float up","Drop in","Stretch","Tracking reveal","Focus in","Overshoot","Spring settle","Wobble","Heartbeat"];
const ELEMENT_ANIMATIONS=["Fade in","Rise up","Slide from left","Slide from right","Zoom in","Pop","Bounce","Elastic","Rotate in","Drop in","Swing","Wave","Pulse","Glitch","Slide reveal","Spring settle","Jelly","Rubber band","Zoom through","Arc in","Drop","Spin in","Flip horizontal","Flip vertical","Float","Drift","Shake"];


export default function StudioWorkspace() {
  const [slides, setSlides] = useState<Slide[]>(sampleDeck.slides);
  const [localSaveState, setLocalSaveState] = useState("Restoring…");
  const [isRestored, setIsRestored] = useState(false);
  const [activeId, setActiveId] = useState(1);
  const [title, setTitle] = useState(sampleDeck.title);
  const [zoom, setZoom] = useState(82);
  const [theme, setTheme] = useState<"violet" | "blue" | "light">("violet");
  const [tool, setTool] = useState<Tool>("select");
  const [fill, setFill] = useState("#a78bfa");
  const [stroke, setStroke] = useState("#d8ccff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontFamily, setFontFamily] = useState("Manrope");
  const [fontCatalog, setFontCatalog] = useState<string[]>([]);
  const [fontWeightsByFamily, setFontWeightsByFamily] = useState<Record<string,number[]>>({});
  const fontWeights = fontWeightsByFamily[fontFamily] ?? DEFAULT_FONT_WEIGHTS;
  const [fontSearch, setFontSearch] = useState("");
  const [fontCatalogStatus, setFontCatalogStatus] = useState("Google Fonts kataloğu yükleniyor…");
  const [fontSize, setFontSize] = useState(32);
  const [fontWeight, setFontWeight] = useState("400");
  const [cornerRadius, setCornerRadius] = useState(18);
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number,string>>({});
  const [slideAnimations, setSlideAnimations] = useState<Record<number,string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackToken, setPlaybackToken] = useState(0);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [canvasDataBySlide, setCanvasDataBySlide] = useState<Record<number, string>>({});
  const [assetLibraryCategory, setAssetLibraryCategory] = useState("All assets");
  const [canvasCommand, setCanvasCommand] = useState({ action: "", token: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [assetCommand, setAssetCommand] = useState<{symbol:string;label:string;imageUrl?:string;fontFamily?:string;token:number}>({ symbol: "", label: "", token: 0 });
  const [imageCommand, setImageCommand] = useState({ dataUrl: "", name: "", token: 0 });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedObjectType, setSelectedObjectType] = useState("");
  const [selectedAnimationPreset, setSelectedAnimationPreset] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const activeSlideAnimation = slideAnimations[activeId] ?? "Fade";
  const backgroundColor = slideBackgrounds[activeId] ?? (theme === "light" ? "#f1eee7" : theme === "blue" ? "#102333" : "#171525");
  const SLIDE_MOTION:Record<string,{initial:TargetAndTransition;animate:TargetAndTransition;transition:Transition}> = {
    "Fade":{initial:{opacity:0},animate:{opacity:[0,1]},transition:{duration:.72,ease:"easeOut"}},
    "Slide left":{initial:{x:760},animate:{x:[760,0]},transition:{duration:.78,ease:"easeOut"}},
    "Slide right":{initial:{x:-760},animate:{x:[-760,0]},transition:{duration:.78,ease:"easeOut"}},
    "Rise":{initial:{y:460,opacity:0},animate:{y:[460,0],opacity:[0,1]},transition:{duration:.8,ease:"circOut"}},
    "Zoom":{initial:{scale:.28,opacity:0},animate:{scale:[.28,1.04,1],opacity:[0,1,1]},transition:{duration:.82,times:[0,.72,1],ease:"easeOut"}},
    "Flip":{initial:{rotateY:-105,opacity:.35},animate:{rotateY:[-105,12,0],opacity:[.35,1,1]},transition:{duration:.86,times:[0,.78,1],ease:"easeOut"}},
    "Blur":{initial:{filter:"blur(30px)",opacity:.15},animate:{filter:["blur(30px)","blur(0px)"],opacity:[.15,1]},transition:{duration:.9,ease:"easeOut"}},
    "Wipe":{initial:{clipPath:"inset(0 100% 0 0)"},animate:{clipPath:["inset(0 100% 0 0)","inset(0 0% 0 0)"]},transition:{duration:.8,ease:"easeInOut"}},
    "Rotate":{initial:{rotate:-24,scale:.78,opacity:0},animate:{rotate:[-24,5,0],scale:[.78,1.03,1],opacity:[0,1,1]},transition:{duration:.86,times:[0,.72,1],ease:"easeOut"}},
    "Bounce":{initial:{y:-300,opacity:0},animate:{y:[-300,0,-28,0],opacity:[0,1,1,1]},transition:{duration:1.05,times:[0,.62,.82,1],ease:"easeOut"}}
  };
  const slideMotion = SLIDE_MOTION[activeSlideAnimation] ?? SLIDE_MOTION.Fade;
  const activeSlide = useMemo(() => slides.find((slide) => slide.id === activeId) ?? slides[0], [slides, activeId]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("slideai-studio-local-project-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { title?: string; theme?: "violet" | "blue" | "light"; slides?: Slide[]; canvasDataBySlide?: Record<number,string>; slideBackgrounds?: Record<number,string>; slideAnimations?: Record<number,string> };
        if (Array.isArray(parsed.slides) && parsed.slides.length) {
          const validation = validateDeck({ ...sampleDeck, title: parsed.title || sampleDeck.title, theme: parsed.theme || "violet", slides: parsed.slides });
          if (validation.success) {
            setSlides(validation.data.slides);
            setTitle(parsed.title || sampleDeck.title);
            setTheme(parsed.theme || "violet");
            setCanvasDataBySlide(parsed.canvasDataBySlide || {});
            setSlideBackgrounds(parsed.slideBackgrounds || {});
            setSlideAnimations(parsed.slideAnimations || {});
            setActiveId(validation.data.slides[0].id);
          }
        }
      }
      setLocalSaveState("Saved locally");
    } catch {
      setLocalSaveState("Local restore unavailable");
    } finally {
      setIsRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    try {
      localStorage.setItem("slideai-studio-local-project-v1", JSON.stringify({ title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations }));
      setLocalSaveState("Saved locally");
    } catch {
      setLocalSaveState("Export project to keep a backup");
    }
  }, [isRestored, title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fonts").then((response) => { if (!response.ok) throw new Error("Google Fonts kataloğu alınamadı"); return response.json(); }).then((data: {families?: string[];weightsByFamily?:Record<string,number[]>}) => { if (!cancelled && data.families?.length) { setFontCatalog(data.families); setFontWeightsByFamily(data.weightsByFamily??{}); setFontCatalogStatus(`${data.families.length.toLocaleString()} Google Fonts ailesi`); } }).catch(() => { if (!cancelled) { setFontCatalog(["Arimo","Archivo","Bebas Neue","Caveat","DM Sans","Inter","Lora","Manrope","Merriweather","Montserrat","Noto Sans","Open Sans","Oswald","Outfit","Playfair Display","Poppins","Roboto","Source Sans 3","Space Grotesk"]); setFontCatalogStatus("Çevrimdışı katalog · Google Fonts CDN"); } });
    return () => { cancelled = true; };
  }, []);

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
    const next: Slide = { id, title: "A new perspective", eyebrow: "04 — EXPLORE", body: "Add your key message here. Keep the idea focused, clear and memorable.", kind: "content", layout: "title-and-body", elements: [] };
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

  function buildProjectBlob() {
    const project = { format: "slideai-studio-project", version: 1, title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations,
    };
    return new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  }
  function exportProject() {
    const blob = buildProjectBlob();
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slideai-project"}.slideai.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  async function shareProject() {
    const shareText = `${title} — SlideAI Studio\n${slides.length} slides. Project file can be exported from the editor.`;
    const projectFile = new File([buildProjectBlob()], `${title || "slideai-project"}.slideai.json`, { type: "application/json" });
    if (navigator.share && navigator.canShare?.({ files: [projectFile] })) { try { await navigator.share({ title, text: shareText, files: [projectFile] }); return; } catch { /* cancelled */ } }
    if (navigator.share) { try { await navigator.share({ title, text: shareText }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(shareText);
    window.alert("Proje bilgisi panoya kopyalandı. Paylaşılabilir bağlantı için çevrimiçi proje depolama hesabı gerekir.");
  }
  async function exportPowerPoint() {
    const response = await fetch("/api/export/pptx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, theme, slides, slideBackgrounds }),
    });
    if (!response.ok) {
      const message = await response.text();
      window.alert(message || "PowerPoint dosyası oluşturulamadı.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slideai-presentation"}.pptx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportSlidePng() {
    const canvas = document.querySelector<HTMLCanvasElement>(".canvas-container canvas");
    if (!canvas) { window.alert("Tuval henüz hazır değil."); return; }
    const anchor = document.createElement("a"); anchor.href = canvas.toDataURL("image/png");
    anchor.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slide"}-${activeId}.png`; anchor.click();
  }

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <Link className="studio-back" href="/"><ArrowLeft size={16} /><span>Back to workspace</span></Link>
        <div className="studio-doc-title"><span className="doc-icon"><LayoutTemplate size={15} /></span><span>{title}</span><span className="saved-pill"><Check size={12} /> {localSaveState}</span></div>
        <div className="studio-top-actions"><button className="share-button" onClick={() => void shareProject()}>Share <ArrowUpRight size={14}/></button><div className="export-menu-wrap"><button className="export-button" onClick={() => setExportMenuOpen((open) => !open)}><Download size={14}/> Export <ChevronDown size={13}/></button>{exportMenuOpen && <div className="export-menu"><button onClick={() => { exportProject(); setExportMenuOpen(false); }}><Download size={14}/> Editable project (.json)</button><button onClick={() => { exportSlidePng(); setExportMenuOpen(false); }}><ImagePlus size={14}/> Current slide (.png)</button><button onClick={() => { void exportPowerPoint(); setExportMenuOpen(false); }}><Download size={14}/> PowerPoint (.pptx)</button></div>}</div></div>
      </header>

      <div className="studio-body">
        <aside className="chat-panel animation-presets-panel">
          <div className="panel-heading"><div className="panel-heading-icon"><Play size={16}/></div><div><strong>Object animations</strong><span>Text & element motion presets</span></div></div>
          <div className="chat-context"><span className="context-dot"/> SELECT AN OBJECT · APPLY · PREVIEW</div>
          <div className="animation-library-content">
            <p className="animation-library-intro">Tuvalde bir metin veya tasarım öğesi seç. Seçtiğin nesne türüne uygun animasyonları buradan uygula.</p>
            {!hasSelection ? <div className="animation-empty-state"><MousePointer2 size={22}/><strong>Henüz nesne seçilmedi</strong><span>Animasyon eklemek için slayttaki bir metne, şekle veya görsele tıkla.</span></div> : <>
              <div className="animation-target-label"><span>{["textbox","i-text","text"].includes(selectedObjectType.toLowerCase()) ? "TEXT ANIMATIONS" : "ELEMENT ANIMATIONS"}</span><small>{selectedObjectType}</small></div>
              <div className="animation-preset-list">{(["textbox","i-text","text"].includes(selectedObjectType.toLowerCase()) ? TEXT_OBJECT_ANIMATIONS : ELEMENT_ANIMATIONS).map((preset,index)=><button key={preset} className={selectedAnimationPreset===preset?"animation-preset-card selected":"animation-preset-card"} onClick={()=>{const kind=["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())?"text":"element";setSelectedAnimationPreset(preset);issueCanvasCommand(`apply-animation:${kind}:${preset}`);}}><span className="animation-preset-index">{String(index+1).padStart(2,"0")}</span><span className="animation-preset-copy"><strong>{preset}</strong><small>{preset==="Typewriter"?"Character-by-character reveal":preset==="Tracking reveal"?"Letter spacing reveal":preset==="Spring settle"||preset==="Elastic"?"Soft spring motion":preset==="Glitch"?"Digital displacement":"Smooth entrance motion"}</small></span><span className="animation-preset-check">{selectedAnimationPreset===preset?"✓":"＋"}</span></button>)}</div>
              <button className="animation-preview-button" disabled={!selectedAnimationPreset} onClick={()=>issueCanvasCommand(`preview-animation:${["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())?"text":"element"}:${selectedAnimationPreset}`)}><Play size={14}/> Preview selected animation</button>
              {selectedAnimationPreset && <p className="inspector-hint">“{selectedAnimationPreset}” nesneye kaydedildi. Proje JSON dışa aktarımında animasyon ayarı korunur.</p>}
            </>}
          </div>
        </aside>

        <section className="editor-main">
          <div className="editor-toolbar editor-toolbar-advanced">
            <div className="toolbar-left toolbar-tools">
              <span className="toolbar-label">SLIDE {String(slides.findIndex((slide) => slide.id === activeId) + 1).padStart(2,"0")} <i>/ {String(slides.length).padStart(2,"0")}</i></span>
              <span className="toolbar-divider"/>
              <button className="tool-button" onClick={() => issueCanvasCommand("undo")} disabled={!canUndo} title="Undo"><Undo2 size={15}/></button>
              <button className="tool-button" onClick={() => issueCanvasCommand("redo")} disabled={!canRedo} title="Redo"><Redo2 size={15}/></button>
              <button className="tool-button asset-launch-button" onClick={() => {setAssetLibraryCategory("All assets");setAssetLibraryOpen(true);}} title="Open asset library"><ImagePlus size={15}/><span>Assets</span></button>
                            <button className="tool-button" onClick={() => {setIsPlaying(true);setPlaybackToken((token) => token + 1);setActiveId(slides[0].id);}} title="Play all slides"><Play size={15}/><span>Play all</span></button>
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
              <motion.div key={activeId + activeSlideAnimation + playbackToken} className="canvas-motion-frame" style={{transformPerspective:1200}} initial={slideMotion.initial} animate={slideMotion.animate} transition={slideMotion.transition}>
              <DesignCanvas
                key={`${activeId}`}
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
                fontWeights={fontWeights}
                fontSize={fontSize}
                fontWeight={Number(fontWeight)}
                cornerRadius={cornerRadius}
                backgroundColor={backgroundColor}
                shadowEnabled={shadowEnabled}
                opacity={opacity}
                initialData={canvasDataBySlide[activeId]}
                designElements={activeSlide.elements ?? []}
                onChange={saveCanvas}
                onSelectionChange={(selected, type, typography, animationPreset) => {setHasSelection(selected);setSelectedObjectType(type??"");setSelectedAnimationPreset(animationPreset??"");if(typography){if(typography.fontFamily)setFontFamily(typography.fontFamily);if(typography.fontSize)setFontSize(typography.fontSize);if(typography.fontWeight)setFontWeight(String(typography.fontWeight));}}}
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

          <div className="filmstrip"><div className="filmstrip-label">SLIDES <span>{slides.length}</span><span> · CURRENT {String(Math.max(0,slides.findIndex((slide)=>slide.id===activeId))+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span></div><div className="thumbnail-list">{slides.map((slide,index) => <button className={`thumbnail ${activeId===slide.id?"selected":""}`} key={slide.id} onClick={() => setActiveId(slide.id)}><div className={`thumbnail-art thumb-${slide.kind}`}><small>{slide.eyebrow}</small><strong>{slide.title}</strong><i/><i/><em className="thumbnail-number">{String(index+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</em></div><span>{String(index+1).padStart(2,"0")} · {slide.title}</span></button>)}<button className="add-slide" onClick={addSlide}><Plus size={18}/><span>Add slide</span></button></div></div>
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
            <div className="inspector-label">TYPOGRAPHY <span>GOOGLE FONTS</span></div>
            <label className="field-label">Font ailesi ara</label>
            <input className="inspector-input font-search-input" value={fontSearch} onChange={(event)=>setFontSearch(event.target.value)} placeholder="Font ara…"/>
            <select className="inspector-input font-family-select" size={7} value={fontFamily} onChange={(event)=>{setFontFamily(event.target.value);setFontWeight(String((fontWeightsByFamily[event.target.value]??[400])[0]));}} aria-label="Google Fonts family">
              {fontCatalog.filter(family=>family.toLowerCase().includes(fontSearch.trim().toLowerCase())).slice(0,500).map(family=><option key={family} value={family} style={{fontFamily:`"${family}", sans-serif`}}>{family}</option>)}
            </select>
            <p className="inspector-hint">{fontCatalogStatus}. Seçilen aile Google Fonts üzerinden yüklenir; katalog dışı isimlerde sistem fontuna geri dönülür.</p>
            <div className="font-preview-sample" style={{fontFamily:`"${fontFamily}", sans-serif`,fontWeight:Number(fontWeight)}}>Aa Bb Cc 123 · ÇĞİÖŞÜ</div>
            <label className="range-label">Font weight <span>{fontWeight}</span></label><select className="inspector-input" value={fontWeight} onChange={(event) => setFontWeight(event.target.value)}>{fontWeights.map((weight)=><option key={weight} value={String(weight)}>{weight===100?"Thin":weight===200?"Extra light":weight===300?"Light":weight===400?"Regular":weight===500?"Medium":weight===600?"Semi bold":weight===700?"Bold":weight===800?"Extra bold":weight===900?"Black":`Weight ${weight}`} {weight}</option>)}</select>
            <label className="range-label">Font size <span>{fontSize}px</span></label><input className="range-control" type="range" min="12" max="100" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}/>
          </div>
          <div className="inspector-section motion-library-section">
            <div className="inspector-label">SLIDE TRANSITION <span>10 STYLES</span></div>
            <select className="inspector-input" value={activeSlideAnimation} onChange={(event) => setSlideAnimations((current) => ({...current,[activeId]:event.target.value}))}>{SLIDE_ANIMATIONS.map((name) => <option key={name}>{name}</option>)}</select>
            <p className="inspector-hint">Slayt geçişi sunum önizlemesinde uygulanır. Ayrı animasyon katmanları için Motion Library'yi kullan.</p>
            <button className="quick-action" onClick={()=>setMotionLibraryOpen(true)}><Play size={14}/> Open animation library</button>
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
      {assetLibraryOpen && <AssetLibrary initialCategory={assetLibraryCategory} onClose={() => setAssetLibraryOpen(false)} onChoose={(asset: StudioAsset) => { setAssetCommand((current) => ({ symbol: asset.symbol, label: asset.label, imageUrl: asset.imageUrl, fontFamily: asset.fontFamily, token: current.token + 1 })); setAssetLibraryOpen(false); setTool("select"); }} />}
    </main>
  );
}
