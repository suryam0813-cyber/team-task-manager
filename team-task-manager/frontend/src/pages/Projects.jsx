import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ProjectModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || { name: "", description: "", due_date: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? "Edit Project" : "New Project"}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Website Redesign" required minLength={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this project about?" rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          {initial && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : (initial ? "Save changes" : "Create project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => api.getProjects().then(d => setProjects(d.projects)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function handleCreate(form) {
    const data = await api.createProject(form);
    toast.success("Project created!");
    setProjects(p => [data.project, ...p]);
  }

  async function handleEdit(form) {
    const data = await api.updateProject(editProject.id, form);
    toast.success("Project updated!");
    setProjects(p => p.map(pr => pr.id === editProject.id ? { ...pr, ...data.project } : pr));
    setEditProject(null);
  }

  async function handleDelete(project) {
    if (!confirm(`Delete "${project.name}"? This will also delete all tasks.`)) return;
    await api.deleteProject(project.id);
    toast.success("Project deleted.");
    setProjects(p => p.filter(pr => pr.id !== project.id));
  }

  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {["all", "active", "completed", "archived"].map(f => (
          <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && <span style={{ marginLeft: 6, fontSize: "0.78rem", color: "var(--text3)" }}>{projects.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◫</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-desc">Create your first project to get started</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(project => {
            const pct = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
            const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status === "active";
            const canEdit = user.role === "admin" || project.my_role === "admin";

            return (
              <div key={project.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14, transition: "border-color 0.2s", cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/projects/${project.id}`} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text)", display: "block", marginBottom: 4, textDecoration: "none" }}
                      onMouseEnter={e => e.target.style.color = "var(--primary-light)"}
                      onMouseLeave={e => e.target.style.color = "var(--text)"}>
                      {project.name}
                    </Link>
                    {project.description && <p style={{ fontSize: "0.83rem", color: "var(--text3)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{project.description}</p>}
                  </div>
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text3)", marginBottom: 6 }}>
                    <span>{project.done_count}/{project.task_count} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--primary)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text3)" }}>
                      👤 {project.member_count} member{project.member_count !== 1 ? "s" : ""}
                    </span>
                    {project.due_date && (
                      <span style={{ fontSize: "0.78rem", color: isOverdue ? "var(--danger)" : "var(--text3)", fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue ? "⚠ " : "📅 "}{formatDate(project.due_date)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm">Open</Link>
                    {canEdit && (
                      <>
                        <button className="btn-icon btn-sm" title="Edit" onClick={() => { setEditProject(project); }}>✎</button>
                        <button className="btn-icon btn-sm" title="Delete" style={{ color: "var(--danger)" }} onClick={() => handleDelete(project)}>🗑</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
      {editProject && <ProjectModal onClose={() => setEditProject(null)} onSave={handleEdit} initial={editProject} />}
    </div>
  );
}
