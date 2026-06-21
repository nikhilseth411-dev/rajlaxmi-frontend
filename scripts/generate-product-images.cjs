const fs = require("fs");
const path = require("path");

const productsDir = path.join(__dirname, "..", "public", "images", "products");
const outDir = path.join(__dirname, "..", "src", "data");
const outFile = path.join(outDir, "productImages.js");

const categories = [
  {
    folder: "choker",
    name: "Chokers",
    subtitle: "Premium bridal designs",
  },
  {
    folder: "earrings",
    name: "Earrings",
    subtitle: "Traditional gold earrings",
  },
  {
    folder: "rajkot-bali",
    name: "Rajkot Bali",
    subtitle: "Lightweight hoop collection",
  },
  {
    folder: "ladies-rings",
    name: "Ladies Rings",
    subtitle: "Elegant daily wear rings",
  },
  {
    folder: "gents-rings",
    name: "Gents Rings",
    subtitle: "Classic men’s rings",
  },
  {
    folder: "mangalsutra",
    name: "Mangalsutra",
    subtitle: "Traditional mangalsutra designs",
  },
];

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

function toPublicPath(folder, fileName) {
  return `/images/products/${folder}/${encodeURIComponent(fileName)}`;
}

function getImages(folder) {
  const folderPath = path.join(productsDir, folder);

  if (!fs.existsSync(folderPath)) {
    return [];
  }

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((item) => item.isFile())
    .map((item) => item.name)
    .filter((fileName) =>
      imageExtensions.includes(path.extname(fileName).toLowerCase())
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((fileName) => toPublicPath(folder, fileName));
}

const collections = categories.map((category) => {
  const images = getImages(category.folder);

  return {
    ...category,
    image: images[0] || "/images/shop/dukan.jpeg",
    count: images.length,
  };
});

const featuredJewellery = categories.flatMap((category) => {
  const images = getImages(category.folder).slice(0, 3);

  return images.map((image, index) => ({
    id: `${category.folder}-${index + 1}`,
    name: `${category.name} Design ${index + 1}`,
    category: category.name,
    image,
    purity: "22K Gold · BIS Hallmarked",
    priceText: "Price on Enquiry",
  }));
});

const content = `export const shopImages = {
  logo: "/images/logo/shop-logo.jpeg",
  shopOne: "/images/shop/dukan.jpeg",
  shopTwo: "/images/shop/dukan_papa.jpeg",
};

export const collections = ${JSON.stringify(collections, null, 2)};

export const featuredJewellery = ${JSON.stringify(featuredJewellery, null, 2)};
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, content);

console.log("Done ✅");
console.log(`Generated: ${outFile}`);
console.log("");
console.log("Collections:");
collections.forEach((item) => {
  console.log(`${item.name}: ${item.count} images`);
});
console.log("");
console.log(`Featured jewellery items: ${featuredJewellery.length}`);