chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ blockListEnabled: true });
});

chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get('blockListEnabled', (data) => {
        const newState = !data.blockListEnabled;
        chrome.storage.local.set({ blockListEnabled: newState }, () => {
            updateIcon(newState);
        });
    });
});

function updateIcon(state) {
    const iconPath = state ? 'assets/icon_color_128.png' : 'assets/icon_gray_128.png';
    chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('blockListEnabled', (data) => {
        updateIcon(data.blockListEnabled);
    });
});

