chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ blockListEnabled: true }, function() { });
});

