import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const logoutCustomer = () => {
    localStorage.removeItem("rajlaxmi_customer_token");
    navigate("/login");
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/profile");
        return;
      }

      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Profile status:", response.status);
      console.log("Profile response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        logoutCustomer();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to fetch profile.");
      }

      const userData = data?.data || data;

      setProfile(userData);

      setProfileForm({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        phone: userData.phone || "",
      });
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");

      if (!profileForm.firstName.trim()) {
        throw new Error("First name is required.");
      }

      if (!profileForm.lastName.trim()) {
        throw new Error("Last name is required.");
      }

      if (!/^[6-9]\d{9}$/.test(profileForm.phone)) {
        throw new Error("Please enter a valid 10 digit Indian mobile number.");
      }

      const response = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(profileForm),
      });

      const text = await response.text();

      console.log("Update profile status:", response.status);
      console.log("Update profile response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        logoutCustomer();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to update profile.");
      }

      setSuccess("Profile updated successfully.");
      fetchProfile();
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    try {
      setChangingPassword(true);
      setError("");
      setSuccess("");

      if (!passwordForm.currentPassword) {
        throw new Error("Current password is required.");
      }

      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-]).{8,}$/.test(
          passwordForm.newPassword
        )
      ) {
        throw new Error(
          "New password must have uppercase, lowercase, number, special character and minimum 8 characters."
        );
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      const response = await fetch(`${API_BASE}/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const text = await response.text();

      console.log("Change password status:", response.status);
      console.log("Change password response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        logoutCustomer();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to change password.");
      }

      setSuccess("Password changed successfully. Please login again.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        logoutCustomer();
      }, 1200);
    } catch (err) {
      console.error("Change password error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="pageBox">Loading profile...</div>;
  }

  return (
    <div className="pageBox">
      <div className="pageHeader">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your Raj Laxmi Jewellers account.</p>
        </div>

        <button onClick={logoutCustomer}>Logout</button>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="successBox">{success}</div>}

      <div className="profileGrid">
        <section className="profileCard">
          <h2>Account Details</h2>

          <div className="profileInfoRows">
            <p>
              <span>Name</span>
              <strong>
                {profile?.firstName} {profile?.lastName}
              </strong>
            </p>

            <p>
              <span>Email</span>
              <strong>{profile?.email}</strong>
            </p>

            <p>
              <span>Phone</span>
              <strong>{profile?.phone || "Not added"}</strong>
            </p>

            <p>
              <span>Role</span>
              <strong>{profile?.role}</strong>
            </p>

            <p>
              <span>Email Verified</span>
              <strong>{profile?.emailVerified ? "Yes" : "No"}</strong>
            </p>

            <p>
              <span>Account Active</span>
              <strong>{profile?.active ? "Yes" : "No"}</strong>
            </p>

            <p>
              <span>Created At</span>
              <strong>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleString()
                  : "N/A"}
              </strong>
            </p>
          </div>

          <div className="profileQuickActions">
            <button onClick={() => navigate("/my-orders")}>My Orders</button>
            <button onClick={() => navigate("/addresses")}>Addresses</button>
            <button onClick={() => navigate("/cart")}>Cart</button>
          </div>
        </section>

        <section className="profileCard">
          <h2>Update Profile</h2>

          <form className="customerAuthForm" onSubmit={updateProfile}>
            <label>
              First Name
              <input
                type="text"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                placeholder="First name"
              />
            </label>

            <label>
              Last Name
              <input
                type="text"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                placeholder="Last name"
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="9876543210"
                maxLength="10"
              />
            </label>

            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </section>

        <section className="profileCard wideProfileCard">
          <h2>Change Password</h2>

          <form className="customerAuthForm" onSubmit={changePassword}>
            <label>
              Current Password
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </label>

            <button type="submit" disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Profile;