# StreamScript

## __TODO:__
---
* __README__
  * [x] Create a README
  * [x] Add a TODO list
  * [ ] Add an introduction
  * [ ] Add an installation guide
    * [ ] Mozilla Firefox
    * [ ] Google Chrome
  * [ ] Add a feature list
  * [ ] Add an Overview
  * [ ] Add a Q&A
  * [ ] Add a guide for `instructions.json`

---

* __Switch from JavaScript to TypeScript__
  * [ ] Learn TypeScript (good enough...)
  * [ ] Final decision - JS: to YEET or not to yeet
  * [ ] Actually switch or remove this TODO list

---

* __Add a video player__
  * [x] Create the basic files (index.html, main.js, style.css)
  * [x] Change how VideoManager works
    * [x] Make a second object (and function) for URLs and sources to find the latest source for a URL
    * [x] Ensure that there is only one source per URL (and vice versa) in the objects
  * [x] Load the video from `location.search` into the video element
    * [x] ~~Load the url into an iframe~~ Check the MIMEType of the URL
    * [x] If the MIME-Type is compatible with the video element set the video src to ~~`location.href` of the iframe~~ the url
    * [x] If it's not compatible show an error
    * [x] If it's a website try to get a video source from that website (and show an error if that fails)
  * [x] Add all the features from `actions.addVideoControls` (and more)
  * [x] Use the video player instead of redirecting to the source video
  * [x] Automatically get a new source when the old one isn't available anymore
  * [ ] Support m3u8 (and similar) files
  * [ ] Optional: Make it look pretty

---

* __Add an options.html file to configure the extension__
  * [ ] Create the basic files (index.html, main.js, style.css)
  * [ ] Figure out a good way to let the user configure basically everything and replace the ... below
  * [ ] ...
  * [ ] Make changes persistent

---

* __Add a new way to get the source of a video by looking at requests for videos for each tab (if the host is supported)__
  * [ ] Look up how to do this and replace the ... below
  * [ ] ...