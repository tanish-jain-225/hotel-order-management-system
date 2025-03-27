import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch order history on component mount
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const sessionId = localStorage.getItem("sessionId"); // Retrieve sessionId from localStorage

        if (!sessionId) {
          throw new Error("Session ID is missing. Please log in again.");
        }

        // Fetch the latest orders from the API by sessionId
        const response = await fetch(
          `${API_URL}/order-history?sessionId=${sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch order history.");
        }

        const data = await response.json();

        // Save fetched data to localStorage
        localStorage.setItem(`orderHistory_${sessionId}`, JSON.stringify(data));
        setOrders(data);
      } catch (err) {
        console.error("Error fetching order history:", err);

        // If fetching fails, load data from localStorage
        const sessionId = localStorage.getItem("sessionId");
        const storedOrders = localStorage.getItem(`orderHistory_${sessionId}`);
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        } else {
          setError(
            err.message ||
              "Unable to fetch order history and no local data available."
          );
        }
      } finally {
        setLoading(false);
      }
    };
    // Always fetch the latest orders on page load
    fetchOrderHistory();
  }, []);

  // Clear all order history - Individual Session based orders are not deleted yet (All Orderes are deleted)
  const clearAllHistory = async () => {
    const sessionId = localStorage.getItem("sessionId"); // Retrieve sessionId from localStorage

    if (!sessionId) {
      setError("Session ID is missing. Please log in again.");
      return;
    }

    const confirmPrompt = window.confirm(
      "Are you sure you want to clear your order history?"
    );
    if (!confirmPrompt) {
      return;
    }

    try {
      // Call the backend to clear order history for the current session
      const response = await fetch(
        `${API_URL}/order-history?sessionId=${sessionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );


      if (!response.ok) {
        throw new Error("Failed to clear order history on the server.");
      }

      // Clear local storage and state
      localStorage.removeItem(`orderHistory_${sessionId}`); // Remove session-specific order history
      setOrders([]); // Clear the orders state
      setError(""); // Clear any existing error messages
    } catch (err) {
      console.error("Error clearing order history:", err);
      setError(err.message || "Failed to clear order history.");
    }
  };

  return (
    <div className="order-history p-6 my-30 md:my-10">
      {/* Back Button */}
      <span
        className="bg-red-500 px-4 py-2 rounded-lg text-white cursor-pointer inline-block mb-4"
        onClick={() => (window.location.href = "/cart")}
      >
        Back
      </span>
      <span className="ml-2">
        <button
          className={`bg-green-500 px-4 py-2 rounded-lg text-white cursor-pointer inline-block mb-4 ${
            orders.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={clearAllHistory}
          disabled={orders.length === 0}
        >
          Clear History
        </button>
      </span>
      <hr />

      <h1 className="text-2xl font-bold mb-4">
        Order History <span>(Updation may take few minutes)</span>
      </h1>

      {/* Loading & Error Handling */}
      {loading && <p>Loading order history...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Display Orders */}
      {!loading && !error && orders.length === 0 ? (
        <p>No order history.</p>
      ) : (
        <div className="flex flex-col gap-6 capitalize">
          {orders.map((order, index) => (
            <div
              key={index}
              className="p-4 md:p-6 border border-gray-200 rounded-xl shadow-md bg-white"
            >
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-0">
                  Order #{index + 1}
                </h2>
                <span
                  className={`text-md font-semibold`}
                >
                  Payment Method: <span className="text-gray-500">{order.paymentMethod}</span> 
                </span>
              </div>

              {/* Customer Details using Flexbox */}
              <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-gray-700">
                    <span className="font-semibold">Name:</span>{" "}
                    {order.customer.name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Contact:</span>{" "}
                    {order.customer.contact}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Address:</span>{" "}
                    {order.customer.address}
                  </p>
                </div>
              </div>

              {/* Order Items using Flexbox */}
              <h3 className="font-semibold mt-6 mb-2">Items Ordered</h3>
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-gray-700 p-2 border-b last:border-none"
                  >
                    <span>
                      {item.name} (x{item.quantity})
                    </span>
                    <span className="font-semibold">
                      ₹{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Details using Flexbox */}
              <div className="flex flex-col md:flex-row justify-between border-t pt-4 mt-4 text-gray-600">
                <p>
                  <span className="font-semibold">Subtotal:</span> ₹
                  {order.subtotal.toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">GST:</span> ₹
                  {order.gstAmount.toFixed(2)}
                </p>
                <p className="font-bold text-lg">
                  <span className="font-semibold">Grand Total:</span> ₹
                  {order.grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default OrderHistory;
