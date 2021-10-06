const inputDiv = document.querySelector("#input");
const urlInput = document.querySelector("#urlInput");
const confirmButton = document.querySelector("#confirmButton");
const contentDiv = document.querySelector("#content");
const video = document.querySelector("video");
const getSrcFrame = document.querySelector("#getSrcFrame");

const showError = async (title, message) => {
	document.querySelector("#error > h3").innerText = title;
	document.querySelector("#error > p").innerText = message;
	document.querySelector("#error").classList.remove("hidden");
};

if (location.search) {
	try {
		let url = new URL(decodeURIComponent(location.search.substr(1)));

		document.querySelector("#content").classList.remove("hidden");
	} catch (error) {
		showError();
	}
} else {
	urlInput.addEventListener("keydown", (key) => {
		if (key.code === "Enter"); // start function call when enter is pressed
	});
	confirmButton.addEventListener("click" /* start function call when the confirm button is pressed */);

	document.querySelector("#input").classList.remove("hidden");
}
