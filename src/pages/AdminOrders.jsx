import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_admin_token");

  const extractOrders = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data?.orders)) return data.data.orders;
    return [];
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const response = await fetch(`${API_BASE}/orders/admin/all?page=0&size=20`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Admin orders status:", response.status);
      console.log("Admin orders response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load orders.");
      }

      setOrders(extractOrders(data));
    } catch (err) {
      console.error("Admin orders error:", err);
      setError(err.message || "Something went wrong while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  const updateOrderStatus = async (order, status) => {
    try {
      const orderId = order.id;

      if (
        order.paymentMethod === "RAZORPAY" &&
        order.paymentStatus !== "SUCCESS" &&
        status !== "CANCELLED"
      ) {
        alert(
          "Card payment is still pending. Do not confirm/ship this order until payment is verified through gateway or manually handled."
        );
        return;
      }

      setUpdatingId(orderId);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const note = `Admin changed status to ${status}`;

      const url =
        `${API_BASE}/orders/admin/${orderId}/status` +
        `?status=${encodeURIComponent(status)}` +
        `&note=${encodeURIComponent(note)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Update order status:", response.status);
      console.log("Update order response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to update order status.");
      }

      setSuccess(`Order #${orderId} updated to ${status}.`);
      fetchOrders();
    } catch (err) {
      console.error("Update order error:", err);
      setError(err.message || "Something went wrong while updating order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const markPaymentVerified = async (orderId) => {
    try {
      const transactionId = prompt("Enter UTR / Transaction ID:");

      if (!transactionId) {
        return;
      }

      setUpdatingId(orderId);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const url =
        `${API_BASE}/orders/admin/${orderId}/payment` +
        `?transactionId=${encodeURIComponent(transactionId)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Verify order payment status:", response.status);
      console.log("Verify order payment response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to verify payment.");
      }

      setSuccess(`Payment verified for order #${orderId}.`);
      fetchOrders();
    } catch (err) {
      console.error("Verify payment error:", err);
      setError(err.message || "Something went wrong while verifying payment.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getCustomerName = (order) => {
    return (
      order.shippingFullName ||
      order.customerName ||
      order.userName ||
      order.fullName ||
      "Customer"
    );
  };

  const getCustomerPhone = (order) => {
    return order.shippingPhone || order.phone || order.customerPhone || "N/A";
  };

  const getOrderAmount = (order) => {
    return (
      order.grandTotal ||
      order.totalAmount ||
      order.finalAmount ||
      order.amount ||
      0
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-card admin-wide-card">
        <div className="admin-header-row">
          <div>
            <h1>Admin Orders</h1>
            <p>View orders, customer details, payment status, and update delivery status.</p>
          </div>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={fetchOrders}
          >
            Refresh
          </button>
        </div>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        {loading && <p>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <div className="admin-empty-box">
            No orders found yet.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.orderNumber || `#${order.id}`}</strong>
                      <br />
                      <small>ID: {order.id}</small>
                      <br />
                      <small>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("en-IN")
                          : ""}
                      </small>
                    </td>

                    <td>
                      <strong>{getCustomerName(order)}</strong>
                      <br />
                      <small>{getCustomerPhone(order)}</small>
                      <br />
                      <small>
                        {order.shippingCity || order.city || ""}{" "}
                        {order.shippingState || order.state || ""}
                      </small>
                    </td>

                    <td>
                      <strong>
                        ₹{Number(getOrderAmount(order)).toLocaleString("en-IN")}
                      </strong>
                      <br />
                      <small>{order.paymentMethod || "N/A"}</small>
                    </td>

                    <td>
                      <span className="admin-status-pill">
                        {order.status || order.orderStatus || "N/A"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-status-pill">
                        {order.paymentStatus || "N/A"}
                      </span>
                      <br />
                      <small>{order.paymentTransactionId || order.utrNumber || ""}</small>
                    </td>

                    <td>
                      <div className="admin-action-stack">
                        <select
                          defaultValue=""
                          disabled={updatingId === order.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateOrderStatus(order, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Change Status</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>

                        {order.paymentMethod === "UPI_QR" && order.paymentStatus !== "SUCCESS" && (
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => markPaymentVerified(order.id)}
                          >
                            Verify UPI Payment
                          </button>
                        )}

                        {order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "SUCCESS" && (
                          <button
                            type="button"
                            disabled
                            title="Razorpay payments are verified automatically by the gateway"
                          >
                            Gateway Payment Pending
                          </button>
                        )}

                        {order.paymentStatus === "SUCCESS" && (
                          <button type="button" disabled>
                            Payment Verified
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
