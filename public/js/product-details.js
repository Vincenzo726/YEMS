const productDetails =
  document.querySelector("#productDetails");

const cartCountElements =
  document.querySelectorAll(".cart-count");

let product = null;
let quantity = 1;


// ===============================
// GET PRODUCT ID
// ===============================
const params =
  new URLSearchParams(window.location.search);

const productId =
  params.get("id");


// ===============================
// LOAD PRODUCT
// ===============================
async function loadProductDetails() {

  if (!productDetails) return;

  if (!productId) {
    showError("Product not found.");
    return;
  }

  try {

    const response =
      await fetch(
        `/products/${encodeURIComponent(productId)}`,
        {
          cache: "no-store"
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Unable to load product."
      );
    }

    product =
      result.product;

    renderProduct();

    updateCartCount();

  } catch (error) {

    console.error(
      "Product details error:",
      error
    );

    showError(
      "Unable to load this product right now."
    );
  }
}


// ===============================
// RENDER PRODUCT
// ===============================
function renderProduct() {

  const stock =
    Number(product.stock || 0);

  let imageUrl = "";

  if (product.image) {

    if (
      product.image.startsWith("http://") ||
      product.image.startsWith("https://") ||
      product.image.startsWith("/")
    ) {

      imageUrl =
        product.image;

    } else {

      imageUrl =
        `/uploads/${product.image}`;
    }
  }


  document.title =
    `${product.name} | YEMS PERFUME`;


  productDetails.innerHTML = `

    <div class="product-details-image">

      ${
        imageUrl
          ? `
            <img
              src="${imageUrl}"
              alt="${escapeHTML(product.name)}"
            >
          `
          : `
            <div class="product-details-loading">
              No image available
            </div>
          `
      }

    </div>


    <div class="product-details-info">

      <p class="product-details-category">
        ${escapeHTML(
          product.category ||
          "YEMS PERFUME"
        )}
      </p>


      <h1>
        ${escapeHTML(product.name)}
      </h1>


      <p class="product-details-price">
        ₦${Number(
          product.price || 0
        ).toLocaleString()}
      </p>


      ${
        product.description
          ? `
            <p class="product-details-description">
              ${escapeHTML(
                product.description
              )}
            </p>
          `
          : `
            <p class="product-details-description">
              A carefully selected YEMS fragrance
              created to leave a lasting impression.
            </p>
          `
      }


      <div class="product-details-meta">

        ${
          product.size
            ? `
              <span>
                Size: ${escapeHTML(product.size)}
              </span>
            `
            : ""
        }

        ${
          product.ml
            ? `
              <span>
                ${product.ml}ml
              </span>
            `
            : ""
        }

        <span>
          Category:
          ${escapeHTML(
            product.category ||
            "YEMS PERFUME"
          )}
        </span>

      </div>


      <p
        class="product-stock ${
          stock > 0
            ? "available"
            : "sold-out"
        }"
      >
        ${
          stock > 0
            ? `${stock} available`
            : "Currently out of stock"
        }
      </p>


      <div class="product-quantity">

        <button
          type="button"
          class="quantity-btn"
          id="decreaseQuantity"
          ${stock <= 0 ? "disabled" : ""}
        >
          −
        </button>

        <span
          class="quantity-value"
          id="quantityValue"
        >
          1
        </span>

        <button
          type="button"
          class="quantity-btn"
          id="increaseQuantity"
          ${stock <= 0 ? "disabled" : ""}
        >
          +
        </button>

      </div>


      <button
        type="button"
        class="product-details-add"
        id="addDetailsToCart"
        ${stock <= 0 ? "disabled" : ""}
      >
        ${
          stock > 0
            ? "Add to cart"
            : "Out of stock"
        }
      </button>


      <p
        class="product-added-message"
        id="productAddedMessage"
      ></p>

    </div>

  `;


  attachQuantityControls();

  attachAddToCart();
}


// ===============================
// QUANTITY CONTROLS
// ===============================
function attachQuantityControls() {

  const decrease =
    document.querySelector(
      "#decreaseQuantity"
    );

  const increase =
    document.querySelector(
      "#increaseQuantity"
    );

  const quantityValue =
    document.querySelector(
      "#quantityValue"
    );


  if (decrease) {

    decrease.addEventListener(
      "click",
      () => {

        if (quantity > 1) {
          quantity -= 1;
          quantityValue.textContent =
            quantity;
        }

      }
    );
  }


  if (increase) {

    increase.addEventListener(
      "click",
      () => {

        const stock =
          Number(
            product.stock || 0
          );

        if (
          quantity < stock
        ) {

          quantity += 1;

          quantityValue.textContent =
            quantity;

        }

      }
    );
  }
}


// ===============================
// ADD TO CART
// ===============================
function attachAddToCart() {

  const button =
    document.querySelector(
      "#addDetailsToCart"
    );

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      if (!product) return;


      const stock =
        Number(product.stock || 0);


      if (stock <= 0) {
        return;
      }


      let currentCart =
        JSON.parse(
          localStorage.getItem(
            "yemsCart"
          )
        ) || [];


      const existingProduct =
        currentCart.find(
          (item) =>
            item.productId ===
            product._id
        );


      if (existingProduct) {

        const newQuantity =
          existingProduct.quantity +
          quantity;


        if (
          newQuantity > stock
        ) {

          alert(
            `Only ${stock} item${
              stock === 1
                ? ""
                : "s"
            } available.`
          );

          return;
        }


        existingProduct.quantity =
          newQuantity;

      } else {

        currentCart.push({

          productId:
            product._id,

          name:
            product.name,

          price:
            Number(
              product.price || 0
            ),

          size:
            product.size || "",

          ml:
            product.ml || "",

          image:
            product.image || "",

          quantity:
            quantity

        });

      }


      localStorage.setItem(
        "yemsCart",
        JSON.stringify(
          currentCart
        )
      );


      updateCartCount();


      const message =
        document.querySelector(
          "#productAddedMessage"
        );


      if (message) {

        message.textContent =
          quantity === 1
            ? "Added to your cart ✓"
            : `${quantity} items added to your cart ✓`;

      }


      button.textContent =
        "Added ✓";


      setTimeout(
        () => {

          button.textContent =
            "Add to cart";

        },
        1200
      );

    }
  );
}


// ===============================
// CART COUNT
// ===============================
function updateCartCount() {

  const currentCart =
    JSON.parse(
      localStorage.getItem(
        "yemsCart"
      )
    ) || [];


  const totalQuantity =
    currentCart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
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
// ERROR
// ===============================
function showError(message) {

  productDetails.innerHTML = `

    <div class="product-details-error">

      ${escapeHTML(message)}

      <br><br>

      <a href="shop.html">
        Return to shop
      </a>

    </div>

  `;
}


// ===============================
// ESCAPE HTML
// ===============================
function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ===============================
// START
// ===============================
loadProductDetails();
updateCartCount();