import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  { to: "/", label: "Dashboard", icon: "⊞", end: true },
  { to: "/projects", label: "Projects", icon: "◫" },
  { to: "/tasks", label: "My Tasks", icon: "✓" },
  { to: "/team", label: "Team", icon: "◎" },
];

function Avatar({ user, size = "md" }) {
  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <span className={`avatar avatar-${size}`} style={{ background: user.avatar_color, color: "#fff" }}>
      {initials}
    </span>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success("Logged out");
    navigate("/login");
  }

  return (
    <aside style={{
      width: "var(--sidebar-w)", position: "fixed", top: 0, left: 0, bottom: 0,
      background: "var(--bg2)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", zIndex: 50, padding: "0 0 16px",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="3" cy="6" r="1.5" fill="white" stroke="none"/>
              <circle cx="3" cy="12" r="1.5" fill="white" stroke="none"/>
              <circle cx="3" cy="18" r="1.5" fill="white" stroke="none"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
            TaskFlow
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to} to={item.to} end={item.end}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: "var(--radius)",
              fontSize: "0.9rem", fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--primary-light)" : "var(--text2)",
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              transition: "all 0.15s",
              textDecoration: "none",
            })}
          >
            <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <div style={{ margin: "8px 0 4px 12px", fontSize: "0.7rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Admin
          </div>
        )}
        {user?.role === "admin" && (
          <NavLink
            to="/team"
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: "var(--radius)",
              fontSize: "0.9rem", fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--primary-light)" : "var(--text2)",
              background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              transition: "all 0.15s", textDecoration: "none",
            })}
          >
            <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>⚙</span>
            Manage Users
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <NavLink to="/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius)", textDecoration: "none", transition: "background 0.15s" }}
          className="user-nav-link">
          <Avatar user={user} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
              <span className={`badge badge-${user?.role}`} style={{ padding: "1px 6px", fontSize: "0.68rem" }}>{user?.role}</span>
            </div>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 6, color: "var(--text3)" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export { Avatar };
