const VERIFY_PAYMENT_BASE =
  "/orders/verify-payment";


const WHATSAPP_NUMBER =
  "2349036456992";


/* =====================================================
   ELEMENTS
===================================================== */

const statusCard =
  document.getElementById(
    "statusCard"
  );

const statusIcon =
  document.getElementById(
    "statusIcon"
  );

const statusTitle =
  document.getElementById(
    "statusTitle"
  );

const statusText =
  document.getElementById(
    "statusText"
  );

const orderReferenceEl =
  document.getElementById(
    "orderReference"
  );

const orderTotalEl =
  document.getElementById(
    "orderTotal"
  );

const whatsappButton =
  document.getElementById(
    "whatsappButton"
  );

const pickupDetails =
  document.getElementById(
    "pickupDetails"
  );


/* =====================================================
   START
===================================================== */

window.addEventListener(
  "DOMContentLoaded",
  verifyPayment
);


/* =====================================================
   VERIFY PAYMENT
===================================================== */

async function verifyPayment() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );


  const reference =
    urlParams.get(
      "reference"
    );


  if (!reference) {

    showFailure(
      "No payment reference was provided."
    );

    return;

  }


  setLoading();


  try {

    const response =
      await fetch(
        `${VERIFY_PAYMENT_BASE}/${encodeURIComponent(
          reference
        )}`
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      result.status !==
        "success" ||
      !result.data?.order
    ) {

      throw new Error(
        result.message ||
        "We could not verify this payment."
      );

    }


    const order =
      result.data.order;


    if (
      order.paymentStatus !==
      "paid"
    ) {

      throw new Error(
        "Payment has not been confirmed yet."
      );

    }


    /*
      Only clear cart after the
      backend confirms payment.
    */

    localStorage.removeItem(
      "yemsCart"
    );

    localStorage.removeItem(
      "yemsPendingOrder"
    );


    showSuccess(
      order
    );


  } catch (error) {

    console.error(
      "Payment verification error:",
      error
    );


    showFailure(
      error.message ||
      "We could not verify this payment."
    );

  }

}


/* =====================================================
   LOADING
===================================================== */

function setLoading() {

  statusCard?.classList.remove(
    "success",
    "error"
  );

  statusCard?.classList.add(
    "loading"
  );


  if (statusIcon) {

    statusIcon.textContent =
      "…";

  }


  if (statusTitle) {

    statusTitle.textContent =
      "Confirming your payment";

  }


  if (statusText) {

    statusText.textContent =
      "Please wait while YEMS confirms your Paystack payment.";

  }


  whatsappButton?.classList.add(
    "hidden"
  );

  pickupDetails?.classList.add(
    "hidden"
  );

}


/* =====================================================
   SUCCESS
===================================================== */

function showSuccess(
  order
) {

  statusCard?.classList.remove(
    "loading",
    "error"
  );

  statusCard?.classList.add(
    "success"
  );


  if (statusIcon) {

    statusIcon.textContent =
      "✓";

  }


  if (statusTitle) {

    statusTitle.textContent =
      "Order successful";

  }


  const isDelivery =
    order.deliveryMethod ===
    "delivery";

  const isPickup =
    order.deliveryMethod ===
    "pickup";


  if (statusText) {

    statusText.textContent =
      isDelivery

        ? "Your payment has been verified successfully. You will now continue to WhatsApp to arrange your delivery."

        : "Your payment has been verified successfully. Your pickup order has been recorded.";

  }


  /* ORDER REFERENCE */

  if (orderReferenceEl) {

    orderReferenceEl.textContent =
      order.orderReference ||
      "—";

  }


  /* AMOUNT */

  if (orderTotalEl) {

    const amount =
      Number(
        order.total ??
        order.subtotal ??
        0
      );


    orderTotalEl.textContent =
      `₦${amount.toLocaleString()}`;

  }


  /* PICKUP */

  if (isPickup) {

    pickupDetails?.classList.remove(
      "hidden"
    );

  }


  /* DELIVERY */

  if (isDelivery) {

    prepareWhatsAppMessage(
      order
    );


    whatsappButton?.classList.remove(
      "hidden"
    );


    setTimeout(
      () => {

        if (
          whatsappButton?.href
        ) {

          window.location.href =
            whatsappButton.href;

        }

      },
      2500
    );

  }

}


/* =====================================================
   FAILURE
===================================================== */

function showFailure(
  message
) {

  statusCard?.classList.remove(
    "loading",
    "success"
  );

  statusCard?.classList.add(
    "error"
  );


  if (statusIcon) {

    statusIcon.textContent =
      "!";

  }


  if (statusTitle) {

    statusTitle.textContent =
      "Payment could not be confirmed";

  }


  if (statusText) {

    statusText.textContent =
      message;

  }


  whatsappButton?.classList.add(
    "hidden"
  );

  pickupDetails?.classList.add(
    "hidden"
  );

}


/* =====================================================
   WHATSAPP MESSAGE
===================================================== */

function prepareWhatsAppMessage(
  order
) {

  const itemsText =
    Array.isArray(
      order.items
    )

      ? order.items
          .map(
            (item) =>
              `• ${item.name} × ${item.quantity}`
          )
          .join("\n")

      : "• Order items available in YEMS order record";


  const message =
    [
      "Hello YEMS PERFUME 👋",

      "",

      "I have successfully placed and paid for my order.",

      "",

      `Order Reference: ${
        order.orderReference ||
        "—"
      }`,

      `Customer: ${
        order.customer?.fullName ||
        "—"
      }`,

      `Phone: ${
        order.customer?.phone ||
        "—"
      }`,

      `Amount Paid: ₦${Number(
        order.total ??
        order.subtotal ??
        0
      ).toLocaleString()}`,

      "",

      "Items:",

      itemsText,

      "",

      "I selected DELIVERY. Please help me confirm my delivery location, delivery fee and delivery arrangements.",

      "",

      "Thank you."
    ].join(
      "\n"
    );


  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;


  if (whatsappButton) {

    whatsappButton.href =
      whatsappUrl;

  }

}