const express = require("express");
const router = express.Router();
const { db, safeUser } = require("../db/database");
const { authenticate, projectMember } = require("../middleware/auth");

async function logActivity(userId, action, entityType, entityId, entityName, projectId = null) {
  await db.activity.insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, entity_name: entityName, project_id: projectId, created_at: new Date().toISOString() });
}

async function checkTaskAccess(req, res, next) {
  try {
    const task = await db.tasks.findOne({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: "Task not found." });
    req.task = task;
    req.params.projectId = task.project_id;
    if (req.user.role === "admin") return next();
    const membership = await db.members.findOne({ project_id: task.project_id, user_id: req.user._id });
    if (!membership) return res.status(403).json({ error: "Not a project member." });
    req.projectRole = membership.role;
    next();
  } catch (err) { res.status(500).json({ error: err.message }); }
}

// GET /api/tasks/my
router.get("/my", authenticate, async (req, res) => {
  try {
    const query = { assigned_to: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    const tasks = await db.tasks.find(query).sort({ created_at: -1 });
    const enriched = await Promise.all(tasks.map(async t => {
      const project = await db.projects.findOne({ _id: t.project_id });
      const assignee = await db.users.findOne({ _id: t.assigned_to });
      return { ...t, project_name: project?.name, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color };
    }));
    res.json({ tasks: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tasks/dashboard
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    let projectIds = [];
    if (!isAdmin) {
      const memberships = await db.members.find({ user_id: userId });
      projectIds = memberships.map(m => m.project_id);
    }

    const taskQuery = isAdmin ? {} : { project_id: { $in: projectIds } };
    const allTasks = await db.tasks.find(taskQuery);
    const myTasks = await db.tasks.find({ assigned_to: userId });
    const now = new Date().toISOString().split("T")[0];
    const overdue = myTasks.filter(t => t.due_date && t.due_date < now && t.status !== "done");

    // Status breakdown
    const statusMap = {};
    allTasks.forEach(t => { statusMap[t.status] = (statusMap[t.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Priority breakdown (my tasks)
    const priorityMap = {};
    myTasks.forEach(t => { priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1; });
    const byPriority = Object.entries(priorityMap).map(([priority, count]) => ({ priority, count }));

    // Recent activity
    const activityQuery = isAdmin ? {} : { project_id: { $in: projectIds } };
    const rawActivity = await db.activity.find(activityQuery).sort({ created_at: -1 });
    const recentActivity = await Promise.all(rawActivity.slice(0, 10).map(async a => {
      const u = await db.users.findOne({ _id: a.user_id });
      return { ...a, user_name: u?.name, avatar_color: u?.avatar_color };
    }));

    // Upcoming tasks
    const upcoming = myTasks
      .filter(t => t.status !== "done" && t.due_date)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
    const upcomingTasks = await Promise.all(upcoming.map(async t => {
      const p = await db.projects.findOne({ _id: t.project_id });
      return { ...t, project_name: p?.name };
    }));

    // Project stats
    const allProjects = isAdmin ? await db.projects.find({}) : await db.projects.find({ _id: { $in: projectIds } });
    const projectStats = { total: allProjects.length, active: allProjects.filter(p => p.status === "active").length, completed: allProjects.filter(p => p.status === "completed").length };

    res.json({ totalTasks: allTasks.length, myTasks: myTasks.length, overdue: overdue.length, byStatus, byPriority, recentActivity, upcomingTasks, projectStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tasks/project/:projectId
router.get("/project/:projectId", authenticate, projectMember, async (req, res) => {
  try {
    const query = { project_id: req.params.projectId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.assigned_to) query.assigned_to = req.query.assigned_to;
    const tasks = await db.tasks.find(query).sort({ created_at: -1 });
    const enriched = await Promise.all(tasks.map(async t => {
      const assignee = t.assigned_to ? await db.users.findOne({ _id: t.assigned_to }) : null;
      const creator = await db.users.findOne({ _id: t.created_by });
      return { ...t, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color, creator_name: creator?.name };
    }));
    res.json({ tasks: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tasks/project/:projectId
router.post("/project/:projectId", authenticate, projectMember, async (req, res) => {
  try {
    const { title, description, priority, assigned_to, due_date, status } = req.body;
    if (!title || title.trim().length < 2) return res.status(400).json({ error: "Title must be at least 2 chars." });
    const project = await db.projects.findOne({ _id: req.params.projectId });
    if (!project) return res.status(404).json({ error: "Project not found." });
    if (assigned_to) {
      const membership = await db.members.findOne({ project_id: req.params.projectId, user_id: assigned_to });
      if (!membership && req.user.role !== "admin") return res.status(400).json({ error: "Assignee must be a project member." });
    }
    const task = await db.tasks.insert({ title: title.trim(), description: description || null, status: status || "todo", priority: priority || "medium", project_id: req.params.projectId, assigned_to: assigned_to || null, created_by: req.user._id, due_date: due_date || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    await logActivity(req.user._id, "created task", "task", task._id, task.title, req.params.projectId);
    const assignee = task.assigned_to ? await db.users.findOne({ _id: task.assigned_to }) : null;
    const creator = await db.users.findOne({ _id: task.created_by });
    res.status(201).json({ message: "Task created.", task: { ...task, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color, creator_name: creator?.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tasks/:id
router.get("/:id", authenticate, checkTaskAccess, async (req, res) => {
  try {
    const task = req.task;
    const assignee = task.assigned_to ? await db.users.findOne({ _id: task.assigned_to }) : null;
    const creator = await db.users.findOne({ _id: task.created_by });
    const project = await db.projects.findOne({ _id: task.project_id });
    const rawComments = await db.comments.find({ task_id: task._id }).sort({ created_at: 1 });
    const comments = await Promise.all(rawComments.map(async c => {
      const u = await db.users.findOne({ _id: c.user_id });
      return { ...c, user_name: u?.name, avatar_color: u?.avatar_color };
    }));
    res.json({ task: { ...task, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color, creator_name: creator?.name, project_name: project?.name }, comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tasks/:id
router.patch("/:id", authenticate, checkTaskAccess, async (req, res) => {
  try {
    const task = req.task;
    if (req.projectRole === "member" && req.user.role !== "admin") {
      if (task.assigned_to !== req.user._id && task.created_by !== req.user._id) return res.status(403).json({ error: "You can only update tasks assigned to or created by you." });
    }
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const update = { updated_at: new Date().toISOString() };
    if (title) update.title = title.trim();
    if (description !== undefined) update.description = description;
    if (status) update.status = status;
    if (priority) update.priority = priority;
    if (assigned_to !== undefined) update.assigned_to = assigned_to || null;
    if (due_date !== undefined) update.due_date = due_date || null;
    await db.tasks.update({ _id: task._id }, { $set: update });
    await logActivity(req.user._id, `updated task`, "task", task._id, update.title || task.title, task.project_id);
    const updated = await db.tasks.findOne({ _id: task._id });
    const assignee = updated.assigned_to ? await db.users.findOne({ _id: updated.assigned_to }) : null;
    const creator = await db.users.findOne({ _id: updated.created_by });
    res.json({ message: "Task updated.", task: { ...updated, assignee_name: assignee?.name, assignee_color: assignee?.avatar_color, creator_name: creator?.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/tasks/:id
router.delete("/:id", authenticate, checkTaskAccess, async (req, res) => {
  try {
    const task = req.task;
    if (req.projectRole === "member" && req.user.role !== "admin" && task.created_by !== req.user._id) return res.status(403).json({ error: "Only task creator or project admin can delete." });
    await db.tasks.remove({ _id: task._id });
    await db.comments.remove({ task_id: task._id }, { multi: true });
    res.json({ message: "Task deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tasks/:id/comments
router.post("/:id/comments", authenticate, checkTaskAccess, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: "Comment required." });
    const comment = await db.comments.insert({ task_id: req.params.id, user_id: req.user._id, content: content.trim(), created_at: new Date().toISOString() });
    const u = await db.users.findOne({ _id: req.user._id });
    res.status(201).json({ comment: { ...comment, user_name: u?.name, avatar_color: u?.avatar_color } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/tasks/:id/comments/:commentId
router.delete("/:id/comments/:commentId", authenticate, checkTaskAccess, async (req, res) => {
  try {
    const comment = await db.comments.findOne({ _id: req.params.commentId, task_id: req.params.id });
    if (!comment) return res.status(404).json({ error: "Comment not found." });
    if (comment.user_id !== req.user._id && req.user.role !== "admin" && req.projectRole !== "admin") return res.status(403).json({ error: "Cannot delete others' comments." });
    await db.comments.remove({ _id: comment._id });
    res.json({ message: "Comment deleted." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
