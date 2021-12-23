const videoManager = {};

videoManager.urlsForSrcs = {}; // { src: url, ... }
videoManager.srcsForURLs = {}; // { url: src, ... }

videoManager.srcForUrlQueue = []; // [ { url: "...", resolve: function resolve }, ...]

videoManager.timeCache = {}; // { url: {time, timestamp}, ... }
videoManager.maxCachedTimeAge = 43200000; // 12h

videoManager.intervalTimeout = 60000; // 1min
videoManager.intervalIDs = [];

videoManager.setUrlSrcPair = (url, src) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.setUrlSrcPair: type of arg 1 is not string");
	} else if (typeof src !== "string") {
		throw new Error("VideoManager.setUrlSrcPair: type of arg 2 is not string");
	}

	videoManager.removeByUrl(url);

	videoManager.srcsForURLs[url] = src;
	videoManager.urlsForSrcs[src] = url;

	let resolved = [];

	for (let i = 0; i < videoManager.srcForUrlQueue.length; i++) {
		if (videoManager.srcForUrlQueue[i]?.url !== url) continue;

		videoManager.srcForUrlQueue[i]?.resolve(src);
		resolved.push(i);
	}

	resolved.reverse(); // remove entries with highest index first because the others wouldn't be correct anymore if we remove entries with a lower index first

	for (let i = 0; i < resolved.length; i++) {
		clearTimeout(videoManager.srcForUrlQueue[resolved[i]].timeoutID);
		videoManager.srcForUrlQueue.splice(resolved[i], 1); // remove the entry from the queue
	}
};

videoManager.getSrcForUrl = (url) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.getSrcForUrl: type of arg 1 is not string");
	}

	return videoManager.srcsForURLs[url];
};
videoManager.getUrlForSrc = (src) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.getUrlForSrc: type of arg 1 is not string");
	}

	return videoManager.urlsForSrcs[src];
};

videoManager.waitForSrcForUrl = (url) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.getUrlForSrc: type of arg 1 is not string");
	}

	return new Promise((resolve, reject) => {
		let entry = {
			url,
			resolve,
			timeoutID: -1,
		};

		let index = videoManager.srcForUrlQueue.push(entry) - 1; // add entry to the queue and remember its position

		entry.timeoutID = setTimeout(() => {
			videoManager.srcForUrlQueue.splice(index, 1); // remove entry from queue

			reject("Waited 5 minutes");
		}, 300000 /* 5 minutes */);
	});
};

videoManager.removeByUrl = (url) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.removeByUrl: type of arg 1 is not string");
	}
	delete videoManager.urlsForSrcs[videoManager.srcsForURLs[url]];
	delete videoManager.srcsForURLs[url];
};
videoManager.removeBySrc = (src) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.removeBySrc: type of arg 1 is not string");
	}
	delete videoManager.srcsForURLs[videoManager.urlsForSrcs[src]];
	delete videoManager.urlsForSrcs[src];
};

videoManager.setLastTime = (src, time) => {
	if (typeof src !== "string") {
		throw new Error("VideoManager.setLastTime: type of arg 1 is not string");
	} else if (typeof time !== "number") {
		throw new Error("VideoManager.setLastTime: type of arg 2 is not number");
	}
	let url = videoManager.urlsForSrcs[src];
	if (url === undefined) url = src;

	videoManager.timeCache[url] = { time, timestamp: Date.now() };
};
videoManager.getLastTime = (src) => {
	if (typeof src !== "string") {
		throw new Error("VideoManager.getLastTime: type of arg 1 is not string");
	}
	let url = videoManager.urlsForSrcs[src];
	if (url === undefined) url = src;

	let time = null;
	if (videoManager.timeCache[url] !== undefined) time = videoManager.timeCache[url].time;

	return time;
};

videoManager.addInterval = (intervalTimeout = videoManager.intervalTimeout) => {
	if (typeof intervalTimeout !== "number") {
		throw new Error("VideoManager.addInterval: type of arg 1 is not number");
	}
	videoManager.intervalTimeout = intervalTimeout;

	let videoManager = videoManager;
	videoManager.intervalIDs[videoManager.intervalIDs.length] = setInterval(() => {
		let urls = Object.keys(videoManager.timeCache);

		let newTimeCache = {};

		for (let i = 0; i < urls.length; i++) {
			if (Date.now() - videoManager.maxCachedTimeAge < videoManager.timeCache[urls[i]].timestamp) {
				newTimeCache[urls[i]] = videoManager.timeCache[urls[i]];
			}
		}

		videoManager.timeCache = newTimeCache;
	}, intervalTimeout);

	return videoManager.intervalIDs[videoManager.intervalIDs.length - 1];
};
videoManager.clearInterval = (index = 0) => {
	if (typeof index !== "number") {
		throw new Error("VideoManager.clearInterval: type of arg 1 is not number");
	}
	clearInterval(videoManager.intervalIDs.splice(index, 1)[0]);
};
