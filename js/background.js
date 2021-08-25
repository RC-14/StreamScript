class UpdateChecker {
	constructor(url, intervalTimeout = 300000) {
		if (typeof url !== "string") {
			throw new Error("UpdateChecker.constructor: type of arg 1 is not string");
		} else if (typeof intervalTimeout !== "number") {
			throw new Error("UpdateChecker.constructor: type of arg 2 is not number");
		}
		this.url = url; // the URL to the latest github release
		this.currentVersion = chrome.runtime.getManifest().version;
		this.latestVersion;
		this.getLatestVersion();

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];

		this.addInterval();
	}

	getLatestVersion() {
		return new Promise((resolve, reject) => {
			var request = new XMLHttpRequest();
			// get HTML of the GitHub page of the latest release
			request.open("GET", this.url);
			request.setRequestHeader("pragma", "no-cache");
			request.setRequestHeader("cache-control", "no-cache");
			request.onreadystatechange = () => {
				let status = request.status;
				if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
					if (!(status >= 200 && status < 400)) {
						request.abort();
						reject();
					}
				} else if (request.readyState === XMLHttpRequest.DONE) {
					if (status >= 200 && status < 400) {
						// get latest version from title
						this.latestVersion = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];
						// check if the installed version is also the latest version on github (ignore check if this is a devBuild)
						resolve(this.latestVersion);
					}
				}
			};
			request.send();
		});
	}

	get isNewVersionAvailable() {
		if (typeof this.latestVersion !== "string") return false;

		for (let i = 0; i < this.currentVersion.split(".").length; i++) {
			// check if the . sepertated values are valid numbers
			if (!(isNaN(Number(this.currentVersion.split(".")[i])) || isNaN(Number(this.latestVersion.split(".")[i])))) {
				if (Number(this.currentVersion.split(".")[i]) < Number(this.latestVersion.split(".")[i])) {
					return true;
				}
			}
		}

		return false;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		if (typeof intervalTimeout !== "number") {
			throw new Error("UpdateChecker.addInterval: type of arg 1 is not number");
		}
		this.intervalTimeout = intervalTimeout;
		this.intervalIDs[this.intervalIDs.length] = setInterval(this.getLatestVersion, intervalTimeout);
		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		if (typeof index !== "number") {
			throw new Error("UpdateChecker.clearInterval: type of arg 1 is not number");
		}
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

class InstructionsManager {
	constructor(url, intervalTimeout) {
		if (typeof url !== "string") {
			throw new Error("InstructionsManager.constructor: type of arg 1 is not string");
		} else if (typeof intervalTimeout !== "number") {
			throw new Error("InstructionsManager.constructor: type of arg 2 is not number");
		}
		this.url = url;
		this.localURL = chrome.runtime.getURL("instructions.json");
		this.instructions;
		this.useOfflineInstructions();
		this.getLatestInstructions();

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];

		this.addInterval();
	}

	generateAllWildcardDomains(domain) {
		if (typeof domain !== "string") {
			throw new Error("InstructionsManager.generateAllWildcardDomains: type of arg 1 is not string");
		} else if (!domain.match(/^([a-z0-9\-]+\.)*[a-z0-9]+$/gi)) {
			throw new Error("InstructionsManager.generateAllWildcardDomains: arg 1 is not a valid domain");
		}
		let result = [];
		for (let i = 1; i < domain.split(".").length; i++) {
			var tmpDomain = domain.split(".");

			for (let j = 0; j < i; j++) tmpDomain[j] = "*";
			tmpDomain = tmpDomain.join(".");

			result.push(tmpDomain);
		}
		return result;
	}

	generateAllWildcardPaths(path) {
		if (typeof path !== "string") {
			throw new Error("InstructionsManager.generateAllWildcardPaths: type of arg 1 is not string");
		}

		path = path.replace(/\/$/g, "");

		var tmp = path.split("/")[path.split("/").length - 1].split(".");
		const suffix = tmp[tmp.length - 1] !== path.split("/")[path.split("/").length - 1] ? tmp[tmp.length - 1] : "";

		let result = [];

		if (suffix) {
			for (let i = 0; i < path.replace(/^\//g, "").split("/").length; i++) {
				var tmpPath = path.replace(/^\//g, "").split("/");

				for (let j = 0; j <= i; j++) tmpPath[tmpPath.length - 1 - j] = "*";

				tmpPath = "/" + tmpPath.join("/") + "." + suffix;

				result.push(tmpPath);
			}
		}

		for (let i = 0; i < path.replace(/^\//g, "").split("/").length; i++) {
			var tmpPath = path.replace(/^\//g, "").split("/");

			for (let j = 0; j <= i; j++) tmpPath[tmpPath.length - 1 - j] = "*";

			tmpPath = "/" + tmpPath.join("/");

			result.push(tmpPath);
		}

		return result;
	}

	setInstructions(instructions) {
		if (typeof instructions === "string") {
			instructions = JSON.parse(instructions);
		} else if (typeof instructions !== "object") {
			throw new Error("InstructionsManager.setInstructions: type of arg 1 is not string or object");
		}
		this.instructions = instructions;
	}

	getInstructionsForURL(url) {
		if (typeof url !== "string") {
			throw new Error("InstructionsManager.getInstructionsForURL: type of arg 1 is not string");
		}
		function getKeyWithGenerator(obj, input, generator) {
			let result = null;
			if (obj[input]) {
				result = input;
			} else if (input !== "") {
				var generatedKeys = generator(input);
				for (let i = 0; i < generatedKeys.length; i++) {
					if (obj[generatedKeys[i]]) {
						result = generatedKeys[i];
						break;
					}
				}
			} else {
				return null;
			}

			while (typeof obj[result] === "string") {
				result = obj[result];
			}

			if (typeof obj[result] !== "object") {
				return null;
			}

			return result;
		}

		const protocol = url.split("://")[0];

		const host = protocol !== "file" ? url.split("://")[1].match(/^([a-z0-9\-]+\.)*[a-z0-9\-]+/gi)[0] : "";

		var tmp = url
			.split(host ? host : ":///")[1]
			.split("#")[0]
			.split("?")[0]
			.replace(/\/$/g, "");
		const path = tmp.match(/^\/.+/g) ? tmp : "";

		let instructions = null;

		let domainKey = getKeyWithGenerator(this.instructions, host, this.generateAllWildcardDomains);
		if (domainKey === null) return instructions;

		let pathKey = getKeyWithGenerator(this.instructions[domainKey], path, this.generateAllWildcardPaths);
		if (pathKey === null) return instructions;

		instructions = this.instructions[domainKey][pathKey];

		if (updateChecker.isNewVersionAvailable) {
			instructions.reverse();
			instructions[instructions.length] = {name: "showNewVersionAlert", arg: updateChecker.latestVersion};
			instructions.reverse();
		}

		return instructions;
	}

	useOfflineInstructions() {
		return new Promise((resolve, reject) => {
			var request = new XMLHttpRequest();
			request.open("GET", this.localURL);
			request.onreadystatechange = () => {
				if (request.readyState === XMLHttpRequest.DONE) {
					this.setInstructions(request.responseText);
					resolve();
				}
			};
			request.send();
		});
	}

	getLatestInstructions() {
		return new Promise((resolve, reject) => {
			var request = new XMLHttpRequest();
			request.open("GET", this.url);
			request.setRequestHeader("pragma", "no-cache");
			request.setRequestHeader("cache-control", "no-cache");
			request.onreadystatechange = () => {
				let status = request.status;
				if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
					if (!(status >= 200 && status < 400)) {
						request.abort();
						reject();
					}
				} else if (request.readyState === XMLHttpRequest.DONE) {
					if (status >= 200 && status < 400) {
						this.setInstructions(request.responseText);
						resolve();
					}
				}
			};
			request.send();
		});
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		if (typeof intervalTimeout !== "number") {
			throw new Error("InstructionsManager.addInterval: type of arg 1 is not number");
		}
		this.intervalTimeout = intervalTimeout;
		this.intervalIDs[this.intervalIDs.length] = setInterval(this.getLatestInstructions, intervalTimeout);
		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		if (typeof index !== "number") {
			throw new Error("InstructionsManager.clearInterval: type of arg 1 is not number");
		}
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

class VideoManager {
	constructor(maxCachedTimeAge, intervalTimeout) {
		if (typeof maxCachedTimeAge !== "number") {
			throw new Error("VideoManager.constructor: type of arg 1 is not number");
		} else if (typeof intervalTimeout !== "number") {
			throw new Error("VideoManager.constructor: type of arg 2 is not number");
		}
		this.maxCachedTimeAge = maxCachedTimeAge;
		this.intervalTimeout = intervalTimeout;

		this.ulrsForSrcs = {}; // { src: url, ... }
		this.timeCache = {}; // { url: {time, timestamp}, ... }
		this.intervalIDs = [];

		this.addInterval();
	}

	setUrlForSrc(url, src) {
		if (typeof url !== "string") {
			throw new Error("VideoManager.setUrlForSrc: type of arg 1 is not string");
		} else if (typeof src !== "string") {
			throw new Error("VideoManager.setUrlForSrc: type of arg 2 is not string");
		}
		this.ulrsForSrcs[src] = url;
	}

	setLastTime(src, time) {
		if (typeof src !== "string") {
			throw new Error("VideoManager.setLastTime: type of arg 1 is not string");
		} else if (typeof time !== "number") {
			throw new Error("VideoManager.setLastTime: type of arg 2 is not number");
		}
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		this.timeCache[url] = {time, timestamp: Date.now()};
	}

	getLastTime(src) {
		if (typeof src !== "string") {
			throw new Error("VideoManager.getLastTime: type of arg 1 is not string");
		}
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		let time = null;
		if (this.timeCache[url] !== undefined) time = this.timeCache[url].time;

		return time;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		if (typeof intervalTimeout !== "number") {
			throw new Error("VideoManager.addInterval: type of arg 1 is not number");
		}
		this.intervalTimeout = intervalTimeout;

		let videoManager = this;
		this.intervalIDs[this.intervalIDs.length] = setInterval(() => {
			let urls = Object.keys(videoManager.timeCache);

			let newTimeCache = {};

			for (let i = 0; i < urls.length; i++) {
				if (Date.now() - videoManager.maxCachedTimeAge < videoManager.timeCache[urls[i]].timestamp) {
					newTimeCache[urls[i]] = videoManager.timeCache[urls[i]];
				}
			}

			videoManager.timeCache = newTimeCache;
		}, intervalTimeout);

		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		if (typeof index !== "number") {
			throw new Error("VideoManager.clearInterval: type of arg 1 is not number");
		}
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

const updateChecker = new UpdateChecker("https://github.com/RC-14/StreamScript/releases/latest");
const instructionsManager = new InstructionsManager("https://raw.githubusercontent.com/RC-14/StreamScript/main/instructions.json", 600000);
const videoManager = new VideoManager(43200000, 600000); // 12h, 1min

const messages = {};
messages.getInstrutions = "getInstructions";
messages.redirectToVideoSrc = "redirectToVideoSrc";
messages.setLastTime = "setLastTime";
messages.getLastTime = "getLastTime";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	let msg = request.msg;
	let data = request.data;
	var response;

	switch (msg) {
		case null:
			response = messages;
			break;

		case messages.getInstrutions:
			response = instructionsManager.getInstructionsForURL(data);
			break;

		case messages.redirectToVideoSrc:
			videoManager.setUrlForSrc(data.url, data.src);
			break;

		case messages.setLastTime:
			videoManager.setLastTime(data.url, data.time);
			break;

		case messages.getLastTime:
			response = videoManager.getLastTime(data);
			break;
	}

	sendResponse(response);
});
