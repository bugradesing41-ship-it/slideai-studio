"use client";

/* Fabric's canvas event payloads are intentionally dynamic at this integration boundary. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";

declare module "fabric" {
  interface FabricObject {
    name?: string;
    animationPreset?: string;
  }
  interface SerializedObjectProps {
    name?: string;
    animationPreset?: string;
  }
}

type Tool = "select" | "draw" | "rect" | "circle" | "triangle" | "line" | "arrow" | "star" | "diamond" | "hexagon" | "pentagon" | "heart" | "speech" | "text";
type CanvasCommand = { action: string; token: number };
type AssetCommand = { symbol: string; label: string; imageUrl?: string; fontFamily?: string; token: number };
type ImageCommand = { dataUrl: string; name: string; token: number };
type Props = {
  slideId: number;
  slideNumber: string;
  title: string;
  eyebrow: string;
  body: string;
  theme: "violet" | "blue" | "light";
  tool: Tool;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontFamily: string;
  fontWeights: number[];
  fontSize: number;
  fontWeight: number;
  cornerRadius: number;
  backgroundColor: string;
  shadowEnabled: boolean;
  opacity: number;
  initialData?: string;
  onChange: (json: string) => void;
  onSelectionChange: (selected: boolean, objectType?: string, typography?: {fontFamily?:string;fontSize?:number;fontWeight?:number}) => void;
  onTextChange: (name: string, value: string) => void;
  command: CanvasCommand;
  assetCommand: AssetCommand;
  imageCommand: ImageCommand;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
};

export type { Tool };

async function loadGoogleFont(family:string, weights:number[], weight:number|string=400, size=32):Promise<boolean> {
  if (!family.trim()) return false;
  const safeFamily=family.trim().replace(/\s+Variable$/i,"");
  const supportedWeights=weights.length?weights:[400];
  const id=`slideai-google-font-${safeFamily.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${supportedWeights.join("-")}`;
  let link=document.getElementById(id) as HTMLLinkElement|null;
  if(!link){
    link=document.createElement("link");link.id=id;link.rel="stylesheet";
    link.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(safeFamily).replace(/%20/g,"+")}:wght@${supportedWeights.join(";")}&display=swap`;
    const ready=new Promise<void>((resolve)=>{link!.addEventListener("load",()=>resolve(),{once:true});link!.addEventListener("error",()=>resolve(),{once:true});window.setTimeout(resolve,4500);});
    document.head.appendChild(link);
    await ready;
  }
  try { const faces=await document.fonts.load(`${weight} ${size}px "${safeFamily}"`,"SlideAI Studio ÇĞİÖŞÜ çğıöşü Aa 123");await document.fonts.ready;return faces.length>0; }
  catch { return false; }
}

export default function DesignCanvas({
  slideId, slideNumber, title, eyebrow, body, theme, tool, fill, stroke, strokeWidth,
  fontFamily, fontWeights, fontSize, fontWeight, cornerRadius, backgroundColor, shadowEnabled, opacity, initialData, onChange, onSelectionChange, onTextChange, command, assetCommand, imageCommand, onHistoryChange
}: Props) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<any>(null);
  const historyRef = useRef<{ items: string[]; index: number }>({ items: [], index: -1 });
  const restoringRef = useRef(false);
  const latestRef = useRef({ title, slideNumber, eyebrow, body, theme, tool, fill, stroke, strokeWidth, fontFamily, fontWeights, fontSize, fontWeight, cornerRadius, shadowEnabled, opacity, initialData, onChange, onSelectionChange, onTextChange, command, assetCommand, imageCommand, onHistoryChange });
  latestRef.current = { title, slideNumber, eyebrow, body, theme, tool, fill, stroke, strokeWidth, fontFamily, fontWeights, fontSize, fontWeight, cornerRadius, backgroundColor, shadowEnabled, opacity, initialData, onChange, onSelectionChange, onTextChange, command, assetCommand, imageCommand, onHistoryChange };

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    historyRef.current = { items: [], index: -1 };

    async function mount() {
      const fabric = await import("fabric");
      fabric.FabricObject.customProperties = ["name", "animationPreset"];
      if (disposed || !elementRef.current) return;
      await loadGoogleFont(latestRef.current.fontFamily, latestRef.current.fontWeights, latestRef.current.fontWeight, latestRef.current.fontSize);
      const canvas = new fabric.Canvas(elementRef.current, {
        width: 1280,
        height: 720,
        backgroundColor: latestRef.current.backgroundColor,
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: false,
      });
      canvasRef.current = canvas;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

      const save = () => {
        const json = JSON.stringify(canvas.toObject(["name", "animationPreset"]));
        if (restoringRef.current) return;
        latestRef.current.onChange(json);
        const current = historyRef.current;
        if (current.items[current.index] === json) return;
        const items = [...current.items.slice(0, current.index + 1), json].slice(-60);
        historyRef.current = { items, index: items.length - 1 };
        latestRef.current.onHistoryChange(items.length > 1, false);
      };
      const selection = () => {
        const active = canvas.getActiveObject();
        const rawWeight = active?.get("fontWeight");
        const parsedWeight = typeof rawWeight === "number" ? rawWeight : rawWeight === "bold" ? 700 : rawWeight === "normal" ? 400 : Number(rawWeight ?? 400);
        const typography = active && "fontFamily" in active ? { fontFamily:String(active.get("fontFamily") ?? "").replace(/\s+Variable$/i,""), fontSize:Number(active.get("fontSize") ?? 0), fontWeight:Number.isFinite(parsedWeight) ? parsedWeight : 400 } : undefined;
        latestRef.current.onSelectionChange(Boolean(active), active?.type ?? "", typography);
        if (active && latestRef.current.cornerRadius > 0) {
          void import("fabric").then(({ Rect }) => {
            if (!canvasRef.current || canvas.getActiveObject() !== active) return;
            const width = Math.max(1, active.width ?? 1);
            const height = Math.max(1, active.height ?? 1);
            active.set({ clipPath: new Rect({ width, height, rx: Math.min(latestRef.current.cornerRadius,width/2), ry: Math.min(latestRef.current.cornerRadius,height/2), originX:"center", originY:"center" }), rx:latestRef.current.cornerRadius, ry:latestRef.current.cornerRadius });
            canvas.requestRenderAll();
            save();
          });
        }
      };
      const syncText = () => {
        const current = latestRef.current;
        const titleObject = canvas.getObjects().find((object: any) => object.name === "slide-title");
        const eyebrowObject = canvas.getObjects().find((object: any) => object.name === "slide-eyebrow");
        const bodyObject = canvas.getObjects().find((object: any) => object.name === "slide-body");
        let numberObject = canvas.getObjects().find((object: any) => object.name === "slide-number");
        if (!numberObject) { numberObject = new fabric.Textbox(current.slideNumber, { name:"slide-number", left:1050, top:650, width:150, fontSize:14, fontFamily:"Inter Variable", fontWeight:600, textAlign:"right", fill:current.theme === "light" ? "#777287" : "#aaa3c4", selectable:false, evented:false }); canvas.add(numberObject); }
        numberObject.set({ text:current.slideNumber, fill:current.theme === "light" ? "#777287" : "#aaa3c4" });
        if (titleObject) titleObject.set("text", current.title);
        if (eyebrowObject) eyebrowObject.set("text", current.eyebrow);
        if (bodyObject) bodyObject.set("text", current.body);
        canvas.backgroundColor = current.backgroundColor;
        canvas.requestRenderAll();
        save();
      };

      if (latestRef.current.initialData) {
        try {
          await canvas.loadFromJSON(JSON.parse(latestRef.current.initialData));
        } catch {
          canvas.clear();
        }
      }
      if (canvas.getObjects().length === 0) {
        const current = latestRef.current;
        const light = current.theme === "light";
        canvas.add(
          new fabric.Textbox(current.eyebrow || "FIELD NOTES / 2026", {
            name: "slide-eyebrow", left: 84, top: 115, width: 900, fontSize: 18,
            fontFamily: "DM Sans", fontWeight: 600, charSpacing: 190,
            fill: light ? "#7558bc" : current.theme === "blue" ? "#8bc7e7" : "#b39bff",
            editable: true,
          }),
          new fabric.Textbox(current.title || "Your presentation starts here", {
            name: "slide-title", left: 80, top: 205, width: 1030, height: 190,
            fontSize: 66, fontFamily: "Manrope", fontWeight: 600,
            lineHeight: 1.05, fill: light ? "#252333" : "#f4f1ff",
            editable: true,
          }),
          new fabric.Textbox(current.body || "Add a clear supporting message to make your story memorable.", {
            name: "slide-body", left: 84, top: 440, width: 800, height: 110,
            fontSize: 25, fontFamily: "DM Sans", fontWeight: 400, lineHeight: 1.35,
            fill: light ? "#666174" : "#bcb8cd", editable: true,
          }),
          new fabric.Textbox("THINK CLEARLY. CREATE BOLDLY.", {
            name: "slide-footer", left: 84, top: 650, width: 700, fontSize: 12,
            fontFamily: "Inter", fontWeight: 600, charSpacing: 140,
            fill: light ? "#777287" : "#aaa3c4", selectable: false, evented: false,
          }),
          new fabric.Textbox(latestRef.current.slideNumber, { name:"slide-number", left:1050, top:650, width:150, fontSize:14, fontFamily:"Inter Variable", fontWeight:600, textAlign:"right", fill:light ? "#777287" : "#aaa3c4", selectable:false, evented:false })
        );
      } else {
        syncText();
      }

      canvas.on("object:modified", save);
      canvas.on("object:added", save);
      canvas.on("object:removed", save);
      canvas.on("text:changed", save);
      canvas.on("text:editing:exited", (event: any) => {
        const object = event.target;
        if (object?.name && typeof object.text === "string") {
          latestRef.current.onTextChange(object.name, object.text);
        }
        save();
      });
      canvas.on("selection:created", selection);
      canvas.on("selection:updated", selection);
      canvas.on("selection:cleared", selection);
      let drawingShape: any = null;
      let drawStart: { x: number; y: number } | null = null;

      canvas.on("mouse:down", (event: any) => {
        const currentTool = latestRef.current.tool;
        if (event.target != null && currentTool === "select") return;
        const pointer = canvas.getPointer(event.e);
        if (currentTool === "text") {
          const text = new fabric.IText("Double-click to edit", { left: pointer.x, top: pointer.y, fontFamily: latestRef.current.fontFamily, fontSize: latestRef.current.fontSize, fontWeight: latestRef.current.fontWeight, fill: latestRef.current.fill, opacity: latestRef.current.opacity, shadow: latestRef.current.shadowEnabled ? new fabric.Shadow({ color: "rgba(0,0,0,0.32)", blur: 24, offsetX: 8, offsetY: 12 }) : undefined, editable: true });
          canvas.add(text); canvas.setActiveObject(text); text.enterEditing(); canvas.requestRenderAll(); save();
          return;
        }
        if (!["rect", "circle", "triangle", "star", "diamond", "hexagon", "pentagon", "heart", "speech", "line", "arrow"].includes(currentTool)) return;

        drawStart = { x: pointer.x, y: pointer.y };
        const style = { fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth, opacity: latestRef.current.opacity, shadow: latestRef.current.shadowEnabled ? new fabric.Shadow({ color: "rgba(0,0,0,0.32)", blur: 24, offsetX: 8, offsetY: 12 }) : undefined };
        if (currentTool === "rect") drawingShape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 1, height: 1, rx: latestRef.current.cornerRadius, ry: latestRef.current.cornerRadius, ...style });
        if (currentTool === "circle") drawingShape = new fabric.Ellipse({ left: pointer.x, top: pointer.y, rx: 1, ry: 1, ...style });
        if (currentTool === "triangle") drawingShape = new fabric.Triangle({ left: pointer.x, top: pointer.y, width: 1, height: 1, ...style });
        if (currentTool === "star") {
          const points = Array.from({ length: 10 }, (_, index) => {
            const radius = index % 2 === 0 ? 68 : 30;
            const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2;
            return { x: 70 + Math.cos(angle) * radius, y: 70 + Math.sin(angle) * radius };
          });
          drawingShape = new fabric.Polygon(points, { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, ...style });
        }
        if (["diamond", "hexagon", "pentagon"].includes(currentTool)) {
          const sides = currentTool === "hexagon" ? 6 : 5;
          const polygonPoints = Array.from({ length: sides }, (_, index) => {
            const angle = (Math.PI * 2 * index) / sides - Math.PI / 2;
            return { x: 70 + Math.cos(angle) * 70, y: 70 + Math.sin(angle) * 70 };
          });
          const points = currentTool === "diamond" ? [{x:70,y:0},{x:140,y:70},{x:70,y:140},{x:0,y:70}] : polygonPoints;
          drawingShape = new fabric.Polygon(points, { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, ...style });
        }
        if (currentTool === "speech") {
          drawingShape = new fabric.Path("M 14 8 Q 14 0 24 0 L 116 0 Q 126 0 126 10 L 126 82 Q 126 92 116 92 L 66 92 L 42 122 L 46 92 L 24 92 Q 14 92 14 82 Z", { left:pointer.x, top:pointer.y, scaleX:.01, scaleY:.01, ...style });
        }
        if (currentTool === "heart") {
          drawingShape = new fabric.Path("M 70 128 C 54 112 8 80 8 43 C 8 4 57 -8 70 28 C 83 -8 132 4 132 43 C 132 80 86 112 70 128 Z", { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, ...style });
        }
        if (currentTool === "line") drawingShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke: latestRef.current.stroke, strokeWidth: Math.max(2, latestRef.current.strokeWidth), opacity: latestRef.current.opacity });
        if (currentTool === "arrow") {
          drawingShape = new fabric.Group([
            new fabric.Line([0, 15, 150, 15], { stroke: latestRef.current.stroke, strokeWidth: Math.max(3, latestRef.current.strokeWidth) }),
            new fabric.Triangle({ left: 138, top: 3, width: 25, height: 25, angle: 90, fill: latestRef.current.stroke })
          ], { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, opacity: latestRef.current.opacity, shadow: latestRef.current.shadowEnabled ? new fabric.Shadow({ color: "rgba(0,0,0,0.32)", blur: 24, offsetX: 8, offsetY: 12 }) : undefined });
        }
        if (drawingShape) {
          canvas.selection = false;
          restoringRef.current = true;
          canvas.add(drawingShape);
          restoringRef.current = false;
          canvas.setActiveObject(drawingShape);
          canvas.requestRenderAll();
        }
      });

      canvas.on("mouse:move", (event: any) => {
        if (!drawingShape || !drawStart) return;
        const pointer = canvas.getPointer(event.e);
        const left = Math.min(drawStart.x, pointer.x);
        const top = Math.min(drawStart.y, pointer.y);
        const width = Math.max(1, Math.abs(pointer.x - drawStart.x));
        const height = Math.max(1, Math.abs(pointer.y - drawStart.y));
        const currentTool = latestRef.current.tool;
        if (currentTool === "rect" || currentTool === "triangle") drawingShape.set({ left, top, width, height });
        if (currentTool === "circle") drawingShape.set({ left, top, rx: width / 2, ry: height / 2 });
        if (["star", "diamond", "hexagon", "pentagon", "heart", "speech"].includes(currentTool)) drawingShape.set({ left, top, scaleX: width / 140, scaleY: height / 140 });
        if (currentTool === "line") drawingShape.set({ x1: drawStart.x, y1: drawStart.y, x2: pointer.x, y2: pointer.y });
        if (currentTool === "arrow") {
          drawingShape.set({ left, top, scaleX: width / 165, scaleY: Math.max(0.2, height / 30) });
        }
        drawingShape.setCoords();
        canvas.requestRenderAll();
      });

      canvas.on("mouse:up", () => {
        if (!drawingShape) return;
        canvas.selection = true;
        drawingShape.setCoords();
        drawingShape = null;
        drawStart = null;
        canvas.requestRenderAll();
        save();
      });

      canvas.isDrawingMode = latestRef.current.tool === "draw";
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = latestRef.current.stroke;
        canvas.freeDrawingBrush.width = Math.max(1, latestRef.current.strokeWidth);
      }
      save();
      cleanup = () => {
        canvas.dispose();
        canvasRef.current = null;
      };
    }

    void mount();
    return () => { disposed = true; cleanup?.(); };
  }, [slideId]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || command.token === 0) return;
    const action = command.action;
    if (action.startsWith("preview-animation:")) return;
    if (action === "undo" || action === "redo") {
      const history = historyRef.current;
      const nextIndex = action === "undo" ? history.index - 1 : history.index + 1;
      if (nextIndex < 0 || nextIndex >= history.items.length) return;
      history.index = nextIndex;
      const json = history.items[nextIndex];
      restoringRef.current = true;
      void canvas.loadFromJSON(JSON.parse(json)).then(() => {
        if (!canvasRef.current) return;
        canvas.requestRenderAll();
        restoringRef.current = false;
        latestRef.current.onChange(json);
        latestRef.current.onHistoryChange(history.index > 0, history.index < history.items.length - 1);
      });
      return;
    }

    const active = canvas.getActiveObject();
    if (!active) return;
    const recordCommand = () => {
      const json = JSON.stringify(canvas.toObject(["name", "animationPreset"]));
      latestRef.current.onChange(json);
      const current = historyRef.current;
      if (current.items[current.index] !== json) {
        const items = [...current.items.slice(0, current.index + 1), json].slice(-60);
        historyRef.current = { items, index: items.length - 1 };
        latestRef.current.onHistoryChange(items.length > 1, false);
      }
    };
    if (action.startsWith("effect:")) {
      const [,kind,preset] = action.split(":");
      const index = preset.split("-")[0];
      void import("fabric").then(({ Shadow: FabricShadow }) => {
        if (!canvasRef.current) return;
        const shadowMap: Record<string,{color:string;blur:number;offsetX:number;offsetY:number}> = {
          "0":{color:"rgba(0,0,0,.24)",blur:18,offsetX:0,offsetY:8},
          "1":{color:"rgba(0,0,0,.42)",blur:30,offsetX:4,offsetY:14},
          "2":{color:"#8b5cf6",blur:28,offsetX:0,offsetY:0},
          "3":{color:"#a78bfa",blur:36,offsetX:0,offsetY:0},
          "4":{color:"rgba(255,255,255,.22)",blur:16,offsetX:0,offsetY:4},
          "5":{color:"rgba(255,255,255,.35)",blur:24,offsetX:0,offsetY:5},
          "10":{color:"rgba(0,0,0,.22)",blur:5,offsetX:2,offsetY:3},
          "11":{color:"rgba(255,255,255,.35)",blur:4,offsetX:-2,offsetY:-2},
          "12":{color:"rgba(0,0,0,.35)",blur:20,offsetX:0,offsetY:10},
          "13":{color:"rgba(0,0,0,.3)",blur:0,offsetX:8,offsetY:8},
          "14":{color:"rgba(0,0,0,.16)",blur:26,offsetX:0,offsetY:12},
          "15":{color:"#c4b5fd",blur:18,offsetX:0,offsetY:0},
          "20":{color:"rgba(0,0,0,.3)",blur:0,offsetX:10,offsetY:10},
          "21":{color:"#fb923c",blur:22,offsetX:0,offsetY:0},
          "22":{color:"#67e8f9",blur:22,offsetX:0,offsetY:0}
        };
        const effectIndex = Number(index);
        const shadow = shadowMap[String(effectIndex)];
        const common: Record<string,any> = {};
        if (shadow) common.shadow = new FabricShadow(shadow);
        if (kind === "text") {
          if (effectIndex === 6) common.stroke = "#ffffff";
          if (effectIndex === 7) common.stroke = "#ffffff";
          if (effectIndex === 8) common.stroke = "#51456f";
          if (effectIndex === 9) common.charSpacing = 160;
          if (effectIndex === 10) common.fontWeight = "bold";
          if (effectIndex === 11) common.backgroundColor = "rgba(167,139,250,.18)";
          if (effectIndex === 12) common.backgroundColor = "rgba(255,255,255,.12)";
          if (effectIndex === 13) common.shadow = new FabricShadow({color:"#f97316",blur:0,offsetX:3,offsetY:3});
          if (effectIndex === 14) common.shadow = new FabricShadow({color:"#000000",blur:0,offsetX:4,offsetY:4});
          if (effectIndex === 15) common.shadow = new FabricShadow({color:"#cbd5e1",blur:4,offsetX:2,offsetY:2});
          if (effectIndex === 16) common.underline = true;
          if (effectIndex === 17) common.overline = true;
          if (effectIndex === 18) common.backgroundColor = "rgba(167,139,250,.28)";
          if (effectIndex === 19) common.shadow = new FabricShadow({color:"#000000",blur:22,offsetX:0,offsetY:4});
          if (effectIndex === 23) { common.stroke = "#ffffff"; common.strokeWidth = 1; }
          if (effectIndex === 24) common.fontStyle = "italic";
        } else {
          if (effectIndex === 6 || effectIndex === 7) { common.stroke = "#ffffff"; common.strokeWidth = effectIndex===7?5:3; }
          if (effectIndex === 8) common.strokeDashArray = [12,7];
          if (effectIndex === 9) common.strokeDashArray = [2,6];
          if (effectIndex === 16) common.opacity = .72;
          if (effectIndex === 17) common.opacity = .88;
          if (effectIndex === 18) common.opacity = .68;
          if (effectIndex === 19) common.opacity = .78;
          if (effectIndex === 20) common.opacity = 1;
          if (effectIndex === 21) common.opacity = .5;
          if (effectIndex === 22) common.shadow = new FabricShadow({color:"#a5f3fc",blur:20,offsetX:0,offsetY:0});
          if (effectIndex === 23) { common.stroke = "#ffffff"; common.strokeWidth = 7; }
          if (effectIndex === 24) common.shadow = new FabricShadow({color:"rgba(0,0,0,.2)",blur:20,offsetX:0,offsetY:12});
        }
        active.set(common);
        canvas.requestRenderAll();
        recordCommand();
      });
      return;
    }
    if (action === "delete") {
      canvas.remove(active);
      canvas.discardActiveObject();
    } else if (action === "duplicate") {
      void active.clone().then((copy: any) => {
        copy.set({ left: (active.left ?? 0) + 24, top: (active.top ?? 0) + 24, name: undefined });
        canvas.add(copy);
        canvas.setActiveObject(copy);
        canvas.requestRenderAll();
        recordCommand();
      });
      return;
    } else if (action === "front") {
      canvas.bringObjectToFront(active);
    } else if (action === "back") {
      canvas.sendObjectToBack(active);
    }
    canvas.requestRenderAll();
    recordCommand();
  }, [command.token, command.action]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !command.action.startsWith("preview-animation:")) return;
    const target = canvas.getActiveObject();
    if (!target) return;
    const original = { left:target.left??0, top:target.top??0, scaleX:target.scaleX??1, scaleY:target.scaleY??1, angle:target.angle??0, opacity:target.opacity??1, text:target.text, charSpacing:target.charSpacing??0 };
    const name = command.action.split(":").slice(2).join(":");
    const F = (at:number, x=0, y=0, sx=1, sy=1, angle=0, opacity=1, charSpacing=0, textProgress=1) => ({at,x,y,sx,sy,angle,opacity,charSpacing,textProgress});
    const frames:Record<string,ReturnType<typeof F>[]> = {
      "Fade in":[F(0,0,0,1,1,0,0),F(1)], "Typewriter":[F(0,0,0,1,1,0,1,0,0),F(1,0,0,1,1,0,1,0,1)],
      "Rise up":[F(0,0,90),F(1)], "Slide from left":[F(0,-260),F(1)], "Slide from right":[F(0,260),F(1)], "Zoom in":[F(0,0,0,.08,.08,0,0),F(1)],
      "Pop":[F(0,0,0,.35,.35,0,0),F(.72,0,0,1.18,1.18),F(1)], "Bounce":[F(0,0,-100),F(.62,0,12),F(.82,0,-7),F(1)], "Elastic":[F(0,0,0,.18,.18),F(.55,0,0,1.24,1.24),F(.78,0,0,.9,.9),F(1)],
      "Soft focus":[F(0,0,0,1.18,1.18,0,0),F(1)], "Flip X":[F(0,0,0,.02,1),F(.55,0,0,1.12,1),F(1)], "Flip Y":[F(0,0,0,1,.02),F(.55,0,0,1,1.12),F(1)],
      "Rotate in":[F(0,0,0,.65,.65,-100,0),F(1)], "Float up":[F(0,0,50),F(1)], "Drop in":[F(0,0,-180),F(.72,0,12),F(1)], "Stretch":[F(0,0,0,.45,1.55),F(.6,0,0,1.18,.86),F(1)],
      "Swing":[F(0,0,0,1,1,-28),F(.3,0,0,1,1,18),F(.55,0,0,1,1,-12),F(.78,0,0,1,1,7),F(1)], "Wave":[F(0,0,0,1,1,-14),F(.25,0,-8,1,1,14),F(.5,0,5,1,1,-10),F(.75,0,-3,1,1,7),F(1)],
      "Pulse":[F(0,0,0,.82,.82),F(.5,0,0,1.2,1.2),F(1)], "Glitch":[F(0,-14,0,1,1,-4),F(.16,12,-2,1,1,5),F(.32,-8,1,1,1,-3),F(.48,6,0,1,1,2),F(1)], "Tracking reveal":[F(0,0,0,1,1,0,1,520),F(1)],
      "Slide reveal":[F(0,-180,0,.92,1),F(1)], "Focus in":[F(0,0,0,1.65,1.65,0,0),F(1)], "Overshoot":[F(0,0,0,.35,.35),F(.7,0,0,1.28,1.28),F(1)], "Spring settle":[F(0,0,-65,.82,.82),F(.65,0,14,1.08,1.08),F(.84,0,-5,.98,.98),F(1)],
      "Fade":[F(0,0,0,1,1,0,0),F(1)], "Scale in":[F(0,0,0,.12,.12,0,0),F(1)], "Spin in":[F(0,0,0,.45,.45,-220,0),F(1)], "Flip horizontal":[F(0,0,0,.015,1,0,0),F(1)], "Flip vertical":[F(0,0,0,1,.015,0,0),F(1)],
      "Slide left":[F(0,-240),F(1)], "Slide right":[F(0,240),F(1)], "Slide up":[F(0,0,150),F(1)], "Slide down":[F(0,-150),F(1)], "Float":[F(0,0,36),F(1)], "Drift":[F(0,-110,32,1,1,-4),F(1)],
      "Wobble":[F(0,0,0,1,1,-18),F(.2,0,0,1,1,16),F(.4,0,0,1,1,-13),F(.6,0,0,1,1,10),F(.8,0,0,1,1,-5),F(1)], "Heartbeat":[F(0,0,0,.85,.85),F(.22,0,0,1.24,1.24),F(.42,0,0,.92,.92),F(.64,0,0,1.18,1.18),F(1)], "Shake":[F(0,-18),F(.2,16),F(.4,-13),F(.6,10),F(.8,-5),F(1)],
      "Jelly":[F(0,0,0,.72,1.28),F(.25,0,0,1.22,.78),F(.5,0,0,.9,1.1),F(.75,0,0,1.06,.94),F(1)], "Rubber band":[F(0,0,0,1.35,.65),F(.28,0,0,.72,1.28),F(.55,0,0,1.12,.9),F(.78,0,0,.95,1.05),F(1)], "Zoom through":[F(0,0,0,.04,.04,0,0),F(.65,0,0,1.35,1.35),F(1)], "Arc in":[F(0,-170,110,.72,.72,-35),F(.6,-18,8,1.05,1.05,5),F(1)], "Drop":[F(0,0,-220,.9,.9),F(.68,0,14,1.04,1.04),F(1)], "Spring":[F(0,0,-75,.72,.72),F(.62,0,16,1.1,1.1),F(.82,0,-6,.96,.96),F(1)]
    };
    const sequence = frames[name] ?? [F(0,0,0,.5,.5,0,0),F(1)];
    const start = performance.now(); const duration = name === "Typewriter" ? 1350 : 1050; let frameId = 0;
    const interpolate = (a:number,b:number,t:number) => a + (b-a)*t;
    const tick = (now:number) => {
      const progress = Math.min(1,(now-start)/duration);
      let next = sequence.findIndex((item,index)=>index<sequence.length-1 && progress>=item.at && progress<=sequence[index+1].at);
      if (next < 0) next = sequence.length-2;
      const from=sequence[next],to=sequence[next+1],local=Math.max(0,Math.min(1,(progress-from.at)/Math.max(.0001,to.at-from.at)));
      const eased=local*local*(3-2*local);
      const value=(key:"x"|"y"|"sx"|"sy"|"angle"|"opacity"|"charSpacing"|"textProgress",fallback:number)=>interpolate(from[key]??fallback,to[key]??fallback,eased);
      const update:any={left:original.left+value("x",0),top:original.top+value("y",0),scaleX:original.scaleX*value("sx",1),scaleY:original.scaleY*value("sy",1),angle:original.angle+value("angle",0),opacity:original.opacity*value("opacity",1)};
      if (typeof original.text === "string" && name === "Typewriter") update.text=original.text.slice(0,Math.ceil(original.text.length*value("textProgress",1)));
      if (name === "Tracking reveal") update.charSpacing=value("charSpacing",original.charSpacing??0);
      target.set(update); target.setCoords(); canvas.requestRenderAll();
      if (progress < 1) frameId=requestAnimationFrame(tick); else { target.set(original); target.setCoords(); canvas.requestRenderAll(); }
    };
    frameId=requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); target.set(original); target.setCoords(); canvas.requestRenderAll(); };
  }, [command.token, command.action]);

  useEffect(() => {
    const canvas=canvasRef.current;if(!canvas||imageCommand.token===0)return;let cancelled=false;
    void import("fabric").then(async({FabricImage})=>{if(cancelled||!canvasRef.current)return;try{const image=await FabricImage.fromURL(imageCommand.dataUrl,{crossOrigin:"anonymous"});if(cancelled||!canvasRef.current)return;const scale=Math.min(760/(image.width||1),560/(image.height||1),1);image.set({left:260,top:80,scaleX:scale,scaleY:scale,name:imageCommand.name||"Imported image"});canvas.add(image);canvas.setActiveObject(image);canvas.requestRenderAll();const json=JSON.stringify(canvas.toObject(["name","animationPreset"]));latestRef.current.onChange(json);const h=historyRef.current,items=[...h.items.slice(0,h.index+1),json].slice(-60);historyRef.current={items,index:items.length-1};latestRef.current.onHistoryChange(items.length>1,false);latestRef.current.onSelectionChange(true, "image");}catch(error){console.error("Could not add image",error);}});
    return()=>{cancelled=true;};
  },[imageCommand.token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || assetCommand.token === 0) return;
    void import("fabric").then(async({ Textbox, FabricImage }) => {
      if (!canvasRef.current) return;
      if (assetCommand.imageUrl) {
        try {
          const image = await FabricImage.fromURL(assetCommand.imageUrl);
          if (!canvasRef.current) return;
          const scale = Math.min(360/(image.width||1), 500/(image.height||1), 1);
          image.set({ left:790, top:120, scaleX:scale, scaleY:scale, name:assetCommand.label });
          canvas.add(image); canvas.setActiveObject(image); canvas.requestRenderAll();
          const json=JSON.stringify(canvas.toObject(["name","animationPreset"])); latestRef.current.onChange(json);
          const history=historyRef.current,items=[...history.items.slice(0,history.index+1),json].slice(-60); historyRef.current={items,index:items.length-1};
          latestRef.current.onHistoryChange(items.length>1,false); latestRef.current.onSelectionChange(true,"image");
        } catch(error) { console.error("Could not load character illustration",error); }
        return;
      }
      if (assetCommand.fontFamily === "Material Symbols Outlined") {
        const link = document.getElementById("slideai-material-symbols") as HTMLLinkElement | null;
        if (!link) { const stylesheet=document.createElement("link"); stylesheet.id="slideai-material-symbols"; stylesheet.rel="stylesheet"; stylesheet.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"; const ready=new Promise<void>((resolve)=>{stylesheet.onload=()=>resolve();stylesheet.onerror=()=>resolve();}); document.head.appendChild(stylesheet); await ready; }
        await document.fonts.load(`112px "Material Symbols Outlined"`,assetCommand.symbol);
      }
      const sticker = new Textbox(assetCommand.symbol, {
        left: 500, top: 250, width: 190, fontFamily: assetCommand.fontFamily ?? "Noto Color Emoji, Segoe UI Emoji, Apple Color Emoji, sans-serif",
        fontSize: 112, textAlign: "center", lineHeight: 1, editable: false,
        name: `asset-${assetCommand.label.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,
      });
      canvas.add(sticker); canvas.setActiveObject(sticker); canvas.requestRenderAll();
      const json = JSON.stringify(canvas.toObject(["name","animationPreset"]));
      latestRef.current.onChange(json);
      const history = historyRef.current;
      const items = [...history.items.slice(0,history.index+1),json].slice(-60);
      historyRef.current = {items,index:items.length-1};
      latestRef.current.onHistoryChange(items.length>1,false);
      latestRef.current.onSelectionChange(true, "textbox", {fontFamily:latestRef.current.fontFamily,fontSize:latestRef.current.fontSize,fontWeight:latestRef.current.fontWeight});
    });
  }, [assetCommand.token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = latestRef.current;
    canvas.isDrawingMode = current.tool === "draw";
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = current.stroke;
      canvas.freeDrawingBrush.width = Math.max(1, current.strokeWidth);
    }
    if (current.tool === "select") canvas.selection = true;
  }, [tool, stroke, strokeWidth]);

  useEffect(() => {
    const canvas=canvasRef.current;if(!canvas)return;let cancelled=false;const object=canvas.getActiveObject();
    void(async()=>{const loaded=await loadGoogleFont(fontFamily,fontWeights,fontWeight,fontSize);if(cancelled||!canvasRef.current)return;if(!loaded)console.warn(`Google Font "${fontFamily}" bulunamadı; tarayıcı yedek font kullanacak.`);if(object && "fontFamily" in object){object.set({fontFamily,fontSize,fontWeight});object.setCoords();canvas.requestRenderAll();latestRef.current.onChange(JSON.stringify(canvas.toObject(["name","animationPreset"])));}})();
    return()=>{cancelled=true;};
  },[fontFamily,fontWeights,fontSize,fontWeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = latestRef.current;
    const object = canvas.getActiveObject();
    if (object) {
      void import("fabric").then(({ Shadow }) => {
        if (!canvasRef.current) return;
        object.set({
          fill: current.fill,
          stroke: current.stroke,
          strokeWidth: current.strokeWidth,
          fontFamily: current.fontFamily,
          fontSize: current.fontSize,
          fontWeight: current.fontWeight,
          opacity: current.opacity,
          shadow: current.shadowEnabled ? new Shadow({ color: "rgba(0,0,0,0.32)", blur: 24, offsetX: 8, offsetY: 12 }) : null,
        });
        canvas.requestRenderAll();
        current.onChange(JSON.stringify(canvas.toObject(["name", "animationPreset"])));
      });
    }
  }, [fill, stroke, strokeWidth, fontFamily, fontSize, fontWeight, shadowEnabled, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const object = canvas.getActiveObject();
    if (!object) return;
    void import("fabric").then(({ Rect }) => {
      if (!canvasRef.current) return;
      const width = Math.max(1, object.width ?? 1);
      const height = Math.max(1, object.height ?? 1);
      object.set({ clipPath: cornerRadius > 0 ? new Rect({ width, height, rx: Math.min(cornerRadius,width/2), ry: Math.min(cornerRadius,height/2), originX:"center", originY:"center" }) : undefined, rx:cornerRadius, ry:cornerRadius });
      object.setCoords();
      canvas.requestRenderAll();
      latestRef.current.onChange(JSON.stringify(canvas.toObject(["name","animationPreset"])));
    });
  }, [cornerRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = latestRef.current;
    const titleObject = canvas.getObjects().find((object: any) => object.name === "slide-title");
    const eyebrowObject = canvas.getObjects().find((object: any) => object.name === "slide-eyebrow");
    const bodyObject = canvas.getObjects().find((object: any) => object.name === "slide-body");
    const numberObject = canvas.getObjects().find((object: any) => object.name === "slide-number");
    if (numberObject) numberObject.set({ text:current.slideNumber, fill:current.theme === "light" ? "#777287" : "#aaa3c4" });
    if (titleObject) titleObject.set("text", current.title);
    if (eyebrowObject) eyebrowObject.set("text", current.eyebrow);
    if (bodyObject) bodyObject.set("text", current.body);
    canvas.backgroundColor = current.backgroundColor;
    canvas.requestRenderAll();
    current.onChange(JSON.stringify(canvas.toObject(["name", "animationPreset"])));
  }, [title, eyebrow, body, theme, backgroundColor, slideNumber]);

  return <div className="design-canvas-shell"><canvas ref={elementRef} /></div>;
}
