﻿
function handleSaveConfirmation(title, saveData) { //, existingTitle) {
    FileManagerAPI.loadWorkspaces().then((workspaces) => {
        if (workspaces.hasOwnProperty(title)) {// && !existingTitle) {
            let confirmMessage = `A save with the title "${title}" already exists. Click 'OK' to overwrite, or 'Cancel' to cancel save.`;

            if (confirm(confirmMessage)) {
                // Overwrite logic - update all saves with the matching title
                FileManagerAPI.saveWorkspace(title, saveData).then(() => {
                    console.log(`Updated all saves with title: ${title}`);
                });
            }
        } else {
            new FilePicker({title: "Choose the workspace folder for " + title, home: "", multiple: false, selectFiles: false, selectFolders: true,
                onSelect: (folder) => {
                    console.log("Selected folder for save", folder[0]);
                    // Add new save
                    FileManagerAPI.createWorkspace(title, folder[0], saveData).then(() => {
                        console.log(`Updated all saves with title: ${title}`);
                    });
                    console.log(`Created new save: ${title}`);
                }
            });

        }
        updateSavedNetworks();
    });
}

function collectAdditionalSaveObjects() {
    let additionalSaveObjects = {}
    // Collecting slider values
    additionalSaveObjects.savedInputValues = JSON.parse(localStorage.getItem('inputValues')) || {};

    // Collecting saved views
    additionalSaveObjects.savedViews = savedViews

    // Combine both slider values and saved views in one string
    return additionalSaveObjects;
}

const NEWLINE_PLACEHOLDER = "__NEWLINEplh__";

function restoreNewLinesInPreElements(nodeElement) {
    nodeElement.querySelectorAll('pre').forEach(pre => {
        pre.innerHTML = pre.innerHTML.split(NEWLINE_PLACEHOLDER).join('\n');
    });
}

function savenet(existingTitle = null) {
    nodes.map((n) => n.updateEdgeData());
    clearNodeSelection();

    // get the save object from Node class, WindowedUI return null
    let nodeList = nodes.map((node) => node.save()).filter((node) => node !== null);

    // Remove properties already saved to file
    for (let node of nodeList) {
        for (let file of node.json.files){
            if(node.json.hasOwnProperty(file.key)) delete node.json[file.key]
        }
    }

    let zettelkastenSaveElement = window.myCodemirror.getValue();

    let additionalSaveData = collectAdditionalSaveObjects();
    // let nodesJSON = nodes.map((n) => JSON.parse(n.json()));
    let saveData = { nodes: nodeList, zettelkastenSaveElement, additionalSaveData};

    let title = existingTitle || prompt("Enter a title for this save:");
    if (title) {
        handleSaveConfirmation(title, saveData, existingTitle);
    }
}

function savenetFile(){
    let saveName = document.getElementById("save-or-load").value;
    if(saveName.trim() === "") {
        savenet()
    }else{
        savenet(saveName)
    }
}

// Attach the savenet to the save button
// document.getElementById("save-button").addEventListener("click", () => savenet());
document.getElementById("save-button").addEventListener("click", () => savenetFile());


function downloadData(title, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var tempAnchor = document.createElement('a');
    tempAnchor.download = title + '.json';
    tempAnchor.href = window.URL.createObjectURL(blob);
    tempAnchor.click();
    setTimeout(function () {
        window.URL.revokeObjectURL(tempAnchor.href);
    }, 1);
}

let selectedSaveIndex = null; // Global variable to track the selected save
let selectedWorkspacePath = null; // Global variable to track the selected workspace directory

// DONE
function updateSavedNetworks() {

    function restoreSavedWorkspaces(workspaces){
        let container = document.getElementById("saved-networks-container");
        container.innerHTML = '';
        let names = Object.keys(workspaces);
        for (let index in names) {
            let saveName = names[index]
            console.log("Updating saves: ", index, " name: ", saveName, " directory: ", workspaces[saveName])
            let div = document.createElement("div");

            // Add a class to the div if it's the selected save
            if (index === selectedSaveIndex) {
                div.classList.add("selected-save");
            }
            let titleInput = document.createElement("input");
            let data = document.createElement("span");
            let loadButton = document.createElement("button");
            let deleteButton = document.createElement("button");
            let addContentButton = document.createElement("button");

            titleInput.type = "text";
            titleInput.value = saveName;
            titleInput.style.border = "none"
            titleInput.style.width = "125px"
            titleInput.addEventListener('change', function () {
                // save.title = titleInput.value;
                // localStorage.setItem("saves", JSON.stringify(saves));
            });

            data.textContent = workspaces[saveName];
            data.style.display = "none";

            loadButton.textContent = "Select";
            loadButton.className = 'linkbuttons';
            loadButton.addEventListener('click', function () {
                document.getElementById("save-or-load").value = titleInput.value;
                selectedSaveIndex = index; // Update the selected save index
                updateSavedNetworks(); // Refresh the UI
            });


            deleteButton.textContent = "X";
            deleteButton.className = 'linkbuttons';
            deleteButton.addEventListener('click', function () {
                let confirmMessage = `Click 'OK' to delete the save, or 'Cancel' to cancel.`;

                if (confirm(confirmMessage)) {
                    let softDeleteMessage = `Click 'OK' to remove the workspace from the list, or 'Cancel' to delete the .neurIDE folder and saved files from the workspace.`;
                    if (confirm(softDeleteMessage)) {
                        // Overwrite logic - update all saves with the matching title
                        FileManagerAPI.deleteWorkspace(titleInput.value).then(()=> {
                            updateSavedNetworks();
                        });
                    }else{
                        FileManagerAPI.deleteWorkspace(titleInput.value, false).then(()=> {
                            updateSavedNetworks();
                        });
                    }

                }
            });

            addContentButton.textContent = "+";
            addContentButton.className = 'linkbuttons';
            addContentButton.addEventListener('click', function () {
                // // Create a blob from the data
                // var blob = new Blob([JSON.stringify(save.data, null, 2)], { type: 'application/json' });
                //
                // // Create a temporary anchor and URL
                // var tempAnchor = document.createElement('a');
                // tempAnchor.download = save.title + '.json';
                // tempAnchor.href = window.URL.createObjectURL(blob);
                //
                // // Simulate a click on the anchor
                // tempAnchor.click();
                //
                // // Clean up by revoking the object URL
                // setTimeout(function () {
                //     window.URL.revokeObjectURL(tempAnchor.href);
                // }, 1);
            });

            div.appendChild(titleInput);
            div.appendChild(data);
            div.appendChild(loadButton);
            div.appendChild(addContentButton);
            div.appendChild(deleteButton);
            container.appendChild(div);
        }
    }
    FileManagerAPI.loadWorkspaces().then((workspaces) => {
        // console.log("Updating saves:", workspaces)
        restoreSavedWorkspaces(workspaces);
    })

}

// Call updateSavedNetworks on page load to display previously saved networks
updateSavedNetworks();

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
container.addEventListener('drop', handleSavedNetworksDrop, false);

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

function handleSavedNetworksDrop(e) {
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
    // let node = new Node(undefined, n, true);  // Indicate edge creation with `true`
    let node = new WindowedNode({title: n.dataset.title, content: n, scale: true});
    registernode(node);
}
for (let n of nodes) {
    n.init(nodeMap);
}

function clearnet() {
    clearNodeSelection()

    // Remove automatic load/save from/to files
    FileManagerAPI.clearAutoFiles();

    // Remove all edges
    while (edges.length > 0) {
        edges[edges.length - 1].remove();
    }
    edgeDirectionalityMap.clear();

    // Remove all nodes
    while (nodes.length > 0) {
        nodes[nodes.length - 1].remove();
    }

    // Reset LLM node count
    llmNodeCount = 0;

    // Clear the CodeMirror content
    window.myCodemirror.setValue('');
}

function restoreAdditionalSaveObjects(data) {

    let savedViewsEntry = data.additionalSaveData.savedViews;
    if (savedViewsEntry) {
        savedViews = savedViewsEntry;
        updateSavedViewsCache();
        displaySavedCoordinates();
    }


    let sliderValuesEntry = data.savedInputValues;
    if (sliderValuesEntry) {
        localStorage.setItem('inputValues', sliderValuesEntry);
    }

    // Restore sliders immediately after their values have been set
    restoreInputValues();
}

document.getElementById("load-button").addEventListener("click", function () {
    // loadnet(document.getElementById("save-or-load").value, true);
    loadnetFile(document.getElementById("save-or-load").value, true);

});


function loadnet(text, clobber, createEdges = true) {
    if (clobber) {
        clearnet();
    }

    let data = JSON.parse(text);

    // Temporarily store Zettelkasten content but don't set it in myCodeMirror yet
    let zettelkastenContent;
    if (data.zettelkastenSaveElement) {
        zettelkastenContent = data.zettelkastenSaveElement;
    }

    restoreAdditionalSaveObjects(data);
    let newNodes = [];
    for (let nodeJSON of data.nodes) {
        let node = restoreNode(nodeJSON);
        newNodes.push(node);
    }

    populateDirectionalityMap(newNodes.map((node) => node.content), nodeMap);

    for (let n of newNodes) {
        n.init(nodeMap); // Initialize the node

        reconstructSavedNode(n); // Reconstruct the saved node
    }

    if (zettelkastenContent) {
        processAll = true;
        restoreZettelkastenEvent = true;
        window.myCodemirror.setValue(zettelkastenContent);
    }
}


function loadnetFile(name, clobber) {
    FileManagerAPI.loadWorkspace(name).then((workspaceData) => {
        selectedWorkspacePath = workspaceData.rootFolder;
        loadnet(JSON.stringify(workspaceData.diagram), clobber)
    })
}

function populateDirectionalityMap(nodeElements, nodeMap) {
    nodeElements.forEach(nodeElement => {
        if (nodeElement.hasAttribute('data-edges')) {
            const edgesData = JSON.parse(nodeElement.getAttribute('data-edges'));
            edgesData.forEach(edgeData => {
                const edgeKey = edgeData.edgeKey;
                if (!edgeDirectionalityMap.has(edgeKey)) {
                    edgeDirectionalityMap.set(edgeKey, {
                        start: nodeMap[edgeData.directionality.start],
                        end: nodeMap[edgeData.directionality.end]
                    });
                }
            });
        }
    });
}

function reconstructSavedNode(node, savedV2=true) {
    // Restore the title
    let titleInput = node.content.querySelector('.title-input');
    if (titleInput) {
        let savedTitle = node.content.getAttribute('data-title');
        if (savedTitle) {
            titleInput.value = savedTitle;
        }
    }
    let hasType = !nodeClasses.every((nodeClass) => !(node instanceof nodeClass));
    if (hasType && !savedV2) {
        node.afterInit();
    }
    if (node instanceof LLMNode) {
        restoreNewLinesInPreElements(node.aiResponseDiv);
    }

}