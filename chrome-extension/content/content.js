// Guard: popup re-injects this file on every full-page capture.
if (!window.__imagifyContentLoaded) {
  window.__imagifyContentLoaded = true;

  const hiddenElements = new Map(); // element -> { value, priority }
  let instantScrollStyle = null;

  // =========================================
  // HELPERS
  // =========================================

  function getDocumentHeight() {
    return Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    );
  }

  function getDocumentWidth() {
    return Math.max(
      document.documentElement?.clientWidth || 0,
      document.documentElement?.scrollWidth || 0,
      document.body?.scrollWidth || 0,
    );
  }

  // Sites with `scroll-behavior: smooth` animate window.scrollTo, which makes
  // us capture mid-scroll and report the wrong position. Force it off.
  function enableInstantScroll() {
    if (instantScrollStyle) return;

    instantScrollStyle = document.createElement("style");
    instantScrollStyle.textContent =
      "html, body { scroll-behavior: auto !important; }";

    document.documentElement.appendChild(instantScrollStyle);
  }

  function disableInstantScroll() {
    instantScrollStyle?.remove();
    instantScrollStyle = null;
  }

  function waitForScrollToSettle() {
    return new Promise((resolve) => {
      let last = window.scrollY;
      let stableFrames = 0;

      const tick = () => {
        const current = window.scrollY;

        if (current === last) {
          stableFrames++;
        } else {
          stableFrames = 0;
          last = current;
        }

        if (stableFrames >= 3) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);

      // Safety net
      setTimeout(resolve, 500);
    });
  }

  // =========================================
  // PAGE INFO
  // =========================================

  function getPageInfo() {
    return {
      width: getDocumentWidth(),
      height: getDocumentHeight(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }

  // =========================================
  // SCROLL
  // =========================================

  async function scrollToPosition(x, y) {
    enableInstantScroll();

    window.scrollTo({left: x, top: y, behavior: "instant"});

    await waitForScrollToSettle();

    return {
      x: window.scrollX,
      y: window.scrollY,
      // Fresh height: lazy-loaded content can grow the page while scrolling
      height: getDocumentHeight(),
    };
  }

  // =========================================
  // HIDE / RESTORE FIXED + STUCK STICKY ELEMENTS
  // =========================================

  function restoreHiddenElements() {
    hiddenElements.forEach((original, element) => {
      if (original.value) {
        element.style.setProperty(
          "visibility",
          original.value,
          original.priority,
        );
      } else {
        element.style.removeProperty("visibility");
      }
    });

    hiddenElements.clear();
  }

  function hideFixedElements() {
    // Re-evaluate from scratch on every call
    restoreHiddenElements();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    document.querySelectorAll("*").forEach((element) => {
      const style = window.getComputedStyle(element);

      if (style.position !== "fixed" && style.position !== "sticky") {
        return;
      }

      const rect = element.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      // Skip full-screen fixed layers (backgrounds / wallpapers)
      if (
        rect.width >= viewportWidth * 0.9 &&
        rect.height >= viewportHeight * 0.9
      ) {
        return;
      }

      if (style.position === "sticky") {
        const stickyTop = parseFloat(style.top);

        // Only hide sticky elements that are currently stuck
        const isStuck =
          !Number.isNaN(stickyTop) &&
          window.scrollY > 0 &&
          Math.abs(rect.top - stickyTop) <= 1;

        if (!isStuck) {
          return;
        }
      }

      hiddenElements.set(element, {
        value: element.style.getPropertyValue("visibility"),
        priority: element.style.getPropertyPriority("visibility"),
      });

      element.style.setProperty("visibility", "hidden", "important");
    });

    return hiddenElements.size;
  }

  // =========================================
  // MESSAGE HANDLER
  // =========================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_INFO") {
      sendResponse({success: true, pageInfo: getPageInfo()});
      return true;
    }

    if (message.type === "SCROLL_TO") {
      scrollToPosition(message.x, message.y).then((position) => {
        sendResponse({success: true, position});
      });

      return true;
    }

    if (message.type === "HIDE_FIXED") {
      const count = hideFixedElements();
      sendResponse({success: true, count});
      return true;
    }

    if (message.type === "RESTORE_SCROLL") {
      restoreHiddenElements();

      window.scrollTo({
        left: message.x,
        top: message.y,
        behavior: "instant",
      });

      disableInstantScroll();

      sendResponse({success: true});
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
}
