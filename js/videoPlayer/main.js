var messages;

const inputDiv = document.querySelector("#input");
const urlInput = document.querySelector("#urlInput");
const confirmButton = document.querySelector("#confirmButton");
const contentDiv = document.querySelector("#content");
const video = document.querySelector("video");
const getSrcFrame = document.querySelector("#getSrcFrame");
const helpButton = document.querySelector("#helpButton");

const showError = async (title = "ERROR", message = "") => {
	document.querySelector("#error h1").innerText = title;
	document.querySelector("#error p").innerText = message;
	document.querySelector("#error").classList.remove("hidden");
};

const getMIMEType = async (url) => {
	if (typeof url === "object") {
		// in case we get a url object
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
		// in case we get a url object
		url = url?.href;
	}
	if (typeof url === "string") {
		try {
			url = new URL(url).href;
		} catch (error) {
			throw new Error("setSearchToUrl: arg 1 isn't a url");
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

	urlInput.focus();
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
					// it's a video, just set the src attribute
					video.src = url.href;
				} else if (type.startsWith("text/html")) {
					// it's a website, try to get the src (we may already have it)

					// in case that loading a video from the src fails we try to get a new src
					video.addEventListener("error", () => {
						chrome.runtime.sendMessage({ msg: messages.waitForSrcForUrl, data: url.href }, (response) => {
							try {
								response = new URL(response); // check if response is an URL - throws an error if not
								video.src = response.href;

								getSrcFrame.src = null; // unload the website used to get the src
							} catch (error) {
								showError("waitForSrcForUrl failed", "Didn't receive an URL");
							}
						});

						getSrcFrame.src = url.href;
					});

					// check if we already have the src
					chrome.runtime.sendMessage({ msg: messages.getSrcForUrl, data: url.href }, (response) => {
						video.src = response || null; // if we don't already the src make the video fail to load to get a new one
					});
				} else {
					throw new Error("Can't get video from url: " + url.href);
				}

				// get and set last time for video
				chrome.runtime.sendMessage({ msg: window.messages.getLastTime, data: url.href }, (response) => {
					video.currentTime = typeof response === "number" && response !== NaN && response > 0 ? response : 0;
				});
				setInterval(() => {
					chrome.runtime.sendMessage(
						{ msg: window.messages.setLastTime, data: { url: url.href, time: video.currentTime } },
						(response) => {}
					);
				}, 1000 /* 1 second */);

				// add all the functions
				function fullscreenFunction() {
					if (!document.fullscreenElement) {
						video.requestFullscreen();
					} else {
						if (document.exitFullscreen) {
							document.exitFullscreen();
						}
					}
				}
				function pauseOrPlayFunction() {
					if (video.paused) {
						video.play();
					} else {
						video.pause();
					}
				}
				function forwardFunction(time) {
					video.currentTime += time;
				}
				function rewindFunction(time) {
					video.currentTime -= time;
				}
				function increaseVolumeFunction() {
					if (video.volume > 0.9 && video.volume < 1) {
						video.volume = 1;
					} else if (video.volume < 1) {
						video.volume += 0.1;
					}
				}
				function decreaseVolumeFunction() {
					if (video.volume < 0.1 && video.volume > 0) {
						video.volume = 0;
					} else if (video.volume > 0) {
						video.volume -= 0.1;
					}
				}
				function muteOrUnmuteFunction() {
					if (video.muted) {
						video.muted = false;
					} else {
						video.muted = true;
					}
				}
				function skipOpeningFunction() {
					video.currentTime += 90 - 3; // usual length of the opening (90 seconds) minus some time the user needs to skip (3 seconds)
				}

				// add keyboard shortcuts
				document.addEventListener("keydown", (event) => {
					if (
						[
							"Space",
							"KeyF",
							"KeyI",
							"KeyJ",
							"KeyK",
							"KeyL",
							"KeyM",
							"KeyO",
							"KeyS",
							"ArrowLeft",
							"ArrowRight",
							"ArrowUp",
							"ArrowDown",
							"PageUp",
							"PageDown",
						].includes(event.code)
					)
						event.preventDefault();

					switch (event.code) {
						case "Space":
							pauseOrPlayFunction();
							break;

						case "KeyF":
							fullscreenFunction();
							break;

						case "KeyI":
							decreaseVolumeFunction();
							break;

						case "KeyJ":
							rewindFunction(10);
							break;

						case "KeyK":
							pauseOrPlayFunction();
							break;

						case "KeyL":
							forwardFunction(10);
							break;

						case "KeyM":
							muteOrUnmuteFunction();
							break;

						case "KeyO":
							increaseVolumeFunction();
							break;

						case "KeyS":
							skipOpeningFunction();
							break;

						case "ArrowLeft":
							rewindFunction(10);
							break;

						case "ArrowRight":
							forwardFunction(10);
							break;

						case "ArrowUp":
							increaseVolumeFunction();
							break;

						case "ArrowDown":
							decreaseVolumeFunction();
							break;

						case "PageUp":
							forwardFunction(30);
							break;

						case "PageDown":
							rewindFunction(30);
							break;

						default:
							break;
					}
				});

				// add functionality to buttons etc.
				helpButton.addEventListener("click", () => {
					video.pause();
					alert(
						"Video controls:\n" +
							[
								'"F"\t\t\t\t= Fullscreen on/off',
								'"I"\t\t\t\t= decrease volume',
								'"J"\t\t\t\t= rewind 10 Seconds',
								'"K"\t\t\t\t= pause/play',
								'"L"\t\t\t\t= forward 10 seconds',
								'"M"\t\t\t\t= mute/unmute',
								'"O"\t\t\t\t= increase volume',
								'"S"\t\t\t\t= skip opening (forward 87 seconds)',
								'"Page Up"\t\t= forward 30 seconds',
								'"Page Down"\t= rewind 30 seconds',
								"\nand default controls (space and arrow keys)",
							].join("\n")
					);
				});

				document.querySelector("#content").classList.remove("hidden");
			},
			(error) => {
				console.error(error);
				showError("getMIMEType failed", error);
			}
		);
	} catch (error) {
		console.error(error);
		showError("Error in showContent", error);
	}
};

// disallow stuff that the frame doesn't need
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
