var isChromeBased = Boolean(window.chrome);
if (document.getElementById("StreamScriptExecuted") === null) {
	document.body.appendChild(
		(function (div) {
			div = document.createElement("div");
			div.id = "StreamScriptExecuted";
			return div;
		})()
	);

	function checkIfUrlAvailabe(url) {
		var promise = new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open("GET", url);
			request.onreadystatechange = () => {
				if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
					var status = request.status;
					request.abort();
					if (status === 0 || (status >= 200 && status < 400)) {
						resolve();
					} else {
						reject();
					}
				}
			};
			request.send();
		});
		return promise;
	}

	var host = location.pathname.split("?")[0].split("#")[0];
	if (host.endsWith(".mp4")) {
		host = "*/*.mp4";
	} else if (!(host === "/" || host === "")) {
		host = location.host + "/*";
	} else {
		host = location.host;
	}
	host = host.replace(/^.+(\.vivo.sx)/g, "*$1");
	console.log('StreamScript: host = "' + host + '"');

	var getVideoSrc;

	if (host === "vivo.sx/*" || host === "vidoza.net/*") {
		// general
		getVideoSrc = () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByTagName("video").length > 0) {
					resolve(encodeURI(document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1].currentSrc));
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host === "streamta.pe/*" || host === "streamtape.com/*" || host === "streamtape.site/*" || host === "strtape.tech/*" || host === "strtape.cloud/*") {
		// streamtape
		getVideoSrc = async () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByClassName("plyr-overlay").length > 0) {
					document.getElementsByClassName("plyr-overlay")[0].click();
					document.getElementsByClassName("plyr-overlay")[0].click();
					setTimeout(() => {
						resolve(encodeURI(document.getElementsByTagName("video")[document.getElementsByTagName("video").length - 1].currentSrc));
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
					resolve(encodeURI(document.body.innerHTML.split('"mp4": "')[1].split('"')[0]));
				} else {
					reject();
				}
			});
			return result;
		};
	} else if (host === "mixdrop.co/*") {
		// mixdrop
		getVideoSrc = async () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByClassName("vjs-big-play-button").length > 0) {
					document.getElementsByClassName("vjs-big-play-button")[0].click();
					document.getElementsByClassName("vjs-big-play-button")[0].click();
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
		video.pause();
		video.currentTime = 0;
		var openingLength = 90 - 3; // in seconds

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

		var helpButton = document.createElement("button");
		helpButton.textContent = "Help";
		helpButton.onclick = () => {
			video.pause();
			alert(helpMessage);
		};
		document.body.append(helpButton);

		if (video !== undefined) {
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
				} else if (video.volume < 1) {
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

			//add controls for keyboard
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
		}
	}

	if (getVideoSrc !== undefined) {
		setTimeout(() => {
			getVideoSrc().then((videoSrc) => {
				if (videoSrc !== "") {
					checkIfUrlAvailabe(videoSrc).then(
						() => {
							open(videoSrc, "_self", "noopener, noreferrer");
						},
						() => {
							window.location.reload();
						}
					);
				}
			});
		}, 100);
	}
} else if (document.getElementById("StreamScriptExecuted") !== null) {
	console.log("StreamScript: already executed");
}
