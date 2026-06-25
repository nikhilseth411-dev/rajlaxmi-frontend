import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

function OrderSuccess() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate(`/login?redirect=/order-success/${orderId}`);
        return;
      }

      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Order detail status:", response.status);
      console.log("Order detail response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate(`/login?redirect=/order-success/${orderId}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Unable to fetch order details.");
      }

      setOrder(data?.data || data);
    } catch (err) {
      console.error("Order detail error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined) return "₹0";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const getPaymentLabel = (method) => {
    if (method === "UPI_QR") return "UPI QR Payment";
    if (method === "RAZORPAY") return "Debit Card / Card Payment";
    if (method === "COD") return "Cash on Delivery";
    if (method === "BANK_TRANSFER") return "Bank Transfer";
    return method || "Payment";
  };

  if (loading) {
    return (
      <div className="successPage">
        <div className="successCard">
          <h1>Loading order details...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="successPage">
        <div className="successCard">
          <h1>Order Details</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/my-orders")}>Back to My Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="successPage">
      <div className="successCard">
        <img
          src="/images/logo/shop-logo.jpeg"
          alt="Raj Laxmi Jewellers"
          className="successLogo"
        />

        <h3>Raj Laxmi Jewellers</h3>

        <h1>Order Details</h1>

        <p>
          Your order has been created. You can track your order and payment
          status here.
        </p>

        <div className="successDetails">
          <div>
            <span>Order ID</span>
            <strong>{order?.id || orderId}</strong>
          </div>

          <div>
            <span>Order Number</span>
            <strong>{order?.orderNumber || "N/A"}</strong>
          </div>

          <div>
            <span>Total Amount</span>
            <strong>
              {formatPrice(order?.grandTotal || order?.totalAmount || order?.amount)}
            </strong>
          </div>

          <div>
            <span>Payment Method</span>
            <strong>{getPaymentLabel(order?.paymentMethod)}</strong>
          </div>

          <div>
            <span>Payment Status</span>
            <strong>{order?.paymentStatus || "N/A"}</strong>
          </div>

          <div>
            <span>Order Status</span>
            <strong>{order?.status || "N/A"}</strong>
          </div>
        </div>

        {order?.paymentMethod === "UPI_QR" && order?.paymentStatus !== "SUCCESS" && (
          <button
            className="primaryBtn fullBtn"
            onClick={() => navigate(`/payment/${order.id}`)}
          >
            Pay / Submit UTR
          </button>
        )}

        {order?.paymentMethod === "RAZORPAY" && order?.paymentStatus !== "SUCCESS" && (
          <button className="primaryBtn fullBtn" disabled>
            Card Payment Pending
          </button>
        )}

        <div className="successActions">
          <button onClick={() => navigate("/products")}>Continue Shopping</button>
          <button onClick={() => navigate("/my-orders")}>Back to My Orders</button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;