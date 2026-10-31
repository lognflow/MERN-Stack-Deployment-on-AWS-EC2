import React, { useState, useEffect, useMemo } from "react";
import "./index.css";
import { PRODUCTS_DATA } from "./productsData";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000");

const CATEGORIES = [
  { id: "All", name: "All Items", icon: "🧺", count: 12 },
  { id: "Pantry", name: "Atta, Rice & Dals", icon: "🌾", count: 4 },
  { id: "Dairy", name: "Dairy, Bread & Eggs", icon: "🥛", count: 3 },
  { id: "Vegetables", name: "Fresh Vegetables", icon: "🥦", count: 1 },
  { id: "Fruits", name: "Fresh Fruits", icon: "🍎", count: 1 },
  { id: "Spices", name: "Masalas & Spices", icon: "🌶️", count: 1 },
  { id: "Snacks", name: "Dry Fruits & Nuts", icon: "🥜", count: 1 },
  { id: "Household", name: "Cleaning & Soaps", icon: "🧼", count: 1 }
];

const INITIAL_DEMO_ORDERS = [
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
      { name: "Rice", price: 349, quantity: 1, unit: "5 kg", image: "/images/rice.jpg" },
      { name: "Milk", price: 65, quantity: 2, unit: "1 Litre", image: "/images/milk.jpg" },
      { name: "Tomatoes", price: 40, quantity: 1, unit: "1 kg", image: "/images/vegetables.jpg" },
      { name: "Bread", price: 50, quantity: 1, unit: "400 g", image: "/images/bread.jpg" }
    ],
    pricing: {
      subtotal: 569,
      discount: 57,
      deliveryFee: 0,
      tax: 26,
      total: 538
    },
    paymentMethod: "UPI (Google Pay)"
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState("shop"); // 'shop' or 'orders'
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudzones_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudzones_orders");
      return saved ? JSON.parse(saved) : INITIAL_DEMO_ORDERS;
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  });

  const [selectedOrderId, setSelectedOrderId] = useState(INITIAL_DEMO_ORDERS[0].orderId);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Checkout form
  const [formData, setFormData] = useState({
    name: "Prakash Jayaraman",
    phone: "+91 98765 43210",
    address: "Flat 402, Green Glen Gardens, Bangalore, KA",
    deliverySlot: "instant",
    paymentMethod: "upi"
  });

  // Countdown timer for announcement bar
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch products from backend
  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => {
        console.warn("Backend products fallback:", err);
        setProducts(PRODUCTS_DATA);
      });
  }, []);

  // Fetch orders from backend
  useEffect(() => {
    fetch(`${API_BASE}/orders`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch orders");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          if (!selectedOrderId && data[0]) {
            setSelectedOrderId(data[0].orderId);
          }
        }
      })
      .catch((err) => console.warn("Backend orders fallback:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save cart & orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cloudzones_cart", JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("cloudzones_orders", JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Toast notification helper
  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Cart operations
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => (item.id || item._id || item.name) === (product.id || product._id || product.name));
      if (existing) {
        return prev.map((item) =>
          (item.id || item._id || item.name) === (product.id || product._id || product.name)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart!`);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.id || item._id || item.name) === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id || item.name) !== productId));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 299;
  const isFreeDelivery = cartSubtotal >= freeShippingThreshold;
  const deliveryFee = cart.length === 0 ? 0 : isFreeDelivery ? 0 : 40;
  const discountAmount = cartSubtotal >= 499 ? Math.round(cartSubtotal * 0.1) : 0;
  const taxAmount = Math.round(cartSubtotal * 0.05);
  const finalTotal = cartSubtotal > 0 ? cartSubtotal - discountAmount + deliveryFee + taxAmount : 0;

  // Filter & Sort Products across all 100 items
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "All" ||
          (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0; // featured
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Handle Checkout submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const orderPayload = {
      items: cart,
      customer: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      },
      paymentMethod:
        formData.paymentMethod === "upi"
          ? "UPI (Google Pay / PhonePe)"
          : formData.paymentMethod === "card"
          ? "Credit / Debit Card"
          : "Cash on Delivery"
    };

    let newOrder = null;

    try {
      const res = await fetch(`${API_BASE}/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (data.success) {
        newOrder = data.order;
      }
    } catch (err) {
      console.warn("Placing order in local state:", err);
    }

    if (!newOrder) {
      newOrder = {
        orderId: "CZ-" + Math.floor(100000 + Math.random() * 900000),
        createdAt: new Date().toISOString(),
        status: "Out for Delivery",
        stepIndex: 2,
        estimatedDelivery: "12-15 minutes",
        customer: orderPayload.customer,
        rider: {
          name: "Ramesh Kumar",
          phone: "+91 98112 34567",
          rating: 4.9,
          vehicle: "Ather 450X Electric (KA-03-EK-4912)",
          currentLocation: "Departed Dark Store, 1.4 km away"
        },
        items: [...cart],
        pricing: {
          subtotal: cartSubtotal,
          deliveryFee,
          discount: discountAmount,
          tax: taxAmount,
          total: finalTotal
        },
        paymentMethod: orderPayload.paymentMethod
      };
    }

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.orderId);
    setCart([]);
    setIsCheckoutOpen(false);
    setCurrentView("orders");
    showToast(`🎉 Order ${newOrder.orderId} placed! Tracking delivery.`);
  };

  const getProductQtyInCart = (id) => {
    const found = cart.find((item) => (item.id || item._id || item.name) === id);
    return found ? found.quantity : 0;
  };

  // Find currently selected order for tracking
  const activeOrder = orders.find((o) => o.orderId === selectedOrderId) || orders[0];

  // Helper to advance delivery status for interactive demo
  const handleAdvanceStep = () => {
    if (!activeOrder) return;
    const nextStep = (activeOrder.stepIndex + 1) % 4;
    const statusMap = [
      "Order Confirmed",
      "Packed at Store",
      "Out for Delivery",
      "Delivered"
    ];
    const updated = {
      ...activeOrder,
      stepIndex: nextStep,
      status: statusMap[nextStep],
      estimatedDelivery: nextStep === 3 ? "Delivered Just Now" : `${Math.max(3, (3 - nextStep) * 6)} minutes`
    };
    setOrders((prev) => prev.map((o) => (o.orderId === activeOrder.orderId ? updated : o)));
    showToast(`Demo: Order status updated to "${statusMap[nextStep]}"!`);
  };

  return (
    <div className="app-container">
      {/* 1. Top Announcement Bar */}
      <div className="top-bar">
        <div className="top-bar-content">
          <span className="promo-pill">FRESH HARVEST</span>
          <span>Get 20% OFF on all organic orders above ₹499 with code <strong>FRESH20</strong></span>
        </div>
        <div className="top-bar-timer">
          <span>Deals End in:</span>
          <strong>
            {String(timeLeft.hours).padStart(2, "0")}h:
            {String(timeLeft.minutes).padStart(2, "0")}m:
            {String(timeLeft.seconds).padStart(2, "0")}s
          </strong>
        </div>
      </div>

      {/* 2. Professional Light Navbar with Orders Tab */}
      <header className="navbar">
        <div className="nav-left">
          <div
            className="logo-container"
            id="brand-logo"
            onClick={() => setCurrentView("shop")}
          >
            <div className="logo-icon">🌿</div>
            <div className="logo-text">
              Cloud<span>Zones</span>
            </div>
          </div>
          <div className="delivery-tag">
            <span>⚡</span>
            <span>Delivery in <strong>15 mins</strong> to <strong>Bangalore</strong></span>
          </div>
        </div>

        {/* Search Bar (Only shown in Shop view) */}
        {currentView === "shop" && (
          <div className="nav-search">
            <div className="search-input-wrapper">
              <span className="search-icon-left">🔍</span>
              <input
                id="search-input"
                type="text"
                placeholder="Search across 100 groceries: Atta, Dals, Spices, Dairy, Soaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav Actions */}
        <div className="nav-actions">
          <button
            id="nav-shop-tab"
            className={`nav-tab-btn ${currentView === "shop" ? "active" : ""}`}
            onClick={() => setCurrentView("shop")}
          >
            <span>🛍️ Shop</span>
          </button>

          <button
            id="nav-orders-tab"
            className={`nav-tab-btn ${currentView === "orders" ? "active" : ""}`}
            onClick={() => setCurrentView("orders")}
          >
            <span>📦 Track Orders</span>
            {orders.length > 0 && (
              <span className="cart-badge" style={{ background: currentView === "orders" ? "#ffffff" : "#10b981", color: currentView === "orders" ? "#065f46" : "#ffffff" }}>
                {orders.length}
              </span>
            )}
          </button>

          <button
            id="open-cart-btn"
            className="cart-button"
            onClick={() => setIsCartOpen(true)}
          >
            <span>🛒 Cart</span>
            <span className="cart-badge">{totalCartCount}</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          VIEW 1: ORDERS & LIVE DELIVERY TRACKING TAB
         ======================================================== */}
      {currentView === "orders" ? (
        <section className="orders-page-section" id="orders-view">
          <div className="orders-header">
            <div>
              <h2>Order Tracking & History</h2>
              <p>Monitor your active hyperlocal deliveries and past grocery orders in real-time</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setCurrentView("shop")}
            >
              <span>+ Order More Groceries</span>
            </button>
          </div>

          <div className="orders-layout">
            {/* Left: Orders List */}
            <div className="orders-list-col">
              <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>
                Your Orders ({orders.length})
              </h4>

              {orders.map((o) => (
                <div
                  key={o.orderId}
                  className={`order-selector-card ${o.orderId === activeOrder?.orderId ? "selected" : ""}`}
                  onClick={() => setSelectedOrderId(o.orderId)}
                >
                  <div className="order-card-top-row">
                    <span className="order-code">{o.orderId}</span>
                    <span
                      className={`order-status-chip ${
                        o.stepIndex === 3
                          ? "delivered"
                          : o.stepIndex === 2
                          ? "out-for-delivery"
                          : "confirmed"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div className="order-time-row">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {o.items.length} items
                  </div>

                  <div className="order-card-items-preview">
                    {o.items.slice(0, 4).map((it, idx) => (
                      <img
                        key={idx}
                        src={process.env.PUBLIC_URL + (it.image || "/images/vegetables.jpg")}
                        alt={it.name}
                        className="order-thumb-mini"
                        title={it.name}
                      />
                    ))}
                    {o.items.length > 4 && (
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "700" }}>
                        +{o.items.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="order-card-footer-row">
                    <span style={{ color: "#64748b" }}>Amount Paid</span>
                    <span className="order-total-price">₹{o.pricing?.total || 450}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Live Tracking Panel */}
            {activeOrder && (
              <div className="tracking-panel">
                {/* Live Banner */}
                <div className="tracking-live-alert">
                  <div className="tracking-live-title">
                    <h3>
                      <span>⚡</span>
                      <span>{activeOrder.status}</span>
                    </h3>
                    <p>Fulfillment Dark Store #14 • Indiranagar Hub</p>
                  </div>
                  <div className="tracking-eta-box">
                    <span>⏱️ ETA:</span>
                    <span>{activeOrder.estimatedDelivery}</span>
                  </div>
                </div>

                {/* 4-Step Progress Stepper */}
                <div className="tracking-stepper">
                  <div
                    className="tracking-stepper-progress"
                    style={{
                      width: `${(activeOrder.stepIndex / 3) * 85}%`
                    }}
                  ></div>

                  {[
                    { label: "Order Placed", desc: "Confirmed & Verified", icon: "✓" },
                    { label: "Packing Order", desc: "Dark Store #14", icon: "📦" },
                    { label: "On the Way", desc: "Express Rider Dispatched", icon: "🛵" },
                    { label: "Delivered", desc: "At Your Doorstep", icon: "🏠" }
                  ].map((st, idx) => {
                    const isCompleted = activeOrder.stepIndex > idx;
                    const isActive = activeOrder.stepIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`step-node ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                      >
                        <div className="step-circle">
                          {isCompleted ? "✓" : st.icon}
                        </div>
                        <div className="step-label">{st.label}</div>
                        <div className="step-desc">{st.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Live Route Map Card */}
                <div className="live-map-card">
                  <div className="map-visual-header">
                    <h4>
                      <span>🗺️</span>
                      <span>Live Delivery Tracker</span>
                    </h4>
                    <span className="live-badge-pulse">LIVE GPS</span>
                  </div>

                  <div className="simulated-map-route">
                    <div className="map-route-line"></div>

                    <div className="map-store-point">
                      <div className="map-point-icon">🏬</div>
                      <div className="map-point-label">Store #14</div>
                    </div>

                    {activeOrder.stepIndex === 2 && (
                      <div className="map-rider-vehicle" title="Rider in transit">
                        🛵
                      </div>
                    )}

                    <div className="map-home-point">
                      <div className="map-point-icon">🏠</div>
                      <div className="map-point-label">Home Address</div>
                    </div>
                  </div>
                </div>

                {/* Rider Profile Card */}
                {activeOrder.rider && (
                  <div className="rider-profile-card">
                    <div className="rider-info-left">
                      <div className="rider-avatar">🛵</div>
                      <div className="rider-details">
                        <h4>{activeOrder.rider.name}</h4>
                        <p>⭐ {activeOrder.rider.rating} Rating • {activeOrder.rider.vehicle}</p>
                        <p style={{ color: "#059669", fontWeight: "600", marginTop: "2px" }}>
                          📍 {activeOrder.rider.currentLocation}
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn-call-rider"
                      onClick={() => showToast(`📞 Calling rider ${activeOrder.rider.name} at ${activeOrder.rider.phone}...`)}
                    >
                      <span>📞 Call Rider</span>
                    </button>
                  </div>
                )}

                {/* Ordered Items Breakdown */}
                <div className="tracking-order-items">
                  <h4>Items in this Delivery ({activeOrder.items.length})</h4>
                  <div className="ordered-items-grid">
                    {activeOrder.items.map((it, idx) => (
                      <div className="ordered-item-row" key={idx}>
                        <div className="ordered-item-meta">
                          <img
                            src={process.env.PUBLIC_URL + (it.image || "/images/vegetables.jpg")}
                            alt={it.name}
                            className="ordered-item-thumb"
                          />
                          <div>
                            <div className="ordered-item-name">{it.name}</div>
                            <div className="ordered-item-qty">{it.unit} × {it.quantity}</div>
                          </div>
                        </div>
                        <div className="ordered-item-price">₹{it.price * it.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing summary */}
                  <div className="cart-summary-line" style={{ marginTop: "1rem" }}>
                    <span>Delivery Address</span>
                    <strong>{activeOrder.customer?.address}</strong>
                  </div>
                  <div className="cart-summary-line">
                    <span>Payment Mode</span>
                    <strong>{activeOrder.paymentMethod}</strong>
                  </div>
                  <div className="cart-summary-line total">
                    <span>Total Amount</span>
                    <span>₹{activeOrder.pricing?.total}</span>
                  </div>

                  {/* Demo Interactive Controls */}
                  <div className="demo-step-controls">
                    <button
                      className="btn-demo-action"
                      onClick={handleAdvanceStep}
                      title="Simulate step advance for presentation demo"
                    >
                      ⏩ Demo: Advance Delivery Step
                    </button>
                    <button
                      className="btn-demo-action"
                      onClick={() => showToast(`Receipt downloaded for order ${activeOrder.orderId}!`)}
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ========================================================
            VIEW 2: SHOPPING & 100 PRODUCTS CATALOG VIEW
           ======================================================== */
        <>
          {/* Hero Section */}
          <section className="hero-section" id="home">
            <div className="hero-wrapper">
              <div className="hero-text-content">
                <div className="hero-badge">
                  <span className="pulse-dot"></span>
                  <span>100 Daily Essentials & Farm Fresh Groceries</span>
                </div>
                <h1 className="hero-title">
                  Fresh Groceries, <br />
                  <span className="highlight">Delivered in 15 Minutes.</span>
                </h1>
                <p className="hero-description">
                  From daily staples like Chakki Atta, Basmati Rice, Dals, and Cold-Pressed Oil to farm fresh vegetables, dairy, masalas, and home cleaning supplies.
                </p>
                <div className="hero-cta-group">
                  <a href="#catalog" className="btn-primary" id="explore-catalog-btn">
                    <span>Explore Fresh Groceries</span>
                    <span>↓</span>
                  </a>
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentView("orders")}
                  >
                    <span>Track Your Orders 🛵</span>
                  </button>
                </div>

                <div className="hero-stats">
                  <div className="stat-item">
                    <h4>100%</h4>
                    <p>Verified Quality</p>
                  </div>
                  <div className="stat-item">
                    <h4>15 Mins</h4>
                    <p>Express Dispatch</p>
                  </div>
                  <div className="stat-item">
                    <h4>4.9 ★</h4>
                    <p>Customer Rating</p>
                  </div>
                </div>
              </div>

              <div className="hero-media">
                <div className="hero-image-card">
                  <img
                    src={process.env.PUBLIC_URL + "/images/hero_groceries.jpg"}
                    alt="Fresh organic groceries harvest"
                    loading="eager"
                  />
                  <div className="hero-floating-card">
                    <div className="floating-icon">🌱</div>
                    <div className="floating-text">
                      <h5>100% Quality Assured</h5>
                      <p>Sourced fresh daily from farmers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Badges Bar */}
          <section className="trust-bar">
            <div className="trust-wrapper">
              <div className="trust-card">
                <div className="trust-icon">⚡</div>
                <div className="trust-info">
                  <h4>15-Minute Delivery</h4>
                  <p>Hyperlocal rider network</p>
                </div>
              </div>
              <div className="trust-card">
                <div className="trust-icon">🌱</div>
                <div className="trust-info">
                  <h4>100% Quality Inspected</h4>
                  <p>Daily essentials ready to ship</p>
                </div>
              </div>
              <div className="trust-card">
                <div className="trust-icon">💰</div>
                <div className="trust-info">
                  <h4>Best Wholesale Prices</h4>
                  <p>Direct from mandi & manufacturers</p>
                </div>
              </div>
              <div className="trust-card">
                <div className="trust-icon">🔁</div>
                <div className="trust-info">
                  <h4>Live Order Tracking</h4>
                  <p>Track rider with instant phone support</p>
                </div>
              </div>
            </div>
          </section>

          {/* Main Products Catalog Section */}
          <main className="catalog-section" id="catalog">
            <div className="catalog-header">
              <div className="catalog-header-text">
                <h2>Explore Fresh Groceries</h2>
                <p>Showing {filteredProducts.length} verified farm-fresh and pantry items available in your locality</p>
              </div>

              <div className="catalog-controls">
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id.toLowerCase()}`}
                  className={`category-pill ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name} ({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛒</div>
                <h3>Loading fresh inventory...</h3>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No items found</h3>
                <p>We couldn't find items matching "{searchQuery}". Try another keyword or clear search.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((p) => {
                  const pId = p.id || p._id || p.name;
                  const qty = getProductQtyInCart(pId);
                  const discountPercent = p.orig || p.originalPrice
                    ? Math.round((((p.orig || p.originalPrice) - p.price) / (p.orig || p.originalPrice)) * 100)
                    : 0;

                  return (
                    <div className="product-card" key={pId}>
                      {p.badge && (
                        <span
                          className={`card-badge ${
                            p.badge.toLowerCase().includes("bestseller")
                              ? "bestseller"
                              : p.badge.toLowerCase().includes("organic") || p.badge.toLowerCase().includes("curcumin")
                              ? "organic"
                              : "fresh"
                          }`}
                        >
                          {p.badge}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="discount-badge">-{discountPercent}%</span>
                      )}

                      <div
                        className="card-top"
                        onClick={() => setQuickViewProduct(p)}
                        title="Click to view details"
                      >
                        <img
                          src={process.env.PUBLIC_URL + (p.image || p.img)}
                          alt={p.name}
                          className="product-realistic-img"
                          loading="lazy"
                        />
                      </div>

                      <div className="card-content">
                        <div className="card-meta">
                          <span className="product-category-label">{p.category || p.cat || "Grocery"}</span>
                          <span className="product-rating">★ {p.rating || 4.8}</span>
                        </div>

                        <h3
                          className="product-name"
                          onClick={() => setQuickViewProduct(p)}
                        >
                          {p.name}
                        </h3>

                        <div className="product-unit">{p.unit || "1 unit"}</div>
                        <p className="product-desc-snippet">{p.desc || p.description}</p>

                        <div className="card-footer">
                          <div className="price-box">
                            <span className="current-price">₹{p.price}</span>
                            {(p.orig || p.originalPrice) && (
                              <span className="original-price">₹{p.orig || p.originalPrice}</span>
                            )}
                          </div>

                          {qty > 0 ? (
                            <div className="card-qty-control">
                              <button
                                className="card-qty-btn"
                                onClick={() => updateQuantity(pId, -1)}
                              >
                                −
                              </button>
                              <span className="card-qty-num">{qty}</span>
                              <button
                                className="card-qty-btn"
                                onClick={() => updateQuantity(pId, 1)}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn-add-cart"
                              onClick={() => addToCart(p)}
                              id={`add-btn-${String(pId).replace(/\s+/g, "-")}`}
                            >
                              <span>+ Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Deals Banner */}
          <section className="special-deal-banner" id="deals">
            <div className="deal-card">
              <div className="deal-content">
                <h3>Weekend Super Savings Across 100 Items</h3>
                <p>
                  Flat 20% off on Atta, Basmati Rice, Dals, Farm Milk, and Household cleaning supplies when you order ₹499 or more.
                </p>
                <div className="coupon-box">
                  <span>🎟️ Apply Coupon: <strong>FRESH20</strong></span>
                </div>
              </div>
              <div className="deal-art">🛍️🌾🥦</div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="testimonials-section" id="testimonials">
            <div className="testimonials-wrapper">
              <div className="section-head-center">
                <h3>Trusted by 50,000+ Happy Families</h3>
                <p>Everything you need for your home delivered in 15 minutes</p>
              </div>

              <div className="testimonials-grid">
                <div className="testimonial-card">
                  <div className="test-stars">★★★★★</div>
                  <p className="test-quote">
                    "From Toor Dal and Chakki Atta to fresh milk and coriander, CloudZones has all 100 everyday essentials. Delivery took only 11 minutes!"
                  </p>
                  <div className="test-user">
                    <div className="test-avatar">AP</div>
                    <div className="test-user-info">
                      <h5>Ananya Patel</h5>
                      <p>Indiranagar, Bangalore</p>
                    </div>
                  </div>
                </div>

                <div className="testimonial-card">
                  <div className="test-stars">★★★★★</div>
                  <p className="test-quote">
                    "The live tracking feature is brilliant. You can see the rider moving on the map and call him directly. Top-tier service."
                  </p>
                  <div className="test-user">
                    <div className="test-avatar">RK</div>
                    <div className="test-user-info">
                      <h5>Rahul Kapoor</h5>
                      <p>Koramangala, Bangalore</p>
                    </div>
                  </div>
                </div>

                <div className="testimonial-card">
                  <div className="test-stars">★★★★★</div>
                  <p className="test-quote">
                    "Clean, crisp light UI without any clutter. The search works instantaneously even across 100 items."
                  </p>
                  <div className="test-user">
                    <div className="test-avatar">SM</div>
                    <div className="test-user-info">
                      <h5>Sneha Mukhopadhyay</h5>
                      <p>HSR Layout, Bangalore</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========================================================
          SLIDE-OUT CART DRAWER
         ======================================================== */}
      {isCartOpen && (
        <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <div className="cart-drawer-title">
                <span>🛒 My Cart</span>
                <span className="cart-badge">{totalCartCount} items</span>
              </div>
              <button
                className="cart-close-btn"
                onClick={() => setIsCartOpen(false)}
                title="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Free shipping bar */}
            <div className="cart-free-shipping-bar">
              <div className="shipping-text">
                {isFreeDelivery ? (
                  <span>🎉 <strong>Congratulations!</strong> You get FREE delivery</span>
                ) : (
                  <span>
                    Add <strong>₹{freeShippingThreshold - cartSubtotal}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                )}
                <span>₹{cartSubtotal} / ₹{freeShippingThreshold}</span>
              </div>
              <div className="shipping-progress">
                <div
                  className="shipping-progress-fill"
                  style={{
                    width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Cart Items list */}
            {cart.length === 0 ? (
              <div className="empty-state" style={{ margin: "auto", border: "none" }}>
                <div className="empty-state-icon">🧺</div>
                <h3>Your cart is empty</h3>
                <p>Browse 100 fresh grocery items and add them to your cart.</p>
                <button
                  className="btn-primary"
                  onClick={() => setIsCartOpen(false)}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => {
                    const itId = item.id || item._id || item.name;
                    return (
                      <div className="cart-item" key={itId}>
                        <img
                          src={process.env.PUBLIC_URL + (item.image || item.img)}
                          alt={item.name}
                          className="cart-item-img"
                        />
                        <div className="cart-item-details">
                          <div className="cart-item-title">{item.name}</div>
                          <div className="cart-item-unit">{item.unit}</div>
                          <div className="cart-item-price">₹{item.price * item.quantity}</div>
                        </div>

                        <div className="cart-item-actions">
                          <div className="card-qty-control">
                            <button
                              className="card-qty-btn"
                              onClick={() => updateQuantity(itId, -1)}
                            >
                              −
                            </button>
                            <span className="card-qty-num">{item.quantity}</span>
                            <button
                              className="card-qty-btn"
                              onClick={() => updateQuantity(itId, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="cart-item-remove"
                            onClick={() => removeFromCart(itId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-drawer-footer">
                  <div className="cart-summary-line">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="cart-summary-line">
                      <span>Discount (10% over ₹499)</span>
                      <span className="free-tag">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="cart-summary-line">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <strong className="free-tag">FREE</strong> : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="cart-summary-line">
                    <span>GST (5%)</span>
                    <span>₹{taxAmount}</span>
                  </div>
                  <div className="cart-summary-line total">
                    <span>To Pay</span>
                    <span>₹{finalTotal}</span>
                  </div>

                  <button
                    id="proceed-checkout-btn"
                    className="btn-checkout"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <span>₹{finalTotal} →</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          CHECKOUT MODAL
         ======================================================== */}
      {isCheckoutOpen && (
        <div className="modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delivery & Payment</h3>
              <button
                className="cart-close-btn"
                onClick={() => setIsCheckoutOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form id="checkout-form" onSubmit={handleCheckoutSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Delivery Address in Bangalore</label>
                  <textarea
                    required
                    rows="2"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Delivery Mode</label>
                  <div className="delivery-options-grid">
                    <div
                      className={`delivery-option ${formData.deliverySlot === "instant" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, deliverySlot: "instant" })}
                    >
                      <h5>⚡ 15-Min Express</h5>
                      <p>Instant rider dispatch</p>
                    </div>
                    <div
                      className={`delivery-option ${formData.deliverySlot === "evening" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, deliverySlot: "evening" })}
                    >
                      <h5>🌆 Evening 6 - 8 PM</h5>
                      <p>Scheduled delivery</p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-options-grid">
                    <div
                      className={`payment-option ${formData.paymentMethod === "upi" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: "upi" })}
                    >
                      <div className="payment-icon">📱</div>
                      <h5>UPI / GPay</h5>
                    </div>
                    <div
                      className={`payment-option ${formData.paymentMethod === "card" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
                    >
                      <div className="payment-icon">💳</div>
                      <h5>Card</h5>
                    </div>
                    <div
                      className={`payment-option ${formData.paymentMethod === "cod" ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: "cod" })}
                    >
                      <div className="payment-icon">💵</div>
                      <h5>Cash</h5>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: "1.2rem 0 0", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsCheckoutOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="confirm-place-order-btn"
                    className="btn-primary"
                  >
                    Place Order (₹{finalTotal})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          QUICK VIEW MODAL
         ======================================================== */}
      {quickViewProduct && (
        <div className="modal-backdrop" onClick={() => setQuickViewProduct(null)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button
                className="cart-close-btn"
                onClick={() => setQuickViewProduct(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="quickview-grid">
                <div className="quickview-img-wrap">
                  <img
                    src={process.env.PUBLIC_URL + (quickViewProduct.image || quickViewProduct.img)}
                    alt={quickViewProduct.name}
                    className="quickview-img"
                  />
                </div>
                <div className="quickview-details">
                  <div className="quickview-badges">
                    <span className="product-category-label">{quickViewProduct.cat || quickViewProduct.category}</span>
                    <span className="product-rating">★ {quickViewProduct.rating || 4.9}</span>
                  </div>
                  <h4>{quickViewProduct.name}</h4>
                  <div className="product-unit" style={{ marginBottom: "0.8rem" }}>
                    Pack Size: {quickViewProduct.unit}
                  </div>
                  <div className="quickview-price-row">
                    <span className="current-price" style={{ fontSize: "1.6rem" }}>
                      ₹{quickViewProduct.price}
                    </span>
                    {(quickViewProduct.orig || quickViewProduct.originalPrice) && (
                      <span className="original-price" style={{ fontSize: "1rem" }}>
                        ₹{quickViewProduct.orig || quickViewProduct.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="quickview-desc">{quickViewProduct.desc || quickViewProduct.description}</p>

                  <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                  >
                    <span>Add to Basket (₹{quickViewProduct.price})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOASTS & FOOTER
         ======================================================== */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>✓</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <footer className="footer">
        <div className="footer-wrapper">
          <div className="footer-col">
            <div className="logo-container">
              <div className="logo-icon">🌿</div>
              <div className="logo-text">
                Cloud<span>Zones</span>
              </div>
            </div>
            <p>
              Your trusted hyperlocal 15-minute supermarket with a complete 100-item inventory covering Atta, Rice, Dals, Spices, Dairy, Vegetables, and Cleaning essentials.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Categories</h4>
            <ul className="footer-links">
              <li><a href="#catalog" onClick={() => { setCurrentView("shop"); setSelectedCategory("Pantry"); }}>Atta, Rice & Dals (20)</a></li>
              <li><a href="#catalog" onClick={() => { setCurrentView("shop"); setSelectedCategory("Vegetables"); }}>Fresh Vegetables (24)</a></li>
              <li><a href="#catalog" onClick={() => { setCurrentView("shop"); setSelectedCategory("Dairy"); }}>Dairy & Eggs (7)</a></li>
              <li><a href="#catalog" onClick={() => { setCurrentView("shop"); setSelectedCategory("Spices"); }}>Spices & Masalas (13)</a></li>
              <li><a href="#catalog" onClick={() => { setCurrentView("shop"); setSelectedCategory("Household"); }}>Cleaning & Home (15)</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Order Tracking & Help</h4>
            <ul className="footer-links">
              <li><a href="#orders" onClick={() => setCurrentView("orders")}>Track Active Delivery</a></li>
              <li><a href="#orders" onClick={() => setCurrentView("orders")}>Order History & Invoices</a></li>
              <li><a href="#home">15-Min Delivery Guarantee</a></li>
              <li><a href="#home">Instant Refund Policy</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Hyperlocal Hub</h4>
            <ul className="footer-links">
              <li>📍 100 Ft Road, Indiranagar, Bangalore</li>
              <li>📞 1800-258-9000 (Toll Free)</li>
              <li>✉️ support@cloudzones.com</li>
              <li>⏰ Express Service: 6:00 AM – Midnight</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 CloudZones Hyperlocal Grocery Store. 100 Items Verified in Stock.</p>
          <div className="badge-pill-pill">
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>🌱 100% Quality Inspected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
