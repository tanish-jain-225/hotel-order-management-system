import React, { useState, useEffect, useMemo } from "react";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0); // Cart count state
  const [addedStatus, setAddedStatus] = useState({}); // Added Status for Each Item

  const API_URL = import.meta.env.VITE_API_URL;

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

  // Fetch Cart Count from Backend
  const fetchCartCount = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch cart count. Status: ${response.status}`
        );
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCartCount(data.length); // Update cart count based on the array length
      } else {
        throw new Error("Invalid response format. Expected an array.");
      }
    } catch (error) {
      console.error("Error fetching cart count:", error.message);
      setCartCount(0); // Reset cart count to 0 in case of an error
    }
  };

  // Handle Order Button Click
  const handleOrder = async (item) => {
    try {
      const response = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, // Include session ID
          name: item.name,
          price: item.price,
          quantity: 1, // Default quantity
          image: item.image,
          cuisine: item.cuisine,
          section: item.section,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add the item to the cart.");

      // Update cart count after adding an item
      fetchCartCount();

      // Show 'Added' status for 2 seconds
      setAddedStatus((prev) => ({ ...prev, [item._id]: true }));
      setTimeout(() => {
        setAddedStatus((prev) => ({ ...prev, [item._id]: false }));
      }, 2000);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/`);
        if (!response.ok) throw new Error("Failed to fetch menu items.");
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
    fetchCartCount(); // Fetch cart count when the component mounts
  }, []);

  // Extract unique sections
  const sections = useMemo(() => {
    const uniqueSections = {};
    menuItems.forEach((item) => {
      const normalized = item.section.trim().toLowerCase();
      if (!uniqueSections[normalized]) {
        uniqueSections[normalized] = item.section.trim();
      }
    });
    return ["All", ...Object.values(uniqueSections)];
  }, [menuItems]);

  // Filtering logic
  const filteredItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedSection === "All" ||
          item.section.trim().toLowerCase() === selectedSection.toLowerCase())
    );
  }, [menuItems, searchTerm, selectedSection]);

  // Group items by section
  const groupedItems = useMemo(() => {
    const grouped = {};
    filteredItems.forEach((item) => {
      const section = item.section.trim();
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(item);
    });
    return grouped;
  }, [filteredItems]);

  return (
    <div className="container mx-auto px-4 py-10 bg-gray-100 my-30 md:my-10">
      <h2 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Explore Our Delicious Menu
      </h2>

      {/* Error or Loading Messages */}
      {loading && (
        <p className="text-center text-lg text-gray-600">Loading Menu...</p>
      )}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Search & Filter Section */}
      {!loading && !error && (
        <div className="flex flex-col md:flex-row justify-center gap-4 my-8 items-center">
          <input
            type="text"
            placeholder="Search For Food"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize cursor-pointer"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {sections.map((section, index) => (
              <option
                key={index}
                value={section}
                className="capitalize cursor-pointer"
              >
                {section}
              </option>
            ))}
          </select>

          {/* Cart Button with Dynamic Badge */}
          <div
            className="cart py-2 px-6 bg-green-600 rounded-md flex items-center justify-center cursor-pointer text-white font-semibold text-2xl gap-2 w-[100%] align-center"
            onClick={() => (window.location.href = "/cart")}
          >
            <span className="md:hidden font-bold">Cart</span>
            <img
              src="https://cdn-icons-png.flaticon.com/128/3514/3514491.png"
              alt="cart"
              className="w-[30px] invert"
            />
            ({cartCount})
          </div>
        </div>
      )}

      {/* Menu Items */}
      {!loading && !error && (
        <div className="flex flex-col gap-4 capitalize mx-auto">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="w-full mx-auto">
              <h3 className="text-3xl font-bold text-gray-700 mb-1">
                {section}
              </h3>
              <hr />
              <div className="flex flex-wrap gap-6 my-4 mx-auto">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex w-[100%] md:w-[40%] lg:w-[30%] border border-gray-200 rounded-lg shadow-md overflow-hidden md:flex-row flex-col bg-white"
                  >
                    {/* Image Section */}
                    <div className="w-full md:w-1/3 h-48 md:h-auto flex">
                      <img
                        src={item.image || "https://via.placeholder.com/300"}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Details Section */}
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <h4 className="text-xl font-bold text-gray-900">
                        {item.name}
                      </h4>
                      <p className="text-gray-700">
                        Cuisine:{" "}
                        <span className="text-gray-800 font-semibold">
                          {item.cuisine}
                        </span>
                      </p>
                      <p className="text-blue-600 font-semibold">
                        ₹{item.price}
                      </p>
                      {item.info && (
                        <p className="text-gray-500 italic">
                          Info: {item.info}
                        </p>
                      )}

                      {/* Order Button with Added Message */}
                      <button
                        className={`my-2 p-2 cursor-pointer rounded-md w-full ${
                          addedStatus[item._id] ? "bg-green-500" : "bg-blue-600"
                        } text-white`}
                        onClick={() => handleOrder(item)}
                        disabled={addedStatus[item._id]}
                      >
                        {addedStatus[item._id] ? "Added" : "Add To Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
