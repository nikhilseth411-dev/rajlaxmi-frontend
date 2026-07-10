import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/admin.css";
import { API_BASE_URL as API_BASE, BACKEND_BASE_URL as BACKEND_BASE } from "../config/api";

const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

async function optimizeProductImage(originalFile) {
  if (originalFile.size <= MAX_UPLOAD_BYTES) return originalFile;

  const sourceUrl = URL.createObjectURL(originalFile);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image could not be processed. Please choose another image."));
      element.src = sourceUrl;
    });

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the image for upload.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let optimizedBlob = null;
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      optimizedBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (optimizedBlob && optimizedBlob.size <= MAX_UPLOAD_BYTES) break;
    }
    if (!optimizedBlob || optimizedBlob.size > MAX_UPLOAD_BYTES) {
      throw new Error("This image is too large to prepare safely. Please choose a smaller image.");
    }

    const baseName = originalFile.name.replace(/\.[^.]+$/, "") || "product-image";
    return new File([optimizedBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function uploadImageRequest(url, token, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.timeout = 120000;
    request.setRequestHeader("Authorization", `Bearer ${token}`);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => resolve({ status: request.status, text: request.responseText || "" });
    request.onerror = () => reject(new TypeError("Upload connection failed."));
    request.ontimeout = () => {
      const error = new Error("The upload took too long. Please check your connection and try again.");
      error.name = "TimeoutError";
      reject(error);
    };
    request.onabort = () => {
      const error = new Error("The upload was cancelled. Please try again.");
      error.name = "AbortError";
      reject(error);
    };
    request.send(formData);
  });
}

function AdminProductImages() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [productName, setProductName] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [optimizationNote, setOptimizationNote] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/placeholders/jewellery-display.webp";
    if (imageUrl.startsWith("http")) return encodeURI(imageUrl);

    const cleanPath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
    if (cleanPath.startsWith("api/v1/")) return encodeURI(`${BACKEND_BASE}/${cleanPath}`);
    return encodeURI(`${API_BASE}/${cleanPath}`);
  };

  const fetchProductImages = async () => {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(data?.message || text || "Unable to load product images.");

      const product = data?.data || data;
      setProductName(product?.name || "");
      setExistingImages(Array.isArray(product?.images) ? product.images : []);
    } catch (err) {
      setError(err.message || "Unable to load product images.");
    }
  };

  useEffect(() => {
    fetchProductImages();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // preview is cleared manually when changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const clearSelectedImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setOptimizationNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setSuccess("");
    setError("");
    setOptimizationNote("");

    if (selectedFile) {
      try {
        setProcessing(true);
        const preparedFile = await optimizeProductImage(selectedFile);
        if (preview) URL.revokeObjectURL(preview);
        setFile(preparedFile);
        setPreview(URL.createObjectURL(preparedFile));
        if (preparedFile !== selectedFile) {
          setOptimizationNote(`Optimized for upload (${(preparedFile.size / 1024 / 1024).toFixed(2)} MB).`);
        }
      } catch (err) {
        clearSelectedImage();
        setError(err.message || "This image could not be prepared for upload.");
      } finally {
        setProcessing(false);
      }
    } else {
      clearSelectedImage();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setUploadProgress(0);
      setSuccess("");
      setError("");

      const token = localStorage.getItem("rajlaxmi_admin_token");

      if (!token) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!file) {
        throw new Error("Please select one image.");
      }

      const formData = new FormData();

      // IMPORTANT: backend expects "file", not "files"
      formData.append("file", file);

      const response = await uploadImageRequest(
        `${API_BASE}/admin/products/${productId}/images?isPrimary=${isPrimary}`,
        token,
        formData,
        setUploadProgress
      );

      const text = response.text;
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          data?.message || text || `Image upload failed. Status: ${response.status}`
        );
      }

      setSuccess("Product image uploaded successfully!");
      setUploadProgress(100);
      clearSelectedImage();
      await fetchProductImages();
    } catch (err) {
      if (err.name === "AbortError") {
        setError("The upload took too long. Please check your connection and try again.");
      } else if (err instanceof TypeError) {
        setError("Unable to reach the upload server. Please check your connection and try again.");
      } else {
        setError(err.message || "Something went wrong while uploading image.");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteExistingImage = async (image) => {
    if (!window.confirm("Remove this image from the product?")) return;

    const token = localStorage.getItem("rajlaxmi_admin_token");
    if (!token) {
      navigate("/adminlogin");
      return;
    }

    try {
      setDeletingImageId(image.id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/admin/products/${productId}/images/${image.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Unable to remove this image.");
      }

      setSuccess("Product image removed successfully.");
      await fetchProductImages();
    } catch (err) {
      setError(err.message || "Unable to remove this image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1>Upload Product Image</h1>
        <p>{productName ? `${productName} - ` : ""}Product ID: {productId}</p>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        <form className="admin-form" onSubmit={handleUpload}>
          <label>Choose Product Image</label>
          <div className="admin-upload-choice-row">
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing || loading}
            >
              Choose from Browse
            </button>
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => cameraInputRef.current?.click()}
              disabled={processing || loading}
            >
              Open Camera
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={processing || loading}
            className="admin-hidden-file-input"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={processing || loading}
            className="admin-hidden-file-input"
          />

          {processing && <p className="admin-upload-note">Preparing image...</p>}
          {optimizationNote && <p className="admin-upload-note">{optimizationNote}</p>}
          {loading && uploadProgress > 0 && (
            <p className="admin-upload-note">Uploading: {uploadProgress}%</p>
          )}

          {preview && (
            <div className="admin-image-preview-box">
              <p>Preview:</p>
              <img
                src={preview}
                alt="Product preview"
                className="admin-image-preview"
              />
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Edit selected image
              </button>
              <button
                type="button"
                className="admin-danger-btn"
                onClick={clearSelectedImage}
              >
                Remove selected image
              </button>
            </div>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Set as Primary Image
          </label>

          <button type="submit" disabled={loading || processing || !file}>
            {processing ? "Preparing..." : loading ? "Uploading..." : "Upload Image"}
          </button>
        </form>

        <section className="admin-existing-images">
          <h2>Current Product Images</h2>
          {existingImages.length === 0 ? (
            <div className="admin-empty-box">No image is attached to this product yet.</div>
          ) : (
            <div className="admin-existing-image-grid">
              {existingImages.map((image) => (
                <article className="admin-existing-image-card" key={image.id}>
                  <img
                    src={getImageUrl(image.imageUrl)}
                    alt={image.altText || productName || "Product image"}
                    onError={(event) => {
                      event.currentTarget.src = "/images/placeholders/jewellery-display.webp";
                    }}
                  />
                  <div>
                    {image.isPrimary && <span>Primary</span>}
                    <button
                      type="button"
                      className="admin-danger-btn"
                      onClick={() => deleteExistingImage(image)}
                      disabled={deletingImageId === image.id}
                    >
                      {deletingImageId === image.id ? "Removing..." : "Remove Image"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="admin-action-row">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => navigate("/admin/products/new")}
          >
            Add Another Product
          </button>

          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => navigate("/admin/products")}
          >
            Go to Manage Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminProductImages;
