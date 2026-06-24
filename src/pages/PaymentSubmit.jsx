import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/customer.css";

const API_BASE = "http://localhost:8080/api/v1";

function PaymentSubmit() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate(`/login?redirect=/payment/${orderId}`);
        return;
      }

      const response = await fetch(`${API_BASE}/payments/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Payment details status:", response.status);
      console.log("Payment details response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate(`/login?redirect=/payment/${orderId}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load payment details.");
      }

      const paymentData = data?.data || data;
      setPayment(paymentData);

      const possibleQr =
        paymentData?.qrCodeUrl ||
        paymentData?.upiQrCodeUrl ||
        paymentData?.qrUrl ||
        paymentData?.paymentQrCode ||
        "";

      if (possibleQr) {
        setQrCodeUrl(possibleQr);
      } else {
        await fetchQrCode();
      }
    } catch (err) {
      console.error("Payment details error:", err);
      setError(err.message || "Something went wrong while loading payment.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate(`/login?redirect=/payment/${orderId}`);
        return;
      }

      const response = await fetch(`${API_BASE}/payments/orders/${orderId}/qr-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("QR code status:", response.status);
      console.log("QR code response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        return;
      }

      const qr = data?.data || data?.qrCodeUrl || data;

      if (typeof qr === "string") {
        setQrCodeUrl(qr);
      }
    } catch (err) {
      console.error("QR code error:", err);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [orderId]);

  const submitUtr = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate(`/login?redirect=/payment/${orderId}`);
        return;
      }

      if (!utrNumber.trim()) {
        throw new Error("Please enter UTR number.");
      }

      const response = await fetch(
        `${API_BASE}/payments/orders/${orderId}/submit-utr?utrNumber=${encodeURIComponent(
          utrNumber.trim()
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      console.log("Submit UTR status:", response.status);
      console.log("Submit UTR response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate(`/login?redirect=/payment/${orderId}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to submit UTR.");
      }

      setSuccess("UTR submitted successfully. Admin will verify your payment.");
      fetchPaymentDetails();
    } catch (err) {
      console.error("Submit UTR error:", err);
      setError(err.message || "Something went wrong while submitting UTR.");
    } finally {
      setSubmitting(false);
    }
  };

  const amount =
    payment?.amount ||
    payment?.orderAmount ||
    payment?.grandTotal ||
    payment?.totalAmount ||
    0;

  return (
    <main className="paymentSubmitPage">
      <section className="paymentSubmitCard">
        <img src="/images/logo/shop-logo.jpeg" alt="Raj Laxmi Jewellers" />

        <p>Raj Laxmi Jewellers</p>
        <h1>UPI Payment</h1>
        <span>Scan QR, complete payment, then submit your UTR number.</span>

        {error && <div className="customerError">{error}</div>}
        {success && <div className="customerSuccess">{success}</div>}

        {loading && <div className="customerLoading">Loading payment details...</div>}

        {!loading && (
          <>
            <div className="paymentInfoBox">
              <div>
                <span>Order ID</span>
                <strong>{orderId}</strong>
              </div>

              <div>
                <span>Amount</span>
                <strong>₹{Number(amount).toLocaleString("en-IN")}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{payment?.status || payment?.paymentStatus || "PENDING"}</strong>
              </div>
            </div>

            <div className="qrBox">
              <img
                src="/images/payment/rajlaxmi-upi-qr.png"
                alt="Raj Laxmi Jewellers UPI QR Code"
                onError={(e) => {
                  console.log("QR image failed to load:", e.currentTarget.src);
                }}
              />

              <div className="bankDetailsBox">
                <h3>Canara Bank A/C Details</h3>

                <p>
                  <strong>Account Holder:</strong> RAJ LAXMI JEWELLERS
                </p>

                <p>
                  <strong>Account Number:</strong> 120032663381
                </p>

                <p>
                  <strong>Mobile Number:</strong> +91 9693436005
                </p>

                <p>
                  <strong>IFSC Code:</strong> CNRB0007699
                </p>

                <p>
                  <strong>Branch:</strong> DHANMUN COMPLEX, MAIN ROAD
                </p>
              </div>
            </div>

            <form className="utrForm" onSubmit={submitUtr}>
              <label>
                Enter UTR / Transaction Number
                <input
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Example: 123456789012"
                  required
                />
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit UTR"}
              </button>
            </form>

            <div className="paymentActions">
              <button type="button" onClick={() => navigate("/products")}>
                Continue Shopping
              </button>

              <button type="button" onClick={() => navigate("/cart")}>
                Back to Cart
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default PaymentSubmit;