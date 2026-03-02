import { Navigate } from 'react-router-dom';

/** Registration is now handled inside the unified Login page. */
export default function Register() {
  return <Navigate to="/login" replace />;
}
