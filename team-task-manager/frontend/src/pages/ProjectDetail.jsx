import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const COLS = [
  { key: "todo", label: "To Do", color: "#64748b" },
  { key: "in_progress", label: "In Progress", color: "#3b82f6" },
  { key: "review", label: "Review", color: "#a855f7" },
  { key: "done", label: "Done", color: "#22c55e" },
];

const PRIORITY_COLORS = { low: "#94a3b8", medium: "#60a5fa", high: "#fbbf24", urgent: "#f87171" };
const PRIORITY_DOT = { low: "●", medium: "●", high: "●", urgent: "●" };

function formatDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskModal({ projectId, members, onClose, onSave, initial }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initial || { title: "", description: "", priority: "medium", status: "todo", assigned_to: "", due_date: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? "Edit Task" : "New Task"}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title" required minLength={2} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Optional details..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option><option value="in_progress">In Progress</option>
                <option value="review">Review</option><option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign to</label>
              <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : (initial ? "Update" : "Create task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, existingIds, onClose, onAdd }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getUsers(q).then(d => setUsers(d.users.filter(u => !existingIds.includes(u.id))));
  }, [q]);

  async function submit() {
    if (!selected) return;
    setLoading(true);
    try { await onAdd(selected.id, role); onClose(); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Team Member</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Search users</label>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email..." autoFocus />
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
            {users.length === 0 && <p style={{ padding: 16, color: "var(--text3)", fontSize: "0.88rem", textAlign: "center" }}>No users found</p>}
            {users.map(u => (
              <div key={u.id} onClick={() => setSelected(u)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: selected?.id === u.id ? "rgba(99,102,241,0.12)" : "transparent", transition: "background 0.15s" }}>
                <span className="avatar avatar-sm" style={{ background: u.avatar_color, color: "#fff" }}>{u.name[0]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{u.email}</div>
                </div>
                {selected?.id === u.id && <span style={{ color: "var(--primary-light)" }}>✓</span>}
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!selected || loading} onClick={submit}>
              {loading ? <><span className="spinner" /> Adding...</> : "Add member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("board");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [addMember, setAddMember] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("");

  const load = useCallback(() => {
    api.getProject(id).then(setData).catch(err => { toast.error(err.message); navigate("/projects"); }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="page-body" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><div className="spinner" style={{ width: 30, height: 30 }} /></div>;
  if (!data) return null;

  const { project, members, tasks } = data;
  const isAdmin = user.role === "admin" || members.find(m => m.id === user.id)?.role === "admin";
  const filteredTasks = filterAssignee ? tasks.filter(t => String(t.assigned_to) === filterAssignee) : tasks;

  async function createTask(form) {
    const d = await api.createTask(id, form);
    toast.success("Task created!");
    setData(prev => ({ ...prev, tasks: [d.task, ...prev.tasks] }));
  }

  async function updateTask(taskId, form) {
    const d = await api.updateTask(taskId, form);
    toast.success("Task updated!");
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? d.task : t) }));
  }

  async function deleteTask(taskId) {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(taskId);
    toast.success("Task deleted.");
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
  }

  async function addMemberToProject(userId, role) {
    await api.addMember(id, { user_id: userId, role });
    toast.success("Member added!");
    load();
  }

  async function removeMember(userId) {
    if (!confirm("Remove this member?")) return;
    await api.removeMember(id, userId);
    toast.success("Member removed.");
    load();
  }

  async function quickStatus(taskId, newStatus) {
    await api.updateTask(taskId, { status: newStatus });
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) }));
  }

  const pct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0;

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/projects" style={{ fontSize: "0.82rem", color: "var(--text3)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12, textDecoration: "none" }}>
          ← Projects
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 className="page-title">{project.name}</h1>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </div>
            {project.description && <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>{project.description}</p>}
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.82rem", color: "var(--text3)" }}>
              <span>👥 {members.length} members</span>
              <span>📋 {tasks.length} tasks ({pct}% done)</span>
              {project.due_date && <span>📅 Due {formatDate(project.due_date)}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && <button className="btn btn-secondary" onClick={() => setAddMember(true)}>+ Member</button>}
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Task</button>
          </div>
        </div>
        {/* Progress */}
        <div style={{ marginTop: 14 }}>
          <div className="progress" style={{ height: 4 }}>
            <div className="progress-bar" style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--primary)" }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["board", "list", "members"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "members" && <span style={{ marginLeft: 5, fontSize: "0.78rem" }}>{members.length}</span>}
          </button>
        ))}
      </div>

      {/* Filter */}
      {(tab === "board" || tab === "list") && (
        <div className="filter-bar">
          <label style={{ fontSize: "0.82rem", color: "var(--text3)" }}>Assignee:</label>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ width: "auto" }}>
            <option value="">All</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {/* Board view */}
      {tab === "board" && (
        <div className="kanban-board">
          {COLS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-header">
                  <div className="kanban-title">
                    <span style={{ color: col.color }}>●</span>
                    {col.label}
                  </div>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>
                <div className="kanban-cards">
                  {colTasks.map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
                    return (
                      <div key={task.id} className="task-card">
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                          <Link to={`/tasks/${task.id}`} className="task-card-title" style={{ flex: 1, color: "var(--text)", textDecoration: "none" }}>{task.title}</Link>
                          {isAdmin && <button className="btn-icon" style={{ padding: 2, color: "var(--text3)", flexShrink: 0 }} onClick={() => { setEditTask(task); }}>✎</button>}
                        </div>
                        <div className="task-card-meta">
                          <span style={{ color: PRIORITY_COLORS[task.priority], fontSize: "0.78rem", fontWeight: 600 }}>
                            {PRIORITY_DOT[task.priority]} {task.priority}
                          </span>
                          {task.due_date && (
                            <span style={{ fontSize: "0.75rem", color: isOverdue ? "var(--danger)" : "var(--text3)" }}>
                              {isOverdue ? "⚠" : "📅"} {formatDate(task.due_date)}
                            </span>
                          )}
                          {task.assignee_name && (
                            <span className="avatar avatar-sm" style={{ background: task.assignee_color || "#6366f1", color: "#fff" }} title={task.assignee_name}>
                              {task.assignee_name[0]}
                            </span>
                          )}
                        </div>
                        {/* Quick status move */}
                        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                          {COLS.filter(c => c.key !== col.key).map(c => (
                            <button key={c.key} className="btn btn-ghost btn-sm" style={{ fontSize: "0.7rem", padding: "3px 7px", color: "var(--text3)" }}
                              onClick={() => quickStatus(task.id, c.key)}>
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", color: "var(--text3)", border: "1px dashed var(--border)", marginTop: 2 }}
                    onClick={() => { setShowTaskModal(true); }}>
                    + Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {tab === "list" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filteredTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-title">No tasks</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
                    return (
                      <tr key={task.id}>
                        <td>
                          <Link to={`/tasks/${task.id}`} style={{ fontWeight: 500, color: "var(--text)", textDecoration: "none" }}>{task.title}</Link>
                          {task.description && <div style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{task.description}</div>}
                        </td>
                        <td><span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span></td>
                        <td><span style={{ color: PRIORITY_COLORS[task.priority], fontSize: "0.85rem", fontWeight: 600 }}>● {task.priority}</span></td>
                        <td>{task.assignee_name ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span className="avatar avatar-sm" style={{ background: task.assignee_color, color: "#fff" }}>{task.assignee_name[0]}</span><span style={{ fontSize: "0.85rem" }}>{task.assignee_name}</span></div> : <span style={{ color: "var(--text3)", fontSize: "0.85rem" }}>—</span>}</td>
                        <td><span style={{ fontSize: "0.85rem", color: isOverdue ? "var(--danger)" : "var(--text2)", fontWeight: isOverdue ? 600 : 400 }}>{formatDate(task.due_date) || "—"}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            {isAdmin && <button className="btn-icon btn-sm" onClick={() => setEditTask(task)}>✎</button>}
                            {isAdmin && <button className="btn-icon btn-sm" style={{ color: "var(--danger)" }} onClick={() => deleteTask(task.id)}>🗑</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr><th>Member</th><th>Email</th><th>Role</th><th>Joined</th>{isAdmin && <th></th>}</tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="avatar avatar-md" style={{ background: m.avatar_color, color: "#fff" }}>{m.name[0]}</span><span style={{ fontWeight: 500 }}>{m.name}{m.id === user.id && " (you)"}</span></div></td>
                  <td style={{ color: "var(--text2)", fontSize: "0.88rem" }}>{m.email}</td>
                  <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                  <td style={{ color: "var(--text3)", fontSize: "0.85rem" }}>{formatDate(m.joined_at)}</td>
                  {isAdmin && (
                    <td>
                      {m.id !== user.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTaskModal && <TaskModal projectId={id} members={members} onClose={() => setShowTaskModal(false)} onSave={createTask} />}
      {editTask && <TaskModal projectId={id} members={members} onClose={() => setEditTask(null)} onSave={async form => { await updateTask(editTask.id, form); setEditTask(null); }} initial={editTask} />}
      {addMember && <AddMemberModal projectId={id} existingIds={members.map(m => m.id)} onClose={() => setAddMember(false)} onAdd={addMemberToProject} />}
    </div>
  );
}
