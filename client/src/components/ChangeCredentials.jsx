import React, { useState } from "react";

const API_URL = "http://localhost:5000";

const ChangeCredentials = () => {
  const [prevUsername, setPrevUsername] = useState("");
  const [prevPassword, setPrevPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle Credential Update
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validate input fields
    if (!prevUsername || !prevPassword || !newUsername || !newPassword) {
      setError("All fields are required.");
      setTimeout(() => setError(""), 2000); // Clear error after 2 seconds
      return;
    }

    try {
      // Step 1: Verify Previous Credentials
      const verifyResponse = await fetch(`${API_URL}/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(prevUsername),
          password: String(prevPassword),
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error("Verification failed:", errorData);
        throw new Error(errorData.message || "Invalid previous credentials.");
      }

      // Step 2: Update New Credentials
      const updateResponse = await fetch(`${API_URL}/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(newUsername),
          password: String(newPassword),
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("Update failed:", errorData);
        throw new Error(errorData.message || "Failed to update credentials.");
      }

      // Success message and reset fields
      setSuccessMessage("Credentials updated successfully! Redirecting...");
      setPrevUsername("");
      setPrevPassword("");
      setNewUsername("");
      setNewPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);

      // Clear error message after 2 seconds
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 my-30 mx-2">
      <div className="bg-white p-8 shadow-lg rounded-3xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">
          Change Admin Credentials
        </h2>

        {/* Error and Success Messages */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && (
          <p className="text-green-500 text-center mb-4">{successMessage}</p>
        )}

        {/* Form */}
        <form onSubmit={handleUpdateCredentials} className="space-y-6">
          {/* Previous Username Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Previous Username
            </label>
            <input
              type="text"
              placeholder="Enter Previous Username"
              value={prevUsername}
              onChange={(e) => setPrevUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Previous Password Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Previous Password
            </label>
            <input
              type="password"
              placeholder="Enter Previous Password"
              value={prevPassword}
              onChange={(e) => setPrevPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* New Username Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              New Username
            </label>
            <input
              type="text"
              placeholder="Enter New Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Update Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition"
          >
            Update Credentials
          </button>
        </form>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <div
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Back to Login
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeCredentials;