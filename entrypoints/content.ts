export default defineContentScript({
  matches: ["*://x.com/*"],
  main() {
    let filters = [];

    console.log("test");
    // Load filters from chrome.storage.local
    chrome.storage.local.get("filters", (result) => {
      filters = result.filters || [];
      console.log(filters);
      // Proceed with setting up observers after filters are loaded
      setupObservers();
    });

    async function setupObservers() {
      const { available } = await ai.languageModel.capabilities();
      let aiSession;
      if (available !== "no") {
        console.log("loading model...");
        aiSession = await ai.languageModel.create();
        console.log("model loaded");
      } else {
        console.log("AI language model not available");
      }

      const parsedTweets = new Set<string>();
      const tweetQueue: any[] = [];
      let isProcessing = false;

      function enqueueTweet(tweet) {
        tweetQueue.push(tweet);
        if (!isProcessing) {
          processNextTweet();
        }
      }

      // Helper function to truncate text
      function truncateText(text: string, maxLength: number): string {
        return text.length > maxLength
          ? text.slice(0, maxLength) + "..."
          : text;
      }

      async function processNextTweet() {
        if (tweetQueue.length === 0) {
          isProcessing = false;
          return;
        }
        isProcessing = true;
        const newTweet = tweetQueue.shift();

        console.log("Processing tweet:", newTweet);

        // Apply filters to the tweet
        for (const filter of filters) {
          if (aiSession) {
            const promptTemplate = `
You are an AI assistant helping to filter social media posts and replies based on user-defined criteria. Your task is to analyze the Post Content and determine how closely it matches the characteristics described by the user. Follow these steps:

1. Evaluate the Post Content based solely on the Description without making assumptions or relying on unstated criteria.

2. If additional context (e.g., hashtags, external links) is necessary for evaluation, include it in your analysis.

---

The output must be a single number ranging from 1 to 100 that represents the percentage likelihood the Post Content would match the Description.
---

The user has described what they want to filter out as follows:
Description (provided by the user):
"Describe what you want to filter out..."*
${filter.description}

---

The post content to evaluate is:
Post Content:

${JSON.stringify(newTweet)}

---

The Post Content comes from the Twitter platform. The Twitter platform has 4 types of posts:
1. Paid Twitter Ad posts where "isAd" will be "true"
2. Regular Posts
3. Reply Posts
4. Quote Posts

---

Provide the score as your final output, formatted as follows:
Output: [Score]
`;

            let matchScore = 0;

            // Prompt the AI model and process the response
            const response = await aiSession.prompt(promptTemplate);

            console.log("Tweet: ", newTweet);
            console.log("AI response:", response);

            // Extract the score from the response
            const scoreMatch = response.match(/\[(\d+)\]/);
            if (scoreMatch) {
              matchScore = parseInt(scoreMatch[1], 10);
            }

            if (matchScore >= filter.sensitivity) {
              // Perform the action based on filter.action
              //await XClientOperations(newTweet, filter.action);
              console.log("Action triggered for tweet:", newTweet.tweetId);
            } else {
              // Add tag to tweet element
              const tag = document.createElement("span");
              tag.textContent = `${truncateText(
                filter.description,
                50
              )} | Score: ${matchScore}`;
              tag.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
              tag.style.color = "#ff0000";
              tag.style.fontSize = "12px";
              tag.style.padding = "2px 4px";
              tag.style.borderRadius = "4px";
              tag.style.marginTop = "4px";
              newTweet.elem.appendChild(tag);
            }
          }
        }

        // Proceed to the next tweet in the queue
        isProcessing = false;
        processNextTweet();
      }

      // Observe the document body for the timeline element
      const observer = new MutationObserver(() => {
        const timeline = document.querySelector('main[role="main"]');
        if (timeline) {
          console.log("Timeline detected:", timeline);
          observer.disconnect();
          // Set up MutationObserver on the timeline
          const timelineObserver = new MutationObserver(async (mutations) => {
            // Reload filters from chrome.storage.local
            chrome.storage.local.get("filters", async (result) => {
              filters = result.filters;
            });
            // Process new tweets with updated filters
            for (const mutation of mutations) {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const tweetElement = (node as HTMLElement).querySelector(
                    'article[data-testid="tweet"]'
                  );
                  if (tweetElement) {
                    const newTweet = parseTweet(tweetElement);
                    if (newTweet && !parsedTweets.has(newTweet.tweetId)) {
                      parsedTweets.add(newTweet.tweetId);

                      console.log("New tweet detected:", newTweet);

                      // Enqueue the tweet for processing
                      enqueueTweet(newTweet);
                    }
                  }
                }
              }
            }
          });
          timelineObserver.observe(timeline, {
            childList: true,
            subtree: true,
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  },
});

function parseTweet(tweetElement: Element) {
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
  const handleHref = handleElement ? handleElement.getAttribute("href") : "";
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
  const tweetLinkElement = tweetElement.querySelector('a[href*="/status/"]');
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
    const numbers = [...metricsAriaLabel.matchAll(numberRegex)].map((match) =>
      match[1].replace(",", ".")
    );
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

  // Check if tweet is an ad
  let isAd = false;
  const candidateAdLabels = tweetElement.querySelectorAll(
    'div[dir="ltr"] > span'
  );
  for (const candidateAdLabel of candidateAdLabels) {
    if (candidateAdLabel.textContent === "Ad") {
      isAd = true;
      break;
    }
  }

  // Construct tweet object
  const tweet = {
    user,
    tweetId,
    tweetContent,
    elem: tweetElement,
    metrics,
    isAd,
  };

  return tweet;
}

async function XClientOperations(
  tweet: any, // Updated to accept entire tweet object
  action: "hide" | "mute" | "block"
): Promise<void> {
  let tweetArticle = tweet.elem as HTMLElement;
  // Open the tweet menu and get the menu items
  let menuItems: NodeListOf<HTMLElement> | undefined;
  const tweetOptionsMenu = tweetArticle.querySelector<HTMLElement>(
    '[aria-label="More"]'
  );
  clickOnXItem(tweetOptionsMenu);
  menuItems = await handleMenu('[role="menuitem"]', true);

  if (!menuItems) {
    console.log("Menu items not found for tweet:", tweet.tweetId);
    return;
  }

  switch (action) {
    case "hide":
      selectMenuItem(menuItems, "Not interested in this post");
      break;
    case "mute":
      selectMenuItem(menuItems, "Mute");
      break;
    case "block":
      selectMenuItem(menuItems, "Block");
      await handleMenu('[data-testid="confirmationSheetConfirm"]', false);
      break;
  }
}

function selectMenuItem(menuItems: NodeListOf<HTMLElement>, itemText: string) {
  for (const item of menuItems) {
    if (item.textContent?.includes(itemText)) {
      clickOnXItem(item);
    }
  }
  console.log(itemText + " item not found");
  return;
}

function clickOnXItem(XItem: HTMLElement | null): void {
  if (!XItem) {
    console.log("Element to be clicked was not found");
    return;
  }
  XItem.click();
}

/* Deals with waiting for the menu to open before proceeding with clicking on menu items */
async function handleMenu(
  desiredItemQuery: string,
  usingItems: boolean
): Promise<NodeListOf<HTMLElement> | undefined> {
  // Wait for the menu to appear before proceeding
  const menuMessage = await waitForDOMChange(desiredItemQuery);
  console.log(menuMessage); // This will log "Menu has appeared" once the menu appears

  if (!usingItems) {
    console.log("not using items if body entered");
    const button = document.querySelector<HTMLElement>(desiredItemQuery);
    clickOnXItem(button);
    return;
  } else {
    console.log("in else body");
    const items = document.querySelectorAll<HTMLElement>(desiredItemQuery);
    console.log("after querying for menu items in else body");
    if (!items) {
      console.log("items is empty");
      return;
    }
    return items;
  }
}

/* Sets up the mutation observer which is used for detecting DOM changes */
function waitForDOMChange(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Define the MutationObserver
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && document.querySelector(query)) {
          // When the menu appears, resolve the promise
          observer.disconnect(); // Stop observing once the mutation is detected
          resolve("Menu has appeared");
          break;
        }
      }
      setTimeout(() => {}, 5000);
    });

    // Start observing for changes in the DOM (e.g., childList changes)
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
