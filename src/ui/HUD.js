import { CATEGORY_COLORS } from "../data/elementData.js";

export class HUD {
  constructor() {
    this.legendEl = document.getElementById("legend");
    this.titleEl = document.getElementById("title");
    this.infoEl = document.getElementById("info");
    this.onCategoryClick = null;
    this.activeCategory = null;
    this.swatches = {};
  }

  buildLegend() {
    for (const [category, color] of Object.entries(CATEGORY_COLORS)) {
      const label = category
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase());
      const row = document.createElement("div");
      row.className = "swatch";
      row.innerHTML = `<span class="dot" style="background:#${color.toString(16).padStart(6, "0")}"></span>${label}`;
      row.addEventListener("click", () => {
        if (this.onCategoryClick) this.onCategoryClick(category);
      });
      this.legendEl.appendChild(row);
      this.swatches[category] = row;
    }
  }

  setActiveCategory(category) {
    this.activeCategory = category;
    for (const [cat, row] of Object.entries(this.swatches)) {
      row.classList.toggle("active", cat === category);
    }
  }

  updateInfo(element) {
    this.titleEl.textContent = element.name;
    this.infoEl.textContent = `Atomic number ${element.number} · Symbol ${element.symbol} · Period ${element.period} · Group ${element.group} · ${element.category
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()}`;
  }

  reset() {
    this.titleEl.textContent = "3D Periodic Table";
    this.infoEl.textContent = "Hover over an element · Scroll to zoom";
  }
}