"use client";

import { useEffect, useRef } from "react";

type Tool = "select" | "draw" | "rect" | "circle" | "triangle" | "line" | "arrow" | "star" | "diamond" | "hexagon" | "pentagon" | "heart" | "speech" | "text";
type Props = {
  slideId: number;
  title: string;
  eyebrow: string;
  body: string;
  theme: "violet" | "blue" | "light";
  tool: Tool;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontFamily: string;
  fontSize: number;
  shadowEnabled: boolean;
  opacity: number;
  initialData?: string;
  onChange: (json: string) => void;
  onSelectionChange: (selected: boolean) => void;
};

export type { Tool };

export default function DesignCanvas({
  slideId, title, eyebrow, body, theme, tool, fill, stroke, strokeWidth,
  fontFamily, fontSize, shadowEnabled, opacity, initialData, onChange, onSelectionChange
}: Props) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<any>(null);
  const latestRef = useRef({ title, eyebrow, body, theme, tool, fill, stroke, strokeWidth, fontFamily, fontSize, shadowEnabled, opacity, initialData, onChange, onSelectionChange });
  latestRef.current = { title, eyebrow, body, theme, tool, fill, stroke, strokeWidth, fontFamily, fontSize, initialData, onChange, onSelectionChange };

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function mount() {
      const fabric = await import("fabric");
      if (disposed || !elementRef.current) return;
      const canvas = new fabric.Canvas(elementRef.current, {
        width: 1280,
        height: 720,
        backgroundColor: latestRef.current.theme === "light" ? "#f1eee7" : latestRef.current.theme === "blue" ? "#102333" : "#171525",
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: false,
      });
      canvasRef.current = canvas;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

      const save = () => latestRef.current.onChange(JSON.stringify(canvas.toJSON(["name", "animationPreset"])));
      const selection = () => latestRef.current.onSelectionChange(Boolean(canvas.getActiveObject()));
      const syncText = () => {
        const current = latestRef.current;
        const titleObject = canvas.getObjects().find((object: any) => object.name === "slide-title");
        const eyebrowObject = canvas.getObjects().find((object: any) => object.name === "slide-eyebrow");
        const bodyObject = canvas.getObjects().find((object: any) => object.name === "slide-body");
        if (titleObject) titleObject.set("text", current.title);
        if (eyebrowObject) eyebrowObject.set("text", current.eyebrow);
        if (bodyObject) bodyObject.set("text", current.body);
        canvas.backgroundColor = current.theme === "light" ? "#f1eee7" : current.theme === "blue" ? "#102333" : "#171525";
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
            fontFamily: "Inter", fontWeight: "bold", charSpacing: 190,
            fill: light ? "#7558bc" : current.theme === "blue" ? "#8bc7e7" : "#b39bff",
            editable: true,
          }),
          new fabric.Textbox(current.title || "Your presentation starts here", {
            name: "slide-title", left: 80, top: 205, width: 1030, height: 190,
            fontSize: 66, fontFamily: "Manrope", fontWeight: "bold",
            lineHeight: 1.05, fill: light ? "#252333" : "#f4f1ff",
            editable: true,
          }),
          new fabric.Textbox(current.body || "Add a clear supporting message to make your story memorable.", {
            name: "slide-body", left: 84, top: 440, width: 800, height: 110,
            fontSize: 25, fontFamily: "DM Sans", lineHeight: 1.35,
            fill: light ? "#666174" : "#bcb8cd", editable: true,
          }),
          new fabric.Textbox("THINK CLEARLY. CREATE BOLDLY.", {
            name: "slide-footer", left: 84, top: 650, width: 700, fontSize: 12,
            fontFamily: "Inter", fontWeight: "bold", charSpacing: 140,
            fill: light ? "#777287" : "#aaa3c4", selectable: false, evented: false,
          })
        );
      } else {
        syncText();
      }

      canvas.on("object:modified", save);
      canvas.on("object:added", save);
      canvas.on("object:removed", save);
      canvas.on("text:changed", save);
      canvas.on("selection:created", selection);
      canvas.on("selection:updated", selection);
      canvas.on("selection:cleared", selection);
      let drawingShape: any = null;
      let drawStart: { x: number; y: number } | null = null;

      canvas.on("mouse:down", (event: any) => {
        const currentTool = latestRef.current.tool;
        if (event.target != null) return;
        const pointer = canvas.getPointer(event.e);
        if (currentTool === "text") {
          const text = new fabric.IText("Double-click to edit", { left: pointer.x, top: pointer.y, fontFamily: latestRef.current.fontFamily, fontSize: latestRef.current.fontSize, fill: latestRef.current.fill, editable: true });
          canvas.add(text); canvas.setActiveObject(text); text.enterEditing(); canvas.requestRenderAll(); save();
          return;
        }
        if (!["rect", "circle", "triangle", "star", "diamond", "hexagon", "pentagon", "heart", "speech", "line", "arrow"].includes(currentTool)) return;

        drawStart = { x: pointer.x, y: pointer.y };
        const style = { fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth };
        if (currentTool === "rect") drawingShape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 1, height: 1, rx: 8, ry: 8, ...style });
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
        if (["diamond", "hexagon", "pentagon", "speech"].includes(currentTool)) {
          const points = currentTool === "diamond"
            ? [{x:70,y:0},{x:140,y:70},{x:70,y:140},{x:0,y:70}]
            : currentTool === "speech"
              ? [{x:0,y:0},{x:140,y:0},{x:140,y:95},{x:86,y:95},{x:60,y:135},{x:56,y:95},{x:0,y:95}]
              : Array.from({ length: currentTool === "hexagon" ? 6 : 5 }, (_, index, list) => {
                  const angle = (Math.PI * 2 * index) / list.length - Math.PI / 2;
                  return { x: 70 + Math.cos(angle) * 70, y: 70 + Math.sin(angle) * 70 };
                });
          drawingShape = new fabric.Polygon(points, { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, ...style });
        }
        if (currentTool === "heart") {
          drawingShape = new fabric.Path("M 70 128 C 54 112 8 80 8 43 C 8 4 57 -8 70 28 C 83 -8 132 4 132 43 C 132 80 86 112 70 128 Z", { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01, ...style });
        }
        if (currentTool === "line") drawingShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke: latestRef.current.stroke, strokeWidth: Math.max(2, latestRef.current.strokeWidth) });
        if (currentTool === "arrow") {
          drawingShape = new fabric.Group([
            new fabric.Line([0, 15, 150, 15], { stroke: latestRef.current.stroke, strokeWidth: Math.max(3, latestRef.current.strokeWidth) }),
            new fabric.Triangle({ left: 138, top: 3, width: 25, height: 25, angle: 90, fill: latestRef.current.stroke })
          ], { left: pointer.x, top: pointer.y, scaleX: 0.01, scaleY: 0.01 });
        }
        if (drawingShape) {
          canvas.selection = false;
          canvas.add(drawingShape);
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
          opacity: current.opacity,
          shadow: current.shadowEnabled ? new Shadow({ color: "rgba(0,0,0,0.32)", blur: 24, offsetX: 8, offsetY: 12 }) : null,
        });
        canvas.requestRenderAll();
        current.onChange(JSON.stringify(canvas.toJSON(["name", "animationPreset"])));
      });
    }
  }, [fill, stroke, strokeWidth, fontFamily, fontSize, shadowEnabled, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = latestRef.current;
    const titleObject = canvas.getObjects().find((object: any) => object.name === "slide-title");
    const eyebrowObject = canvas.getObjects().find((object: any) => object.name === "slide-eyebrow");
    const bodyObject = canvas.getObjects().find((object: any) => object.name === "slide-body");
    if (titleObject) titleObject.set("text", current.title);
    if (eyebrowObject) eyebrowObject.set("text", current.eyebrow);
    if (bodyObject) bodyObject.set("text", current.body);
    canvas.backgroundColor = current.theme === "light" ? "#f1eee7" : current.theme === "blue" ? "#102333" : "#171525";
    canvas.requestRenderAll();
    current.onChange(JSON.stringify(canvas.toJSON(["name", "animationPreset"])));
  }, [title, eyebrow, body, theme]);

  return <div className="design-canvas-shell"><canvas ref={elementRef} /></div>;
}
