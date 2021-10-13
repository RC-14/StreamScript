const inputDiv = document.querySelector("#input");
const urlInput = document.querySelector("#urlInput");
const confirmButton = document.querySelector("#confirmButton");
const contentDiv = document.querySelector("#content");
const video = document.querySelector("video");
const getSrcFrame = document.querySelector("#getSrcFrame");

const showError = async (title = "ERROR", message = "") => {
	document.querySelector("#error > h3").innerText = title;
	document.querySelector("#error > p").innerText = message;
	document.querySelector("#error").classList.remove("hidden");
};

const getMIMEType = async (url) => {
	if (typeof url === "object") {
		url = url?.href;
	}
	if (typeof url === "string") {
		try {
			url = new URL(url);
		} catch (error) {
			throw new Error("getMIMEType: arg 1 isn't a URL");
		}
	} else {
		throw new Error("getMIMEType: type missmatch, arg 1 isn't a String or Object");
	}
	return new Promise((resolve, reject) => {
		let controler = new AbortController(); // used to abort the request

		fetch(url, { signal: controler.signal }).then((result) => {
			controler.abort(); // abort the request after we received the headers

			resolve(result.headers.get("Content-Type"));
		});
	});
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
