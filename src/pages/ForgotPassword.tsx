import { Navigate } from 'react-router-dom';

/** Forgot password is now handled inside the unified Login page. */
export default function ForgotPassword() {
  return <Navigate to="/login" replace />;
}
