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

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];

		this.useOfflineInstructions();
		this.useLatestInstructions();
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
			instructions[instructions.length] = { name: "showNewVersionAlert", arg: updateChecker.latestVersion };
			instructions.reverse();
		}

		return instructions;
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

	getOfflineInstructions() {
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

	useLatestInstructions() {
		this.getLatestInstructions().then(this.addInterval);
	}

	useOfflineInstructions() {
		while (this.intervalIDs !== 0) {
			this.clearInterval();
		}
		this.getOfflineInstructions();
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
