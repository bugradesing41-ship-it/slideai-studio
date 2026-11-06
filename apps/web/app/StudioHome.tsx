"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, FilePlus2, FolderOpen,
  Layers3, LayoutTemplate, LogOut, Plus, Presentation, Sparkles, Trash2
} from "lucide-react";

type Project = {
  id: string; title: string; description: string | null; canvas_width: number;
  canvas_height: number; updated_at: string; created_at: string;
};
type Format = "wide" | "classic" | "portrait" | "square" | "a4";
const FORMATS: Record<Format, { label: string; ratio: string; width: number; height: number }> = {
  wide: { label: "Sunum", ratio: "16:9", width: 1280, height: 720 },
  classic: { label: "Klasik", ratio: "4:3", width: 1200, height: 900 },
  portrait: { label: "Dikey", ratio: "9:16", width: 720, height: 1280 },
  square: { label: "Kare", ratio: "1:1", width: 1080, height: 1080 },
  a4: { label: "A4 belge", ratio: "A4", width: 794, height: 1123 },
};
const makeId = () => crypto.randomUUID();

export default function StudioHome() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Format>("wide");
  const [background, setBackground] = useState("#ffffff");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user); setReady(true); }
    }).catch(() => { if (active) setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) { setProjects([]); return; }
    let active = true;
    setLoading(true);
    supabase.from("presentations")
      .select("id,title,description,canvas_width,canvas_height,updated_at,created_at")
      .is("deleted_at", null).order("updated_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setProjects((data ?? []) as Project[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, [supabase, user]);

  async function googleSignIn() {
    if (!supabase) return;
    setBusy(true); setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (authError) { setError(authError.message); setBusy(false); }
  }

  async function emailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        if (!data.session) setMessage("Hesabını doğrulamak için e-postanı kontrol et.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Giriş yapılamadı."); }
    finally { setBusy(false); }
  }

  function createProject() {
    const selected = FORMATS[format];
    const params = new URLSearchParams({
      blank: "1", projectId: makeId(), width: String(selected.width), height: String(selected.height),
      background, title: title.trim() || "İsimsiz sunum", description: description.trim(),
    });
    window.location.href = "/studio?" + params.toString();
  }

  async function deleteProject(project: Project) {
    if (!supabase || !window.confirm(`“${project.title}” projesi çöp kutusuna taşınsın mı?`)) return;
    const { error: deleteError } = await supabase.from("presentations")
      .update({ deleted_at: new Date().toISOString() }).eq("id", project.id);
    if (deleteError) setError(deleteError.message);
    else setProjects((items) => items.filter((item) => item.id !== project.id));
  }

  const dateLabel = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

  if (!supabase) return <main className="sh-shell sh-center"><section className="sh-setup"><div className="sh-brand"><span className="sh-brand-icon"><Layers3 size={19}/></span> slideai<span>studio</span></div><h1>Çalışma alanını bağla</h1><p>Uygulamayı kullanmak için Supabase proje bilgilerini ortam değişkenlerine eklemelisin.</p><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase panelini aç <ArrowUpRight size={15}/></a></section></main>;

  if (!ready) return <main className="sh-shell sh-center"><div className="sh-loading"><span className="sh-spinner"/> Çalışma alanın hazırlanıyor</div></main>;

  if (!user) return <main className="sh-auth-page">
    <div className="sh-auth-visual">
      <Link href="/" className="sh-brand"><span className="sh-brand-icon"><Layers3 size={19}/></span> slideai<span>studio</span></Link>
      <div className="sh-visual-copy"><div className="sh-kicker"><Sparkles size={14}/> FİKRİNDEN ETKİLEYİCİ SUNUMLARA</div><h1>İyi fikirler,<br/><em>iyi anlatılmayı</em><br/>hak eder.</h1><p>Fikirlerini düzenli, güçlü ve profesyonel sunumlara dönüştürmek için yaratıcı alanın.</p></div>
      <div className="sh-mini-deck"><div className="sh-mini-top"><span/> <span/> <span/></div><div className="sh-mini-content"><div className="sh-mini-tag">BRAND STRATEGY · 2026</div><strong>Make your<br/><i>next move.</i></strong><div className="sh-mini-line"/></div><div className="sh-mini-foot">SLIDEAI STUDIO <span>01 / 08</span></div></div>
      <div className="sh-auth-bottom">© 2026 SlideAI Studio <span>Fikirlerden etkiye.</span></div>
    </div>
    <section className="sh-auth-panel"><div className="sh-auth-card">
      <div className="sh-mobile-brand sh-brand"><span className="sh-brand-icon"><Layers3 size={19}/></span> slideai<span>studio</span></div>
      <div className="sh-auth-overline">YARATICI ALANINA HOŞ GELDİN</div><h2>{mode === "signin" ? "Tekrar hoş geldin." : "Hesabını oluştur."}</h2><p>Projelerine kaldığın yerden devam etmek için giriş yap.</p>
      <button className="sh-google" onClick={() => void googleSignIn()} disabled={busy}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.4 37.98 46.98 31.92 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg> Google ile devam et <ArrowRight size={16}/></button>
      <div className="sh-or"><span/> veya e-posta ile <span/></div>
      <form onSubmit={emailAuth}><label>E-posta adresi<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com"/></label><label>Şifre<input type="password" minLength={8} required autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 8 karakter"/></label>
        {error && <div className="sh-feedback sh-error">{error}</div>}{message && <div className="sh-feedback">{message}</div>}
        <button className="sh-submit" disabled={busy}>{busy ? "Lütfen bekle…" : mode === "signin" ? "Giriş yap" : "Hesap oluştur"} <ArrowRight size={16}/></button>
      </form>
      <div className="sh-switch">{mode === "signin" ? "Henüz hesabın yok mu?" : "Zaten hesabın var mı?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}>{mode === "signin" ? "Ücretsiz hesap oluştur" : "Giriş yap"}</button></div>
      <div className="sh-terms">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</div>
    </div></section>
  </main>;

  return <main className="sh-app">
    <aside className="sh-sidebar"><Link href="/" className="sh-brand"><span className="sh-brand-icon"><Layers3 size={19}/></span> slideai<span>studio</span></Link>
      <button className="sh-new-project" onClick={() => setShowCreate(true)}><Plus size={17}/> Yeni sunum oluştur</button>
      <div className="sh-side-label">ÇALIŞMA ALANI</div><div className="sh-side-link active"><Layers3 size={17}/> Projelerim <span>{projects.length}</span></div>
      <div className="sh-side-note"><div className="sh-side-note-icon"><Sparkles size={16}/></div><strong>Bir fikrin mi var?</strong><p>Boş bir tuval aç ve anlatmaya başla.</p><button onClick={() => setShowCreate(true)}>Hemen başla <ArrowUpRight size={14}/></button></div>
      <div className="sh-profile"><div className="sh-user-avatar">{(user.email?.[0] || "S").toUpperCase()}</div><div className="sh-user-meta"><strong>{user.user_metadata?.full_name || user.email}</strong><span>Ücretsiz çalışma alanı</span></div><button title="Çıkış yap" onClick={() => void supabase.auth.signOut()}><LogOut size={16}/></button></div>
    </aside>
    <section className="sh-main"><header className="sh-topbar"><div className="sh-breadcrumb">Çalışma alanı <span>/</span> <strong>Projelerim</strong></div><div className="sh-top-actions"><span className="sh-status"><i/> Bulut senkronizasyonu</span><button onClick={() => setShowCreate(true)}><Plus size={16}/> Yeni proje</button></div></header>
      <div className="sh-content"><div className="sh-welcome"><div><div className="sh-kicker">YARATICI ÇALIŞMA ALANIN</div><h1>Fikirlerini hayata geçir.</h1><p>Sunumlarını oluştur, düzenle ve tüm projelerini tek yerde yönet.</p></div><div className="sh-welcome-mark"><Layers3 size={30}/></div></div>
        <section className="sh-create-banner"><div className="sh-create-art"><div className="sh-art-slide"><span>IDEAS INTO IMPACT</span><strong>Tell your<br/><i>story.</i></strong><div/></div><div className="sh-art-orbit"/></div><div className="sh-create-copy"><div className="sh-kicker">YENİ BİR BAŞLANGIÇ</div><h2>Bir sonraki harika sunumun<br/>burada başlıyor.</h2><p>İhtiyacına uygun tuvali seç, fikrini isimlendir ve tasarlamaya başla.</p><button onClick={() => setShowCreate(true)}>Sunum oluşturmaya başla <ArrowRight size={16}/></button></div><div className="sh-create-badge"><Sparkles size={13}/> YOUR NEXT BIG IDEA</div></section>
        <div className="sh-section-head"><div><h2>Son projelerin</h2><p>Çalışmalarına kaldığın yerden devam et.</p></div><span>{projects.length} PROJE</span></div>
        {error && <div className="sh-feedback sh-error">{error}</div>}
        {loading ? <div className="sh-empty"><span className="sh-spinner"/> Projelerin yükleniyor…</div> : projects.length ? <div className="sh-project-grid">{projects.map((project, index) => <article className="sh-project-card" key={project.id}><Link href={`/studio?projectId=${project.id}`} className={`sh-project-preview sh-preview-${index % 4}`}><div className="sh-preview-paper"><span>SLIDEAI STUDIO</span><strong>{project.title}</strong><i>{project.description || "Your next great idea."}</i><small>{project.canvas_width} × {project.canvas_height}</small></div><div className="sh-open-overlay">Projeyi aç <ArrowUpRight size={15}/></div></Link><div className="sh-project-info"><div><h3>{project.title}</h3><p><Clock3 size={12}/> {dateLabel(project.updated_at)}</p></div><button title="Çöp kutusuna taşı" onClick={() => void deleteProject(project)}><Trash2 size={15}/></button></div></article>)}</div> : <div className="sh-empty"><div className="sh-empty-icon"><FolderOpen size={23}/></div><strong>Henüz bir projen yok</strong><p>İlk sunumunu oluşturarak yaratıcı yolculuğuna başla.</p><button onClick={() => setShowCreate(true)}><Plus size={15}/> İlk sunumunu oluştur</button></div>}
      </div>
    </section>
    {showCreate && <div className="sh-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}><section className="sh-create-modal"><div className="sh-modal-head"><div><div className="sh-kicker">YENİ PROJE</div><h2>Nasıl bir sunum hazırlıyoruz?</h2><p>Projenin temel ayarlarını belirle. Daha sonra editörde değiştirebilirsin.</p></div><button onClick={() => setShowCreate(false)} aria-label="Kapat">×</button></div>
      <label className="sh-field">Proje adı<input autoFocus maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. 2026 ürün lansmanı"/></label><label className="sh-field">Kısa açıklama <span>İSTEĞE BAĞLI</span><input maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bu sunum ne hakkında?"/></label>
      <div className="sh-format-title">TUVAL BOYUTU <span>İHTİYACINA GÖRE SEÇ</span></div><div className="sh-format-grid">{(Object.keys(FORMATS) as Format[]).map((key) => <button key={key} className={format === key ? "selected" : ""} onClick={() => setFormat(key)}><span className={`sh-ratio ratio-${key}`}/><strong>{FORMATS[key].label}</strong><small>{FORMATS[key].ratio}</small>{format === key && <i><Check size={12}/></i>}</button>)}</div>
      <label className="sh-background">Arka plan rengi <span><input type="color" value={background} onChange={(e) => setBackground(e.target.value)}/>{background.toUpperCase()}</span></label>
      <div className="sh-modal-actions"><button className="sh-cancel" onClick={() => setShowCreate(false)}>Vazgeç</button><button className="sh-submit" onClick={createProject}>Boş sunum oluştur <ArrowRight size={16}/></button></div>
    </section></div>}
  </main>;
}
