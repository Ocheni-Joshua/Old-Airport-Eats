const formatNaira = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;
const restaurantCards = [...document.querySelectorAll(".restaurant-card")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const resultsMessage = document.querySelector("#results-message");
const emptyState = document.querySelector("#empty-state");
const restaurantList = document.querySelector("#restaurant-list");
const budgetForm = document.querySelector("#budget-search");
const budgetInput = document.querySelector("#budget");
const toast = document.querySelector("#toast");
const favourites = new Set();
const activeFilters = new Set();
let maxBudget = 0;
let toastTimer;

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const updateFavouritesCount = () => {
  document.querySelector(".favourite-count").textContent = String(favourites.size);
};

const updateRestaurants = () => {
  let visibleCount = 0;
  for (const card of restaurantCards) {
    const matchesBudget = !maxBudget || Number(card.dataset.price) <= maxBudget;
    const matchesOpen = !activeFilters.has("open") || card.dataset.open === "true";
    const matchesPromo = !activeFilters.has("promo") || card.dataset.promo === "true";
    const matchesFavourite = !activeFilters.has("favourites") || favourites.has(card.dataset.id);
    const visible = matchesBudget && matchesOpen && matchesPromo && matchesFavourite;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  }
  restaurantList.hidden = visibleCount === 0;
  emptyState.hidden = visibleCount !== 0;
  if (maxBudget) {
    resultsMessage.textContent = visibleCount
      ? `${visibleCount} ${visibleCount === 1 ? "meal" : "meals"} under ${formatNaira(maxBudget)}`
      : `No nearby meals under ${formatNaira(maxBudget)}.`;
  } else if (activeFilters.has("favourites")) {
    resultsMessage.textContent = visibleCount ? "Your saved spots around Old Airport." : "You haven’t saved any restaurants yet.";
  } else {
    resultsMessage.textContent = "";
  }
};

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const budget = Number(budgetInput.value);
  if (!Number.isFinite(budget) || budget < 500) {
    budgetInput.setCustomValidity("Enter a budget of at least ₦500.");
    budgetInput.reportValidity();
    budgetInput.setCustomValidity("");
    return;
  }
  maxBudget = budget;
  activeFilters.delete("favourites");
  updateRestaurants();
  document.querySelector('[data-show-favourites]').setAttribute("aria-pressed", "false");
  document.querySelector("#restaurants").scrollIntoView({ behavior: "smooth" });
});

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    if (activeFilters.has(filter)) activeFilters.delete(filter);
    else activeFilters.add(filter);
    button.setAttribute("aria-pressed", String(activeFilters.has(filter)));
    activeFilters.delete("favourites");
    document.querySelector('[data-show-favourites]').setAttribute("aria-pressed", "false");
    updateRestaurants();
  });
}

document.querySelector("[data-show-favourites]").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isActive = activeFilters.has("favourites");
  if (isActive) activeFilters.delete("favourites");
  else activeFilters.add("favourites");
  button.setAttribute("aria-pressed", String(!isActive));
  if (!isActive) {
    activeFilters.delete("open");
    activeFilters.delete("promo");
    filterButtons.forEach((filterButton) => filterButton.setAttribute("aria-pressed", "false"));
  }
  maxBudget = 0;
  updateRestaurants();
  document.querySelector("#restaurants").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".heart-button").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".restaurant-card");
    const isSaved = favourites.has(card.dataset.id);
    if (isSaved) favourites.delete(card.dataset.id);
    else favourites.add(card.dataset.id);
    button.setAttribute("aria-pressed", String(!isSaved));
    button.textContent = isSaved ? "♡" : "♥";
    button.setAttribute("aria-label", `${isSaved ? "Add" : "Remove"} ${card.querySelector("h3").textContent} ${isSaved ? "to" : "from"} favourites`);
    updateFavouritesCount();
    if (activeFilters.has("favourites")) updateRestaurants();
  });
});

document.querySelectorAll(".add-button").forEach((button) => {
  button.addEventListener("click", () => {
    const added = button.classList.toggle("is-added");
    button.textContent = added ? "ADDED ✓" : "+ ADD";
    button.setAttribute("aria-pressed", String(added));
    showToast(added ? "Added to your meal shortlist." : "Removed from your meal shortlist.");
  });
});

const menus = {
  yakubu: {
    name: "Yakubu Chops",
    location: "Yakubu Gowon Way, Jos · Open 9:00 AM – 8:00 PM",
    items: [["Beans, plantain & fish", 2000], ["Jollof rice & grilled chicken", 2800], ["Fried rice & chicken", 3000], ["Pepper soup & swallow", 2500]]
  },
  airport: {
    name: "Airport Grills",
    location: "Domkat Bali Road, Jos · Opens 11:00 AM",
    items: [["Grilled chicken & chips", 3500], ["Chicken fried rice", 3000], ["Noodles & grilled chicken", 2800], ["Grilled fish & plantain", 4000]]
  },
  "mama-tee": {
    name: "Mama Tee’s Kitchen",
    location: "Old Airport Junction, Jos · Open 8:00 AM – 9:00 PM",
    items: [["Chicken, fries & pepper sauce", 2500], ["Spicy noodles & veggies", 2500], ["Soup of the day", 3000], ["Chicken fried rice", 3000]]
  }
};

const menuDialog = document.querySelector("#menu-dialog");
document.querySelectorAll("[data-menu]").forEach((button) => {
  button.addEventListener("click", () => {
    const menu = menus[button.dataset.menu];
    document.querySelector("#menu-title").textContent = menu.name;
    document.querySelector("#menu-location").textContent = menu.location;
    const menuItems = document.querySelector("#menu-items");
    menuItems.replaceChildren(...menu.items.map(([name, price]) => {
      const row = document.createElement("div");
      row.className = "menu-item";
      const itemName = document.createElement("span");
      itemName.textContent = name;
      const itemPrice = document.createElement("strong");
      itemPrice.textContent = formatNaira(price);
      row.append(itemName, itemPrice);
      return row;
    }));
    menuDialog.showModal();
  });
});

document.querySelector("#clear-filters").addEventListener("click", () => {
  maxBudget = 0;
  activeFilters.clear();
  filterButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  document.querySelector('[data-show-favourites]').setAttribute("aria-pressed", "false");
  updateRestaurants();
});

const ownerDialog = document.querySelector("#owner-dialog");
document.querySelectorAll("[data-open-owner]").forEach((button) => {
  button.addEventListener("click", () => ownerDialog.showModal());
});

document.querySelector("#owner-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  document.querySelector("#owner-message").textContent = "Thanks! Your request is ready — our team will be in touch.";
  form.reset();
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#nav-links");
navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navLinks.classList.toggle("is-open", !isOpen);
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navLinks.classList.remove("is-open");
  });
});

document.querySelector("#owner-dialog").addEventListener("close", () => {
  document.querySelector("#owner-message").textContent = "";
});
