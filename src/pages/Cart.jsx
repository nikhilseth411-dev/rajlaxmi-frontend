import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/customer.css";

const API_BASE = "http://localhost:8080/api/v1";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem("rajlaxmi_customer_token");

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/logo/shop-logo.jpeg";

    if (imageUrl.startsWith("http")) return encodeURI(imageUrl);

    const cleanPath = imageUrl.startsWith("/")
      ? imageUrl.substring(1)
      : imageUrl;

    if (cleanPath.startsWith("uploads/")) {
      return encodeURI(`http://localhost:8080/api/v1/${cleanPath}`);
    }

    return encodeURI(`http://localhost:8080/api/v1/${cleanPath}`);
  };

  const extractItems = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.cartItems)) return data.data.cartItems;
    if (Array.isArray(data?.cartItems)) return data.cartItems;
    return [];
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/cart");
        return;
      }

      const response = await fetch(`${API_BASE}/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Cart status:", response.status);
      console.log("Cart response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/cart");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load cart.");
      }

      const cartData = data?.data || data;

      setCart(cartData);
      setItems(extractItems(data));
    } catch (err) {
      console.error("Cart error:", err);
      setError(err.message || "Something went wrong while loading cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity < 0) return;

      setUpdatingId(productId);

      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/cart");
        return;
      }

      const response = await fetch(
        `${API_BASE}/cart/update/${productId}?quantity=${quantity}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      console.log("Update cart status:", response.status);
      console.log("Update cart response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate("/login?redirect=/cart");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to update cart.");
      }

      fetchCart();
    } catch (err) {
      console.error("Update cart error:", err);
      alert(err.message || "Something went wrong while updating cart.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId) => {
    updateQuantity(productId, 0);
  };

  const clearCart = async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate("/login?redirect=/cart");
        return;
      }

      const response = await fetch(`${API_BASE}/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("Clear cart status:", response.status);
      console.log("Clear cart response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to clear cart.");
      }

      fetchCart();
    } catch (err) {
      console.error("Clear cart error:", err);
      alert(err.message || "Something went wrong while clearing cart.");
    }
  };

  const getProductId = (item) => {
    return item.productId || item.product?.id || item.id;
  };

  const getProductName = (item) => {
    return item.productName || item.name || item.product?.name || "Product";
  };

  const getItemImage = (item) => {
    return item.productImageUrl || item.imageUrl || item.primaryImageUrl || item.product?.primaryImageUrl;
  };

  const getUnitPrice = (item) => {
    return item.unitPrice || item.price || item.finalPrice || item.product?.finalPrice || 0;
  };

  const getTotalPrice = (item) => {
    return item.totalPrice || item.lineTotal || Number(getUnitPrice(item)) * Number(item.quantity || 1);
  };

  const cartTotal =
    cart?.grandTotal ||
    cart?.totalAmount ||
    cart?.totalPrice ||
    cart?.subtotal ||
    items.reduce((sum, item) => sum + Number(getTotalPrice(item)), 0);

  return (
    <main className="cartPage">
      <section className="cartContainer">
        <div className="cartHeader">
          <div>
            <p>Raj Laxmi Jewellers</p>
            <h1>Your Cart</h1>
          </div>

          <button type="button" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>

        {error && <div className="customerError">{error}</div>}

        {loading && <div className="customerLoading">Loading cart...</div>}

        {!loading && items.length === 0 && (
          <div className="customerEmptyBox">
            Your cart is empty.
            <br />
            <button type="button" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="cartGrid">
            <div className="cartItems">
              {items.map((item) => {
                const productId = getProductId(item);
                const quantity = item.quantity || 1;

                return (
                  <article className="cartItem" key={productId}>
                    <img
                      src={getImageUrl(getItemImage(item))}
                      alt={getProductName(item)}
                      onError={(e) => {
                        e.currentTarget.src = "/images/logo/shop-logo.jpeg";
                      }}
                    />

                    <div className="cartItemInfo">
                      <h3>{getProductName(item)}</h3>

                      <p>
                        Unit Price: ₹
                        {Number(getUnitPrice(item)).toLocaleString("en-IN")}
                      </p>

                      <p>
                        Total: ₹
                        {Number(getTotalPrice(item)).toLocaleString("en-IN")}
                      </p>

                      <div className="cartQtyRow">
                        <button
                          type="button"
                          disabled={updatingId === productId}
                          onClick={() => updateQuantity(productId, quantity - 1)}
                        >
                          -
                        </button>

                        <span>{quantity}</span>

                        <button
                          type="button"
                          disabled={updatingId === productId}
                          onClick={() => updateQuantity(productId, quantity + 1)}
                        >
                          +
                        </button>

                        <button
                          type="button"
                          className="cartRemoveBtn"
                          disabled={updatingId === productId}
                          onClick={() => removeItem(productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="cartSummary">
              <h2>Order Summary</h2>

              <div>
                <span>Items</span>
                <strong>{items.length}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>₹{Number(cartTotal).toLocaleString("en-IN")}</strong>
              </div>

              <button type="button" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>

              <button type="button" className="clearCartBtn" onClick={clearCart}>
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default Cart;