chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({ blockListEnabled: true });
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    blockIfNeeded(details.tabId, details.url);
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    blockIfNeeded(tabId, tab.url);
})

chrome.tabs.onActivated.addListener(async function(activeInfo) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    blockIfNeeded(tab.id, tab.url);
})

function blockIfNeeded(tabId, currentUrl) {
    chrome.storage.sync.get("blockList", (data) => {
        for (let blockUrl in data.blockList) {
            if (!currentUrl.includes(blockUrl)) continue;
            chrome.storage.sync.get("blockListEnabled", (enabled) => {
                if (!enabled.blockListEnabled) return;
                chrome.tabs.sendMessage(tabId, {
                    action: "block-url",
                    url: blockUrl,
                    message: data.blockList[blockUrl].desc
                });
            });
        }
    });
}

chrome.storage.onChanged.addListener((changes) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === "blockListEnabled" && oldValue === newValue) continue;
        chrome.storage.sync.get("blockList", (data) => {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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
        chrome.storage.sync.set({ blockListEnabled: true });
    } else {
        console.error("unknown command");
    }
});

