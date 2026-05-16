const jwt = require("jsonwebtoken");
const { db, safeUser } = require("../db/database");

const JWT_SECRET = process.env.JWT_SECRET || "taskflow_secret_dev_2024";

async function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ error: "User no longer exists." });
    req.user = safeUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  next();
}

async function projectAdmin(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (!projectId) return res.status(400).json({ error: "Invalid project ID." });
  if (req.user.role === "admin") return next();
  const membership = await db.members.findOne({ project_id: projectId, user_id: req.user._id });
  if (!membership) return res.status(403).json({ error: "You are not a member of this project." });
  if (membership.role !== "admin") return res.status(403).json({ error: "Project admin access required." });
  next();
}

async function projectMember(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (!projectId) return res.status(400).json({ error: "Invalid project ID." });
  if (req.user.role === "admin") return next();
  const membership = await db.members.findOne({ project_id: projectId, user_id: req.user._id });
  if (!membership) return res.status(403).json({ error: "You are not a member of this project." });
  req.projectRole = membership.role;
  next();
}

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { authenticate, adminOnly, projectAdmin, projectMember, generateToken };
