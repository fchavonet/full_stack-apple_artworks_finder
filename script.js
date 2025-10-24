/************************
* COVER SEARCH BEHAVIOR *
************************/

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsContainer = document.getElementById("results-container");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  resultsContainer.innerHTML = `
    <span class="loading loading-spinner loading-xl"></span>
  `;

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=30`
    );
    const data = await response.json();

    if (!data.results.length) {
      resultsContainer.innerHTML = `
        <p>No albums found for "${query}"</p>
      `;

      return;
    }

    const cardsHTML = data.results
      .map(
        (card) => `
          <div class="card rounded-xl bg-base-300 shadow-xl cursor-pointer">
            <figure>
              <img class="w-full h-auto rounded-t-xl" src="${card.artworkUrl100.replace("100x100bb.jpg", "500x500bb.jpg")}" alt="${card.collectionName}" />
            </figure>
            
            <div class="card-body p-4 flex flex-col justify-center items-center">
              <h2 class="card-title text-xl font-bold line-clamp-1">${card.artistName}</h2>
              <h3 class="text-md line-clamp-1">${card.collectionName}</h3>
            </div>
          </div>
        `
      )
      .join("");

    resultsContainer.innerHTML = `
      <div class="grid p-4 py-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        ${cardsHTML}
      </div>
    `;
  } catch (error) {
    console.error(error);

    resultsContainer.innerHTML = `
      <p>An error occurred while fetching results.</p>
    `;
  }
});


/*****************
* MODAL BEHAVIOR *
*****************/

const modalCover = document.getElementById("modal-cover");
const modalFigure = document.getElementById("modal-figure");
const modalArtist = document.getElementById("modal-artist");
const modalTitle = document.getElementById("modal-title");
const downloadButton = document.getElementById("download-button");

resultsContainer.addEventListener("click", (event) => {
  event.preventDefault();

  const card = event.target.closest(".card");

  if (!card) {
    return;
  }

  const img = card.querySelector("img");
  const title = card.querySelector("h3")?.textContent || "Unknown Album";
  const artist = card.querySelector("h2")?.textContent || "Unknown Artist";
  const url = img.src.replace("500x500bb.jpg", "2000x2000bb.jpg");

  modalFigure.innerHTML = "";

  const loader = document.createElement("span");
  loader.className = "loading loading-spinner loading-lg";
  modalFigure.appendChild(loader);

  modalTitle.textContent = title;
  modalArtist.textContent = artist;
  downloadButton.href = url;

  modalCover.showModal();

  const tempImg = new Image();
  tempImg.src = url;
  tempImg.className = "absolute w-full h-full object-cover rounded-xl opacity-0 transition-opacity duration-300";

  tempImg.onload = () => {
    loader.remove();
    modalFigure.appendChild(tempImg);

    requestAnimationFrame(() => {
      tempImg.classList.remove("opacity-0");
      tempImg.classList.add("opacity-100");
    });
  };
});


/**************************
* COPYRIGHT YEAR BEHAVIOR *
**************************/

const year = document.getElementById("year")
year.textContent = new Date().getFullYear();
