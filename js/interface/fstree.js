
// https://github.com/daweilv/treejs/tree/master
class FileSystemTree extends Tree {
    static DEFAULT_CONFIGURATION = {
        container: undefined,
        fsTree: undefined,
        root: undefined,
        selection: true,
        multiple: false,
        selectFiles: true,
        selectFolders: true,
        eventListeners: {
            switcher: [],
            value: []
        },
        afterInit: () => {}
    }
    // constructor(container, fsTree, root, selection=true) {
    constructor(configuration= FileSystemTree.DEFAULT_CONFIGURATION) {
        configuration = {...FileSystemTree.DEFAULT_CONFIGURATION, ...configuration}
        if(configuration.multiple && configuration.selectFolders && !configuration.selectFiles) throw new Error("Multiple folders excluding files is not supported")
        const treeData = FileSystemTree._build_tree(configuration.fsTree, configuration.root);
        super(configuration.container, {
            data: treeData,
            loaded: function() {
                this.selection = configuration.selection;
                this.multiple = configuration.multiple;
                this.lastSelection = [];
                this.selectFiles = configuration.selectFiles;
                this.selectFolders = configuration.selectFolders;
                this.rootPath = configuration.root;
                this.eventListeners = configuration.eventListeners;
                this.afterInit = configuration.afterInit;
                // Don't worry about the warning
                this.onLoaded();
            },
            onChange:  function() {
                this.onChanged()
            }
        });

    }

    onSwitcherClick(switcherElement) {
        let liElement = switcherElement.parentElement;
        // console.log("Clicked on switcher:", switcherElement)
        let found = false;
        for(let key of Object.keys(this.liElementsById)){
            if(this.liElementsById[key] === liElement) found = key;
        }
        if(found) {
            if(liElement.classList.contains('treejs-node__close')) {
                console.log("Opening: ", found )
                this.reloadNode(found, liElement).then(() => {
                    super.onSwitcherClick(switcherElement);
                });
            } else {
                super.onSwitcherClick(switcherElement);
            }
        } else {
            super.onSwitcherClick(switcherElement);
        }
        for(let listener of this.eventListeners.switcher){
            listener(found)
        }
    }

    async reloadNode(rootPath, liElement){
        this.lastSelection = [...this.values];
        let {fsTree, root} = await FileSystemTree.getFSTree(rootPath.length > 0 && rootPath.length < 3 && !rootPath.endsWith("/") ? rootPath + "/" :rootPath);
        const treeData = FileSystemTree._build_tree(fsTree, root);
        // Node data replacement
        this.nodesById[rootPath].children = treeData;
        // console.log("reloaded: ", rootPath , " with data: ", treeData, "element:", liElement.querySelector("ul.treejs-node"), "with" , this.buildTree(treeData, 1))
        // HTML Node replacement
        const treeElement = this.buildTree(treeData, 1);
        liElement.querySelector("ul.treejs-nodes").replaceWith(treeElement)
        // Update Tree data
        let {
            treeNodes,
            nodesById,
            leafNodesById
        } = Tree.parseTreeData(JSON.parse(JSON.stringify(this.treeNodes, (k, v) => k === "parent" ? undefined : v)));
        this.treeNodes = treeNodes;
        this.nodesById = nodesById;
        this.leafNodesById = leafNodesById;
        // Collapse subnodes
        Array.from(treeElement.getElementsByClassName('treejs-switcher')).forEach((switcher) => switcher.click());
        this.decorateNodes();
        this.values = this.lastSelection;
    }

    onChanged(){
        console.log("Checkbox changed: ", this.values);

        let newSelection = [...this.values]
        for(let prevId of this.lastSelection){
            if(newSelection.includes(prevId)) newSelection.splice(newSelection.indexOf(prevId), 1)
        }
        this.lastSelection = [...this.values];
        function callListeners() {
            for (let listener of this.eventListeners.value) {
                listener(this.values, newSelection)
            }
        }
        if(!this.multiple) {
            if(this.values.length > 1) {
                if(this.selectFiles || (this.selectFolders && newSelection.length === 1)){
                    newSelection = [newSelection[newSelection.length - 1]];
                    this.values = newSelection;
                } else if(this.selectFolders && newSelection.length > 1) {
                    // Unselect all is not possible, keep all selected
                }
            }else{
                callListeners.call(this);
            }
        } else{
            callListeners.call(this);
        }
    }
    // override walkDown
    walkDown(node, changeState) {
        if (node.children && node.children.length) {
            node.children.forEach(child => {
                if ((changeState === 'status' && child.disabled) || (!this.multiple && this.selectFolders)) return; // Added || (!this.multiple && this.selectFolders)
                child[changeState] = node[changeState];
                this.markWillUpdateNode(child);
                this.walkDown(child, changeState);
            });
        }
    };
    // override getValues
    getValues() {
        const values = [];
        for (let id in this.nodesById) {
            if (this.nodesById.hasOwnProperty(id)) {
                const node = this.nodesById[id];
                if (
                    (node.status === 1 ||
                    node.status === 2) &&
                    node.children.every(child => child.status !== 1 && child.status !== 2)
                ) {
                    values.push(id);
                }
            }
        }
        return values;
    };

    onLoaded(){
        this.collapseAll();
        this.decorateNodes();
        if(this.afterInit && typeof this.afterInit === "function") this.afterInit.bind(this)();
    }

    removeCheckboxes(){
        let container_div = document.querySelector(this.container);
        container_div.querySelectorAll(".treejs-checkbox").forEach((span) => {
            const node = this.nodesById[span.parentNode.nodeId];
            if(this.isCheckboxDisabled(node)){
                span.style.display = "none";
            }
        })
    }

    isCheckboxDisabled(node) {
        return !this.selection ||
            (this.selection && !this.selectFiles && !node.attributes.isDirectory) ||
            (this.selection && !this.selectFolders && node.attributes.isDirectory);
    }

    decorateNodes(){
        for (let id of Object.keys(this.liElementsById)){
            let liElement = this.liElementsById[id];
            let node = this.nodesById[id];
            if(!node) {
                console.log("Node not found for ID:" , id)
                continue;
            }
            let iconSpan = liElement.querySelector(".treejs-icons");
            if(!iconSpan){
                iconSpan = document.createElement("span");
                iconSpan.className = "treejs-icons";
                let checkbox = liElement.querySelector(".treejs-checkbox")
                checkbox.after(iconSpan);
            }
            if(node.attributes.isDirectory && !liElement.querySelector("svg.folder-icon")){
                let folderIcon = document.getElementById("folderIcon").cloneNode(true);
                folderIcon.setAttribute('id', '');
                folderIcon.style.display = '';
                iconSpan.append(folderIcon);

            }
            if(!node.attributes.isDirectory && !liElement.querySelector("svg.file-icon")){
                let fileIcon = document.getElementById("fileIcon").cloneNode(true);
                fileIcon.setAttribute('id', '');
                fileIcon.style.display = '';
                iconSpan.append(fileIcon);
            }
        }
        this.removeCheckboxes()
    }


    // Override Tree bindEvent to disable checkboxes (https://github.com/daweilv/treejs/blob/master/src/index.js)
    bindEvent(ele) {
        ele.addEventListener(
            'click',
            this.onTreeClick.bind(this),
            false
        );
    };

    onTreeClick(e) {
        const {target} = e;
        if (
            target.nodeName === 'SPAN' &&
            (target.classList.contains('treejs-checkbox') ||
                target.classList.contains('treejs-label'))
        ) {
            const id = target.parentNode.nodeId;
            const node = this.nodesById[id];
            if(!this.isCheckboxDisabled(node)) this.onItemClick(id);
        } else if (
            target.nodeName === 'LI' &&
            target.classList.contains('treejs-node')
        ) {
            const id = target.nodeId;
            const node = this.nodesById[id];
            if(!this.isCheckboxDisabled(node)) this.onItemClick(id);
        } else if (
            target.nodeName === 'SPAN' &&
            target.classList.contains('treejs-switcher')
        ) {
            this.onSwitcherClick(target);
        }
    }

    addEventListener(event, callback){
        this.eventListeners[event].push(callback);
    }

    removeEventListener(event, callback){
        this.eventListeners[event].splice(this.eventListeners[event].indexOf(callback), 1)
    }

    static _build_tree(fsTree, currentPosition=""){
        let tree_root = [];
        for(let node of Object.keys(fsTree)){
            const currentNode = path.join(currentPosition, node);
            let item = {
                id: currentNode,
                text:  node,
            };
            if(typeof fsTree[node] === "string"){
                item.children = [];
                item.attributes = {isDirectory: fsTree[node] === "DIR"}
            } else if(typeof fsTree[node] === "object") {
                item.children = FileSystemTree._build_tree(fsTree[node], currentNode)
                item.attributes = {isDirectory: true};
            }
            tree_root.push(item);
        }
        return tree_root;
    }

    static async getFSTree(rootPath){
        let fsTree = await FileManagerAPI.getFSTree(rootPath, 2)
        let root = Object.keys(fsTree)[0]
        fsTree = fsTree[root]
        return {fsTree, root};
    }
}

async function createWorkspaceFSTree(elementID, afterInit){
    let {fsTree, root} = await FileSystemTree.getFSTree(selectedWorkspacePath);
    return new FileSystemTree({
        container: "#" + elementID,
        fsTree,
        root,
        selection: true,
        multiple: false,
        selectFiles: true,
        selectFolders: false,
        afterInit
    })
    // return new FileSystemTree("#" + elementID, fsTree, root, true)
}
async function createFilePickerFSTree(elementID, root, multiple, files, folders, afterInit){
    let tree = await FileSystemTree.getFSTree(root);
    return new FileSystemTree({
        container: "#" + elementID,
        fsTree: tree.fsTree,
        root: tree.root,
        selection: true,
        multiple: multiple,
        selectFiles: files,
        selectFolders: folders,
        afterInit
    })
    // return new FileSystemTree("#" + elementID, fsTree, root, true)
}