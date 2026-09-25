console.log("Imagify service worker started");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Imagify Screenshot Extension installed");
});
