import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// FlashCard Component
const FlashCard = ({ message, onClose, type = "error" }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 p-4 rounded-lg text-white shadow-lg z-50 ${bgColor}`}
    >
      {message}
    </div>
  );
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState(null);
  const [adminPassword, setAdminPassword] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState("error");
  const navigate = useNavigate();

  const API_URL = process.env.VITE_API_URL;

  // Fetch admin credentials
  useEffect(() => {
    async function fetchAdminCredentials() {
      try {
        const response = await fetch(`${API_URL}/admin`);
        if (!response.ok) throw new Error("Failed to fetch admin credentials");

        const data = await response.json();
        setAdminUsername(String(data.username));
        setAdminPassword(String(data.password));
      } catch (error) {
        showFlashMessage(
          "Error fetching credentials. Please try again later.",
          "error"
        );
      }
    }

    fetchAdminCredentials();
  }, []);

  // Show flash message
  const showFlashMessage = (message, type = "error") => {
    setFlashMessage(message);
    setFlashType(type);
    setTimeout(() => setFlashMessage(null), 3000);
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();

    if (!adminUsername || !adminPassword) {
      showFlashMessage(
        "Admin credentials are not available. Please try again later.",
        "error"
      );
      return;
    }

    if (username == adminUsername.trim() && password == adminPassword.trim()) {
      localStorage.setItem("isAuthenticated", "true");
      showFlashMessage("Login successful! Redirecting...", "success");
      setTimeout(() => {
        navigate("/admin");
        window.location.reload();
      }, 1000);
    } else {
      showFlashMessage(
        "Invalid username or password. Please try again.",
        "error"
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {flashMessage && (
        <FlashCard
          message={flashMessage}
          onClose={() => setFlashMessage(null)}
          type={flashType}
        />
      )}

      <div className="bg-white p-8 shadow-lg rounded-3xl w-full max-w-md my-30 mx-2">
        <h2 className="text-4xl font-bold text-blue-600 text-center mb-6">
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="text"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md cursor-pointer"
          >
            Login
          </button>
        </form>

        {/* Change Credentials */}
        <div className="mt-6 text-center text-gray-500">
          <div
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => {
              window.location.href = "/login-change";
            }}
          >
            Change Credentials
          </div>
          <p className="my-2">Need help? Contact support</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
