/*
 * ideas for usage:
 * -resume to a cached time after getting a new URL
 * -getting new URLs automatically
 */

async function getLatestVersion() {
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		// get HTML of the GitHub page of the latest release
		request.open("GET", "https://github.com/RC-14/StreamScript/releases/latest");
		request.onreadystatechange = () => {
			if (request.readyState === XMLHttpRequest.DONE) {
				// get latest version from title
				var latest = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];
				resolve(latest);
			}
		};
		request.send();
	});
	return promise;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.msg) {
		case checkForUpdate:
			console.log("getLatestVersion");
			getLatestVersion().then(sendResponse);
			break;

		default:
			break;
	}
});
