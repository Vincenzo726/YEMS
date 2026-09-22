const PRODUCTS_API = "/products";

const cartItemsContainer =
  document.querySelector("#cartItems");

const cartSubtotal =
  document.querySelector("#cartSubtotal");

const cartTotal =
  document.querySelector("#cartTotal");

let products = [];

let cart =
  JSON.parse(
    localStorage.getItem("yemsCart")
  ) || [];


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadCart() {
  try {
    const response =
      await fetch(PRODUCTS_API);

    const result =
      await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Unable to fetch products"
      );
    }

    products =
      result.products ||
      result.data?.products ||
      result.data ||
      [];

    renderCart();

  } catch (error) {
    console.error(
      "Cart loading error:",
      error
    );

    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <h2>Unable to load cart.</h2>
          <p>
            We couldn't load your products right now.
          </p>
          <a href="shop.html">
            Return to shop
          </a>
        </div>
      `;
    }
  }
}


// ===============================
// RENDER CART
// ===============================

function renderCart() {

  if (!cartItemsContainer) {
    return;
  }

  // No products in cart
  if (!cart.length) {

    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty.</h2>

        <p>
          Discover a fragrance made for your signature.
        </p>

        <a href="shop.html">
          Explore fragrances
        </a>
      </div>
    `;

    updateSummary(0);
    updateCartCount();

    return;
  }


  // Match localStorage cart items
  // with actual backend products
  const validCartItems = cart
    .map((cartItem) => {

      const product =
        products.find(
          (item) =>
            item._id ===
            cartItem.productId
        );

      if (!product) {
        return null;
      }

      return {
        ...cartItem,
        product
      };

    })
    .filter(Boolean);


  // If products disappeared from backend
  if (!validCartItems.length) {

    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty.</h2>

        <p>
          The products in your cart
          are no longer available.
        </p>

        <a href="shop.html">
          Return to shop
        </a>
      </div>
    `;

    updateSummary(0);
    updateCartCount();

    return;
  }


  // Render every product
  cartItemsContainer.innerHTML =
    validCartItems
      .map((item) => {

        const product =
          item.product;

        const imageUrl =
          getImageUrl(
            product.image
          );

        const quantity =
          Number(item.quantity) || 1;

        const price =
          Number(product.price) || 0;

        return `
          <article class="cart-item">

            <div class="cart-item-image">

              ${
                imageUrl
                  ? `
                    <img
                      src="${imageUrl}"
                      alt="${escapeHTML(
                        product.name
                      )}"
                    />
                  `
                  : `
                    <div class="no-cart-image">
                      No image
                    </div>
                  `
              }

            </div>


            <div class="cart-item-info">

              <h3>
                ${escapeHTML(
                  product.name
                )}
              </h3>

              <p>
                ${escapeHTML(
                  product.category ||
                  "Fragrance"
                )}

                ${
                  product.ml
                    ? ` · ${product.ml}ml`
                    : ""
                }
              </p>

              ${
                product.size
                  ? `
                    <small>
                      ${escapeHTML(
                        product.size
                      )}
                    </small>
                  `
                  : ""
              }

              <span class="cart-item-price">
                ₦${price.toLocaleString()}
              </span>


              <div class="quantity-control">

                <button
                  type="button"
                  onclick="changeQuantity(
                    '${product._id}',
                    -1
                  )"
                >
                  −
                </button>

                <span>
                  ${quantity}
                </span>

                <button
                  type="button"
                  onclick="changeQuantity(
                    '${product._id}',
                    1
                  )"
                >
                  +
                </button>

              </div>

            </div>


            <div class="cart-item-right">

              <span class="cart-item-total">
                ₦${(
                  price * quantity
                ).toLocaleString()}
              </span>

              <button
                class="remove-item"
                type="button"
                onclick="removeFromCart(
                  '${product._id}'
                )"
              >
                Remove
              </button>

            </div>

          </article>
        `;
      })
      .join("");


  // Calculate total
  const total =
    validCartItems.reduce(
      (sum, item) => {

        const price =
          Number(
            item.product.price
          ) || 0;

        const quantity =
          Number(
            item.quantity
          ) || 1;

        return (
          sum +
          price * quantity
        );

      },
      0
    );


  updateSummary(total);

  updateCartCount();
}


// ===============================
// CHANGE QUANTITY
// ===============================

function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      (cartItem) =>
        cartItem.productId ===
        productId
    );

  if (!item) {
    return;
  }


  item.quantity =
    Number(item.quantity) +
    Number(amount);


  // Remove when quantity reaches zero
  if (item.quantity <= 0) {

    cart =
      cart.filter(
        (cartItem) =>
          cartItem.productId !==
          productId
      );
  }


  saveCart();

  renderCart();
}


// ===============================
// REMOVE PRODUCT
// ===============================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      (cartItem) =>
        cartItem.productId !==
        productId
    );

  saveCart();

  renderCart();
}


// ===============================
// SAVE CART
// ===============================

function saveCart() {

  localStorage.setItem(
    "yemsCart",
    JSON.stringify(cart)
  );

}


// ===============================
// UPDATE TOTAL
// ===============================

function updateSummary(
  total
) {

  const formattedTotal =
    `₦${Number(
      total
    ).toLocaleString()}`;


  if (cartSubtotal) {
    cartSubtotal.textContent =
      formattedTotal;
  }


  if (cartTotal) {
    cartTotal.textContent =
      formattedTotal;
  }

}


// ===============================
// UPDATE CART COUNT
// ===============================

function updateCartCount() {

  const totalItems =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );


  document
    .querySelectorAll(
      ".cart-count"
    )
    .forEach((element) => {

      element.textContent =
        totalItems;

    });

}


// ===============================
// IMAGE URL
// ===============================

function getImageUrl(
  image
) {

  if (!image) {
    return "";
  }


  if (
    image.startsWith(
      "http://"
    ) ||
    image.startsWith(
      "https://"
    )
  ) {
    return image;
  }


  if (
    image.startsWith(
      "/uploads/"
    )
  ) {
    return image;
  }


  return `/uploads/${image}`;
}


// ===============================
// HTML SAFETY
// ===============================

function escapeHTML(
  value
) {

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

document.addEventListener(
  "DOMContentLoaded",
  loadCart
);