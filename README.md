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

* __Add a video player__
  * [x] Create the basic files (index.html, main.js, style.css)
  * [x] Change how VideoManager works
    * [x] Make a second object (and function) for URLs and sources to find the latest source for a URL
    * [x] Ensure that there is only one source per URL (and vice versa) in the objects
  * [ ] Load the video from `location.search` into the video element
    * [ ] Load the url into an iframe
    * [ ] If the MIME-Type is compatible with the video element set the video src to `location.href` of the iframe
    * [ ] If it's not compatible show an error
    * [ ] If it's a website try to get a video source from that website and show an error if that fails
  * [ ] Add all the features from `actions.addVideoControls`
  * [ ] Use the video player instead of redirecting to the source video
    * [ ] Edit all redirect actions to redirect to the video player
  * [ ] Automatically get a new source when the old one isn't available anymore
  * [ ] Support m3u8 (and similar) files
  * [ ] Optional: Don't use the default style from the browser

---

* __Add a options.html file to configure the extension__
  * [ ] Create the basic files (index.html, main.js, style.css)
  * [ ] Figure out a good way to let the user configure basically everything and replace the ... below
  * [ ] ...
  * [ ] Make changes persistent

---

* __Add a new way to get the source of a video by keeping a record of all requests for each tab (if the host is supported)__
  * [ ] Look up how to do this and replace the ... below
  * [ ] ...