let blocklistTimer = null;

const cache = {
  watchLater: { data: null, timestamp: 0 },
  history: { data: null, timestamp: 0 },
};
const CACHE_TTL = 60 * 60 * 1000;

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ blockListEnabled: true, timestamp: Date.now() });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  blockIfNeeded(details.tabId, details.url);
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete") return;
  blockIfNeeded(tabId, tab.url);
});

async function blockIfNeeded(tabId, currentUrl) {
  const { blockList, blockListEnabled } = await chrome.storage.sync.get([
    "blockList",
    "blockListEnabled",
  ]);

  if (!blockListEnabled) return;

  const blockUrl = shouldBlockUrl(currentUrl, blockList);
  if (!blockUrl) return;

  chrome.tabs.sendMessage(
    tabId,
    {
      action: "block-url",
      url: blockUrl,
      message: blockList[blockUrl].desc,
    },
    () => {
      if (chrome.runtime.lastError && chrome.runtime.lastError.message) {
        if (!chrome.runtime.lastError.message.includes("message port closed")) {
          console.warn(chrome.runtime.lastError.message);
        }
      }
    },
  );
}

function shouldBlockUrl(url, blockList) {
  for (let blockUrl in blockList) {
    if (url.includes(blockUrl)) return blockUrl;
  }
  return null;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if ("blockListEnabled" in changes) {
    if (blocklistTimer > 0) {
      clearTimeout(blocklistTimer);
      blocklistTimer = null;
    }

    const isEnabled = changes.blockListEnabled.newValue;
    if (isEnabled === false) {
      chrome.storage.sync.get("timeoutValue", (data) => {
        if (data.timeoutValue > 0) {
          blocklistTimer = setTimeout(
            () => {
              chrome.storage.sync.set({ blockListEnabled: true });
            },
            data.timeoutValue * 60 * 1000,
          );
        }
      });
    }
  }

  if ("youtubeMinimalMode" in changes) {
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, function (tabs) {
      tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
    chrome.tabs.query({ url: "*://youtube.com/*" }, function (tabs) {
      tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
  }

  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key !== "blockListEnabled") continue;
    if (key === "blockListEnabled" && oldValue === newValue) continue;

    chrome.storage.sync.get("blockList", (data) => {
      chrome.tabs.query(
        { active: true, currentWindow: true, windowType: "normal" },
        function (tabs) {
          if (!tabs.length) return;
          for (let blockUrl in data.blockList) {
            if (!tabs[0].url.includes(blockUrl)) continue;
            chrome.tabs.reload(tabs[0].id);
          }
        },
      );
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "enable_blocklist") {
    chrome.storage.sync.set({ blockListEnabled: true, timestamp: Date.now() });
    console.log("TEST0");
  } else {
    console.error("unknown command");
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch-watch-later") {
    const forceRefresh = request.forceRefresh || false;
    if (
      !forceRefresh &&
      cache.watchLater.data &&
      Date.now() - cache.watchLater.timestamp < CACHE_TTL
    ) {
      sendResponse(cache.watchLater.data);
      return true;
    }
    fetchWatchLater().then((result) => {
      if (result.success) {
        cache.watchLater = { data: result, timestamp: Date.now() };
      }
      sendResponse(result);
    });
    return true;
  }
  if (request.action === "fetch-history") {
    const forceRefresh = request.forceRefresh || false;
    if (
      !forceRefresh &&
      cache.history.data &&
      Date.now() - cache.history.timestamp < CACHE_TTL
    ) {
      sendResponse(cache.history.data);
      return true;
    }
    fetchHistory().then((result) => {
      if (result.success) {
        cache.history = { data: result, timestamp: Date.now() };
      }
      sendResponse(result);
    });
    return true;
  }
});

async function fetchWatchLater() {
  try {
    const response = await fetch("https://www.youtube.com/playlist?list=WL", {
      credentials: "include",
    });
    const html = await response.text();

    const ytInitialData = html.match(/var ytInitialData = (.+?);<\/script>/);
    if (!ytInitialData) {
      return { success: false, error: "Could not parse YouTube data" };
    }

    const data = JSON.parse(ytInitialData[1]);
    const contents =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
        ?.contents?.[0]?.playlistVideoListRenderer?.contents || [];

    const videos = [];
    for (const item of contents) {
      const video = item.playlistVideoRenderer;
      if (!video) continue;

      const percentWatched =
        video.thumbnailOverlays?.find(
          (o) => o.thumbnailOverlayResumePlaybackRenderer,
        )?.thumbnailOverlayResumePlaybackRenderer?.percentDurationWatched || 0;

      if (percentWatched >= 90) continue;

      const duration = video.lengthText?.simpleText || "";
      const title = video.title?.runs?.[0]?.text || "";
      const videoId = video.videoId || "";
      const channel = video.shortBylineText?.runs?.[0]?.text || "";

      if (title && videoId) {
        videos.push({ title, videoId, duration, channel });
      }
    }

    return { success: true, videos };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function fetchHistory() {
  try {
    const response = await fetch("https://www.youtube.com/feed/history", {
      credentials: "include",
    });
    const html = await response.text();

    const ytInitialData = html.match(/var ytInitialData = (.+?);<\/script>/);
    if (!ytInitialData) {
      return { success: false, error: "Could not parse YouTube data" };
    }

    const data = JSON.parse(ytInitialData[1]);
    const contents =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents || [];

    const videos = [];

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const lockup = item.lockupViewModel;
        if (!lockup) continue;

        const videoId = lockup.contentId || "";
        const title = lockup.metadata?.lockupMetadataViewModel?.title?.content || "";
        const metadataRows = lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
        const bylineRow = metadataRows.find(r => r.lockupContentMetadataRowExtension?.contentType === "METADATA_ROW_CONTENT_TYPE_BYLINE");
        const channel = bylineRow?.metadataParts?.[0]?.text?.content || "";

        const badge = lockup.contentImage?.thumbnailViewModel?.overlays?.[0]
          ?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel;
        const duration = badge?.text || "";

        if (title && videoId) {
          videos.push({ title, videoId, duration, channel });
        }
      }
    }

    return { success: true, videos };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
