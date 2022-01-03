var messages;

const inputDiv = document.querySelector("#input");
const urlInput = document.querySelector("#urlInput");
const confirmButton = document.querySelector("#confirmButton");
const contentDiv = document.querySelector("#content");
const video = document.querySelector("video");
const getSrcFrame = document.querySelector("#getSrcFrame");

const showError = async (title = "ERROR", message = "") => {
	document.querySelector("#error h1").innerText = title;
	document.querySelector("#error p").innerText = message;
	document.querySelector("#error").classList.remove("hidden");
};

const getMIMEType = async (url) => {
	if (typeof url === "object") {
		url = url?.href;
	}
	if (typeof url === "string") {
		try {
			url = new URL(url);
		} catch (e) {
			throw new Error("getMIMEType: arg 1 isn't a URL");
		}
	} else {
		throw new Error("getMIMEType: type missmatch, arg 1 isn't a String or Object");
	}
	return new Promise((resolve, reject) => {
		let controler = new AbortController(); // used to abort the request

		fetch(url, { signal: controler.signal }).then((result) => {
			controler.abort(); // abort the request after we received the headers

			let type = result.headers.get("Content-Type");
			if (typeof type !== "string") {
				reject("typeof MIMEType isn't string");
			}
			resolve(type);
		}, reject);
	});
};

const setSearchToUrl = (url) => {
	if (typeof url === "object") {
		url = url?.href;
	}
	if (typeof url === "string") {
		try {
			url = new URL(url).href;
		} catch (e) {
			url = url;
		}
	} else {
		throw new Error("setSearchToUrl: type missmatch, arg 1 isn't a String or Object");
	}
	location.search = encodeURIComponent(url);
};

const showInput = async () => {
	let func = () => {
		setSearchToUrl(urlInput.value);
	};

	urlInput.addEventListener("keydown", (key) => {
		if (key.code === "Enter") func();
	});
	confirmButton.addEventListener("click", func);

	document.querySelector("#input").classList.remove("hidden");
};

const showContent = async () => {
	try {
		let url = new URL(decodeURIComponent(location.search.substring(1)));

		/*Set video.src
		 *
		 * check the MIME-Type of whatever the server responds with
		 *
		 * if the MIMEType is video/* set video.src
		 * else load the url into getSrcFrame and try to get the source from there
		 */

		getMIMEType(url).then(
			(type) => {
				if (type.startsWith("video/")) {
					video.src = url.href;
				} else if (type.startsWith("text/html")) {
					video.addEventListener("error", () => {
						chrome.runtime.sendMessage({ msg: messages.waitForSrcForUrl, data: url.href }, (response) => {
							try {
								response = new URL(response); // check if response is an URL - throws an error if not
								video.src = response.href;

								getSrcFrame.src = null;
							} catch (error) {
								showError("waitForSrcForUrl failed", "Didn't receive an URL");
							}
						});

						getSrcFrame.src = url.href;
					});

					chrome.runtime.sendMessage({ msg: messages.getSrcForUrl, data: url.href }, (response) => {
						video.src = response || null;
					});
				} else {
					throw new Error("Can't get video from url: " + url.href);
				}

				document.querySelector("#content").classList.remove("hidden");
			},
			(e) => {
				showError("getMIMEType failed", e);
			}
		);
	} catch (e) {
		console.log(e);
		showError("Error in showContent", e);
	}
};

// disallow
getSrcFrame.allow =
	["camera", "display-capture", "fullscreen", "gamepad", "geolocation", "microphone", "speaker-selection", "web-share"].join(
		" 'none'; "
	) + " 'none';";

chrome.runtime.sendMessage({ msg: null }, (messages) => {
	window.messages = messages;

	if (location.search) {
		showContent();
	} else {
		showInput();
	}
});
