import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function timeAgo(d) {
  if (!d) return "—";
  const secs = (Date.now() - new Date(d)) / 1000;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.getUsers(),
      user.role === "admin" ? api.getUserStats() : Promise.resolve(null),
    ]).then(([ud, sd]) => {
      setUsers(ud.users);
      if (sd) setStats(sd);
    }).catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(userId, newRole) {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      setUsers(prev => prev.filter(usr => usr.id !== u.id));
      toast.success("User deleted.");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#22c55e","#14b8a6","#3b82f6"];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} members in your organization</p>
        </div>
      </div>

      {/* Admin stats */}
      {user.role === "admin" && stats && (
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card" style={{ borderLeft: "3px solid var(--primary)" }}>
            <span className="stat-label">Total Users</span>
            <span className="stat-value" style={{ color: "var(--primary-light)" }}>{stats.totalUsers}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid var(--success)" }}>
            <span className="stat-label">Active Projects</span>
            <span className="stat-value" style={{ color: "var(--success)" }}>{stats.activeProjects}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid var(--info)" }}>
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value" style={{ color: "var(--info)" }}>{stats.totalTasks}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid var(--danger)" }}>
            <span className="stat-label">Overdue Tasks</span>
            <span className="stat-value" style={{ color: stats.overdueTasks > 0 ? "var(--danger)" : "var(--success)" }}>{stats.overdueTasks}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 1, maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(u => {
            const statsUser = stats?.userActivity?.find(s => s.id === u.id);
            return (
              <div key={u.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span className="avatar avatar-lg" style={{ background: u.avatar_color, color: "#fff" }}>
                    {u.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{u.name}</span>
                      {u.id === user.id && <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    <span className={`badge badge-${u.role}`} style={{ marginTop: 4 }}>{u.role}</span>
                  </div>
                </div>

                {statsUser && (
                  <div style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-light)" }}>{statsUser.project_count}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text3)" }}>Projects</div>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--info)" }}>{statsUser.task_count}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text3)" }}>Tasks</div>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--text2)" }}>{timeAgo(u.created_at)}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text3)" }}>Joined</div>
                    </div>
                  </div>
                )}

                {user.role === "admin" && u.id !== user.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => changeRole(u.id, u.role === "admin" ? "member" : "admin")}>
                      Make {u.role === "admin" ? "Member" : "Admin"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <div className="empty-title">No members found</div>
          <div className="empty-desc">Try a different search</div>
        </div>
      )}
    </div>
  );
}
