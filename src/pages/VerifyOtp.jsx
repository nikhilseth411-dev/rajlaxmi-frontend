import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:8080/api/v1";

function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const verifyOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (!otp.trim()) {
        throw new Error("Please enter OTP.");
      }

      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const text = await response.text();

      console.log("Verify OTP status:", response.status);
      console.log("Verify OTP response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "OTP verification failed.");
      }

      setMessage("Email verified successfully. Please login now.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResending(true);
      setError("");
      setMessage("");

      if (!email.trim()) {
        throw new Error("Please enter your email first.");
      }

      const response = await fetch(
        `${API_BASE}/auth/resend-otp?email=${encodeURIComponent(email.trim())}`,
        {
          method: "POST",
        }
      );

      const text = await response.text();

      console.log("Resend OTP status:", response.status);
      console.log("Resend OTP response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to resend OTP.");
      }

      setMessage(data?.message || "OTP resent successfully.");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="customerAuthPage">
      <section className="customerAuthCard">
        <img
          src="/images/logo/shop-logo.jpeg"
          alt="Raj Laxmi Jewellers"
          className="customerAuthLogo"
        />

        <h1>Verify Email</h1>
        <p>Enter the OTP sent to your email to activate your account.</p>

        {error && <div className="errorBox">{error}</div>}
        {message && <div className="successBox">{message}</div>}

        <form onSubmit={verifyOtp} className="customerAuthForm">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label>
            OTP
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6 digit OTP"
              maxLength="6"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          className="secondaryAuthBtn"
          onClick={resendOtp}
          disabled={resending}
        >
          {resending ? "Sending..." : "Resend OTP"}
        </button>

        <p className="authSwitchText">
          Already verified? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}

export default VerifyOtp;