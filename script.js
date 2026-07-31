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

const seasonField = season.parentElement;
const episodeField = episode.parentElement;

let showingHistory = false;

const TMDB_API_KEY = "7955446551351299457cc0bd52b20050";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

const posterCache = {};

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


async function loadWatchlist() {

    watchlist.innerHTML = "";

    const { data, error } = await supabaseClient
        .from("watchlist")
        .select("*")
        .eq("completed", showingHistory)
        .order("title", { ascending: true });

    if (error) {

        console.error(error);
        return;

    }

    data.forEach(renderCard);

}


async function renderCard(item) {

    const poster = await getPoster(item.title, item.type);

    const card = document.createElement("div");
    card.className = "card";

    if (item.completed) {
        card.classList.add("completed");
    }

    let progressHTML = "";

    if (item.type === "Movie") {

        progressHTML = `
            <div class="progress">
                🎬 Movie
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
` : ""}

<button class="icon-btn delete-btn" title="Delete">
✕
</button>

</div>

<h3>${item.title}</h3>

<div class="badges">
<span class="badge">${item.type}</span>
<span class="badge">${item.genre}</span>
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

    // completed items move to History automatically, so re-filter the view
    loadWatchlist();

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
        const modalSeason = document.getElementById("modalSeason");
        const modalEpisode = document.getElementById("modalEpisode");
        const saveModal = document.getElementById("saveModal");
        const cancelModal = document.getElementById("cancelModal");

        modalSeason.value = item.season;
        modalEpisode.value = item.episode;

        modal.classList.add("show");

        cancelModal.onclick = () => {
            modal.classList.remove("show");
        };

        saveModal.onclick = async () => {

            await supabaseClient
                .from("watchlist")
                .update({
                    season: Number(modalSeason.value),
                    episode: Number(modalEpisode.value)
                })
                .eq("id", item.id);

            modal.classList.remove("show");

            loadWatchlist();

        };

    });

}

watchlist.appendChild(card);

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

    historyBtn.textContent = showingHistory ? "← Back to Watchlist" : "📜 History";

    if (pageTitle) {
        pageTitle.textContent = showingHistory ? "📜 History" : "🎬 Our Watchlist";
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
