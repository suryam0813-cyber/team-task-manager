const express = require("express");
const router = express.Router();
const { db, safeUser } = require("../db/database");
const { authenticate, adminOnly } = require("../middleware/auth");

// GET /api/users
router.get("/", authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    let users = await db.users.find({}).sort({ name: 1 });
    if (q) {
      const lq = q.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(lq) || u.email.toLowerCase().includes(lq));
    }
    res.json({ users: users.map(safeUser) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/stats
router.get("/stats", authenticate, adminOnly, async (req, res) => {
  try {
    const totalUsers = await db.users.count({});
    const totalProjects = await db.projects.count({});
    const totalTasks = await db.tasks.count({});
    const completedTasks = await db.tasks.count({ status: "done" });
    const activeProjects = await db.projects.count({ status: "active" });
    const now = new Date().toISOString().split("T")[0];
    const allOverdue = await db.tasks.find({ status: { $ne: "done" } });
    const overdueTasks = allOverdue.filter(t => t.due_date && t.due_date < now).length;

    const allUsers = await db.users.find({});
    const userActivity = await Promise.all(allUsers.map(async u => {
      const project_count = await db.members.count({ user_id: u._id });
      const task_count = await db.tasks.count({ assigned_to: u._id });
      return { ...safeUser(u), project_count, task_count };
    }));
    userActivity.sort((a, b) => b.task_count - a.task_count);

    res.json({ totalUsers, totalProjects, totalTasks, completedTasks, activeProjects, overdueTasks, userActivity });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found." });
    const tasks = await db.tasks.find({ assigned_to: req.params.id }).sort({ due_date: 1 });
    const tasksEnriched = await Promise.all(tasks.slice(0, 10).map(async t => {
      const p = await db.projects.findOne({ _id: t.project_id });
      return { ...t, project_name: p?.name };
    }));
    res.json({ user: safeUser(user), tasks: tasksEnriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/users/:id/role
router.patch("/:id/role", authenticate, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "Invalid role." });
    if (req.params.id === req.user._id) return res.status(400).json({ error: "Cannot change your own role." });
    await db.users.update({ _id: req.params.id }, { $set: { role } });
    res.json({ message: "Role updated." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id) return res.status(400).json({ error: "Cannot delete yourself." });
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: "User not found." });
    await db.users.remove({ _id: req.params.id });
    await db.members.remove({ user_id: req.params.id }, { multi: true });
    res.json({ message: "User deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
