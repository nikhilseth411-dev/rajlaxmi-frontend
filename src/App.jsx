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
import PhoneOtpLogin from "./pages/PhoneOtpLogin";
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
import AdminAccountSettings from "./pages/AdminAccountSettings";

import { API_BASE_URL, BACKEND_BASE_URL } from "./config/api";

const LOGOS = {
  bis: "/images/logos/bis-logo.jpeg",
  gst: "/images/logos/gst-logo.jpeg",
  whatsapp: "/images/logos/whatsapp.svg",
};

const CERTIFICATES = {
  gst: "/certificates/gst-certificate.jpeg",
  bis: "/certificates/bis-certificate.jpeg",
};

const SHOP_MAP_URL = "https://maps.app.goo.gl/wvdHLEMdqAJDsCZW8?g_st=ac";

const HERO_SLIDES = featuredJewellery.slice(0, 10).map((item) => item.image);

const SHOP_CATEGORIES = [
  { name: "Bangles", image: "/images/categories/bangles.png" },
  { name: "Mangalsutra", image: "/images/products/mangalsutra/Mangalsutra-1.png" },
  { name: "Earrings", image: "/images/products/earrings/EARINGS4.jpeg" },
  { name: "Necklaces", image: "/images/products/choker/CHOKER1_35.893gm.png" },
  { name: "Rings", image: "/images/products/ladies-rings/LADIES-RINGS1.jpeg" },
  { name: "Pendants", image: "/images/products/mangalsutra/Mangalsutra-2.png" },
  { name: "Chains", image: "/images/categories/chains.png" },
  { name: "Bracelets", image: "/images/categories/bracelets.png" },
  { name: "Mangtika", image: "/images/categories/mangtika.png" },
  { name: "Dholna", image: "/images/categories/dholna.png" },
  { name: "Nathiya", image: "/images/categories/nathiya.png" },
  { name: "Jhumka", image: "/images/categories/jhumka.png" },
  { name: "Tops", image: "/images/categories/tops.png" },
  { name: "Lockets", image: "/images/categories/lockets.png" },
];

const CATEGORY_QUERY_ALIASES = {
  Chokers: "Necklaces",
  "Rajkot Bali": "Earrings",
  "Ladies Rings": "Rings",
  "Gents Rings": "Rings",
};

const getCategoryPath = (categoryName) => {
  const queryCategory = CATEGORY_QUERY_ALIASES[categoryName] || categoryName;
  return `/products?category=${encodeURIComponent(queryCategory)}`;
};

const extractProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const getProductImageUrl = (imageUrl) => {
  if (!imageUrl) return "/images/placeholders/jewellery-display.webp";
  if (imageUrl.startsWith("http")) return encodeURI(imageUrl);

  const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  if (cleanPath.startsWith("api/v1/")) {
    return encodeURI(`${BACKEND_BASE_URL}/${cleanPath}`);
  }
  return encodeURI(`${API_BASE_URL}/${cleanPath}`);
};

const formatCategoryName = (value) =>
  String(value || "Jewellery")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatProductPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Price on Enquiry";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatProductWeight = (item) => {
  const weight = Number(item?.weightGrams ?? item?.weightInGrams ?? item?.weight);
  return Number.isFinite(weight) ? `${weight.toFixed(3)} gm` : null;
};

function HomePage() {
  const [goldRates, setGoldRates] = useState(null);
  const [homepageProducts, setHomepageProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchGoldRates() {
      try {
        const response = await fetch(`${API_BASE_URL}/gold-rates/current`);
        const result = await response.json();
        if (active) setGoldRates(result.data);
      } catch (error) {
        console.error("Gold rates error:", error);
      }
    }

    async function fetchHomepageProducts() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/products?page=0&size=12&sortBy=createdAt&sortDir=desc`,
        );
        if (!response.ok) return;

        const products = extractProducts(await response.json());
        if (active && products.length > 0) setHomepageProducts(products);
      } catch (error) {
        console.error("Featured products error:", error);
      }
    }

    fetchGoldRates();
    fetchHomepageProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="site">
      <TopTicker goldRates={goldRates} />
      <Header />

      <main>
        <Hero currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
        <TrustStrip />
        <ShopByCategory />
        <FeaturedJewellery products={homepageProducts} />
        <Collections />
        <SilverJewellery goldRates={goldRates} />
        <Heritage />
        <Credentials />
        <GoldRates goldRates={goldRates} />
        <VisitStore />
        <CustomerReviews />
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const customerToken = localStorage.getItem("rajlaxmi_customer_token");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 1120) setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const navigateFromHeader = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleHeaderSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
    closeMenu();
  };

  const handleLogout = () => {
    closeMenu();
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

      <form className="headerSearch" role="search" onSubmit={handleHeaderSearch}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search for jewellery"
          aria-label="Search jewellery"
        />
        <button type="submit" aria-label="Submit jewellery search">&#128269;</button>
      </form>

      <a className="headerPhone" href="tel:+919102316789">
        <span aria-hidden="true">&#9742;</span> +91 91023 16789
      </a>

      <nav className="nav" aria-label="Primary navigation">
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

      <div className="mobileHeaderActions">
        <button
          className="mobileCartButton"
          type="button"
          aria-label="Open cart"
          title="Cart"
          onClick={() => navigateFromHeader("/cart")}
        >
          <span className="mobileCartIcon" aria-hidden="true">&#128722;</span>
          <span className="mobileCartCount">0</span>
        </button>

        <button
          className="mobileLoginButton"
          type="button"
          onClick={() => navigateFromHeader(customerToken ? "/my-orders" : "/login")}
        >
          {customerToken ? "Orders" : "Login"}
        </button>

        <button
          className={`mobileMenuToggle ${isMenuOpen ? "isOpen" : ""}`}
          type="button"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mobileMenu ${isMenuOpen ? "isOpen" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="mobileNav" aria-label="Mobile navigation">
          <a href="#home" onClick={closeMenu}>Home</a>
          <Link to="/products" onClick={closeMenu}>Products</Link>
          <a href="#collections" onClick={closeMenu}>Collections</a>
          <a href="#story" onClick={closeMenu}>Our Story</a>
          <a href="#credentials" onClick={closeMenu}>Verified Business</a>
          <a href="#gold-rates" onClick={closeMenu}>Gold Rates</a>
          <a href="#store" onClick={closeMenu}>Visit Store</a>
          <button type="button" onClick={() => navigateFromHeader("/cart")}>Cart</button>
          {customerToken ? (
            <button type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <button type="button" onClick={() => navigateFromHeader("/login")}>Login</button>
          )}
        </nav>
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

function ShopByCategory() {
  return (
    <section className="shopCategorySection" id="shop-by-category">
      <div className="shopCategoryHeading">
        <p>Find Your Signature Piece</p>
        <h2>Shop By Category</h2>
        <span aria-hidden="true" />
      </div>

      <div className="categoryScroller">
        {SHOP_CATEGORIES.map((category) => (
          <Link
            className="categoryCard"
            key={category.name}
            to={getCategoryPath(category.name)}
            aria-label={`Shop ${category.name}`}
          >
            <span className="categoryIcon">
              <img src={category.image} alt={`${category.name} jewellery`} />
            </span>
            <span className="categoryName">{category.name}</span>
          </Link>
        ))}
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
          <Link
            className="collectionCard"
            key={item.folder}
            to={getCategoryPath(item.name)}
            aria-label={`Browse ${item.name}`}
          >
            <div className="collectionImage">
              <img src={item.image} alt={item.name} />
            </div>
            <h3>{item.name}</h3>
            <p>{item.subtitle}</p>
            <span>{item.count} designs</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SilverJewellery({ goldRates }) {
  return (
    <section className="silverCollectionBand" aria-labelledby="silver-collection-title">
      <div className="silverCollectionImage">
        <img src="/images/silver/lord-ganesh-silver.png" alt="Silver Lord Ganesh idol" />
      </div>
      <div className="silverCollectionContent">
        <p>925 Sterling & 999 Fine Silver</p>
        <h2 id="silver-collection-title">Silver Jewellery</h2>
        <span>Elegant silver pieces with transparent weight-based pricing.</span>
        {goldRates?.silverRatePer10Gram && (
          <strong>Today's silver rate: ₹{goldRates.silverRatePer10Gram} / 10 gm</strong>
        )}
        <Link to={getCategoryPath("Silver Collection")} className="btn btnPrimary">
          Explore Silver
        </Link>
      </div>
    </section>
  );
}

function FeaturedJewellery({ products }) {
  const hasLiveProducts = products.length > 0;
  const displayItems = hasLiveProducts
    ? products.slice(0, 12)
    : featuredJewellery.slice(0, 12);

  return (
    <section className="section" id="featured">
      <SectionHeading eyebrow="Handpicked Designs" title="Featured Jewellery" />

      <div className="jewelleryGrid">
        {displayItems.map((item) => {
          const categoryName = hasLiveProducts
            ? item.categoryName || formatCategoryName(item.productCategory)
            : item.category;
          const imageUrl = hasLiveProducts
            ? getProductImageUrl(item.primaryImageUrl)
            : item.image;
          const productPath = hasLiveProducts
            ? `/products/${item.id}`
            : getCategoryPath(item.category);
          const purity = hasLiveProducts
            ? [item.metalType, item.goldPurity].filter(Boolean).join(" · ") ||
              "Fine Jewellery"
            : item.purity;
          const weightText = hasLiveProducts ? formatProductWeight(item) : null;
          const priceText = hasLiveProducts
            ? formatProductPrice(item.finalPrice)
            : item.priceText || "Price on Enquiry";

          return (
          <Link
            className="jewelleryCard"
            key={item.id}
            to={productPath}
            aria-label={`View ${item.name}`}
          >
            <div className="jewelleryImage">
              <img
                src={imageUrl}
                alt={item.name}
                onError={(event) => {
                  event.currentTarget.src = "/images/placeholders/jewellery-display.webp";
                }}
              />
            </div>

            <div className="jewelleryInfo">
              <p>{categoryName}</p>
              <h3>{item.name}</h3>
              <span className="jewellerySpecs">{purity}</span>
              {weightText && <span className="jewelleryWeight">Weight: {weightText}</span>}
              <strong>{priceText}</strong>
              {weightText && <small className="jewelleryPriceContext">Final price for {weightText}</small>}
            </div>
          </Link>
          );
        })}
      </div>
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
          <RateCard title="Silver" sub="999 Fine Silver" value={goldRates.silverRatePer10Gram || "-"} unit="10 gm" />
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

function RateCard({ title, sub, value, unit = "gm" }) {
  return (
    <div className="rateCard">
      <p>{title}</p>
      <span>{sub}</span>
      <h3>₹{value}/{unit}</h3>
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
            <a href={SHOP_MAP_URL} target="_blank" rel="noreferrer" className="btn btnOutline">
              Open Map
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomerReviews() {
  const reviews = [
    ["Excellent collection", "Beautiful gold designs, honest pricing, and very polite shop guidance."],
    ["Trusted family shop", "We liked the transparent weight and rate details before buying."],
    ["Lovely designs", "The jewellery finishing is premium and the staff explains everything clearly."],
    ["Good service", "Quick support on WhatsApp and a smooth visit at the store."],
    ["Recommended", "A reliable local jeweller for gold and silver jewellery in Wazirganj."],
  ];

  return (
    <section className="customerReviews">
      <SectionHeading eyebrow="Customer Trust" title="Customer Reviews" />
      <div className="reviewScroller">
        {reviews.map(([title, text]) => (
          <article className="reviewCard" key={title}>
            <div aria-label="5 star review">★★★★★</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
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
        <p>Near Santoshi Mata Mandir, Wazirganj, Gaya, Bihar 805131</p>
        <p>+91 91023 16789</p>
        <p>rajlaxmijewellers.gaya@gmail.com</p>
        <a className="footerMapLink" href={SHOP_MAP_URL} target="_blank" rel="noreferrer">
          <span>Open shop location in Google Maps</span>
          <small>Near Santoshi Mata Mandir, Wazirganj</small>
        </a>
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

function CustomerMobileToolbar() {
  const location = useLocation();
  const customerToken = localStorage.getItem("rajlaxmi_customer_token");
  const isAdminPage =
    location.pathname.startsWith("/admin") || location.pathname === "/adminlogin";
  const isFullPage =
    location.pathname.startsWith("/order-success") ||
    location.pathname.startsWith("/payment");

  if (isAdminPage || isFullPage) return null;

  return (
    <nav className="mobileToolbar" aria-label="Quick navigation">
      <Link to="/"><span aria-hidden="true">&#8962;</span>Home</Link>
      <Link to="/products"><span aria-hidden="true">&#9670;</span>Shop</Link>
      <a
        href="https://wa.me/919102316789?text=Namaste%2C%20I%20want%20to%20enquire%20about%20jewellery."
        target="_blank"
        rel="noreferrer"
      >
        <span aria-hidden="true">&#9742;</span>WhatsApp
      </a>
      <Link to="/cart"><span aria-hidden="true">&#128722;</span>Cart</Link>
      <Link to={customerToken ? "/profile" : "/login"}>
        <span aria-hidden="true">&#9675;</span>{customerToken ? "Account" : "Login"}
      </Link>
    </nav>
  );
}

function App() {
  return (
    <>
      <CustomerNavbar />
      <CustomerMobileToolbar />

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
        <Route path="/admin/account" element={<AdminAccountSettings />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<PhoneOtpLogin />} />
        <Route path="/phone-login" element={<PhoneOtpLogin />} />
        <Route path="/email-login" element={<CustomerLogin />} />
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
