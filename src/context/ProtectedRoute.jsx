import { Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "./ContextProvider.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useStateContext();
  console.log("User role in ProtectedRoute:", user.role); // Debugging
  console.log("Allowed roles:", allowedRoles); // Debugging

  // Check if the user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />; // Redirect to dashboard or another page
  }

  return <Outlet />; // Render the child routes
}