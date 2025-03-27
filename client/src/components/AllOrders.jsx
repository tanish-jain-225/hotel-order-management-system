import React, { useEffect, useState } from "react";

const API_URL = process.env.VITE_API_URL;

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle Order Done
  const handleOrderDone = async (order) => {
    try {
      console.log("Order being processed:", order); // Debugging
  
      if (!order || !order._id || !order.customer || !order.items) {
        setError("Invalid order data. Please try again.");
        return;
      }
  
      // Step 1: Post to order-history endpoint
      const postResponse = await fetch(`${API_URL}/order-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
  
      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.message || "Failed to save order to history");
      }
  
      // Step 2: Delete the order from place-order
      const deleteResponse = await fetch(
        `${API_URL}/place-order/${order._id}`,
        {
          method: "DELETE",
        }
      );
  
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(
          errorData.message || "Failed to delete order from active orders"
        );
      }
  
      // Update UI: Remove order from list
      setOrders((prevOrders) => prevOrders.filter((o) => o._id !== order._id));
  
      console.log("Order moved to history and deleted from active orders");
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  // Fetch Orders from API
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/place-order`); // No sessionId in the query
      if (!response.ok) throw new Error("Failed to fetch orders");
  
      const data = await response.json();
      setOrders(data); // Set all orders in state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p className="text-center p-4">Loading orders...</p>;
  if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

  return (
    <div className="p-6 my-30 md:my-10">
      {/* Back Button */}
      <div
        className="bg-red-600 cursor-pointer rounded-md py-2 px-4 my-1 inline-block text-white font-bold"
        onClick={() => {
          window.location.href = "/admin";
        }}
      >
        Back
      </div>
      <hr />
      <h1 className="text-2xl font-bold mb-2">All Orders </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No orders available.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row justify-between p-6 border border-gray-300 rounded-lg shadow-md bg-white gap-4 align-center"
            >
              {/* Left Section - Order Info */}
              <div className="flex flex-col gap-3 w-full md:w-1/3">
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-black">Serial No:</span>{" "}
                  {order.serialNumber}
                </p>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-black">Name:</span>{" "}
                  {order.customer.name}
                </p>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-black">Contact:</span>{" "}
                  {order.customer.contact}
                </p>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-black">Payment:</span>{" "}
                  {order.paymentMethod}
                </p>
              </div>

              {/* Middle Section - Order Items */}
              <div className="flex flex-col gap-2 mt-4 md:mt-0 w-full md:w-1/3">
                <p className="text-sm font-semibold">Order Items:</p>
                <ul className="list-disc list-inside text-gray-700">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} x {item.quantity} - ₹{item.price}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Section - Payment and Date */}
              <div className="flex flex-col gap-3 mt-4 md:mt-0 w-full md:w-1/3 text-left md:text-right">
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-black">Order Date:</span>{" "}
                  {new Date(order.orderDate).toLocaleString()}
                </p>
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold text-black">Grand Total:</span>{" "}
                  ₹{order.grandTotal.toFixed(2)}
                </p>
              </div>

              {/* Done Button */}
              <div className="mt-4 md:mt-0 flex justify-center md:justify-end">
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md w-full max-h-[40px] cursor-pointer"
                  onClick={() => handleOrderDone(order)}
                >
                  Done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllOrders;