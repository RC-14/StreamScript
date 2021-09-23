const updateChecker = new UpdateChecker("https://github.com/RC-14/StreamScript/releases/latest");
const instructionsManager = new InstructionsManager(
	"https://raw.githubusercontent.com/RC-14/StreamScript/main/instructions.json",
	600000 // 10min
);
const videoManager = new VideoManager(43200000, 60000); // 12h, 1min

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
