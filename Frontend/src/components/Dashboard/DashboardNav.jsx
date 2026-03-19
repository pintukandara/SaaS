import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { logout } from "../../utils/auth";

export const DashboardNav = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user data", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logout();
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Prodly
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <Link
                to="/dashboard"
                className={`font-medium transition ${
                  location.pathname === "/dashboard"
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                Dashboard
              </Link>
              {/* ✅ Add Tasks Link */}
              <Link
                to="/tasks"
                className={`font-medium transition ${
                  location.pathname.startsWith("/tasks")
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                Tasks
              </Link>
              <Link
                to="/teams"
                className={`font-medium transition ${
                  location.pathname === "/teams"
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                Teams
              </Link>
              <Link
                to="/departments"
                className={`font-medium transition ${
                  location.pathname === "/departments"
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                Departments
              </Link>

              <Link
                to="/projects"
                className={`font-medium transition ${
                  location.pathname === "/projects"
                    ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                Projects
              </Link>

              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.[0] || user?.username?.[0] || "U"}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.first_name || user?.username}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center space-x-2 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
export default DashboardNav;
