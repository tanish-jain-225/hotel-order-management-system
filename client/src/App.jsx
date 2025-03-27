import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Components
import Navbar from "./components/Navbar";
import Menu from "./components/Menu";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Admin from "./components/Admin";
import Cart from "./components/Cart";
import AllOrders from "./components/AllOrders";
import ChangeCredentials from "./components/ChangeCredentials";
import OrderHistory from "./components/OrderHistory";

// Import Global Styles
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Navbar (Fixed at the Top of the Page) */}
        <Navbar />

        {/* Main Content Area */}
        <div className="flex-grow pt-16">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Menu />} /> {/* Menu Page */}
            <Route path="/login" element={<Login />} /> {/* Login Page */}
            <Route path="/cart" element={<Cart />} /> {/* Cart Page */}

            {/* Admin Routes */}
            <Route path="/admin" element={<Admin />} /> {/* Admin Panel */}
            <Route path="/AllOrders" element={<AllOrders />} /> {/* All Orders Page */}
            <Route path="/login-change" element={<ChangeCredentials />} /> {/* Change Credentials Page */}
            <Route path="/order-history" element={<OrderHistory />} /> {/* Order History Page */}
          </Routes>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;