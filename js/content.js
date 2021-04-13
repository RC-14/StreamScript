const devBuild = false;
console.log("StreamScript: devBuild = " + devBuild);

// check for new version
(async () => {
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		// get HTML of the GitHub page of the latest release
		request.open("GET", "https://github.com/RC-14/StreamScript/releases/latest");
		request.onreadystatechange = () => {
			if (request.readyState === XMLHttpRequest.DONE) {
				// get installed version from manifest
				var version = chrome.runtime.getManifest().version;
				console.log("StreamScript: version = " + version);
				// get latest version from title
				var latest = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];
				console.log("StreamScript: latest = " + latest);
				// check if the installed version is also the latest version on github (ignore check if this is a devBuild)
				if (version !== latest.replace("v", "") && !devBuild) {
					resolve(latest);
				}
				reject();
			}
		};
		request.send();
	});
	return promise;
})().then((newVersion) => {
	alert("New version available: " + newVersion + "\nhttps://github.com/RC-14/StreamScript/releases/latest");
});

// if the browser is based on Chromium window.chrome won't be undefined
var isChromeBased = Boolean(window.chrome);

// only execute if this is the first execution since the page was loaded
if (document.getElementById("StreamScriptExecuted") === null) {
	// adding the StreamScriptExecuted div
	document.body.appendChild(
		(function (div) {
			div = document.createElement("div");
			div.id = "StreamScriptExecuted";
			return div;
		})()
	);

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

	var streamtapeDomains = ["streamta.pe", "streamtape.com", "streamtape.site", "strtape.tech", "strtape.cloud"];

	// make a host variable that's more usefull than location.host
	var host;
	if (location.pathname.endsWith(".mp4") && !streamtapeDomains.includes(location.host)) {
		host = "*/*.mp4";
	} else if (!(location.pathname === "/" || location.pathname === "")) {
		host = location.host + "/*";
	} else {
		host = location.host;
	}
	host = host.replace(/^.+(\.vivo.sx)/g, "*$1");
	console.log('StreamScript: host = "' + host + '"');

	var getVideoSrc;

	if (host === "vivo.sx/*" || host === "vidoza.net/*") {
		// general (works in most cases)
		getVideoSrc = () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByTagName("video").length > 0) {
					// get the source from the last video element from the page to void ads
					resolve(encodeURI(document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1].currentSrc));
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host.endsWith("/*") && streamtapeDomains.includes(host.replace(/\/\*$/g, ""))) {
		// Streamtape
		getVideoSrc = async () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByClassName("plyr").length) {
					// check if there is a overlay element and if not assume that "plyr" is the overlay
					var clickableClass = "plyr";
					if (document.getElementsByClassName("plyr-overlay").length) {
						clickableClass += "-overlay";
					}
					// click 2 times on the player overlay to make Streamtape add the source to the video
					document.getElementsByClassName(clickableClass)[0].click();
					document.getElementsByClassName(clickableClass)[0].click();

					// wait for a second to make sure the source is in the video and then get the source
					setTimeout(() => {
						var src = document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1].currentSrc;

						// append ".mp4" to the URL if necessary (required because streamtape sometimes gives us a URL without ".mp4" at the end)
						src = src.split("?")[0].endsWith(".mp4") ? src.split("?")[0] + ".mp4?" + src.split("?") : src;

						resolve(encodeURI(src));
					}, 1000);
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host === "voe.sx/*") {
		// voe
		getVideoSrc = () => {
			var result = new Promise((resolve, reject) => {
				if (document.body.innerHTML.split('"mp4": "').length > 0) {
					// voe stores the source in a script tag
					resolve(encodeURI(document.body.innerHTML.split('"mp4": "')[1].split('"')[0]));
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host === "mixdrop.co/*") {
		// Mixdrop
		getVideoSrc = async () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByClassName("vjs-big-play-button").length > 0) {
					// click 2 times on the play button to make Mixdrop add the source to the video
					document.getElementsByClassName("vjs-big-play-button")[0].click();
					document.getElementsByClassName("vjs-big-play-button")[0].click();
					// wait for a second to make sure the source is in the video and then get the source
					setTimeout(() => {
						resolve(encodeURI(document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1].currentSrc));
					}, 1000);
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host === "*/*.mp4" || host === "*.vivo.sx/*") {
		// mp4 files

		var video = document.getElementsByTagName("video")[0];

		var openingLength = 90 - 3; // in seconds

		// help message for the help button
		var helpMessage =
			"Video controls:\n" +
			[
				'"F" = Fullscreen on/off',
				'"S" = skip opening (87 seconds)',
				'"J" = rewind 10 Seconds',
				'"Space"/"K" = pause/play',
				'"L" = skip 10 seconds',
				'"O" = increase volume',
				'"I" = decrease volume',
				'"M" = mute/unmute',
			].join("\n");

		if (video !== undefined) {
			video.pause();
			video.currentTime = 0;

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

					case "Space":
						// firefox has this by default
						if (isChromeBased) {
							pauseOrPlayFunction();
						}
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
			helpButton.style = "position: fixed; background-color: grey; border-color: darkgrey; border-radius: 10px; font-size: 20px; font-weight: bolder;";
			helpButton.onclick = () => {
				video.pause();
				alert(helpMessage);
			};
			document.body.append(helpButton);
		}
	}

	if (getVideoSrc !== undefined) {
		setTimeout(() => {
			// self-explanatory
			getVideoSrc().then((videoSrc) => {
				if (devBuild) console.log("StreamScript: videoSrc = " + videoSrc);
				if (videoSrc !== "") {
					checkIfUrlAvailabe(videoSrc).then(
						() => {
							// if url is available redirect to it
							open(videoSrc, "_self", "noopener, noreferrer");
						},
						() => {
							// else reload to get a new source
							window.location.reload();
						}
					);
				}
			});
		}, 100);
	}
} else {
	console.log("StreamScript: already executed");
}
