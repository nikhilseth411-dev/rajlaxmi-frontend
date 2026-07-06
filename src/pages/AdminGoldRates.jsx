import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL } from "../config/api";

function AdminGoldRates() {
  const navigate = useNavigate();
  const token = localStorage.getItem("rajlaxmi_admin_token");

  const [currentRate, setCurrentRate] = useState(null);
  const [form, setForm] = useState({
    rate24K: "",
    silverRatePer10Gram: "",
    reason: "Manual rate updated by shop owner",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    fetchCurrentRate();
  }, []);

  async function fetchCurrentRate() {
    setFetching(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/gold-rates/current`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch current gold rate");
      }

      setCurrentRate(data.data || data);
    } catch (err) {
      setError(err.message || "Unable to fetch gold rate");
    } finally {
      setFetching(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function updateGoldRate(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const rate24K = Number(form.rate24K);
      const silverRatePer10Gram = Number(form.silverRatePer10Gram);

      if (!rate24K || rate24K < 1000) {
        throw new Error("Please enter a valid 24K gold rate per gram");
      }
      if (!silverRatePer10Gram || silverRatePer10Gram < 1) {
        throw new Error("Please enter a valid silver rate per 10 grams");
      }

      const response = await fetch(`${API_BASE_URL}/admin/gold-rates/override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rate24KPerGram: rate24K,
          silverRatePer10Gram,
          reason: form.reason,
        }),
      });

      let data = null;

      const text = await response.text();

      if (text) {
        data = JSON.parse(text);
      }

      if (!response.ok) {
        console.log("Gold rate update failed status:", response.status);
        console.log("Gold rate update failed body:", text);

        throw new Error(
          data?.message ||
          text ||
          `Unable to update gold rate. Status: ${response.status}`
        );
      }
      setMessage("Gold rate updated successfully!");
      setForm((previous) => ({
        ...previous,
        rate24K: "",
        silverRatePer10Gram: "",
      }));

      await fetchCurrentRate();
    } catch (err) {
      setError(err.message || "Unable to update gold rate");
    } finally {
      setLoading(false);
    }
  }

  const rateData = currentRate?.data || currentRate;

  return (
    <main className="adminPage">
      <aside className="adminSidebar">
        <div className="adminLogoBox">
          <img src="/images/logo/shop-logo.jpeg" alt="RajLaxmi Jewellers" />
          <h2>RajLaxmi Admin</h2>
          <p>Bhagwan Das & Sons</p>
        </div>

        <nav className="adminMenu">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/gold-rates">Gold Rates</Link>
          <Link to="/admin/products/new">Add Product</Link>
          <Link to="/admin/products">Manage Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/payments">Payments</Link>
        </nav>
      </aside>

      <section className="adminMain">
        <div className="adminTopbar">
          <div>
            <p>Owner Control</p>
            <h1>Gold Rate Management</h1>
          </div>
          <Link to="/admin" className="adminBackLink">
            Back to Dashboard
          </Link>
        </div>

        <div className="goldRateLayout">
          <section className="goldRateCard">
            <h2>Current Gold Rates</h2>

            {fetching ? (
              <p className="adminMuted">Loading current rates...</p>
            ) : (
              <div className="rateBoxes">
                <div className="rateBox">
                  <span>24K Gold</span>
                  <strong>₹{rateData?.rate24K || rateData?.gold24K || "N/A"}</strong>
                  <small>per gram</small>
                </div>

                <div className="rateBox">
                  <span>22K Gold</span>
                  <strong>₹{rateData?.rate22K || rateData?.gold22K || "N/A"}</strong>
                  <small>per gram</small>
                </div>

                <div className="rateBox">
                  <span>18K Gold</span>
                  <strong>₹{rateData?.rate18K || rateData?.gold18K || "N/A"}</strong>
                  <small>per gram</small>
                </div>

                <div className="rateBox silverRateBox">
                  <span>999 Fine Silver</span>
                  <strong>₹{rateData?.silverRatePer10Gram || "N/A"}</strong>
                  <small>per 10 grams</small>
                </div>
              </div>
            )}

            <p className="adminMuted">
              These rates stay active through refreshes and redeploys until you save new rates.
            </p>
          </section>

          <section className="goldRateCard">
            <h2>Update Manual Gold Rate</h2>
            <p className="adminMuted">
              Enter only the 24K gold rate. The system calculates 22K and 18K
              automatically. Enter silver using the market rate per 10 grams.
            </p>

            <form className="adminForm" onSubmit={updateGoldRate}>
              <label>
                24K Gold Rate Per Gram
                <input
                  type="number"
                  name="rate24K"
                  value={form.rate24K}
                  onChange={handleChange}
                  placeholder="Example: 7300"
                  min="1000"
                  step="0.01"
                  required
                />
              </label>

              {Number(form.rate24K) >= 1000 && (
                <div className="derivedRatePreview" aria-live="polite">
                  <span>22K calculated: ₹{(Number(form.rate24K) * 0.916).toFixed(2)} / gm</span>
                  <span>18K calculated: ₹{(Number(form.rate24K) * 0.75).toFixed(2)} / gm</span>
                </div>
              )}

              <label>
                Silver Rate Per 10 Grams
                <input
                  type="number"
                  name="silverRatePer10Gram"
                  value={form.silverRatePer10Gram}
                  onChange={handleChange}
                  placeholder="Example: 1050"
                  min="1"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Reason / Note
                <input
                  type="text"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Why rate is updated"
                />
              </label>

              {message && <p className="adminSuccess">{message}</p>}
              {error && <p className="adminError">{error}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Gold Rate"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

export default AdminGoldRates;
