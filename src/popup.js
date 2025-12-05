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
                const tr = createTableRow(url, { desc: getRandomReason() });
                tr.dataset.isPreset = 'true';
                const tableBody = document.getElementById('tableBody');
                tableBody.appendChild(tr);
                btn.classList.add('added');
                toggleEditMode(tr, false, true);
            }
        });
    });

    populateInstructions();
    loadTimeoutInput();
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


function loadTimeoutInput() {
    const checkbox = document.getElementById('timedCheckbox');
    const input = document.getElementById('timeoutInput');
    const timeoutContainer = document.querySelector('.timedToggleContainer');

    chrome.storage.sync.get("timeoutValue", (data) => {
        if (data.timeoutValue > 0) {
            input.value = data.timeoutValue;
            input.classList.remove("hidden");
            checkbox.checked = true;
            timeoutContainer.classList.add("active");
            return;
        }
        checkbox.checked = false;
        input.classList.add("hidden");
        timeoutContainer.classList.remove("active");
    });

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            input.classList.remove("hidden");
            timeoutContainer.classList.add("active");
            chrome.storage.sync.set({ timeoutValue: input.value ? input.value : -1 });
        } else {
            input.classList.add("hidden");
            timeoutContainer.classList.remove("active");
            chrome.storage.sync.set({ timeoutValue: -1 });
        }
    });

    input.addEventListener('change', () => {
        let value = input.value;
        if (checkbox.checked == false) value = -1;
        chrome.storage.sync.set({ timeoutValue: value });
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
