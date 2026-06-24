import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";

const API_BASE_URL = "http://localhost:8080/api/v1";

function AdminGoldRates() {
  const navigate = useNavigate();
  const token = localStorage.getItem("rajlaxmi_admin_token");

  const [currentRate, setCurrentRate] = useState(null);
  const [form, setForm] = useState({
    rate24K: "",
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

      if (!rate24K || rate24K <= 0) {
        throw new Error("Please enter valid 24K gold rate");
      }

      const response = await fetch(`${API_BASE_URL}/admin/gold-rates/override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rate24KPerGram: rate24K,
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
      }));

      await fetchCurrentRate();
    } catch (err) {
      setError(err.message || "Unable to update gold rate");
    } finally {
      setLoading(false);
    }
  }

  async function removeManualRate() {
    const confirmDelete = window.confirm(
      "Do you want to remove manual gold rate and revert to API rate?"
    );

    if (!confirmDelete) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/gold-rates/override`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Unable to remove manual rate");
      }

      setMessage("Manual rate removed successfully!");
      await fetchCurrentRate();
    } catch (err) {
      setError(err.message || "Unable to remove manual rate");
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
              </div>
            )}

            <button
              type="button"
              className="adminDangerBtn"
              onClick={removeManualRate}
              disabled={loading}
            >
              Remove Manual Rate
            </button>
          </section>

          <section className="goldRateCard">
            <h2>Update Manual Gold Rate</h2>
            <p className="adminMuted">
              Enter 24K rate. Backend will calculate other purity rates and
              product prices.
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