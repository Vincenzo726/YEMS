const mongoose = require("mongoose");
const Product = require("../models/productModel");
const cloudinary = require("../config/cloudinary");


// =====================================================
// CLOUDINARY IMAGE UPLOAD
// =====================================================

const uploadImageToCloudinary = (
  buffer
) => {

  return new Promise(
    (resolve, reject) => {

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: "yems/products",
            resource_type: "image",
          },

          (
            error,
            result
          ) => {

            if (error) {
              reject(error);
              return;
            }

            resolve(result);

          }
        );

      uploadStream.end(buffer);

    }
  );

};


// =====================================================
// GET /products
// Public: Get all products
// =====================================================

const getProducts = async (
  req,
  res
) => {

  try {

    const products =
      await Product.find()
        .sort({
          createdAt: -1,
        });


    res.status(200).json({

      success: true,

      count:
        products.length,

      products,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        "Failed to fetch products",

      error:
        error.message,

    });

  }

};


// =====================================================
// GET /products/:id
// Public: Get one product
// =====================================================

const getProductById = async (
  req,
  res
) => {

  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid product ID",

      });

    }


    const product =
      await Product.findById(
        req.params.id
      );


    if (!product) {

      return res.status(404).json({

        success: false,

        message:
          "Product not found",

      });

    }


    res.status(200).json({

      success: true,

      product,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        "Failed to fetch product",

      error:
        error.message,

    });

  }

};


// =====================================================
// POST /admin/products
// Admin: Create product
// =====================================================

const createProduct = async (
  req,
  res
) => {

  try {

    const {
      name,
      description,
      price,
      size,
      ml,
      category,
      stock,
    } = req.body;


    // -----------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------

    if (
      !name ||
      !description ||
      !size ||
      !category
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Please provide all required product fields",

      });

    }


    // -----------------------------------------------
    // NUMBER VALIDATION
    // -----------------------------------------------

    const parsedPrice =
      Number(price);

    const parsedMl =
      Number(ml);

    const parsedStock =
      Number(
        stock ?? 0
      );


    if (
      !Number.isFinite(
        parsedPrice
      ) ||
      parsedPrice < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Price must be a valid non-negative number",

      });

    }


    if (
      !Number.isFinite(
        parsedMl
      ) ||
      parsedMl < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "ML must be a valid non-negative number",

      });

    }


    if (
      !Number.isFinite(
        parsedStock
      ) ||
      parsedStock < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Stock must be a valid non-negative number",

      });

    }


    // -----------------------------------------------
    // IMAGE REQUIRED
    // -----------------------------------------------

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message:
          "Please upload a product image",

      });

    }


    // -----------------------------------------------
    // UPLOAD TO CLOUDINARY
    // -----------------------------------------------

    const uploadedImage =
      await uploadImageToCloudinary(
        req.file.buffer
      );


    if (
      !uploadedImage ||
      !uploadedImage.secure_url
    ) {

      throw new Error(
        "Image upload to Cloudinary failed"
      );

    }


    // -----------------------------------------------
    // CREATE PRODUCT
    // -----------------------------------------------

    const product =
      await Product.create({

        name:
          name.trim(),

        description:
          description.trim(),

        price:
          parsedPrice,

        size:
          size.trim(),

        ml:
          parsedMl,

        category:
          category.trim(),

        stock:
          parsedStock,

        image:
          uploadedImage.secure_url,

      });


    res.status(201).json({

      success: true,

      message:
        "Product created successfully",

      product,

    });

  } catch (error) {

    console.error(
      "Create product error:",
      error
    );


    res.status(400).json({

      success: false,

      message:
        "Failed to create product",

      error:
        error.message,

    });

  }

};


// =====================================================
// PATCH /admin/products/:id
// Admin: Update product
// =====================================================

const updateProduct = async (
  req,
  res
) => {

  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid product ID",

      });

    }


    const product =
      await Product.findById(
        req.params.id
      );


    if (!product) {

      return res.status(404).json({

        success: false,

        message:
          "Product not found",

      });

    }


    const {
      name,
      description,
      price,
      size,
      ml,
      category,
      stock,
    } = req.body;


    // -----------------------------------------------
    // UPDATE TEXT FIELDS
    // -----------------------------------------------

    if (
      name !== undefined
    ) {

      product.name =
        name.trim();

    }


    if (
      description !== undefined
    ) {

      product.description =
        description.trim();

    }


    if (
      size !== undefined
    ) {

      product.size =
        size.trim();

    }


    if (
      category !== undefined
    ) {

      product.category =
        category.trim();

    }


    // -----------------------------------------------
    // UPDATE PRICE
    // -----------------------------------------------

    if (
      price !== undefined
    ) {

      const parsedPrice =
        Number(price);


      if (
        !Number.isFinite(
          parsedPrice
        ) ||
        parsedPrice < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Price must be a valid non-negative number",

        });

      }


      product.price =
        parsedPrice;

    }


    // -----------------------------------------------
    // UPDATE ML
    // -----------------------------------------------

    if (
      ml !== undefined
    ) {

      const parsedMl =
        Number(ml);


      if (
        !Number.isFinite(
          parsedMl
        ) ||
        parsedMl < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "ML must be a valid non-negative number",

        });

      }


      product.ml =
        parsedMl;

    }


    // -----------------------------------------------
    // UPDATE STOCK
    // -----------------------------------------------

    if (
      stock !== undefined
    ) {

      const parsedStock =
        Number(stock);


      if (
        !Number.isFinite(
          parsedStock
        ) ||
        parsedStock < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Stock must be a valid non-negative number",

        });

      }


      product.stock =
        parsedStock;

    }


    // -----------------------------------------------
    // REPLACE IMAGE
    // -----------------------------------------------

    if (req.file) {

      const uploadedImage =
        await uploadImageToCloudinary(
          req.file.buffer
        );


      if (
        !uploadedImage ||
        !uploadedImage.secure_url
      ) {

        throw new Error(
          "Image upload to Cloudinary failed"
        );

      }


      product.image =
        uploadedImage.secure_url;

    }


    // -----------------------------------------------
    // SAVE
    // -----------------------------------------------

    await product.save();


    res.status(200).json({

      success: true,

      message:
        "Product updated successfully",

      product,

    });

  } catch (error) {

    console.error(
      "Update product error:",
      error
    );


    res.status(400).json({

      success: false,

      message:
        "Failed to update product",

      error:
        error.message,

    });

  }

};


// =====================================================
// DELETE /admin/products/:id
// Admin: Delete product
// =====================================================

const deleteProduct = async (
  req,
  res
) => {

  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid product ID",

      });

    }


    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );


    if (!product) {

      return res.status(404).json({

        success: false,

        message:
          "Product not found",

      });

    }


    res.status(200).json({

      success: true,

      message:
        "Product deleted successfully",

    });

  } catch (error) {

    console.error(
      "Delete product error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to delete product",

      error:
        error.message,

    });

  }

};


// =====================================================
// PATCH /admin/products/:id/stock
// Admin: Update stock only
// =====================================================

const updateStock = async (
  req,
  res
) => {

  try {

    const {
      stock
    } = req.body;


    const parsedStock =
      Number(stock);


    if (
      stock === undefined ||
      !Number.isFinite(
        parsedStock
      ) ||
      parsedStock < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Stock must be a valid non-negative number",

      });

    }


    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid product ID",

      });

    }


    const product =
      await Product.findByIdAndUpdate(

        req.params.id,

        {
          stock:
            parsedStock
        },

        {
          new: true,
          runValidators: true,
        }

      );


    if (!product) {

      return res.status(404).json({

        success: false,

        message:
          "Product not found",

      });

    }


    res.status(200).json({

      success: true,

      message:
        "Stock updated successfully",

      product,

    });

  } catch (error) {

    console.error(
      "Update stock error:",
      error
    );


    res.status(400).json({

      success: false,

      message:
        "Failed to update stock",

      error:
        error.message,

    });

  }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  getProducts,

  getProductById,

  createProduct,

  updateProduct,

  deleteProduct,

  updateStock,

};