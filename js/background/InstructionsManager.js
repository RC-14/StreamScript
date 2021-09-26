const instructionsManager = {};
instructionsManager.url = new URL("https://raw.githubusercontent.com/RC-14/StreamScript/main/instructions.json");
instructionsManager.localURL = new URL(chrome.runtime.getURL("instructions.json"));
instructionsManager.instructions;

instructionsManager.intervalTimeout = 600000; // 10min
instructionsManager.intervalIDs = [];

instructionsManager.generateAllWildcardDomains = (domain) => {
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
};
instructionsManager.generateAllWildcardPaths = (path) => {
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
};

instructionsManager.setInstructions = (instructions) => {
	if (typeof instructions === "string") {
		instructions = JSON.parse(instructions);
	} else if (typeof instructions !== "object") {
		throw new Error("InstructionsManager.setInstructions: type of arg 1 is not string or object");
	}
	instructionsManager.instructions = instructions;
};
instructionsManager.getInstructionsForURL = (url) => {
	if (typeof url !== "string" && typeof url !== "object") {
		throw new Error("InstructionsManager.getInstructionsForURL: type of arg 1 is not string or object");
	} else if (typeof url === "string") {
		try {
			url = new URL(url);
		} catch (error) {
			throw new Error("InstructionsManager.getInstructionsForURL: arg 1 is not a URL");
		}
	} else if (typeof url === "object") {
		try {
			url = new URL(url.href);
		} catch (error) {
			throw new Error("InstructionsManager.getInstructionsForURL: arg 1 is not a URL");
		}
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

	let instructions = null;

	let domainKey = getKeyWithGenerator(instructionsManager.instructions, url.host, instructionsManager.generateAllWildcardDomains);
	if (domainKey === null) return instructions;

	let pathKey = getKeyWithGenerator(
		instructionsManager.instructions[domainKey],
		url.pathname.replace(/\/$/g, ""),
		instructionsManager.generateAllWildcardPaths
	);
	if (pathKey === null) return instructions;

	instructions = instructionsManager.instructions[domainKey][pathKey];

	if (updateChecker.checkIfNewVersionIsAvailable()) {
		instructions.reverse();
		instructions[instructions.length] = { name: "showNewVersionAlert", arg: updateChecker.latestVersion };
		instructions.reverse();
	}

	return instructions;
};

instructionsManager.getOfflineInstructions = () => {
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", instructionsManager.localURL.href);
		request.onreadystatechange = () => {
			if (request.readyState === XMLHttpRequest.DONE) {
				instructionsManager.setInstructions(request.responseText);
				resolve();
			}
		};
		request.send();
	});
};
instructionsManager.useOfflineInstructions = () => {
	while (instructionsManager.intervalIDs.length > 0) {
		instructionsManager.clearInterval();
	}
	instructionsManager.getOfflineInstructions();
};

instructionsManager.getLatestInstructions = () => {
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", instructionsManager.url.href);
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
					instructionsManager.setInstructions(request.responseText);
					resolve();
				}
			}
		};
		request.send();
	});
};
instructionsManager.useLatestInstructions = () => {
	instructionsManager.getLatestInstructions();
	instructionsManager.addInterval();
};

instructionsManager.addInterval = (intervalTimeout = instructionsManager.intervalTimeout) => {
	if (typeof intervalTimeout !== "number") {
		throw new Error("InstructionsManager.addInterval: type of arg 1 is not number");
	} else if (intervalTimeout < 0) {
		throw new Error("InstructionsManager.addInterval: arg 1 can't be lower than 0");
	}
	instructionsManager.intervalTimeout = intervalTimeout;
	instructionsManager.intervalIDs[instructionsManager.intervalIDs.length] = setInterval(
		instructionsManager.getLatestInstructions,
		intervalTimeout
	);
	return instructionsManager.intervalIDs[instructionsManager.intervalIDs.length - 1];
};
instructionsManager.clearInterval = (index = 0) => {
	if (typeof index !== "number") {
		throw new Error("InstructionsManager.clearInterval: type of arg 1 is not number");
	} else if (intervalTimeout < 0) {
		throw new Error("InstructionsManager.clearInterval: arg 1 can't be lower than 0");
	}
	clearInterval(instructionsManager.intervalIDs.splice(index, 1)[0]);
};

instructionsManager.useOfflineInstructions();
instructionsManager.useLatestInstructions();
