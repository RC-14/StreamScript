function checkIfUrlAvailabe(url) {
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", url);
		request.onreadystatechange = () => {
			if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
				var status = request.status;
				// aborting the request because we don't want to load more than the headers
				request.abort();
				if (status === 0 || (status >= 200 && status < 400)) {
					// resolve if the status tells us that the request was ok
					resolve();
				} else {
					// reject if the status is, for example, 404
					reject();
				}
			}
		};
		request.send();
	});
	return promise;
}

// all actions that can be used in instructions
const actions = {};
actions.showNewVersionAlert = (newVersion) => {
	alert("StreamScript\n\nNew version available: " + newVersion + "\nhttps://github.com/RC-14/StreamScript/releases/latest");
};

actions.clickFirstElementByQuerySelector = (selector) => {
	document.querySelector(selector).click();
};
actions.clickLastElementByQuerySelector = (selector) => {
	let elements = document.querySelectorAll(selector);
	elements[elements.length - 1].click();
};
actions.clickAllElementsByQuerySelector = (selector) => {
	let elements = document.querySelectorAll(selector);
	for (let i = 0; i < elements.length; i++) {
		elements[i].click();
	}
};

actions.redirect = (url) => {
	open(url, "_self", "noopener, noreferrer");
};
actions.redirectToVideoSrc = (url) => {
	chrome.runtime.sendMessage({msg: messages.REDIRECTTOVIDEOSRC, data: {url: location.href, src: url}}, () => {
		actions.redirect(url);
	});
};

actions.safeRedirect = (url) => {
	checkIfUrlAvailabe(url).then(
		() => {
			// if url is available redirect to it
			actions.redirect(url);
		},
		() => {
			console.log("StreamScript: safeRedirect failed (URL not available)");
		}
	);
};
actions.safeRedirectToVideoSrc = (url) => {
	checkIfUrlAvailabe(url).then(
		() => {
			// if url is available redirect to it
			actions.redirectToVideoSrc(url);
		},
		() => {
			console.log("StreamScript: safeRedirectToVideoSrc failed (URL not available)");
		}
	);
};

actions.basicRedirectToVideoSrc = () => {
	let videos = document.getElementsByTagName("video");
	let source = "";
	if (videos.length > 0) {
		// get the source from the last video element (with currentSrc set) from the page to avoid ads and redirect to it
		for (let i = 0; i < videos.length; i++) {
			if (videos[videos.length - 1 - i].currentSrc) {
				source = encodeURI(videos[videos.length - 1 - i].currentSrc);
				break;
			}
		}
	}
	if (source !== "") {
		actions.safeRedirectToVideoSrc(source);
	} else {
		console.log("StreamScript: basicRedirectToVideoSrc failed (no source found)");
	}
};

actions.basicRedirectToVideoSrcWithDelay = (ms) => {
	setTimeout(actions.basicRedirectToVideoSrc, ms);
};

actions.addVideoControls = () => {
	var video = document.getElementsByTagName("video")[0];

	var openingLength = 90 - 3; // in seconds

	// help message for the help button
	var helpMessage =
		"Video controls:\n" +
		[
			'"F" = Fullscreen on/off',
			'"S" = skip opening (87 seconds)',
			'"J" = rewind 10 Seconds',
			'"K" = pause/play',
			'"L" = skip 10 seconds',
			'"O" = increase volume',
			'"I" = decrease volume',
			'"M" = mute/unmute',
			"\nand default controls (space and arrow keys)",
		].join("\n");

	video.pause();
	video.currentTime = 0;

	chrome.runtime.sendMessage({msg: messages.GETLASTTIME, data: location.href}, (response) => {
		video.currentTime = typeof response === "number" ? response : 0;
	});
	setInterval(() => {
		chrome.runtime.sendMessage({msg: messages.SETLASTTIME, data: {url: location.href, time: video.currentTime}}, (response) => {});
	}, 500);

	// adding all the functions
	function fullscreenFunction() {
		if (!document.fullscreenElement) {
			video.requestFullscreen();
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
	}
	function skipOpeningFunction() {
		video.currentTime += openingLength;
	}
	function rewind10SecondsFunction() {
		video.currentTime -= 10;
	}
	function pauseOrPlayFunction() {
		if (video.paused) {
			video.play();
		} else {
			video.pause();
		}
	}
	function skip10SecondsFunction() {
		video.currentTime += 10;
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

	// adding keyboard shortcuts
	document.addEventListener("keydown", (key) => {
		switch (key.code) {
			case "KeyF":
				fullscreenFunction();
				break;

			case "KeyS":
				skipOpeningFunction();
				break;

			case "KeyJ":
				rewind10SecondsFunction();
				break;

			case "KeyK":
				pauseOrPlayFunction();
				break;

			case "KeyL":
				skip10SecondsFunction();
				break;

			case "KeyO":
				increaseVolumeFunction();
				break;

			case "KeyI":
				decreaseVolumeFunction();
				break;

			case "KeyM":
				muteOrUnmuteFunction();
				break;

			default:
				break;
		}
	});
	//pause the video when visibility changes to hidden
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden" && !video.paused) {
			video.pause();
		}
	});

	//add help button
	var helpButton = document.createElement("button");
	helpButton.textContent = "Help";
	helpButton.style =
		"position: fixed; background-color: grey; border-color: darkgrey; border-radius: 10px; font-size: 20px; font-weight: bolder;";
	helpButton.onclick = () => {
		video.pause();
		alert(helpMessage);
	};
	document.body.append(helpButton);
};

function executeInstructions(instructions) {
	if (instructions !== undefined && instructions !== null) {
		for (let i = 0; i < instructions.length; i++) {
			console.log('StreamScript: executing "' + instructions[i].name + '" with arg "' + instructions[i].arg + '"');
			setTimeout(() => {
				actions[instructions[i].name](instructions[i].arg);
			});
		}
	}
}

let messages;

chrome.runtime.sendMessage({msg: null}, (msgs) => {
	messages = msgs;

	if (document.contentType.startsWith("video/")) {
		actions.addVideoControls();
	} else {
		chrome.runtime.sendMessage({msg: messages.GETINSTRUCTIONS, data: location.href}, (response) => {
			if (document.visibilityState === "visible") {
				executeInstructions(response);
				return;
			}
			let callback = () => {
				executeInstructions(response);
				document.removeEventListener("visibilitychange", callback);
			};
			document.addEventListener("visibilitychange", callback);
		});
	}
});
