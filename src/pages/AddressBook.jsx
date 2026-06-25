import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL as API_BASE } from "../config/api";

const emptyForm = {
  fullName: "",
  phone: "",
  streetAddress: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  addressType: "HOME",
  isDefault: false,
};

function AddressBook() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/addresses");
        return;
      }

      const response = await fetch(`${API_BASE}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Addresses status:", response.status);
      console.log("Addresses response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/addresses");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to fetch addresses.");
      }

      setAddresses(data?.data || data || []);
    } catch (err) {
      console.error("Fetch addresses error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) throw new Error("Please enter full name.");
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      throw new Error("Please enter a valid 10 digit Indian mobile number.");
    }
    if (!form.streetAddress.trim()) throw new Error("Please enter street address.");
    if (!form.city.trim()) throw new Error("Please enter city.");
    if (!form.district.trim()) throw new Error("Please enter district.");
    if (!form.state.trim()) throw new Error("Please enter state.");
    if (!/^\d{6}$/.test(form.pincode)) {
      throw new Error("Please enter a valid 6 digit pincode.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      validateForm();

      const url = editingId
        ? `${API_BASE}/addresses/${editingId}`
        : `${API_BASE}/addresses`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      const text = await response.text();

      console.log("Save address status:", response.status);
      console.log("Save address response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/addresses");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to save address.");
      }

      setSuccess(editingId ? "Address updated successfully." : "Address added successfully.");
      setForm(emptyForm);
      setEditingId(null);
      fetchAddresses();
    } catch (err) {
      console.error("Save address error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (address) => {
    setEditingId(address.id);

    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      streetAddress: address.streetAddress || "",
      landmark: address.landmark || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      pincode: address.pincode || "",
      addressType: address.addressType || "HOME",
      isDefault: address.default || address.isDefault || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const deleteAddress = async (addressId) => {
    const confirmDelete = window.confirm("Delete this address?");
    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to delete address.");
      }

      setSuccess("Address deleted successfully.");
      fetchAddresses();
    } catch (err) {
      console.error("Delete address error:", err);
      setError(err.message || "Something went wrong.");
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/addresses/${addressId}/default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to set default address.");
      }

      setSuccess("Default address updated.");
      fetchAddresses();
    } catch (err) {
      console.error("Default address error:", err);
      setError(err.message || "Something went wrong.");
    }
  };

  if (loading) {
    return <div className="pageBox">Loading addresses...</div>;
  }

  return (
    <div className="pageBox">
      <div className="pageHeader">
        <div>
          <h1>Address Book</h1>
          <p>Manage your saved delivery addresses for faster checkout.</p>
        </div>

        <button onClick={() => navigate("/checkout")}>Go to Checkout</button>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="successBox">{success}</div>}

      <form className="addressForm" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>

        <div className="addressFormGrid">
          <label>
            Full Name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              maxLength="10"
            />
          </label>

          <label className="wideField">
            Street Address
            <input
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              placeholder="House no, road, area"
            />
          </label>

          <label>
            Landmark
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              placeholder="Near..."
            />
          </label>

          <label>
            City
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Gaya"
            />
          </label>

          <label>
            District
            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="Gaya"
            />
          </label>

          <label>
            State
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Bihar"
            />
          </label>

          <label>
            Pincode
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              placeholder="805131"
              maxLength="6"
            />
          </label>

          <label>
            Address Type
            <select
              name="addressType"
              value={form.addressType}
              onChange={handleChange}
            >
              <option value="HOME">HOME</option>
              <option value="WORK">WORK</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>

          <label className="checkboxRow">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
            />
            Set as default address
          </label>
        </div>

        <div className="addressFormActions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update Address"
                : "Add Address"}
          </button>

          {editingId && (
            <button type="button" className="outlineBtn" onClick={cancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="addressList">
        <h2>Saved Addresses</h2>

        {addresses.length === 0 ? (
          <div className="emptyBox">
            <h3>No saved addresses yet.</h3>
            <p>Add your first delivery address above.</p>
          </div>
        ) : (
          <div className="addressGrid">
            {addresses.map((address) => {
              const isDefault =
                address.default === true || address.isDefault === true;

              return (
                <div className="addressCard" key={address.id}>
                  <div className="addressCardTop">
                    <h3>{address.fullName}</h3>
                    {isDefault && <span>Default</span>}
                  </div>

                  <p><strong>Phone:</strong> {address.phone}</p>
                  <p>{address.streetAddress}</p>
                  {address.landmark && <p><strong>Landmark:</strong> {address.landmark}</p>}
                  <p>
                    {address.city}, {address.district}, {address.state} - {address.pincode}
                  </p>
                  <p><strong>Type:</strong> {address.addressType}</p>

                  <div className="addressCardActions">
                    {!isDefault && (
                      <button onClick={() => setDefaultAddress(address.id)}>
                        Set Default
                      </button>
                    )}

                    <button onClick={() => startEdit(address)}>Edit</button>

                    <button
                      className="dangerBtn"
                      onClick={() => deleteAddress(address.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressBook;