let blockList = {};

const FUNNY_REASONS = [
    "Your future self will thank you",
    "Touch grass instead",
    "This is why you're behind on deadlines",
    "Your attention span called, it wants its life back",
    "Congratulations, you played yourself",
    "Plot twist: the content isn't that good",
    "Your brain cells are begging you to stop",
    "Remember that thing you were supposed to do?",
    "Dopamine machine broke",
    "Time to be a functioning adult",
    "Your productivity just filed a missing persons report",
    "The algorithm doesn't love you back",
    "This is not the way",
    "Your mom would be disappointed",
    "Go drink some water instead",
    "Infinite scroll, finite life",
    "Your dreams are in another castle",
    "Error 404: Self-control not found",
    "Breaking news: you're procrastinating again",
    "This website won't remember you, but your regrets will",
    "Somewhere, a book is crying",
    "Your houseplants miss you",
    "The void scrolls back",
    "Achievement unlocked: wasted another hour",
    "Your gym membership is judging you",
];

function getRandomReason() {
    return FUNNY_REASONS[Math.floor(Math.random() * FUNNY_REASONS.length)];
}

document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', (event) => searchData(event.target.value));

    const powerButton = document.getElementById("power-button");
    chrome.storage.sync.get("blockListEnabled", (data) => {
        if (data.blockListEnabled) {
            powerButton.classList.add("active");
        }
    });
    powerButton.addEventListener("click", toggleBlocklist);

    const addButton = document.getElementById('add-button-link');
    addButton.addEventListener('click', () => {
        const tr = createTableRow("", { desc: "" });
        const tableBody = document.getElementById('tableBody');
        tableBody.appendChild(tr);
        toggleEditMode(tr, true);
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (url in blockList) {
                delete blockList[url];
                btn.classList.remove('added');
                updateStorageBlocklist();
            } else {
                const desc = getRandomReason();
                blockList[url] = { desc };
                updateStorageBlocklist();
                btn.classList.add('added');
                const tr = [...document.querySelectorAll('tr')].find(r => r.querySelector('.url-col span')?.textContent === url);
                if (tr) toggleEditMode(tr, false);
            }
        });
    });

    populateInstructions();
    loadBreakFeature();
    loadYoutubeMinimalToggle();
    loadInstagramMinimalToggle();

    chrome.storage.sync.get("blockList", (data) => {
        if (data.blockList) {
            blockList = data["blockList"];
        }
        populateTable(blockList);
        updatePresetButtons();
    });

});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.blockListEnabled) {
        const powerButton = document.getElementById("power-button");
        if (changes.blockListEnabled.newValue) {
            powerButton.classList.add("active");
        } else {
            powerButton.classList.remove("active");
        }
    }
});

function createTableRow(url, { desc }) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td class="url-col"><span>${url}</span></td>
        <td class="desc-col"><span>${desc}</span></td>
        <td class="actions">
            <button class="delete-btn"> </button>
        </td>
    `;

    tr.querySelector('.desc-col').addEventListener('dblclick', () => toggleEditMode(tr, false));
    tr.querySelector('.delete-btn').addEventListener('click', () => {
        tr.remove();
        delete blockList[url];
        updateStorageBlocklist();
    });

    return tr;
}

function searchData(phrase) {
    let data = blockList;
    if (phrase.length > 0) {
        let filteredBlockList = {};
        Object.keys(blockList).forEach(key => {
            if (key.toLowerCase().includes(phrase)) {
                filteredBlockList[key] = blockList[key];
            }
        });
        if (Object.keys(filteredBlockList).length > 0) {
            data = filteredBlockList;
        }
    }

    populateTable(data);
}

function toggleEditMode(tr, fullEditMode, isPreset = false) {
    const isEditing = tr.classList.toggle('editing');

    if (!isEditing) {
        saveRow(tr);
        return;
    }

    const url = tr.querySelector('.url-col');
    const desc = tr.querySelector('.desc-col');
    const originalDesc = desc.children[0].innerText;
    const urlValue = url.children[0].innerText;

    function setupDescInput(currentValue) {
        desc.innerHTML = `<div class="desc-input-wrapper"><textarea rows="1">${currentValue}</textarea><button class="inline-randomize-btn" title="Randomize">&#x21BB;</button></div>`;
        const descInput = desc.querySelector('textarea');
        const randomBtn = desc.querySelector('.inline-randomize-btn');

        function autoGrow() {
            descInput.style.height = 'auto';
            descInput.style.height = descInput.scrollHeight + 'px';
        }
        descInput.addEventListener('input', autoGrow);
        setTimeout(autoGrow, 0);

        randomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            descInput.value = getRandomReason();
            autoGrow();
            descInput.focus();
        });

        descInput.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                saveRow(tr);
            }
        });

        return descInput;
    }

    if (fullEditMode) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var activeTab = tabs[0];
            var domain = new URL(activeTab.url).hostname.replace("www.", "");
            const randomReason = getRandomReason();

            url.innerHTML = `<input type="text" value=${domain}/>`
            const descInput = setupDescInput(randomReason);

            url.children[0].focus();
            url.children[0].select();

            url.addEventListener('keydown', event => {
                if (event.key === 'Enter') descInput.focus();
            });
        });
    } else {
        const descInput = setupDescInput(originalDesc);
        descInput.focus();
        descInput.setSelectionRange(descInput.value.length, descInput.value.length);
    }
}

function saveRow(tr) {
    const url = tr.querySelector('.url-col');
    const desc = tr.querySelector('.desc-col');

    if (url && desc) {
        tr.classList.remove('editing');
    }

    let urlValue = getTableElementValue(url);
    const descValue = getTableElementValue(desc);

    if (!(urlValue && descValue)) return;

    urlValue = urlValue.replace(/\/+$/, '');

    if (urlValue in blockList) {
        blockList[urlValue]["desc"] = descValue;
    } else {
        blockList[urlValue] = {
            "desc": descValue,
        }
    }
    updateStorageBlocklist();
}

function getTableElementValue(element) {
    const child = element.children[0];
    switch (child.tagName) {
        case "SPAN":
            return child.innerText;
        case "INPUT":
            return child.value;
        case "DIV":
            const input = child.querySelector('textarea') || child.querySelector('input');
            return input?.value || null;
        default:
            console.error(`Row element unknown ${child.tagName}`);
            return null;
    }
}

function updateStorageBlocklist() {
    chrome.storage.sync.set({ blockList: blockList });
    populateTable(blockList);
    updatePresetButtons();
}

function updatePresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (btn.dataset.url in blockList) {
            btn.classList.add('added');
        } else {
            btn.classList.remove('added');
        }
    });
}

function populateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const ordered = Object.keys(data).sort().reduce(
        (obj, key) => {
            obj[key] = data[key];
            return obj;
        },
        {}
    );

    for (const [key, value] of Object.entries(ordered || {})) {
        const tr = createTableRow(key, value);
        tableBody.appendChild(tr);
    }
}

function populateInstructions() {
    const instructionsContainer = document.getElementById("instructionsContainer");
    chrome.commands.getAll(function(commands) {
        commands.forEach(command => {
            const instruction = document.createElement('li');
            instruction.classList.add("instruction");
            let description = command.description;
            if (!description) {
                return;
            }

            instruction.innerHTML = `<span class="description">${description}</span><span class="shortcut">${command.shortcut}</span>`;
            instructionsContainer.appendChild(instruction);
        });
    });
}

function toggleBlocklist() {
    const powerButton = document.getElementById("power-button");
    const desiredState = !powerButton.classList.contains("active");
    switchBlocklist(desiredState);
}

function switchBlocklist(state) {
    const powerButton = document.getElementById("power-button");
    if (state) {
        powerButton.classList.add("active");
    } else {
        powerButton.classList.remove("active");
    }
    const timestamp = Date.now();
    chrome.storage.sync.set({ blockListEnabled: state, timestamp: timestamp });
}


let breakInterval = null;

const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

function minutesToSlider(minutes) {
    const minLog = Math.log(MIN_MINUTES);
    const maxLog = Math.log(MAX_MINUTES);
    return ((Math.log(minutes) - minLog) / (maxLog - minLog)) * 100;
}

const SNAP_VALUES = [1, 5, 15, 30, 60];
const SNAP_THRESHOLD = 3;

function sliderToMinutes(sliderValue) {
    for (const snap of SNAP_VALUES) {
        const snapPos = minutesToSlider(snap);
        if (Math.abs(sliderValue - snapPos) < SNAP_THRESHOLD) {
            return snap;
        }
    }
    const minLog = Math.log(MIN_MINUTES);
    const maxLog = Math.log(MAX_MINUTES);
    const value = Math.exp(minLog + (sliderValue / 100) * (maxLog - minLog));
    return Math.round(value);
}

function loadBreakFeature() {
    const container = document.querySelector('.breakContainer');
    const header = container.querySelector('.breakHeader');
    const editMode = container.querySelector('.breakEditMode');
    const progressView = container.querySelector('.breakProgress');
    const breakMinutesSpan = document.getElementById('breakMinutes');
    const breakCheckbox = document.getElementById('breakCheckbox');
    const editBtn = document.getElementById('breakEditBtn');
    const saveBtn = document.getElementById('breakSaveBtn');
    const breakInput = document.getElementById('breakInput');
    const breakRange = document.getElementById('breakRange');
    const breakTicks = container.querySelectorAll('.breakTicks span');
    const progressFill = container.querySelector('.breakProgressFill');
    const timeRemaining = container.querySelector('.breakTimeRemaining');

    chrome.storage.sync.get(["breakMinutes", "breakEnabled", "breakEndTime"], (data) => {
        const minutes = data.breakMinutes || 5;
        breakMinutesSpan.textContent = minutes;
        breakInput.value = minutes;
        breakRange.value = minutesToSlider(minutes);

        if (data.breakEnabled) {
            breakCheckbox.checked = true;
            container.classList.add('active');
            editBtn.classList.remove('hidden');
        }

        if (data.breakEndTime && data.breakEndTime > Date.now()) {
            showProgressView(data.breakEndTime);
        }
    });

    breakCheckbox.addEventListener('change', () => {
        const enabled = breakCheckbox.checked;
        chrome.storage.sync.set({ breakEnabled: enabled });
        if (enabled) {
            container.classList.add('active');
            editBtn.classList.remove('hidden');
        } else {
            container.classList.remove('active');
            editBtn.classList.add('hidden');
            editMode.classList.add('hidden');
        }
    });

    editBtn.addEventListener('click', () => {
        header.classList.add('hidden');
        editMode.classList.remove('hidden');
        breakInput.focus();
        breakInput.select();
    });

    breakRange.addEventListener('input', () => {
        const minutes = sliderToMinutes(breakRange.value);
        breakInput.value = minutes;
        breakRange.value = minutesToSlider(minutes);
    });

    breakInput.addEventListener('input', () => {
        const val = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parseInt(breakInput.value) || MIN_MINUTES));
        breakRange.value = minutesToSlider(val);
    });

    breakTicks.forEach(tick => {
        tick.addEventListener('click', () => {
            const value = parseInt(tick.dataset.value);
            breakInput.value = value;
            breakRange.value = minutesToSlider(value);
        });
    });

    saveBtn.addEventListener('click', saveBreakMinutes);
    breakInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBreakMinutes();
    });

    function saveBreakMinutes() {
        const value = Math.max(1, parseInt(breakInput.value) || 5);
        breakMinutesSpan.textContent = value;
        chrome.storage.sync.set({ breakMinutes: value });
        editMode.classList.add('hidden');
        header.classList.remove('hidden');
    }

    function showProgressView(endTime) {
        header.classList.add('hidden');
        editMode.classList.add('hidden');
        progressView.classList.remove('hidden');
        container.classList.add('active');

        chrome.storage.sync.get("breakMinutes", (data) => {
            const totalMs = (data.breakMinutes || 5) * 60 * 1000;
            updateProgress();

            if (breakInterval) clearInterval(breakInterval);
            breakInterval = setInterval(updateProgress, 500);

            function updateProgress() {
                const now = Date.now();
                const remaining = endTime - now;

                if (remaining <= 0) {
                    clearInterval(breakInterval);
                    breakInterval = null;
                    hideProgressView();
                    return;
                }

                const percent = (remaining / totalMs) * 100;
                progressFill.style.width = `${Math.max(0, percent)}%`;

                const mins = Math.floor(remaining / 60000);
                const secs = Math.floor((remaining % 60000) / 1000);
                timeRemaining.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        });
    }

    function hideProgressView() {
        progressView.classList.add('hidden');
        header.classList.remove('hidden');
    }

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;

        if (changes.breakEndTime) {
            const endTime = changes.breakEndTime.newValue;
            if (endTime && endTime > Date.now()) {
                showProgressView(endTime);
            } else {
                if (breakInterval) {
                    clearInterval(breakInterval);
                    breakInterval = null;
                }
                hideProgressView();
            }
        }
    });
}

function loadYoutubeMinimalToggle() {
    const checkbox = document.getElementById('youtubeMinimalCheckbox');
    const container = document.querySelector('.youtubeMinimalContainer');
    const showListsCheckbox = document.getElementById('youtubeShowListsCheckbox');

    chrome.storage.sync.get(["youtubeMinimalMode", "youtubeShowLists"], (data) => {
        if (data.youtubeMinimalMode) {
            checkbox.checked = true;
            container.classList.add("active");
        } else {
            checkbox.checked = false;
            container.classList.remove("active");
        }
        showListsCheckbox.checked = data.youtubeShowLists !== false;
    });

    checkbox.addEventListener('change', () => {
        const isEnabled = checkbox.checked;
        chrome.storage.sync.set({ youtubeMinimalMode: isEnabled });
        if (isEnabled) {
            container.classList.add("active");
        } else {
            container.classList.remove("active");
        }
    });

    showListsCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ youtubeShowLists: showListsCheckbox.checked });
    });
}

function loadInstagramMinimalToggle() {
    const checkbox = document.getElementById('instagramMinimalCheckbox');
    const container = document.querySelector('.instagramMinimalContainer');

    chrome.storage.sync.get("instagramMinimalMode", (data) => {
        if (data.instagramMinimalMode) {
            checkbox.checked = true;
            container.classList.add("active");
        } else {
            checkbox.checked = false;
            container.classList.remove("active");
        }
    });

    checkbox.addEventListener('change', () => {
        const isEnabled = checkbox.checked;
        chrome.storage.sync.set({ instagramMinimalMode: isEnabled });
        if (isEnabled) {
            container.classList.add("active");
        } else {
            container.classList.remove("active");
        }
    });
}
