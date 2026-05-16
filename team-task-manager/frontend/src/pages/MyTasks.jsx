import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import toast from "react-hot-toast";

const PRIORITY_COLORS = { low: "#94a3b8", medium: "#60a5fa", high: "#fbbf24", urgent: "#f87171" };
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", review: "Review", done: "Done" };

function formatDate(d) {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    api.getMyTasks(params)
      .then(d => setTasks(d.tasks))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter, priorityFilter]);

  async function updateStatus(taskId, status) {
    await api.updateTask(taskId, { status });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    toast.success("Status updated");
  }

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  const overdue = filtered.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done");
  const active = filtered.filter(t => t.status !== "done");
  const done = filtered.filter(t => t.status === "done");

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">You have no tasks matching these filters</div>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--danger)", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                ⚠ Overdue ({overdue.length})
              </h3>
              <TaskList tasks={overdue} onStatusChange={updateStatus} highlight="danger" />
            </section>
          )}

          {active.filter(t => !overdue.includes(t)).length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontWeight: 700, marginBottom: 12 }}>
                Active ({active.filter(t => !overdue.includes(t)).length})
              </h3>
              <TaskList tasks={active.filter(t => !overdue.includes(t))} onStatusChange={updateStatus} />
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h3 style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontWeight: 700, marginBottom: 12 }}>
                Completed ({done.length})
              </h3>
              <TaskList tasks={done} onStatusChange={updateStatus} dimmed />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TaskList({ tasks, onStatusChange, highlight, dimmed }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {tasks.map(task => {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
        return (
          <div key={task.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, opacity: dimmed ? 0.6 : 1, borderLeft: highlight === "danger" ? "3px solid var(--danger)" : undefined }}>
            {/* Status selector */}
            <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
              style={{ width: "auto", padding: "5px 10px", fontSize: "0.8rem", flexShrink: 0 }}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link to={`/tasks/${task.id}`} style={{ fontWeight: 500, fontSize: "0.92rem", color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {task.title}
                </Link>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Link to={`/projects/${task.project_id}`} style={{ fontSize: "0.78rem", color: "var(--primary-light)", textDecoration: "none" }}>
                  ◫ {task.project_name}
                </Link>
                <span style={{ fontSize: "0.78rem", color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>● {task.priority}</span>
              </div>
            </div>

            {task.due_date && (
              <span style={{ fontSize: "0.8rem", color: isOverdue ? "var(--danger)" : "var(--text3)", fontWeight: isOverdue ? 600 : 400, flexShrink: 0 }}>
                {isOverdue ? "⚠ " : ""}{formatDate(task.due_date)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
