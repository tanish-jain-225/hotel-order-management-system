import React, { useState, useEffect } from "react";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removedStatus, setRemovedStatus] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    address: "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");
  const [flashType, setFlashType] = useState("");
  const [currentOrders, setCurrentOrders] = useState([]); // State to store all current orders

  const API_URL = process.env.VITE_API_URL;
  const GST_RATE = 0.05; // 5% GST

  // Generate or retrieve a unique session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  };

  const sessionId = getSessionId();

  // Fetch Current Orders from the database for the current session
  const fetchCurrentOrders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/place-order?sessionId=${sessionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setCurrentOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Fetch Orders (Cart) from Backend for the current session
  const fetchCartItems = async () => {
    try {
      const response = await fetch(`${API_URL}/orders?sessionId=${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch cart items.");
      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current orders on component mount
  useEffect(() => {
    fetchCurrentOrders();
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Fetch current orders when orderSuccess becomes true
  useEffect(() => {
    if (orderSuccess) {
      fetchCurrentOrders();
    }
  }, [orderSuccess]);

  // Handle Removing an Order (Cart Item)
  const handleRemoveFromCart = async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, _id: itemId }),
      });

      if (!response.ok) throw new Error("Failed to remove item from cart.");

      setRemovedStatus((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setRemovedStatus((prev) => ({ ...prev, [itemId]: false }));
        fetchCartItems();
      }, 1000);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Group orders by name and calculate total quantity and price
  const groupedOrders = cartItems.reduce((acc, item) => {
    const existingItem = acc.find((order) => order.name === item.name);
    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
      existingItem.totalPrice += item.price * (item.quantity || 1);
    } else {
      acc.push({
        ...item,
        quantity: item.quantity || 1,
        totalPrice: item.price * (item.quantity || 1),
      });
    }
    return acc;
  }, []);

  // Calculate total items in the cart
  const totalItems = groupedOrders.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Calculate GST and Grand Total
  const calculateTotals = () => {
    const subtotal = groupedOrders.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const gstAmount = subtotal * GST_RATE;
    const grandTotal = subtotal + gstAmount;
    return { subtotal, gstAmount, grandTotal };
  };

  // Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Order Submission
  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.contact || !formData.address) {
      alert("Please fill out all fields before submitting.");
      return;
    }

    const totals = calculateTotals();
    const orderData = {
      sessionId, // Include session ID
      ...formData, // Includes name, contact, and address
      paymentMethod: "Cash on Counter or UPI or Credit/Debit Card", // Hardcoded payment method
      items: groupedOrders, // Array of grouped cart items
      subtotal: parseFloat(totals.subtotal.toFixed(2)), // Subtotal (calculated in frontend)
      gstAmount: parseFloat(totals.gstAmount.toFixed(2)), // GST (calculated in frontend)
      grandTotal: parseFloat(totals.grandTotal.toFixed(2)), // Grand Total (calculated in frontend)
    };

    try {
      const response = await fetch(`${API_URL}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to place the order.");
      setOrderSuccess(true);
      setCartItems([]);
      setFlashMessage("Order placed successfully!");
      setFlashType("success");

      // Clear Orders from Cart after successful order
      await fetch(`${API_URL}/orders/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      // Clear flash message after 3 seconds
      setTimeout(() => {
        setFlashMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error placing order:", error);
      setFlashMessage("Failed to place the order. Please try again.");
      setFlashType("error");

      // Clear flash message after 3 seconds
      setTimeout(() => {
        setFlashMessage("");
      }, 3000);
    }
  };

  return (
    <div className="cart p-6 max-w-full mx-2 bg-white shadow-lg rounded-lg my-30 md:my-10">
      {/* Flash Message */}
      {flashMessage && (
        <div
          className={`p-4 mb-4 rounded ${
            flashType === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {flashMessage}
        </div>
      )}

      {/* Back Button */}
      <div>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-red-500 px-4 py-2 rounded-lg text-white cursor-pointer mb-4"
        >
          Back
        </button>
        <button
          className="bg-blue-500 px-4 py-2 rounded-lg text-white cursor-pointer mb-4 ml-4"
          onClick={() => (window.location.href = "/order-history")}
        >
          Order History
        </button>
      </div>
      <hr />
      <div className="text-3xl font-bold mb-6">Your Cart ({totalItems})</div>

      {/* Loading & Error Handling */}
      {loading && <p className="text-gray-600">Loading Cart...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Empty Cart Message */}
      {!loading && !error && groupedOrders.length === 0 && (
        <p className="text-gray-500">Your cart is empty.</p>
      )}

      {/* Display Grouped Cart Items */}
      {!loading && !error && groupedOrders.length > 0 && (
        <div className="flex flex-wrap gap-6 my-4 capitalize">
          {groupedOrders.map((item) => (
            <div
              key={item._id}
              className="flex w-[100%] md:w-[45%] lg:w-[30%] border border-gray-200 rounded-lg shadow-md overflow-hidden md:flex-row flex-col bg-white"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/3 h-48 md:h-auto">
                <img
                  src={item.image || "https://via.placeholder.com/300"}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Details Section */}
              <div className="p-4 flex flex-col justify-between flex-grow">
                <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                <p className="text-gray-700">
                  Cuisine: <span className="font-semibold">{item.cuisine}</span>
                </p>
                <p className="text-gray-700">
                  Section: <span className="font-semibold">{item.section}</span>
                </p>
                <p className="text-blue-600 font-semibold">
                  Rs. {item.price} x {item.quantity} = Rs. {item.totalPrice}
                </p>

                {/* Remove Button */}
                <button
                  className={`my-2 p-2 cursor-pointer rounded-md w-full ${
                    removedStatus[item._id]
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500"
                  } text-white`}
                  onClick={() => handleRemoveFromCart(item._id)}
                  disabled={removedStatus[item._id]}
                >
                  {removedStatus[item._id] ? "Removed" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Form */}
      {!loading && !error && groupedOrders.length > 0 && (
        <form
          onSubmit={handleOrderSubmit}
          className="mt-10 p-6 bg-gray-100 rounded-lg capitalize"
        >
          <h2 className="text-2xl font-bold mb-4">Complete Your Order</h2>
          <div className="mb-4">
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Contact Number</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="my-4">
            Payment Method: <strong>Cash or UPI or Credit/Debit Card</strong>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white p-3 rounded-lg cursor-pointer"
          >
            Place Order
          </button>
          {orderSuccess && (
            <p className="text-green-500 mt-4">Order placed successfully!</p>
          )}
        </form>
      )}

      {/* Display Current Orders */}
      <div>
        <h2 className="text-3xl font-bold my-6">Your Current Orders</h2>
        {currentOrders && currentOrders.length > 0 ? (
          currentOrders.map((order, index) => (
            <div
              key={index}
              className="p-6 bg-gray-100 rounded-lg shadow-md mb-4"
            >
              <h3 className="text-2xl font-bold text-blue-600 mb-4">
                Order #{index + 1}
              </h3>
              {/* Customer Details */}
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-800">
                  <span className="font-bold">Name:</span> {order.customer.name}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  <span className="font-bold">Contact:</span>{" "}
                  {order.customer.contact}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  <span className="font-bold">Address:</span>{" "}
                  {order.customer.address}
                </p>
              </div>
              {/* Items Ordered */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  Items Ordered:
                </h3>
                <ul className="list-disc list-inside text-gray-700">
                  {order.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="mb-1">
                      {item.name} - <span className="font-semibold">Qty:</span>{" "}
                      {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Order Totals */}
              <div className="border-t border-gray-300 pt-4">
                <p className="text-lg font-semibold text-gray-800">
                  <span className="font-bold">Subtotal:</span> ₹{order.subtotal}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  <span className="font-bold">GST:</span> ₹{order.gstAmount}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  <span className="font-bold">Grand Total:</span> ₹
                  {order.grandTotal}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No current orders available.</p>
        )}
      </div>
    </div>
  );
};

export default Cart;
