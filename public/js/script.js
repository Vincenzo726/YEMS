/* =====================================================
   YEMS PERFUME — HOMEPAGE SCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ===================================================
     ELEMENTS
  ==================================================== */

  const nav =
    document.getElementById("nav");

  const menuBtn =
    document.getElementById("menuBtn");

  const cartCount =
    document.getElementById("cartCount");

  const featuredProducts =
    document.getElementById(
      "featuredProducts"
    );

  const themeToggle =
    document.getElementById(
      "themeToggle"
    );


  /* ===================================================
     MOBILE NAVIGATION
  ==================================================== */

  if (menuBtn && nav) {

    menuBtn.addEventListener(
      "click",
      () => {

        const isOpen =
          nav.classList.toggle(
            "open"
          );

        menuBtn.classList.toggle(
          "open",
          isOpen
        );

        menuBtn.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

      }
    );


    nav.querySelectorAll("a").forEach(
      (link) => {

        link.addEventListener(
          "click",
          () => {

            nav.classList.remove(
              "open"
            );

            menuBtn.classList.remove(
              "open"
            );

            menuBtn.setAttribute(
              "aria-expanded",
              "false"
            );

          }
        );

      }
    );

  }


  /* ===================================================
     REVEAL ANIMATION
  ==================================================== */

  function showAllRevealElements() {

    document
      .querySelectorAll(".reveal")
      .forEach(
        (element) => {

          element.classList.add(
            "show"
          );

        }
      );

  }


  if (
    "IntersectionObserver"
    in window
  ) {

    const revealObserver =
      new IntersectionObserver(
        (
          entries,
          observer
        ) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  "show"
                );

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.08,
        }
      );


    document
      .querySelectorAll(".reveal")
      .forEach(
        (element) => {

          revealObserver.observe(
            element
          );

        }
      );

  } else {

    showAllRevealElements();

  }


  /* ===================================================
     CART
  ==================================================== */

  function readCart() {

    try {

      const savedCart =
        JSON.parse(
          localStorage.getItem(
            "yemsCart"
          )
        );

      return Array.isArray(
        savedCart
      )
        ? savedCart
        : [];

    } catch (error) {

      console.error(
        "Unable to read YEMS cart:",
        error
      );

      return [];

    }

  }


  function updateCartCount() {

    const cart =
      readCart();


    const totalQuantity =
      cart.reduce(
        (
          total,
          item
        ) => {

          return (
            total +
            Number(
              item.quantity || 0
            )
          );

        },
        0
      );


    if (cartCount) {

      cartCount.textContent =
        totalQuantity;

    }

  }


  /* ===================================================
     ADD TO CART
  ==================================================== */

  function addToCart(
    product
  ) {

    const cart =
      readCart();


    const existingProduct =
      cart.find(
        (item) =>
          String(
            item.productId
          ) ===
          String(
            product._id
          )
      );


    if (existingProduct) {

      existingProduct.quantity =
        Number(
          existingProduct.quantity || 0
        ) + 1;

    } else {

      cart.push({

        productId:
          product._id,

        name:
          product.name,

        description:
          product.description || "",

        price:
          Number(
            product.price || 0
          ),

        image:
          product.image || "",

        size:
          product.size || "",

        ml:
          product.ml || 0,

        category:
          product.category || "",

        quantity:
          1,

      });

    }


    localStorage.setItem(
      "yemsCart",
      JSON.stringify(cart)
    );


    updateCartCount();


    showToast(
      `${product.name} added to cart`
    );

  }


  /* ===================================================
     TOAST
  ==================================================== */

  function showToast(
    message
  ) {

    const oldToast =
      document.querySelector(
        ".toast"
      );


    if (oldToast) {

      oldToast.remove();

    }


    const toast =
      document.createElement(
        "div"
      );


    toast.className =
      "toast";


    toast.textContent =
      message;


    document.body.appendChild(
      toast
    );


    setTimeout(
      () => {

        toast.classList.add(
          "hide"
        );


        setTimeout(
          () => {

            toast.remove();

          },
          350
        );

      },
      2500
    );

  }


  /* ===================================================
     IMAGE URL
  ==================================================== */

  function getImagePath(
    image
  ) {

    if (!image) {

      return "/images/yems-logo.png";

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
        "/"
      )
    ) {

      return image;

    }


    return `/uploads/${image}`;

  }


  /* ===================================================
     HTML ESCAPE
  ==================================================== */

  function escapeHTML(
    value
  ) {

    return String(
      value ?? ""
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


  /* ===================================================
     LOAD HOMEPAGE PRODUCTS
  ==================================================== */

  async function loadHomepageProducts() {

    if (!featuredProducts) {

      return;

    }


    featuredProducts.innerHTML = `
      <p class="products-loading">
        Loading fragrances...
      </p>
    `;


    try {

      /*
        IMPORTANT:
        Your Express server mounts productRoutes at:

        /products

        NOT:

        /api/products
      */

      const response =
        await fetch(
          "/products"
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to load products."
        );

      }


      /*
        Support the response shapes
        your backend may return.
      */

      let products = [];


      if (
        Array.isArray(
          result
        )
      ) {

        products =
          result;

      } else if (
        Array.isArray(
          result.products
        )
      ) {

        products =
          result.products;

      } else if (
        Array.isArray(
          result.data?.products
        )
      ) {

        products =
          result.data.products;

      } else if (
        Array.isArray(
          result.data
        )
      ) {

        products =
          result.data;

      }


      /*
        Only show products that actually
        have stock available.
      */

      products =
        products.filter(
          (product) =>
            product &&
            Number(
              product.stock || 0
            ) > 0
        );


      if (!products.length) {

        featuredProducts.innerHTML = `
          <div class="products-empty-state">

            <p class="products-loading">
              No fragrances are currently available.
            </p>

            <a
              href="shop.html"
              class="outline-link"
            >
              <span>
                Visit the shop
              </span>

              <span>
                ↗
              </span>
            </a>

          </div>
        `;

        return;

      }


      /*
        Show first four products.
      */

      const featured =
        products.slice(
          0,
          4
        );


      featuredProducts.innerHTML =
        featured
          .map(
            (product) => {

              const image =
                getImagePath(
                  product.image
                );


              const name =
                escapeHTML(
                  product.name
                );


              const category =
                escapeHTML(
                  product.category ||
                  "Fragrance"
                );


              const description =
                escapeHTML(
                  product.description ||
                  ""
                );


              const size =
                escapeHTML(
                  product.size ||
                  ""
                );


              const ml =
                product.ml
                  ? `${Number(
                      product.ml
                    )}ml`
                  : "";


              const price =
                Number(
                  product.price || 0
                ).toLocaleString();


              return `
                <article
                  class="product-card reveal show"
                >

                  <div
                    class="product-image"
                  >

                    <span
                      class="product-badge"
                    >
                      Available
                    </span>


                    <button
                      class="wishlist-btn"
                      type="button"
                      aria-label="Add ${name} to wishlist"
                    >
                      ♡
                    </button>


                    <img
                      src="${image}"
                      alt="${name}"
                      loading="lazy"
                    />


                    <button
                      class="quick-add"
                      type="button"
                      data-product-id="${product._id}"
                    >

                      <span>
                        Add to cart
                      </span>

                      <span>
                        +
                      </span>

                    </button>

                  </div>


                  <div
                    class="product-info"
                  >

                    <p
                      class="product-category"
                    >
                      ${category}
                    </p>


                    <h3>
                      ${name}
                    </h3>


                    ${
                      description
                        ? `
                          <p
                            class="homepage-product-description"
                          >
                            ${description}
                          </p>
                        `
                        : ""
                    }


                    <div
                      class="product-bottom"
                    >

                      <span>
                        ₦${price}
                      </span>


                      <span
                        class="product-size"
                      >
                        ${
                          size ||
                          ml
                            ? `${size}${
                                size && ml
                                  ? " · "
                                  : ""
                              }${ml}`
                            : ""
                        }
                      </span>


                      <span
                        class="product-arrow"
                      >
                        ↗
                      </span>

                    </div>

                  </div>

                </article>
              `;

            }
          )
          .join("");


      /* ================================================
         QUICK ADD
      ================================================= */

      featuredProducts
        .querySelectorAll(
          ".quick-add"
        )
        .forEach(
          (button) => {

            button.addEventListener(
              "click",
              (event) => {

                event.preventDefault();
                event.stopPropagation();


                const productId =
                  button.dataset.productId;


                const selectedProduct =
                  featured.find(
                    (product) =>
                      String(
                        product._id
                      ) ===
                      String(
                        productId
                      )
                  );


                if (
                  selectedProduct
                ) {

                  addToCart(
                    selectedProduct
                  );

                }

              }
            );

          }
        );


      /* ================================================
         WISHLIST
      ================================================= */

      featuredProducts
        .querySelectorAll(
          ".wishlist-btn"
        )
        .forEach(
          (
            button
          ) => {

            button.addEventListener(
              "click",
              (event) => {

                event.preventDefault();
                event.stopPropagation();


                button.classList.toggle(
                  "liked"
                );


                button.textContent =
                  button.classList.contains(
                    "liked"
                  )
                    ? "♥"
                    : "♡";

              }
            );

          }
        );


    } catch (
      error
    ) {

      console.error(
        "Homepage product error:",
        error
      );


      featuredProducts.innerHTML = `
        <div class="products-error-state">

          <p class="products-loading">
            We couldn't load the fragrances right now.
          </p>

          <a
            href="shop.html"
            class="outline-link"
          >
            <span>
              Open shop
            </span>

            <span>
              ↗
            </span>
          </a>

        </div>
      `;

    }

  }


  /* ===================================================
     THEME
  ==================================================== */

  function applySavedTheme() {

    const savedTheme =
      localStorage.getItem(
        "yemsTheme"
      );


    if (
      savedTheme === "dark"
    ) {

      document.body.classList.add(
        "dark-theme"
      );


      if (themeToggle) {

        themeToggle.setAttribute(
          "aria-pressed",
          "true"
        );

      }

    } else {

      document.body.classList.remove(
        "dark-theme"
      );


      if (themeToggle) {

        themeToggle.setAttribute(
          "aria-pressed",
          "false"
        );

      }

    }

  }


  applySavedTheme();


  if (themeToggle) {

    themeToggle.addEventListener(
      "click",
      () => {

        const isDark =
          document.body.classList.toggle(
            "dark-theme"
          );


        localStorage.setItem(
          "yemsTheme",
          isDark
            ? "dark"
            : "light"
        );


        themeToggle.setAttribute(
          "aria-pressed",
          String(isDark)
        );

      }
    );

  }


  /* ===================================================
     START
  ==================================================== */

  updateCartCount();

  loadHomepageProducts();

});