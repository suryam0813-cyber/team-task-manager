const BASE_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("tf_token");
}

async function request(method, path, body = null) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== "GET") opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request("POST", "/auth/register", body),
  login: (body) => request("POST", "/auth/login", body),
  me: () => request("GET", "/auth/me"),
  updateProfile: (body) => request("PATCH", "/auth/profile", body),
  changePassword: (body) => request("PATCH", "/auth/password", body),

  // Projects
  getProjects: () => request("GET", "/projects"),
  createProject: (body) => request("POST", "/projects", body),
  getProject: (id) => request("GET", `/projects/${id}`),
  updateProject: (id, body) => request("PATCH", `/projects/${id}`, body),
  deleteProject: (id) => request("DELETE", `/projects/${id}`),

  // Project Members
  getMembers: (projectId) => request("GET", `/projects/${projectId}/members`),
  addMember: (projectId, body) => request("POST", `/projects/${projectId}/members`, body),
  updateMember: (projectId, userId, body) => request("PATCH", `/projects/${projectId}/members/${userId}`, body),
  removeMember: (projectId, userId) => request("DELETE", `/projects/${projectId}/members/${userId}`),
  getActivity: (projectId) => request("GET", `/projects/${projectId}/activity`),

  // Tasks
  getMyTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/tasks/my${q ? "?" + q : ""}`);
  },
  getDashboard: () => request("GET", "/tasks/dashboard"),
  getProjectTasks: (projectId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/tasks/project/${projectId}${q ? "?" + q : ""}`);
  },
  createTask: (projectId, body) => request("POST", `/tasks/project/${projectId}`, body),
  getTask: (id) => request("GET", `/tasks/${id}`),
  updateTask: (id, body) => request("PATCH", `/tasks/${id}`, body),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
  addComment: (taskId, body) => request("POST", `/tasks/${taskId}/comments`, body),
  deleteComment: (taskId, commentId) => request("DELETE", `/tasks/${taskId}/comments/${commentId}`),

  // Users
  getUsers: (q = "") => request("GET", `/users${q ? "?q=" + q : ""}`),
  getUserStats: () => request("GET", "/users/stats"),
  updateUserRole: (id, role) => request("PATCH", `/users/${id}/role`, { role }),
  deleteUser: (id) => request("DELETE", `/users/${id}`),
};
