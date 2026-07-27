const type = document.getElementById("type");
const title = document.getElementById("title");
const genre = document.getElementById("genre");
const season = document.getElementById("season");
const episode = document.getElementById("episode");
const addBtn = document.getElementById("addBtn");
const watchlist = document.getElementById("watchlist");
const search = document.getElementById("search");

const seasonField = season.parentElement;
const episodeField = episode.parentElement;

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
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(renderCard);
}

function renderCard(item) {

    const card = document.createElement("div");
    card.className = "card";

    if (item.completed) {
        card.classList.add("completed");
    }

    let progressHTML = "";

    if (item.type === "Movie") {
        progressHTML = `<div class="progress">🎬 Movie</div>`;
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

    let editButton = "";

    if (item.type !== "Movie") {
        editButton = `
            <button class="edit-btn">
                Edit Progress
            </button>
        `;
    }

    card.innerHTML = `
        <h3>${item.title}</h3>

        <div class="badges">
            <span class="badge">${item.type}</span>
            <span class="badge">${item.genre}</span>
        </div>

        ${progressHTML}

        <div class="card-actions">

            ${editButton}

            <label class="complete">
                <input
                    type="checkbox"
                    class="completedCheck"
                    ${item.completed ? "checked" : ""}
                >
                Completed
            </label>

            <button class="delete-btn">
                Delete
            </button>

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

        card.classList.toggle("completed", this.checked);

    });

    const deleteBtn = card.querySelector(".delete-btn");

    deleteBtn.addEventListener("click", async function () {

        if (!confirm(`Delete "${item.title}"?`))
            return;

        await supabaseClient
            .from("watchlist")
            .delete()
            .eq("id", item.id);

        loadWatchlist();

    });

    const editBtn = card.querySelector(".edit-btn");

    if (editBtn) {

        editBtn.addEventListener("click", async function () {

            let newSeason = prompt("Season:", item.season);
            if (newSeason === null) return;

            let newEpisode = prompt("Episode:", item.episode);
            if (newEpisode === null) return;

            await supabaseClient
                .from("watchlist")
                .update({
                    season: Number(newSeason),
                    episode: Number(newEpisode)
                })
                .eq("id", item.id);

            loadWatchlist();

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
        season: type.value === "Movie" ? null : Number(season.value),
        episode: type.value === "Movie" ? null : Number(episode.value),
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

document.addEventListener("DOMContentLoaded", () => {
    loadWatchlist();
});
