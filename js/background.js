/*
 * ideas for usage:
 * -resume to a cached time after getting a new URL
 * -getting new URLs automatically
 */

class UpdateChecker {
	constructor(url, intervalTimeout = 1800000) {
		this.url = url;
		this.latestVersionString;
		this.getLatestVersion();

		this.intervalTimeout = intervalTimeout;
		this.intervalIDs = [];
	}

	getLatestVersion() {
		var promise = new Promise((resolve, reject) => {
			var request = new XMLHttpRequest();
			// get HTML of the GitHub page of the latest release
			request.open("GET", this.url);
			request.onreadystatechange = () => {
				if (request.readyState === XMLHttpRequest.DONE) {
					// get latest version from title
					this.latestVersionString = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];
					// check if the installed version is also the latest version on github (ignore check if this is a devBuild)
					resolve(this.latestVersionString);
				}
			};
			request.send();
		});

		return promise;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		this.intervalTimeout = intervalTimeout;
		this.intervalIDs[this.intervalIDs.length] = setInterval(this.getLatestVersion, intervalTimeout);
		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index) {
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}

const updateChecker = new UpdateChecker("https://github.com/RC-14/StreamScript/releases/latest");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.msg) {
		case "getLatestVersion":
			console.log("getLatestVersion");
			console.log("latest: " + updateChecker.latestVersionString);
			sendResponse(updateChecker.latestVersionString);
			break;

		default:
			break;
	}
});
