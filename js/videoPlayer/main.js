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

