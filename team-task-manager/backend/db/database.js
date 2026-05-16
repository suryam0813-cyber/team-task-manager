const Datastore = require("nedb-promises");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function store(name) {
  return Datastore.create({
    filename: path.join(DATA_DIR, `${name}.db`),
    autoload: true,
  });
}

const db = {
  users: store("users"),
  projects: store("projects"),
  members: store("members"),
  tasks: store("tasks"),
  comments: store("comments"),
  activity: store("activity"),
};

db.users.ensureIndex({ fieldName: "email", unique: true });

async function seed() {
  const bcrypt = require("bcryptjs");
  const count = await db.users.count({});
  if (count === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await db.users.insert({ name: "Admin User", email: "admin@taskflow.dev", password: hash, role: "admin", avatar_color: "#6366f1", created_at: new Date().toISOString() });
    const mhash = bcrypt.hashSync("member123", 10);
    await db.users.insert({ name: "Demo Member", email: "member@taskflow.dev", password: mhash, role: "member", avatar_color: "#22c55e", created_at: new Date().toISOString() });
    console.log("Seeded: admin@taskflow.dev / admin123 | member@taskflow.dev / member123");
  }
  console.log("Database ready");
}

seed().catch(console.error);

function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

module.exports = { db, safeUser };
