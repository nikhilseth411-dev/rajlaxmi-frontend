import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/customer.css";

import { API_BASE_URL as API_BASE, BACKEND_BASE_URL as BACKEND_BASE } from "../config/api";
import { addGuestCartItem } from "../utils/guestCart";

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "Not available";
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const getWeight = (product) =>
  product?.weightGrams ?? product?.weightInGrams ?? product?.weight ?? null;

const formatWeight = (product) => {
  const weight = Number(getWeight(product));
  return Number.isFinite(weight) ? `${weight.toFixed(3)} gm` : "Not available";
};

const formatMakingCharge = (product) => {
  const type = String(product.makingChargesType || "").toUpperCase();
  if (type === "PERCENTAGE" || type === "PERCENT") {
    return `${Number(product.makingChargesValue || 0)}%`;
  }
  if (type === "PER_GRAM") return "Per gram";
  if (type === "FIXED") return "Fixed";
  return "Not specified";
};

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "/images/placeholders/jewellery-display.webp";
    }

    if (imageUrl.startsWith("http")) {
      return encodeURI(imageUrl);
    }

    const cleanPath = imageUrl.startsWith("/")
      ? imageUrl.substring(1)
      : imageUrl;

    if (cleanPath.startsWith("api/v1/")) {
      return encodeURI(`${BACKEND_BASE}/${cleanPath}`);
    }

    if (cleanPath.startsWith("uploads/")) {
      return encodeURI(`${API_BASE}/${cleanPath}`);
    }

    return encodeURI(`${API_BASE}/${cleanPath}`);
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/products/${productId}`);
      const text = await response.text();

      console.log("Product detail status:", response.status);
      console.log("Product detail response:", text);

      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to load product.");
      }

      const productData = data?.data || data;

      setProduct(productData);

      const primaryImage =
        productData.images?.find((img) => img.primary)?.imageUrl ||
        productData.images?.[0]?.imageUrl ||
        productData.primaryImageUrl ||
        "";

      setSelectedImage(primaryImage);
    } catch (err) {
      console.error("Product detail error:", err);
      setError(err.message || "Something went wrong while loading product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const addToCart = async () => {
    try {
      if (!product) {
        return;
      }

      const token = localStorage.getItem("rajlaxmi_customer_token");

      if (!token) {
        addGuestCartItem(product);
        navigate("/cart");
        return;
      }

      const response = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: Number(product.id),
          quantity: 1,
        }),
      });

      const text = await response.text();

      console.log("Add to cart status:", response.status);
      console.log("Add to cart response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_customer_token");
        navigate(`/login?redirect=/products/${product.id}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to add product to cart.");
      }

      navigate("/cart");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert(err.message || "Something went wrong while adding to cart.");
    }
  };

  if (loading) {
    return (
      <main className="productsPage">
        <div className="productsContainer">
          <div className="customerLoading">Loading product details...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="productsPage">
        <div className="productsContainer">
          <div className="customerError">{error}</div>

          <button
            type="button"
            className="customerBackBtn"
            onClick={() => navigate("/products")}
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const inventoryQuantity =
    product.inventory?.availableQuantity ??
    product.inventory?.quantity ??
    product.stockQuantity ??
    0;
  const finalPriceText = formatPrice(product.finalPrice);
  const goldRate = product.currentGoldRatePerGram ?? product.currentGoldRate;
  const goldRateText = goldRate === null || goldRate === undefined
    ? "Not available"
    : `${formatPrice(goldRate)} / gm`;
  const whatsappMessage = encodeURIComponent(
    `Hello Raj Laxmi Jewellers, I am interested in this product: ${product.name}, SKU: ${product.sku || "N/A"}, Price: ${finalPriceText}`,
  );

  return (
    <main className="productDetailPage">
      <section className="productDetailContainer">
        <button
          type="button"
          className="customerBackBtn"
          onClick={() => navigate("/products")}
        >
          ← Back to Products
        </button>

        <div className="productDetailGrid">
          <div className="productDetailImages">
            <div className="mainProductImage">
              <img
                src={getImageUrl(selectedImage)}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholders/jewellery-display.webp";
                }}
              />
            </div>

            {product.images?.length > 0 && (
              <div className="productThumbs">
                {product.images.map((image) => (
                  <button
                    type="button"
                    key={image.id}
                    className={
                      selectedImage === image.imageUrl ? "activeThumb" : ""
                    }
                    onClick={() => setSelectedImage(image.imageUrl)}
                  >
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.altText || product.name}
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholders/jewellery-display.webp";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="productDetailInfo">
            <p className="productDetailBrand">Raj Laxmi Jewellers</p>

            <h1>{product.name}</h1>

            <div className="productDetailBadges">
              {product.bisHallmarked && <span>BIS Hallmarked</span>}
              {product.newArrival && <span>New Arrival</span>}
              {product.bestSeller && <span>Best Seller</span>}
              {product.featured && <span>Featured</span>}
            </div>

            <p className="productDetailPrice">
              {finalPriceText}
            </p>
            <p className="productDetailPriceContext">Final price calculated for {formatWeight(product)}</p>

            <p className="productDetailStock">
              {inventoryQuantity > 0
                ? `In Stock (${inventoryQuantity} available)`
                : "Out of Stock"}
            </p>

            <div className="productSpecBox">
              <h3>Product Details</h3>

              <div>
                <span>Category</span>
                <strong>{product.categoryName || product.productCategory || "N/A"}</strong>
              </div>

              <div>
                <span>SKU</span>
                <strong>{product.sku || "N/A"}</strong>
              </div>

              <div>
                <span>Metal</span>
                <strong>{product.metalType || "N/A"}</strong>
              </div>

              <div>
                <span>Purity</span>
                <strong>
                  {product.goldPurityDisplay || product.goldPurity || "N/A"}
                </strong>
              </div>

              <div>
                <span>Weight</span>
                <strong>{formatWeight(product)}</strong>
              </div>

              <div>
                <span>{product.metalType === "SILVER" ? "Silver Rate Used" : "Gold Rate Used"}</span>
                <strong>{goldRateText}</strong>
              </div>

              <div>
                <span>Making Charges</span>
                <strong>{formatMakingCharge(product)}</strong>
              </div>

              <div>
                <span>Stone Charges</span>
                <strong>{formatPrice(product.stoneCharges)}</strong>
              </div>

              <div>
                <span>GST</span>
                <strong>{product.gstPercentage || 0}%</strong>
              </div>

              <div>
                <span>Final Calculated Price</span>
                <strong>{finalPriceText}</strong>
              </div>

              <div>
                <span>BIS Hallmark</span>
                <strong>{product.bisHallmarked ? "Certified" : "Not specified"}</strong>
              </div>

              <div>
                <span>Finish</span>
                <strong>{product.finish || "N/A"}</strong>
              </div>

              <div>
                <span>Occasion</span>
                <strong>{product.occasion || "N/A"}</strong>
              </div>
            </div>

            <p className="productDescription">
              {product.description ||
                "Beautiful jewellery piece from Raj Laxmi Jewellers."}
            </p>

            <div className="productDetailActions">
              <button
                type="button"
                disabled={inventoryQuantity <= 0}
                onClick={addToCart}
              >
                Add to Cart
              </button>

              <a
                href={`https://wa.me/919102316789?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductDetail;
