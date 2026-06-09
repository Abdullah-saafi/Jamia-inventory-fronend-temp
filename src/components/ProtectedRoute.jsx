import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/authContext"

const ProtectedRoute = ({ allowedRoles }) => {
  const { auth, loading } = useAuth()

  if (loading) return <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
  </div>
  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={"/unauthorized"} replace />
  }
  return <Outlet />
}

export default ProtectedRoute