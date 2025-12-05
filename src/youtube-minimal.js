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

    html.blocklist-minimal #blocklist-tabs-container {
        margin-top: 2rem !important;
        width: 750px !important;
        display: flex !important;
        flex-direction: column !important;
        max-height: 50vh !important;
    }

    html.blocklist-minimal .blocklist-tabs-header {
        display: flex !important;
        gap: 0 !important;
        margin-bottom: 0 !important;
        align-items: center !important;
        justify-content: center !important;
        position: relative !important;
    }

    html.blocklist-minimal .blocklist-refresh {
        position: absolute !important;
        right: 0 !important;
        background: transparent !important;
        border: none !important;
        color: #666 !important;
        font-size: 14px !important;
        cursor: pointer !important;
        padding: 0.5rem !important;
        transition: color 0.15s, opacity 0.15s !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }

    html.blocklist-minimal .blocklist-refresh.visible {
        opacity: 1 !important;
        pointer-events: auto !important;
    }

    html.blocklist-minimal .blocklist-refresh:hover {
        color: #fff !important;
    }

    html.blocklist-minimal .blocklist-refresh.loading {
        animation: spin 1s linear infinite !important;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    html.blocklist-minimal .blocklist-full-link {
        color: #666 !important;
        font-size: 12px !important;
        text-decoration: none !important;
        padding: 0.5rem 1rem !important;
        text-align: center !important;
        display: block !important;
        transition: color 0.15s !important;
    }

    html.blocklist-minimal .blocklist-full-link:hover {
        color: #fff !important;
    }

    html.blocklist-minimal .blocklist-tab-btn {
        background: transparent !important;
        border: none !important;
        color: #666 !important;
        padding: 0.5rem 1rem !important;
        font-size: 13px !important;
        cursor: pointer !important;
        border-bottom: 2px solid transparent !important;
        transition: color 0.15s, border-color 0.15s !important;
    }

    html.blocklist-minimal .blocklist-tab-btn:hover {
        color: #aaa !important;
    }

    html.blocklist-minimal .blocklist-tab-btn.active {
        color: #fff !important;
        border-bottom-color: #fff !important;
    }

    html.blocklist-minimal .blocklist-tab-content {
        display: none !important;
        flex-direction: column !important;
        flex: 1 !important;
        overflow: hidden !important;
    }

    html.blocklist-minimal .blocklist-tab-content.active {
        display: flex !important;
    }

    html.blocklist-minimal .blocklist-search {
        background: transparent !important;
        border: 1px solid #333 !important;
        border-radius: 4px !important;
        color: #aaa !important;
        padding: 0.5rem 1rem !important;
        font-size: 13px !important;
        margin: 0.5rem 0 !important;
        outline: none !important;
    }

    html.blocklist-minimal .blocklist-search:focus {
        border-color: #666 !important;
    }

    html.blocklist-minimal .blocklist-search::placeholder {
        color: #555 !important;
    }

    html.blocklist-minimal .blocklist-list {
        flex: 1 !important;
        overflow-y: auto !important;
    }

    html.blocklist-minimal .blocklist-list::-webkit-scrollbar {
        width: 6px !important;
    }

    html.blocklist-minimal .blocklist-list::-webkit-scrollbar-track {
        background: transparent !important;
    }

    html.blocklist-minimal .blocklist-list::-webkit-scrollbar-thumb {
        background: #333 !important;
        border-radius: 3px !important;
    }

    html.blocklist-minimal .blocklist-item {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 0.5rem 1rem !important;
        color: #aaa !important;
        text-decoration: none !important;
        font-size: 14px !important;
        transition: color 0.15s, background 0.15s !important;
        gap: 1rem !important;
    }

    html.blocklist-minimal .blocklist-title {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        flex: 1 !important;
    }

    html.blocklist-minimal .blocklist-duration {
        color: #666 !important;
        font-size: 12px !important;
        flex-shrink: 0 !important;
    }

    html.blocklist-minimal .blocklist-channel {
        color: #666 !important;
        font-size: 12px !important;
        flex-shrink: 0 !important;
        min-width: 120px !important;
        max-width: 150px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }

    html.blocklist-minimal .blocklist-item:hover {
        color: #fff !important;
        background: rgba(255, 255, 255, 0.1) !important;
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

function createMinimalUI(showLists = true) {
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

            if (!showLists) {
                document.body.appendChild(container);
                return;
            }

            const tabsContainer = document.createElement('div');
            tabsContainer.id = 'blocklist-tabs-container';

            const tabsHeader = document.createElement('div');
            tabsHeader.className = 'blocklist-tabs-header';

            const wlTabBtn = document.createElement('button');
            wlTabBtn.className = 'blocklist-tab-btn';
            wlTabBtn.textContent = 'Watch Later';
            wlTabBtn.dataset.tab = 'watchlater';

            const historyTabBtn = document.createElement('button');
            historyTabBtn.className = 'blocklist-tab-btn';
            historyTabBtn.textContent = 'History';
            historyTabBtn.dataset.tab = 'history';

            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'blocklist-refresh';
            refreshBtn.textContent = '↻';
            refreshBtn.title = 'Refresh';

            tabsHeader.appendChild(wlTabBtn);
            tabsHeader.appendChild(historyTabBtn);
            tabsHeader.appendChild(refreshBtn);
            tabsContainer.appendChild(tabsHeader);

            const wlContent = document.createElement('div');
            wlContent.className = 'blocklist-tab-content';
            wlContent.dataset.tab = 'watchlater';

            const wlSearch = document.createElement('input');
            wlSearch.className = 'blocklist-search';
            wlSearch.type = 'text';
            wlSearch.placeholder = 'Filter watch later...';
            wlContent.appendChild(wlSearch);

            const watchLaterList = document.createElement('div');
            watchLaterList.className = 'blocklist-list';
            wlContent.appendChild(watchLaterList);

            const wlFullLink = document.createElement('a');
            wlFullLink.className = 'blocklist-full-link';
            wlFullLink.href = 'https://www.youtube.com/playlist?list=WL';
            wlFullLink.textContent = 'Go to full list →';
            wlContent.appendChild(wlFullLink);

            tabsContainer.appendChild(wlContent);

            const historyContent = document.createElement('div');
            historyContent.className = 'blocklist-tab-content';
            historyContent.dataset.tab = 'history';

            const historySearch = document.createElement('input');
            historySearch.className = 'blocklist-search';
            historySearch.type = 'text';
            historySearch.placeholder = 'Filter history...';
            historyContent.appendChild(historySearch);

            const historyList = document.createElement('div');
            historyList.className = 'blocklist-list';
            historyContent.appendChild(historyList);

            const historyFullLink = document.createElement('a');
            historyFullLink.className = 'blocklist-full-link';
            historyFullLink.href = 'https://www.youtube.com/feed/history';
            historyFullLink.textContent = 'Go to full list →';
            historyContent.appendChild(historyFullLink);

            tabsContainer.appendChild(historyContent);

            container.appendChild(tabsContainer);
            document.body.appendChild(container);

            let wlLoaded = false;
            let historyLoaded = false;
            let activeTab = null;
            const timestamps = { watchlater: null, history: null };

            function updateTooltip() {
                if (!activeTab || !timestamps[activeTab]) return;
                const ageMs = Date.now() - timestamps[activeTab];
                const ageMins = Math.floor(ageMs / 60000);
                const ageSecs = Math.floor((ageMs % 60000) / 1000);
                if (ageMins > 0) {
                    refreshBtn.title = `Cached ${ageMins}m ${ageSecs}s ago`;
                } else {
                    refreshBtn.title = `Cached ${ageSecs}s ago`;
                }
            }

            setInterval(updateTooltip, 1000);

            function activateTab(tabName, forceRefresh = false) {
                activeTab = tabName;
                document.querySelectorAll('.blocklist-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === tabName);
                });
                document.querySelectorAll('.blocklist-tab-content').forEach(content => {
                    content.classList.toggle('active', content.dataset.tab === tabName);
                });
                refreshBtn.classList.add('visible');
                updateTooltip();

                if (tabName === 'watchlater' && (!wlLoaded || forceRefresh)) {
                    wlLoaded = true;
                    fetchVideoList('watch-later', watchLaterList, wlSearch, forceRefresh, refreshBtn, (ts) => { timestamps.watchlater = ts; updateTooltip(); });
                } else if (tabName === 'history' && (!historyLoaded || forceRefresh)) {
                    historyLoaded = true;
                    fetchVideoList('history', historyList, historySearch, forceRefresh, refreshBtn, (ts) => { timestamps.history = ts; updateTooltip(); });
                }
            }

            wlTabBtn.addEventListener('click', () => {
                if (activeTab === 'watchlater') {
                    activeTab = null;
                    wlTabBtn.classList.remove('active');
                    wlContent.classList.remove('active');
                    refreshBtn.classList.remove('visible');
                } else {
                    activateTab('watchlater');
                }
            });
            historyTabBtn.addEventListener('click', () => {
                if (activeTab === 'history') {
                    activeTab = null;
                    historyTabBtn.classList.remove('active');
                    historyContent.classList.remove('active');
                    refreshBtn.classList.remove('visible');
                } else {
                    activateTab('history');
                }
            });
            refreshBtn.addEventListener('click', () => {
                if (activeTab) activateTab(activeTab, true);
            });
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => observer.disconnect(), 10000);
}

function fetchVideoList(action, container, searchInput, forceRefresh = false, refreshBtn = null, onTimestamp = null) {
    if (refreshBtn) refreshBtn.classList.add('loading');
    chrome.runtime.sendMessage({ action: `fetch-${action}`, forceRefresh }, (response) => {
        if (refreshBtn) refreshBtn.classList.remove('loading');
        if (response && response.timestamp && onTimestamp) {
            onTimestamp(response.timestamp);
        }
        if (response && response.success && response.videos.length > 0) {
            const videos = response.videos;

            function renderVideos(filter = '') {
                container.innerHTML = '';
                const lowerFilter = filter.toLowerCase();

                videos.forEach(video => {
                    if (filter && !video.title.toLowerCase().includes(lowerFilter) &&
                        !video.channel.toLowerCase().includes(lowerFilter)) {
                        return;
                    }

                    const link = document.createElement('a');
                    link.className = 'blocklist-item';
                    link.href = `https://www.youtube.com/watch?v=${video.videoId}`;

                    if (video.channel) {
                        const channel = document.createElement('span');
                        channel.className = 'blocklist-channel';
                        channel.textContent = video.channel;
                        link.appendChild(channel);
                    }

                    const title = document.createElement('span');
                    title.className = 'blocklist-title';
                    title.textContent = video.title;
                    link.appendChild(title);

                    if (video.duration) {
                        const duration = document.createElement('span');
                        duration.className = 'blocklist-duration';
                        duration.textContent = video.duration;
                        link.appendChild(duration);
                    }


                    container.appendChild(link);
                });
            }

            renderVideos();

            searchInput.addEventListener('input', (e) => {
                renderVideos(e.target.value);
            });
        }
    });
}

injectStyles();

if (isYoutubeHomepage()) {
    chrome.storage.sync.get(["youtubeMinimalMode", "youtubeShowLists"], ({ youtubeMinimalMode, youtubeShowLists }) => {
        if (youtubeMinimalMode) {
            const showLists = youtubeShowLists !== false;
            createMinimalUI(showLists);
        }
    });
}
