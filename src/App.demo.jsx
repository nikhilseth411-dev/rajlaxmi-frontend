import { useEffect, useState } from "react";
import "./App.css";

import { API_BASE_URL } from "./config/api";

function App() {
  const [goldRates, setGoldRates] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchGoldRates();
    fetchFeaturedProduct();
  }, []);

  const fetchGoldRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-rates/current`);
      const result = await response.json();
      setGoldRates(result.data);
    } catch (error) {
      console.error("Gold rate fetch failed:", error);
    }
  };

  const fetchFeaturedProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/1`);
      const result = await response.json();
      setProduct(result.data);
    } catch (error) {
      console.error("Product fetch failed:", error);
    }
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <h1>Raj Laxmi Jewellers</h1>
          <p>Bhagwan Das & Sons · Since 1984</p>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#gold-rates">Gold Rates</a>
          <a href="#products">Products</a>
          <a href="#store">Visit Store</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-text">
          <p className="eyebrow">BIS Hallmarked · GST Registered · Gaya, Bihar</p>
          <h2>Jewellery That Carries the Weight of Generations</h2>
          <p className="hindi">पीढ़ियों का विश्वास, शाश्वत सुंदरता</p>
          <p className="description">
            Trusted family jeweller since 1984. We provide gold and silver jewellery
            with transparent pricing, BIS hallmark certification and personal support.
          </p>

          <div className="hero-actions">
            <a href="#products" className="btn primary">Explore Products</a>
            <a
              href="https://wa.me/919102316789?text=Namaste%2C%20I%20want%20to%20enquire%20about%20jewellery."
              target="_blank"
              rel="noreferrer"
              className="btn whatsapp"
            >
              WhatsApp Inquiry
            </a>
          </div>
        </div>

        <div className="hero-image">
          <img src="/images/dukan.jpeg" alt="Raj Laxmi Jewellers Store" />
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-card">
          <h3>40+</h3>
          <p>Years of Trust</p>
        </div>
        <div className="trust-card">
          <h3>BIS</h3>
          <p>Hallmark Certified</p>
        </div>
        <div className="trust-card">
          <h3>GST</h3>
          <p>Registered Business</p>
        </div>
        <div className="trust-card">
          <h3>India</h3>
          <p>Delivery Support</p>
        </div>
      </section>

      <section className="rates-section" id="gold-rates">
        <p className="eyebrow center">Live Gold Rates</p>
        <h2>Today’s Gold Rate</h2>

        {goldRates ? (
          <div className="rates-grid">
            <div className="rate-card">
              <span>24K Gold</span>
              <strong>₹{goldRates.rate24K}/gm</strong>
            </div>
            <div className="rate-card">
              <span>22K Gold</span>
              <strong>₹{goldRates.rate22K}/gm</strong>
            </div>
            <div className="rate-card">
              <span>18K Gold</span>
              <strong>₹{goldRates.rate18K}/gm</strong>
            </div>
            <div className="rate-card">
              <span>Silver</span>
              <strong>₹{goldRates.silverRate}/gm</strong>
            </div>
          </div>
        ) : (
          <p className="loading">Loading gold rates from backend...</p>
        )}
      </section>

      <section className="products-section" id="products">
        <p className="eyebrow center">Featured Product</p>
        <h2>Backend Connected Product</h2>

        {product ? (
          <div className="product-card">
            <div className="product-image">
              <img src="/images/dukan_papa.jpeg" alt={product.name} />
            </div>

            <div className="product-info">
              <p className="badge">Backend API Product</p>
              <h3>{product.name}</h3>
              <p>{product.goldPurityDisplay}</p>
              <p>Weight: {product.weightGrams} gm</p>
              <p>Gold Rate Used: ₹{product.currentGoldRatePerGram}/gm</p>
              <h4>Final Price: ₹{product.finalPrice}</h4>
              <button className="btn primary">View Details</button>
            </div>
          </div>
        ) : (
          <p className="loading">Loading product from backend...</p>
        )}
      </section>

      <section className="store-section" id="store">
        <div>
          <p className="eyebrow">Visit Our Store</p>
          <h2>Raj Laxmi Jewellers</h2>
          <p>
            Bhagwan Das & Sons, Wazirganj, Gaya, Bihar. Near Santoshi Mata Mandir.
          </p>
          <p>Call: +91 91023 16789</p>
        </div>

        <img src="/images/dukan_papa.jpeg" alt="Raj Laxmi Jewellers Interior" />
      </section>

      <footer>
        <p>© 2026 Raj Laxmi Jewellers · Bhagwan Das & Sons</p>
        <p>Built with React + Spring Boot</p>
      </footer>
    </div>
  );
}

export default App;