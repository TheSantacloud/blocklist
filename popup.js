let blockList = {};

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

function toggleEditMode(tr, fullEditMode) {
    const isEditing = tr.classList.toggle('editing');

    if (!isEditing) {
        saveRow(tr);
        return;
    }

    const url = tr.querySelector('.url-col');
    const desc = tr.querySelector('.desc-col');

    if (fullEditMode) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var activeTab = tabs[0];
            var domain = new URL(activeTab.url).hostname.replace("www.", "");

            url.innerHTML = `<input type="text" value=${domain} style="width: 100%; box-sizing: border-box;"/>`
            desc.innerHTML = `<input type="text" value="${desc.children[0].innerText}" style="width: 100%; box-sizing: border-box;"/>`;
            url.children[0].focus();
            url.addEventListener('keydown', event => {
                if (event.key === 'Enter') desc.children[0].focus();
            });
            desc.addEventListener('keydown', event => {
                if (event.key === 'Enter') saveRow(tr);
            });
        });
    } else {
        const child = desc.children[0];
        child.style = "color: white;";
        child.contentEditable = true;

        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(child, 0);
        range.setEnd(child, 0);
        selection.removeAllRanges();
        selection.addRange(range);

        child.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                saveRow(tr);
            }
            else if (event.key === 'Escape') {
                event.preventDefault();
                child.style = "";
                child.contentEditable = false;
            }
        });

        document.addEventListener('click', event => {
            if (event.target.classList !== child.classList) {
                child.style = "";
                child.contentEditable = false;
            }
        });
        desc.focus();
    }
}

function saveRow(tr) {
    const url = tr.querySelector('.url-col');
    const desc = tr.querySelector('.desc-col');

    if (url && desc) {
        tr.classList.remove('editing');
    }

    const urlValue = getTableElementValue(url);
    const descValue = getTableElementValue(desc);

    if (!(urlValue && descValue)) return;

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
    switch (element.children[0].tagName) {
        case "SPAN":
            return element.children[0].innerText;
        case "INPUT":
            return element.children[0].value;
        default:
            console.error(`Row element unknown ${element.children[0].tagName}`);
            return null;
    }
}

function updateStorageBlocklist() {
    chrome.storage.sync.set({ blockList: blockList });
    populateTable(blockList);
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
    powerButton.classList.toggle("active");
    chrome.storage.sync.set({ blockListEnabled: powerButton.classList.contains("active") });
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

    populateInstructions();

    chrome.storage.sync.get("blockList", (data) => {
        if (data.blockList) {
            blockList = data["blockList"];
        }
        populateTable(blockList);
    });

});



