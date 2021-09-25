const videoManager = {};

videoManager.ulrsForSrcs = {}; // { src: url, ... }
videoManager.srcsForURLs = {}; // { url: src, ... }

videoManager.timeCache = {}; // { url: {time, timestamp}, ... }
videoManager.maxCachedTimeAge = 43200000; // 12h

videoManager.intervalTimeout = 60000; // 1min
videoManager.intervalIDs = [];

videoManager.setUrlForSrc = (url, src) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.setUrlForSrc: type of arg 1 is not string");
	} else if (typeof src !== "string") {
		throw new Error("VideoManager.setUrlForSrc: type of arg 2 is not string");
	}
	videoManager.ulrsForSrcs[src] = url;
	if (videoManager.srcsForURLs[url]) {
		videoManager.srcsForURLs[url] = src;
	}
};
videoManager.setSrcForUrl = (src, url) => {
	if (typeof url !== "string") {
		throw new Error("VideoManager.setUrlForSrc: type of arg 1 is not string");
	} else if (typeof src !== "string") {
		throw new Error("VideoManager.setUrlForSrc: type of arg 2 is not string");
	}
	videoManager.srcsForURLs[url] = src;
	if (videoManager.ulrsForSrcs[src]) {
		videoManager.ulrsForSrcs[src] = url;
	}
};

videoManager.setLastTime = (src, time) => {
	if (typeof src !== "string") {
		throw new Error("VideoManager.setLastTime: type of arg 1 is not string");
	} else if (typeof time !== "number") {
		throw new Error("VideoManager.setLastTime: type of arg 2 is not number");
	}
	let url = videoManager.ulrsForSrcs[src];
	if (url === undefined) url = src;

	videoManager.timeCache[url] = { time, timestamp: Date.now() };
};
videoManager.getLastTime = (src) => {
	if (typeof src !== "string") {
		throw new Error("VideoManager.getLastTime: type of arg 1 is not string");
	}
	let url = videoManager.ulrsForSrcs[src];
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
