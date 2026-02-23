import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { UserProvider } from './context/UseContext';
import Teams from "./pages/Teams";
import { isAuthenticated } from "./utils/auth";
import LandingPage from "./pages/LandingPage.jsx";
import { EmployeeDashboard } from "./pages/Dashboards/EmployeeDashboard.jsx";
import { ManagerDashboard } from "./pages/Dashboards/ManagerDashboard.jsx";
import Dashboard from "./pages/Dashboards.jsx";

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <LandingPage />;
}
function PublicRoute({ children }) {
  return !isAuthenticated() ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employeedashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/managerdashboard"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
