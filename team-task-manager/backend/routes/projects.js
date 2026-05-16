const express = require("express");
const router = express.Router();
const { db, safeUser } = require("../db/database");
const { authenticate, projectAdmin, projectMember } = require("../middleware/auth");

async function logActivity(userId, action, entityType, entityId, entityName, projectId = null) {
  await db.activity.insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, entity_name: entityName, project_id: projectId, created_at: new Date().toISOString() });
}

async function enrichProjects(projects, userId) {
  return Promise.all(projects.map(async (p) => {
    const owner = await db.users.findOne({ _id: p.owner_id });
    const memberCount = await db.members.count({ project_id: p._id });
    const taskCount = await db.tasks.count({ project_id: p._id });
    const doneCount = await db.tasks.count({ project_id: p._id, status: "done" });
    const myMembership = await db.members.findOne({ project_id: p._id, user_id: userId });
    return { ...p, owner_name: owner?.name, owner_color: owner?.avatar_color, member_count: memberCount, task_count: taskCount, done_count: doneCount, my_role: myMembership?.role };
  }));
}

router.get("/", authenticate, async (req, res) => {
  try {
    let projects;
    if (req.user.role === "admin") {
      projects = await db.projects.find({}).sort({ created_at: -1 });
    } else {
      const memberships = await db.members.find({ user_id: req.user._id });
      const ids = memberships.map(m => m.project_id);
      projects = await db.projects.find({ _id: { $in: ids } }).sort({ created_at: -1 });
    }
    const enriched = await enrichProjects(projects, req.user._id);
    res.json({ projects: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description, due_date } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: "Project name must be at least 2 characters." });
    const project = await db.projects.insert({ name: name.trim(), description: description || null, status: "active", owner_id: req.user._id, due_date: due_date || null, created_at: new Date().toISOString() });
    await db.members.insert({ project_id: project._id, user_id: req.user._id, role: "admin", joined_at: new Date().toISOString() });
    await logActivity(req.user._id, "created", "project", project._id, project.name);
    res.status(201).json({ message: "Project created.", project });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", authenticate, projectMember, async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: "Project not found." });
    const owner = await db.users.findOne({ _id: project.owner_id });
    const memberships = await db.members.find({ project_id: req.params.id });
    const members = (await Promise.all(memberships.map(async m => {
      const u = await db.users.findOne({ _id: m.user_id });
      return u ? { ...safeUser(u), role: m.role, joined_at: m.joined_at } : null;
    }))).filter(Boolean);
    const tasks = await db.tasks.find({ project_id: req.params.id }).sort({ created_at: -1 });
    const tasksEnriched = await Promise.all(tasks.map(async t => {
      const assignee = t.assigned_to ? await db.users.findOne({ _id: t.assigned_to }) : null;
      const creator = await db.users.findOne({ _id: t.created_by });
      return { ...t, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color, creator_name: creator?.name };
    }));
    res.json({ project: { ...project, owner_name: owner?.name, owner_color: owner?.avatar_color }, members, tasks: tasksEnriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id", authenticate, projectAdmin, async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: "Project not found." });
    const update = {};
    const { name, description, status, due_date } = req.body;
    if (name) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (status) update.status = status;
    if (due_date !== undefined) update.due_date = due_date;
    await db.projects.update({ _id: req.params.id }, { $set: update });
    await logActivity(req.user._id, "updated", "project", req.params.id, name || project.name, req.params.id);
    const updated = await db.projects.findOne({ _id: req.params.id });
    res.json({ message: "Project updated.", project: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", authenticate, projectAdmin, async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: "Project not found." });
    if (req.user.role !== "admin" && project.owner_id !== req.user._id) return res.status(403).json({ error: "Only owner can delete." });
    await db.projects.remove({ _id: req.params.id });
    await db.members.remove({ project_id: req.params.id }, { multi: true });
    await db.tasks.remove({ project_id: req.params.id }, { multi: true });
    res.json({ message: "Project deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/members", authenticate, projectMember, async (req, res) => {
  try {
    const memberships = await db.members.find({ project_id: req.params.id });
    const members = (await Promise.all(memberships.map(async m => {
      const u = await db.users.findOne({ _id: m.user_id });
      return u ? { ...safeUser(u), role: m.role, joined_at: m.joined_at } : null;
    }))).filter(Boolean);
    res.json({ members });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/members", authenticate, projectAdmin, async (req, res) => {
  try {
    const { user_id, role } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required." });
    const project = await db.projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: "Project not found." });
    const user = await db.users.findOne({ _id: user_id });
    if (!user) return res.status(404).json({ error: "User not found." });
    const existing = await db.members.findOne({ project_id: req.params.id, user_id });
    if (existing) return res.status(409).json({ error: "Already a member." });
    await db.members.insert({ project_id: req.params.id, user_id, role: role || "member", joined_at: new Date().toISOString() });
    await logActivity(req.user._id, "added member", "project", req.params.id, project.name, req.params.id);
    res.status(201).json({ message: `${user.name} added.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/:id/members/:userId", authenticate, projectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "member"].includes(role)) return res.status(400).json({ error: "Invalid role." });
    await db.members.update({ project_id: req.params.id, user_id: req.params.userId }, { $set: { role } });
    res.json({ message: "Role updated." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id/members/:userId", authenticate, projectAdmin, async (req, res) => {
  try {
    const project = await db.projects.findOne({ _id: req.params.id });
    if (req.params.userId === project.owner_id) return res.status(400).json({ error: "Cannot remove owner." });
    await db.members.remove({ project_id: req.params.id, user_id: req.params.userId });
    res.json({ message: "Member removed." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id/activity", authenticate, projectMember, async (req, res) => {
  try {
    const activity = await db.activity.find({ project_id: req.params.id }).sort({ created_at: -1 });
    const enriched = await Promise.all(activity.slice(0, 30).map(async a => {
      const u = await db.users.findOne({ _id: a.user_id });
      return { ...a, user_name: u?.name, avatar_color: u?.avatar_color };
    }));
    res.json({ activity: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
