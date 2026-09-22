const PRODUCTS_API =
  "/products";

const INITIALIZE_PAYMENT_API =
  "/orders/initialize-payment";


let products = [];

let cart =
  readCart();

let fulfillment =
  "delivery";


/* =====================================================
   ELEMENTS
===================================================== */

const form =
  document.getElementById(
    "checkoutForm"
  );

const checkoutItems =
  document.getElementById(
    "checkoutItems"
  );

const subtotalEl =
  document.getElementById(
    "checkoutSubtotal"
  );

const deliveryEl =
  document.getElementById(
    "checkoutDelivery"
  );

const totalEl =
  document.getElementById(
    "checkoutTotal"
  );

const deliverySection =
  document.getElementById(
    "deliverySection"
  );

const pickupSection =
  document.getElementById(
    "pickupSection"
  );

const addressInput =
  document.getElementById(
    "address"
  );

const checkoutMessage =
  document.getElementById(
    "checkoutMessage"
  );

const placeOrderButton =
  document.getElementById(
    "placeOrderButton"
  );

const placeOrderButtonText =
  document.getElementById(
    "placeOrderButtonText"
  );


/* =====================================================
   START
===================================================== */

window.addEventListener(
  "DOMContentLoaded",
  initCheckout
);


async function initCheckout() {

  setupFulfillment();

  updateFulfillmentUI();

  updateCartCount();

  await loadProducts();

}


/* =====================================================
   CART
===================================================== */

function readCart() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          "yemsCart"
        )
      );

    return Array.isArray(saved)
      ? saved
      : [];

  } catch (error) {

    console.error(
      "Unable to read YEMS cart:",
      error
    );

    return [];

  }

}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

  try {

    const response =
      await fetch(
        PRODUCTS_API
      );

    const result =
      await response.json();


    if (
      !response.ok ||
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Unable to load products."
      );

    }


    products =
      Array.isArray(result)
        ? result
        : result.products ||
          result.data?.products ||
          (
            Array.isArray(
              result.data
            )
              ? result.data
              : []
          );


    renderCheckout();

  } catch (error) {

    console.error(
      "Checkout product load error:",
      error
    );


    if (checkoutItems) {

      checkoutItems.innerHTML = `
        <p class="empty-checkout">
          Unable to load your order.
        </p>
      `;

    }


    updateTotals();

    showCheckoutMessage(
      "Unable to load your order. Please refresh and try again.",
      "error"
    );

  }

}


/* =====================================================
   FULFILMENT
===================================================== */

function setupFulfillment() {

  document
    .querySelectorAll(
      'input[name="deliveryMethod"]'
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "change",
          () => {

            fulfillment =
              input.value ===
              "pickup"
                ? "pickup"
                : "delivery";


            updateFulfillmentUI();

          }
        );

      }
    );

}


function updateFulfillmentUI() {

  const isDelivery =
    fulfillment ===
    "delivery";


  if (deliverySection) {

    deliverySection.classList.toggle(
      "hidden",
      !isDelivery
    );

  }


  if (pickupSection) {

    pickupSection.classList.toggle(
      "hidden",
      isDelivery
    );

  }


  if (addressInput) {

    addressInput.required =
      false;

  }


  updateTotals();

}


/* =====================================================
   RENDER CHECKOUT
===================================================== */

function renderCheckout() {

  if (!checkoutItems) {
    return;
  }


  if (!cart.length) {

    checkoutItems.innerHTML = `
      <div class="empty-checkout">

        Your cart is empty.

        <br />

        <a href="shop.html">
          Return to shop
        </a>

      </div>
    `;


    updateTotals();

    return;
  }


  const validItems =
    cart

      .map(
        (cartItem) => {

          const product =
            products.find(
              (item) =>
                String(
                  item._id
                ) ===
                String(
                  cartItem.productId
                )
            );


          if (!product) {
            return null;
          }


          return {

            product,

            quantity:
              Number(
                cartItem.quantity
              ) || 1

          };

        }
      )

      .filter(Boolean);


  if (!validItems.length) {

    checkoutItems.innerHTML = `
      <div class="empty-checkout">

        Your cart items could not be found.

        <br />

        <a href="shop.html">
          Return to shop
        </a>

      </div>
    `;


    updateTotals();

    return;
  }


  checkoutItems.innerHTML =
    validItems
      .map(
        ({
          product,
          quantity
        }) => {

          const price =
            Number(
              product.price
            ) || 0;


          const image =
            getImageUrl(
              product.image
            );


          return `
            <div class="checkout-item">

              <div class="checkout-item-image">

                ${
                  image

                    ? `
                      <img
                        src="${image}"
                        alt="${escapeHTML(
                          product.name
                        )}"
                      />
                    `

                    : `
                      <div class="no-checkout-image">
                        No image
                      </div>
                    `
                }

              </div>


              <div class="checkout-item-info">

                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>


                <p>
                  Quantity:
                  ${quantity}
                </p>

              </div>


              <span class="checkout-item-price">

                ₦${(
                  price *
                  quantity
                ).toLocaleString()}

              </span>

            </div>
          `;

        }
      )
      .join("");


  updateTotals();

}


/* =====================================================
   SUBTOTAL
===================================================== */

function calculateSubtotal() {

  return cart.reduce(
    (
      total,
      cartItem
    ) => {

      const product =
        products.find(
          (item) =>
            String(
              item._id
            ) ===
            String(
              cartItem.productId
            )
        );


      if (!product) {
        return total;
      }


      const price =
        Number(
          product.price
        ) || 0;


      const quantity =
        Number(
          cartItem.quantity
        ) || 1;


      return (
        total +
        price *
        quantity
      );

    },
    0
  );

}


/* =====================================================
   TOTALS
===================================================== */

function updateTotals() {

  const subtotal =
    calculateSubtotal();


  if (subtotalEl) {

    subtotalEl.textContent =
      `₦${subtotal.toLocaleString()}`;

  }


  if (deliveryEl) {

    deliveryEl.textContent =
      fulfillment ===
      "delivery"

        ? "Discuss on WhatsApp"

        : "₦0";

  }


  if (totalEl) {

    totalEl.textContent =
      `₦${subtotal.toLocaleString()}`;

  }

}


/* =====================================================
   FORM SUBMIT
===================================================== */

if (form) {

  form.addEventListener(
    "submit",
    handleCheckoutSubmit
  );

}


async function handleCheckoutSubmit(
  event
) {

  event.preventDefault();

  clearCheckoutMessage();


  if (!cart.length) {

    showCheckoutMessage(
      "Your cart is empty.",
      "error"
    );

    return;
  }


  const formData =
    new FormData(
      form
    );


  const fullName =
    String(
      formData.get(
        "fullName"
      ) || ""
    ).trim();


  const email =
    String(
      formData.get(
        "email"
      ) || ""
    ).trim();


  const phone =
    String(
      formData.get(
        "phone"
      ) || ""
    ).trim();


  const address =
    fulfillment ===
    "delivery"

      ? String(
          formData.get(
            "address"
          ) || ""
        ).trim()

      : "Pickup";


  if (
    !fullName ||
    !email ||
    !phone
  ) {

    showCheckoutMessage(
      "Please complete your contact information.",
      "error"
    );

    return;
  }


  /*
    Delivery address is optional because
    location and delivery fee will be discussed
    with the customer on WhatsApp after payment.
  */


  setPaymentLoading(
    true
  );


  try {

    const response =
      await fetch(
        INITIALIZE_PAYMENT_API,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              customer: {

                fullName,

                email,

                phone,

                address:
                  address ||
                  (
                    fulfillment ===
                    "delivery"

                      ? "To be confirmed on WhatsApp"

                      : "Pickup"
                  ),

                city:
                  fulfillment ===
                  "delivery"

                    ? "To be confirmed on WhatsApp"

                    : "Pickup",

                state:
                  fulfillment ===
                  "delivery"

                    ? "To be confirmed on WhatsApp"

                    : "Pickup",

                additionalNote:
                  ""

              },


              items:
                cart,


              paymentMethod:
                "paystack",


              deliveryMethod:
                fulfillment

            })

        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.status !==
        "success" ||
      !result.data?.authorization_url
    ) {

      throw new Error(
        result.message ||
        "Unable to start payment."
      );

    }


    /*
      Keep the cart until payment has
      actually been verified.
    */

    localStorage.setItem(
      "yemsPendingOrder",
      JSON.stringify({

        orderReference:
          result.data.orderReference,

        deliveryMethod:
          fulfillment

      })
    );


    window.location.href =
      result.data.authorization_url;


  } catch (error) {

    console.error(
      "Payment initialization error:",
      error
    );


    showCheckoutMessage(
      error.message ||
      "Unable to start payment.",
      "error"
    );


    setPaymentLoading(
      false
    );

  }

}


/* =====================================================
   PAYMENT BUTTON
===================================================== */

function setPaymentLoading(
  loading
) {

  if (!placeOrderButton) {
    return;
  }


  placeOrderButton.disabled =
    loading;


  if (placeOrderButtonText) {

    placeOrderButtonText.textContent =
      loading

        ? "Processing..."

        : "Pay for order";

  }

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

  const totalItems =
    cart.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.quantity
          ) || 0
        ),
      0
    );


  document
    .querySelectorAll(
      ".cart-count"
    )
    .forEach(
      (element) => {

        element.textContent =
          totalItems;

      }
    );

}


/* =====================================================
   MESSAGE
===================================================== */

function showCheckoutMessage(
  message,
  type = "error"
) {

  if (!checkoutMessage) {

    alert(
      message
    );

    return;
  }


  checkoutMessage.textContent =
    message;


  checkoutMessage.className =
    `checkout-message ${type}`;

}


function clearCheckoutMessage() {

  if (!checkoutMessage) {
    return;
  }


  checkoutMessage.textContent =
    "";


  checkoutMessage.className =
    "checkout-message";

}


/* =====================================================
   IMAGE
===================================================== */

function getImageUrl(
  image
) {

  if (
    !image ||
    typeof image !==
      "string"
  ) {

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


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
  value
) {

  return String(
    value
  )

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