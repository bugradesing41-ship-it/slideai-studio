"use client";
import { useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ArrowUpRight, Check, FileUp, Play, X } from "lucide-react";
export type MotionAsset = { name: string; data?: string | ArrayBuffer; src?: string; fileType: "json" | "lottie" | "remote" };
const COMMUNITY_DEMO = "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie";
export default function MotionAssetLibrary({ onClose, onChoose }: { onClose: () => void; onChoose: (asset: MotionAsset) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<MotionAsset>({ name: "dotLottie sample", src: COMMUNITY_DEMO, fileType: "remote" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setError("Dosya 25 MB sınırını aşmamalı."); return; }
    setError(""); setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith(".json")) { const raw = await file.text(); JSON.parse(raw); setSelected({ name: file.name, data: raw, fileType: "json" }); }
      else if (file.name.toLowerCase().endsWith(".lottie")) setSelected({ name: file.name, data: await file.arrayBuffer(), fileType: "lottie" });
      else setError("Yalnızca .json ve .lottie dosyaları desteklenir.");
    } catch { setError("Dosya okunamadı. Geçerli bir Lottie JSON veya .lottie dosyası seç."); }
    finally { setLoading(false); }
  }
  return <div className="motion-library-backdrop" role="dialog" aria-modal="true" aria-label="Motion asset library">
    <section className="motion-library-dialog">
      <header className="motion-library-header"><div><strong>Animation library</strong><span>dotLottie player · JSON / .lottie</span></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
      <div className="motion-library-grid">
        <div className="motion-library-preview"><div className="motion-preview-stage"><DotLottieReact data={selected.data} src={selected.src} autoplay loop /></div><strong>{selected.name}</strong><span>{selected.fileType === "remote" ? "Community sample" : selected.fileType.toUpperCase() + " · Local file"}</span><button className="motion-library-insert" onClick={() => onChoose(selected)}><Check size={15}/> Add to current slide</button></div>
        <div className="motion-library-options">
          <button className="motion-library-option selected" onClick={() => setSelected({ name: "dotLottie sample", src: COMMUNITY_DEMO, fileType: "remote" })}><Play size={16}/><span><b>Sample animation</b><small>Live preview from dotLottie docs</small></span></button>
          <button className="motion-library-option" onClick={() => inputRef.current?.click()}><FileUp size={16}/><span><b>Import animation file</b><small>Choose a .json or .lottie file from your device</small></span></button>
          <input ref={inputRef} hidden type="file" accept=".json,.lottie,application/json" onChange={event=>{void importFile(event.target.files?.[0]);event.currentTarget.value="";}}/>
          <a className="motion-library-option" href="https://lottiefiles.com/free-animations" target="_blank" rel="noreferrer"><ArrowUpRight size={16}/><span><b>Browse LottieFiles</b><small>Find community animations and check each asset license</small></span></a>
          <a className="motion-library-option" href="https://rive.app/community/" target="_blank" rel="noreferrer"><ArrowUpRight size={16}/><span><b>Browse Rive Community</b><small>Interactive .riv playback integration will be a separate step</small></span></a>
          {loading && <p>Dosya hazırlanıyor…</p>}{error && <p className="motion-library-error">{error}</p>}
        </div>
      </div>
      <footer className="motion-library-note">dotLottie oynatıcı MIT lisanslıdır; topluluk animasyonlarının kullanım lisansı dosya bazında kontrol edilmelidir.</footer>
    </section>
  </div>;
}
