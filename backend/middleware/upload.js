const multer = require("multer");

/*
  Store uploaded images temporarily in memory.
  The product controller will send the buffer to Cloudinary.
*/

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".jfif",
    ".bmp",
    ".svg",
    ".avif",
  ];


  const originalName =
    file.originalname || "";

  const extension =
    originalName
      .substring(
        originalName.lastIndexOf(".")
      )
      .toLowerCase();


  if (
    allowedExtensions.includes(
      extension
    ) ||
    (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    )
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only image files are allowed"
      ),
      false
    );

  }

};


const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },

});


module.exports = upload;