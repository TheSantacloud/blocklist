function generateBlockHtml(url, message) {
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

function blockUrl({ url, message }) {
    const generatedHtml = generateBlockHtml(url, message);
    document.open();
    document.write(generatedHtml);
    document.close();
}

chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === "block-url") {
        blockUrl(request);
    }
});
