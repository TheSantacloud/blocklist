const MINIMAL_CSS = `
    html.blocklist-minimal, html.blocklist-minimal body {
        overflow: hidden !important;
        background: #0f0f0f !important;
    }

    html.blocklist-minimal body > *:not(#blocklist-minimal-container) {
        display: none !important;
    }

    html.blocklist-minimal #blocklist-minimal-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        padding-top: 20vh !important;
        min-height: 100vh !important;
        gap: 2rem !important;
    }

    html.blocklist-minimal #blocklist-minimal-container yt-searchbox {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        height: auto !important;
        flex-grow: 0 !important;
        flex-shrink: 0 !important;
        transform: scale(1.5) !important;
        transform-origin: top center !important;
    }

    html.blocklist-minimal #blocklist-minimal-container .ytSearchboxComponentInputBox {
        min-width: 500px !important;
    }

    html.blocklist-minimal #blocklist-minimal-logo {
        width: 120px !important;
        height: auto !important;
    }
`;

function injectStyles() {
    const style = document.createElement('style');
    style.id = 'blocklist-minimal-mode';
    style.textContent = MINIMAL_CSS;
    (document.head || document.documentElement).appendChild(style);
}

function isYoutubeHomepage() {
    return window.location.pathname === '/' || window.location.pathname === '';
}

function createMinimalUI() {
    document.documentElement.classList.add('blocklist-minimal');

    const observer = new MutationObserver(() => {
        const searchbox = document.querySelector('yt-searchbox');
        const logo = document.querySelector('ytd-topbar-logo-renderer #logo-icon');

        if (searchbox && logo && !document.getElementById('blocklist-minimal-container')) {
            observer.disconnect();

            const container = document.createElement('div');
            container.id = 'blocklist-minimal-container';

            const logoClone = logo.cloneNode(true);
            logoClone.id = 'blocklist-minimal-logo';
            container.appendChild(logoClone);

            container.appendChild(searchbox);

            document.body.appendChild(container);
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => observer.disconnect(), 10000);
}

injectStyles();

if (isYoutubeHomepage()) {
    chrome.storage.sync.get("youtubeMinimalMode", ({ youtubeMinimalMode }) => {
        if (youtubeMinimalMode) {
            createMinimalUI();
        }
    });
}
