const crypto = require("crypto");

const Order =
  require("../models/orderModel");

const Product =
  require("../models/productModel");


/* =====================================================
   CONFIG
===================================================== */

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY;

const PAYSTACK_API_URL =
  "https://api.paystack.co";


/* =====================================================
   ORDER REFERENCE
===================================================== */

function generateOrderReference() {

  const date =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");


  const randomPart =
    crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();


  return `YEMS-${date}-${randomPart}`;

}


/* =====================================================
   BUILD ORDER DATA
===================================================== */

async function buildOrderData({

  customer,

  items,

  paymentMethod =
    "paystack",

  deliveryMethod =
    "delivery"

}) {

  /* -----------------------------------------------
     CUSTOMER
  ----------------------------------------------- */

  if (

    !customer ||

    !customer.fullName ||

    !customer.email ||

    !customer.phone ||

    !customer.address ||

    !customer.city ||

    !customer.state

  ) {

    const error =
      new Error(
        "Please provide all required customer details."
      );

    error.statusCode =
      400;

    throw error;

  }


  /* -----------------------------------------------
     CART
  ----------------------------------------------- */

  if (

    !Array.isArray(items) ||

    items.length === 0

  ) {

    const error =
      new Error(
        "Your cart is empty."
      );

    error.statusCode =
      400;

    throw error;

  }


  /* -----------------------------------------------
     PAYMENT METHOD
  ----------------------------------------------- */

  if (
    paymentMethod !==
    "paystack"
  ) {

    const error =
      new Error(
        "Invalid payment method."
      );

    error.statusCode =
      400;

    throw error;

  }


  /* -----------------------------------------------
     DELIVERY METHOD
  ----------------------------------------------- */

  if (
    ![
      "delivery",
      "pickup"
    ].includes(
      deliveryMethod
    )
  ) {

    const error =
      new Error(
        "Invalid delivery method."
      );

    error.statusCode =
      400;

    throw error;

  }


  let subtotal =
    0;

  const orderItems =
    [];


  /* -----------------------------------------------
     PRODUCTS
  ----------------------------------------------- */

  for (
    const item of items
  ) {

    if (

      !item.productId ||

      !Number.isInteger(
        Number(
          item.quantity
        )
      )

    ) {

      const error =
        new Error(
          "Invalid product information."
        );

      error.statusCode =
        400;

      throw error;

    }


    const quantity =
      Number(
        item.quantity
      );


    if (
      quantity < 1
    ) {

      const error =
        new Error(
          "Product quantity must be at least 1."
        );

      error.statusCode =
        400;

      throw error;

    }


    const product =
      await Product.findById(
        item.productId
      );


    if (!product) {

      const error =
        new Error(
          `Product not found: ${item.productId}`
        );

      error.statusCode =
        404;

      throw error;

    }


    if (
      Number(
        product.stock
      ) < quantity
    ) {

      const error =
        new Error(
          `${product.name} does not have enough stock.`
        );

      error.statusCode =
        400;

      throw error;

    }


    const itemTotal =
      Number(
        product.price
      ) *
      quantity;


    subtotal +=
      itemTotal;


    orderItems.push({

      productId:
        product._id,

      name:
        product.name,

      quantity,

      price:
        product.price,

      size:
        product.size,

      ml:
        product.ml,

      image:
        product.image

    });

  }


  /*
    IMPORTANT:

    Delivery is NOT charged through Paystack.

    The customer pays for the products only.

    Delivery arrangements and delivery fee are
    discussed with the YEMS owner on WhatsApp
    after payment verification.
  */

  const deliveryFee =
    0;


  const total =
    subtotal;


  return {

    orderItems,

    subtotal,

    deliveryFee,

    total

  };

}


/* =====================================================
   CREATE ORDER
===================================================== */

async function createOrder(
  req,
  res
) {

  try {

    const {

      customer,

      items,

      paymentMethod =
        "paystack",

      deliveryMethod =
        "delivery"

    } = req.body;


    const {

      orderItems,

      subtotal,

      deliveryFee,

      total

    } =
      await buildOrderData({

        customer,

        items,

        paymentMethod,

        deliveryMethod

      });


    const order =
      await Order.create({

        orderReference:
          generateOrderReference(),


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
            ""

        },


        deliveryMethod,


        deliveryFee,


        deliveryArea:
          null,


        deliveryLocation:
          null,


        items:
          orderItems,


        subtotal,


        total,


        paymentMethod,


        paymentStatus:
          "pending",


        orderStatus:
          "pending"

      });


    return res.status(
      201
    ).json({

      status:
        "success",

      message:
        "Order created successfully.",

      data: {

        order

      }

    });


  } catch (
    error
  ) {

    console.error(
      "Create order error:",
      error
    );


    return res.status(
      error.statusCode ||
      500
    ).json({

      status:
        "fail",

      message:
        error.message ||
        "Failed to create order."

    });

  }

}


/* =====================================================
   INITIALIZE PAYMENT
===================================================== */

async function initializePayment(
  req,
  res
) {

  try {

    if (
      !PAYSTACK_SECRET_KEY
    ) {

      return res.status(
        500
      ).json({

        status:
          "fail",

        message:
          "PAYSTACK_SECRET_KEY is not configured on the server."

      });

    }


    const {

      customer,

      items,

      paymentMethod =
        "paystack",

      deliveryMethod =
        "delivery"

    } = req.body;


    const {

      orderItems,

      subtotal,

      deliveryFee,

      total

    } =
      await buildOrderData({

        customer,

        items,

        paymentMethod,

        deliveryMethod

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
            ""

        },


        deliveryMethod,


        deliveryArea:
          null,


        deliveryLocation:
          null,


        items:
          orderItems,


        subtotal,


        deliveryFee,


        total,


        paymentMethod,


        paymentStatus:
          "pending",


        orderStatus:
          "pending"

      });


    /*
      Paystack expects the amount
      in the smallest currency unit.

      We are charging ONLY the
      product subtotal.
    */

    const amountInKobo =
      Math.round(
        total * 100
      );


    const paystackResponse =
      await fetch(

        `${PAYSTACK_API_URL}/transaction/initialize`,

        {

          method:
            "POST",

          headers: {

            Authorization:
              `Bearer ${PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json"

          },


          body:
            JSON.stringify({

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

                deliveryMethod

              },


              channels: [

                "card",

                "bank",

                "ussd",

                "bank_transfer"

              ]

            })

        }

      );


    const paystackData =
      await paystackResponse.json();


    if (

      !paystackResponse.ok ||

      !paystackData.status

    ) {

      await Order.findByIdAndDelete(
        order._id
      );


      return res.status(
        400
      ).json({

        status:
          "fail",

        message:
          paystackData.message ||
          "Unable to initialize Paystack payment."

      });

    }


    order.paystackReference =
      paystackData.data.reference;


    await order.save();


    return res.status(
      200
    ).json({

      status:
        "success",

      message:
        "Payment initialized successfully.",

      data: {

        orderId:
          order._id,

        orderReference,

        reference:
          paystackData.data.reference,

        authorization_url:
          paystackData.data.authorization_url,

        access_code:
          paystackData.data.access_code,

        amount:
          total,

        subtotal,

        deliveryFee,

        total

      }

    });


  } catch (
    error
  ) {

    console.error(
      "Initialize payment error:",
      error
    );


    return res.status(
      error.statusCode ||
      500
    ).json({

      status:
        "fail",

      message:
        error.message ||
        "Failed to initialize payment."

    });

  }

}


/* =====================================================
   CALLBACK URL
===================================================== */

function getCallbackUrl() {

  if (
    process.env.PAYSTACK_CALLBACK_URL
  ) {

    return (
      process.env
        .PAYSTACK_CALLBACK_URL
    );

  }


  return (
    "http://localhost:5000/payment-success.html"
  );

}


/* =====================================================
   VERIFY PAYMENT
===================================================== */

async function verifyPayment(
  req,
  res
) {

  try {

    if (
      !PAYSTACK_SECRET_KEY
    ) {

      return res.status(
        500
      ).json({

        status:
          "fail",

        message:
          "PAYSTACK_SECRET_KEY is not configured on the server."

      });

    }


    const reference =
      String(
        req.params.reference ||
        ""
      ).trim();


    if (!reference) {

      return res.status(
        400
      ).json({

        status:
          "fail",

        message:
          "Payment reference is required."

      });

    }


    const order =
      await Order.findOne({

        $or: [

          {
            paystackReference:
              reference
          },

          {
            orderReference:
              reference
          }

        ]

      });


    if (!order) {

      return res.status(
        404
      ).json({

        status:
          "fail",

        message:
          "Order associated with this payment was not found."

      });

    }


    /*
      Idempotency:

      Refreshing the success page must
      not reduce stock again.
    */

    if (
      order.paymentStatus ===
      "paid"
    ) {

      return res.status(
        200
      ).json({

        status:
          "success",

        message:
          "Payment already verified.",

        data: {

          order:
            await Order.findById(
              order._id
            )

        }

      });

    }


    /* -----------------------------------------------
       VERIFY WITH PAYSTACK
    ----------------------------------------------- */

    const paystackResponse =
      await fetch(

        `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(
          reference
        )}`,

        {

          method:
            "GET",

          headers: {

            Authorization:
              `Bearer ${PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json"

          }

        }

      );


    const paystackData =
      await paystackResponse.json();


    if (

      !paystackResponse.ok ||

      !paystackData.status ||

      !paystackData.data

    ) {

      return res.status(
        400
      ).json({

        status:
          "fail",

        message:
          paystackData.message ||
          "Unable to verify payment."

      });

    }


    const transaction =
      paystackData.data;


    /*
      Paystack says the transaction
      must actually be successful.
    */

    if (
      transaction.status !==
      "success"
    ) {

      order.paymentStatus =
        "failed";


      await order.save();


      return res.status(
        400
      ).json({

        status:
          "fail",

        message:
          `Payment status is ${transaction.status}.`

      });

    }


    /* -----------------------------------------------
       AMOUNT CHECK
    ----------------------------------------------- */

    const expectedAmount =
      Math.round(
        Number(
          order.total
        ) * 100
      );


    if (
      Number(
        transaction.amount
      ) !==
      expectedAmount
    ) {

      return res.status(
        400
      ).json({

        status:
          "fail",

        message:
          "Payment amount does not match the order amount."

      });

    }


    /* -----------------------------------------------
       CHECK STOCK AGAIN
    ----------------------------------------------- */

    for (
      const item of order.items
    ) {

      const product =
        await Product.findById(
          item.productId
        );


      if (

        !product ||

        Number(
          product.stock
        ) <
        Number(
          item.quantity
        )

      ) {

        return res.status(
          400
        ).json({

          status:
            "fail",

          message:
            `${item.name} is no longer available in the requested quantity.`

        });

      }

    }


    /* -----------------------------------------------
       REDUCE STOCK
    ----------------------------------------------- */

    for (
      const item of order.items
    ) {

      const updatedProduct =
        await Product.findOneAndUpdate(

          {

            _id:
              item.productId,

            stock: {

              $gte:
                Number(
                  item.quantity
                )

            }

          },


          {

            $inc: {

              stock:
                -Number(
                  item.quantity
                )

            }

          },


          {

            new:
              true

          }

        );


      if (!updatedProduct) {

        return res.status(
          409
        ).json({

          status:
            "fail",

          message:
            `${item.name} could not be reserved. Please contact YEMS PERFUME.`

        });

      }

    }


    /* -----------------------------------------------
       MARK ORDER PAID
    ----------------------------------------------- */

    order.paymentStatus =
      "paid";


    order.paystackReference =
      transaction.reference;


    order.paidAt =
      transaction.paid_at
        ? new Date(
            transaction.paid_at
          )
        : new Date();


    order.orderStatus =
      "confirmed";


    await order.save();


    return res.status(
      200
    ).json({

      status:
        "success",

      message:
        "Payment verified successfully.",

      data: {

        order:
          await Order.findById(
            order._id
          )

      }

    });


  } catch (
    error
  ) {

    console.error(
      "Verify payment error:",
      error
    );


    return res.status(
      500
    ).json({

      status:
        "fail",

      message:
        error.message ||
        "Failed to verify payment."

    });

  }

}


/* =====================================================
   GET ORDERS
===================================================== */

async function getOrders(
  req,
  res
) {

  try {

    const orders =
      await Order.find()

        .populate(
          "items.productId"
        )

        .populate(
          "deliveryArea.areaId"
        )

        .sort({
          createdAt:
            -1
        });


    return res.status(
      200
    ).json({

      status:
        "success",

      results:
        orders.length,

      data: {

        orders

      }

    });

  } catch (
    error
  ) {

    console.error(
      "Get orders error:",
      error
    );


    return res.status(
      500
    ).json({

      status:
        "fail",

      message:
        "Unable to load orders."

    });

  }

}


/* =====================================================
   GET ONE ORDER
===================================================== */

async function getOrder(
  req,
  res
) {

  try {

    const order =
      await Order.findById(
        req.params.id
      )

        .populate(
          "items.productId"
        )

        .populate(
          "deliveryArea.areaId"
        );


    if (!order) {

      return res.status(
        404
      ).json({

        status:
          "fail",

        message:
          "Order not found."

      });

    }


    return res.status(
      200
    ).json({

      status:
        "success",

      data: {

        order

      }

    });

  } catch (
    error
  ) {

    console.error(
      "Get order error:",
      error
    );


    return res.status(
      500
    ).json({

      status:
        "fail",

      message:
        "Unable to load order."

    });

  }

}


/* =====================================================
   UPDATE ORDER
===================================================== */

async function updateOrder(
  req,
  res
) {

  try {

    const allowedFields =
      [
        "orderStatus"
      ];


    const updates = {};


    allowedFields.forEach(
      (field) => {

        if (
          req.body[field] !==
          undefined
        ) {

          updates[field] =
            req.body[field];

        }

      }
    );


    const order =
      await Order.findByIdAndUpdate(

        req.params.id,

        updates,

        {

          new:
            true,

          runValidators:
            true

        }

      );


    if (!order) {

      return res.status(
        404
      ).json({

        status:
          "fail",

        message:
          "Order not found."

      });

    }


    return res.status(
      200
    ).json({

      status:
        "success",

      message:
        "Order updated successfully.",

      data: {

        order

      }

    });

  } catch (
    error
  ) {

    console.error(
      "Update order error:",
      error
    );


    return res.status(
      500
    ).json({

      status:
        "fail",

      message:
        error.message ||
        "Unable to update order."

    });

  }

}


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {

  createOrder,

  initializePayment,

  verifyPayment,

  getOrders,

  getOrder,

  updateOrder

};