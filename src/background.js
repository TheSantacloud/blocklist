let blocklistTimer = null;

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({ blockListEnabled: true, timestamp: Date.now() });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    blockIfNeeded(details.tabId, details.url);
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    if (changeInfo.status !== "complete") return;
    blockIfNeeded(tabId, tab.url);
})

async function blockIfNeeded(tabId, currentUrl) {
    const { blockList, blockListEnabled } = await chrome.storage.sync.get([
        "blockList",
        "blockListEnabled",
    ]);

    if (!blockListEnabled) return;

    const blockUrl = shouldBlockUrl(currentUrl, blockList);
    if (!blockUrl) return;

    chrome.tabs.sendMessage(tabId, {
        action: "block-url",
        url: blockUrl,
        message: blockList[blockUrl].desc
    }, () => {
        if (chrome.runtime.lastError && chrome.runtime.lastError.message) {
            if (!chrome.runtime.lastError.message.includes("message port closed")) {
                console.warn(chrome.runtime.lastError.message);
            }
        }
    });
}

function shouldBlockUrl(url, blockList) {
    for (let blockUrl in blockList) {
        if (url.includes(blockUrl)) return blockUrl;
    }
    return null;
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;

    if ('blockListEnabled' in changes) {
        if (blocklistTimer > 0) {
            clearTimeout(blocklistTimer);
            blocklistTimer = null;
        }

        const isEnabled = changes.blockListEnabled.newValue;
        if (isEnabled === false) {
            chrome.storage.sync.get('timeoutValue', (data) => {
                if (data.timeoutValue > 0) {
                    blocklistTimer = setTimeout(() => {
                        chrome.storage.sync.set({ blockListEnabled: true });
                    }, data.timeoutValue * 60 * 1000);
                }
            });
        }
    }

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key !== "blockListEnabled") continue;
        if (key === "blockListEnabled" && oldValue === newValue) continue;

        chrome.storage.sync.get("blockList", (data) => {
            chrome.tabs.query({ active: true, currentWindow: true, windowType: 'normal' }, function(tabs) {
                if (!tabs.length) return;
                for (let blockUrl in data.blockList) {
                    if (!tabs[0].url.includes(blockUrl)) continue;
                    chrome.tabs.reload(tabs[0].id);
                }
            });
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

