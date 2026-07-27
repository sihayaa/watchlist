const type = document.getElementById("type");

const seasonField = document.getElementById("season").parentElement;
const episodeField = document.getElementById("episode").parentElement;

const addBtn = document.getElementById("addBtn");
const watchlist = document.getElementById("watchlist");

const title = document.getElementById("title");
const genre = document.getElementById("genre");
const season = document.getElementById("season");
const episode = document.getElementById("episode");
const search = document.getElementById("search");
const SUPABASE_URL = "https://dhquxkzxskxaxmkvzklb.supabase.co";
const SUPABASE_KEY = "sb_publishable_ksdXUj4t168FxDJXRaVJ1g_a_ND00jJ";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function updateFields() {

    if (type.value === "Movie") {

        seasonField.style.display = "none";
        episodeField.style.display = "none";

    } else {

        seasonField.style.display = "flex";
        episodeField.style.display = "flex";

    }

}


function addItem() {

    if (title.value.trim() === "") {

        alert("Please enter a title.");
        return;

    }

    const card = document.createElement("div");
    card.className = "card";

    if (type.value === "Movie") {

        card.innerHTML = `
            <h3>${title.value}</h3>

            <div class="badges">
                <span class="badge">${type.value}</span>
                <span class="badge">${genre.value}</span>
            </div>

            <div class="progress">
                🎬 Movie
            </div>

            <div class="card-actions">
                <label class="complete">
                    <input type="checkbox" class="completedCheck">
                    Completed
                </label>
            </div>
        `;

    } else {

        card.innerHTML = `
            <h3>${title.value}</h3>

            <div class="badges">
                <span class="badge">${type.value}</span>
                <span class="badge">${genre.value}</span>
            </div>

            <div class="progress">
                Season: <span class="seasonNumber">${season.value}</span><br>
                Episode: <span class="episodeNumber">${episode.value}</span>
            </div>

            <div class="card-actions">

                <button class="edit-btn">
                    Edit Progress
                </button>

                <label class="complete">
                    <input type="checkbox" class="completedCheck">
                    Completed
                </label>

            </div>
        `;

    }


    const checkbox = card.querySelector(".completedCheck");

    checkbox.addEventListener("change", function () {

        if (this.checked) {

            card.classList.add("completed");

        } else {

            card.classList.remove("completed");

        }

    });
    
    const editBtn = card.querySelector(".edit-btn");

    if (editBtn) {

        editBtn.addEventListener("click", function () {

            alert("Edit Progress coming next 😊");

        });

    }

    watchlist.prepend(card);


    title.value = "";
    season.value = 1;
    episode.value = 1;

}


search.addEventListener("keyup", function () {

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        const movieTitle = card.querySelector("h3").textContent.toLowerCase();

        if (movieTitle.includes(search.value.toLowerCase())) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});



type.addEventListener("change", updateFields);

addBtn.addEventListener("click", addItem);

updateFields();
