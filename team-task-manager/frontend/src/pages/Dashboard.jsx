import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(d) {
  const secs = (Date.now() - new Date(d)) / 1000;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const STATUS_COLORS = { todo: "#94a3b8", in_progress: "#60a5fa", review: "#c084fc", done: "#4ade80" };
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", review: "Review", done: "Done" };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
    </div>
  );

  const { totalTasks, myTasks, overdue, byStatus, byPriority, recentActivity, upcomingTasks, projectStats } = data || {};
  const statusMap = Object.fromEntries((byStatus || []).map(s => [s.status, s.count]));
  const done = statusMap["done"] || 0;
  const pct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {hour()}, {user?.name.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      {/* Stats grid */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--primary)" }}>
          <span className="stat-label">My Tasks</span>
          <span className="stat-value" style={{ color: "var(--primary-light)" }}>{myTasks ?? 0}</span>
          <span className="stat-sub">assigned to me</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--danger)" }}>
          <span className="stat-label">Overdue</span>
          <span className="stat-value" style={{ color: overdue > 0 ? "var(--danger)" : "var(--success)" }}>{overdue ?? 0}</span>
          <span className="stat-sub">need attention</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--success)" }}>
          <span className="stat-label">Projects</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>{projectStats?.active ?? 0}</span>
          <span className="stat-sub">active projects</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--info)" }}>
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value" style={{ color: "var(--info)" }}>{totalTasks ?? 0}</span>
          <span className="stat-sub">{pct}% completed</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16, fontSize: "0.95rem" }}>Task Status Breakdown</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text3)", marginBottom: 6 }}>
              <span>Overall completion</span><span>{pct}%</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {["todo", "in_progress", "review", "done"].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[s], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.88rem" }}>{STATUS_LABELS[s]}</span>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: STATUS_COLORS[s] }}>{statusMap[s] || 0}</span>
            </div>
          ))}
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16, fontSize: "0.95rem" }}>My Tasks by Priority</h3>
          {byPriority?.length === 0 && <p style={{ color: "var(--text3)", fontSize: "0.88rem" }}>No tasks assigned yet.</p>}
          {[
            { key: "urgent", label: "Urgent", color: "#f87171" },
            { key: "high", label: "High", color: "#fbbf24" },
            { key: "medium", label: "Medium", color: "#60a5fa" },
            { key: "low", label: "Low", color: "#94a3b8" },
          ].map(({ key, label, color }) => {
            const count = (byPriority || []).find(b => b.priority === key)?.count || 0;
            const max = Math.max(...(byPriority || []).map(b => b.count), 1);
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ width: 50, fontSize: "0.82rem", color: "var(--text3)" }}>{label}</span>
                <div style={{ flex: 1, height: 8, background: "var(--bg4)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
                </div>
                <span style={{ width: 24, fontSize: "0.88rem", fontWeight: 600, textAlign: "right", color }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Upcoming tasks */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Upcoming Deadlines</h3>
            <Link to="/tasks" style={{ fontSize: "0.8rem", color: "var(--primary-light)" }}>View all</Link>
          </div>
          {upcomingTasks?.length === 0 && <div className="empty-state" style={{ padding: 20 }}><p className="empty-desc">No upcoming tasks 🎉</p></div>}
          {upcomingTasks?.map(t => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date();
            return (
              <Link key={t.id} to={`/tasks/${t.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{t.project_name}</div>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isOverdue ? "var(--danger)" : "var(--text3)", flexShrink: 0 }}>
                  {isOverdue ? "⚠ " : ""}{formatDate(t.due_date)}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Activity feed */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Recent Activity</h3>
          </div>
          {recentActivity?.length === 0 && <div className="empty-state" style={{ padding: 20 }}><p className="empty-desc">No activity yet</p></div>}
          {recentActivity?.map(a => (
            <div key={a.id} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
              <span className="avatar avatar-sm" style={{ background: a.avatar_color, color: "#fff", flexShrink: 0, marginTop: 2 }}>
                {a.user_name[0]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{a.user_name}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text2)" }}> {a.action} </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--primary-light)" }}>{a.entity_name}</span>
                <div style={{ fontSize: "0.75rem", color: "var(--text3)", marginTop: 1 }}>{timeAgo(a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hour() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
