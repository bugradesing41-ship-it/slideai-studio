"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, FolderPlus, Layers3, LogOut, Plus, RotateCcw, Trash2, Presentation, Clock3, Folder } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import SlidePreview from "./components/SlidePreview";
import type { User } from "@supabase/supabase-js";

type PresentationRow = {
  id: string;
  title: string;
  description: string | null;
  canvas_width: number;
  canvas_height: number;
  updated_at: string;
  created_at: string;
  folder_id: string | null;
  deleted_at: string | null;
  project_data?: Record<string, unknown>;
};
type FolderRow = { id: string; name: string; created_at: string };

type CanvasFormat = "landscape" | "presentation-4-3" | "portrait" | "portrait-3-4" | "instagram-4-5" | "tiktok" | "square" | "photo-3-2" | "poster-2-3" | "a4" | "a4-landscape" | "letter" | "custom";
const CANVAS_FORMATS: Record<Exclude<CanvasFormat, "custom">, { width: number; height: number; label: string }> = {
  landscape: { width: 1280, height: 720, label: "Widescreen · 16:9" },
  "presentation-4-3": { width: 1200, height: 900, label: "Classic · 4:3" },
  portrait: { width: 720, height: 1280, label: "Portrait · 9:16" },
  "portrait-3-4": { width: 900, height: 1200, label: "Portrait · 3:4" },
  "instagram-4-5": { width: 1080, height: 1350, label: "Social post · 4:5" },
  tiktok: { width: 1080, height: 1920, label: "TikTok / Reels · 9:16" },
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  "photo-3-2": { width: 1200, height: 800, label: "Photo · 3:2" },
  "poster-2-3": { width: 1000, height: 1500, label: "Poster · 2:3" },
  a4: { width: 794, height: 1123, label: "A4 · Portrait" },
  "a4-landscape": { width: 1123, height: 794, label: "A4 · Landscape" },
  letter: { width: 816, height: 1056, label: "US Letter · Portrait" },
};

const uuid = () => crypto.randomUUID();

export default function WorkspaceDashboard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configured = Boolean(supabase);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [presentations, setPresentations] = useState<PresentationRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderBusy, setFolderBusy] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [cloudStatus, setCloudStatus] = useState("Connecting…");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [format, setFormat] = useState<CanvasFormat>("landscape");
  const [canvasWidth, setCanvasWidth] = useState(1280);
  const [canvasHeight, setCanvasHeight] = useState(720);
  const [background, setBackground] = useState("#ffffff");

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) { setUser(data.user); setAuthReady(true); }
    }).catch(() => { if (alive) setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  const loadWorkspace = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    setNotice("");
    const presentationsQuery = supabase.from("presentations")
      .select("id,title,description,canvas_width,canvas_height,updated_at,created_at,folder_id,deleted_at,project_data");
    const filteredPresentationsQuery = showTrash
      ? presentationsQuery.not("deleted_at", "is", null)
      : presentationsQuery.is("deleted_at", null);
    const [presentationResult, folderResult] = await Promise.all([
      filteredPresentationsQuery.order("updated_at", { ascending: false }),
      supabase.from("presentation_folders").select("id,name,created_at").order("name"),
    ]);
    if (presentationResult.error) { setNotice(presentationResult.error.message); setCloudStatus("Database setup required"); }
    else { setPresentations((presentationResult.data ?? []) as PresentationRow[]); setCloudStatus("Cloud connected"); }
    if (folderResult.error) setNotice((current) => current || folderResult.error.message);
    else setFolders((folderResult.data ?? []) as FolderRow[]);
    setLoading(false);
  }, [supabase, user, showTrash]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    const importLocalProjects = async () => {
      const migrationKey = `slideai-cloud-import-v1:${user.id}`;
      if (localStorage.getItem(migrationKey)) return;
      try {
        const raw = localStorage.getItem("slideai-studio-projects-v1");
        const registry = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : [];
        const candidates = Array.isArray(registry) ? registry : [];
        const legacyRaw = localStorage.getItem("slideai-studio-local-project-v1");
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw) as Record<string, unknown>;
          if (!candidates.some((item) => JSON.stringify({ ...item, id: undefined, updatedAt: undefined }) === JSON.stringify(legacy))) {
            candidates.push({ ...legacy, id: uuid(), updatedAt: new Date().toISOString() });
          }
        }
        const normalized = candidates.filter((item) => item && typeof item === "object" && item.slides && typeof item.slides === "object").map((item) => {
          const id = typeof item.id === "string" && /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : uuid();
          return {
            id, user_id: user.id,
            title: typeof item.title === "string" ? item.title.slice(0, 120) : "Untitled presentation",
            description: typeof item.description === "string" ? item.description.slice(0, 500) : "",
            canvas_width: typeof item.canvasWidth === "number" ? item.canvasWidth : 1280,
            canvas_height: typeof item.canvasHeight === "number" ? item.canvasHeight : 720,
            project_data: item,
            updated_at: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
          };
        });
        if (!normalized.length) {
          localStorage.setItem(migrationKey, "done");
          return;
        }
        const ids = normalized.map((item) => item.id);
        const { data: existing, error: lookupError } = await supabase.from("presentations").select("id").in("id", ids);
        if (lookupError) throw lookupError;
        const existingIds = new Set((existing ?? []).map((item) => item.id));
        const missing = normalized.filter((item) => !existingIds.has(item.id));
        if (missing.length) {
          const { error } = await supabase.from("presentations").insert(missing);
          if (error) throw error;
        }
        if (!cancelled) {
          localStorage.setItem(migrationKey, "done");
          if (missing.length) setNotice(`${missing.length} locally saved presentation(s) imported to your cloud workspace.`);
          await loadWorkspace();
        }
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? `Local project import failed: ${error.message}` : "Local project import failed.");
      }
    };
    void importLocalProjects();
    return () => { cancelled = true; };
  }, [supabase, user, loadWorkspace]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthBusy(true); setAuthError(""); setAuthMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) setAuthMessage("Registration received. Check your email to confirm your account, then sign in.");
        else setAuthMessage("Your account is ready.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally { setAuthBusy(false); }
  }

  async function handleGoogleSignIn() {
    if (!supabase || authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/", window.location.origin).toString(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in could not be started.");
      setAuthBusy(false);
    }
  }

  function chooseFormat(next: CanvasFormat) {
    setFormat(next);
    if (next !== "custom") { setCanvasWidth(CANVAS_FORMATS[next].width); setCanvasHeight(CANVAS_FORMATS[next].height); }
  }

  async function createPresentation() {
    const id = uuid();
    const params = new URLSearchParams({
      blank: "1", projectId: id, width: String(canvasWidth), height: String(canvasHeight),
      background, title: newTitle.trim() || "Untitled presentation",
      description: newDescription.trim(),
    });
    window.location.href = "/studio?" + params.toString();
  }

  async function duplicatePresentation(project: PresentationRow) {
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("presentations").select("project_data").eq("id", project.id).single();
    if (error) { setNotice(error.message); return; }
    const copyId = uuid();
    const projectData = { ...(data.project_data ?? {}), title: (project.title || "Untitled presentation") + " copy" };
    const { error: insertError } = await supabase.from("presentations").insert({
      id: copyId, user_id: user.id, title: (project.title || "Untitled presentation") + " copy",
      description: project.description, canvas_width: project.canvas_width, canvas_height: project.canvas_height,
      folder_id: project.folder_id, project_data: projectData,
    });
    if (insertError) setNotice(insertError.message);
    else { setNotice("Presentation duplicated."); await loadWorkspace(); }
  }

  async function moveToTrash(project: PresentationRow) {
    if (!supabase || !window.confirm(`Move "${project.title}" to Trash?`)) return;
    const { error } = await supabase.from("presentations").update({ deleted_at: new Date().toISOString() }).eq("id", project.id);
    if (error) setNotice(error.message);
    else { setNotice("Moved to Trash. You can restore it later."); await loadWorkspace(); }
  }

  async function restorePresentation(project: PresentationRow) {
    if (!supabase) return;
    const { error } = await supabase.from("presentations").update({ deleted_at: null }).eq("id", project.id);
    if (error) setNotice(error.message);
    else { setNotice("Presentation restored."); await loadWorkspace(); }
  }

  async function permanentlyDelete(project: PresentationRow) {
    if (!supabase || !window.confirm(`Permanently delete "${project.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("presentations").delete().eq("id", project.id);
    if (error) setNotice(error.message);
    else { setNotice("Presentation permanently deleted."); await loadWorkspace(); }
  }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !folderName.trim() || folderBusy) return;
    setFolderBusy(true);
    const { error } = await supabase.from("presentation_folders").insert({ user_id: user.id, name: folderName.trim().slice(0, 60) });
    setFolderBusy(false);
    if (error) { setNotice(error.message); return; }
    setFolderName("");
    setFolderDialogOpen(false);
    setNotice("Klasör oluşturuldu.");
    await loadWorkspace();
  }

  async function movePresentation(project: PresentationRow, folderId: string) {
    if (!supabase) return;
    const { error } = await supabase.from("presentations").update({ folder_id: folderId || null }).eq("id", project.id);
    if (error) setNotice(error.message);
    else await loadWorkspace();
  }

  const visible = presentations.filter((item) => activeFolder === "all" || item.folder_id === activeFolder);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  if (!configured) return <main className="workspace-page"><section className="workspace-setup"><div className="workspace-brand"><span className="orvia-brand-icon">O</span> ORVIA<span>STUDIO</span></div><h1>Connect your Supabase project</h1><p>The cloud workspace is ready in the code, but this deployment needs its public Supabase URL and publishable key.</p><pre>NEXT_PUBLIC_SUPABASE_URL=…{"\n"}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…</pre><p>Add these in your local <code>apps/web/.env.local</code> file and in your hosting provider&apos;s environment variables, then restart/redeploy.</p><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ArrowUpRight size={14}/></a></section></main>;

  if (!authReady) return <main className="workspace-page"><div className="workspace-loading">Loading your workspace…</div></main>;

  if (!user) return <main className="workspace-page"><section className="workspace-auth">
    <Link href="/" className="workspace-brand"><span className="orvia-brand-icon">O</span> ORVIA<span>STUDIO</span></Link>
    <div className="workspace-auth-icon"><Presentation size={25}/></div><div className="orvia-auth-tag">CREATIVE WORKSPACE</div>
    <h1>{authMode === "signin" ? "Tekrar hoş geldiniz" : "Hesabınızı oluşturun"}</h1>
    <p>Sunumlarınızı güvenle saklayın, tasarımlarınıza her yerden erişin.</p>
    <button type="button" className="workspace-google-button" onClick={() => void handleGoogleSignIn()} disabled={authBusy}>
      <span className="workspace-google-mark" aria-hidden="true">G</span>
      {authBusy ? "Google bağlanıyor…" : "Google ile devam et"}
    </button>
    <div className="workspace-auth-divider"><span>veya e-posta ile devam et</span></div>
    <form onSubmit={handleAuth}>
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input type="password" minLength={8} autoComplete={authMode === "signin" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>
      {authError && <div className="workspace-alert error">{authError}</div>}
      {authMessage && <div className="workspace-alert">{authMessage}</div>}
      <button className="workspace-primary" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}</button>
    </form>
    <button className="workspace-auth-switch" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthMessage(""); }}>{authMode === "signin" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}</button>
    <Link href="/" className="workspace-back">Ana sayfaya dön</Link>
  </section></main>;

  return <main className="workspace-page">
    <aside className="workspace-sidebar">
      <Link href="/" className="workspace-brand"><span className="orvia-brand-icon">O</span> ORVIA<span>STUDIO</span></Link>
      <button className="workspace-new" onClick={() => void createPresentation()}><Plus size={17}/> New presentation</button>
      <div className="workspace-nav-label">WORKSPACE</div>
      <button className={!showTrash ? "workspace-nav active" : "workspace-nav"} onClick={() => { setShowTrash(false); setActiveFolder("all"); }}><Layers3 size={16}/> My presentations</button>
      <button className={showTrash ? "workspace-nav active" : "workspace-nav"} onClick={() => { setShowTrash(true); setActiveFolder("all"); }}><Trash2 size={16}/> Trash</button>
      {!showTrash && <><div className="workspace-nav-label workspace-folders-label">FOLDERS <button onClick={() => setFolderDialogOpen(true)} title="Create folder"><FolderPlus size={14}/></button></div>
        <button className={activeFolder === "all" ? "workspace-nav folder-nav active" : "workspace-nav folder-nav"} onClick={() => setActiveFolder("all")}><Folder size={15}/> All presentations</button>
        {folders.map((folder) => <button key={folder.id} className={activeFolder === folder.id ? "workspace-nav folder-nav active" : "workspace-nav folder-nav"} onClick={() => setActiveFolder(folder.id)}><Folder size={15}/> <span>{folder.name}</span></button>)}
      </>}
      <div className="workspace-sidebar-bottom"><div className="workspace-user"><div className="workspace-avatar">{(user.email?.[0] || "U").toUpperCase()}</div><div><strong>{user.email}</strong><span>Cloud workspace</span></div></div><button className="workspace-signout" onClick={() => { if (supabase) void supabase.auth.signOut(); }}><LogOut size={15}/> Sign out</button></div>
    </aside>
    <section className="workspace-main">
      <header className="workspace-topbar"><span>Workspace <i>/</i> {showTrash ? "Trash" : "My presentations"}</span><span className="workspace-cloud-status"><span/> {cloudStatus}</span></header>
      <div className="workspace-content">
        <div className="workspace-welcome"><div><div className="workspace-eyebrow">YOUR CREATIVE WORKSPACE</div><h1>{showTrash ? "Recently deleted" : "Your ideas, organized."}</h1><p>{showTrash ? "Deleted presentations stay here until you restore or permanently remove them." : "Your presentations are saved to your account and available across devices."}</p></div><button className="workspace-secondary" onClick={() => setFolderDialogOpen(true)}><FolderPlus size={15}/> New folder</button></div>
        {!showTrash && <section className="workspace-create"><div className="workspace-create-icon"><Plus size={20}/></div><div className="workspace-create-fields"><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Presentation name (optional)" maxLength={120}/><input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="Description (optional)" maxLength={500}/><select aria-label="Canvas format" value={format} onChange={(event) => chooseFormat(event.target.value as CanvasFormat)}><optgroup label="Presentations"><option value="landscape">Widescreen · 16:9</option><option value="presentation-4-3">Classic · 4:3</option></optgroup><optgroup label="Portrait & social"><option value="portrait">Portrait · 9:16</option><option value="portrait-3-4">Portrait · 3:4</option><option value="instagram-4-5">Social post · 4:5</option><option value="tiktok">TikTok / Reels · 9:16</option><option value="square">Square · 1:1</option></optgroup><optgroup label="Documents & print"><option value="a4">A4 · Portrait</option><option value="a4-landscape">A4 · Landscape</option><option value="letter">US Letter</option><option value="poster-2-3">Poster · 2:3</option></optgroup><optgroup label="Photo & custom"><option value="photo-3-2">Photo · 3:2</option><option value="custom">Custom size</option></optgroup></select><label className="workspace-color-field">Background <input type="color" value={background} onChange={(event) => setBackground(event.target.value)}/></label>{format === "custom" && <><input aria-label="Canvas width" type="number" min="320" max="4096" value={canvasWidth} onChange={(event) => setCanvasWidth(Math.max(320,Math.min(4096,Number(event.target.value)||320)))}/><input aria-label="Canvas height" type="number" min="320" max="4096" value={canvasHeight} onChange={(event) => setCanvasHeight(Math.max(320,Math.min(4096,Number(event.target.value)||320)))}/></>}</div><button className="workspace-primary workspace-create-button" onClick={() => void createPresentation()}>Create presentation <ArrowUpRight size={15}/></button></section>}
        {notice && <div className="workspace-alert">{notice}</div>}
        <div className="workspace-list-heading"><div><h2>{showTrash ? "Trash" : activeFolder === "all" ? "Recent presentations" : folders.find((f) => f.id === activeFolder)?.name || "Folder"}</h2><p>{loading ? "Loading…" : `${visible.length} ${visible.length === 1 ? "presentation" : "presentations"}`}</p></div><div className="workspace-list-meta"><Clock3 size={14}/> Sorted by last edited</div></div>
        {loading ? <div className="workspace-loading">Loading presentations…</div> : visible.length ? <div className="workspace-grid">{visible.map((project) => <article className="workspace-card" key={project.id}>
          <Link className="workspace-card-preview" href={showTrash ? "#" : `/studio?projectId=${encodeURIComponent(project.id)}`}>
            <SlidePreview
              canvasData={(() => { const data = project.project_data as {slides?:{id:number}[];canvasDataBySlide?:Record<string,string>;slideBackgrounds?:Record<string,string>;theme?:string} | undefined; const id = data?.slides?.[0]?.id; return id == null ? undefined : data?.canvasDataBySlide?.[String(id)]; })()}
              background={(() => { const data = project.project_data as {slides?:{id:number}[];slideBackgrounds?:Record<string,string>;theme?:string} | undefined; const id = data?.slides?.[0]?.id; return (id == null ? undefined : data?.slideBackgrounds?.[String(id)]) ?? (data?.theme==="blue"?"#102333":data?.theme==="violet"?"#171525":"#ffffff"); })()}
              width={project.canvas_width} height={project.canvas_height} title={project.title}
            />
          </Link>
          <div className="workspace-card-body"><div className="workspace-card-title"><strong>{project.title || "Untitled presentation"}</strong><span>{formatDate(project.updated_at)}</span></div>{project.description && <p>{project.description}</p>}
            <div className="workspace-card-actions">{showTrash ? <><button onClick={() => void restorePresentation(project)}><RotateCcw size={14}/> Restore</button><button className="danger" onClick={() => void permanentlyDelete(project)}><Trash2 size={14}/> Delete forever</button></> : <><Link href={`/studio?projectId=${encodeURIComponent(project.id)}`}>Open <ArrowUpRight size={13}/></Link><button title="Duplicate presentation" onClick={() => void duplicatePresentation(project)}><Copy size={14}/></button><button title="Move to trash" onClick={() => void moveToTrash(project)}><Trash2 size={14}/></button><select aria-label="Move to folder" value={project.folder_id || ""} onChange={(event) => void movePresentation(project, event.target.value)}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></>}</div>
          </div>
        </article>)}</div> : <div className="workspace-empty"><Presentation size={26}/><strong>{showTrash ? "Trash is empty" : "No presentations here yet"}</strong><span>{showTrash ? "Deleted presentations will appear here." : "Create your first presentation to get started."}</span></div>}
      </div>
    </section>
    {folderDialogOpen && <div className="orvia-modal-backdrop" onMouseDown={(event) => { if(event.target===event.currentTarget && !folderBusy)setFolderDialogOpen(false); }}>
      <section className="orvia-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="orvia-folder-title">
        <div className="orvia-dialog-icon"><FolderPlus size={24}/></div>
        <h2 id="orvia-folder-title">Yeni klasör oluştur</h2>
        <p>Sunumlarını projelere, müşterilere veya konulara göre düzenle.</p>
        <form onSubmit={(event)=>void createFolder(event)}>
          <label htmlFor="orvia-folder-name">Klasör adı</label>
          <input id="orvia-folder-name" autoFocus maxLength={60} placeholder="Örn. Marka sunumları" value={folderName} onChange={(event)=>setFolderName(event.target.value)} required/>
          <div className="orvia-dialog-actions"><button type="button" onClick={()=>setFolderDialogOpen(false)} disabled={folderBusy}>Vazgeç</button><button type="submit" disabled={folderBusy || !folderName.trim()}><FolderPlus size={16}/> {folderBusy?"Oluşturuluyor…":"Klasör oluştur"}</button></div>
        </form>
      </section>
    </div>}
  </main>;
}
