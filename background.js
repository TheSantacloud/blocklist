let blocklistTimer = null;

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({ blockListEnabled: true, timestamp: Date.now() });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    console.log("onhistorystateupdated");
    blockIfNeeded(details.tabId, details.url);
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    console.log("onupdated");
    blockIfNeeded(tabId, tab.url);
})

chrome.tabs.onActivated.addListener(async function(activeInfo) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    console.log("onactivated");
    blockIfNeeded(tab.id, tab.url);
})

async function blockIfNeeded(tabId, currentUrl) {
    const { blockList, blockListEnabled } = await chrome.storage.sync.get([
        "blockList",
        "blockListEnabled",
    ]);

    const blockUrl = shouldBlockUrl(currentUrl, blockList);
    if (!blockUrl) return;

    if (blockListEnabled) {
        chrome.tabs.sendMessage(tabId, {
            action: "block-url",
            url: blockUrl,
            message: blockList[blockUrl].desc
        });
    }
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
    } else {
        console.error("unknown command");
    }
});

