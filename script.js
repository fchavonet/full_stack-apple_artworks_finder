/************************
* MUSIC ARTWORKS FINDER *
************************/

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const main = document.querySelector("main");
  const searchContainer = document.getElementById("search-container");
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("results-container");

  // Pagination state.
  let currentSearchTerm = "";
  let offset = 0;
  const limit = 25;
  let isLoading = false;

  // Adjusts main padding based on header height.
  function updateMainPadding() {
    const headerHeight = header.getBoundingClientRect().height;
    main.style.paddingTop = `calc(${headerHeight}px)`;
  }

  updateMainPadding();
  window.addEventListener("resize", updateMainPadding);

  // Updates URL with search term.
  function updateURL(searchTerm) {
    const url = new URL(window.location);

    if (searchTerm) {
      url.searchParams.set("q", searchTerm);
    } else {
      url.searchParams.delete("q");
    }

    window.history.pushState({ search: searchTerm }, "", url);
  }

  // Loads search from URL parameters on page load.
  function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q");

    if (searchTerm) {
      searchInput.value = searchTerm;
      currentSearchTerm = searchTerm;
      offset = 0;
      resultsContainer.innerHTML = "";

      loadMoreArtworks();
    }
  }

  // Handles browser back/forward navigation.
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.search) {
      searchInput.value = event.state.search;
      currentSearchTerm = event.state.search;
      offset = 0;
      resultsContainer.innerHTML = "";
      loadMoreArtworks();
    } else {
      searchInput.value = "";
      currentSearchTerm = "";
      resultsContainer.innerHTML = "";
    }
  });

  // Prevents form submission from reloading the page and starts a new search.
  searchContainer.addEventListener("submit", (event) => {
    event.preventDefault();
    // Get the user's search input and trim whitespace.
    const searchValue = searchInput.value.trim();

    // Alert and exit if the search input is empty.
    if (searchValue === "") {
      alert("Please enter a search term.");
      return;
    }

    // Reset pagination and results.
    currentSearchTerm = searchValue;
    offset = 0;
    resultsContainer.innerHTML = "";

    // Update URL with search term.
    updateURL(searchValue);

    // Load first batch.
    loadMoreArtworks();
  });

  // Infinite scroll: load more when nearing bottom.
  window.addEventListener("scroll", () => {
    const threshold = 150;

    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - threshold) {
      loadMoreArtworks();
    }
  });

  // Fetches artworks from the iTunes API, page by page.
  async function loadMoreArtworks() {
    if (isLoading || !currentSearchTerm) {
      return;
    }

    isLoading = true;

    // Get selected category.
    const categorySelect = document.getElementById("category-select");
    const selectedCategory = categorySelect.value;

    // Map category to iTunes entity.
    const entityMap = {
      "music": "album",
      "tvShow": "tvSeason",
      "movie": "movie"
    };

    const entity = entityMap[selectedCategory];
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(currentSearchTerm)}&entity=${entity}&limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // If no more results, stop.
      if (data.resultCount === 0) {
        if (offset === 0) {
          resultsContainer.innerHTML = `<p id="no-result">No results found.</p>`;
        }

        isLoading = false;
        return;
      }

      // Sort results by type: music by artist/date/album, movies/TV shows by date/name.
      const sortedResults = data.results.sort((a, b) => {
        const isMusic = (item) => {
          return item.wrapperType === "collection" ||
            item.kind === "album" ||
            item.kind === "song" ||
            item.primaryGenreName === "Music";
        };

        const isMusicA = isMusic(a);
        const isMusicB = isMusic(b);

        // For music: sort by artist, then date, then album name.
        if (isMusicA && isMusicB) {
          const artistA = a.artistName || "";
          const artistB = b.artistName || "";

          // Sort by artist name.
          if (artistA.toLowerCase() !== artistB.toLowerCase()) {
            return artistA.toLowerCase().localeCompare(artistB.toLowerCase());
          }

          // If same artist, sort by release date.
          const dateA = new Date(a.releaseDate || 0);
          const dateB = new Date(b.releaseDate || 0);

          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }

          // If same artist and date, sort by album name.
          const albumA = a.collectionName || "";
          const albumB = b.collectionName || "";
          return albumA.toLowerCase().localeCompare(albumB.toLowerCase());
        }

        // For movies/TV shows: sort by release date, then by name.
        if (!isMusicA && !isMusicB) {
          // Sort by release date first.
          const dateA = new Date(a.releaseDate || 0);
          const dateB = new Date(b.releaseDate || 0);

          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }

          // If same date, sort by name.
          const nameA = a.trackName || a.collectionName || "";
          const nameB = b.trackName || b.collectionName || "";

          return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
        }

        // Mixed content: put music first, then movies/TV shows.
        if (isMusicA) {
          return -1;
        } else {
          return 1;
        }
      });

      // Create and display result cards for each item.
      sortedResults.forEach(result => {
        // Generate artwork URLs based on category.
        let artworkUrl, artistName, itemName;

        if (selectedCategory === "music") {
          artworkUrl = result.artworkUrl100;
          artistName = result.artistName;
          itemName = result.collectionName;
        } else if (selectedCategory === "tvShow") {
          artworkUrl = result.artworkUrl100;
          artistName = result.artistName || result.collectionName;
          itemName = result.collectionName;
        } else {
          artworkUrl = result.artworkUrl100;
          artistName = result.artistName || "Movie";
          itemName = result.trackName;
        }

        if (!artworkUrl) return;

        const baseUrl = artworkUrl.replace(/\/[^\/]*$/, "/");
        const artworkPreviewUrl = baseUrl + "250x250.jpg";
        const artworkHighResUrl = baseUrl + "10000x10000.jpg";

        // Create a card with spinner, image, title, and artist.
        const resultCard = document.createElement("div");
        resultCard.classList.add("card");
        resultCard.setAttribute("data-category", selectedCategory);

        // Wrapper.
        const wrapper = document.createElement("div");
        wrapper.classList.add("image-wrapper");

        // Spinner.
        const spinner = document.createElement("div");
        spinner.classList.add("spinner");
        wrapper.appendChild(spinner);

        // Image.
        const link = document.createElement("a");
        link.href = artworkHighResUrl;
        link.target = "_blank";

        const image = document.createElement("img");
        image.classList.add("artwork");
        image.src = artworkPreviewUrl;
        image.alt = `${itemName} artwork`;

        image.addEventListener("load", () => {
          spinner.remove();
          image.style.opacity = "1";
        });

        link.appendChild(image);
        wrapper.appendChild(link);
        resultCard.appendChild(wrapper);

        // Title.
        const title = document.createElement("h2");
        title.textContent = artistName;
        resultCard.appendChild(title);

        const subtitle = document.createElement("h3");
        subtitle.textContent = itemName;
        resultCard.appendChild(subtitle);

        // Append the result card to the container.
        resultsContainer.appendChild(resultCard);
      });

      // Advance offset by the number of items fetched.
      offset += limit;
    } catch (error) {
      // Log any errors that occur during the fetch or rendering process.
      console.error(error);
    } finally {
      isLoading = false;
    }
  }

  // Load from URL on initialization.
  loadFromURL();
});
