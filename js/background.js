/*
 * ideas for usage:
 * -resume to a cached time after getting a new URL
 * -getting new URLs automatically
 */

function getLatestVersion() {
	var request = new XMLHttpRequest();
	// get HTML of the GitHub page of the latest release with a synchronous XMLHTTPRequest
	request.open("GET", "https://github.com/RC-14/StreamScript/releases/latest", false);
	request.send(null);

	var latest = request.responseText.split(/<\/?title>/g)[1].match(/v\d(\.\d+){2}/g)[0];

	return latest;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.msg) {
		case "getLatestVersion":
			console.log("getLatestVersion");
			var latest = getLatestVersion();
			console.log("latest: " + latest);
			sendResponse(latest);
			break;

		default:
			break;
	}
});
