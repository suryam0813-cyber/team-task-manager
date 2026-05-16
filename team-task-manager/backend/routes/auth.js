const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { db, safeUser } = require("../db/database");
const { generateToken, authenticate } = require("../middleware/auth");

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#06b6d4"];

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required." });
    if (name.trim().length < 2) return res.status(400).json({ error: "Name must be at least 2 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const existing = await db.users.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });

    const count = await db.users.count({});
    const role = count === 0 ? "admin" : "member";
    const hash = bcrypt.hashSync(password, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const user = await db.users.insert({ name: name.trim(), email: email.toLowerCase(), password: hash, role, avatar_color: color, created_at: new Date().toISOString() });
    const token = generateToken(user);
    res.status(201).json({ message: "Account created.", token, user: safeUser(user) });
  } catch (err) {
    if (err.errorType === "uniqueViolated") return res.status(409).json({ error: "Email already exists." });
    res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required." });
    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid email or password." });
    const token = generateToken(user);
    res.json({ message: "Login successful.", token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));

router.patch("/profile", authenticate, async (req, res) => {
  try {
    const { name, avatar_color } = req.body;
    if (name && name.trim().length < 2) return res.status(400).json({ error: "Name too short." });
    const update = {};
    if (name) update.name = name.trim();
    if (avatar_color) update.avatar_color = avatar_color;
    if (!Object.keys(update).length) return res.status(400).json({ error: "Nothing to update." });
    await db.users.update({ _id: req.user._id }, { $set: update });
    const updated = await db.users.findOne({ _id: req.user._id });
    res.json({ user: safeUser(updated) });
  } catch (err) { res.status(500).json({ error: "Update failed." }); }
});

router.patch("/password", authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: "Both passwords required." });
    if (new_password.length < 6) return res.status(400).json({ error: "New password min 6 chars." });
    const user = await db.users.findOne({ _id: req.user._id });
    if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: "Current password incorrect." });
    await db.users.update({ _id: req.user._id }, { $set: { password: bcrypt.hashSync(new_password, 10) } });
    res.json({ message: "Password updated." });
  } catch (err) { res.status(500).json({ error: "Failed." }); }
});

module.exports = router;
