import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Track authentication status using localStorage
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
    };

    checkAuth();
    window.addEventListener("storage", checkAuth); // Listen for storage changes across tabs

    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white py-4 px-2 fixed top-0 left-0 w-full shadow-lg z-20">
      <div className="md:container mx-auto flex justify-between items-center">
        {/* Logo with Click to Navigate */}
        <div
          className="text-2xl font-bold text-blue-400 transition-all duration-300 cursor-pointer flex gap-2 items-center"
          onClick={() => navigate("/")}
        >
          <img src="/8575289.png" alt="Logo" className="w-10 h-10" />
          <span>HotelMenu</span>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <i className={`fas ${isOpen ? "fa-times" : "fa-bars"} text-2xl`} />
        </button>

        {/* Menu Links */}
        <ul
          className={`md:flex md:space-x-8 absolute md:static top-16 left-0 w-full md:w-auto bg-gray-900 md:bg-transparent md:py-0 transition-all duration-300 ${
            isOpen ? "block" : "hidden"
          }`}
        >
          <li>
            <Link
              to="/"
              className="block py-2 text-lg font-semibold hover:text-blue-400 transition duration-200 px-4 md:px-0"
              onClick={() => setIsOpen(false)}
            >
              Customer
            </Link>
          </li>

          {isAuthenticated && (
            <li>
              <Link
                to="/admin"
                className="block py-2 text-lg font-semibold hover:text-blue-400 transition duration-200 px-4 md:px-0"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            </li>
          )}

          {isAuthenticated ? (
            <li className="cursor-pointer">
              <button
                onClick={handleLogout}
                className="block py-2 text-lg font-semibold hover:text-blue-400 transition duration-200 px-4 md:px-0 cursor-pointer"
              >
                Logout
              </button>
            </li>
          ) : (
            <li className="cursor-pointer">
              <Link
                to="/login"
                className="block py-2 text-lg font-semibold hover:text-blue-400 transition duration-200 px-4 md:px-0 cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;