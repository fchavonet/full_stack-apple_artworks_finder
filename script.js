/************************
* MUSIC ARTWORKS FINDER *
************************/

document.addEventListener("DOMContentLoaded", () => {
	const header = document.querySelector("header");
	const main = document.querySelector("main");
	const searchContainer = document.getElementById("search-container");
	const resultsContainer = document.getElementById("results-container");

	// Pagination state.
	let currentSearchTerm = "";
	let offset = 0;
	const limit = 50;
	let isLoading = false;

	// Adjusts main padding based on header height.
	function updateMainPadding() {
		const headerHeight = header.getBoundingClientRect().height;
		main.style.paddingTop = `calc(${headerHeight}px)`;
	}

	updateMainPadding();
	window.addEventListener("resize", updateMainPadding);

	// Prevents form submission from reloading the page and starts a new search.
	searchContainer.addEventListener("submit", (event) => {
		event.preventDefault();
		// Get the user's search input and trim whitespace.
		const searchValue = document.getElementById("search-input").value.trim();

		// Alert and exit if the search input is empty.
		if (searchValue === "") {
			alert("Please enter a search term.");
			return;
		}
		// Reset pagination and results.
		currentSearchTerm = searchValue;
		offset = 0;
		resultsContainer.innerHTML = "";

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

	// Fetches album artworks from the iTunes API, page by page.
	async function loadMoreArtworks() {
		if (isLoading) {
			return;
		}

		isLoading = true;

		const url = `https://itunes.apple.com/search?term=${encodeURIComponent(currentSearchTerm)}&entity=album&limit=${limit}&offset=${offset}`;

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

			// Sort results by artist name (alphabetically) and release date (oldest to newest).
			const sortedResults = data.results.sort((a, b) => {
				if (a.artistName.toLowerCase() < b.artistName.toLowerCase()) return -1;
				if (a.artistName.toLowerCase() > b.artistName.toLowerCase()) return 1;
				return new Date(a.releaseDate) - new Date(b.releaseDate);
			});

			// Create and display result cards for each album.
			sortedResults.forEach(result => {
				// Generate artwork URLs.
				const baseUrl = result.artworkUrl100.replace(/\/[^\/]*$/, "/");
				const artworkPreviewUrl = baseUrl + "250x250.jpg";
				const artworkHighResUrl = baseUrl + "10000x10000.jpg";

				// Album and artist details.
				const artistName = result.artistName;
				const albumName = result.collectionName;

				// Create a card with spinner, album image, title, and artist.
				const resultCard = document.createElement("div");
				resultCard.classList.add("card");

				// Wrapper.
				const wrapper = document.createElement("div");
				wrapper.classList.add("image-wrapper");

				// Spinner.
				const spinner = document.createElement("div");
				spinner.classList.add("spinner");
				wrapper.appendChild(spinner);

				// Album image.
				const link = document.createElement("a");
				link.href = artworkHighResUrl;
				link.target = "_blank";

				const imgage = document.createElement("img");
				imgage.classList.add("artwork");
				imgage.src = artworkPreviewUrl;
				imgage.alt = `${albumName} artwork`;

				imgage.addEventListener("load", () => {
					spinner.remove();
					imgage.style.opacity = "1";
				});

				link.appendChild(imgage);
				wrapper.appendChild(link);
				resultCard.appendChild(wrapper);

				// Title.
				const title = document.createElement("h2");
				title.textContent = artistName;
				resultCard.appendChild(title);

				const subtitle = document.createElement("h3");
				subtitle.textContent = albumName;
				resultCard.appendChild(subtitle);

				// Append the result card to the container.
				resultsContainer.appendChild(resultCard);
			});

			// Advance offset by the number of items fetched.
			offset += data.results.length;
		} catch (error) {
			// Log any errors that occur during the fetch or rendering process.
			console.error(error);
		} finally {
			isLoading = false;
		}
	}
});
