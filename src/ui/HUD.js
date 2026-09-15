import { CATEGORY_COLORS } from "../data/elements.js";

export class HUD {
  constructor() {
    this.legendEl = document.getElementById("legend");
    this.titleEl = document.getElementById("title");
    this.infoEl = document.getElementById("info");
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
      this.legendEl.appendChild(row);
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