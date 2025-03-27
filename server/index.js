import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Constants
const PORT = 5000;
const mongoURI = process.env.VITE_MONGO_URI;
const dbName = "hotelMenu";

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB client and database reference
let client;
let db;

// ==============================
// Database Connection
// ==============================
async function connectToDB() {
  try {
    client = new MongoClient(mongoURI);
    await client.connect();
    db = client.db(dbName);
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1); // Exit process if connection fails
  }
}

// Helper function to get a collection
const getCollection = (name) => {
  if (!db) throw new Error("Database not initialized");
  return db.collection(name);
};

// ==============================
// Menu Management Endpoints
// ==============================

// Fetch all menu items
app.get("/", async (req, res) => {
  try {
    const menu = await getCollection("menuItems").find().toArray();
    res.status(200).json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Check if a menu item with the same name exists
app.post("/check", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Dish name is required." });
    }

    const existingItem = await getCollection("menuItems").findOne({ name: name.trim() });

    if (existingItem) {
      return res.status(200).json({ exists: true });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking menu item existence:", error);
    res.status(500).json({ message: "Failed to check menu item existence." });
  }
});

// Add a new menu item
app.post("/", async (req, res) => {
  try {
    const { name, cuisine, section, price, image, info } = req.body;

    if (!name || !cuisine || !section || !price || !image || !info) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newItem = { name, cuisine, section, price, image, info };
    const result = await getCollection("menuItems").insertOne(newItem);

    res.status(201).json({ message: "Menu item added successfully", newItem });
  } catch (error) {
    console.error("Error adding menu:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete a menu item by ID
app.delete("/", async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id || !ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid or missing menu item ID." });
    }

    const result = await getCollection("menuItems").deleteOne({ _id: new ObjectId(_id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    res.status(200).json({ message: "Menu item deleted successfully." });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Failed to delete menu item." });
  }
});

// ==============================
// Cart Management Endpoints
// ==============================

// Add Item to Cart (Session-Based)
app.post("/order", async (req, res) => {
  try {
    const { sessionId, name, price, quantity, image, cuisine, section } = req.body;

    if (!sessionId || !name || !price || !quantity) {
      return res.status(400).json({ message: "Session ID, name, price, and quantity are required." });
    }

    const newCartItem = { sessionId, name, price, quantity, image, cuisine, section };
    const result = await getCollection("orders").insertOne(newCartItem);

    if (!result.acknowledged) {
      throw new Error("Failed to add item to cart.");
    }

    res.status(201).json({ message: "Item added to cart successfully", cartItem: newCartItem });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart." });
  }
});

// Fetch Orders (Cart) by Session ID
app.get("/orders", async (req, res) => {
  try {
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const orders = await getCollection("orders").find({ sessionId }).toArray();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Delete Order from Cart by Session ID
app.delete("/orders", async (req, res) => {
  try {
    const { sessionId, _id } = req.body;

    if (!sessionId || !_id || !ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid or missing session ID or order ID." });
    }

    const result = await getCollection("orders").deleteOne({ sessionId, _id: new ObjectId(_id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order removed successfully" });
  } catch (error) {
    console.error("Error removing order:", error);
    res.status(500).json({ message: "Failed to remove order" });
  }
});

// Clear Cart by Session ID
app.delete("/orders/clear", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const result = await getCollection("orders").deleteMany({ sessionId });
    res.status(200).json({ message: "Cart cleared successfully." });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart." });
  }
});

// ==============================
// Order Management Endpoints
// ==============================

// Place Customer Order with GST and Grand Total Calculation
app.post("/place-order", async (req, res) => {
  try {
    const { sessionId, name, contact, address, paymentMethod, items, subtotal, gstAmount, grandTotal } = req.body;

    if (
      !sessionId ||
      !name ||
      !contact ||
      !address ||
      !paymentMethod ||
      !items ||
      items.length === 0 ||
      subtotal === undefined ||
      gstAmount === undefined ||
      grandTotal === undefined
    ) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    if (isNaN(subtotal) || isNaN(gstAmount) || isNaN(grandTotal)) {
      return res.status(400).json({ message: "Invalid subtotal, GST, or grand total values" });
    }

    const orderCount = await getCollection("customerOrders").countDocuments();
    const serialNumber = orderCount + 1;

    const orderData = {
      serialNumber,
      sessionId,
      customer: { name, contact, address },
      items,
      paymentMethod,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      orderDate: new Date(),
    };

    const result = await getCollection("customerOrders").insertOne(orderData);
    if (!result.acknowledged) {
      throw new Error("Failed to place order.");
    }

    res.status(201).json({ message: "Order placed successfully", orderId: result.insertedId, serialNumber });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Failed to place order" });
  }
});

// Fetch Customer Orders (All or by Session ID)
app.get("/place-order", async (req, res) => {
  const { sessionId } = req.query;
  try {
    let query = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const orders = await getCollection("customerOrders").find(query).toArray();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Delete Order by ID (Mark as Done)
app.delete("/place-order/:orderId", async (req, res) => {
  const { orderId } = req.params;

  if (!ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const result = await getCollection("customerOrders").deleteOne({ _id: new ObjectId(orderId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order marked as done" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to mark order as done" });
  }
});

// ==============================
// Admin Management Endpoints
// ==============================

// Fetch Admin Credentials
app.get("/admin", async (req, res) => {
  try {
    const admin = await getCollection("adminCredentials").findOne();

    if (!admin) {
      return res.status(404).json({ message: "Admin credentials not found." });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error("Error fetching admin credentials:", error);
    res.status(500).json({ message: "Failed to fetch admin credentials." });
  }
});

// Verify Admin Credentials
app.post("/admin/verify", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const admin = await getCollection("adminCredentials").findOne({});

    if (!admin) {
      return res.status(404).json({ message: "Admin credentials not found." });
    }

    if (String(admin.username) !== String(username) || String(admin.password) !== String(password)) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    res.status(200).json({ message: "Credentials verified successfully." });
  } catch (error) {
    console.error("Error verifying admin credentials:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update Admin Credentials
app.put("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const result = await getCollection("adminCredentials").updateOne(
      {},
      { $set: { username, password } },
      { upsert: true }
    );

    res.status(200).json({ message: "Admin credentials updated successfully." });
  } catch (error) {
    console.error("Error updating admin credentials:", error);
    res.status(500).json({ message: "Failed to update admin credentials." });
  }
});

// ==============================
// Order History Management
// ==============================

// Save Order to History
app.post("/order-history", async (req, res) => {
  try {
    const order = req.body;

    if (!order || !order._id) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const result = await getCollection("orderHistory").insertOne(order);

    if (!result.acknowledged) {
      throw new Error("Failed to save order to history");
    }

    res.status(201).json({ message: "Order saved to history" });
  } catch (error) {
    console.error("Error saving order to history:", error);
    res.status(500).json({ message: "Failed to save order to history" });
  }
});

// Fetch Order History by Session ID
app.get("/order-history", async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const orders = await getCollection("orderHistory").find({ sessionId }).toArray();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Failed to fetch order history" });
  }
});

// Clear Order History by Session ID
app.delete("/order-history", async (req, res) => {
  try {
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    const result = await getCollection("orderHistory").deleteMany({ sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No order history found for the given session ID." });
    }

    res.status(200).json({ message: "Order history cleared successfully." });
  } catch (error) {
    console.error("Error clearing order history:", error);
    res.status(500).json({ message: "Failed to clear order history." });
  }
});

// ==============================
// Server Initialization
// ==============================

connectToDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// Handle process exit
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
  process.exit(0);
});