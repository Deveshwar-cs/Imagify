// =========================================
// DOM ELEMENTS
// =========================================

const captureViewButton = document.getElementById("captureView");
const captureFullPageButton = document.getElementById("captureFullPage");
const status = document.getElementById("status");
const screenshotPreview = document.getElementById("screenshotPreview");
const uploadSection = document.getElementById("uploadSection");
const uploadButton = document.getElementById("uploadButton");
const shareSection = document.getElementById("shareSection");
const shareUrl = document.getElementById("shareUrl");
const copyUrlButton = document.getElementById("copyUrlButton");
const openUrlButton = document.getElementById("openUrlButton");
const captureSelectedButton = document.getElementById("captureSelected");

let capturedScreenshot = null;

// captureVisibleTab is limited to ~2 calls per second
const CAPTURE_DELAY_MS = 600;

// Safety limit for endless / infinite-scroll pages
const MAX_CAPTURES = 60;

// Browser canvas limits (Chrome)
const MAX_CANVAS_DIMENSION = 32767;
const MAX_CANVAS_AREA = 268435456;

function showScreenshot(screenshot) {
  capturedScreenshot = screenshot;

  screenshotPreview.src = screenshot;

  screenshotPreview.classList.remove("hidden");

  uploadSection.classList.remove("hidden");

  shareSection.classList.add("hidden");
}

const loadSelectedScreenshot = async () => {
  const result = await chrome.storage.session.get("selectedScreenshot");

  if (!result.selectedScreenshot) {
    return;
  }

  showScreenshot(result.selectedScreenshot);

  await chrome.storage.session.remove("selectedScreenshot");
};

// =========================================
// CAPTURE VIEW
// =========================================

captureViewButton.addEventListener("click", async () => {
  try {
    setButtonsDisabled(true);
    status.textContent = "Capturing visible area...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Active tab not found");
    }

    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });

    if (!screenshot) {
      throw new Error("Screenshot capture failed");
    }

    showScreenshot(screenshot);
    status.textContent = "Screenshot captured successfully!";
  } catch (error) {
    console.error("Capture View error:", error);
    status.textContent = error.message || "Failed to capture screenshot";
  } finally {
    setButtonsDisabled(false);
  }
});

// =========================================
// CAPTURE FULL PAGE
// =========================================

captureFullPageButton.addEventListener("click", async () => {
  let tab = null;
  let originalX = 0;
  let originalY = 0;

  try {
    setButtonsDisabled(true);
    status.textContent = "Preparing full-page capture...";

    [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Active tab not found");
    }

    // Content script guards against double injection
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ["content/content.js"],
    });

    const pageResponse = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_INFO",
    });

    if (!pageResponse?.success) {
      throw new Error("Could not get page information");
    }

    const pageInfo = pageResponse.pageInfo;

    originalX = pageInfo.scrollX;
    originalY = pageInfo.scrollY;

    const viewportHeight = pageInfo.viewportHeight;

    console.log("Page information:", pageInfo);

    // ---------------------------------------
    // Capture loop.
    // Positions are decided as we go, using the REAL scroll
    // position and the CURRENT page height, so clamped scrolls
    // and growing (lazy-loaded) pages are handled correctly.
    // ---------------------------------------

    const screenshots = [];
    let requestedY = 0;

    for (let index = 0; index < MAX_CAPTURES; index++) {
      status.textContent = `Capturing section ${index + 1}...`;

      const scrollResponse = await chrome.tabs.sendMessage(tab.id, {
        type: "SCROLL_TO",
        x: 0,
        y: requestedY,
      });

      if (!scrollResponse?.success) {
        throw new Error("Could not scroll page");
      }

      const position = scrollResponse.position;
      const actualY = Math.round(position.y);
      const pageHeight = position.height;

      // First shot keeps fixed headers; later shots hide them
      // so they don't repeat down the page.
      if (index > 0) {
        await chrome.tabs.sendMessage(tab.id, {type: "HIDE_FIXED"});
      }

      // Let the page repaint and respect the capture rate limit
      await sleep(CAPTURE_DELAY_MS);

      const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });

      if (!screenshot) {
        throw new Error(`Screenshot ${index + 1} failed`);
      }

      screenshots.push({dataUrl: screenshot, y: actualY});

      console.log(`Screenshot ${index + 1}:`, {
        requestedY,
        actualY,
        pageHeight,
      });

      // Done if the browser refused to scroll as far as requested
      // (we hit the real bottom) or the viewport already reaches the end.
      const maxScroll = Math.max(0, pageHeight - viewportHeight);
      const hitBottom = actualY < requestedY - 1 || actualY >= maxScroll - 1;

      if (hitBottom) {
        break;
      }

      requestedY = Math.min(actualY + viewportHeight, maxScroll);
    }

    // ---------------------------------------
    // Restore page (scroll + hidden elements)
    // ---------------------------------------

    await chrome.tabs.sendMessage(tab.id, {
      type: "RESTORE_SCROLL",
      x: originalX,
      y: originalY,
    });

    // ---------------------------------------
    // Stitch
    // ---------------------------------------

    status.textContent = "Stitching screenshots...";

    const finalScreenshot = await stitchScreenshots(screenshots, pageInfo);

    showScreenshot(finalScreenshot);
    status.textContent = "Full-page screenshot captured!";
  } catch (error) {
    console.error("Full Page Capture error:", error);

    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: "RESTORE_SCROLL",
          x: originalX,
          y: originalY,
        });
      } catch (restoreError) {
        console.error("Could not restore page:", restoreError);
      }
    }

    status.textContent = error.message || "Failed to capture full page";
  } finally {
    setButtonsDisabled(false);
  }
});

// =========================================
// CAPTURE selected portion
// =========================================

captureSelectedButton.addEventListener("click", async () => {
  try {
    setButtonsDisabled(true);

    status.textContent = "Select the area you want to capture...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Active tab not found");
    }

    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      files: ["content/content.js"],
    });

    await chrome.runtime.sendMessage({
      type: "START_SELECTED_CAPTURE",
      tabId: tab.id,
    });
    window.close();
  } catch (error) {
    console.log(error);
    console.error("Selected capture error:", error);

    status.textContent = error.message || "Failed to start selection";

    setButtonsDisabled(false);
  }
});

// =========================================
// STITCH SCREENSHOTS
// =========================================

async function stitchScreenshots(screenshots, pageInfo) {
  if (!screenshots.length) {
    throw new Error("No screenshots available");
  }

  const images = [];

  for (const screenshot of screenshots) {
    images.push({
      image: await loadImage(screenshot.dataUrl),
      y: screenshot.y,
    });
  }

  const imageWidth = images[0].image.naturalWidth;
  const imageHeight = images[0].image.naturalHeight;

  // Screenshot pixels per CSS pixel (device pixel ratio)
  const scale = imageWidth / pageInfo.viewportWidth;

  // The page ends where the last screenshot ends
  const lastY = images[images.length - 1].y;

  const fullWidth = imageWidth;
  const fullHeight = Math.round(lastY * scale) + imageHeight;

  // Shrink if the result would exceed browser canvas limits
  const ratio = Math.min(
    1,
    MAX_CANVAS_DIMENSION / fullWidth,
    MAX_CANVAS_DIMENSION / fullHeight,
    Math.sqrt(MAX_CANVAS_AREA / (fullWidth * fullHeight)),
  );

  const canvasWidth = Math.floor(fullWidth * ratio);
  const canvasHeight = Math.floor(fullHeight * ratio);

  console.log("Stitch info:", {
    scale,
    fullWidth,
    fullHeight,
    ratio,
    canvasWidth,
    canvasHeight,
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context");
  }

  // Draw each full screenshot at its real page position.
  // Overlap (only at the last shot) is painted over with identical pixels.
  for (const item of images) {
    const destinationY = Math.round(item.y * scale * ratio);

    context.drawImage(
      item.image,
      0,
      0,
      imageWidth,
      imageHeight,
      0,
      destinationY,
      canvasWidth,
      Math.ceil(imageHeight * ratio),
    );
  }

  return canvas.toDataURL("image/png");
}

// =========================================
// LOAD IMAGE
// =========================================

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load screenshot"));

    image.src = dataUrl;
  });
}

// =========================================
// SLEEP
// =========================================

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// =========================================
// BUTTON STATE
// =========================================

function setButtonsDisabled(disabled) {
  captureViewButton.disabled = disabled;
  captureFullPageButton.disabled = disabled;
  uploadButton.disabled = disabled;
}

// =========================================
// SHOW SCREENSHOT
// =========================================

function showScreenshot(screenshot) {
  capturedScreenshot = screenshot;

  screenshotPreview.src = screenshot;
  screenshotPreview.classList.remove("hidden");

  uploadSection.classList.remove("hidden");
  shareSection.classList.add("hidden");
}

// =========================================
// DATA URL → BLOB
// =========================================

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch?.[1] || "image/png";

  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], {type: mimeType});
}

// =========================================
// UPLOAD SCREENSHOT TO IMAGIFY
// =========================================

uploadButton.addEventListener("click", async () => {
  if (!capturedScreenshot) {
    status.textContent = "Please capture a screenshot first.";
    return;
  }

  try {
    uploadButton.disabled = true;
    status.textContent = "Preparing screenshot...";

    const blob = dataUrlToBlob(capturedScreenshot);

    const file = new File([blob], "imagify-screenshot.png", {
      type: "image/png",
    });

    console.log("Screenshot size:", file.size, "bytes");

    const formData = new FormData();
    formData.append("image", file);

    status.textContent = "Uploading to Imagify...";

    const response = await fetch(
      "http://localhost:5000/api/images/share/screenshot",
      // "https://imagify-k2gv.onrender.com/api/images/share/screenshot",
      {
        method: "POST",
        body: formData,
        credentials: "include",
      },
    );

    const data = await response.json();

    console.log("Upload response:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to upload screenshot");
    }

    const url = data.share?.url;

    if (!url) {
      throw new Error("Share URL was not returned");
    }

    shareUrl.value = url;

    shareSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");

    status.textContent = "Screenshot shared successfully!";
  } catch (error) {
    console.error("Screenshot upload error:", error);
    status.textContent = error.message || "Failed to upload screenshot";
  } finally {
    uploadButton.disabled = false;
  }
});

// =========================================
// COPY SHARE URL
// =========================================

copyUrlButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    status.textContent = "Share URL copied!";
  } catch (error) {
    console.error("Copy URL error:", error);
    status.textContent = "Failed to copy URL";
  }
});

// =========================================
// OPEN SHARE URL
// =========================================

openUrlButton.addEventListener("click", () => {
  if (!shareUrl.value) {
    return;
  }

  chrome.tabs.create({url: shareUrl.value});
});

loadSelectedScreenshot();
