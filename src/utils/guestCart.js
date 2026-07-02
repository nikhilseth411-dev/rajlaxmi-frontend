import { API_BASE_URL } from "../config/api";

const GUEST_CART_KEY = "rajlaxmi_guest_cart";

export function getGuestCart() {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("rajlaxmi-cart-updated"));
  return items;
}

export function addGuestCartItem(product) {
  const items = getGuestCart();
  const existing = items.find((item) => Number(item.productId) === Number(product.id));
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      productId: Number(product.id),
      productName: product.name,
      primaryImageUrl: product.primaryImageUrl || product.images?.[0]?.imageUrl || "",
      unitPrice: Number(product.finalPrice) || 0,
      weightGrams: product.weightGrams ?? product.weightInGrams ?? product.weight ?? null,
      quantity: 1,
    });
  }
  return saveGuestCart(items);
}

export function updateGuestCartItem(productId, quantity) {
  const items = getGuestCart();
  const nextItems = quantity <= 0
    ? items.filter((item) => Number(item.productId) !== Number(productId))
    : items.map((item) => Number(item.productId) === Number(productId)
      ? { ...item, quantity }
      : item);
  return saveGuestCart(nextItems);
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
  window.dispatchEvent(new Event("rajlaxmi-cart-updated"));
}

export async function syncGuestCart(token) {
  const items = getGuestCart();
  if (!token || items.length === 0) return;

  for (const item of items) {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: Number(item.productId), quantity: item.quantity }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || `Unable to restore ${item.productName || "a cart item"}.`);
    }
    updateGuestCartItem(item.productId, 0);
  }
}
