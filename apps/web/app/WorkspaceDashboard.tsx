"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, FolderPlus, Layers3, LogOut, Plus, RotateCcw, Trash2, Presentation, Clock3, Folder, Settings2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

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
    const [presentationResult, folderResult] = await Promise.all([
      supabase.from("presentations")
        .select("id,title,description,canvas_width,canvas_height,updated_at,created_at,folder_id,deleted_at")
        showTrash ? .not("deleted_at", "is", null) : .is("deleted_at", null)
        .order("updated_at", { ascending: false }),
      supabase.from("presentation_folders").select("id,name,created_at").order("name"),
    ]);
    if (presentationResult.error) setNotice(presentationResult.error.message);
    else setPresentations((presentationResult.data ?? []) as PresentationRow[]);
    if (folderResult.error) setNotice((current) => current || folderResult.error.message);
    else setFolders((folderResult.data ?? []) as FolderRow[]);
    setLoading(false);
  }, [supabase, user, showTrash]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

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

  async function createPresentation() {
    const id = uuid();
    const params = new URLSearchParams({
      blank: "1", projectId: id, width: "1280", height: "720",
      background: "#ffffff", title: newTitle.trim() || "Untitled presentation",
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

  async function createFolder() {
    if (!supabase || !user) return;
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const { error } = await supabase.from("presentation_folders").insert({ user_id: user.id, name: name.trim().slice(0, 60) });
    if (error) setNotice(error.message);
    else { setNotice("Folder created."); await loadWorkspace(); }
  }

  async function movePresentation(project: PresentationRow, folderId: string) {
    if (!supabase) return;
    const { error } = await supabase.from("presentations").update({ folder_id: folderId || null }).eq("id", project.id);
    if (error) setNotice(error.message);
    else await loadWorkspace();
  }

  const visible = presentations.filter((item) => activeFolder === "all" || item.folder_id === activeFolder);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  if (!configured) return <main className="workspace-page"><section className="workspace-setup"><div className="workspace-brand"><Layers3/> slideai studio</div><h1>Connect your Supabase project</h1><p>The cloud workspace is ready in the code, but this deployment needs its public Supabase URL and publishable key.</p><pre>NEXT_PUBLIC_SUPABASE_URL=…{"\n"}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…</pre><p>Add these in your local <code>apps/web/.env.local</code> file and in your hosting provider's environment variables, then restart/redeploy.</p><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ArrowUpRight size={14}/></a></section></main>;

  if (!authReady) return <main className="workspace-page"><div className="workspace-loading">Loading your workspace…</div></main>;

  if (!user) return <main className="workspace-page"><section className="workspace-auth">
    <Link href="/" className="workspace-brand"><Layers3/> slideai studio</Link>
    <div className="workspace-auth-icon"><Presentation size={25}/></div>
    <h1>{authMode === "signin" ? "Welcome back" : "Create your account"}</h1>
    <p>Sign in to save presentations to your account and access them from any device.</p>
    <form onSubmit={handleAuth}>
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input type="password" minLength={8} autoComplete={authMode === "signin" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>
      {authError && <div className="workspace-alert error">{authError}</div>}
      {authMessage && <div className="workspace-alert">{authMessage}</div>}
      <button className="workspace-primary" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}</button>
    </form>
    <button className="workspace-auth-switch" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthMessage(""); }}>{authMode === "signin" ? "New to SlideAI Studio? Create an account" : "Already have an account? Sign in"}</button>
    <Link href="/" className="workspace-back">Back to home</Link>
  </section></main>;

  return <main className="workspace-page">
    <aside className="workspace-sidebar">
      <Link href="/" className="workspace-brand"><span className="workspace-brand-mark"><Layers3 size={18}/></span> slideai<span>studio</span></Link>
      <button className="workspace-new" onClick={() => void createPresentation()}><Plus size={17}/> New presentation</button>
      <div className="workspace-nav-label">WORKSPACE</div>
      <button className={!showTrash ? "workspace-nav active" : "workspace-nav"} onClick={() => setShowTrash(false)}><Layers3 size={16}/> My presentations</button>
      <button className={showTrash ? "workspace-nav active" : "workspace-nav"} onClick={() => setShowTrash(true)}><Trash2 size={16}/> Trash</button>
      {!showTrash && <><div className="workspace-nav-label workspace-folders-label">FOLDERS <button onClick={() => void createFolder()} title="Create folder"><FolderPlus size={14}/></button></div>
        <button className={activeFolder === "all" ? "workspace-nav folder-nav active" : "workspace-nav folder-nav"} onClick={() => setActiveFolder("all")}><Folder size={15}/> All presentations</button>
        {folders.map((folder) => <button key={folder.id} className={activeFolder === folder.id ? "workspace-nav folder-nav active" : "workspace-nav folder-nav"} onClick={() => setActiveFolder(folder.id)}><Folder size={15}/> <span>{folder.name}</span></button>)}
      </>}
      <div className="workspace-sidebar-bottom"><div className="workspace-user"><div className="workspace-avatar">{(user.email?.[0] || "U").toUpperCase()}</div><div><strong>{user.email}</strong><span>Cloud workspace</span></div></div><button className="workspace-signout" onClick={() => void supabase.auth.signOut()}><LogOut size={15}/> Sign out</button></div>
    </aside>
    <section className="workspace-main">
      <header className="workspace-topbar"><span>Workspace <i>/</i> {showTrash ? "Trash" : "My presentations"}</span><span className="workspace-cloud-status"><span/> Cloud synced</span></header>
      <div className="workspace-content">
        <div className="workspace-welcome"><div><div className="workspace-eyebrow">YOUR CREATIVE WORKSPACE</div><h1>{showTrash ? "Recently deleted" : "Your ideas, organized."}</h1><p>{showTrash ? "Deleted presentations stay here until you restore or permanently remove them." : "Your presentations are saved to your account and available across devices."}</p></div><button className="workspace-secondary" onClick={() => void createFolder()}><FolderPlus size={15}/> New folder</button></div>
        {!showTrash && <section className="workspace-create"><div className="workspace-create-icon"><Plus size={20}/></div><div className="workspace-create-fields"><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Presentation name (optional)" maxLength={120}/><input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="Description (optional)" maxLength={500}/></div><button className="workspace-primary workspace-create-button" onClick={() => void createPresentation()}>Create presentation <ArrowUpRight size={15}/></button></section>}
        {notice && <div className="workspace-alert">{notice}</div>}
        <div className="workspace-list-heading"><div><h2>{showTrash ? "Trash" : activeFolder === "all" ? "Recent presentations" : folders.find((f) => f.id === activeFolder)?.name || "Folder"}</h2><p>{loading ? "Loading…" : `${visible.length} ${visible.length === 1 ? "presentation" : "presentations"}`}</p></div><div className="workspace-list-meta"><Clock3 size={14}/> Sorted by last edited</div></div>
        {loading ? <div className="workspace-loading">Loading presentations…</div> : visible.length ? <div className="workspace-grid">{visible.map((project) => <article className="workspace-card" key={project.id}>
          <Link className="workspace-card-preview" href={showTrash ? "#" : `/studio?projectId=${encodeURIComponent(project.id)}`}><div className="workspace-card-art"><Presentation size={36}/><span>{project.canvas_width} × {project.canvas_height}</span></div></Link>
          <div className="workspace-card-body"><div className="workspace-card-title"><strong>{project.title || "Untitled presentation"}</strong><span>{formatDate(project.updated_at)}</span></div>{project.description && <p>{project.description}</p>}
            <div className="workspace-card-actions">{showTrash ? <><button onClick={() => void restorePresentation(project)}><RotateCcw size={14}/> Restore</button><button className="danger" onClick={() => void permanentlyDelete(project)}><Trash2 size={14}/> Delete forever</button></> : <><Link href={`/studio?projectId=${encodeURIComponent(project.id)}`}>Open <ArrowUpRight size={13}/></Link><button title="Duplicate presentation" onClick={() => void duplicatePresentation(project)}><Copy size={14}/></button><button title="Move to trash" onClick={() => void moveToTrash(project)}><Trash2 size={14}/></button><select aria-label="Move to folder" value={project.folder_id || ""} onChange={(event) => void movePresentation(project, event.target.value)}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></>}</div>
          </div>
        </article>)}</div> : <div className="workspace-empty"><Presentation size={26}/><strong>{showTrash ? "Trash is empty" : "No presentations here yet"}</strong><span>{showTrash ? "Deleted presentations will appear here." : "Create your first presentation to get started."}</span></div>}
      </div>
    </section>
  </main>;
}
