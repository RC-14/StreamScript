function executeInstructions(instructions) {
	if (typeof instructions === "object" && instructions !== null) {
		for (let i = 0; i < instructions.length; i++) {
			console.log('StreamScript: executing "' + instructions[i].name + '" with arg "' + instructions[i].arg + '"');
			setTimeout(() => {
				actions[instructions[i].name](instructions[i].arg);
			});
		}
	}
}

var messages;

chrome.runtime.sendMessage({ msg: null }, (messages) => {
	window.messages = messages;

	if (document.contentType.startsWith("video/")) {
		actions.addVideoControls();
	} else {
		chrome.runtime.sendMessage({ msg: messages.getInstrutions, data: location.href }, (response) => {
			if (document.visibilityState === "visible") {
				executeInstructions(response);
				return;
			}

			let callback = () => {
				executeInstructions(response);
				document.removeEventListener("visibilitychange", callback);
			};
			document.addEventListener("visibilitychange", callback);
		});
	}
});
