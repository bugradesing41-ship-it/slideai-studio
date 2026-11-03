"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls, type TargetAndTransition, type Transition } from "motion/react";
import Link from "next/link";
import DesignCanvas, { type Tool } from "./DesignCanvas";
import AssetLibrary, { type StudioAsset } from "./AssetLibrary";
import { sampleDeck, validateDeck, type SlideSpec } from "@slideai/shared";
import {
  ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronDown as MoveDown, ChevronUp as MoveUp, Copy, Download, ImagePlus,
  LayoutTemplate, Plus, Settings2,
  Sparkles, Trash2, Type, ZoomIn, ZoomOut, MousePointer2,
  Pencil, Square, Play, Circle as CircleIcon, Triangle as TriangleIcon, Minus,
  MoveUpRight, Star, Undo2, Redo2, Layers3, Diamond, Hexagon, Pentagon, Heart, MessageSquareText,
  Ruler, Grid3X3, Lock, Unlock, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight, Group, Ungroup
} from "lucide-react";

type Slide = SlideSpec;
type CanvasLayer = {index:number;id:string;name:string;type:string;visible:boolean;locked:boolean;active:boolean};

const BLANK_SLIDE: Slide = { id: 1, title: " ", eyebrow: "", body: "", kind: "cover", layout: "title", elements: [] };

const DEFAULT_FONT_WEIGHTS=[400];
const SLIDE_ANIMATIONS=["Fade","Slide left","Slide right","Rise","Zoom","Flip","Blur","Wipe","Rotate","Bounce"];
const TEXT_OBJECT_ANIMATIONS=["Fade in","Typewriter","Rise up","Slide from left","Slide from right","Zoom in","Spin in","Arc in","Drop in","Swing","Pulse","Shake","Glitch","Tracking reveal","Flip X","Flip Y","Whip pan","Orbit in"];
const ELEMENT_ANIMATIONS=["Fade in","Rise up","Slide from left","Slide from right","Zoom in","Spin in","Arc in","Drop in","Swing","Pulse","Shake","Glitch","Rubber band","Flip X","Flip Y","Whip pan","Orbit in"];


export default function StudioWorkspace() {
  const [slides, setSlides] = useState<Slide[]>([BLANK_SLIDE]);
  const [localSaveState, setLocalSaveState] = useState("Restoring…");
  const [isRestored, setIsRestored] = useState(false);
  const [activeId, setActiveId] = useState(1);
  const [title, setTitle] = useState("Untitled presentation");
  const [zoom, setZoom] = useState(82);
  const [theme, setTheme] = useState<"violet" | "blue" | "light">("light");
  const [tool, setTool] = useState<Tool>("select");
  const [fill, setFill] = useState("#a78bfa");
  const [stroke, setStroke] = useState("#d8ccff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textBorderEnabled, setTextBorderEnabled] = useState(false);
  const [textBorderWidth, setTextBorderWidth] = useState(1);
  const [fontFamily, setFontFamily] = useState("Manrope");
  const [fontCatalog, setFontCatalog] = useState<string[]>([]);
  const [fontWeightsByFamily, setFontWeightsByFamily] = useState<Record<string,number[]>>({});
  const fontWeights = fontWeightsByFamily[fontFamily] ?? DEFAULT_FONT_WEIGHTS;
  const [fontSearch, setFontSearch] = useState("");
  const [fontCatalogStatus, setFontCatalogStatus] = useState("Google Fonts kataloğu yükleniyor…");
  const [fontSize, setFontSize] = useState(32);
  const [letterSpacing,setLetterSpacing]=useState(0);
  const [lineHeight,setLineHeight]=useState(120);
  const [fontWeight, setFontWeight] = useState("400");
  const [cornerRadius, setCornerRadius] = useState(18);
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<number,string>>({});
  const [slideAnimations, setSlideAnimations] = useState<Record<number,string>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const slideAnimationControls = useAnimationControls();
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [canvasDataBySlide, setCanvasDataBySlide] = useState<Record<number, string>>({});
  const [assetLibraryCategory, setAssetLibraryCategory] = useState("All assets");
  const [canvasCommand, setCanvasCommand] = useState({ action: "", token: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [assetCommand, setAssetCommand] = useState<{symbol:string;label:string;imageUrl?:string;fontFamily?:string;animated?:boolean;token:number}>({ symbol: "", label: "", token: 0 });
  const [imageCommand, setImageCommand] = useState({ dataUrl: "", name: "", token: 0 });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedObjectType, setSelectedObjectType] = useState("");
  const [selectedAnimationPreset, setSelectedAnimationPreset] = useState("");
  const [animationCategory, setAnimationCategory] = useState("All");
  const [leftPanelTab,setLeftPanelTab]=useState<"layers"|"arrange"|"animations">("layers");
  const [layers,setLayers]=useState<CanvasLayer[]>([]);
  const [showRulers,setShowRulers]=useState(true);
  const [showGuides,setShowGuides]=useState(true);
  const [snapToGuides,setSnapToGuides]=useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const activeSlideAnimation = slideAnimations[activeId] ?? "Fade";
  const backgroundColor = slideBackgrounds[activeId] ?? (theme === "light" ? "#ffffff" : theme === "blue" ? "#102333" : "#171525");
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
  const slideMotion = useMemo(() => SLIDE_MOTION[activeSlideAnimation] ?? SLIDE_MOTION.Fade, [activeSlideAnimation]);
  const activeSlide = useMemo(() => slides.find((slide) => slide.id === activeId) ?? slides[0], [slides, activeId]);
  useEffect(() => {
    try {
      const startBlank = new URLSearchParams(window.location.search).get("blank") === "1";
      if (startBlank) {
        setSlides([BLANK_SLIDE]);
        setTitle("Untitled presentation");
        setTheme("light");
        setCanvasDataBySlide({});
        setSlideBackgrounds({ 1: "#ffffff" });
        setSlideAnimations({});
        setActiveId(1);
        setLocalSaveState("New blank slide");
      } else {
        const saved = localStorage.getItem("slideai-studio-local-project-v1");
        if (saved) {
          const parsed = JSON.parse(saved) as { title?: string; theme?: "violet" | "blue" | "light"; slides?: Slide[]; canvasDataBySlide?: Record<number,string>; slideBackgrounds?: Record<number,string>; slideAnimations?: Record<number,string>; textBorderEnabled?: boolean; textBorderWidth?: number };
          if (Array.isArray(parsed.slides) && parsed.slides.length) {
            const validation = validateDeck({ ...sampleDeck, title: parsed.title || sampleDeck.title, theme: parsed.theme || "violet", slides: parsed.slides });
            if (validation.success) {
              setSlides(validation.data.slides);
              setTitle(parsed.title || sampleDeck.title);
              setTheme(parsed.theme || "violet");
              setCanvasDataBySlide(parsed.canvasDataBySlide || {});
              setSlideBackgrounds(parsed.slideBackgrounds || {});
              setSlideAnimations(parsed.slideAnimations || {});
              setTextBorderEnabled(parsed.textBorderEnabled ?? false);
              setTextBorderWidth(parsed.textBorderWidth ?? 1);
              setActiveId(validation.data.slides[0].id);
            }
          }
        }
        setLocalSaveState("Saved locally");
      }
    } catch {
      setLocalSaveState("Local restore unavailable");
    } finally {
      setIsRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    try {
      localStorage.setItem("slideai-studio-local-project-v1", JSON.stringify({ title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations, textBorderEnabled, textBorderWidth }));
      setLocalSaveState("Saved locally");
    } catch {
      setLocalSaveState("Export project to keep a backup");
    }
  }, [isRestored, title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations, textBorderEnabled, textBorderWidth]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fonts").then((response) => { if (!response.ok) throw new Error("Google Fonts kataloğu alınamadı"); return response.json(); }).then((data: {families?: string[];weightsByFamily?:Record<string,number[]>}) => { if (!cancelled && data.families?.length) { setFontCatalog(data.families); setFontWeightsByFamily(data.weightsByFamily??{}); setFontCatalogStatus(`${data.families.length.toLocaleString()} Google Fonts ailesi`); } }).catch(() => { if (!cancelled) { setFontCatalog(["Arimo","Archivo","Bebas Neue","Caveat","DM Sans","Inter","Lora","Manrope","Merriweather","Montserrat","Noto Sans","Open Sans","Oswald","Outfit","Playfair Display","Poppins","Roboto","Source Sans 3","Space Grotesk"]); setFontCatalogStatus("Çevrimdışı katalog · Google Fonts CDN"); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    slideAnimationControls.set(slideMotion.initial);
    void slideAnimationControls.start({ ...slideMotion.animate, transition: slideMotion.transition });
  }, [activeId, activeSlideAnimation, isPlaying, slideAnimationControls, slideMotion]);

  useEffect(() => {
    if (isPlaying) setCanvasCommand((current) => ({ action: "play-slide-animations", token: current.token + 1 }));
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const index = slides.findIndex((slide) => slide.id === activeId);
    const playbackWindow=Math.min(5200,Math.max(2800,1450+layers.length*82));
    const timer = window.setTimeout(() => { if (index >= slides.length - 1) setIsPlaying(false); else setActiveId(slides[index + 1].id); }, playbackWindow);
    return () => window.clearTimeout(timer);
  }, [isPlaying, activeId, slides, layers.length]);

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
    const next: Slide = { id, title: " ", eyebrow: "", body: "", kind: "content", layout: "title-and-body", elements: [] };
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
    setCanvasDataBySlide((current) => current[activeId] === json ? current : ({ ...current, [activeId]: json }));
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
    const project = { format: "slideai-studio-project", version: 1, schemaVersion: "1.0", exportedAt: new Date().toISOString(), title, theme, slides, canvasDataBySlide, slideBackgrounds, slideAnimations, textBorderEnabled, textBorderWidth,
    };
    return new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  }
  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportProject() {
    downloadBlob(buildProjectBlob(), `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slideai-project"}.slideai.json`);
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
    try {
      const response = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, theme, slides, slideBackgrounds, canvasDataBySlide }),
      });
      if (!response.ok) {
        const message = await response.text();
        window.alert(message || "PowerPoint dosyası oluşturulamadı.");
        return;
      }
      const blob = await response.blob();
      downloadBlob(blob, `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slideai-presentation"}.pptx`);
    } catch (error) {
      console.error("PowerPoint export failed", error);
      window.alert("PowerPoint dışa aktarma işlemi tamamlanamadı. Bağlantıyı kontrol edip tekrar deneyin.");
    }
  }

  function exportSlidePng() {
    const source = document.querySelector<HTMLCanvasElement>(".design-canvas-shell .lower-canvas");
    if (!source || source.width === 0 || source.height === 0) { window.alert("Tuval henüz hazır değil."); return; }
    try {
      const output = document.createElement("canvas");
      output.width = source.width * 2;
      output.height = source.height * 2;
      const context = output.getContext("2d");
      if (!context) throw new Error("PNG canvas context unavailable");
      context.drawImage(source, 0, 0, output.width, output.height);
      const anchor = document.createElement("a");
      anchor.href = output.toDataURL("image/png");
      anchor.download = `${title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slide"}-${activeId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("PNG export failed", error);
      window.alert("PNG oluşturulamadı. Harici görselin güvenlik kısıtlamasını veya tuvalin hazır olmasını kontrol edin.");
    }
  }

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <Link className="studio-back" href="/"><ArrowLeft size={16} /><span>Back to workspace</span></Link>
        <div className="studio-doc-title"><span className="doc-icon"><LayoutTemplate size={15} /></span><span>{title}</span><span className="saved-pill"><Check size={12} /> {localSaveState}</span></div>
        <div className="studio-top-actions"><button className="share-button" onClick={() => void shareProject()}>Share <ArrowUpRight size={14}/></button><div className="export-menu-wrap"><button className="export-button" onClick={() => setExportMenuOpen((open) => !open)}><Download size={14}/> Export <ChevronDown size={13}/></button>{exportMenuOpen && <div className="export-menu"><button onClick={() => { exportProject(); setExportMenuOpen(false); }}><Download size={14}/> Editable project (.json)</button><button onClick={() => { exportSlidePng(); setExportMenuOpen(false); }}><ImagePlus size={14}/> Current slide (.png)</button><button onClick={() => { void exportPowerPoint(); setExportMenuOpen(false); }}><Download size={14}/> PowerPoint (.pptx)</button></div>}</div></div>
      </header>

      <div className="studio-body">
        <aside className="left-tools-panel">
          <div className="left-panel-heading"><div><strong>Editor tools</strong><small>Organize and refine your slide</small></div><span className="left-panel-count">{layers.length} layers</span></div>
          <nav className="left-panel-tabs" aria-label="Editor panels">
            <button className={leftPanelTab==="layers"?"active":""} onClick={()=>setLeftPanelTab("layers")}><Layers3 size={14}/> Layers</button>
            <button className={leftPanelTab==="arrange"?"active":""} onClick={()=>setLeftPanelTab("arrange")}><Grid3X3 size={14}/> Arrange</button>
            <button className={leftPanelTab==="animations"?"active":""} onClick={()=>setLeftPanelTab("animations")}><Play size={14}/> Motion</button>
          </nav>
          {leftPanelTab==="layers"&&<div className="left-panel-content">
            <div className="panel-section-title"><div><strong>Layers</strong><small>Top items appear first</small></div><span>{layers.length}</span></div>
            <div className="layer-action-row">
              <button onClick={()=>issueCanvasCommand("group")} disabled={selectedObjectType!=="activeselection"} title="Group selected objects"><Group size={14}/> Group</button>
              <button onClick={()=>issueCanvasCommand("ungroup")} disabled={selectedObjectType!=="group"} title="Ungroup selected group"><Ungroup size={14}/> Ungroup</button>
            </div>
            {layers.length===0?<div className="left-empty-state"><Layers3 size={22}/><strong>No layers yet</strong><span>Add text, shapes or images to see them listed here.</span></div>:<div className="layer-list">{layers.map(layer=><div key={layer.id} className={"layer-row "+(layer.active?"active":"")} draggable onDragStart={event=>{event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",String(layer.index));}} onDragOver={event=>{event.preventDefault();event.dataTransfer.dropEffect="move";}} onDrop={event=>{event.preventDefault();const from=Number(event.dataTransfer.getData("text/plain"));if(Number.isInteger(from)&&from!==layer.index)issueCanvasCommand(`reorder-layer:${from}:${layer.index}`);}} title="Drag to reorder layers">
              <button className="layer-select" onClick={()=>issueCanvasCommand("select-layer:"+layer.index)} title={"Select "+layer.name}><span className="layer-type-icon"><span className="layer-drag-grip">⠿</span>{layer.type==="image"?"▧":layer.type.includes("text")?"T":"◇"}</span><span><strong>{layer.name}</strong><small>{layer.type}</small></span></button>
              <button className="layer-utility" onClick={()=>issueCanvasCommand("layer-up:"+layer.index)} title="Move layer up"><MoveUp size={13}/></button>
              <button className="layer-utility" onClick={()=>issueCanvasCommand("layer-down:"+layer.index)} title="Move layer down"><MoveDown size={13}/></button>
              <button className="layer-utility" onClick={()=>issueCanvasCommand("toggle-visible:"+layer.index)} title={layer.visible?"Hide layer":"Show layer"}>{layer.visible?<Eye size={13}/>:<EyeOff size={13}/>}</button>
              <button className="layer-utility" onClick={()=>issueCanvasCommand("toggle-lock:"+layer.index)} title={layer.locked?"Unlock layer":"Lock layer"}>{layer.locked?<Lock size={13}/>:<Unlock size={13}/>}</button>
            </div>)}</div>}
            <p className="left-panel-hint">Shift + click on the canvas to select multiple objects, then group them.</p>
          </div>}
          {leftPanelTab==="arrange"&&<div className="left-panel-content">
            <div className="panel-section-title"><div><strong>Align to slide</strong><small>Position the selected object precisely</small></div></div>
            <div className="align-control-grid">
              <button onClick={()=>issueCanvasCommand("align:left")} disabled={!hasSelection}><AlignLeft size={15}/><span>Left</span></button>
              <button onClick={()=>issueCanvasCommand("align:center-x")} disabled={!hasSelection}><AlignCenter size={15}/><span>Center</span></button>
              <button onClick={()=>issueCanvasCommand("align:right")} disabled={!hasSelection}><AlignRight size={15}/><span>Right</span></button>
              <button onClick={()=>issueCanvasCommand("align:top")} disabled={!hasSelection}>Top</button>
              <button onClick={()=>issueCanvasCommand("align:center-y")} disabled={!hasSelection}>Middle</button>
              <button onClick={()=>issueCanvasCommand("align:bottom")} disabled={!hasSelection}>Bottom</button>
            </div>
            <div className="panel-section-title arrange-subtitle"><div><strong>Canvas helpers</strong><small>Guides and measurement tools</small></div></div>
            <label className="editor-toggle-row"><span><Ruler size={15}/> Rulers</span><input type="checkbox" checked={showRulers} onChange={event=>setShowRulers(event.target.checked)}/></label>
            <label className="editor-toggle-row"><span><Grid3X3 size={15}/> Center guides</span><input type="checkbox" checked={showGuides} onChange={event=>setShowGuides(event.target.checked)}/></label>
            <label className="editor-toggle-row"><span><AlignCenter size={15}/> Smart snapping</span><input type="checkbox" checked={snapToGuides} onChange={event=>setSnapToGuides(event.target.checked)}/></label>
            <p className="left-panel-hint">Objects snap to slide edges, center lines and custom guides. Click a ruler to add a guide; double-click a ruler to clear guides. Coordinates use the 1280 × 720 slide grid.</p>
          </div>}
          {leftPanelTab==="animations"&&<div className="left-panel-content motion-tab-content">
            <div className="chat-context"><span className="context-dot"/> SELECT ANIMATION · PREVIEW ON SLIDE</div>
            <div className="animation-library-content">
              <p className="animation-library-intro">Her efekt farklı bir hareket dili kullanır. Seçtiğinde slaytta önizlemesini görür, sunum oynatımında tekrar çalıştırırsın.</p>
              {!hasSelection?<div className="animation-empty-state"><MousePointer2 size={22}/><strong>Henüz nesne seçilmedi</strong><span>Animasyon uygulamak için slayttaki bir metne, şekle veya görsele tıkla.</span></div>:(()=>{
                const isText=["textbox","i-text","text"].includes(selectedObjectType.toLowerCase());
                const presets=isText?TEXT_OBJECT_ANIMATIONS:ELEMENT_ANIMATIONS;
                const categories=["All","Entrance","Reveal","Movement","Emphasis","Distortion"];
                const categoryFor=(preset:string)=>{if(["Typewriter","Tracking reveal","Soft focus","Focus in","Slide reveal"].includes(preset))return "Reveal";if(["Pulse","Shake","Rubber band","Swing","Wave","Bounce","Elastic"].includes(preset))return "Emphasis";if(["Rise up","Slide from left","Slide from right","Arc in","Drop in","Whip pan","Orbit in","Float up","Drift"].includes(preset))return "Movement";if(["Glitch","Flip X","Flip Y","Flip horizontal","Flip vertical","Stretch","Jelly"].includes(preset))return "Distortion";return "Entrance";};
                const descriptions:Record<string,string>={"Fade in":"Şeffaflıktan net görünüme geçer","Typewriter":"Metni karakter karakter yazar","Rise up":"Aşağıdan yukarı yükselir","Slide from left":"Soldan sahneye kayar","Slide from right":"Sağdan sahneye kayar","Zoom in":"Küçük başlayıp yerine oturur","Spin in":"Dönerek ve büyüyerek girer","Arc in":"Kavisli bir yol izleyerek gelir","Drop in":"Yukarıdan düşüp yerine oturur","Swing":"Dönüş ekseninde salınır","Pulse":"Bir kez büyüyüp normale döner","Shake":"Kısa yatay sarsıntı yapar","Glitch":"Dijital kırılma ve sıçrama efekti","Tracking reveal":"Harf aralığı kapanarak belirir","Flip X":"Yatay eksende çevrilir","Flip Y":"Dikey eksende çevrilir","Whip pan":"Hızlı yatay hareketle girer","Orbit in":"Dönerek kavisli yörüngeden gelir","Rubber band":"Genişleyip sıkışarak esner"};
                const filtered=presets.filter(preset=>animationCategory==="All"||categoryFor(preset)===animationCategory);
                return <><div className="animation-target-label"><span>{isText?"TEXT ANIMATIONS":"ELEMENT ANIMATIONS"}</span><small>{selectedObjectType}</small></div>
                  <div className="animation-category-list">{categories.map(category=><button key={category} className={animationCategory===category?"active":""} onClick={()=>setAnimationCategory(category)}>{category}</button>)}</div>
                  <div className="animation-preset-list">{filtered.map((preset,index)=><button key={preset} className={selectedAnimationPreset===preset?"animation-preset-card selected":"animation-preset-card"} onClick={()=>{setSelectedAnimationPreset(preset);issueCanvasCommand("apply-animation:"+(isText?"text":"element")+":"+preset);}}><span className="animation-preset-index">{String(index+1).padStart(2,"0")}</span><span className="animation-preset-copy"><strong>{preset}</strong><small>{descriptions[preset]??categoryFor(preset)}</small></span><span className="animation-preset-check">{selectedAnimationPreset===preset?"✓":"＋"}</span></button>)}</div>
                  {selectedAnimationPreset&&<p className="inspector-hint">“{selectedAnimationPreset}” seçili nesneye kaydedildi.</p>}</>;
              })()}
            </div>
          </div>}
        </aside>

        <section className="editor-main">
          <div className="editor-toolbar editor-toolbar-advanced">
            <div className="toolbar-left toolbar-tools">
              <span className="toolbar-label">SLIDE {String(slides.findIndex((slide) => slide.id === activeId) + 1).padStart(2,"0")} <i>/ {String(slides.length).padStart(2,"0")}</i></span>
              <span className="toolbar-divider"/>
              <button className="tool-button" onClick={() => issueCanvasCommand("undo")} disabled={!canUndo} title="Undo"><Undo2 size={15}/></button>
              <button className="tool-button" onClick={() => issueCanvasCommand("redo")} disabled={!canRedo} title="Redo"><Redo2 size={15}/></button>
              <button className="tool-button asset-launch-button" onClick={() => {setAssetLibraryCategory("All assets");setAssetLibraryOpen(true);}} title="Open asset library"><ImagePlus size={15}/><span>Assets</span></button>
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
              <motion.div className="canvas-motion-frame" style={{transformPerspective:1200}} initial={false} animate={slideAnimationControls}>
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
                textBorderEnabled={textBorderEnabled}
                textBorderWidth={textBorderWidth}
                showRulers={showRulers}
                showGuides={showGuides}
                snapToGuides={snapToGuides}
                onLayersChange={setLayers}
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
                onSelectionChange={(selected, type, typography, animationPreset) => {setHasSelection(selected);setSelectedObjectType(type??"");setSelectedAnimationPreset(animationPreset??"");if(typography){if(typography.fontFamily)setFontFamily(typography.fontFamily);if(typography.fontSize)setFontSize(typography.fontSize);if(typography.fontWeight)setFontWeight(String(typography.fontWeight));if(typography.charSpacing!==undefined)setLetterSpacing(typography.charSpacing);if(typography.lineHeight!==undefined)setLineHeight(Math.round(typography.lineHeight*100));}}}
                command={canvasCommand}
                assetCommand={assetCommand}
                imageCommand={imageCommand}
                onHistoryChange={(undo, redo) => { setCanUndo(undo); setCanRedo(redo); }}
                onReady={() => { if (isPlaying) issueCanvasCommand("play-slide-animations"); }}
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
            <div className="background-mode-switch"><button className={!backgroundColor.startsWith("gradient:")?"active":""} onClick={()=>setSlideBackgrounds((current)=>({...current,[activeId]:backgroundColor.startsWith("gradient:")?(theme==="light"?"#ffffff":theme==="blue"?"#102333":"#171525"):backgroundColor}))}>Solid</button><button className={backgroundColor.startsWith("gradient:")?"active":""} onClick={()=>setSlideBackgrounds((current)=>({...current,[activeId]:current[activeId]?.startsWith("gradient:")?current[activeId]:"gradient:#8b5cf6,#22d3ee"}))}>Gradient</button></div>
            {!backgroundColor.startsWith("gradient:") ? <div className="color-control-row"><label>Background <input type="color" value={backgroundColor} onChange={(event)=>setSlideBackgrounds((current)=>({...current,[activeId]:event.target.value}))}/></label></div> : <div className="gradient-editor"><div className="gradient-preview" style={{backgroundImage:`linear-gradient(90deg,${backgroundColor.slice(9).split(",").join(",")})`}}/><div className="gradient-palette">{["#8b5cf6","#22d3ee","#ec4899","#f97316","#facc15","#22c55e","#2563eb","#f8fafc","#111827","#ef4444","#a3e635","#14b8a6"].map((color)=><button key={color} className={backgroundColor.slice(9).split(",").includes(color)?"selected":""} style={{backgroundColor:color}} title={color} onClick={()=>setSlideBackgrounds((current)=>{const chosen=(current[activeId]?.startsWith("gradient:")?current[activeId].slice(9).split(","):["#8b5cf6","#22d3ee"]).filter(Boolean);const next=chosen.includes(color)?chosen.filter((item)=>item!==color):chosen.length<3?[...chosen,color]:[...chosen.slice(1),color];return {...current,[activeId]:`gradient:${next.length>=2?next.join(","):"#8b5cf6,#22d3ee"}`};})}/>)}</div><small>Paletten 2 veya 3 renk seç. En fazla 3 renk kullanılabilir.</small></div>}
            <button className="quick-action background-reset" onClick={()=>setSlideBackgrounds((current)=>{const next={...current};delete next[activeId];return next;})}>Reset background</button>
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
            <div className="color-control-row typography-color-row"><label>Text color <input type="color" value={fill} onChange={(event)=>setFill(event.target.value)}/></label></div>
            <label className="range-label">Font weight <span>{fontWeight}</span></label><select className="inspector-input" value={fontWeight} onChange={(event) => setFontWeight(event.target.value)}>{fontWeights.map((weight)=><option key={weight} value={String(weight)}>{weight===100?"Thin":weight===200?"Extra light":weight===300?"Light":weight===400?"Regular":weight===500?"Medium":weight===600?"Semi bold":weight===700?"Bold":weight===800?"Extra bold":weight===900?"Black":`Weight ${weight}`} {weight}</option>)}</select>
            <label className="range-label">Font size <span>{fontSize}px</span></label><input className="range-control" type="range" min="12" max="100" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}/>
            <div className="text-format-toolbar" aria-label="Text formatting">
              <button onClick={()=>issueCanvasCommand("text-style:bold")} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())} title="Toggle bold"><strong>B</strong></button>
              <button onClick={()=>issueCanvasCommand("text-style:italic")} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())} title="Toggle italic"><em>I</em></button>
              <button onClick={()=>issueCanvasCommand("text-style:underline")} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())} title="Toggle underline"><u>U</u></button>
              <button onClick={()=>issueCanvasCommand("text-style:strike")} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())} title="Toggle strikethrough"><s>S</s></button>
              <button onClick={()=>issueCanvasCommand("text-align:left")} disabled={!hasSelection} title="Align left"><AlignLeft size={14}/></button>
              <button onClick={()=>issueCanvasCommand("text-align:center")} disabled={!hasSelection} title="Align center"><AlignCenter size={14}/></button>
              <button onClick={()=>issueCanvasCommand("text-align:right")} disabled={!hasSelection} title="Align right"><AlignRight size={14}/></button>
            </div>
            <label className="range-label">Letter spacing <span>{letterSpacing}</span></label><input className="range-control" type="range" min="0" max="300" step="10" value={letterSpacing} onChange={event=>{const value=Number(event.target.value);setLetterSpacing(value);issueCanvasCommand("text-spacing:"+value);}} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())}/>
            <label className="range-label">Line height <span>{(lineHeight/100).toFixed(2)}</span></label><input className="range-control" type="range" min="80" max="220" step="5" value={lineHeight} onChange={event=>{const value=Number(event.target.value);setLineHeight(value);issueCanvasCommand("line-height:"+(value/100));}} disabled={!hasSelection||!["textbox","i-text","text"].includes(selectedObjectType.toLowerCase())}/>
            <label className="text-border-toggle"><input type="checkbox" checked={textBorderEnabled} onChange={(event) => setTextBorderEnabled(event.target.checked)}/> Add text border</label>
            <label className="range-label">Text border size <span>{textBorderWidth}px</span></label><input className="range-control" type="range" min="1" max="12" value={textBorderWidth} onChange={(event) => setTextBorderWidth(Number(event.target.value))} disabled={!textBorderEnabled}/>
          </div>
          <div className="inspector-section motion-library-section">
            <div className="inspector-label">SLIDE TRANSITION <span>10 STYLES</span></div>
            <select className="inspector-input" value={activeSlideAnimation} onChange={(event) => setSlideAnimations((current) => ({...current,[activeId]:event.target.value}))}>{SLIDE_ANIMATIONS.map((name) => <option key={name}>{name}</option>)}</select>
            <p className="inspector-hint">Slayt geçişi sunum önizlemesinde uygulanır. Ayrı animasyon katmanları için Motion Library&apos;yi kullan.</p>
            <p className="inspector-hint">Metin ve öğe animasyonlarını sol taraftaki Object animations panelinden seçip önizleyebilirsin.</p>
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
      {assetLibraryOpen && <AssetLibrary initialCategory={assetLibraryCategory} onClose={() => setAssetLibraryOpen(false)} onChoose={(asset: StudioAsset) => { setAssetCommand((current) => ({ symbol: asset.symbol, label: asset.label, imageUrl: asset.imageUrl, fontFamily: asset.fontFamily, animated: asset.animated, token: current.token + 1 })); setAssetLibraryOpen(false); setTool("select"); }} />}
    </main>
  );
}
