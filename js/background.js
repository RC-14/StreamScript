class UpdateChecker {
	constructor(url, intervalTimeout = 300000) {
		this.url = url;
		this.currentVersion = chrome.runtime.getManifest().version;
		this.latestVersion;
		this.getLatestVersion();

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];
	}

	getLatestVersion() {
		var promise = new Promise((resolve, reject) => {
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

		return promise;
	}

	get isNewVersionAvailable() {
		if (typeof this.latestVersion !== "string") return false;

		for (let i = 0; i < this.currentVersion.split(".").length; i++) {
			if (!(isNaN(Number(this.currentVersion.split(".")[i])) || isNaN(Number(this.latestVersion.split(".")[i])))) {
				if (Number(this.currentVersion.split(".")[i]) < Number(this.latestVersion.split(".")[i])) {
					return true;
				}
			}
		}

		return false;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		this.currentVersion = chrome.runtime.getManifest().version;
		this.intervalTimeout = intervalTimeout;
		this.intervalIDs[this.intervalIDs.length] = setInterval(this.getLatestVersion, intervalTimeout);
		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

class InstructionsManager {
	constructor(url, intervalTimeout) {
		this.url = url;
		this.localURL = chrome.runtime.getURL("instructions.json");
		this.instructions = undefined;
		this.useOfflineInstructions();
		this.getLatestInstructions();

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];
	}

	generateAllWildcardDomains(domain) {
		if (typeof domain !== "string") {
			throw new Error("InstructionsManager.generateAllWildcardDomains: type of domain is not string");
		} else if (!domain.match(/^([a-z0-9\-]+\.)*[a-z0-9]+$/gi)) {
			throw new Error("InstructionsManager.generateAllWildcardDomains: domain is not a valid domain");
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
			throw new Error("InstructionsManager.generateAllWildcardPaths: type of path is not string");
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
			throw new Error("InstructionsManager.setInstructions: type of instructions is not string or object");
		}
		this.instructions = instructions;
	}

	getInstrutionsForURL(url) {
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
		var promise = new Promise((resolve, reject) => {
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

		return promise;
	}

	getLatestInstructions() {
		var promise = new Promise((resolve, reject) => {
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

		return promise;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		this.intervalTimeout = intervalTimeout;
		this.intervalIDs[this.intervalIDs.length] = setInterval(this.getLatestInstructions, intervalTimeout);
		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

class VideoManager {
	constructor(maxCachedTimeAge, intervalTimeout) {
		this.maxCachedTimeAge = maxCachedTimeAge;
		this.intervalTimeout = intervalTimeout;

		this.ulrsForSrcs = {}; // src: url
		this.timeCache = {}; // url: {time, timestamp}
		this.intervalIDs = [];

		this.addInterval();
	}

	setUrlForSrc(url, src) {
		this.ulrsForSrcs[src] = url;
	}

	setLastTime(src, time) {
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		this.timeCache[url] = {time, timestamp: Date.now()};
	}

	getLastTime(src) {
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		let time = null;
		if (this.timeCache[url] !== undefined) time = this.timeCache[url].time;

		return time;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		this.intervalTimeout = intervalTimeout;

		let videoManager = this;
		this.intervalIDs[this.intervalIDs.length] = setInterval(() => {
			let urls = Object.keys(videoManager.timeCache);

			for (let i = 0; i < urls.length; i++) {
				if (Date.now() - videoManager.maxCachedTimeAge > videoManager.timeCache[urls[i]].timestamp) {
					videoManager.timeCache[urls[i]] = undefined;
				}
			}
		}, intervalTimeout);

		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

const updateChecker = new UpdateChecker("https://github.com/RC-14/StreamScript/releases/latest");
const instructionsManager = new InstructionsManager("https://raw.githubusercontent.com/RC-14/StreamScript/main/instructions.json", 600000);
const videoManager = new VideoManager(18000000, 30000); // 5h, 30s

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
			response = instructionsManager.getInstrutionsForURL(data);
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
