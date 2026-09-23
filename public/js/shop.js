const productGrid = document.querySelector("#productGrid");
const categoryFilter = document.querySelector("#categoryFilter");
const cartCountElements = document.querySelectorAll(".cart-count");

let products = [];
let cart = JSON.parse(localStorage.getItem("yemsCart")) || [];


// ===============================
// LOAD PRODUCTS FROM BACKEND
// ===============================
async function loadProducts() {
  if (!productGrid) return;

  productGrid.classList.add("loading");

  try {
    const response = await fetch("/products", {
      cache: "no-store"
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to load products"
      );
    }

    products = result.products || [];

    // Remove products from the local cart
    // that no longer exist in the database.
    const validProductIds = new Set(
      products.map((product) => String(product._id))
    );

    cart = cart.filter((item) =>
      validProductIds.has(String(item.productId))
    );

    localStorage.setItem(
      "yemsCart",
      JSON.stringify(cart)
    );

    renderProducts(products);

    updateCartCount();

  } catch (error) {
    console.error(
      "Error loading products:",
      error
    );

    productGrid.innerHTML = `
      <p class="empty-message">
        Unable to load products right now.
      </p>
    `;

  } finally {
    productGrid.classList.remove("loading");
  }
}


// ===============================
// RENDER PRODUCTS
// ===============================
function renderProducts(items) {
  if (!productGrid) return;

  if (!items.length) {
    productGrid.innerHTML = `
      <p class="empty-message">
        No products available yet.
      </p>
    `;
    return;
  }

  productGrid.innerHTML = items
    .map((product) => {
      const stock = Number(product.stock || 0);

      let imageUrl = "";

      if (product.image) {
        if (
          product.image.startsWith("http://") ||
          product.image.startsWith("https://") ||
          product.image.startsWith("/")
        ) {
          imageUrl = product.image;
        } else {
          imageUrl = `/uploads/${product.image}`;
        }
      }

      return `
        <article class="product-card">

          <div class="product-image">

            <span class="product-badge">
              ${stock > 0 ? "Available" : "Sold Out"}
            </span>

            <button
              class="wishlist-btn"
              type="button"
              aria-label="Add to wishlist"
            >
              ♡
            </button>

            ${
              imageUrl
                ? `
                  <img
                    src="${imageUrl}"
                    alt="${escapeHTML(product.name)}"
                  >
                `
                : `
                  <div class="product-image-placeholder">
                    No image available
                  </div>
                `
            }

            <button
              class="quick-add add-to-cart-btn"
              type="button"
              data-id="${product._id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              ${
                stock > 0
                  ? `Add to cart <span>+</span>`
                  : "Out of stock"
              }
            </button>

          </div>

          <div class="product-info">

            <p class="product-category">
              ${escapeHTML(product.category || "YEMS PERFUME")}
            </p>

            <h3>
              ${escapeHTML(product.name)}
            </h3>

            ${
              product.description
                ? `
                  <p class="product-description">
                    ${escapeHTML(product.description)}
                  </p>
                `
                : ""
            }

            <div class="product-meta">

              ${
                product.size
                  ? `<span>${escapeHTML(product.size)}</span>`
                  : ""
              }

              ${
                product.ml
                  ? `<span>${product.ml}ml</span>`
                  : ""
              }

            </div>

            <div class="product-bottom">

              <span>
                ₦${Number(
                  product.price || 0
                ).toLocaleString()}
              </span>

              <a
                href="product-details.html?id=${encodeURIComponent(product._id)}"
                class="product-details-link"
                aria-label="View details for ${escapeHTML(product.name)}"
              >
                View details <span>→</span>
              </a>

            </div>

          </div>

        </article>
      `;
    })
    .join("");

  attachAddToCartButtons();
}


// ===============================
// ADD TO CART BUTTONS
// ===============================
function attachAddToCartButtons() {
  const buttons =
    document.querySelectorAll(".add-to-cart-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.id);
    });
  });
}


// ===============================
// ADD PRODUCT TO CART
// ===============================
function addToCart(productId) {
  const product = products.find(
    (item) => item._id === productId
  );

  if (!product) {
    alert("Product not found.");
    return;
  }

  const stock = Number(product.stock || 0);

  if (stock <= 0) {
    alert("This product is out of stock.");
    return;
  }

  // Always read the latest cart
  // from localStorage
  let currentCart =
    JSON.parse(
      localStorage.getItem("yemsCart")
    ) || [];

  const existingProduct =
    currentCart.find(
      (item) =>
        item.productId === product._id
    );

  if (existingProduct) {

    // Increase quantity
    // without replacing the product
    existingProduct.quantity += 1;

  } else {

    // Add another completely separate
    // product to the cart
    currentCart.push({
      productId: product._id,
      name: product.name,
      price: Number(product.price || 0),
      size: product.size || "",
      ml: product.ml || "",
      image: product.image || "",
      quantity: 1
    });
  }

  localStorage.setItem(
    "yemsCart",
    JSON.stringify(currentCart)
  );

  cart = currentCart;

  updateCartCount();

  // Change button briefly
  const button =
    document.querySelector(
      `.add-to-cart-btn[data-id="${productId}"]`
    );

  if (button) {
    const originalText =
      button.innerHTML;

    button.innerHTML =
      "Added ✓";

    button.disabled = true;

    setTimeout(() => {
      button.innerHTML =
        originalText;

      button.disabled = false;
    }, 900);
  }
}


// ===============================
// CART COUNT
// ===============================
function updateCartCount() {
  const currentCart =
    JSON.parse(
      localStorage.getItem("yemsCart")
    ) || [];

  const totalQuantity =
    currentCart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

  cartCountElements.forEach(
    (element) => {
      element.textContent =
        totalQuantity;
    }
  );
}


// ===============================
// CATEGORY FILTER
// ===============================
function filterProducts(category) {
  if (
    !category ||
    category.toLowerCase() === "all"
  ) {
    renderProducts(products);
    return;
  }

  const filteredProducts =
    products.filter(
      (product) =>
        (product.category || "")
          .toLowerCase() ===
        category.toLowerCase()
    );

  renderProducts(filteredProducts);
}


// ===============================
// SELECT FILTER
// ===============================
if (categoryFilter) {
  categoryFilter.addEventListener(
    "change",
    () => {
      const selectedCategory =
        categoryFilter.value;

      filterProducts(
        selectedCategory
      );

      // Keep sidebar buttons
      // synchronized
      document
        .querySelectorAll(".filter-btn")
        .forEach((button) => {
          button.classList.toggle(
            "active",
            button.dataset.category.toLowerCase() ===
              selectedCategory.toLowerCase()
          );
        });
    }
  );
}


// ===============================
// SIDEBAR FILTER BUTTONS
// ===============================
document
  .querySelectorAll(".filter-btn")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {

        const category =
          button.dataset.category;

        document
          .querySelectorAll(".filter-btn")
          .forEach((item) => {
            item.classList.remove(
              "active"
            );
          });

        button.classList.add(
          "active"
        );

        if (categoryFilter) {
          categoryFilter.value =
            category;
        }

        filterProducts(category);
      }
    );
  });


// ===============================
// ESCAPE HTML
// ===============================
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ===============================
// START
// ===============================
loadProducts();
updateCartCount();