document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');

    chrome.storage.local.get(['blockListEnabled'], function(result) {
        toggleSwitch.checked = result.blockListEnabled || false;
    });

    toggleSwitch.addEventListener('change', function() {
        chrome.storage.local.set({ blockListEnabled: toggleSwitch.checked }, function() {
            console.log('Feature enabled state is set to ' + toggleSwitch.checked);
        });

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: updateContentScript,
                args: [toggleSwitch.checked]
            });
        });
    });
});

function updateContentScript(isEnabled) {
    window.blockListEnabled = isEnabled;
}

