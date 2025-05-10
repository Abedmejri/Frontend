import axiosClient from "./axios-client.js";

// Fetch all users
export const getUsers = () => {
  return axiosClient.get("/users");
};

// Fetch all permissions
export const fetchPermissions = () => {
  return axiosClient.get("/permissions");
};

// Delete a user
export const deleteUser = (userId) => {
  return axiosClient.delete(`/users/${userId}`);
};

// Update user role
export const updateUserRole = (userId, newRole) => {
  return axiosClient.put(`/users/${userId}`, { role: newRole });
};

// Update user permissions
export const updateUserPermissions = (userId, permissions) => {
  return axiosClient.put(`/users/${userId}`, { permissions });
};

// Create a new permission
export const createPermission = (permissionName) => {
  return axiosClient.post("/permissions", { name: permissionName });
};

// Delete a permission
export const deletePermission = (permissionId) => {
  return axiosClient.delete(`/permissions/${permissionId}`);
};


// Fetch all commissions (we'll filter client-side, or ideally have a backend endpoint for user's commissions)
export const getCommissions = () => {
  return axiosClient.get("/commissions");
};

// Fetch meetings for a specific commission
export const getMeetingsForCommission = (commissionId) => {
  return axiosClient.get(`/commissions/${commissionId}/meetings`);
};

export const getCurrentUser = () => {
  return axiosClient.get("/user"); // Example: /api/user or /api/auth/me
};
export const getMeetings = () => {
  return axiosClient.get("/meetings"); // Adjust endpoint if your route is different
};