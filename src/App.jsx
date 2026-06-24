import { useEffect, useState } from "react";
import "./App.css";
import { shopImages, collections, featuredJewellery } from "./data/productImages";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGoldRates from "./pages/AdminGoldRates";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminProductImages from "./pages/AdminProductImages";
import AdminManageProducts from "./pages/AdminManageProducts";
import AdminEditProduct from "./pages/AdminEditProduct";
import AdminOrders from "./pages/AdminOrders";
import AdminPayments from "./pages/AdminPayments";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CustomerLogin from "./pages/CustomerLogin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import PaymentSubmit from "./pages/PaymentSubmit";
import MyOrders from "./pages/MyOrders";
import CustomerRegister from "./pages/CustomerRegister";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import AddressBook from "./pages/AddressBook";
import Profile from "./pages/Profile";
import AdminCustomers from "./pages/AdminCustomers";
import AdminCoupons from "./pages/AdminCoupons";

const API_BASE_URL = "http://localhost:8080/api/v1";

const LOGOS = {
  bis: "/images/logos/bis-logo.jpeg",
  gst: "/images/logos/gst-logo.jpeg",
  whatsapp: "/images/logos/whatsapp.svg",
};

const CERTIFICATES = {
  gst: "/certificates/gst-certificate.jpeg",
  bis: "/certificates/bis-certificate.jpeg",
};

const HERO_SLIDES = featuredJewellery.slice(0, 10).map((item) => item.image);

function HomePage() {
  const [goldRates, setGoldRates] = useState(null);
  const [backendProduct, setBackendProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchGoldRates();
    fetchBackendProduct();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  async function fetchGoldRates() {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-rates/current`);
      const result = await response.json();
      setGoldRates(result.data);
    } catch (error) {
      console.error("Gold rates error:", error);
    }
  }

  async function fetchBackendProduct() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/1`);
      const result = await response.json();
      setBackendProduct(result.data);
    } catch (error) {
      console.error("Product error:", error);
    }
  }

  return (
    <div className="site">
      <TopTicker goldRates={goldRates} />
      <Header />

      <main>
        <Hero currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
        <TrustStrip />
        <Heritage />
        <Collections />
        <FeaturedJewellery />
        <LivePriceDemo product={backendProduct} />
        <Credentials />
        <GoldRates goldRates={goldRates} />
        <VisitStore />
      </main>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function TopTicker({ goldRates }) {
  const items = [
    ["Gold 22K", `₹${goldRates?.rate22K || "..."}/gm`],
    ["Gold 24K", `₹${goldRates?.rate24K || "..."}/gm`],
    ["Gold 18K", `₹${goldRates?.rate18K || "..."}/gm`],
    ["BIS Hallmark", "HWC-5390621713"],
    ["GST", "10NKIPS7807A1Z5"],
    ["Call", "+91 91023 16789"],
    ["Pan India", "Delivery Available"],
  ];

  return (
    <div className="ticker">
      <div className="tickerTrack">
        {[...items, ...items].map((item, index) => (
          <span key={index}>
            <b>{item[0]}</b> {item[1]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const customerToken = localStorage.getItem("rajlaxmi_customer_token");

  const handleLogout = () => {
    localStorage.removeItem("rajlaxmi_customer_token");
    navigate("/login");
  };

  return (
    <header className="header">
      <a href="#home" className="brand">
        <img className="brandLogo" src={shopImages.logo} alt="RajLaxmi Jewellers Logo" />
        <div>
          <h1>RajLaxmi Jewellers</h1>
          <p>Bhagwan Das & Sons · Est. 1984</p>
        </div>
      </a>

      <nav className="nav">
        <a href="#story">Our Story</a>
        <Link to="/products">Products</Link>
        <a href="#collections">Collections</a>
        <a href="#credentials">Verified Business</a>
        <a href="#gold-rates">Gold Rates</a>
        <a href="#store">Visit Store</a>
      </nav>

      <div className="actions">
        <button aria-label="Search">🔍</button>

        <button aria-label="Wishlist" disabled title="Wishlist coming soon">
          🤍
        </button>

        <button
          className="cartBtn"
          aria-label="Cart"
          onClick={() => navigate("/cart")}
        >
          🛒 <span>0</span>
        </button>

        {customerToken && (
          <button
            className="loginBtn"
            onClick={() => navigate("/my-orders")}
          >
            My Orders
          </button>
        )}

        {customerToken ? (
          <button className="loginBtn" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="loginBtn" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}

function Hero({ currentSlide, setCurrentSlide }) {
  return (
    <section className="heroSection" id="home">
      <div className="heroLeft">
        <p className="heroTopline">Bhagwan Das & Sons · Wazirganj, Gaya · Est. 1984</p>

        <div className="trustBadge">
          <span>40+</span>
          <p>
            Years of Trust
            <br />
            Serving Families Since 1984
          </p>
        </div>

        <h2 className="heroTitle">
          Jewellery That
          <br />
          Carries
          <br />
          the Weight of
          <br />
          <em>Generations</em>
        </h2>

        <p className="heroHindi">पीढ़ियों का विश्वास, शाश्वत सुंदरता</p>

        <p className="heroText">
          Trusted family jeweller since 1984. BIS hallmarked jewellery, GST
          registered business, transparent pricing and real shop support from
          Wazirganj, Gaya, Bihar.
        </p>

        <div className="heroButtons">
          <a href="#collections" className="btn btnPrimary">
            Explore Collections
          </a>

          <a
            href="https://wa.me/919102316789?text=Namaste%2C%20I%20want%20to%20enquire%20about%20jewellery."
            target="_blank"
            rel="noreferrer"
            className="btn btnWhatsapp"
          >
            <img src={LOGOS.whatsapp} alt="WhatsApp" />
            WhatsApp Inquiry
          </a>
        </div>

        <div className="heroPoints">
          <span>BIS Hallmark Certified</span>
          <span>GST Registered</span>
          <span>Pan India Delivery</span>
          <span>Est. 1984</span>
        </div>
      </div>

      <div className="heroRight">
        <div className="heroSliderCard">
          <img
            src={HERO_SLIDES[currentSlide]}
            alt={`Jewellery slide ${currentSlide + 1}`}
            className="heroSliderImage"
          />

          <div className="heroSliderOverlay">
            <p>RajLaxmi Jewellers</p>
            <h3>Wazirganj, Gaya</h3>
            <span>Premium BIS hallmarked jewellery</span>
          </div>

          <div className="heroDots">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                className={currentSlide === index ? "dot active" : "dot"}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    {
      title: "BIS Hallmark Certified",
      text: "Official purity certification on jewellery",
      icon: LOGOS.bis,
      image: true,
    },
    {
      title: "GST Registered",
      text: "GSTIN: 10NKIPS7807A1Z5",
      icon: LOGOS.gst,
      image: true,
    },
    {
      title: "Since 1984",
      text: "40+ years of family trust",
      icon: "📅",
      image: false,
    },
    {
      title: "Pan India Delivery",
      text: "Delivery support across India",
      icon: "🚚",
      image: false,
    },
    {
      title: "WhatsApp Support",
      text: "Easy inquiry and order support",
      icon: LOGOS.whatsapp,
      image: true,
    },
  ];

  return (
    <section className="trustStrip">
      {items.map((item) => (
        <div className="trustItem" key={item.title}>
          <div className="trustIconWrap">
            {item.image ? (
              <img src={item.icon} alt={item.title} className="trustIconImg" />
            ) : (
              <span className="trustIconText">{item.icon}</span>
            )}
          </div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      ))}
    </section>
  );
}

function Heritage() {
  return (
    <section className="heritage" id="story">
      <div className="heritageImage">
        <img src={shopImages.shopOne} alt="RajLaxmi Jewellers shop photo" />
      </div>

      <div className="heritageText">
        <div className="bigYear">1984</div>
        <p className="goldSmall">Bhagwan Das & Sons · Gaya, Bihar</p>

        <h2>
          A Family Legacy Built on
          <br />
          <em>Four Decades of Trust</em>
        </h2>

        <p className="heritageHindi">पीढ़ियों का विश्वास, शाश्वत सुंदरता</p>

        <p>
          Since 1984, RajLaxmi Jewellers has served families with honest advice,
          pure jewellery and transparent pricing. We are not just an online seller —
          we are a real jewellery shop that customers can visit and trust.
        </p>

        <div className="heritagePoints">
          <span>BIS Hallmark certified</span>
          <span>Transparent pricing</span>
          <span>GST Registered</span>
          <span>Pan India delivery</span>
        </div>

        <div className="stats">
          <div>
            <strong>40+</strong>
            <span>Years</span>
          </div>
          <div>
            <strong>22K</strong>
            <span>Gold Standard</span>
          </div>
          <div>
            <strong>BIS</strong>
            <span>Hallmark</span>
          </div>
          <div>
            <strong>GST</strong>
            <span>Registered</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Collections() {
  return (
    <section className="section" id="collections">
      <SectionHeading eyebrow="Browse by Category" title="Our Collections" />

      <div className="collectionGrid">
        {collections.map((item) => (
          <div className="collectionCard" key={item.folder}>
            <div className="collectionImage">
              <img src={item.image} alt={item.name} />
            </div>
            <h3>{item.name}</h3>
            <p>{item.subtitle}</p>
            <span>{item.count} designs</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedJewellery() {
  return (
    <section className="section" id="featured">
      <SectionHeading eyebrow="Handpicked Designs" title="Featured Jewellery" />

      <div className="jewelleryGrid">
        {featuredJewellery.slice(0, 12).map((item) => (
          <div className="jewelleryCard" key={item.id}>
            <div className="jewelleryImage">
              <img src={item.image} alt={item.name} />
            </div>

            <div className="jewelleryInfo">
              <p>{item.category}</p>
              <h3>{item.name}</h3>
              <span>{item.purity}</span>
              <strong>{item.priceText}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LivePriceDemo({ product }) {
  return (
    <section className="section priceDemo">
      <SectionHeading eyebrow="Backend Connected" title="Live Price Calculation Demo" />

      {product ? (
        <div className="featuredCard">
          <div className="featuredImage">
            <img src={featuredJewellery[0]?.image} alt={product.name} />
          </div>

          <div className="featuredInfo">
            <span className="tag">Spring Boot API Connected</span>
            <h3>{product.name}</h3>
            <p>{product.goldPurityDisplay}</p>
            <p>Weight: {product.weightGrams} gm</p>
            <p>Gold Rate Used: ₹{product.currentGoldRatePerGram}/gm</p>
            <p>Making Charges: ₹{product.makingCharges}</p>
            <p>GST: ₹{product.gstAmount}</p>
            <h4>₹{product.finalPrice}</h4>
            <button className="enquireBtn">Enquire Now</button>
          </div>
        </div>
      ) : (
        <p className="loadingText">Loading product from backend...</p>
      )}
    </section>
  );
}

function Credentials() {
  const cards = [
    {
      label: "Government of India",
      title: "GST Registration Certificate",
      badge: "Verified & Active",
      logo: LOGOS.gst,
      certificate: CERTIFICATES.gst,
      button: "Open GST Certificate",
      rows: [
        ["Legal Name", "NITIN SETH"],
        ["Trade Name", "M/S RAJ LAXMI JEWELLERS"],
        ["GSTIN", "10NKIPS7807A1Z5"],
        ["Place", "Gaya, Bihar"],
      ],
    },
    {
      label: "Bureau of Indian Standards",
      title: "BIS Hallmark Registration",
      badge: "Hallmark Authorised Jeweller",
      logo: LOGOS.bis,
      certificate: CERTIFICATES.bis,
      button: "Open BIS Certificate",
      rows: [
        ["Registered Name", "M/S RAJ LAXMI JEWELLERS"],
        ["BIS Cert. No.", "HWC-5390621713"],
        ["Standard", "IS 1417 : 2016 Gold Alloys"],
        ["Office", "Patna Branch Office, BIS"],
      ],
    },
  ];

  return (
    <section className="section credentials" id="credentials">
      <SectionHeading eyebrow="Verified Business" title="Our Business Credentials" />

      <div className="credGrid">
        {cards.map((card) => (
          <div className="credCard" key={card.title}>
            <div className="credHeader">
              <div className="credLogoBox">
                <img src={card.logo} alt={card.title} />
              </div>

              <div>
                <p className="goldSmall">{card.label}</p>
                <h3>{card.title}</h3>
                <span className="verified">✓ {card.badge}</span>
              </div>
            </div>

            <div className="credRows">
              {card.rows.map((row) => (
                <p key={row[0]}>
                  <b>{row[0]}</b>
                  <span>{row[1]}</span>
                </p>
              ))}
            </div>

            <a href={card.certificate} target="_blank" rel="noreferrer" className="certificateBtn">
              {card.button}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoldRates({ goldRates }) {
  return (
    <section className="rates" id="gold-rates">
      <SectionHeading eyebrow="Updated From Backend" title="Today’s Gold & Silver Rates" dark />

      {goldRates ? (
        <div className="ratesGrid">
          <RateCard title="Gold 24K" sub="99.9% Pure" value={goldRates.rate24K} />
          <RateCard title="Gold 22K" sub="91.6% Pure · BIS 916" value={goldRates.rate22K} />
          <RateCard title="Gold 18K" sub="75.0% Pure" value={goldRates.rate18K} />
          <RateCard title="Silver" sub="999 Fine Silver" value={goldRates.silverRate || "-"} />
        </div>
      ) : (
        <p className="loadingText light">Loading gold rates from backend...</p>
      )}

      <p className="rateNote">
        Final price = gold rate × gram weight + making charges + GST
      </p>
    </section>
  );
}

function RateCard({ title, sub, value }) {
  return (
    <div className="rateCard">
      <p>{title}</p>
      <span>{sub}</span>
      <h3>₹{value}/gm</h3>
    </div>
  );
}

function VisitStore() {
  return (
    <section className="visitStore" id="store">
      <SectionHeading
        eyebrow="RajLaxmi Jewellers · Bhagwan Das & Sons"
        title="Come Meet Us in Gaya, Bihar"
      />

      <div className="visitSingleLayout">
        <div className="visitBigImage">
          <img src={shopImages.shopTwo} alt="RajLaxmi Jewellers shop photo" />
        </div>

        <div className="visitContent">
          <h3>Visit Our Jewellery Store</h3>
          <p className="visitIntro">
            RajLaxmi Jewellers and Darshana Jewellers is a trusted family jewellery shop in Wazirganj,
            Gaya. Customers can visit our store for gold jewellery, silver
            jewellery, BIS hallmarked pieces, transparent pricing, and personal
            guidance.
          </p>

          <div className="contactList">
            <p>
              <b>Address</b>
              <span>Near Santoshi Mata Mandir, Wazirganj, Gaya, Bihar</span>
            </p>
            <p>
              <b>Call</b>
              <span>+91 91023 16789</span>
            </p>
            <p>
              <b>Email</b>
              <span>rajlaxmijewellers.gaya@gmail.com</span>
            </p>
            <p>
              <b>Store Hours</b>
              <span>Mon - Sun: 09:00 AM - 8:00 PM</span>
            </p>
          </div>

          <div className="heroButtons">
            <a
              href="https://wa.me/919102316789?text=Namaste%2C%20I%20want%20to%20book%20a%20store%20visit."
              target="_blank"
              rel="noreferrer"
              className="btn btnWhatsapp"
            >
              <img src={LOGOS.whatsapp} alt="WhatsApp" />
              Book a Visit
            </a>
            <a href="tel:+919102316789" className="btn btnOutline">
              Call Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <h3>RajLaxmi Jewellers</h3>
        <p>Bhagwan Das & Sons · Since 1984</p>
        <p>GSTIN: 10NKIPS7807A1Z5</p>
        <p className="footerHindi">पीढ़ियों का विश्वास, शाश्वत सुंदरता</p>
      </div>

      <div>
        <h4>Collections</h4>
        <p>Chokers</p>
        <p>Earrings</p>
        <p>Rings</p>
        <p>Mangalsutra</p>
      </div>

      <div>
        <h4>Information</h4>
        <p>Our Story</p>
        <p>Gold Rates</p>
        <p>Visit Store</p>
        <p>Verified Business</p>
      </div>

      <div>
        <h4>Contact Us</h4>
        <p>Wazirganj, Gaya, Bihar</p>
        <p>+91 91023 16789</p>
        <p>rajlaxmijewellers.gaya@gmail.com</p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/919102316789?text=Namaste%2C%20I%20want%20to%20enquire%20about%20jewellery."
      target="_blank"
      rel="noreferrer"
      className="whatsappFloat"
      aria-label="WhatsApp"
    >
      <img src={LOGOS.whatsapp} alt="WhatsApp" />
    </a>
  );
}

function SectionHeading({ eyebrow, title, dark }) {
  return (
    <div className={`sectionHeading ${dark ? "darkHeading" : ""}`}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <div></div>
    </div>
  );
}

function CustomerNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPage =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/adminlogin";

  const isFullPage =
    location.pathname.startsWith("/order-success") ||
    location.pathname.startsWith("/payment");

  const isHomePage = location.pathname === "/";

  if (isAdminPage || isFullPage || isHomePage) {
    return null;
  }
  const customerToken = localStorage.getItem("rajlaxmi_customer_token");

  const handleLogout = () => {
    localStorage.removeItem("rajlaxmi_customer_token");
    navigate("/login");
  };

  return (
    <nav className="customerNavbar">
      <Link to="/" className="customerBrand">
        Raj Laxmi Jewellers
      </Link>

      <div className="customerNavLinks">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/cart">Cart</Link>

        {customerToken && <Link to="/my-orders">My Orders</Link>}
        {customerToken && <Link to="/addresses">Addresses</Link>}
        {customerToken && <Link to="/profile">Profile</Link>}

        {customerToken ? (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <>
      <CustomerNavbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/gold-rates" element={<AdminGoldRates />} />
        <Route path="/admin/products/new" element={<AdminAddProduct />} />
        <Route path="/admin/products/:productId/images" element={<AdminProductImages />} />
        <Route path="/admin/products" element={<AdminManageProducts />} />
        <Route path="/admin/products/:productId/edit" element={<AdminEditProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/payment/:orderId" element={<PaymentSubmit />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/addresses" element={<AddressBook />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
      </Routes>
    </>
  );
}
export default App;