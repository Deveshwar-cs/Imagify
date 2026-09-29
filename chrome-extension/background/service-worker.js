console.log("Imagify service worker started");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Imagify Screenshot Extension installed");
});

// =========================================
// CAPTURE SELECTED AREA
// =========================================

const captureSelectedArea = async (tabId, selection) => {
  const debuggee = {
    tabId,
  };

  await chrome.debugger.attach(debuggee, "1.3");

  try {
    const result = await chrome.debugger.sendCommand(
      debuggee,
      "Page.captureScreenshot",
      {
        format: "png",

        clip: {
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
          scale: 1,
        },
      },
    );

    return `data:image/png;base64,${result.data}`;
  } finally {
    await chrome.debugger.detach(debuggee);
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SELECTED_CAPTURE") {
    const {tabId} = message;

    chrome.tabs.sendMessage(tabId, {
      type: "START_SELECTION",
    });

    return;
  }

  if (message.type === "SELECTION_COMPLETE") {
    const tabId = sender.tab?.id;

    if (!tabId) {
      console.error("Could not determine tab ID");
      return;
    }

    console.log("Selected rectangle:", message.selection);

    captureSelectedArea(tabId, message.selection)
      .then(async (dataUrl) => {
        console.log("Selected screenshot captured");

        await chrome.storage.session.set({
          selectedScreenshot: dataUrl,
        });

        console.log("Selected screenshot saved");

        await chrome.action.openPopup();

        console.log("Popup opened");
      })
      .catch((error) => {
        console.error("Selected screenshot error:", error);
      });

    return;
  }
});
