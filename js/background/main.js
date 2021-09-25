const messages = {};
messages.getInstrutions = "getInstructions";
messages.redirectToVideoSrc = "redirectToVideoSrc";
messages.setLastTime = "setLastTime";
messages.getLastTime = "getLastTime";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const message = request.msg;
	const data = request.data;
	var response;

	switch (message) {
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

		default:
			console.warn("Unnknown message: " + message);
			break;
	}

	sendResponse(response);
});
