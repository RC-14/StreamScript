class VideoManager {
	constructor(maxCachedTimeAge, intervalTimeout) {
		if (typeof maxCachedTimeAge !== "number") {
			throw new Error("VideoManager.constructor: type of arg 1 is not number");
		} else if (typeof intervalTimeout !== "number") {
			throw new Error("VideoManager.constructor: type of arg 2 is not number");
		}
		this.maxCachedTimeAge = maxCachedTimeAge;
		this.intervalTimeout = intervalTimeout;

		this.ulrsForSrcs = {}; // { src: url, ... }
		this.timeCache = {}; // { url: {time, timestamp}, ... }
		this.intervalIDs = [];

		this.addInterval();
	}

	setUrlForSrc(url, src) {
		if (typeof url !== "string") {
			throw new Error("VideoManager.setUrlForSrc: type of arg 1 is not string");
		} else if (typeof src !== "string") {
			throw new Error("VideoManager.setUrlForSrc: type of arg 2 is not string");
		}
		this.ulrsForSrcs[src] = url;
	}

	setLastTime(src, time) {
		if (typeof src !== "string") {
			throw new Error("VideoManager.setLastTime: type of arg 1 is not string");
		} else if (typeof time !== "number") {
			throw new Error("VideoManager.setLastTime: type of arg 2 is not number");
		}
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		this.timeCache[url] = { time, timestamp: Date.now() };
	}

	getLastTime(src) {
		if (typeof src !== "string") {
			throw new Error("VideoManager.getLastTime: type of arg 1 is not string");
		}
		let url = this.ulrsForSrcs[src];
		if (url === undefined) url = src;

		let time = null;
		if (this.timeCache[url] !== undefined) time = this.timeCache[url].time;

		return time;
	}

	addInterval(intervalTimeout = this.intervalTimeout) {
		if (typeof intervalTimeout !== "number") {
			throw new Error("VideoManager.addInterval: type of arg 1 is not number");
		}
		this.intervalTimeout = intervalTimeout;

		let videoManager = this;
		this.intervalIDs[this.intervalIDs.length] = setInterval(() => {
			let urls = Object.keys(videoManager.timeCache);

			let newTimeCache = {};

			for (let i = 0; i < urls.length; i++) {
				if (Date.now() - videoManager.maxCachedTimeAge < videoManager.timeCache[urls[i]].timestamp) {
					newTimeCache[urls[i]] = videoManager.timeCache[urls[i]];
				}
			}

			videoManager.timeCache = newTimeCache;
		}, intervalTimeout);

		return this.intervalIDs[this.intervalIDs.length - 1];
	}

	clearInterval(index = 0) {
		if (typeof index !== "number") {
			throw new Error("VideoManager.clearInterval: type of arg 1 is not number");
		}
		clearInterval(this.intervalIDs.splice(index, 1)[0]);
	}
}
