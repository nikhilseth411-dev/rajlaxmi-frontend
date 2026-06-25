import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/my-orders");
        return;
      }

      const response = await fetch(`${API_BASE}/orders?page=0&size=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      console.log("My orders status:", response.status);
      console.log("My orders response:", text);

      const data = text ? JSON.parse(text) : [];

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/my-orders");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to fetch orders.");
      }

      const actualData = data?.data || data;

      if (Array.isArray(actualData)) {
        setOrders(actualData);
      } else if (Array.isArray(actualData.content)) {
        setOrders(actualData.content);
      } else if (Array.isArray(actualData.orders)) {
        setOrders(actualData.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("My orders error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const formatPrice = (value) => {
    if (value === null || value === undefined) return "₹0";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const getPaymentLabel = (method) => {
    if (method === "UPI_QR") return "UPI QR Payment";
    if (method === "RAZORPAY") return "Debit Card / Card Payment";
    if (method === "COD") return "Cash on Delivery";
    if (method === "BANK_TRANSFER") return "Bank Transfer";
    return method || "N/A";
  };

  if (loading) {
    return <div className="pageBox">Loading your orders...</div>;
  }

  return (
    <div className="pageBox">
      <div className="pageHeader">
        <div>
          <h1>My Orders</h1>
          <p>View your order status, payment status, and order details.</p>
        </div>

        <button onClick={fetchMyOrders}>Refresh</button>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {orders.length === 0 ? (
        <div className="emptyBox">
          <h3>No orders found yet.</h3>
          <button onClick={() => navigate("/products")}>Shop Now</button>
        </div>
      ) : (
        <div className="ordersList">
          {orders.map((order) => (
            <div className="orderCard" key={order.id}>
              <div>
                <h2>{order.orderNumber || `Order #${order.id}`}</h2>
                <p>Order ID: {order.id}</p>
                <p>
                  Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              <div>
                <p>
                  <strong>Total:</strong>{" "}
                  {formatPrice(order.grandTotal || order.totalAmount || order.amount)}
                </p>
                <p>
                  <strong>Payment:</strong> {getPaymentLabel(order.paymentMethod)}
                </p>
                <p>
                  <strong>Payment Status:</strong> {order.paymentStatus}
                </p>
                <p>
                  <strong>Order Status:</strong> {order.status}
                </p>
              </div>

              <button onClick={() => navigate(`/order-success/${order.id}`)}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;