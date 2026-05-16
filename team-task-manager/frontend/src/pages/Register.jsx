import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (form.password !== form.confirm) return setErr("Passwords don't match.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success("Account created! Welcome to TaskFlow 🎉");
      navigate("/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="3" cy="6" r="1.5" fill="white" stroke="none"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem" }}>TaskFlow</span>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>Create account</h2>
            <p style={{ color: "var(--text2)", fontSize: "0.88rem" }}>Start managing projects with your team.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {err && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "10px 14px", color: "var(--danger)", fontSize: "0.88rem" }}>
                {err}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input type="text" placeholder="Jane Smith" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required minLength={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" placeholder="jane@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" placeholder="Min 6 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input type="password" placeholder="••••••••" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text3)", background: "var(--bg3)", padding: "10px 12px", borderRadius: "var(--radius)" }}>
              💡 The first account created is automatically assigned <strong style={{ color: "var(--primary-light)" }}>Admin</strong> role.
            </p>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4, justifyContent: "center" }}>
              {loading ? <><span className="spinner" /> Creating account...</> : "Create account"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, color: "var(--text3)", fontSize: "0.88rem", textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
