export default defineContentScript({
  matches: ["*://x.com/*"],
  main() {
    // Observe the document body for the timeline element
    const observer = new MutationObserver(() => {
      const timeline = document.querySelector('main[role="main"]');
      if (timeline) {
        console.log("Timeline detected:", timeline);
        observer.disconnect();
        // Set up MutationObserver on the timeline
        const timelineObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const tweetElement = (node as HTMLElement).querySelector(
                  'article[data-testid="tweet"]'
                );
                if (tweetElement) {
                  // Parse tweet details using the example HTML as a reference

                  // User
                  const displayNameElement = tweetElement.querySelector(
                    '[data-testid="User-Name"] a span'
                  );
                  let displayName = "";
                  if (displayNameElement) {
                    displayName = Array.from(displayNameElement.childNodes)
                      .map((node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                          return node.textContent;
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node as HTMLElement;
                          if (element.tagName === "IMG") {
                            return element.getAttribute("alt") || "";
                          } else {
                            return element.textContent || "";
                          }
                        } else {
                          return "";
                        }
                      })
                      .join("");
                  }

                  const handleElement = tweetElement.querySelector(
                    '[data-testid="User-Name"] a[href^="/"]'
                  );
                  const handleHref = handleElement
                    ? handleElement.getAttribute("href")
                    : "";
                  const handleMatch = handleHref?.match(/^\/([^\/\?]+)/);
                  const handle = handleMatch ? handleMatch[1] : "";

                  // Check if the verified icon is present
                  const verifiedIconElement = tweetElement.querySelector(
                    '[data-testid="User-Name"] svg[data-testid="icon-verified"]'
                  );
                  const isVerified = !!verifiedIconElement;

                  const user = {
                    displayName,
                    handle,
                    isVerified,
                  };

                  // Tweet ID
                  const tweetLinkElement = tweetElement.querySelector(
                    'a[href*="/status/"]'
                  );
                  const tweetLink = tweetLinkElement
                    ? tweetLinkElement.getAttribute("href")
                    : "";
                  const tweetIdMatch = tweetLink?.match(/status\/(\d+)/);
                  const tweetId = tweetIdMatch ? tweetIdMatch[1] : "";

                  // Tweet Content
                  const tweetContentElement = tweetElement.querySelector(
                    '[data-testid="tweetText"]'
                  );
                  const tweetContent = tweetContentElement
                    ? tweetContentElement.textContent
                    : "";

                  // Metrics
                  const metricsContainer = tweetElement.querySelector(
                    'div[aria-label][role="group"]'
                  );
                  const metricsAriaLabel = metricsContainer
                    ? metricsContainer.getAttribute("aria-label")
                    : "";

                  let replies = "0";
                  let reposts = "0";
                  let likes = "0";
                  let bookmarks = "0";
                  let views = "0";

                  if (metricsAriaLabel) {
                    // Extract numbers from the aria-label
                    const numberRegex = /(\d+(?:[\.,]\d+)?[KM]?)\s*/g;
                    const numbers = [
                      ...metricsAriaLabel.matchAll(numberRegex),
                    ].map((match) => match[1].replace(",", "."));
                    if (numbers.length === 5) {
                      [replies, reposts, likes, bookmarks, views] = numbers;
                    }
                  }

                  const metrics = {
                    replies,
                    reposts,
                    likes,
                    bookmarks,
                    views,
                  };

                  // Construct tweet object
                  const tweet = {
                    user,
                    tweetId,
                    tweetContent,
                    elem: tweetElement,
                    metrics,
                  };

                  console.log("New tweet detected:", tweet);

                  // Send tweet to background script
                  browser.runtime.sendMessage({ action: "addTweet", tweet });
                }
              }
            });
          });
        });
        timelineObserver.observe(timeline, { childList: true, subtree: true });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});
