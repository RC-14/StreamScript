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
						resolve(true);
					} else {
						resolve(false);
					}
				}
			};
			request.send();
		});
		return promise;
	}

	var host = location.pathname.split("?")[0].split("#")[0].endsWith(".mp4") ? "*/*.mp4" : location.host.replace(/.+(\.vivo.sx)/g, "*$1");

	var getVideoSrc;

	if (host === "vivo.sx" || host === "vidoza.net") {
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
	} else if (host === "streamta.pe" || host === "streamtape.com" || host === "streamtape.site" || host === "strtape.tech") {
		// streamtape
		getVideoSrc = async () => {
			var result = new Promise((resolve, reject) => {
				if (document.getElementsByClassName("plyr-overlay").length > 0) {
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
	} else if (host === "voe.sx") {
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
	} else if (host === "*/*.mp4" || host === "*.vivo.sx") {
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

			var fullscreenButton = document.createElement("button");
			fullscreenButton.onclick = fullscreenFunction;
			fullscreenButton.textContent = "Fullscreen = F";
			document.body.appendChild(fullscreenButton);

			document.body.appendChild(document.createElement("br"));

			var skipOpeningButton = document.createElement("button");
			skipOpeningButton.onclick = skipOpeningFunction;
			skipOpeningButton.textContent = "Skip Opening = S";
			document.body.appendChild(skipOpeningButton);

			document.addEventListener(
				"keydown",
				(key) => {
					if (key.code === "KeyF") {
						fullscreenFunction();
					} else if (key.code === "KeyS") {
						skipOpeningFunction();
					}
				},
				false
			);
		}
	}

	if (getVideoSrc !== undefined) {
		var id = setTimeout(() => {
			getVideoSrc().then((videoSrc) => {
				if (videoSrc !== "") {
					checkIfUrlAvailabe(videoSrc).then((available) => {
						if (available) {
							open(videoSrc, "_self");
						} else {
							window.location.reload();
						}
					});
				}
			});
		}, 100);
	}
} else if (document.getElementById("StreamScriptExecuted") !== null) {
	console.log("StreamScript: already executed");
}
