// Home page interactivity: search + category filter
(function () {
  const search = document.getElementById("search");
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const chips = document.querySelectorAll(".chip");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".card"));
  let activeCat = "ALL";
  let query = "";

  function apply() {
    let visible = 0;
    for (const card of cards) {
      const cat = card.dataset.cat;
      const title = card.dataset.title;
      const tagline = card.dataset.tagline;
      const slug = card.dataset.slug;
      const matchesCat = activeCat === "ALL" || cat === activeCat;
      const matchesQuery = !query ||
        title.includes(query) ||
        tagline.includes(query) ||
        slug.includes(query);
      const show = matchesCat && matchesQuery;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    }
    empty.hidden = visible > 0;
  }

  search.addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    apply();
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeCat = chip.dataset.cat;
      apply();
    });
  });

  // Keyboard: "/" focuses search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    }
  });
})();
