const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Product = require("./models/productModel");
const rawProducts = require("./productsData");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory orders store
let ordersList = [
  {
    orderId: "CZ-849201",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: "Out for Delivery",
    stepIndex: 2, // 0: Placed, 1: Packed, 2: Out for Delivery, 3: Delivered
    estimatedDelivery: "8-12 minutes",
    customer: {
      name: "Prakash Jayaraman",
      phone: "+91 98765 43210",
      address: "Flat 402, Green Glen Gardens, Bangalore, KA"
    },
    rider: {
      name: "Ramesh Kumar",
      phone: "+91 98112 34567",
      rating: 4.9,
      vehicle: "Ather 450X Electric (KA-03-EK-4912)",
      currentLocation: "1.2 km away, approaching 100 Ft Road"
    },
    items: [
      { name: "Rice (Aged Royal Basmati)", price: 349, quantity: 1, unit: "5 kg", image: "/images/rice.jpg" },
      { name: "Milk (Farm Fresh Whole Cow Milk)", price: 65, quantity: 2, unit: "1 Litre", image: "/images/milk.jpg" },
      { name: "Fresh Farm Vegetables", price: 120, quantity: 1, unit: "1 Basket", image: "/images/vegetables.jpg" },
      { name: "Bread (Artisan Sourdough Loaf)", price: 95, quantity: 1, unit: "500 g", image: "/images/bread.jpg" }
    ],
    pricing: {
      subtotal: 694,
      discount: 69,
      deliveryFee: 0,
      tax: 31,
      total: 656
    },
    paymentMethod: "UPI (Google Pay)"
  }
];

let isDbConnected = false;

// Connect to MongoDB and seed exact photo-matched products
mongoose
  .connect("mongodb://127.0.0.1:27017/grocery")
  .then(async () => {
    isDbConnected = true;
    console.log("Connected to MongoDB at 127.0.0.1:27017/grocery");
    try {
      // Clean and reseed with exact photo-matched items
      await Product.deleteMany({});
      await Product.insertMany(rawProducts);
      console.log(`Database seeded with ${rawProducts.length} verified photo-matched grocery items!`);
    } catch (seedErr) {
      console.warn("Seeding error:", seedErr.message);
    }
  })
  .catch((err) => {
    console.warn("MongoDB connection warning:", err.message);
    console.log("Operating with resilient in-memory product cache.");
  });

// GET /products
app.get("/products", async (req, res) => {
  try {
    let list = [];
    if (isDbConnected) {
      list = await Product.find().lean();
    }
    if (!list || list.length === 0) {
      list = rawProducts.map((p) => ({ _id: "prod_" + p.id, ...p }));
    }

    const { category, search, sort } = req.query;

    if (category && category !== "All") {
      list = list.filter((p) => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const query = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    if (sort === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    res.json(list);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /categories
app.get("/categories", (req, res) => {
  res.json([
    { id: "All", name: "All Items", icon: "🧺", count: 12 },
    { id: "Pantry", name: "Atta, Rice & Dals", icon: "🌾", count: 4 },
    { id: "Dairy", name: "Dairy, Bread & Eggs", icon: "🥛", count: 3 },
    { id: "Vegetables", name: "Fresh Vegetables", icon: "🥦", count: 1 },
    { id: "Fruits", name: "Fresh Fruits", icon: "🍎", count: 1 },
    { id: "Spices", name: "Masalas & Spices", icon: "🌶️", count: 1 },
    { id: "Snacks", name: "Dry Fruits & Nuts", icon: "🥜", count: 1 },
    { id: "Household", name: "Cleaning & Soaps", icon: "🧼", count: 1 }
  ]);
});

// GET /orders
app.get("/orders", (req, res) => {
  res.json(ordersList);
});

// GET /orders/:orderId
app.get("/orders/:orderId", (req, res) => {
  const order = ordersList.find((o) => o.orderId === req.params.orderId);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// POST /cart/checkout
app.post("/cart/checkout", (req, res) => {
  const { items, customer, paymentMethod } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const discount = subtotal >= 499 ? Math.round(subtotal * 0.1) : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal - discount + deliveryFee + tax;

  const orderId = "CZ-" + Math.floor(100000 + Math.random() * 900000);

  const order = {
    orderId,
    createdAt: new Date().toISOString(),
    status: "Out for Delivery",
    stepIndex: 2, // 0: Placed, 1: Packed, 2: Out for Delivery, 3: Delivered
    estimatedDelivery: "12-15 minutes",
    customer: customer || {
      name: "Valued Customer",
      phone: "+91 98765 43210",
      address: "Bangalore, Karnataka"
    },
    rider: {
      name: "Ramesh Kumar",
      phone: "+91 98112 34567",
      rating: 4.9,
      vehicle: "Ather 450X Electric (KA-03-EK-4912)",
      currentLocation: "1.2 km away, near 100 Ft Road"
    },
    items,
    pricing: {
      subtotal,
      deliveryFee,
      discount,
      tax,
      total
    },
    paymentMethod: paymentMethod || "UPI / Online"
  };

  ordersList.unshift(order);

  res.json({
    success: true,
    message: "Order placed successfully!",
    order
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
