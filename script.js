const type = document.getElementById("type");

const seasonField = document.getElementById("season").parentElement;
const episodeField = document.getElementById("episode").parentElement;

function updateFields(){

    if(type.value === "Movie"){

        seasonField.style.display = "none";
        episodeField.style.display = "none";

    }else{

        seasonField.style.display = "flex";
        episodeField.style.display = "flex";

    }

}

type.addEventListener("change", updateFields);

updateFields();
