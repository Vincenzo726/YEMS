const crypto = require("crypto");

const Order = require("../models/orderModel");
const Product = require("../models/productModel");


// =====================================================
// CONFIG
// =====================================================

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY;

const PAYSTACK_API_URL =
  "https://api.paystack.co";


// =====================================================
// GENERATE UNIQUE ORDER REFERENCE
// =====================================================

const generateOrderReference = () => {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const randomPart = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `YEMS-${date}-${randomPart}`;
};


// =====================================================
// DELIVERY FEE
// =====================================================

const getDeliveryFee = (state) => {
  const deliveryFees = {
    Lagos: 3000,
    Abuja: 4000,
    Oyo: 2500,
    Ogun: 3000,
    Ekiti: 2000,
  };

  return deliveryFees[state] ?? 3500;
};


// =====================================================
// BUILD + VALIDATE ORDER
// =====================================================

const buildOrderData = async ({
  customer,
  items,
  paymentMethod = "paystack",
}) => {

  // -----------------------------------------------
  // Validate customer
  // -----------------------------------------------

  if (
    !customer ||
    !customer.fullName ||
    !customer.email ||
    !customer.phone ||
    !customer.address ||
    !customer.city ||
    !customer.state
  ) {
    throw new Error(
      "Please provide all required customer details"
    );
  }


  // -----------------------------------------------
  // Validate cart
  // -----------------------------------------------

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error("Your cart is empty");
  }


  // -----------------------------------------------
  // Validate payment method
  // -----------------------------------------------

  if (paymentMethod !== "paystack") {
    throw new Error("Invalid payment method");
  }


  let subtotal = 0;

  const orderItems = [];


  // -----------------------------------------------
  // Validate every cart item
  // -----------------------------------------------

  for (const item of items) {

    if (
      !item.productId ||
      !Number.isInteger(
        Number(item.quantity)
      )
    ) {
      throw new Error(
        "Invalid product information"
      );
    }


    const quantity =
      Number(item.quantity);


    if (quantity < 1) {
      throw new Error(
        "Product quantity must be at least 1"
      );
    }


    // Get real product from MongoDB
    const product =
      await Product.findById(
        item.productId
      );


    if (!product) {
      const error =
        new Error(
          `Product not found: ${item.productId}`
        );

      error.statusCode = 404;

      throw error;
    }


    // ---------------------------------------------
    // Check real stock
    // ---------------------------------------------

    if (
      Number(product.stock) <
      quantity
    ) {
      const error =
        new Error(
          `${product.name} does not have enough stock`
        );

      error.statusCode = 400;

      throw error;
    }


    // ---------------------------------------------
    // Calculate using DB price
    // ---------------------------------------------

    const itemTotal =
      Number(product.price) *
      quantity;

    subtotal += itemTotal;


    // ---------------------------------------------
    // Save product snapshot
    // ---------------------------------------------

    orderItems.push({
      productId: product._id,
      name: product.name,
      quantity,
      price: product.price,
      size: product.size,
      ml: product.ml,
      image: product.image,
    });
  }


  // -----------------------------------------------
  // Delivery + total
  // -----------------------------------------------

  const deliveryFee =
    getDeliveryFee(
      customer.state
    );

  const total =
    subtotal + deliveryFee;


  return {
    orderItems,
    subtotal,
    deliveryFee,
    total,
  };
};


// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {

  try {

    const {
      customer,
      items,
      paymentMethod = "paystack",
    } = req.body;


    const {
      orderItems,
      subtotal,
      deliveryFee,
      total,
    } = await buildOrderData({
      customer,
      items,
      paymentMethod,
    });


    const orderReference =
      generateOrderReference();


    const order =
      await Order.create({

        orderReference,

        customer: {
          fullName:
            customer.fullName,

          email:
            customer.email,

          phone:
            customer.phone,

          address:
            customer.address,

          city:
            customer.city,

          state:
            customer.state,

          additionalNote:
            customer.additionalNote ||
            "",
        },


        items: orderItems,

        subtotal,

        deliveryFee,

        total,

        paymentMethod,

        paymentStatus:
          "pending",

        orderStatus:
          "pending",
      });


    res.status(201).json({
      status: "success",

      message:
        "Order created successfully",

      data: {
        order,
      },
    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );


    res.status(
      error.statusCode || 500
    ).json({

      status: "fail",

      message:
        error.message ||
        "Failed to create order",
    });
  }
};


// =====================================================
// INITIALIZE PAYSTACK PAYMENT
// =====================================================

const initializePayment = async (
  req,
  res
) => {

  try {

    if (!PAYSTACK_SECRET_KEY) {

      return res.status(500).json({
        status: "fail",

        message:
          "PAYSTACK_SECRET_KEY is not configured on the server.",
      });
    }


    const {
      customer,
      items,
      paymentMethod = "paystack",
    } = req.body;


    // -----------------------------------------------
    // Build order using REAL DB prices
    // -----------------------------------------------

    const {
      orderItems,
      subtotal,
      deliveryFee,
      total,
    } = await buildOrderData({

      customer,

      items,

      paymentMethod,
    });


    // -----------------------------------------------
    // Create pending order first
    // -----------------------------------------------

    const orderReference =
      generateOrderReference();


    const order =
      await Order.create({

        orderReference,

        customer: {
          fullName:
            customer.fullName,

          email:
            customer.email,

          phone:
            customer.phone,

          address:
            customer.address,

          city:
            customer.city,

          state:
            customer.state,

          additionalNote:
            customer.additionalNote ||
            "",
        },


        items: orderItems,

        subtotal,

        deliveryFee,

        total,

        paymentMethod,

        paymentStatus:
          "pending",

        orderStatus:
          "pending",
      });


    // -----------------------------------------------
    // Paystack expects amount in subunit
    // For NGN: naira × 100
    // -----------------------------------------------

    const amountInKobo =
      Math.round(total * 100);


    // -----------------------------------------------
    // Initialize transaction
    // -----------------------------------------------

    const paystackResponse =
      await fetch(
        `${PAYSTACK_API_URL}/transaction/initialize`,
        {

          method: "POST",

          headers: {

            Authorization:
              `Bearer ${PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            email:
              customer.email,

            amount:
              amountInKobo.toString(),

            currency:
              "NGN",

            reference:
              orderReference,

            callback_url:
              getCallbackUrl(),

            metadata: {

              orderReference,

              customerName:
                customer.fullName,

              customerPhone:
                customer.phone,
            },

            channels: [
              "card",
              "bank",
              "ussd",
              "bank_transfer",
            ],
          }),
        }
      );


    const paystackData =
      await paystackResponse.json();


    if (
      !paystackResponse.ok ||
      !paystackData.status
    ) {

      // If initialization fails,
      // remove the pending order
      await Order.findByIdAndDelete(
        order._id
      );


      return res.status(400).json({

        status: "fail",

        message:
          paystackData.message ||
          "Unable to initialize Paystack payment",
      });
    }


    // -----------------------------------------------
    // Save Paystack reference
    // -----------------------------------------------

    const paystackReference =
      paystackData.data.reference;


    order.paystackReference =
      paystackReference;

    await order.save();


    // -----------------------------------------------
    // Send checkout URL to frontend
    // -----------------------------------------------

    return res.status(200).json({

      status: "success",

      message:
        "Payment initialized successfully",

      data: {

        orderId:
          order._id,

        orderReference,

        reference:
          paystackReference,

        authorization_url:
          paystackData.data.authorization_url,

        access_code:
          paystackData.data.access_code,

        amount:
          total,

        subtotal,

        deliveryFee,

        total,
      },
    });

  } catch (error) {

    console.error(
      "Initialize payment error:",
      error
    );


    return res.status(
      error.statusCode || 500
    ).json({

      status: "fail",

      message:
        error.message ||
        "Failed to initialize payment",
    });
  }
};


// =====================================================
// GET CALLBACK URL
// =====================================================

const getCallbackUrl = () => {

  // Optional override for a custom owner domain.
  // Example:
  // https://example.com/payment-success.html
  if (
    process.env.PAYSTACK_CALLBACK_URL &&
    process.env.PAYSTACK_CALLBACK_URL.trim()
  ) {
    return process.env.PAYSTACK_CALLBACK_URL.trim();
  }


  // Render provides RENDER_EXTERNAL_URL automatically
  // for deployed web services.
  if (
    process.env.RENDER_EXTERNAL_URL &&
    process.env.RENDER_EXTERNAL_URL.trim()
  ) {
    return `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "")}/payment-success.html`;
  }


  // Local development fallback.
  return "http://localhost:5000/payment-success.html";
};


// =====================================================
// VERIFY PAYSTACK PAYMENT
// =====================================================

const verifyPayment = async (
  req,
  res
) => {

  try {

    if (!PAYSTACK_SECRET_KEY) {

      return res.status(500).json({

        status: "fail",

        message:
          "PAYSTACK_SECRET_KEY is not configured on the server.",
      });
    }


    const reference =
      req.params.reference;


    if (!reference) {

      return res.status(400).json({

        status: "fail",

        message:
          "Payment reference is required",
      });
    }


    // -----------------------------------------------
    // Verify transaction with Paystack
    // -----------------------------------------------

    const paystackResponse =
      await fetch(

        `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(
          reference
        )}`,

        {

          method: "GET",

          headers: {

            Authorization:
              `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );


    const paystackData =
      await paystackResponse.json();


    if (
      !paystackResponse.ok ||
      !paystackData.status
    ) {

      return res.status(400).json({

        status: "fail",

        message:
          paystackData.message ||
          "Unable to verify payment",
      });
    }


    const transaction =
      paystackData.data;


    // -----------------------------------------------
    // Payment must actually be successful
    // -----------------------------------------------

    if (
      transaction.status !==
      "success"
    ) {

      return res.status(400).json({

        status: "fail",

        message:
          `Payment status is ${transaction.status}`,

        data: {
          reference,
          paymentStatus:
            transaction.status,
        },
      });
    }


    // -----------------------------------------------
    // Find our order
    // -----------------------------------------------

    const order =
      await Order.findOne({
        paystackReference:
          reference,
      });


    if (!order) {

      return res.status(404).json({

        status: "fail",

        message:
          "Order associated with this payment was not found",
      });
    }


    // -----------------------------------------------
    // Prevent double stock deduction
    // -----------------------------------------------

    if (
      order.paymentStatus ===
      "paid"
    ) {

      return res.status(200).json({

        status: "success",

        message:
          "Payment has already been verified",

        data: {
          order,
        },
      });
    }


    // -----------------------------------------------
    // Verify amount
    // -----------------------------------------------

    const expectedAmount =
      Math.round(
        Number(order.total) *
        100
      );


    const paidAmount =
      Number(
        transaction.amount
      );


    if (
      paidAmount !==
      expectedAmount
    ) {

      return res.status(400).json({

        status: "fail",

        message:
          "Payment amount does not match the order total",

        data: {
          expectedAmount,
          paidAmount,
        },
      });
    }


    // -----------------------------------------------
    // Check stock again before deduction
    // -----------------------------------------------

    for (
      const item of order.items
    ) {

      const product =
        await Product.findById(
          item.productId
        );


      if (!product) {

        return res.status(404).json({

          status: "fail",

          message:
            `Product ${item.name} is no longer available`,
        });
      }


      if (
        Number(product.stock) <
        Number(item.quantity)
      ) {

        return res.status(400).json({

          status: "fail",

          message:
            `${product.name} no longer has enough stock`,
        });
      }
    }


    // -----------------------------------------------
    // Reduce stock AFTER successful payment
    // -----------------------------------------------

    for (
      const item of order.items
    ) {

      await Product.findByIdAndUpdate(

        item.productId,

        {
          $inc: {
            stock:
              -Number(
                item.quantity
              ),
          },
        }
      );
    }


    // -----------------------------------------------
    // Mark order as paid
    // -----------------------------------------------

    order.paymentStatus =
      "paid";

    order.orderStatus =
      "confirmed";

    order.paidAt =
      new Date();


    await order.save();


    return res.status(200).json({

      status: "success",

      message:
        "Payment verified successfully",

      data: {

        order,

        transaction: {
          reference:
            transaction.reference,

          status:
            transaction.status,

          amount:
            transaction.amount,

          currency:
            transaction.currency,
        },
      },
    });

  } catch (error) {

    console.error(
      "Verify payment error:",
      error
    );


    return res.status(500).json({

      status: "fail",

      message:
        "Failed to verify payment",

      error:
        error.message,
    });
  }
};


// =====================================================
// GET ALL ORDERS
// =====================================================

const getOrders = async (
  req,
  res
) => {

  try {

    const orders =
      await Order.find()
        .populate(
          "items.productId"
        )
        .sort({
          createdAt: -1,
        });


    res.status(200).json({

      status: "success",

      results:
        orders.length,

      data: {
        orders,
      },
    });

  } catch (error) {

    console.error(
      "Get orders error:",
      error
    );


    res.status(500).json({

      status: "fail",

      message:
        error.message,
    });
  }
};


// =====================================================
// GET ONE ORDER
// =====================================================

const getOrder = async (
  req,
  res
) => {

  try {

    const order =
      await Order.findById(
        req.params.id
      ).populate(
        "items.productId"
      );


    if (!order) {

      return res.status(404).json({

        status: "fail",

        message:
          "Order not found",
      });
    }


    res.status(200).json({

      status: "success",

      data: {
        order,
      },
    });

  } catch (error) {

    console.error(
      "Get order error:",
      error
    );


    res.status(500).json({

      status: "fail",

      message:
        error.message,
    });
  }
};


// =====================================================
// UPDATE ORDER
// =====================================================

const updateOrder = async (
  req,
  res
) => {

  try {

    const {
      orderStatus,
      paymentStatus,
    } = req.body;


    const updateFields = {};


    if (
      orderStatus !== undefined
    ) {
      updateFields.orderStatus =
        orderStatus;
    }


    if (
      paymentStatus !== undefined
    ) {
      updateFields.paymentStatus =
        paymentStatus;
    }


    if (
      Object.keys(
        updateFields
      ).length === 0
    ) {

      return res.status(400).json({

        status: "fail",

        message:
          "Provide orderStatus or paymentStatus",
      });
    }


    const order =
      await Order.findByIdAndUpdate(

        req.params.id,

        updateFields,

        {
          new: true,
          runValidators: true,
        }
      );


    if (!order) {

      return res.status(404).json({

        status: "fail",

        message:
          "Order not found",
      });
    }


    res.status(200).json({

      status: "success",

      message:
        "Order updated successfully",

      data: {
        order,
      },
    });

  } catch (error) {

    console.error(
      "Update order error:",
      error
    );


    res.status(400).json({

      status: "fail",

      message:
        "Failed to update order",

      error:
        error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  createOrder,

  initializePayment,

  verifyPayment,

  getOrders,

  getOrder,

  updateOrder,
};