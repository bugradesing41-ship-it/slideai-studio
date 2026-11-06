"use client";

import { useEffect, useState } from "react";

type Props = {
  canvasData?: string | null;
  width?: number;
  height?: number;
  background?: string;
  title?: string;
  className?: string;
};

export default function SlidePreview({ canvasData, width = 1280, height = 720, background = "#ffffff", title = "", className = "" }: Props) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let canvasToDispose: { dispose: () => Promise<boolean> | Promise<void> } | undefined;
    if (!canvasData) { setImage(null); return; }
    const render = async () => {
      try {
        const { StaticCanvas, Gradient } = await import("fabric");
        const colors = background.startsWith("gradient:")
          ? background.slice(9).split(",").filter((color) => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 3) : [];
        const fill = colors.length > 1
          ? new Gradient({ type: "linear", coords: { x1: 0, y1: 0, x2: 1280, y2: 0 }, colorStops: colors.map((color, i) => ({ offset: i / (colors.length - 1), color })) })
          : colors[0] || background;
        const canvas = new StaticCanvas(document.createElement("canvas"), {
          width, height, backgroundColor: fill, renderOnAddRemove: false,
        });
        canvasToDispose = canvas;
        const scale = width / 1280;
        canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
        await canvas.loadFromJSON(JSON.parse(canvasData));
        if (disposed) return;
        canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
        canvas.backgroundColor = fill;
        canvas.renderAll();
        const url = canvas.toDataURL({ format: "png", multiplier: Math.min(1, 420 / Math.max(width, height)) });
        if (!disposed) setImage(url);
      } catch (error) {
        console.warn("Slide thumbnail could not be rendered", error);
        if (!disposed) setImage(null);
      } finally {
        await canvasToDispose?.dispose();
      }
    };
    void render();
    return () => { disposed = true; };
  }, [canvasData, width, height, background]);
  return <div className={`orvia-slide-preview ${className}`} style={{ aspectRatio: `${width} / ${height}`, background: background.startsWith("gradient:") ? background.slice(9).split(",").join(",") : background }}>
    {image ? <img src={image} alt={title ? `Preview: ${title}` : "Slide preview"} /> : <div className="orvia-preview-placeholder" aria-label="Empty slide">{title && title.trim() ? <strong>{title}</strong> : <span>Blank slide</span>}</div>}
  </div>;
}
