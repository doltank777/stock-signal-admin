import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute() {
  const {
    isAuthenticated,
    initializing,
  } = useAuth();

  if (initializing) {
    return (
      <div className="auth-loading">
        인증 정보를 확인하고 있습니다.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;