import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/customer.css";

import { API_BASE_URL as API_BASE } from "../config/api";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI_QR");
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    streetAddress: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    addressType: "HOME",
    isDefault: true,
  });

  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const extractItems = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.cartItems)) return data.data.cartItems;
    if (Array.isArray(data?.cartItems)) return data.cartItems;
    return [];
  };

  const extractAddresses = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.addresses)) return data.addresses;
    return [];
  };

  const fetchCart = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login?redirect=/checkout");
      return;
    }

    const response = await fetch(`${API_BASE}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    console.log("Checkout cart status:", response.status);
    console.log("Checkout cart response:", text);

    const data = text ? JSON.parse(text) : null;

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("rajlaxmi_customer_token");
      navigate("/login?redirect=/checkout");
      return;
    }

    if (!response.ok) {
      throw new Error(data?.message || text || "Unable to load cart.");
    }

    const cartData = data?.data || data;

    setCart(cartData);
    setItems(extractItems(data));
  };

  const fetchAddresses = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login?redirect=/checkout");
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
      navigate("/login?redirect=/checkout");
      return;
    }

    if (!response.ok) {
      throw new Error(data?.message || text || "Unable to load addresses.");
    }

    const addressList = extractAddresses(data);
    setAddresses(addressList);

    const defaultAddress = addressList.find(
      (address) => address.default || address.isDefault
    );
    const firstAddress = defaultAddress || addressList[0];

    if (firstAddress) {
      setSelectedAddressId(String(firstAddress.id));
    }
  };

  const loadCheckout = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await fetchCart();
      await fetchAddresses();
    } catch (err) {
      console.error("Checkout load error:", err);
      setError(err.message || "Something went wrong while loading checkout.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckout();
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAddress = async (e) => {
    e.preventDefault();

    try {
      setAddingAddress(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/checkout");
        return;
      }

      const response = await fetch(`${API_BASE}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      const text = await response.text();

      console.log("Add address status:", response.status);
      console.log("Add address response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/checkout");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to add address.");
      }

      const newAddress = data?.data || data;

      setSuccess("Address added successfully.");
      await fetchAddresses();

      if (newAddress?.id) {
        setSelectedAddressId(String(newAddress.id));
      }
    } catch (err) {
      console.error("Add address error:", err);
      setError(err.message || "Something went wrong while adding address.");
    } finally {
      setAddingAddress(false);
    }
  };

  const getItemName = (item) => {
    return item.productName || item.name || item.product?.name || "Product";
  };

  const getItemTotal = (item) => {
    const unitPrice =
      item.unitPrice ||
      item.price ||
      item.finalPrice ||
      item.product?.finalPrice ||
      0;

    return (
      item.totalPrice ||
      item.lineTotal ||
      Number(unitPrice) * Number(item.quantity || 1)
    );
  };

  const cartTotal =
    cart?.grandTotal ||
    cart?.totalAmount ||
    cart?.totalPrice ||
    cart?.subtotal ||
    items.reduce((sum, item) => sum + Number(getItemTotal(item)), 0);

  const finalTotal = Math.max(Number(cartTotal || 0) - Number(couponDiscount || 0), 0);

  const handleCouponInputChange = (e) => {
    setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage("");
  };

  const applyCoupon = async () => {
    try {
      setCouponLoading(true);
      setError("");
      setCouponMessage("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/checkout");
        return;
      }

      const code = couponCode.trim().toUpperCase();

      if (!code) {
        throw new Error("Please enter a coupon code.");
      }

      if (items.length === 0) {
        throw new Error("Cart is empty. Add product before applying coupon.");
      }

      const url = `${API_BASE}/coupons/validate?code=${encodeURIComponent(
        code
      )}&orderTotal=${encodeURIComponent(Number(cartTotal || 0))}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Coupon validate status:", response.status);
      console.log("Coupon validate response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/checkout");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Invalid coupon.");
      }

      const coupon = data?.data || data;
      const discount = Number(coupon?.applicableDiscountAmount || 0);

      if (discount <= 0) {
        throw new Error("Coupon is valid but no discount is applicable.");
      }

      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
      setCouponMessage(data?.message || `Coupon applied. You save ₹${discount}.`);
    } catch (err) {
      console.error("Apply coupon error:", err);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage("");
      setError(err.message || "Unable to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage("");
    setCouponCode("");
  };

  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/checkout");
        return;
      }

      if (!selectedAddressId) {
        throw new Error("Please add or select a delivery address.");
      }

      if (items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      if (couponCode.trim() && !appliedCoupon) {
        throw new Error("Please apply the coupon first or remove the coupon code.");
      }

      const payload = {
        addressId: Number(selectedAddressId),
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
        customerNote: customerNote.trim() || "",
      };

      console.log("Place order payload:", payload);

      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      console.log("Place order status:", response.status);
      console.log("Place order response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/checkout");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to place order.");
      }

      const order = data?.data || data;
      const orderId = order?.id || order?.orderId;

      navigate(`/order-success/${orderId || "done"}`, {
        state: { order },
      });
    } catch (err) {
      console.error("Place order error:", err);
      setError(err.message || "Something went wrong while placing order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <main className="checkoutPage">
      <section className="checkoutContainer">
        <div className="checkoutHeader">
          <div>
            <p>Raj Laxmi Jewellers</p>
            <h1>Checkout</h1>
            <span>Confirm your address and place your jewellery order.</span>
          </div>

          <button type="button" onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
        </div>

        {error && <div className="customerError">{error}</div>}
        {success && <div className="customerSuccess">{success}</div>}

        {loading && <div className="customerLoading">Loading checkout...</div>}

        {!loading && (
          <div className="checkoutGrid">
            <section className="checkoutMain">
              <div className="checkoutCard">
                <h2>Delivery Address</h2>

                {addresses.length > 0 && (
                  <div className="addressList">
                    {addresses.map((address) => (
                      <label className="addressOption" key={address.id}>
                        <input
                          type="radio"
                          name="selectedAddress"
                          value={address.id}
                          checked={selectedAddressId === String(address.id)}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                        />

                        <div>
                          <strong>{address.fullName}</strong>
                          <p>
                            {address.streetAddress}, {address.landmark}
                          </p>
                          <p>
                            {address.city}, {address.district}, {address.state} -{" "}
                            {address.pincode}
                          </p>
                          <p>Phone: {address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <form className="checkoutAddressForm" onSubmit={addAddress}>
                  <h3>Add New Address</h3>

                  <input
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    placeholder="Full Name"
                    required
                  />

                  <input
                    name="phone"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    placeholder="10-digit mobile number"
                    required
                  />

                  <input
                    name="streetAddress"
                    value={addressForm.streetAddress}
                    onChange={handleAddressChange}
                    placeholder="Street Address"
                    required
                  />

                  <input
                    name="landmark"
                    value={addressForm.landmark}
                    onChange={handleAddressChange}
                    placeholder="Landmark"
                  />

                  <input
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    placeholder="City, for example Gaya"
                    required
                  />

                  <input
                    name="district"
                    value={addressForm.district}
                    onChange={handleAddressChange}
                    placeholder="District, for example Gaya"
                    required
                  />

                  <input
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    placeholder="State, for example Bihar"
                    required
                  />

                  <input
                    name="pincode"
                    value={addressForm.pincode}
                    onChange={handleAddressChange}
                    placeholder="6-digit pincode"
                    required
                  />

                  <button type="submit" disabled={addingAddress}>
                    {addingAddress ? "Adding Address..." : "Add Address"}
                  </button>
                </form>
              </div>

              <div className="checkoutCard">
                <h2>Payment Method</h2>

                <label className="paymentOption">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI_QR"
                    checked={paymentMethod === "UPI_QR"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>UPI QR Payment</span>
                </label>

                <label className="paymentOption">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Debit Card / Card Payment</span>
                </label>

                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Any note for shop owner? Example: Please pack safely."
                />
              </div>

              <div className="checkoutCard">
                <h2>Apply Coupon</h2>

                <div className="couponApplyBox">
                  <input
                    value={couponCode}
                    onChange={handleCouponInputChange}
                    placeholder="Enter coupon code, example RJ500"
                    disabled={!!appliedCoupon}
                  />

                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || items.length === 0}
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </button>
                  ) : (
                    <button type="button" onClick={removeCoupon}>
                      Remove
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <div className="couponSuccessMessage">{couponMessage}</div>
                )}

                {appliedCoupon && (
                  <div className="appliedCouponBox">
                    <strong>{appliedCoupon.code}</strong>
                    <span>
                      Discount: ₹{Number(couponDiscount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <aside className="checkoutSummary">
              <h2>Order Summary</h2>

              {items.map((item, index) => (
                <div className="checkoutItem" key={index}>
                  <span>
                    {getItemName(item)} × {item.quantity || 1}
                  </span>
                  <strong>₹{Number(getItemTotal(item)).toLocaleString("en-IN")}</strong>
                </div>
              ))}

              <div className="checkoutTotal checkoutSubTotal">
                <span>Subtotal</span>
                <strong>₹{Number(cartTotal).toLocaleString("en-IN")}</strong>
              </div>

              {couponDiscount > 0 && (
                <div className="checkoutTotal checkoutDiscount">
                  <span>Coupon Discount</span>
                  <strong>- ₹{Number(couponDiscount).toLocaleString("en-IN")}</strong>
                </div>
              )}

              <div className="checkoutTotal">
                <span>Payable Total</span>
                <strong>₹{Number(finalTotal).toLocaleString("en-IN")}</strong>
              </div>

              {items.length === 0 && (
                <div className="customerEmptyBox">
                  Your cart is empty. Please add a product before checkout.
                </div>
              )}

              <button
                type="button"
                disabled={placingOrder || items.length === 0}
                onClick={placeOrder}
              >
                {items.length === 0
                  ? "Cart is Empty"
                  : placingOrder
                    ? "Placing Order..."
                    : "Place Order"}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default Checkout;
