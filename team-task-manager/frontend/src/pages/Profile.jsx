import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import toast from "react-hot-toast";

const COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e",
  "#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#06b6d4","#64748b","#84cc16",
];

export default function Profile() {
  const { user, setUser, refreshUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ name: user.name, avatar_color: user.avatar_color });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const preview = form.name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || initials;

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.updateProfile({ name: form.name, avatar_color: form.avatar_color });
      setUser(data.user);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    try {
      await api.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="page-body" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>
      </div>

      {/* Profile preview */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "20px 24px" }}>
        <span className="avatar avatar-xl" style={{ background: form.avatar_color, color: "#fff" }}>
          {preview || initials}
        </span>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>{form.name || user.name}</div>
          <div style={{ color: "var(--text3)", fontSize: "0.88rem" }}>{user.email}</div>
          <span className={`badge badge-${user.role}`} style={{ marginTop: 4 }}>{user.role}</span>
        </div>
      </div>

      <div className="tabs">
        {["profile", "password"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "profile" ? "Profile" : "Change Password"}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required minLength={2} />
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input value={user.email} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
              <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>Email cannot be changed.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Avatar color</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                {COLORS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", background: c,
                      border: form.avatar_color === c ? "3px solid white" : "3px solid transparent",
                      boxShadow: form.avatar_color === c ? `0 0 0 2px ${c}` : "none",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "password" && (
        <div className="card">
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input type="password" value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required placeholder="Enter current password" />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input type="password" value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={6} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required placeholder="Repeat new password" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                {pwSaving ? <><span className="spinner" /> Updating...</> : "Update password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account info */}
      <div className="card" style={{ marginTop: 20 }}>
        <h4 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontWeight: 700, marginBottom: 14 }}>Account Info</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Account ID", value: `#${user.id}` },
            { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { label: "Member since", value: new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text3)" }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
