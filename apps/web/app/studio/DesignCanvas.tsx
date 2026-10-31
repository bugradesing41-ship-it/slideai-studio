"use client";

import { useEffect, useRef } from "react";

type Tool = "select" | "draw" | "rect" | "circle" | "triangle" | "line" | "arrow" | "star" | "text";
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
  initialData?: string;
  onChange: (json: string) => void;
  onSelectionChange: (selected: boolean) => void;
};

export type { Tool };

export default function DesignCanvas({
  slideId, title, eyebrow, body, theme, tool, fill, stroke, strokeWidth,
  fontFamily, fontSize, initialData, onChange, onSelectionChange
}: Props) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<any>(null);
  const latestRef = useRef({ title, eyebrow, body, theme, tool, fill, stroke, strokeWidth, fontFamily, fontSize, initialData, onChange, onSelectionChange });
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
      canvas.on("mouse:down", (event: any) => {
        if (latestRef.current.tool === "rect" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const shape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 180, height: 110, fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth, rx: 8, ry: 8 });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "circle" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const shape = new fabric.Circle({ left: pointer.x, top: pointer.y, radius: 65, fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "triangle" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const shape = new fabric.Triangle({ left: pointer.x, top: pointer.y, width: 150, height: 135, fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "star" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const points = Array.from({ length: 10 }, (_, index) => {
            const radius = index % 2 === 0 ? 66 : 29;
            const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2;
            return { x: 70 + Math.cos(angle) * radius, y: 70 + Math.sin(angle) * radius };
          });
          const shape = new fabric.Polygon(points, { left: pointer.x, top: pointer.y, fill: latestRef.current.fill, stroke: latestRef.current.stroke, strokeWidth: latestRef.current.strokeWidth });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "line" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const shape = new fabric.Line([pointer.x, pointer.y, pointer.x + 180, pointer.y], { stroke: latestRef.current.stroke, strokeWidth: Math.max(2, latestRef.current.strokeWidth), selectable: true });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "arrow" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const shape = new fabric.Group([
            new fabric.Line([0, 0, 155, 0], { stroke: latestRef.current.stroke, strokeWidth: Math.max(3, latestRef.current.strokeWidth), originX: "center", originY: "center" }),
            new fabric.Triangle({ left: 145, top: -10, width: 24, height: 24, angle: 90, fill: latestRef.current.stroke, originX: "center", originY: "center" })
          ], { left: pointer.x, top: pointer.y });
          canvas.add(shape); canvas.setActiveObject(shape); canvas.requestRenderAll(); save();
        }
        if (latestRef.current.tool === "text" && event.target == null) {
          const pointer = canvas.getPointer(event.e);
          const text = new fabric.IText("Double-click to edit", { left: pointer.x, top: pointer.y, fontFamily: latestRef.current.fontFamily, fontSize: latestRef.current.fontSize, fill: latestRef.current.fill, editable: true });
          canvas.add(text); canvas.setActiveObject(text); text.enterEditing(); canvas.requestRenderAll(); save();
        }
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
      object.set({
        fill: current.fill,
        stroke: current.stroke,
        strokeWidth: current.strokeWidth,
        fontFamily: current.fontFamily,
        fontSize: current.fontSize,
      });
      canvas.requestRenderAll();
      current.onChange(JSON.stringify(canvas.toJSON(["name", "animationPreset"])));
    }
  }, [fill, stroke, strokeWidth, fontFamily, fontSize]);

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
  }, [title, eyebrow, body, theme]);

  return <div className="design-canvas-shell"><canvas ref={elementRef} /></div>;
}
