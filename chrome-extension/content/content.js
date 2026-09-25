// =========================================
// GET PAGE INFORMATION
// =========================================

function getPageInfo() {
  const body = document.body;
  const html = document.documentElement;

  const width = Math.max(
    body?.scrollWidth || 0,
    body?.offsetWidth || 0,
    html?.clientWidth || 0,
    html?.scrollWidth || 0,
    html?.offsetWidth || 0,
  );

  const height = Math.max(
    body?.scrollHeight || 0,
    body?.offsetHeight || 0,
    html?.clientHeight || 0,
    html?.scrollHeight || 0,
    html?.offsetHeight || 0,
  );

  return {
    width,
    height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}

// =========================================
// SCROLL PAGE
// =========================================

async function scrollToPosition(x, y) {
  window.scrollTo(x, y);

  // Give the browser time to render
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

// =========================================
// RESTORE PAGE POSITION
// =========================================

function restoreScrollPosition(x, y) {
  window.scrollTo(x, y);
}

// =========================================
// MESSAGE HANDLER
// =========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    sendResponse({
      success: true,
      pageInfo: getPageInfo(),
    });

    return true;
  }

  if (message.type === "SCROLL_TO") {
    scrollToPosition(message.x, message.y).then((position) => {
      sendResponse({
        success: true,
        position,
      });
    });

    return true;
  }

  if (message.type === "RESTORE_SCROLL") {
    restoreScrollPosition(message.x, message.y);

    sendResponse({
      success: true,
    });

    return true;
  }

  if (message.type === "TEST_MESSAGE") {
    sendResponse({
      success: true,
      message: "Content script received the message!",
    });

    return true;
  }
});
