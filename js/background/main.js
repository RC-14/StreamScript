const messages = {};
messages.getInstrutions = "getInstructions";
messages.setUrlSrcPair = "setUrlSrcPair";
messages.getSrcForUrl = "getSrcForUrl";
messages.waitForSrcForUrl = "waitForSrcForUrl";
messages.setLastTime = "setLastTime";
messages.getLastTime = "getLastTime";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const message = request.msg;
	const data = request.data;
	var response = undefined;
	var doSendResponse = true;

	switch (message) {
		case null:
			response = messages;
			break;

		case messages.getInstrutions:
			response = instructionsManager.getInstructionsForURL(data);
			break;

		case messages.setUrlSrcPair:
			videoManager.setUrlSrcPair(data.url, data.src);
			break;

		case messages.getSrcForUrl:
			videoManager.getSrcForUrl(data);
			break;

		case messages.waitForSrcForUrl:
			doSendResponse = false;

			videoManager.waitForSrcForUrl(data).then(sendResponse, () => {
				sendResponse("");
			});
			break;

		case messages.setLastTime:
			videoManager.setLastTime(data.url, data.time);
			break;

		case messages.getLastTime:
			response = videoManager.getLastTime(data);
			break;

		default:
			console.warn("Unnknown message: " + message);
			break;
	}

	if (doSendResponse) sendResponse(response);
});
