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
