function spawnConfetti(container) {

    if (!container) return;

    const emojis = ["✨", "🌟", "💫", "🎉"];

    for (let i = 0; i < 8; i++) {

        const piece = document.createElement("span");
        piece.className = "confetti-piece";
        piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        const angle = Math.random() * Math.PI * 2;
        const dist = 26 + Math.random() * 26;

        piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        piece.style.setProperty("--dy", `${Math.sin(angle) * dist - 12}px`);
        piece.style.animationDelay = `${Math.random() * 80}ms`;

        container.appendChild(piece);

        setTimeout(() => piece.remove(), 950);

    }

}


function spawnFireflies(count = 18) {

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (let i = 0; i < count; i++) {

        const fly = document.createElement("div");
        fly.className = "firefly";

        const size = 3 + Math.random() * 4;
        const duration = 6 + Math.random() * 8;
        const flicker = 2 + Math.random() * 3;

        fly.style.width = `${size}px`;
        fly.style.height = `${size}px`;
        fly.style.top = `${Math.random() * 100}vh`;
        fly.style.left = `${Math.random() * 100}vw`;
        fly.style.animation = `fireflyFloat ${duration}s ease-in-out infinite, fireflyFlicker ${flicker}s ease-in-out infinite`;
        fly.style.animationDelay = `${-Math.random() * duration}s, ${-Math.random() * flicker}s`;

        document.body.appendChild(fly);

    }

}

spawnFireflies();


const type = document.getElementById("type");
const title = document.getElementById("title");
const genre = document.getElementById("genre");
const season = document.getElementById("season");
const episode = document.getElementById("episode");
const addBtn = document.getElementById("addBtn");
const watchlist = document.getElementById("watchlist");
const search = document.getElementById("search");
const historyBtn = document.getElementById("historyBtn");
const pageTitle = document.getElementById("pageTitle");
const filterGenre = document.getElementById("filterGenre");
const sortBy = document.getElementById("sortBy");

const seasonField = season.parentElement;
const episodeField = episode.parentElement;

let showingHistory = false;

const TMDB_API_KEY = "7955446551351299457cc0bd52b20050";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

const posterCache = {};
let selectedTMDB = null;
let searchTimeout = null;
const searchResults = document.getElementById("searchResults");

async function getPoster(title, type) {

    const cacheKey = `${type}_${title}`;

    if (posterCache[cacheKey]) {
        return posterCache[cacheKey];
    }

    const endpoint =
        type === "Movie"
            ? "movie"
            : "tv";

    try {

        const response = await fetch(
            `https://api.themoviedb.org/3/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );

        const data = await response.json();

        if (data.results && data.results.length > 0) {

            const poster = data.results[0].poster_path
                ? `${TMDB_IMAGE}${data.results[0].poster_path}`
                : "https://placehold.co/300x450?text=No+Poster";

            posterCache[cacheKey] = poster;

            return poster;

        }

    } catch (err) {

        console.error("TMDB Error:", err);

    }

    return "https://placehold.co/300x450?text=No+Poster";

}

const detailsCache = {};

async function getTMDBDetails(title, type) {

    const cacheKey = `${type}_${title}`;

    if (detailsCache[cacheKey]) {
        return detailsCache[cacheKey];
    }

    const endpoint =
        type === "Movie"
            ? "movie"
            : "tv";

    try {

        const response = await fetch(
            `https://api.themoviedb.org/3/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );

        const data = await response.json();

        if (data.results && data.results.length > 0) {

            const result = data.results[0];

            // The search endpoint doesn't return runtime — a second call
            // to the full detail endpoint is needed to get it.
            let runtime = null;

            try {

                const detailResponse = await fetch(
                    `https://api.themoviedb.org/3/${endpoint}/${result.id}?api_key=${TMDB_API_KEY}`
                );

                const detailData = await detailResponse.json();

                if (type === "Movie") {

                    if (detailData.runtime) {
                        runtime = `${detailData.runtime} min`;
                    }

                } else {

                    if (detailData.episode_run_time && detailData.episode_run_time.length > 0) {
                        runtime = `${detailData.episode_run_time[0]} min/ep`;
                    }

                }

            } catch (err) {

                console.error("TMDB Runtime Error:", err);

            }

            const details = {
                poster: result.poster_path
                    ? `${TMDB_IMAGE}${result.poster_path}`
                    : "https://placehold.co/500x750?text=No+Poster",
                backdrop: result.backdrop_path
                    ? `https://image.tmdb.org/t/p/w1280${result.backdrop_path}`
                    : null,
                overview: result.overview || "No description available.",
                rating: result.vote_average
                    ? result.vote_average.toFixed(1)
                    : null,
                year: (result.release_date || result.first_air_date || "").substring(0, 4),
                runtime: runtime
            };

            detailsCache[cacheKey] = details;

            return details;

        }

    } catch (err) {

        console.error("TMDB Details Error:", err);

    }

    return {
        poster: "https://placehold.co/500x750?text=No+Poster",
        backdrop: null,
        overview: "No description available.",
        rating: null,
        year: "",
        runtime: null
    };

}

async function openDetailsModal(item) {

    const modal = document.getElementById("detailsModal");
    const backdropImg = document.getElementById("detailsBackdrop");
    const titleEl = document.getElementById("detailsTitle");
    const overviewEl = document.getElementById("detailsOverview");
    const badgesEl = document.getElementById("detailsBadges");
    const metaEl = document.getElementById("detailsMeta");

    titleEl.textContent = item.title;
    overviewEl.textContent = "Loading description...";
    metaEl.textContent = "";
    backdropImg.src = "";

    badgesEl.innerHTML = `
        <span class="badge">${item.type}</span>
        <span class="badge ${genreClass(item.genre)}">${item.genre}</span>
    `;

    modal.classList.add("show");

    const details = await getTMDBDetails(item.title, item.type);

    backdropImg.src = details.backdrop || details.poster;
    overviewEl.textContent = details.overview;

    metaEl.textContent = [
        details.year,
        details.rating ? `⭐ ${details.rating}` : null,
        details.runtime
    ].filter(Boolean).join(" · ");

}

document.getElementById("closeDetails").addEventListener("click", () => {
    document.getElementById("detailsModal").classList.remove("show");
});

document.getElementById("detailsModal").addEventListener("click", (e) => {
    if (e.target.id === "detailsModal") {
        e.currentTarget.classList.remove("show");
    }
});

function updateFields() {

    if (type.value === "Movie") {

        seasonField.style.display = "none";
        episodeField.style.display = "none";

    } else {

        seasonField.style.display = "flex";
        episodeField.style.display = "flex";

    }

}

type.addEventListener("change", updateFields);
updateFields();

async function searchTMDB(query) {

    if (query.length < 2) {
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
        return;
    }

    // Uses /search/multi so it searches movies AND tv/anime in one call,
    // regardless of what the Type dropdown is currently set to.
    const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    searchResults.innerHTML = "";

    // /search/multi also returns "person" results (actors, directors) — filter those out
    const results = (data.results || []).filter(
        r => r.media_type === "movie" || r.media_type === "tv"
    );

    if (!results.length) {
        searchResults.style.display = "none";
        return;
    }

    results.slice(0, 15).forEach(item => {

        const poster = item.poster_path
            ? `${TMDB_IMAGE}${item.poster_path}`
            : "https://placehold.co/100x150?text=No+Poster";

        const year =
            (item.release_date || item.first_air_date || "")
            .substring(0, 4);

        const mediaLabel = item.media_type === "movie" ? "Movie" : "TV/Anime";

        const div = document.createElement("div");
        div.className = "search-item";

        div.innerHTML = `
            <img src="${poster}">
            <div>
                <h4>${item.title || item.name}</h4>
                <p>${year} · ${mediaLabel}</p>
            </div>
        `;

        div.onclick = () => {

            selectedTMDB = item;

            title.value = item.title || item.name;

            // Auto-sync the Type dropdown to match what was picked.
            if (item.media_type === "movie") {
                type.value = "Movie";
            } else {
                // TMDB doesn't have a dedicated "anime" media type — a TV
                // result counts as anime here if it's tagged Animation (genre id 16)
                // or its original language is Japanese.
                const isAnime =
                    (item.genre_ids && item.genre_ids.includes(16)) ||
                    item.original_language === "ja";

                type.value = isAnime ? "Anime" : "Series";
            }

            updateFields();

            searchResults.style.display = "none";

        };

        searchResults.appendChild(div);

    });

    searchResults.style.display = "block";

}

title.addEventListener("input", () => {

    selectedTMDB = null;

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {

        searchTMDB(title.value.trim());

    }, 300);

});

// Auto-format "Left off at" as digits are typed — no need to type colons.
// e.g. typing 1 2 3 4 5 becomes 1:23:45 (rightmost 2 digits = seconds,
// next 2 = minutes, remaining = hours).
const modalLeftOffInput = document.getElementById("modalLeftOff");

modalLeftOffInput.addEventListener("input", function () {

    const digits = this.value.replace(/\D/g, "").slice(-6);

    const secs = digits.slice(-2);
    const mins = digits.length > 2 ? digits.slice(-4, -2) : "";
    const hours = digits.length > 4 ? digits.slice(0, -4) : "";

    let formatted = secs;
    if (mins) formatted = `${mins}:${formatted}`;
    if (hours) formatted = `${hours}:${formatted}`;

    this.value = formatted;

});

// Genre filter and sort live inside a popup panel anchored to the funnel
// button, so the toolbar doesn't need two separate dropdowns on display.
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const filterDot = document.getElementById("filterDot");

filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    filterPanel.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    if (!filterPanel.contains(e.target) && e.target !== filterBtn) {
        filterPanel.classList.remove("show");
    }
});

function updateFilterDot() {
    const isActive = filterGenre.value !== "" || sortBy.value !== "title";
    filterDot.classList.toggle("show", isActive);
}

// Genre filter and sort both re-run the query against Supabase directly,
// so filtering/sorting stays fast even as the list grows.
filterGenre.addEventListener("change", () => {
    updateFilterDot();
    loadWatchlist();
});

sortBy.addEventListener("change", () => {
    updateFilterDot();
    loadWatchlist();
});

async function loadWatchlist() {

    watchlist.innerHTML = "";

    let query = supabaseClient
        .from("watchlist")
        .select("*")
        .eq("completed", showingHistory);

    if (filterGenre.value) {
        query = query.eq("genre", filterGenre.value);
    }

    if (sortBy.value === "created_at") {
        query = query.order("created_at", { ascending: false });
    } else {
        query = query.order("title", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {

        console.error(error);
        return;

    }

    // Build all cards in parallel (each still awaits its own poster fetch),
    // but wait for ALL of them before appending — otherwise whichever
    // poster loads fastest gets appended first, breaking the sort order
    // the query already returned.
    const cards = await Promise.all(
        data.map((item, index) => renderCard(item, index))
    );

    cards.forEach(card => watchlist.appendChild(card));

}


function genreClass(genre) {
    return `badge-genre-${genre.toLowerCase().replace(/\s+/g, "-")}`;
}


async function renderCard(item, index) {

    const poster = await getPoster(item.title, item.type);

    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${Math.min(index, 12) * 60}ms`;

    if (item.completed) {
        card.classList.add("completed");
    }

    let progressHTML = "";

    if (item.type === "Movie") {

        progressHTML = `
            <div class="progress">
                ${item.left_off ? `⏸ Left off at ${item.left_off}` : "🎬 Movie"}
            </div>
        `;

    } else {

        progressHTML = `
            <div class="progress">
                Season:
                <span class="seasonNumber">${item.season}</span>
                <br>
                Episode:
                <span class="episodeNumber">${item.episode}</span>
            </div>
        `;

    }

    card.innerHTML = `
<div class="poster-wrapper">

<img
    class="poster"
    src="${poster}"
    alt="${item.title}"
    loading="lazy"
>

<div class="card-content">

<div class="card-top">

${item.type !== "Movie" ? `
<button class="icon-btn edit-btn" title="Edit Progress">
✏
</button>
` : `
<button class="icon-btn edit-btn" title="Edit Left Off At">
✏
</button>
`}

<button class="icon-btn delete-btn" title="Delete">
✕
</button>

</div>

<h3>${item.title}</h3>

<div class="badges">
<span class="badge">${item.type}</span>
<span class="badge ${genreClass(item.genre)}">${item.genre}</span>
</div>

${progressHTML}

<label class="complete">

<input
type="checkbox"
class="completedCheck"
${item.completed ? "checked" : ""}>

Completed

</label>

</div>

</div>
`;
    const checkbox = card.querySelector(".completedCheck");

checkbox.addEventListener("change", async function () {

    await supabaseClient
        .from("watchlist")
        .update({
            completed: this.checked
        })
        .eq("id", item.id);

    if (this.checked) {
        spawnConfetti(this.closest(".complete"));
    }

 
    card.classList.add("completing");

    setTimeout(() => {
        loadWatchlist();
    }, 500);

});

const deleteBtn = card.querySelector(".delete-btn");

deleteBtn.addEventListener("click", function () {

    const modal = document.getElementById("deleteModal");
    const text = document.getElementById("deleteText");
    const yes = document.getElementById("deleteYes");
    const no = document.getElementById("deleteNo");

    text.textContent = `Are you sure you want to delete "${item.title}"?`;

    modal.classList.add("show");

    no.onclick = () => {
        modal.classList.remove("show");
    };

    yes.onclick = async () => {

        await supabaseClient
            .from("watchlist")
            .delete()
            .eq("id", item.id);

        modal.classList.remove("show");

        loadWatchlist();

    };

});

const editBtn = card.querySelector(".edit-btn");

if (editBtn) {

    editBtn.addEventListener("click", async function () {

        const modal = document.getElementById("progressModal");
        const seasonEpisodeRow = document.getElementById("modalSeasonEpisodeRow");
        const leftOffField = document.getElementById("modalLeftOffField");
        const modalSeason = document.getElementById("modalSeason");
        const modalEpisode = document.getElementById("modalEpisode");
        const modalLeftOff = document.getElementById("modalLeftOff");
        const saveModal = document.getElementById("saveModal");
        const cancelModal = document.getElementById("cancelModal");

        const isMovie = item.type === "Movie";

        seasonEpisodeRow.style.display = isMovie ? "none" : "flex";
        leftOffField.style.display = isMovie ? "flex" : "none";

        if (isMovie) {
            modalLeftOff.value = item.left_off || "";
        } else {
            modalSeason.value = item.season;
            modalEpisode.value = item.episode;
        }

        modal.classList.add("show");

        cancelModal.onclick = () => {
            modal.classList.remove("show");
        };

        saveModal.onclick = async () => {

            const update = isMovie
                ? { left_off: modalLeftOff.value.trim() || null }
                : {
                    season: Number(modalSeason.value),
                    episode: Number(modalEpisode.value)
                };

            await supabaseClient
                .from("watchlist")
                .update(update)
                .eq("id", item.id);

            modal.classList.remove("show");

            loadWatchlist();

        };

    });

}

const posterImg = card.querySelector(".poster");
const cardTitle = card.querySelector("h3");

[posterImg, cardTitle].forEach(el => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => openDetailsModal(item));
});

return card;

}


async function addItem() {

    if (title.value.trim() === "") {
        alert("Please enter a title.");
        return;
    }

    const newItem = {
        title: title.value.trim(),
        genre: genre.value,
        type: type.value,
        season: type.value === "Movie"
            ? null
            : Number(season.value),
        episode: type.value === "Movie"
            ? null
            : Number(episode.value),
        completed: false
    };

    const { error } = await supabaseClient
        .from("watchlist")
        .insert([newItem]);

    if (error) {
        console.error(error);
        alert("Failed to save item.");
        return;
    }

    title.value = "";
    season.value = 1;
    episode.value = 1;

    loadWatchlist();

}

addBtn.addEventListener("click", addItem);

historyBtn.addEventListener("click", () => {

    showingHistory = !showingHistory;

    historyBtn.textContent = showingHistory ? "← Back to Watchlist" : "✅ Completed";

    if (pageTitle) {
        pageTitle.textContent = showingHistory ? "✅ Completed" : "🎬 Our Watchlist";
    }

    loadWatchlist();

});

search.addEventListener("input", function () {

    const filter = search.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {

        const movieTitle = card
            .querySelector("h3")
            .textContent
            .toLowerCase();

        if (movieTitle.includes(filter)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }

    });

});

document.addEventListener("DOMContentLoaded", async () => {

    await loadWatchlist();

});

async function preloadPosters() {

    const { data } = await supabaseClient
        .from("watchlist")
        .select("title,type");

    if (!data) return;

    data.forEach(item => {
        getPoster(item.title, item.type);
    });

}

preloadPosters();
