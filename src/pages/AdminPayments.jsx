import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function AdminPayments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_admin_token");

  const extractPayments = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data?.payments)) return data.data.payments;
    return [];
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const response = await fetch(`${API_BASE}/payments/admin/pending`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Admin payments status:", response.status);
      console.log("Admin payments response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load payments.");
      }

      setPayments(extractPayments(data));
    } catch (err) {
      console.error("Admin payments error:", err);
      setError(err.message || "Something went wrong while loading payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const confirmPayment = async (paymentId, action) => {
    try {
      setUpdatingId(paymentId);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/adminlogin");
        return;
      }

      const adminNotes =
        action === "CONFIRM"
          ? "Payment verified by admin."
          : "Payment rejected by admin.";

      const response = await fetch(
        `${API_BASE}/payments/admin/${paymentId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            adminNotes,
          }),
        }
      );

      const text = await response.text();

      console.log("Confirm payment status:", response.status);
      console.log("Confirm payment response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to update payment.");
      }

      setSuccess(
        action === "CONFIRM"
          ? `Payment #${paymentId} verified successfully.`
          : `Payment #${paymentId} rejected successfully.`
      );

      fetchPayments();
    } catch (err) {
      console.error("Confirm payment error:", err);
      setError(err.message || "Something went wrong while updating payment.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getOrderNumber = (payment) => {
    return (
      payment.orderNumber ||
      payment.order?.orderNumber ||
      payment.orderId ||
      "N/A"
    );
  };

  const getAmount = (payment) => {
    return payment.amount || payment.totalAmount || payment.orderAmount || 0;
  };

  const getCustomerName = (payment) => {
    return (
      payment.customerName ||
      payment.order?.customerName ||
      payment.shippingFullName ||
      "Customer"
    );
  };

  const getUtr = (payment) => {
    return (
      payment.utrNumber ||
      payment.utr ||
      payment.transactionId ||
      payment.paymentTransactionId ||
      "N/A"
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-card admin-wide-card">
        <div className="admin-header-row">
          <div>
            <h1>Admin Payments</h1>
            <p>Verify or reject pending UPI / UTR payments.</p>
          </div>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={fetchPayments}
          >
            Refresh
          </button>
        </div>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        {loading && <p>Loading payments...</p>}

        {!loading && payments.length === 0 && (
          <div className="admin-empty-box">
            No pending payments found.
          </div>
        )}

        {!loading && payments.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>UTR / Transaction</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>Payment #{payment.id}</strong>
                      <br />
                      <small>
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleString("en-IN")
                          : ""}
                      </small>
                    </td>

                    <td>
                      <strong>{getOrderNumber(payment)}</strong>
                      <br />
                      <small>Order ID: {payment.orderId || payment.order?.id || "N/A"}</small>
                    </td>

                    <td>
                      <strong>{getCustomerName(payment)}</strong>
                    </td>

                    <td>
                      <strong>
                        ₹{Number(getAmount(payment)).toLocaleString("en-IN")}
                      </strong>
                    </td>

                    <td>
                      <strong>{getUtr(payment)}</strong>
                    </td>

                    <td>
                      <span className="admin-status-pill">
                        {payment.status || payment.paymentStatus || "PENDING"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-action-stack">
                        <button
                          type="button"
                          disabled={updatingId === payment.id}
                          onClick={() => confirmPayment(payment.id, "CONFIRM")}
                        >
                          Verify
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === payment.id}
                          className="admin-danger-btn"
                          onClick={() => confirmPayment(payment.id, "REJECT")}
                        >
                          Reject
                        </button>
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

export default AdminPayments;