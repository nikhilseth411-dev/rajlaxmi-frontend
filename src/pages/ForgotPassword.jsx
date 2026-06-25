import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();

      console.log("Forgot password status:", response.status);
      console.log("Forgot password response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to send OTP.");
      }

      setMessage(data?.message || "OTP sent successfully. Please check your email.");
      setStep(2);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!otp.trim()) {
        throw new Error("Please enter OTP.");
      }

      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-]).{8,}$/.test(
          newPassword
        )
      ) {
        throw new Error(
          "Password must have uppercase, lowercase, number, special character and minimum 8 characters."
        );
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Password and confirm password do not match.");
      }

      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: otp,
          newPassword,
          confirmPassword,
        }),
      });

      const text = await response.text();

      console.log("Reset password status:", response.status);
      console.log("Reset password response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to reset password.");
      }

      setMessage(data?.message || "Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
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

        <h1>Forgot Password</h1>
        <p>
          {step === 1
            ? "Enter your registered email. We will send a password reset OTP."
            : "Enter the OTP and set your new password."}
        </p>

        {error && <div className="errorBox">{error}</div>}
        {message && <div className="successBox">{message}</div>}

        {step === 1 ? (
          <form onSubmit={sendOtp} className="customerAuthForm">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="customerAuthForm">
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

            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="authSwitchText">
          Remember password? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;