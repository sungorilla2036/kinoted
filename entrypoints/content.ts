export default defineContentScript({
  matches: ["*://x.com/*"],
  main() {
    const parsedTweets = new Set<string>();
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
                  const newTweet = parseTweet(tweetElement);
                  if (newTweet && !parsedTweets.has(newTweet.tweetId)) {
                    parsedTweets.add(newTweet.tweetId);

                    console.log("New tweet detected:", newTweet);

                    // Send tweet to background script
                    browser.runtime.sendMessage({
                      action: "addTweet",
                      newTweet,
                    });
                  }
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

async function XClientOperations(tweetId: string, action: "hide" | "mute" | "block"): Promise<void> {
  const articles = document.querySelectorAll<HTMLElement>('article');
  let tweetArticle: HTMLElement | undefined;

  //find the tweet on the DOM from the tweetId 
  for (const article of articles) {
      const links = article.querySelectorAll<HTMLAnchorElement>('a'); // Get links specific to the article
      if (links.length >= 4) { // Check if there are at least 4 links
          const fourthLink = links[3]; // Zero-based index, so the 4th link is at index 3
          if (fourthLink.getAttribute("href")?.includes(tweetId)) {
              console.log("tweet found on timeline");
              tweetArticle = article;
              break;
          }
      }
  }

  //check if the tweet was on the timeline
  if (!tweetArticle) {
      console.log("tweet not found on timeline");
      return;
  }

  //open the tweet menu and get the menu items
  let menuItems: NodeListOf<HTMLElement> | undefined;
  const tweetOptionsMenu = tweetArticle.querySelector<HTMLElement>('[aria-label="More"]');
  clickOnXItem(tweetOptionsMenu);
  menuItems = await handleMenu('[role="menuitem"]', true);

  if (!menuItems) {
      console.log("Menu items not found");
      return;
  }

  switch (action) {
      case "hide":
          selectMenuItem(menuItems, 'Not interested in this post');
          break;
      case "mute":
          selectMenuItem(menuItems, 'Mute');
          break;
      case "block":
          selectMenuItem(menuItems, 'Block');
          await handleMenu('[data-testid="confirmationSheetConfirm"]', false);
          break;
  }

}
function selectMenuItem(menuItems: NodeListOf<HTMLElement>, itemText: string)
{
  for(const item of menuItems)
  {
    if(item.textContent?.includes(itemText))
    {
      clickOnXItem(item);
    }
  }
  console.log(itemText + ' item not found');
  return;
}

function clickOnXItem(XItem: HTMLElement | null): void {
  if (!XItem) {
      console.log('Element to be clicked was not found');
      return;
  }
  XItem.click();
}
/* Deals with waiting for the menu to open before proceeding with clicking on menu items */
async function handleMenu(desiredItemQuery: string, usingItems: boolean): Promise<NodeListOf<HTMLElement> | undefined> {
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
              if (mutation.type === 'childList' && document.querySelector(query)) {
                  // When the menu appears, resolve the promise
                  observer.disconnect(); // Stop observing once the mutation is detected
                  resolve('Menu has appeared');
                  break;
              }
          }
          setTimeout(() => {}, 5000);
      });

      // Start observing for changes in the DOM (e.g., childList changes)
      observer.observe(document.body, { childList: true, subtree: true });
  });
}
