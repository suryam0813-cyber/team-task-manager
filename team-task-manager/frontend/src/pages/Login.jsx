import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    if (role === "admin") setForm({ email: "admin@taskflow.dev", password: "admin123" });
    else setForm({ email: "member@taskflow.dev", password: "member123" });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      {/* Left: branding */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 48, background: "linear-gradient(135deg, #0d0e12 0%, #13141a 100%)",
        borderRight: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3" cy="6" r="1.5" fill="white" stroke="none"/><circle cx="3" cy="12" r="1.5" fill="white" stroke="none"/><circle cx="3" cy="18" r="1.5" fill="white" stroke="none"/>
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem" }}>TaskFlow</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Manage projects.<br />
            <span style={{ color: "var(--primary-light)" }}>Ship faster.</span>
          </h1>
          <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 40, fontSize: "0.95rem" }}>
            Collaborate on projects, assign tasks, and track your team's progress — all in one place.
          </p>

          {[
            { icon: "◫", label: "Project management", desc: "Create and organize projects with your team" },
            { icon: "✓", label: "Task tracking", desc: "Kanban board with priorities and due dates" },
            { icon: "◎", label: "Role-based access", desc: "Admin and member permissions built-in" },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0, color: "var(--primary-light)" }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{f.label}</div>
                <div style={{ color: "var(--text3)", fontSize: "0.83rem" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div style={{ width: 420, display: "flex", flexDirection: "column", justifyContent: "center", padding: 48 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Welcome back! Let's get to work.</p>
        </div>

        {/* Demo accounts */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14, marginBottom: 24 }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick demo access</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fillDemo("admin")} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Admin account</button>
            <button onClick={() => fillDemo("member")} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Member account</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {err && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "10px 14px", color: "var(--danger)", fontSize: "0.88rem" }}>
              {err}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8, justifyContent: "center" }}>
            {loading ? <><span className="spinner" /> Signing in...</> : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 24, color: "var(--text3)", fontSize: "0.88rem", textAlign: "center" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--primary-light)", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
