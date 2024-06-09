const blockList = {
    "facebook.com": "They continuously push propaganda, and even if they were decent human beings - they are a huge time waster.",
    "instagram.com": "You just mindlessly scroll, and this produces no meaning or value",
};

function generateBlockHtml(url) {
    const message = blockList[url];
    return `
    <html>
    <body style="background-color: black; color: white;">
        <div style="max-width: fit-content; margin-left: auto; margin-right: auto; margin-top: 10em; font-weight: 400; letter-spacing: 0.3em; font-family: Verdana, sans-serif;">
            <h1>
                ${url} blocked
            </h1>
        </div>
        <p style="width: 50%; max-width: fit-content; margin-left: auto; margin-right: auto; margin-top: 2em; font-style: italic; font-family: Verdana, sans-serif;">
           ${message}
        </p>
    </body>
    </html>
    `;
}

function checkAndBlockSites() {
    if (!window.blockListEnabled) {
        console.log('Block list is not enabled. Exiting script.');
        return;
    }


    Object.keys(blockList).forEach(url => {
        if (document.URL.includes(url)) {
            const generatedHtml = generateBlockHtml(url);
            document.open();
            document.write(generatedHtml);
            document.close();
        }
    });
}

chrome.storage.local.get('blockListEnabled', function(result) {
    window.blockListEnabled = result.blockListEnabled || false;
    checkAndBlockSites();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateFeatureState') {
        window.blockListEnabled = request.blockListEnabled;
        checkAndBlockSites();
    }
});

