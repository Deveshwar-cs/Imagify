const captureViewButton = document.getElementById("captureView");

const captureFullPageButton = document.getElementById("captureFullPage");

const status = document.getElementById("status");

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
  try {
    setButtonsDisabled(true);

    status.textContent = "Preparing full-page capture...";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Active tab not found");
    }

    // ---------------------------------------
    // Make sure content script exists
    // ---------------------------------------

    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      files: ["content/content.js"],
    });

    // ---------------------------------------
    // Get page information
    // ---------------------------------------

    const pageResponse = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_INFO",
    });

    if (!pageResponse?.success) {
      throw new Error("Could not get page information");
    }

    const pageInfo = pageResponse.pageInfo;

    console.log("Page information:", pageInfo);

    // ---------------------------------------
    // Remember original scroll position
    // ---------------------------------------

    const originalX = pageInfo.scrollX;

    const originalY = pageInfo.scrollY;

    // ---------------------------------------
    // Calculate capture positions
    // ---------------------------------------

    const positions = calculateCapturePositions(
      pageInfo.height,
      pageInfo.viewportHeight,
    );

    console.log("Capture positions:", positions);

    const screenshots = [];

    // ---------------------------------------
    // Capture each section
    // ---------------------------------------

    for (let index = 0; index < positions.length; index++) {
      const y = positions[index];

      status.textContent = `Capturing ${index + 1} of ${positions.length}...`;

      // Scroll to position
      await chrome.tabs.sendMessage(tab.id, {
        type: "SCROLL_TO",
        x: 0,
        y,
      });

      // Small delay for rendering
      await sleep(150);

      // Capture viewport
      const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: "png",
      });

      screenshots.push({
        dataUrl: screenshot,
        y,
      });
    }

    // ---------------------------------------
    // Restore original position
    // ---------------------------------------

    await chrome.tabs.sendMessage(tab.id, {
      type: "RESTORE_SCROLL",
      x: originalX,
      y: originalY,
    });

    status.textContent = "Stitching screenshots...";

    // ---------------------------------------
    // Stitch screenshots
    // ---------------------------------------

    const finalScreenshot = await stitchScreenshots(screenshots, pageInfo);

    showScreenshot(finalScreenshot);

    status.textContent = "Full-page screenshot captured!";
  } catch (error) {
    console.error("Full Page Capture error:", error);

    status.textContent = error.message || "Failed to capture full page";
  } finally {
    setButtonsDisabled(false);
  }
});

// =========================================
// CALCULATE POSITIONS
// =========================================

function calculateCapturePositions(pageHeight, viewportHeight) {
  const positions = [];

  let currentY = 0;

  while (currentY < pageHeight) {
    positions.push(currentY);

    currentY += viewportHeight;
  }

  return positions;
}

// =========================================
// STITCH SCREENSHOTS
// =========================================

async function stitchScreenshots(screenshots, pageInfo) {
  const images = [];

  // ---------------------------------------
  // Load screenshots
  // ---------------------------------------

  for (const screenshot of screenshots) {
    const image = await loadImage(screenshot.dataUrl);

    images.push({
      image,
      y: screenshot.y,
    });
  }

  if (!images.length) {
    throw new Error("No screenshots available");
  }

  // ---------------------------------------
  // Get actual image dimensions
  // ---------------------------------------

  const firstImage = images[0].image;

  const imageWidth = firstImage.naturalWidth;

  const imageHeight = firstImage.naturalHeight;

  // ---------------------------------------
  // Calculate scale
  // ---------------------------------------

  const scale = imageWidth / pageInfo.viewportWidth;

  const finalWidth = Math.round(pageInfo.width * scale);

  const finalHeight = Math.round(pageInfo.height * scale);

  // ---------------------------------------
  // Create canvas
  // ---------------------------------------

  const canvas = document.createElement("canvas");

  canvas.width = finalWidth;

  canvas.height = finalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context");
  }

  // ---------------------------------------
  // Draw screenshots
  // ---------------------------------------

  for (const item of images) {
    const sourceHeight = Math.min(
      imageHeight,
      finalHeight - Math.round(item.y * scale),
    );

    if (sourceHeight <= 0) {
      continue;
    }

    const destinationY = Math.round(item.y * scale);

    context.drawImage(
      item.image,
      0,
      0,
      imageWidth,
      sourceHeight,
      0,
      destinationY,
      finalWidth,
      sourceHeight,
    );
  }

  // ---------------------------------------
  // Convert canvas to PNG
  // ---------------------------------------

  return canvas.toDataURL("image/png");
}

// =========================================
// LOAD IMAGE
// =========================================

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("Failed to load screenshot"));
    };

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
}

// =========================================
// SHOW SCREENSHOT
// =========================================

function showScreenshot(screenshot) {
  let preview = document.getElementById("screenshotPreview");

  if (!preview) {
    preview = document.createElement("img");

    preview.id = "screenshotPreview";

    preview.alt = "Captured screenshot";

    preview.style.width = "100%";

    preview.style.marginTop = "16px";

    preview.style.borderRadius = "8px";

    preview.style.display = "block";

    preview.style.border = "1px solid #e2e8f0";

    document.querySelector(".container").appendChild(preview);
  }

  preview.src = screenshot;
}
