const INBOX_URL = 'https://www.instagram.com/direct/inbox/';

function isInboxPage() {
    return window.location.pathname.startsWith('/direct/');
}

function hideSidebar(mount) {
    const sidebar = mount.querySelector(':scope > div > div > div:nth-child(2) > div > div > div:first-child > div:first-child > div:nth-child(2)');
    if (sidebar && sidebar.style.display !== 'none') {
        sidebar.style.display = 'none';
    }

    const contentArea = mount.querySelector(':scope > div > div > div:nth-child(2) > div > div > div:first-child > div:first-child > div:first-child');
    if (contentArea) {
        contentArea.style.width = '100%';
        contentArea.style.maxWidth = '100%';
        contentArea.style.flexBasis = '100%';
    }

    const wrapper = mount.querySelector(':scope > div > div > div:nth-child(2) > div > div > div:first-child > div:first-child');
    if (wrapper) {
        wrapper.style.justifyContent = 'flex-start';
    }
}

function hideYourNote(mount) {
    const yourNote = mount.querySelector(':scope > div > div > div:nth-child(2) > div > div > div:first-child > div:first-child > div:first-child > section > main > div > section > div > div > div > div:first-child > div:first-child > div > div:nth-child(4) > div:first-child');
    if (yourNote && yourNote.style.display !== 'none') {
        yourNote.style.display = 'none';
    }
}

function hideElements() {
    const mount = document.querySelector('[id^="mount_"]');
    if (!mount) return;

    hideSidebar(mount);
    hideYourNote(mount);
}

chrome.storage.sync.get("instagramMinimalMode", ({ instagramMinimalMode }) => {
    if (!instagramMinimalMode) return;

    if (!isInboxPage()) {
        window.location.replace(INBOX_URL);
    } else {
        const observer = new MutationObserver(hideElements);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        hideElements();
    }
});
