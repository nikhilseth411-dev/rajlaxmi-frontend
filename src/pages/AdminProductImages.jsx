import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/admin.css";
import { API_BASE_URL as API_BASE } from "../config/api";

function AdminProductImages() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    setFile(selectedFile);
    setSuccess("");
    setError("");

    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
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

      const response = await fetch(
        `${API_BASE}/admin/products/${productId}/images?isPrimary=${isPrimary}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const text = await response.text();

      console.log("Image upload status:", response.status);
      console.log("Image upload response:", text);

      const data = text ? JSON.parse(text) : null;

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("rajlaxmi_admin_token");
        navigate("/adminlogin");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || text || `Image upload failed. Status: ${response.status}`
        );
      }

      setSuccess("Product image uploaded successfully!");
      setFile(null);
      setPreview("");
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err.message || "Something went wrong while uploading image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1>Upload Product Image</h1>
        <p>Product ID: {productId}</p>

        {success && <div className="admin-success">{success}</div>}
        {error && <div className="admin-error">{error}</div>}

        <form className="admin-form" onSubmit={handleUpload}>
          <label>Choose Product Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />

          {preview && (
            <div className="admin-image-preview-box">
              <p>Preview:</p>
              <img
                src={preview}
                alt="Product preview"
                className="admin-image-preview"
              />
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

          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload Image"}
          </button>
        </form>

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
