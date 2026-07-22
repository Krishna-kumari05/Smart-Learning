import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Wraps any route that should only be reachable once a user is logged in.
export default function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}
