

/* 
   1. INSTÄLLNINGAR OCH STATE
    */

const API_URL = "http://127.0.0.1:3000/api";

let allProducts = [];     
let favoriteItems = [];    
let cartItems = [];        
let currentUser = null;   


/* 
   2. PRODUKTER
    */

// ---------- Produktpanel (detaljer) ----------

const productPanel = document.querySelector("#product-panel");
const productDetails = document.querySelector("#product-details");
const closeProductPanel = document.querySelector("#close-product-panel");

closeProductPanel.addEventListener("click", function () {
    productPanel.classList.remove("open");
});


// ---------- Rita produktkorten ----------

function displayProducts(products) {

    const productList = document.querySelector("#product-list");

    if (products.length === 0) {
    productList.innerHTML = "<p>No bags found. Try a different search or filter.</p>";
    return;
    }

    productList.innerHTML = "";

    products.forEach(product => {

        const productCard = document.createElement("article");
        productCard.dataset.productId = product.id;

        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">

                <button type="button"
                        class="favorite-button"
                        aria-label="Add to favorites">
                    ♡
                </button>
            </div>

            <h3>${product.name}</h3>
            <p>${product.price} EUR</p>

            <button type="button" class="add-to-cart">
                Add to bag
            </button>
        `;


        // OPEN PRODUCT DETAILS
        productCard.addEventListener("click", function () {

            productDetails.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p>Price: ${product.price} EUR</p>
                <p>Brand: ${product.brand}</p>
                <p>Condition: ${product.item_condition}</p>
                <p>Color: ${product.color}</p>
                <p>Category: ${product.category}</p>
                <p>${product.description}</p>
            `;

            productPanel.classList.add("open");
        });
        productList.appendChild(productCard);


        // ADD TO BAG
        const addButton = productCard.querySelector(".add-to-cart");

        addButton.addEventListener("click", function (event) {

            event.stopPropagation();

            addToCart(product);
        });


        // FAVORITES
        const favoriteButton = productCard.querySelector(".favorite-button");


        // CHECK IF PRODUCT IS ALREADY A FAVORITE
        const isFavorite = favoriteItems.some(
            item => item.id === product.id
        );

        if (isFavorite) {

            favoriteButton.classList.add("liked");
            favoriteButton.textContent = "♥";

        } else {

            favoriteButton.classList.remove("liked");
            favoriteButton.textContent = "♡";
        }


        // ADD OR REMOVE FAVORITE
        favoriteButton.addEventListener("click", async function (event) {

            event.stopPropagation();

            if (!currentUser) {

                alert("Please login to add favorites.");

                document.querySelector("#login-panel")
                    .classList.add("open");

                return;
            }


            const alreadyFavorite = favoriteItems.some(
                item => item.id === product.id
            );


            // REMOVE FAVORITE
            if (alreadyFavorite) {

                try {

                    const response = await fetch(
                        `${API_URL}/favorites/${product.id}`,
                        {
                            method: "DELETE",
                            credentials: "include"
                        }
                    );


                    if (response.ok) {

                        favoriteButton.classList.remove("liked");
                        favoriteButton.textContent = "♡";

                        renderFavorites();
                    }

                } catch (error) {

                    console.error(
                        "Could not remove favorite:",
                        error
                    );
                }


            // ADD FAVORITE
            } else {

                try {

                    const response = await fetch(
                        `${API_URL}/favorites`,
                        {
                            method: "POST",
                            credentials: "include",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                product_id: product.id
                            })
                        }
                    );


                    if (response.ok) {

                        favoriteItems.push(product);

                        favoriteButton.classList.add("liked");
                        favoriteButton.textContent = "♥";

                        renderFavorites();
                    }

                } catch (error) {

                    console.error(
                        "Could not add favorite:",
                        error
                    );
                }
            }
        });
    });
}


// ---------- Hämta produkter från databasen ----------

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        allProducts = products;

        // Create the product cards
        displayProducts(allProducts);

        // Create the filter options from the data
        createFilterOptions(
            allProducts,
            "brand",
            "#brand-options",
            "brand-option"
        );

        createFilterOptions(
            allProducts,
            "color",
            "#color-options",
            "color-option"
        );

        createFilterOptions(
            allProducts,
            "item_condition",
            "#condition-options",
            "condition-option"
        );

        createFilterOptions(
            allProducts,
            "category",
            "#type-options",
            "type-option"
        );

    } catch (error) {
        console.log("Could not load products:", error);
    }
}


/* 
   3. FILTER, KATEGORIER OCH SÖK
    */

// ---------- Kategorilänkar ----------

const categoryLinks = document.querySelectorAll(".categories a");

categoryLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const category = link.getAttribute("href").replace("#", "");
        const productsSection = document.querySelector("#all-bags");
        const productsTitle = productsSection.querySelector("h2");

        categoryLinks.forEach(link => {
            link.classList.remove("active");
        });

        link.classList.add("active");

        if (category === "all-bags") {
            displayProducts(allProducts);
            productsTitle.textContent = "All Bags";

            document.body.classList.remove("category-view"); 

        } else {
            const filteredProducts = allProducts.filter(product => {
                return product.category === category;
            });

            displayProducts(filteredProducts);
            productsTitle.textContent = link.textContent;

            document.body.classList.add("category-view");
        }

        productsSection.scrollIntoView({
            behavior: "smooth"
        });
    });
});


// ---------- Filterpanel ----------

const priceFilter = document.querySelector("#price-filter");
const priceValue = document.querySelector("#price-value");
const filterButton = document.querySelector("#filter-button");
const filterPanel = document.querySelector("#filter-panel");
const applyFiltersButton = document.querySelector("#apply-filters");
const resetFiltersButton = document.querySelector("#reset-filters");

// Skapar kryssrutor av unika värden (t.ex. alla märken) i produktlistan
function createFilterOptions(products, property, containerId, className) { //alla produkter, vilken egenskap, var som ska skapas, vilken klass ska kryssrutorna ha
    const container = document.querySelector(containerId);
    container.innerHTML = "";

    const options = [...new Set(
        products.map(product => product[property]) //plockar ut alla värden för den egenskapen (t.ex. alla märken) och tar bort dubbletter med Set
    )];

    options.forEach(option => { 
        const label = document.createElement("label");
        label.innerHTML = `
        <input
        type="checkbox"
        value="${option}"
        class="${className}"> 
        ${option}`;
        container.appendChild(label); 
    });
}

// Returnerar de produkter som matchar alla valda filter
function filterProducts(products, filters) {
    return products.filter(product => {

        // Price
        if (product.price > filters.maxPrice) {
            return false;
        }

        // Brand
        if (
            filters.brands.length > 0 &&
            !filters.brands.includes(product.brand) 
        ) {
            return false;
        }

        // Color
        if (
            filters.colors.length > 0 &&
            !filters.colors.includes(product.color)
        ) {
            return false;
        }

        // Condition
        if (
            filters.conditions.length > 0 &&
            !filters.conditions.includes(product.item_condition)
        ) {
            return false;
        }

        // Type
        if (
            filters.types.length > 0 &&
            !filters.types.includes(product.category)
        ) {
            return false;
        }

        return true;
    });
}

filterButton.addEventListener("click", function () {
    filterPanel.classList.toggle("open");
});

priceFilter.addEventListener("input", function () {
    priceValue.textContent = `${priceFilter.value} EUR`;
});

applyFiltersButton.addEventListener("click", function () {
    const maxPrice = Number(priceFilter.value);

    const selectedBrands = [
        ...document.querySelectorAll(".brand-option:checked") // plockar ut alla kryssrutor med klassen brand-option som är ikryssade
    ].map(input => input.value);

    const selectedColors = [
        ...document.querySelectorAll(".color-option:checked")
    ].map(input => input.value);

    const selectedConditions = [
        ...document.querySelectorAll(".condition-option:checked")
    ].map(input => input.value);

    const selectedTypes = [
        ...document.querySelectorAll(".type-option:checked")
    ].map(input => input.value);

    const filters = { // skapar ett objekt med alla valda filter
        maxPrice: maxPrice, 
        brands: selectedBrands,
        colors: selectedColors,
        conditions: selectedConditions,
        types: selectedTypes
    };

    const filteredProducts = filterProducts( // filtrerar produkterna med hjälp av funktionen filterProducts
        allProducts,
        filters
    );

    displayProducts(filteredProducts);
    filterPanel.classList.remove("open"); 
});

resetFiltersButton.addEventListener("click", function () {

    document.querySelectorAll("#filter-panel input[type='checkbox']")
        .forEach(checkbox => checkbox.checked = false);

    priceFilter.value = 3200;
    priceValue.textContent = "3200 EUR";

    displayProducts(allProducts);

    filterPanel.classList.remove("open");
});


// ---------- Sök ----------

const searchForm = document.querySelector(".search");
const searchInput = document.querySelector("#search");

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredProducts = allProducts.filter(product => {
        return (
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.color || "").toLowerCase().includes(searchTerm)
        );
    });

    displayProducts(filteredProducts);
    document.body.classList.add("category-view");
    document.querySelector("#all-bags").scrollIntoView({
        behavior: "smooth"
    });
});


/* ==========================================================
   4. VARUKORG
   (sparas i localStorage, bara produkt-id:n, en nyckel per användare)
   ========================================================== */

const cartButton = document.querySelector("#cart-button");
const cart = document.querySelector("#cart");
const closeCartButton = document.querySelector("#close-cart");

// ---------- Öppna / stäng ----------

cartButton.addEventListener("click", function () {
    cart.classList.add("open");
});

closeCartButton.addEventListener("click", function () {
    cart.classList.remove("open");
});


// ---------- Spara och ladda ----------

function getCartKey() {
    if (currentUser) {
        return "cart_" + currentUser.id;
    }
    return "cart_guest";
}

function saveCart() {
    const ids = cartItems.map(item => item.id);
    localStorage.setItem(getCartKey(), JSON.stringify(ids));
}

function loadCart() {

    if (allProducts.length === 0) {
        return;
    }

    const saved = localStorage.getItem(getCartKey());

    if (!saved) {
        cartItems = [];
        renderCart();
        return;
    }

    const ids = JSON.parse(saved);

    cartItems = allProducts.filter(product => ids.includes(product.id));

    renderCart();
    saveCart();
}


// ---------- Lägga till / ta bort ----------

function addToCart(product) {

    const alreadyInCart = cartItems.some(item => item.id === product.id);

    if (alreadyInCart) {
        return;
    }

    cartItems.push(product);

    saveCart();
    renderCart();

    console.log(cartItems);
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCart();
    renderCart();
}


// ---------- Rita varukorgen ----------

function renderCart() {

    const cartContainer = document.querySelector(".cart-items");

    cartContainer.innerHTML = "";

    cartItems.forEach(item => {
        const cartItem = document.createElement("div");

        cartItem.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.price} EUR</p>

            <button type="button" class="remove-from-cart">
                Remove
            </button>
        `;

        cartContainer.appendChild(cartItem);

        const removeButton = cartItem.querySelector(".remove-from-cart");

        removeButton.addEventListener("click", function () {
            removeFromCart(item.id);
        });
    });

    const total = cartItems.reduce((sum, item) => {
        return sum + item.price;
    }, 0);

    const totalPrice = document.querySelector("#cart-total-price");
    totalPrice.textContent = `${total} EUR`;

    const cartCount = document.querySelector("#cart-count");
    cartCount.textContent = cartItems.length;
}


/* ==========================================================
   5. FAVORITER
   (databasen är den riktiga listan, favoriteItems är en kopia i webbläsaren)
   ========================================================== */

const favoritesButton = document.querySelector("#favorites-button");
const favoritesPanel = document.querySelector("#favorites-panel");
const closeFavoritesButton = document.querySelector("#close-favorites");

// ---------- Öppna / stäng ----------

favoritesButton.addEventListener("click", function () {
    renderFavorites();
    favoritesPanel.classList.add("open");
});

closeFavoritesButton.addEventListener("click", function () {
    favoritesPanel.classList.remove("open");
});


// ---------- Hämta från servern ----------

async function loadFavorites() {

    if (!currentUser) {
        favoriteItems = [];
        renderFavorites();
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/favorites`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            console.error("Could not load favorites");
            return;
        }

        favoriteItems = await response.json();

        renderFavorites();

        // Update hearts on product cards
        displayProducts(allProducts);
        loadCart();

    } catch (error) {
        console.error("Could not load favorites:", error);
    }
}


// ---------- Ta bort från favoritpanelen ----------

async function removeFavorite(productId) {
    await fetch(`${API_URL}/favorites/${productId}`, {
        method: "DELETE",
        credentials: "include"
    });

    await loadFavorites();
}


// ---------- Rita favoritpanelen ----------

function renderFavorites() {

    const favoriteContainer = document.querySelector(".favorite-items");

    favoriteContainer.innerHTML = "";

    if (favoriteItems.length === 0) {
        favoriteContainer.innerHTML =
            `<p class="empty-favorites">No favorites yet.</p>`;

        return;
    }

    favoriteItems.forEach(item => {

        const favoriteItem = document.createElement("div");

        favoriteItem.innerHTML = `
            <div class="favorite-product">
                <img src="${item.image}" alt="${item.name}">

                <div class="favorite-info">
                    <h3>${item.name}</h3>
                    <p>${item.price} EUR</p>

                    <button type="button" class="remove-favorite">
                        Remove
                    </button>
                </div>
            </div>
        `;

        favoriteContainer.appendChild(favoriteItem);

        const removeButton = favoriteItem.querySelector(".remove-favorite");

        removeButton.addEventListener("click", function () {
            removeFavorite(item.id);
        });
    });
}


/* ==========================================================
   6. INLOGGNING, REGISTRERING OCH PROFIL
   ========================================================== */

const profileButton = document.querySelector("#profile-button");
const loginPanel = document.querySelector("#login-panel");
const closeLoginButton = document.querySelector("#close-login");

const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const logoutButton = document.querySelector("#logout-button");

const registerForm = document.querySelector("#register-form");
const registerMessage = document.querySelector("#register-message");

// ---------- Öppna / stäng ----------

profileButton.addEventListener("click", function () {
    loginPanel.classList.add("open");
});

closeLoginButton.addEventListener("click", function () {
    loginPanel.classList.remove("open");
});


// ---------- Registrera ----------

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.querySelector("#register-name").value.trim();
    const email = document.querySelector("#register-email").value.trim();
    const password = document.querySelector("#register-password").value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            registerMessage.textContent = "Account created successfully!";
            registerForm.reset();
        } else {
            registerMessage.textContent = data.message;
        }

    } catch (error) {
        console.error("Registration failed:", error);
        registerMessage.textContent = "Could not connect to the server.";
    }
});


// ---------- Logga in ----------

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            loginMessage.textContent =
                `Welcome ${data.user.name}!`;

            console.log("Logged in user:", data.user);

            loginForm.reset();

            currentUser = data.user;
            document.querySelector(".profile-container")
                .classList.add("logged-in");

            if (data.user.role === "admin") {
                document.querySelector("#admin-button").style.display = "block";
            } else {
                document.querySelector("#admin-button").style.display = "none";
            }

        } else {
            loginMessage.textContent = data.message;
        }

        await loadFavorites();

    } catch (error) {
        console.error("Login failed:", error);
        loginMessage.textContent =
            "Could not connect to the server.";
    }
});


// ---------- Logga ut ----------

logoutButton.addEventListener("click", async function () {

    try {
        const response = await fetch(
            `${API_URL}/logout`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        if (response.ok) {

            currentUser = null;

            favoriteItems = [];

            renderFavorites();
            displayProducts(allProducts);

            document.querySelector(".profile-container")
                .classList.remove("logged-in");

            document.querySelector("#admin-button")
                .style.display = "none";

            loginMessage.textContent = ""; 

            console.log("Logged out");
        }

    } catch (error) {
        console.error("Logout failed:", error);
    }
});


// ---------- Kolla om man redan är inloggad (vid sidladdning) ----------

function setLoggedInUser(user) {
    currentUser = user;

    document.querySelector(".profile-container").classList.add("logged-in");

    document.querySelector("#admin-button").style.display =
        user.role === "admin" ? "block" : "none";
}

async function checkLogin() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            credentials: "include"
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setLoggedInUser(data.user);
        await loadFavorites();

    } catch (error) {
        console.error("Could not check login:", error);
    }
}


/* ==========================================================
   7. SIDOMENY
   ========================================================== */

const menuButton = document.querySelector("#menu-button");
const sideMenu = document.querySelector("#side-menu");
const closeMenuButton = document.querySelector("#close-menu");

menuButton.addEventListener("click", function () {
    sideMenu.classList.add("open");
});

closeMenuButton.addEventListener("click", function () {
    sideMenu.classList.remove("open");
});


/* ==========================================================
   8. ADMIN
   ========================================================== */

const adminButton = document.querySelector("#admin-button");
const adminPanel = document.querySelector("#admin-panel");
const closeAdminButton = document.querySelector("#close-admin");

const addProductForm = document.querySelector("#add-product-form");
const adminMessage = document.querySelector("#admin-message");

const editModal = document.querySelector("#edit-modal");
const closeEditButton = document.querySelector("#close-edit");
const editProductForm = document.querySelector("#edit-product-form");
const editMessage = document.querySelector("#edit-message");

let editingProductId = null;   // id för produkten som redigeras just nu


// ---------- Öppna / stäng adminpanelen ----------

adminButton.addEventListener("click", function () {
    sideMenu.classList.remove("open");
    adminPanel.classList.add("open");

    displayAdminProducts();
});

closeAdminButton.addEventListener("click", function () {
    adminPanel.classList.remove("open");
});


// ---------- Lista produkter i admin ----------

function displayAdminProducts() {
    const adminProductList =
        document.querySelector("#admin-product-list");

    adminProductList.innerHTML = "";

    allProducts.forEach(product => {

        const productItem = document.createElement("div");
        productItem.classList.add("admin-product-item");

        productItem.innerHTML = `
            <div>
                <strong>${product.name}</strong>
                <p>${product.price} EUR</p>
            </div>

            <div class="admin-product-buttons">

                <button type="button" class="edit-product">
                    Edit
                </button>

                <button type="button" class="delete-product">
                    Delete
                </button>

            </div>
        `;

        adminProductList.appendChild(productItem);

        const editButton = productItem.querySelector(".edit-product");

        editButton.addEventListener("click", function () {
            openEditProduct(product);
        });

        const deleteButton = productItem.querySelector(".delete-product");

        deleteButton.addEventListener("click", function () {

            const confirmed = confirm(
                `Are you sure you want to delete ${product.name}?`
            );

            if (confirmed) {
                deleteProduct(product.id);
            }
        });
    });
}


// ---------- Lägg till produkt ----------

addProductForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const product = {
        name: document.querySelector("#product-name").value.trim(),
        brand_id: document.querySelector("#product-brand").value,
        category: document.querySelector("#product-category").value,
        price: Number(document.querySelector("#product-price").value),
        item_condition: document.querySelector("#product-condition").value,
        color: document.querySelector("#product-color").value.trim(),
        description: document.querySelector("#product-description").value.trim(),
        image: document.querySelector("#product-image").value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(product)
        });

        const data = await response.json();

        if (response.ok) {
            adminMessage.textContent = "Product added successfully!";

            addProductForm.reset();

            await loadProducts();

        } else {
            adminMessage.textContent = data.message;
        }

    } catch (error) {
        console.error("Could not add product:", error);
        adminMessage.textContent = "Could not connect to the server.";
    }
});


// ---------- Redigera produkt ----------

function openEditProduct(product) {

    editingProductId = product.id;

    document.querySelector("#edit-name").value = product.name;
    document.querySelector("#edit-brand").value = product.brand_id;
    document.querySelector("#edit-category").value = product.category;
    document.querySelector("#edit-price").value = product.price;
    document.querySelector("#edit-condition").value = product.item_condition;
    document.querySelector("#edit-color").value = product.color;
    document.querySelector("#edit-description").value =
        product.description || "";
    document.querySelector("#edit-image").value = product.image;

    editModal.classList.add("open");
}

closeEditButton.addEventListener("click", function () {
    editModal.classList.remove("open");
    editingProductId = null;
});

editProductForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const updatedProduct = {
        name: document.querySelector("#edit-name").value.trim(),
        brand_id: document.querySelector("#edit-brand").value,
        category: document.querySelector("#edit-category").value,
        price: Number(document.querySelector("#edit-price").value),
        item_condition: document.querySelector("#edit-condition").value,
        color: document.querySelector("#edit-color").value.trim(),
        description: document.querySelector("#edit-description").value.trim(),
        image: document.querySelector("#edit-image").value.trim()
    };

    try {
        const response = await fetch(
            `${API_URL}/products/${editingProductId}`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProduct)
            }
        );

        const data = await response.json();

        if (response.ok) {
            editMessage.textContent = "Product updated successfully!";

            await loadProducts();
            displayAdminProducts();

            setTimeout(function () {
                editModal.classList.remove("open");
                editMessage.textContent = "";
                editingProductId = null;
            }, 800);

        } else {
            editMessage.textContent = data.message;
        }

    } catch (error) {
        console.error("Could not update product:", error);
        editMessage.textContent = "Could not connect to the server.";
    }
});


// ---------- Ta bort produkt ----------

async function deleteProduct(productId) {
    try {
        const response = await fetch(
            `${API_URL}/products/${productId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (response.ok) {
            adminMessage.textContent =
                "Product deleted successfully!";

            await loadProducts();

            displayAdminProducts();

        } else {
            adminMessage.textContent = data.message;
        }

    } catch (error) {
        console.error("Could not delete product:", error);

        adminMessage.textContent =
            "Could not connect to the server.";
    }
}



function start() {
    document.querySelector("#admin-button").style.display = "none";

    loadProducts();
    checkLogin();
}

start();




