/************************
* MUSIC ARTWORKS FINDER *
************************/

document.addEventListener("DOMContentLoaded", () => {
	const header = document.querySelector("header");
	const main = document.querySelector("main");
	const searchForm = document.getElementById("search-container");

	// Adjusts main padding based on header height.
	function updateMainPadding() {
		const headerHeight = header.getBoundingClientRect().height;
		main.style.paddingTop = `calc(${headerHeight}px)`;
	}

	updateMainPadding();
	window.addEventListener("resize", updateMainPadding);

	// Prevents form submission from reloading the page.
	searchForm.addEventListener("submit", (event) => {
		event.preventDefault();
		searchArtworks();
	});
});

// Fetches album artworks from the iTunes API.
async function searchArtworks() {
	// Get the user's search input and trim whitespace.
	const searchValue = document.getElementById("search-input").value.trim();

	// Build the iTunes search API URL.
	const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchValue)}&entity=album&limit=50`;

	try {
		// Fetch data from the API and convert it to JSON.
		const response = await fetch(url);
		const data = await response.json();

		// Clear previous search results.
		const resultsContainer = document.getElementById("results-container");
		resultsContainer.innerHTML = "";

		// Alert and exit if the search input is empty.
		if (searchValue === "") {
			resultsContainer.innerHTML = "";
			alert("Please enter a search term.");
			return;
		}

		// If no results are found, display a message and exit.
		if (data.resultCount === 0) {
			resultsContainer.innerHTML = `<p id="no-result">No results found.</p>`;
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

			// Create a card with album image, title, and artist.
			const resultCard = document.createElement("div");
			resultCard.classList.add("card");
			resultCard.innerHTML = `
                <a href="${artworkHighResUrl}" target="_blank">
                	<img src="${artworkPreviewUrl}" alt="${albumName} artwork">
                </a>
                <h2>${artistName}</h2>
                <h3>${albumName}</h3>
            `;

			// Append the result card to the container.
			resultsContainer.appendChild(resultCard);
		});
	} catch (error) {
		// Log any errors that occur during the fetch or rendering process.
		console.error(error);
	}
}
