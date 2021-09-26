const updateChecker = {};
updateChecker.url = new URL("https://github.com/RC-14/StreamScript/releases/latest"); // the URL to the latest github release
updateChecker.currentVersion = chrome.runtime.getManifest().version;
updateChecker.latestVersion;

updateChecker.intervalTimeout = 300000;
updateChecker.intervalIDs = [];

updateChecker.getLatestVersion = () => {
	return new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		// get HTML of the GitHub page of the latest release
		request.open("GET", updateChecker.url.href);
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
					updateChecker.latestVersion = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];
					// check if the installed version is also the latest version on github (ignore check if updateChecker is a devBuild)
					resolve(updateChecker.latestVersion);
				}
			}
		};
		request.send();
	});
};

updateChecker.checkIfNewVersionIsAvailable = () => {
	if (typeof updateChecker.latestVersion !== "string") return false;

	for (let i = 0; i < updateChecker.currentVersion.split(".").length; i++) {
		// check if the . sepertated values are valid numbers
		if (!(isNaN(Number(updateChecker.currentVersion.split(".")[i])) || isNaN(Number(updateChecker.latestVersion.split(".")[i])))) {
			if (Number(updateChecker.currentVersion.split(".")[i]) < Number(updateChecker.latestVersion.split(".")[i])) {
				return true;
			}
		}
	}

	return false;
};

updateChecker.addInterval = (intervalTimeout = updateChecker.intervalTimeout) => {
	if (typeof intervalTimeout !== "number") {
		throw new Error("UpdateChecker.addInterval: type of arg 1 is not number");
	} else if (intervalTimeout < 0) {
		throw new Error("UpdateChecker.addInterval: arg 1 can't be lower than 0");
	}
	updateChecker.intervalTimeout = intervalTimeout;
	updateChecker.intervalIDs[updateChecker.intervalIDs.length] = setInterval(updateChecker.getLatestVersion, intervalTimeout);
	return updateChecker.intervalIDs[updateChecker.intervalIDs.length - 1];
};

updateChecker.clearInterval = (index = 0) => {
	if (typeof index !== "number") {
		throw new Error("UpdateChecker.clearInterval: type of arg 1 is not number");
	} else if (intervalTimeout < 0) {
		throw new Error("UpdateChecker.clearInterval: arg 1 can't be lower than 0");
	}
	clearInterval(updateChecker.intervalIDs.splice(index, 1)[0]);
};
