﻿document.getElementById("save-button").addEventListener("click", function () {
    let zettelkastenContent = window.myCodemirror.getValue();
    let zettelkastenSaveElement = `<div id="zettelkasten-save" style="display:none;">${encodeURIComponent(zettelkastenContent)}</div>`;

    nodes.map((n) => n.updateEdgeData());
    let nodeData = document.getElementById("nodes").innerHTML;
    let saveData = nodeData + zettelkastenSaveElement;  // Combine Zettelkasten content with node data

    let title = prompt("Enter a title for this save:");
    if (title) {
        let saves = JSON.parse(localStorage.getItem("saves") || "[]");
        saves.push({ title: title, data: saveData });

        try {
            localStorage.setItem("saves", JSON.stringify(saves));
            updateSavedNetworks();
        } catch (e) {
            // localStorage quota exceeded
            if (confirm("Local storage is full, download the data as a .txt file?")) {
                downloadData(title, JSON.stringify({ data: s, zettelkastenSave: zettelkastenContent }));
            }
        }
    }
});

function downloadData(title, data) {
    var blob = new Blob([data], { type: 'text/plain' });
    var tempAnchor = document.createElement('a');
    tempAnchor.download = title + '.txt';
    tempAnchor.href = window.URL.createObjectURL(blob);
    tempAnchor.click();
    setTimeout(function () {
        window.URL.revokeObjectURL(tempAnchor.href);
    }, 1);
}

let selectedSaveIndex = null; // Global variable to track the selected save

function updateSavedNetworks() {
    let saves = JSON.parse(localStorage.getItem("saves") || "[]");
    let container = document.getElementById("saved-networks-container");
    container.innerHTML = '';

    for (let [index, save] of saves.entries()) {
        let div = document.createElement("div");

        // Add a class to the div if it's the selected save
        if (index === selectedSaveIndex) {
            div.classList.add("selected-save");
        }
        let titleInput = document.createElement("input");
        let data = document.createElement("span");
        let loadButton = document.createElement("button");
        let deleteButton = document.createElement("button");
        let downloadButton = document.createElement("button");

        titleInput.type = "text";
        titleInput.value = save.title;
        titleInput.style.border = "none"
        titleInput.style.width = "125px"
        titleInput.addEventListener('change', function () {
            save.title = titleInput.value;
            localStorage.setItem("saves", JSON.stringify(saves));
        });

        data.textContent = save.data;
        data.style.display = "none";

        loadButton.textContent = "Select";
        loadButton.className = 'linkbuttons';
        loadButton.addEventListener('click', function () {
            document.getElementById("save-or-load").value = data.textContent;
            selectedSaveIndex = index; // Update the selected save index
            updateSavedNetworks(); // Refresh the UI
        });


        deleteButton.textContent = "X";
        deleteButton.className = 'linkbuttons';
        deleteButton.addEventListener('click', function () {
            // Remove the save from the array
            saves.splice(index, 1);

            // Update local storage
            localStorage.setItem("saves", JSON.stringify(saves));

            // Update the saved networks container
            updateSavedNetworks();
        });

        downloadButton.textContent = "↓";
        downloadButton.className = 'linkbuttons';
        downloadButton.addEventListener('click', function () {
            // Create a blob from the data
            var blob = new Blob([save.data], { type: 'text/plain' });

            // Create a temporary anchor and URL
            var tempAnchor = document.createElement('a');
            tempAnchor.download = save.title + '.txt';
            tempAnchor.href = window.URL.createObjectURL(blob);

            // Simulate a click on the anchor
            tempAnchor.click();

            // Clean up by revoking the object URL
            setTimeout(function () {
                window.URL.revokeObjectURL(tempAnchor.href);
            }, 1);
        });

        div.appendChild(titleInput);
        div.appendChild(data);
        div.appendChild(loadButton);
        div.appendChild(downloadButton);
        div.appendChild(deleteButton);
        container.appendChild(div);
    }
}

// Call updateSavedNetworks on page load to display previously saved networks
updateSavedNetworks();

document.getElementById("load-button").addEventListener("click", function () {
    loadnet(document.getElementById("save-or-load").value, true);
});

let container = document.getElementById("saved-networks-container");

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    container.addEventListener(eventName, preventDefaults, false);
});

// Highlight the drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    container.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    container.addEventListener(eventName, unhighlight, false);
});

// Handle the drop
container.addEventListener('drop', handleDrop, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    container.classList.add('highlight');
}

function unhighlight(e) {
    container.classList.remove('highlight');
}

function handleDrop(e) {
    let dt = e.dataTransfer;
    let file = dt.files[0];

    if (file && file.name.endsWith('.txt')) {
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
            let content = e.target.result;
            let title = file.name.replace('.txt', '');

            try {
                // Try saving the data to localStorage
                let saves = JSON.parse(localStorage.getItem("saves") || "[]");
                saves.push({ title: title, data: content });
                localStorage.setItem("saves", JSON.stringify(saves));
                updateSavedNetworks();
            } catch (error) {
                // If local storage is full, update save-load input
                document.getElementById("save-or-load").value = content;
            }
        };
    } else {
        console.log('File must be a .txt file');
    }
}



document.getElementById("clear-button").addEventListener("click", function () {
    document.getElementById("clear-sure").setAttribute("style", "display:block");
    document.getElementById("clear-button").text = "Are you sure?";
});
document.getElementById("clear-unsure-button").addEventListener("click", function () {
    document.getElementById("clear-sure").setAttribute("style", "display:none");
    document.getElementById("clear-button").text = "Clear";
});
document.getElementById("clear-sure-button").addEventListener("click", function () {
    clearnet();
    document.getElementById("clear-sure").setAttribute("style", "display:none");
    document.getElementById("clear-button").text = "Clear";
});



document.getElementById("clearLocalStorage").onclick = function () {
    localStorage.clear();
    alert('Local storage has been cleared.');
}



for (let n of htmlnodes) {
    let node = new Node(undefined, n, true);  // Indicate edge creation with `true`
    registernode(node);
}
for (let n of nodes) {
    n.init(nodeMap);
}

function clearnet() {
    // Remove all edges
    while (edges.length > 0) {
        edges[edges.length - 1].remove();
    }

    // Remove all nodes
    while (nodes.length > 0) {
        nodes[nodes.length - 1].remove();
    }

    // Reset LLM node count
    llmNodeCount = 0;

    // Clear the CodeMirror content
    window.myCodemirror.setValue('');
}

//this is a quick fix to retain textarea height, the full fix requires all event listeners to be attatched to each node.

/* function adjustTextareaHeightToContent(nodes) {
    for (let node of nodes) {
        let textarea = node.content.querySelector('textarea');
        if (textarea) {
            textarea.style.height = 'auto'; // Temporarily shrink to content
            const maxHeight = 300; // Maximum height in pixels
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'; // Set to full content height or max height
        }
    }
} */

function loadnet(text, clobber, createEdges = true) {
    if (clobber) {
        clearnet();
    }

    let d = document.createElement("div");
    d.innerHTML = text;

    // Temporarily store Zettelkasten content but don't set it in myCodeMirror yet
    let zettelkastenSaveElement = d.querySelector("#zettelkasten-save");
    let zettelkastenContent;
    if (zettelkastenSaveElement) {
        zettelkastenContent = decodeURIComponent(zettelkastenSaveElement.innerHTML);
        //console.log("Zettelkasten Content:", zettelkastenContent);
        // Remove the Zettelkasten save element to process the rest of the nodes
        zettelkastenSaveElement.remove();
    }

    let newNodes = [];
    for (let n of d.children) {
        let node = new Node(undefined, n, true, undefined, createEdges);
        newNodes.push(node);
        registernode(node);
        if (n.dataset.init === "window")
            rewindowify(node);
    }
    for (let n of newNodes) {
        htmlnodes_parent.appendChild(n.content);
    }

    for (let n of newNodes) {
        n.init(nodeMap); // Initialize the node
        reconstructSavedNode(n); // Reconstruct the saved node
    }

    // Now that nodes are restored, set Zettelkasten content in myCodeMirror
    if (zettelkastenContent) {
        processAll = true;
        restoreZettelkastenEvent = true;
        window.myCodemirror.setValue(zettelkastenContent);
    }
}

function reconstructSavedNode(node) {
    // Restore the title
    let titleInput = node.content.querySelector('.title-input');
    if (titleInput) {
        let savedTitle = node.content.getAttribute('data-title');
        if (savedTitle) {
            titleInput.value = savedTitle;
        }
    }

    if (node.isTextNode) {
        initTextNode(node)
    }

    if (node.isLLM) {
        llmNodeCount++;
        initAiNode(node);
    }

    if (node.isLink) {
        initLinkNode(node);
    }

    if (isEditorNode(node)) {
        initEditorNode(node)
    }
}