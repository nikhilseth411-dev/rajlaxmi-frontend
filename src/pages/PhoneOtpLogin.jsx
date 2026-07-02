import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { syncGuestCart } from "../utils/guestCart";
import "../styles/customer.css";

function PhoneOtpLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const redirect = searchParams.get("redirect") || "/products";
  const isCheckoutFlow = redirect === "/checkout";

  const requestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to send OTP.");
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to verify OTP.");
      const token = data?.data?.accessToken || data?.accessToken;
      if (!token) throw new Error("Phone verified but login could not be completed.");
      localStorage.setItem("rajlaxmi_customer_token", token);
      await syncGuestCart(token);
      navigate(redirect);
    } catch (err) {
      setError(err.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customerLoginPage phoneOtpPage">
      <section className="customerLoginCard">
        <img src="/images/logo/shop-logo.jpeg" alt="Raj Laxmi Jewellers" />
        <p>{isCheckoutFlow ? "Secure Checkout" : "Customer Login"}</p>
        <h1>{otpSent ? "Verify mobile" : "Continue with mobile"}</h1>
        <span>
          {otpSent
            ? `Enter the OTP sent to +91 ${phone}.`
            : isCheckoutFlow
              ? "Verify your mobile number to continue securely to checkout."
              : "Login securely with a one-time password sent to your mobile."}
        </span>

        {error && <div className="customerError">{error}</div>}

        <form className="customerLoginForm" onSubmit={otpSent ? verifyOtp : requestOtp}>
          <label>
            Mobile Number
            <div className="phoneNumberField">
              <span>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                pattern="[6-9][0-9]{9}"
                placeholder="10-digit mobile number"
                disabled={otpSent}
                required
              />
            </div>
          </label>

          {otpSent && (
            <label>
              OTP
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter OTP"
                required
                autoFocus
              />
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : otpSent ? "Verify and continue" : "Send OTP"}
          </button>
        </form>

        {otpSent && (
          <button type="button" className="phoneChangeButton" onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}>
            Change mobile number
          </button>
        )}
        <div className="customerLoginLinks">
          <Link to={`/email-login?redirect=${encodeURIComponent(redirect)}`}>Use email and password instead</Link>
        </div>
      </section>
    </main>
  );
}

export default PhoneOtpLogin;
