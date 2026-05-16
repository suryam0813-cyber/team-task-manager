import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const PRIORITY_COLORS = { low: "#94a3b8", medium: "#60a5fa", high: "#fbbf24", urgent: "#f87171" };
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", review: "Review", done: "Done" };
const STATUS_COLORS = { todo: "#64748b", in_progress: "#3b82f6", review: "#a855f7", done: "#22c55e" };

function formatDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function timeAgo(d) {
  const secs = (Date.now() - new Date(d)) / 1000;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    api.getTask(id)
      .then(d => {
        setTask(d.task);
        setComments(d.comments);
        setEditForm({
          title: d.task.title,
          description: d.task.description || "",
          status: d.task.status,
          priority: d.task.priority,
          assigned_to: d.task.assigned_to || "",
          due_date: d.task.due_date || "",
        });
        // Load project members for assignee dropdown
        return api.getMembers(d.task.project_id);
      })
      .then(d => setProjectMembers(d.members))
      .catch(e => { toast.error(e.message); navigate(-1); })
      .finally(() => setLoading(false));
  }, [id]);

  async function postComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const data = await api.addComment(id, { content: comment.trim() });
      setComments(prev => [...prev, data.comment]);
      setComment("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(commentId) {
    await api.deleteComment(id, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      const payload = { ...editForm, assigned_to: editForm.assigned_to || null };
      const data = await api.updateTask(id, payload);
      setTask(data.task);
      setEditing(false);
      toast.success("Task updated!");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteTask() {
    if (!confirm("Delete this task permanently?")) return;
    await api.deleteTask(id);
    toast.success("Task deleted.");
    navigate(-1);
  }

  async function quickStatusChange(newStatus) {
    try {
      const data = await api.updateTask(id, { status: newStatus });
      setTask(data.task);
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return (
    <div className="page-body" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div className="spinner" style={{ width: 30, height: 30 }} />
    </div>
  );

  if (!task) return null;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  const canEdit = user.role === "admin" || task.created_by === user.id || task.assigned_to === user.id;
  const canDelete = user.role === "admin" || task.created_by === user.id;

  return (
    <div className="page-body" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: "0.82rem", color: "var(--text3)" }}>
        <Link to="/projects" style={{ color: "var(--text3)", textDecoration: "none" }}>Projects</Link>
        <span>/</span>
        <Link to={`/projects/${task.project_id}`} style={{ color: "var(--text3)", textDecoration: "none" }}>{task.project_name}</Link>
        <span>/</span>
        <span style={{ color: "var(--text2)" }}>Task #{task.id}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
        {/* Main content */}
        <div>
          {editing ? (
            <form onSubmit={saveEdit} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>Edit Task</h3>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assign to</label>
                  <select value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due date</label>
                  <input type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save changes</button>
              </div>
            </form>
          ) : (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.3, flex: 1 }}>
                  {task.title}
                </h1>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {canEdit && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✎ Edit</button>
                  )}
                  {canDelete && (
                    <button className="btn btn-danger btn-sm" onClick={deleteTask}>🗑</button>
                  )}
                </div>
              </div>

              {/* Status quick-move */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {["todo", "in_progress", "review", "done"].map(s => (
                  <button key={s} onClick={() => quickStatusChange(s)}
                    className="btn btn-sm"
                    style={{
                      background: task.status === s ? STATUS_COLORS[s] + "30" : "var(--bg4)",
                      color: task.status === s ? STATUS_COLORS[s] : "var(--text3)",
                      border: `1px solid ${task.status === s ? STATUS_COLORS[s] + "60" : "var(--border)"}`,
                      fontWeight: task.status === s ? 700 : 400,
                    }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              {task.description ? (
                <div style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
                  {task.description}
                </div>
              ) : (
                <p style={{ color: "var(--text3)", fontStyle: "italic", fontSize: "0.9rem" }}>No description provided.</p>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16, fontSize: "0.95rem" }}>
              Comments ({comments.length})
            </h3>

            {comments.length === 0 && (
              <p style={{ color: "var(--text3)", fontSize: "0.88rem", marginBottom: 16 }}>No comments yet. Be the first!</p>
            )}

            <div style={{ marginBottom: 20 }}>
              {comments.map(c => (
                <div key={c.id} className="comment">
                  <span className="avatar avatar-sm" style={{ background: c.avatar_color, color: "#fff", flexShrink: 0, marginTop: 2 }}>
                    {c.user_name[0]}
                  </span>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{c.user_name}</span>
                      <span className="comment-time">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                  {(c.user_id === user.id || user.role === "admin") && (
                    <button className="btn-icon btn-sm" style={{ color: "var(--text3)", flexShrink: 0 }} onClick={() => deleteComment(c.id)} title="Delete comment">✕</button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={postComment} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <span className="avatar avatar-sm" style={{ background: user.avatar_color, color: "#fff", flexShrink: 0, marginBottom: 2 }}>
                {user.name[0]}
              </span>
              <div style={{ flex: 1 }}>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  style={{ minHeight: 60 }}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) postComment(e); }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>Ctrl+Enter to submit</span>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !comment.trim()} style={{ marginBottom: 18 }}>
                {posting ? <span className="spinner" /> : "Post"}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontWeight: 700, marginBottom: 14 }}>
              Task Details
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Detail label="Status">
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[task.status], display: "inline-block" }} />
                  {STATUS_LABELS[task.status]}
                </span>
              </Detail>

              <Detail label="Priority">
                <span style={{ color: PRIORITY_COLORS[task.priority], fontSize: "0.88rem", fontWeight: 600 }}>
                  ● {task.priority}
                </span>
              </Detail>

              <Detail label="Assignee">
                {task.assignee_name ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="avatar avatar-sm" style={{ background: task.assignee_color, color: "#fff" }}>{task.assignee_name[0]}</span>
                    <span style={{ fontSize: "0.88rem" }}>{task.assignee_name}</span>
                  </div>
                ) : (
                  <span style={{ color: "var(--text3)", fontSize: "0.88rem" }}>Unassigned</span>
                )}
              </Detail>

              <Detail label="Created by">
                <span style={{ fontSize: "0.88rem" }}>{task.creator_name}</span>
              </Detail>

              <Detail label="Due date">
                <span style={{ fontSize: "0.88rem", color: isOverdue ? "var(--danger)" : "var(--text2)", fontWeight: isOverdue ? 600 : 400 }}>
                  {isOverdue && "⚠ "}{formatDate(task.due_date)}
                </span>
              </Detail>

              <Detail label="Created">
                <span style={{ fontSize: "0.88rem", color: "var(--text3)" }}>{formatDate(task.created_at)}</span>
              </Detail>

              <Detail label="Last updated">
                <span style={{ fontSize: "0.88rem", color: "var(--text3)" }}>{formatDate(task.updated_at)}</span>
              </Detail>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontWeight: 700, marginBottom: 12 }}>
              Project
            </h4>
            <Link to={`/projects/${task.project_id}`} style={{ color: "var(--primary-light)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              ◫ {task.project_name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text3)", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
