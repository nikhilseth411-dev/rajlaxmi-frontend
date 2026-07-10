import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { syncGuestCart } from "../utils/guestCart";
import "../styles/customer.css";

const SMS_UNAVAILABLE_MESSAGE =
  "SMS OTP is not available right now. Please try again later or contact the shop.";

function getCustomerOtpError(message, action) {
  const normalized = String(message || "").toLowerCase();
  if (
    normalized.includes("not configured") ||
    normalized.includes("unable to send sms") ||
    normalized.includes("verification is unavailable") ||
    normalized.includes("unable to verify sms") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror")
  ) {
    return SMS_UNAVAILABLE_MESSAGE;
  }

  const allowedMessages = [
    "please wait one minute",
    "please request a new otp",
    "otp has expired",
    "otp expired",
    "too many invalid attempts",
    "invalid otp",
    "incorrect otp",
    "otp must be a 6-digit number",
    "please provide a valid 10-digit indian mobile number",
  ];
  if (allowedMessages.some((allowed) => normalized.includes(allowed))) {
    return message;
  }

  return action === "send"
    ? SMS_UNAVAILABLE_MESSAGE
    : "We couldn't verify that OTP. Please check the code and try again.";
}

function PhoneOtpLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const redirect = searchParams.get("redirect") || "/";
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
      if (!response.ok) throw new Error(getCustomerOtpError(data?.message, "send"));
      setOtpSent(true);
    } catch (err) {
      setError(getCustomerOtpError(err.message, "send"));
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
      if (!response.ok) throw new Error(getCustomerOtpError(data?.message, "verify"));
      const token = data?.data?.accessToken || data?.accessToken;
      if (!token) throw new Error("Phone verified but login could not be completed.");
      localStorage.setItem("rajlaxmi_customer_token", token);
      await syncGuestCart(token);
      navigate(redirect);
    } catch (err) {
      setError(getCustomerOtpError(err.message, "verify"));
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

        {error && <div className="customerError" role="alert" aria-live="polite">{error}</div>}

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
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
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
