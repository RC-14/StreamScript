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

	var getVideoSrc;

	if (host === "vivo.sx/*" || host === "vidoza.net/*" || host === "mixdrop.co/*") {
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
	} else if (host === "streamta.pe/*" || host === "streamtape.com/*" || host === "streamtape.site/*" || host === "strtape.tech/*") {
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
	} else if (host === "*/*.mp4" || host === "*.vivo.sx/*") {
		// mp4 files

		var video = document.getElementsByTagName("video")[0];
		var openingLength = 90 - 3; // in seconds

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

			var fullscreenButton = document.createElement("button");
			fullscreenButton.onclick = fullscreenFunction;
			fullscreenButton.textContent = "Fullscreen = F";
			document.body.appendChild(fullscreenButton);

			document.body.appendChild(document.createElement("br"));

			var skipOpeningButton = document.createElement("button");
			skipOpeningButton.onclick = skipOpeningFunction;
			skipOpeningButton.textContent = "Skip Opening = S";
			document.body.appendChild(skipOpeningButton);

			document.body.appendChild(document.createElement("br"));

			var rewind10SecondsButton = document.createElement("button");
			rewind10SecondsButton.onclick = rewind10SecondsFunction;
			rewind10SecondsButton.textContent = "Rewind 10s = J";
			document.body.appendChild(rewind10SecondsButton);

			document.body.appendChild(document.createElement("br"));

			var pauseOrPlayButton = document.createElement("button");
			pauseOrPlayButton.onclick = pauseOrPlayFunction;
			pauseOrPlayButton.textContent = "Pause/Play = K";
			document.body.appendChild(pauseOrPlayButton);

			document.body.appendChild(document.createElement("br"));

			var skip10SecondsButton = document.createElement("button");
			skip10SecondsButton.onclick = skip10SecondsFunction;
			skip10SecondsButton.textContent = "Skip 10s = L";
			document.body.appendChild(skip10SecondsButton);

			document.addEventListener(
				"keydown",
				(key) => {
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

						default:
							break;
					}
				},
				false
			);
		}
	}

	if (getVideoSrc !== undefined) {
		setTimeout(() => {
			getVideoSrc().then((videoSrc) => {
				if (videoSrc !== "") {
					checkIfUrlAvailabe(videoSrc).then(
						() => {
							open(videoSrc, "_self");
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
