let editingProductId = null;
let editingDeliveryAreaId = null;


// =====================================================
// NIGERIAN STATES
// =====================================================

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory"
];


// =====================================================
// ELEMENTS
// =====================================================

const authSection =
  document.getElementById("authSection");

const dashboardSection =
  document.getElementById("dashboardSection");

const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");

const productForm =
  document.getElementById("productForm");

const productsList =
  document.getElementById("productsList");

const logoutButton =
  document.getElementById("logoutButton");

const showSignupButton =
  document.getElementById("showSignupButton");

const showLoginButton =
  document.getElementById("showLoginButton");

const refreshProductsButton =
  document.getElementById("refreshProducts");

const cancelEditButton =
  document.getElementById("cancelEditButton");

const loginMessage =
  document.getElementById("loginMessage");

const signupMessage =
  document.getElementById("signupMessage");

const productMessage =
  document.getElementById("productMessage");


// =====================================================
// DELIVERY ELEMENTS
// =====================================================

const deliveryForm =
  document.getElementById("deliveryForm");

const deliveryAreasList =
  document.getElementById(
    "deliveryAreasList"
  );

const refreshDeliveryAreasButton =
  document.getElementById(
    "refreshDeliveryAreas"
  );

const cancelDeliveryEditButton =
  document.getElementById(
    "cancelDeliveryEditButton"
  );

const deliveryMessage =
  document.getElementById(
    "deliveryMessage"
  );

const deliveryState =
  document.getElementById(
    "deliveryState"
  );


// =====================================================
// PAGE STARTUP
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const token =
      localStorage.getItem(
        "yemsAdminToken"
      );

    if (token) {

      showDashboard();

      loadProducts();

      loadDeliveryAreas();

    } else {

      showLogin();

    }

  }
);


// =====================================================
// AUTH SCREEN
// =====================================================

function showLogin() {

  authSection.classList.remove(
    "hidden"
  );

  dashboardSection.classList.add(
    "hidden"
  );

  loginForm.classList.remove(
    "hidden"
  );

  signupForm.classList.add(
    "hidden"
  );
}


function showSignup() {

  loginForm.classList.add(
    "hidden"
  );

  signupForm.classList.remove(
    "hidden"
  );

  clearMessage(
    loginMessage
  );

  clearMessage(
    signupMessage
  );
}


function showDashboard() {

  authSection.classList.add(
    "hidden"
  );

  dashboardSection.classList.remove(
    "hidden"
  );
}


// =====================================================
// AUTH TOGGLE
// =====================================================

if (showSignupButton) {

  showSignupButton.addEventListener(
    "click",
    showSignup
  );

}


if (showLoginButton) {

  showLoginButton.addEventListener(
    "click",
    showLogin
  );

}


// =====================================================
// SIGNUP
// =====================================================

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      clearMessage(
        signupMessage
      );

      const fullName =
        document
          .getElementById(
            "signupFullName"
          )
          .value
          .trim();

      const email =
        document
          .getElementById(
            "signupEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "signupPassword"
          )
          .value;

      try {

        const response =
          await fetch(
            "/auth/signup",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                fullName,
                email,
                password
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          showMessage(
            signupMessage,
            data.message ||
              "Signup failed.",
            "error"
          );

          return;
        }

        showMessage(
          signupMessage,
          "Account created successfully. You can now login.",
          "success"
        );

        signupForm.reset();

        setTimeout(
          showLogin,
          1000
        );

      } catch (error) {

        console.error(
          "Signup error:",
          error
        );

        showMessage(
          signupMessage,
          "Unable to connect to the server.",
          "error"
        );
      }

    }
  );

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      clearMessage(
        loginMessage
      );

      const email =
        document
          .getElementById(
            "loginEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "loginPassword"
          )
          .value;

      try {

        const response =
          await fetch(
            "/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email,
                password
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          showMessage(
            loginMessage,
            data.message ||
              "Login failed.",
            "error"
          );

          return;
        }

        localStorage.setItem(
          "yemsAdminToken",
          data.token
        );

        showMessage(
          loginMessage,
          "Login successful.",
          "success"
        );

        loginForm.reset();

        showDashboard();

        loadProducts();

        loadDeliveryAreas();

      } catch (error) {

        console.error(
          "Login error:",
          error
        );

        showMessage(
          loginMessage,
          "Unable to connect to the server.",
          "error"
        );
      }

    }
  );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "yemsAdminToken"
      );

      editingProductId =
        null;

      editingDeliveryAreaId =
        null;

      resetProductForm();

      resetDeliveryForm();

      showLogin();

    }
  );

}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

  if (!productsList) return;

  productsList.innerHTML = `
    <p class="empty-message">
      Loading products...
    </p>
  `;

  try {

    const response =
      await fetch(
        "/products"
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
          "Unable to fetch products."
      );
    }

    const products =
      Array.isArray(data)
        ? data
        : data.products ||
          data.data ||
          [];

    displayProducts(
      products
    );

  } catch (error) {

    console.error(
      "Load products error:",
      error
    );

    productsList.innerHTML = `
      <p class="empty-message error">
        Unable to load products.
      </p>
    `;
  }
}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================

function displayProducts(
  products
) {

  if (!productsList) return;

  if (!products.length) {

    productsList.innerHTML = `
      <p class="empty-message">
        No products available yet.
      </p>
    `;

    return;
  }

  productsList.innerHTML =
    products
      .map(
        (product) => {

          const stock =
            Number(
              product.stock || 0
            );

          const imageUrl =
            getImageUrl(
              product.image
            );

          return `
            <article class="product-card">

              <div class="product-image-wrapper">

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
                      <div class="no-image">
                        No image
                      </div>
                    `
                }

              </div>


              <div class="product-card-content">

                <div class="product-card-top">

                  <span class="product-category">
                    ${escapeHTML(
                      product.category ||
                        "Product"
                    )}
                  </span>


                  <span
                    class="stock-badge ${
                      stock > 0
                        ? "in-stock"
                        : "out-stock"
                    }"
                  >
                    ${
                      stock > 0
                        ? `${stock} in stock`
                        : "Out of stock"
                    }
                  </span>

                </div>


                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>


                <p class="product-description">
                  ${escapeHTML(
                    product.description ||
                      "No description"
                  )}
                </p>


                <div class="product-details">

                  <strong>
                    ₦${Number(
                      product.price || 0
                    ).toLocaleString()}
                  </strong>


                  <span>
                    ${escapeHTML(
                      product.size || ""
                    )}
                  </span>

                </div>


                <div class="product-actions">

                  <button
                    type="button"
                    class="action-button edit-button"
                    onclick="editProduct('${product._id}')"
                  >
                    Edit
                  </button>


                  <button
                    type="button"
                    class="action-button stock-button"
                    onclick="changeStock('${product._id}')"
                  >
                    Stock
                  </button>


                  <button
                    type="button"
                    class="action-button delete-button"
                    onclick="deleteProduct('${product._id}')"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


// =====================================================
// ADD / UPDATE PRODUCT
// =====================================================

if (productForm) {

  productForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      clearMessage(
        productMessage
      );

      const token =
        localStorage.getItem(
          "yemsAdminToken"
        );

      if (!token) {

        showMessage(
          productMessage,
          "Your admin session has expired. Please login again.",
          "error"
        );

        showLogin();

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "name",
        document
          .getElementById(
            "productName"
          )
          .value
          .trim()
      );

      formData.append(
        "category",
        document
          .getElementById(
            "productCategory"
          )
          .value
      );

      formData.append(
        "price",
        document
          .getElementById(
            "productPrice"
          )
          .value
      );

      formData.append(
        "size",
        document
          .getElementById(
            "productSize"
          )
          .value
          .trim()
      );

      formData.append(
        "ml",
        document
          .getElementById(
            "productMl"
          )
          .value
      );

      formData.append(
        "stock",
        document
          .getElementById(
            "productStock"
          )
          .value
      );

      formData.append(
        "description",
        document
          .getElementById(
            "productDescription"
          )
          .value
          .trim()
      );

      const imageInput =
        document.getElementById(
          "productImage"
        );

      if (
        imageInput &&
        imageInput.files &&
        imageInput.files.length > 0
      ) {

        formData.append(
          "image",
          imageInput.files[0]
        );
      }

      const isEditing =
        Boolean(
          editingProductId
        );

      const url =
        isEditing
          ? `/admin/products/${editingProductId}`
          : "/admin/products";

      const method =
        isEditing
          ? "PATCH"
          : "POST";

      try {

        const response =
          await fetch(
            url,
            {
              method,

              headers: {
                Authorization:
                  `Bearer ${token}`
              },

              body:
                formData
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          showMessage(
            productMessage,
            data.message ||
              "Unable to save product.",
            "error"
          );

          return;
        }

        showMessage(
          productMessage,
          isEditing
            ? "Product updated successfully."
            : "Product added successfully.",
          "success"
        );

        resetProductForm();

        await loadProducts();

      } catch (error) {

        console.error(
          "Save product error:",
          error
        );

        showMessage(
          productMessage,
          "Unable to connect to the server.",
          "error"
        );
      }

    }
  );

}


// =====================================================
// EDIT PRODUCT
// =====================================================

async function editProduct(
  productId
) {

  try {

    const response =
      await fetch(
        `/products/${productId}`
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.message ||
          "Unable to get product."
      );

      return;
    }

    const product =
      data.product ||
      data.data ||
      data;

    editingProductId =
      product._id;

    document.getElementById(
      "productName"
    ).value =
      product.name || "";

    document.getElementById(
      "productCategory"
    ).value =
      product.category || "";

    document.getElementById(
      "productPrice"
    ).value =
      product.price || "";

    document.getElementById(
      "productSize"
    ).value =
      product.size || "";

    document.getElementById(
      "productMl"
    ).value =
      product.ml || "";

    document.getElementById(
      "productStock"
    ).value =
      product.stock ?? 0;

    document.getElementById(
      "productDescription"
    ).value =
      product.description || "";

    document.getElementById(
      "formTitle"
    ).textContent =
      "Edit Product";

    document.getElementById(
      "submitButtonText"
    ).textContent =
      "Update Product";

    cancelEditButton.classList.remove(
      "hidden"
    );

    clearMessage(
      productMessage
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (error) {

    console.error(
      "Edit product error:",
      error
    );

    alert(
      "Unable to connect to the server."
    );
  }

}


// =====================================================
// CANCEL PRODUCT EDIT
// =====================================================

if (cancelEditButton) {

  cancelEditButton.addEventListener(
    "click",
    resetProductForm
  );

}


function resetProductForm() {

  editingProductId =
    null;

  if (productForm) {
    productForm.reset();
  }

  const formTitle =
    document.getElementById(
      "formTitle"
    );

  const submitButtonText =
    document.getElementById(
      "submitButtonText"
    );

  if (formTitle) {

    formTitle.textContent =
      "Add New Product";

  }

  if (submitButtonText) {

    submitButtonText.textContent =
      "Add Product";

  }

  if (cancelEditButton) {

    cancelEditButton.classList.add(
      "hidden"
    );

  }

  clearMessage(
    productMessage
  );

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(
  productId
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this product?"
    );

  if (!confirmed) {
    return;
  }

  const token =
    localStorage.getItem(
      "yemsAdminToken"
    );

  if (!token) {

    showLogin();

    return;
  }

  try {

    const response =
      await fetch(
        `/admin/products/${productId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.message ||
          "Unable to delete product."
      );

      return;
    }

    await loadProducts();

  } catch (error) {

    console.error(
      "Delete product error:",
      error
    );

    alert(
      "Unable to connect to the server."
    );
  }

}


// =====================================================
// UPDATE STOCK
// =====================================================

async function changeStock(
  productId
) {

  const newStock =
    prompt(
      "Enter the new stock quantity:"
    );

  if (newStock === null) {
    return;
  }

  if (
    newStock.trim() === "" ||
    Number.isNaN(
      Number(newStock)
    ) ||
    Number(newStock) < 0
  ) {

    alert(
      "Please enter a valid stock quantity."
    );

    return;
  }

  const token =
    localStorage.getItem(
      "yemsAdminToken"
    );

  if (!token) {

    showLogin();

    return;
  }

  try {

    const response =
      await fetch(
        `/admin/products/${productId}/stock`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              stock:
                Number(newStock)
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.message ||
          "Unable to update stock."
      );

      return;
    }

    await loadProducts();

  } catch (error) {

    console.error(
      "Stock update error:",
      error
    );

    alert(
      "Unable to connect to the server."
    );
  }

}


// =====================================================
// REFRESH PRODUCTS
// =====================================================

if (refreshProductsButton) {

  refreshProductsButton.addEventListener(
    "click",
    loadProducts
  );

}


// =====================================================
// LOAD DELIVERY AREAS
// =====================================================

async function loadDeliveryAreas() {

  if (!deliveryAreasList) {
    return;
  }

  deliveryAreasList.innerHTML = `
    <p class="empty-message">
      Loading delivery areas...
    </p>
  `;

  try {

    const response =
      await fetch(
        "/delivery-areas"
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
          "Unable to fetch delivery areas."
      );

    }

    const areas =
      data.data?.deliveryAreas ||
      data.deliveryAreas ||
      data.data ||
      [];

    displayDeliveryAreas(
      areas
    );

  } catch (error) {

    console.error(
      "Load delivery areas error:",
      error
    );

    deliveryAreasList.innerHTML = `
      <p class="empty-message error">
        Unable to load delivery areas.
      </p>
    `;

  }

}


// =====================================================
// DISPLAY DELIVERY AREAS
// =====================================================

function displayDeliveryAreas(
  areas
) {

  if (!deliveryAreasList) {
    return;
  }

  if (!areas.length) {

    deliveryAreasList.innerHTML = `
      <p class="empty-message">
        No delivery areas have been added yet.
      </p>
    `;

    return;
  }

  deliveryAreasList.innerHTML =
    areas
      .map(
        (area) => {

          return `
            <article class="product-card">

              <div class="product-card-content">

                <div class="product-card-top">

                  <span class="product-category">
                    DELIVERY AREA
                  </span>

                  <span
                    class="stock-badge ${
                      area.active
                        ? "in-stock"
                        : "out-stock"
                    }"
                  >
                    ${
                      area.active
                        ? "Active"
                        : "Inactive"
                    }
                  </span>

                </div>


                <h3>
                  ${escapeHTML(
                    area.name
                  )}
                </h3>


                <p class="product-description">

                  State:
                  ${escapeHTML(
                    area.state ||
                      "State not set"
                  )}

                  <br />

                  Coverage radius:
                  ${Number(
                    area.radiusKm || 0
                  ).toLocaleString()}
                  km

                </p>


                <div class="product-details">

                  <strong>
                    ₦${Number(
                      area.fee || 0
                    ).toLocaleString()}
                  </strong>

                  <span>
                    Delivery fee
                  </span>

                </div>


                <p
                  style="
                    font-size: 11px;
                    color: var(--muted);
                    margin-bottom: 16px;
                    line-height: 1.6;
                  "
                >
                  Coordinates:
                  ${Number(
                    area.latitude || 0
                  ).toFixed(6)},
                  ${Number(
                    area.longitude || 0
                  ).toFixed(6)}
                </p>


                <div class="product-actions">

                  <button
                    type="button"
                    class="action-button edit-button"
                    onclick="editDeliveryArea('${area._id}')"
                  >
                    Edit
                  </button>


                  <button
                    type="button"
                    class="action-button delete-button"
                    onclick="deleteDeliveryArea('${area._id}')"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </article>
          `;

        }
      )
      .join("");

}


// =====================================================
// ADD / UPDATE DELIVERY AREA
// =====================================================

if (deliveryForm) {

  deliveryForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      clearMessage(
        deliveryMessage
      );

      const token =
        localStorage.getItem(
          "yemsAdminToken"
        );

      if (!token) {

        showMessage(
          deliveryMessage,
          "Your admin session has expired. Please login again.",
          "error"
        );

        showLogin();

        return;
      }


      const payload = {

        name:
          document
            .getElementById(
              "deliveryAreaName"
            )
            .value
            .trim(),

        state:
          deliveryState
            ? deliveryState.value
            : "",

        fee:
          Number(
            document
              .getElementById(
                "deliveryFee"
              )
              .value
          ),

        latitude:
          Number(
            document
              .getElementById(
                "deliveryLatitude"
              )
              .value
          ),

        longitude:
          Number(
            document
              .getElementById(
                "deliveryLongitude"
              )
              .value
          ),

        radiusKm:
          Number(
            document
              .getElementById(
                "deliveryRadius"
              )
              .value
          ),

        active:
          document
            .getElementById(
              "deliveryActive"
            )
            .value === "true"

      };


      if (
        !payload.name ||
        !payload.state ||
        !NIGERIAN_STATES.includes(
          payload.state
        ) ||
        Number.isNaN(
          payload.fee
        ) ||
        Number.isNaN(
          payload.latitude
        ) ||
        Number.isNaN(
          payload.longitude
        ) ||
        Number.isNaN(
          payload.radiusKm
        ) ||
        payload.fee < 0 ||
        payload.radiusKm <= 0
      ) {

        showMessage(
          deliveryMessage,
          "Please enter valid delivery area details, including the state.",
          "error"
        );

        return;
      }


      const isEditing =
        Boolean(
          editingDeliveryAreaId
        );


      const url =
        isEditing
          ? `/delivery-areas/${editingDeliveryAreaId}`
          : "/delivery-areas";


      const method =
        isEditing
          ? "PATCH"
          : "POST";


      try {

        const response =
          await fetch(
            url,
            {

              method,

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`

              },

              body:
                JSON.stringify(
                  payload
                )

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          showMessage(
            deliveryMessage,
            data.message ||
              "Unable to save delivery area.",
            "error"
          );

          return;
        }


        showMessage(
          deliveryMessage,
          isEditing
            ? "Delivery area updated successfully."
            : "Delivery area added successfully.",
          "success"
        );


        resetDeliveryForm();


        await loadDeliveryAreas();


      } catch (error) {

        console.error(
          "Save delivery area error:",
          error
        );


        showMessage(
          deliveryMessage,
          "Unable to connect to the server.",
          "error"
        );

      }

    }
  );

}


// =====================================================
// EDIT DELIVERY AREA
// =====================================================

async function editDeliveryArea(
  deliveryAreaId
) {

  try {

    const response =
      await fetch(
        `/delivery-areas/${deliveryAreaId}`
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
          "Unable to get delivery area."
      );

      return;
    }


    const area =
      data.data?.deliveryArea ||
      data.deliveryArea ||
      data.data ||
      data;


    editingDeliveryAreaId =
      area._id;


    document.getElementById(
      "deliveryAreaName"
    ).value =
      area.name || "";


    if (deliveryState) {

      deliveryState.value =
        area.state || "";

    }


    document.getElementById(
      "deliveryFee"
    ).value =
      area.fee ?? "";


    document.getElementById(
      "deliveryLatitude"
    ).value =
      area.latitude ?? "";


    document.getElementById(
      "deliveryLongitude"
    ).value =
      area.longitude ?? "";


    document.getElementById(
      "deliveryRadius"
    ).value =
      area.radiusKm ?? "";


    document.getElementById(
      "deliveryActive"
    ).value =
      area.active
        ? "true"
        : "false";


    document.getElementById(
      "deliveryFormTitle"
    ).textContent =
      "Edit Delivery Area";


    document.getElementById(
      "deliverySubmitText"
    ).textContent =
      "Update Delivery Area";


    cancelDeliveryEditButton.classList.remove(
      "hidden"
    );


    clearMessage(
      deliveryMessage
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (error) {

    console.error(
      "Edit delivery area error:",
      error
    );


    alert(
      "Unable to connect to the server."
    );

  }

}


// =====================================================
// CANCEL DELIVERY EDIT
// =====================================================

if (cancelDeliveryEditButton) {

  cancelDeliveryEditButton.addEventListener(
    "click",
    resetDeliveryForm
  );

}


function resetDeliveryForm() {

  editingDeliveryAreaId =
    null;


  if (deliveryForm) {

    deliveryForm.reset();

  }


  const title =
    document.getElementById(
      "deliveryFormTitle"
    );


  const submitText =
    document.getElementById(
      "deliverySubmitText"
    );


  if (title) {

    title.textContent =
      "Add Delivery Area";

  }


  if (submitText) {

    submitText.textContent =
      "Add Delivery Area";

  }


  if (
    cancelDeliveryEditButton
  ) {

    cancelDeliveryEditButton.classList.add(
      "hidden"
    );

  }


  clearMessage(
    deliveryMessage
  );

}


// =====================================================
// DELETE DELIVERY AREA
// =====================================================

async function deleteDeliveryArea(
  deliveryAreaId
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this delivery area?"
    );


  if (!confirmed) {
    return;
  }


  const token =
    localStorage.getItem(
      "yemsAdminToken"
    );


  if (!token) {

    showLogin();

    return;
  }


  try {

    const response =
      await fetch(
        `/delivery-areas/${deliveryAreaId}`,
        {

          method: "DELETE",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.message ||
          "Unable to delete delivery area."
      );

      return;
    }


    await loadDeliveryAreas();


  } catch (error) {

    console.error(
      "Delete delivery area error:",
      error
    );


    alert(
      "Unable to connect to the server."
    );

  }

}


// =====================================================
// REFRESH DELIVERY AREAS
// =====================================================

if (
  refreshDeliveryAreasButton
) {

  refreshDeliveryAreasButton.addEventListener(
    "click",
    loadDeliveryAreas
  );

}


// =====================================================
// IMAGE URL
// =====================================================

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


// =====================================================
// MESSAGE HELPERS
// =====================================================

function showMessage(
  element,
  message,
  type
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    `form-message ${type}`;

}


function clearMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.className =
    "form-message";

}


// =====================================================
// HTML ESCAPE
// =====================================================

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