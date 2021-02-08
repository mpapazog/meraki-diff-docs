class DocumentationEndpointClass {
    constructor() {
        this.id                 = "";
        this.name               = "";
        this.path               = "";
        this.verb               = "";
        this.availabilityStatus = ""; // "ga" or "beta"
        this.description        = "";
        this.parameters         = [];
        this.request            = "";
        this.responseCode       = "";
        this.responseDescription= "";
        this.responseExample    = null;
        this.tags               = [];
    }
}

class DocumentationCategoryClass {
    constructor() {
        this.title              = "";
        this.navName            = "";
        this.availabilityStatus = ""; // "ga", "beta" or "mixed"
        this.endpoints          = []; 
    }
}

class ApiDocumentationClass {
    constructor() {
        this.title              = "";
        this.version            = "";
        this.categories         = [];
    }
    
}

var USERNAME = "";
var PASSWORD = "";
var USER_PREFERENCES = {
    apiVersion: "v1",
    colourScheme: "default"    
};
var AUTH_REQUIRED = null;

function firstCapital(inputString) {
    return inputString[0].toUpperCase() + inputString.slice(1); 
}

function correctAcronymCapitalization(inputString) {
    const acronyms = [
        "API", "APNs", "CDP", "CoS", "DHCP", "DSCP", "HTTP", "LAN", "LLDP", "MQTT", "MTU", 
        "OpenAPI", "PII", "QoS", "RF", "SAML", "SM", "SNMP", "SSIDs", "STP", "VLAN", "VLANs", "VPN", "VPP"
    ];
    var words = inputString.split(" ");
    var wordCount = words.length;
    var acroCount = acronyms.length;
    var result = "";
    
    for (var i = 0; i < wordCount; i++) {
        var lowerWord = words[i].toLowerCase();
        var foundMatch = false;
        for (var j = 0; j < acroCount; j++) {
            if (lowerWord == acronyms[j].toLowerCase()) {
                result = result + " " + acronyms[j];
                foundMatch = true;
                break;
            }
        }
        if (!foundMatch) {
            if (words[i].length > 0) {
                result = result + " " + words[i];                
            }
        }
    }
    result = result.trim();
    
    return result;
}

function createCategoryTitle(pathData, apiVersion) {
    var result = "";
            
    switch (apiVersion) {
        case 0:
            for (i in pathData) {
                result = firstCapital(pathData[i].tags[0]);
                break;
            }
            break;
        case 1:
            for (i in pathData) {
                if (pathData[i].tags.length < 3) {
                    result = firstCapital(pathData[i].tags[0]);
                }
                else {
                    result = firstCapital(pathData[i].tags[0]) + " " + firstCapital(pathData[i].tags[2]);
                    result = result.replace(/([A-Z])/g, ' $1').trim(); // Add space before every capital letter
                    result = correctAcronymCapitalization(result);
                }
                break;
            }
            break;
    }
        
    return result;
}

function getCategoryIndex (categoryArray, title) {
    var arrayLength = categoryArray.length;
    for (var i = 0; i < arrayLength; i++) {
        if (categoryArray[i].title == title) {
            return i;
        }
    }
    return -1;
}

function createEndpointName (endpointDescription) {
    var splitDescription = endpointDescription.split(".");
    var trimmed = splitDescription[0].trim()
    // Exceptions for strings "OpenAPI 2.0" and "802.1X", which would otherwise be cut short
    if (trimmed.search("OpenAPI") != -1 || trimmed.search("802") != -1) {
        return endpointDescription;
    }
    return trimmed;
}

function checkEndpointForBetaStatus(path, betaList) {
    if (path in betaList) {
        return true;
    }    
    return false;
}

function createDocumentationObject (rawObject) {
    let result      = new ApiDocumentationClass();
    result.title    = rawObject.betaSpec.info.title;
    result.version  = rawObject.betaSpec.info.version;
    var apiVersion  = parseInt(rawObject.betaSpec.info.version[0]);
    
    // Create categories
    for (path in rawObject.betaSpec.paths) {
        for (verb in rawObject.betaSpec.paths[path]) {
            var arrayLength = result.categories.length;
            var categoryTitle = createCategoryTitle(rawObject.betaSpec.paths[path], apiVersion);
            if (getCategoryIndex(result.categories, categoryTitle) == -1) {
                var newCategory = new DocumentationCategoryClass();
                newCategory.title = categoryTitle;
                newCategory.navName = newCategory.title.replace(/\s/g, '').replace(':', ''); // remove spaces with RegEx
                result.categories.push(newCategory); 
            }
            var index = getCategoryIndex(result.categories, categoryTitle);
            var endpoint = new DocumentationEndpointClass();
            endpoint.id   = rawObject.betaSpec.paths[path][verb].operationId;
            endpoint.name = createEndpointName(rawObject.betaSpec.paths[path][verb].summary);
            endpoint.path = path;
            endpoint.verb = verb.toUpperCase();
            
            for (var returnCode in rawObject.betaSpec.paths[path][verb].responses) {
                endpoint.responseCode = returnCode;
                endpoint.responseDescription = rawObject.betaSpec.paths[path][verb].responses[returnCode].description;
                if (typeof rawObject.betaSpec.paths[path][verb].responses[returnCode].examples != "undefined") {
                    for (var encoding in rawObject.betaSpec.paths[path][verb].responses[returnCode].examples) {
                        if (Array.isArray(rawObject.betaSpec.paths[path][verb].responses[returnCode].examples[encoding])) {
                            endpoint.responseExample = rawObject.betaSpec.paths[path][verb].responses[returnCode].examples[encoding][0];
                        } else {
                            endpoint.responseExample = rawObject.betaSpec.paths[path][verb].responses[returnCode].examples[encoding];
                        }
                    }
                }
            }
            
            if (typeof rawObject.betaSpec.paths[path][verb].parameters != "undefined") {
                endpoint.parameters = rawObject.betaSpec.paths[path][verb].parameters;                
            }
            if (path in rawObject.diffPaths) {
                endpoint.availabilityStatus = "beta";
            } else {
                endpoint.availabilityStatus = "ga";
            }
            
            for (i in rawObject.betaSpec.paths[path][verb].tags) {
                endpoint.tags.push(rawObject.betaSpec.paths[path][verb].tags[i]);
            }
            
            result.categories[index].endpoints.push(endpoint);
        }
    }
    
    result.categories.sort(function (a, b) {
        if (a.title > b.title) {
            return 1;
        }
        if (b.title > a.title) {
            return -1;
        }
        return 0;
    });
    
    //Tag categories as beta/non-beta based on included endpoints
    for (category in result.categories) {
        for (endpoint in result.categories[category].endpoints) {
            if (result.categories[category].endpoints[endpoint].availabilityStatus == "beta") {
                if (result.categories[category].availabilityStatus == "") {
                    result.categories[category].availabilityStatus = "beta";
                }
                else if (result.categories[category].availabilityStatus == "ga") {
                    result.categories[category].availabilityStatus = "mixed";
                }
            } else {
                // endpoint is GA
                if (result.categories[category].availabilityStatus == "") {
                    result.categories[category].availabilityStatus = "ga";
                }
                else if (result.categories[category].availabilityStatus == "beta") {
                    result.categories[category].availabilityStatus = "mixed";
                }
            }
        }
    }
    
    //console.log(rawObject);    
    //console.log(result);
    
    return result;
} // createDocumentationObject

function addMainMenuLinkOnclickEvent(menuItemId, targetItemId, checkInterval){
    var menuItem = document.getElementById(menuItemId);
    if (menuItem == null) {
        setTimeout (function() {
            addMainMenuLinkOnclickEvent(menuItemId, targetItemId, checkInterval);
        } ,checkInterval);
    } else {
        menuItem.onclick = function(event) {
            if (navigator.userAgent.search("Chrome") != -1) {
                // Chrome has issues with smooth scrolling
                document.getElementById(targetItemId).scrollIntoView();
            } else {
                document.getElementById(targetItemId).scrollIntoView({ behavior: 'smooth' });                
            }
        };
    }
}

function buildMenu(endpointCategories) {
    var colourBlindMode = USER_PREFERENCES ? USER_PREFERENCES.colourScheme == "colourBlind" : false;
    var menuPanel = document.getElementById("divMenu");
    menuPanel.innerHTML = "";
    
    var arrayLength = endpointCategories.length;
    for (var i = 0; i < arrayLength; i++) {
        var p = document.createElement("p");
        var a = document.createElement("a");
        let navLink = "section" + endpointCategories[i].navName;
        let aId = "menuItem" + endpointCategories[i].navName;
        var anchorLink = document.createTextNode(endpointCategories[i].title);
        a.appendChild(anchorLink);
        a.title = endpointCategories[i].title;
        a.href  = "#";
        a.id    = aId;
        a.classList.add("menu-item");
        switch (endpointCategories[i].availabilityStatus) {
            case "ga":
                if (colourBlindMode) {
                    a.classList.add("text-colour-ga-colourblind");                  
                }
                else {
                    a.classList.add("text-colour-ga");                
                } 
                break;
            case "beta":
                if (colourBlindMode) {
                    a.classList.add("text-colour-beta-colourblind"); 
                }
                else {
                    a.classList.add("text-colour-beta");                
                } 
                break;
            case "mixed":
                if (colourBlindMode) {
                    a.classList.add("text-colour-mixed-colourblind");                
                }
                else {
                    a.classList.add("text-colour-mixed");                 
                } 
                break;
        }
        p.appendChild(a);
        menuPanel.appendChild(p);
        addMainMenuLinkOnclickEvent(aId, navLink, 10);
    }    
}

function buildMainItemTitle(item) {
    var colourBlindMode = USER_PREFERENCES ? USER_PREFERENCES.colourScheme == "colourBlind" : false;
    var title = document.createElement("h2");
    title.innerText = item.title;
    title.name = "section" + item.navName;
    title.id = "section" + item.navName;
    switch (item.availabilityStatus) {
        case "ga":
            if (colourBlindMode) {
                title.classList.add("text-colour-ga-colourblind");                  
            }
            else {
                title.classList.add("text-colour-ga");                
            } 
            break;
        case "beta":
            if (colourBlindMode) {
                title.classList.add("text-colour-beta-colourblind"); 
            }
            else {
                title.classList.add("text-colour-beta");                
            } 
            break;
        case "mixed":
            if (colourBlindMode) {
                title.classList.add("text-colour-mixed-colourblind");                
            }
            else {
                title.classList.add("text-colour-mixed");                 
            } 
            break;
    }
    return title;
}

function addEnpointTitleShowHideEvent(titleItemId, targetItemId, checkInterval){
    var menuItem = document.getElementById(titleItemId);
    if (menuItem == null) {
        setTimeout (function() {
            addEnpointTitleShowHideEvent(titleItemId, targetItemId, checkInterval);
        } ,checkInterval);
    } else {
        menuItem.onclick = function(event) {
            var target = document.getElementById(targetItemId);
            if (target.style.display === "none") {
                target.style.display = "block";
            } else {
                target.style.display = "none";
            }
        };
    }
}

function camelCaseToHyphenated (endpointId) {
    var result = "";
    for (var i=0; i<endpointId.length; i++) {
        if (endpointId[i] == endpointId[i].toLowerCase()) {
            result += endpointId[i];
        } else {
            result += "-" + endpointId[i].toLowerCase();
        }
    }    
    return result;
}

function buildMainPanelEndpoint(item, versionStr) {
    var colourBlindMode = USER_PREFERENCES ? USER_PREFERENCES.colourScheme == "colourBlind" : false;
    var endpoint = document.createElement("div");
    endpoint.classList.add("main-panel-endpoint");
    var name = document.createElement("a");
    var anchorLink = document.createTextNode(item.name);
    name.appendChild(anchorLink);
    name.title = item.name;
    let titleId = item.id + "Title";
    name.id = titleId;
    name.href  = "#";
    switch (item.availabilityStatus) {
        case "beta":
            if (colourBlindMode) {
                name.classList.add("text-colour-beta-colourblind");                      
            }
            else {
                name.classList.add("text-colour-beta");                
            }
            break;
        default:
            name.classList.add("text-colour-default");
    }
    name.classList.add("main-panel-endpoint-title");
    endpoint.appendChild(name);
    
    var content = document.createElement("div");
    let contentId = item.id + "Content";
    content.id = contentId;
    content.style.display = "none";
    
    // Form request content item
    var requestLabel = document.createElement("p");
    requestLabel.innerText = "HTTP REQUEST";
    requestLabel.classList.add("main-panel-endpoint-block-header");
    content.appendChild(requestLabel);
    var requestTable = document.createElement("table");
    var row = document.createElement("tr");
    var verbCell = document.createElement("td");
    verbCell.classList.add("main-panel-endpoint-http-verb-cell");
    var verbContainer = document.createElement("div");
    var verb = document.createElement("p");
    verb.innerText = item.verb;
    verb.classList.add("main-panel-endpoint-http-verb");
    verbContainer.appendChild(verb);
    verbCell.appendChild(verbContainer);
    var path = document.createElement("td");
    path.innerText = item.path;
    path.classList.add("code");
    row.appendChild(verbCell);
    row.appendChild(path);
    requestTable.appendChild(row);
    content.appendChild(requestTable);
    
    // Form parameters content item
    var parametersLabel = document.createElement("p");
    parametersLabel.innerText = "QUERY PARAMETERS";
    parametersLabel.classList.add("main-panel-endpoint-block-header");
    content.appendChild(parametersLabel);
    var parameterCount = item.parameters.length;
    var queryParameters = [];
    var bodyParameters = [];
    for (var i = 0; i < parameterCount; i++) {
        if (item.parameters[i].in == "query") {
            queryParameters.push(item.parameters[i]);
        } else if (item.parameters[i].in == "body") {
            bodyParameters.push(item.parameters[i]);  
        }
    }
    var queryParameterCount = queryParameters.length;
    var queryTable = document.createElement("table");
    if (queryParameterCount > 0) {
        for (var i = 0; i < queryParameterCount; i++) {
            var qRow = document.createElement("tr");
            var qCell = document.createElement("td");
            var qInnerTable = document.createElement("table");
            var qInnerNameRow = document.createElement("tr");
            var qInnerNameData = document.createElement("td");
            qInnerNameData.innerText = queryParameters[i].name;
            qInnerNameData.classList.add("main-panel-query-parameter-name");
            qInnerNameRow.appendChild(qInnerNameData);
            qInnerTable.appendChild(qInnerNameRow);
            var qInnerDescRow = document.createElement("tr");
            var qInnerDescData = document.createElement("td");
            qInnerDescData.innerText = "Type: " + queryParameters[i].type + ". " + queryParameters[i].description;
            qInnerDescData.classList.add("main-panel-query-parameter-description");
            qInnerDescRow.appendChild(qInnerDescData);
            qInnerTable.appendChild(qInnerDescRow);
            
            qRow.appendChild(qInnerTable);
            qRow.appendChild(qCell);
            queryTable.appendChild(qRow); 
        }
    } else {
        var qRow = document.createElement("tr");
        var qCell = document.createElement("td");
        qCell.innerText = ("None");
        qCell.classList.add("main-panel-query-parameter-name");
        qRow.appendChild(qCell);
        queryTable.appendChild(qRow);        
    }
    content.appendChild(queryTable);
    
    // Form body schema documentation. Note that bodyParameters is already populated in previous section
    var parametersLabel = document.createElement("p");
    parametersLabel.innerText = "REQUEST BODY SCHEMA";
    parametersLabel.classList.add("main-panel-endpoint-block-header");
    content.appendChild(parametersLabel);
    var bodyParameterCount = bodyParameters.length;
    var bodyTable = document.createElement("table");
    if (bodyParameterCount > 0) {
        for (var i = 0; i < bodyParameterCount; i++) {
            for (schemaProperty in bodyParameters[i].schema.properties) {                
                var bRow = document.createElement("tr");
                var bCell = document.createElement("td");
                var bInnerTable = document.createElement("table");
                var bInnerNameRow = document.createElement("tr");
                var bInnerNameData = document.createElement("td");
                bInnerNameData.innerText = schemaProperty;
                bInnerNameData.classList.add("main-panel-query-parameter-name");
                bInnerNameRow.appendChild(bInnerNameData);
                bInnerTable.appendChild(bInnerNameRow);
                
                var bInnerDescRow = document.createElement("tr");
                var bInnerDescData = document.createElement("td");
                
                var propertyIsRequired = false;
                var descriptionText = "";
                if (typeof bodyParameters[i].schema.required != "undefined") {
                    propertyIsRequired = bodyParameters[i].schema.required.includes(schemaProperty);
                }                
                var descriptionText = propertyIsRequired ? "REQUIRED. Type: " : "Type: ";
                
                descriptionText = descriptionText + bodyParameters[i].schema.properties[schemaProperty].type + ". ";
                descriptionText = descriptionText + bodyParameters[i].schema.properties[schemaProperty].description;
                bInnerDescData.innerText = descriptionText;
                bInnerDescData.classList.add("main-panel-query-parameter-description");
                bInnerDescRow.appendChild(bInnerDescData);
                bInnerTable.appendChild(bInnerDescRow);
                                
                bRow.appendChild(bInnerTable);
                bRow.appendChild(bCell);
                bodyTable.appendChild(bRow);                
            }
        }
    } else {
        var bRow = document.createElement("tr");
        var bCell = document.createElement("td");
        bCell.innerText = "None";
        bCell.classList.add("main-panel-query-parameter-name");
        bRow.appendChild(bCell);
        bodyTable.appendChild(bRow);          
    }
    content.appendChild(bodyTable);
        
    // Form sample response content item
    var sampleResponseLabel = document.createElement("p");
    sampleResponseLabel.innerText = "SAMPLE RESPONSE";
    sampleResponseLabel.classList.add("main-panel-endpoint-block-header");
    content.appendChild(sampleResponseLabel);
    var httpCodeTable = document.createElement("table");
    var httpCodeRow = document.createElement("tr");
    var httpCodeData = document.createElement("td");
    httpCodeData.innerText = item.responseCode + ": ";
    httpCodeData.classList.add("code");
    httpCodeRow.appendChild(httpCodeData);
    var httpCodeDesc = document.createElement("td");
    httpCodeDesc.innerText = item.responseDescription;
    httpCodeDesc.classList.add("code");
    httpCodeRow.appendChild(httpCodeDesc);
    httpCodeTable.appendChild(httpCodeRow);
    content.appendChild(httpCodeTable);
    if (item.responseExample != null) {
        var responseOutput = document.createElement("pre");
        responseOutput.classList.add("code");
        responseOutput.classList.add("output");
        responseOutput.textContent = JSON.stringify(item.responseExample, undefined, 2);
        content.appendChild(responseOutput);        
    }
    
    // Form Official Docs / Postman collection path content item
    var docsPathLabel = document.createElement("p");
    docsPathLabel.innerText = "OFFICIAL DOCS & POSTMAN PATH";
    docsPathLabel.classList.add("main-panel-endpoint-block-header");
    content.appendChild(docsPathLabel);
    var docsPathTable = document.createElement("table");
    var docsPathRow = document.createElement("tr");
    var docsPathData = document.createElement("td");
    docsPathData.classList.add("code");
    var docsPath = "";
    if (versionStr[0] == "1") {
        const generalCategories = ["devices", "networks", "organizations"];
        if (generalCategories.includes(item.tags[0])) {
            docsPath += "general > ";
        } else {
            docsPath += "products > ";
        }
    }
    for (i in item.tags) {
        docsPath += item.tags[i] + " > ";
    }
    docsPath += item.id;
        
    if (item.availabilityStatus == "ga") {
        var docsBaseUrl = "https://developer.cisco.com/meraki/api-v1/#!";
        if (USER_PREFERENCES.apiVersion == "v0") {
            docsBaseUrl = "https://developer.cisco.com/meraki/api/#!";
        }
        var docsLink = document.createElement("a");
        var linkText = document.createTextNode(docsPath);
        docsLink.appendChild(linkText);
        docsLink.title = "Link to official documentation";
        docsLink.href = docsBaseUrl + camelCaseToHyphenated(item.id);
        docsLink.target = "_blank";
        docsPathData.appendChild(docsLink);
        
    } else {
        docsPathData.innerText = docsPath;        
    }
    
    docsPathRow.appendChild(docsPathData);
    docsPathTable.appendChild(docsPathRow);
    content.appendChild(docsPathTable);        
        
    var spacer = document.createElement("p");
    spacer.classList.add("main-panel-endpoint-spacer");
    content.appendChild(spacer);
    endpoint.appendChild(content);
    
    addEnpointTitleShowHideEvent(titleId, contentId, 10);
    
    return endpoint;
}


function buildMainPanelContent (docs) {
    var mainPanel = document.getElementById("divRight");
    mainPanel.innerHTML = "";
    var lineBreak = document.createElement("br");
    mainPanel.appendChild(lineBreak);
    lineBreak = document.createElement("br");
    mainPanel.appendChild(lineBreak);
    var panelHeader = document.createElement("h1");
    panelHeader.innerText = docs.title;
    mainPanel.appendChild(panelHeader);
    var subHeader = document.createElement("p");
    subHeader.innerText = "Version: " + docs.version;
    mainPanel.appendChild(subHeader);
    
    var arrayLength = docs.categories.length;
    for (var i = 0; i < arrayLength; i++) {
        var itemContainer = document.createElement("div");
        var itemTitle = buildMainItemTitle(docs.categories[i]);
        itemContainer.appendChild(itemTitle);
        itemContainer.classList.add("main-panel-category");
        itemContainer.id = docs.categories[i].navName;
        var endpointCount = docs.categories[i].endpoints.length;
        for (var j = 0; j < endpointCount; j++) {
            itemContainer.appendChild(buildMainPanelEndpoint(docs.categories[i].endpoints[j], docs.version));
        }
        mainPanel.appendChild(itemContainer);
    }
    var spacer = document.createElement("p");
    spacer.classList.add("main-panel-final-spacer");
    mainPanel.appendChild(spacer);
}

function refreshPage() {
    var version     = USER_PREFERENCES ? USER_PREFERENCES.apiVersion : 'v1';
    var resource    = location.protocol + "//" + location.host + "/docs/" + version;
    var headers     = {};
    
    if (AUTH_REQUIRED) {
        headers.authorization = createAuthorizationHeaderValue();
    }
    
    fetch(resource, { headers: headers })
        .then()
        .then(res => res.json())
        .then((output) => {
            var docs = createDocumentationObject(output);
            document.getElementById("divMenu").scrollTop = 0;
            document.getElementById("divRight").scrollTop = 0;
            buildMainPanelContent(docs);
            buildMenu(docs.categories);
        })
        .catch(err => { console.log("ERROR GET " + resource) });
}

function addRefreshButtonEventHandler(buttonId, checkInterval) {
    var buttonItem = document.getElementById(buttonId);
    if (buttonItem == null) {
        setTimeout (function() {
            addRefreshButtonEventHandler(buttonId, checkInterval);
        } ,checkInterval);
    } else {
        buttonItem.onclick = function() {
            refreshPage(); 
        }
    }    
}

function loadMainPage() {
    var divBody = document.getElementById("divBody");    
    divBody.innerHTML = "";
    
    var divMenu = document.createElement("div");
    divMenu.id = "divMenu";
    divMenu.classList.add("div-menu");
    divMenu.classList.add("common");
    divBody.appendChild(divMenu);   
    
    var divRight = document.createElement("div");
    divRight.id = "divRight";
    divRight.classList.add("div-right");
    divRight.classList.add("common");
    divBody.appendChild(divRight);
            
    var divPreferences = document.createElement("div");
    divPreferences.id = "divPreferences";
    divPreferences.classList.add("div-preferences");
    
    var buttonPreferences = document.createElement("button");
    buttonPreferences.id = "buttonPreferences";
    buttonPreferences.innerText = "Preferences";
    divPreferences.appendChild(buttonPreferences);
    divBody.appendChild(divPreferences);
    
    addPreferencesButtonClickEvent("buttonPreferences", 10);
    
    var divPreferencesDialogContainer = document.createElement("div");
    divPreferencesDialogContainer.id = "divPreferencesDialogContainer";
    divBody.appendChild(divPreferencesDialogContainer);
    
    triggerAutoRefresh ("divMenu", "divRight", 10);
}

function togglePreferencesDialog() {
    var divContainer = document.getElementById("divPreferencesDialogContainer"); 
    if (divContainer.innerHTML != "") {
        divContainer.innerHTML = "";        
    } else {
             
        var divPreferencesDialog = document.createElement("div");
        divPreferencesDialog.id = "divPreferencesDialog";    
        divPreferencesDialog.classList.add("div-preferences-dialog");
        divPreferencesDialog.classList.add("common");
        
        var tableSettingCategories = document.createElement("table");
        tableSettingCategories.classList.add("table-preferences");
        
        var trVersion = document.createElement("tr");
        var tdVersionLabel = document.createElement("td");
        tdVersionLabel.innerText = "API version";     
        trVersion.appendChild(tdVersionLabel);   
        
        var tdVersionSelect = document.createElement("td");
        var selectVersion   = document.createElement("select");
        selectVersion.id    = "selectVersion";
        selectVersion.name  = "selectVersion";
        
        var optionV1 = document.createElement("option");
        optionV1.value = "v1";
        optionV1.innerText = "Meraki Dashboard API v1";
        selectVersion.appendChild(optionV1);
        
        var optionV0 = document.createElement("option");
        optionV0.value = "v0";
        optionV0.innerText = "Meraki Dashboard API v0";
        selectVersion.appendChild(optionV0);
        
        var opts = selectVersion.options;
        var val = USER_PREFERENCES.apiVersion;
        for (var opt, j = 0; opt = opts[j]; j++) {
            if (opt.value == val) {
                selectVersion.selectedIndex = j;
                break;
            }
        }
        
        tdVersionSelect.appendChild(selectVersion);  
        trVersion.appendChild(tdVersionSelect);    
        tableSettingCategories.appendChild(trVersion);    
        
        var trColourBlind = document.createElement("tr");
        var tdColourBlindLabel = document.createElement("td");
        tdColourBlindLabel.innerText = "Colour blind assist";    
        trColourBlind.appendChild(tdColourBlindLabel);   
        
        var tdColourBlindInput = document.createElement("td");
        var inputColourBlind = document.createElement("input");
        inputColourBlind.type = "checkbox";
        inputColourBlind.id = "inputColourBlind";
        inputColourBlind.checked = USER_PREFERENCES.colourScheme == "colourBlind";
        tdColourBlindInput.appendChild(inputColourBlind); 
        trColourBlind.appendChild(tdColourBlindInput);  
        tableSettingCategories.appendChild(trColourBlind);  
        
        var trSubmit = document.createElement("tr");
        var tdSpacer = document.createElement("td");
        trSubmit.appendChild(tdSpacer);  
        var tdSubmit = document.createElement("td");
        var buttonSave = document.createElement("button");
        buttonSave.id = "buttonSavePreferences";
        buttonSave.innerText = "Save";    
        tdSubmit.appendChild(buttonSave);  
        trSubmit.appendChild(tdSubmit);  
        tableSettingCategories.appendChild(trSubmit); 
        
        divPreferencesDialog.appendChild(tableSettingCategories); 
        divContainer.appendChild(divPreferencesDialog);    
        
        addSaveButtonClickEvent("buttonSavePreferences", 10);
    }
}

function savePreferences() {
    var resource    = location.protocol + "//" + location.host + "/docs/user/preferences";
    var version     = document.getElementById("selectVersion").value;
    var colourScheme= document.getElementById("inputColourBlind").checked ? "colourBlind" : "default";
    
    if (AUTH_REQUIRED) {
        var body = JSON.stringify ({
            apiVersion: version,
            colourScheme: colourScheme
        });
        var method = "PUT";
        var headers = {
            'Content-Type': 'application/json',
            authorization: createAuthorizationHeaderValue()
        };
        
        fetch(resource, {
            method  : method,
            headers : headers,
            body    : body
            })
            .then()
            .then(res => res.json())
            .then((output) => {
                if (output.preferences) {
                    var preferencesChanged = false;
                    if (output.preferences.apiVersion != USER_PREFERENCES.apiVersion) {
                        preferencesChanged = true;
                        USER_PREFERENCES.apiVersion = output.preferences.apiVersion;
                    }
                    if (output.preferences.colourScheme != USER_PREFERENCES.colourScheme) {
                        preferencesChanged = true;
                        USER_PREFERENCES.colourScheme = output.preferences.colourScheme;
                    }
                    var divContainer = document.getElementById("divPreferencesDialogContainer"); 
                    divContainer.innerHTML = "";
                    if (preferencesChanged) {
                        refreshPage();
                    }
                } else {
                    console.log("Error saving preferences")
                }
                
            })
            .catch(err => { console.log("ERROR PUT " + resource) });
    } else {
        USER_PREFERENCES.apiVersion = version;
        USER_PREFERENCES.colourScheme = colourScheme;
        document.getElementById("divPreferencesDialogContainer").innerHTML = "";
        refreshPage();
    }
}

function addSaveButtonClickEvent(itemId, checkInterval) {
    var item = document.getElementById(itemId);
    if (item == null) {
        setTimeout (function() {
            addSaveButtonClickEvent(itemId, checkInterval);
        } ,checkInterval);
    } else {
        item.onclick = function () {
            savePreferences();          
        };
    }    
}

function addPreferencesButtonClickEvent(itemId, checkInterval) {
    var item = document.getElementById(itemId);
    if (item == null) {
        setTimeout (function() {
            addPreferencesButtonClickEvent(itemId, checkInterval);
        } ,checkInterval);
    } else {
        item.onclick = function () {
            togglePreferencesDialog();          
        };
    }    
}

function triggerAutoRefresh (divMenuId, divRightId, checkInterval) {
    var divMenu     = document.getElementById(divMenuId);
    var divRight    = document.getElementById(divRightId);
    if (divMenu == null || divRight == null) {
        setTimeout (function() {
            triggerAutoRefresh(divMenuId, divRightId, checkInterval);
        } ,checkInterval);
    } else {
        refreshPage();
    }    
}

function addLoginSubmitEventHandler(itemId, checkInterval) {
    var item = document.getElementById(itemId);
    if (item == null) {
        setTimeout (function() {
            addLoginSubmitEventHandler(itemId, checkInterval);
        } ,checkInterval);
    } else {
        item.addEventListener("submit", function(evt) {
            evt.preventDefault();
            login(); 
        }, true);
    }    
}

function loadLoginScreen() {
    var divBody = document.getElementById("divBody");    
    divBody.innerHTML = "";
    
    var tableLoginContainer = document.createElement("table");
    var trLoginContainer = document.createElement("tr");
    var tdLoginContainer = document.createElement("td");
    tdLoginContainer.classList.add("td-login-container");
    tdLoginContainer.classList.add("common");
    
    var divLogin = document.createElement("div");
    divLogin.classList.add("inline-block");
    
    var headerLogin = document.createElement("h1");
    headerLogin.innerText = "Meraki Dashboard API quick reference";
    headerLogin.classList.add("inline-block");
    divLogin.appendChild(headerLogin);    
    var lineBreak = document.createElement("br");
    divLogin.appendChild(lineBreak);
        
    var tableLogin = document.createElement("table");  
    tableLogin.classList.add("inline-block");
    
    var trForm = document.createElement("tr"); 
    var tdForm = document.createElement("td");     
    var formLogin = document.createElement("form"); 
    formLogin.id = "formLogin";
    formLogin.autocomplete = "on";
    formLogin.action = "#";
    var tableForm = document.createElement("table");
    
    var trName = document.createElement("tr");
    var tdNameLabel = document.createElement("td");
    var labelName = document.createElement("label");
    labelName.innerText = "Name";
    tdNameLabel.appendChild(labelName);
    trName.appendChild(tdNameLabel);
    var tdNameInput = document.createElement("td");
    var inputName = document.createElement("input");
    inputName.id = "inputName";
    tdNameInput.appendChild(inputName);
    trName.appendChild(tdNameInput);
    tableForm.appendChild(trName);
    
    var trPassword = document.createElement("tr");
    var tdPasswordLabel = document.createElement("td");
    var labelPassword = document.createElement("label");
    labelPassword.innerText = "Password"; 
    tdPasswordLabel.appendChild(labelPassword);
    trPassword.appendChild(tdPasswordLabel);
    var tdPasswordInput = document.createElement("td");
    var inputPassword = document.createElement("input");
    inputPassword.id = "inputPassword";
    inputPassword.type = "password";
    tdPasswordInput.appendChild(inputPassword);
    trPassword.appendChild(tdPasswordInput);
    tableForm.appendChild(trPassword);
    
    var trInputSubmit = document.createElement("tr");
    var tdInputSubmit = document.createElement("td");
    tdInputSubmit.colSpan = "2";
    tdInputSubmit.classList.add("td-login-button");
    var inputSubmit = document.createElement("input");
    inputSubmit.id = "inputSubmit";
    inputSubmit.type = "submit";
    inputSubmit.value = "Login";
    tdInputSubmit.appendChild(inputSubmit);
    trInputSubmit.appendChild(tdInputSubmit);
    tableForm.appendChild(trInputSubmit);       
    
    formLogin.appendChild(tableForm);
    tdForm.appendChild(formLogin);
    trForm.appendChild(tdForm);
    tableLogin.appendChild(trForm);  
    divLogin.appendChild(tableLogin); 
    
    lineBreak = document.createElement("br");
    divLogin.appendChild(lineBreak);
    
    var divLoginErrorLog = document.createElement("div");
    divLoginErrorLog.id = "divLoginErrorLog";
    divLoginErrorLog.classList.add("inline-block");
    divLoginErrorLog.classList.add("div-login-error-log");
    divLogin.appendChild(divLoginErrorLog);    
    
    tdLoginContainer.appendChild(divLogin); 
    trLoginContainer.appendChild(tdLoginContainer); 
    tableLoginContainer.appendChild(trLoginContainer); 
    divBody.appendChild(tableLoginContainer);    
    
    addLoginSubmitEventHandler("formLogin", 10);
}

function createAuthorizationHeaderValue() {
    var usernamePasswordAscii   = USERNAME + ':' + PASSWORD;
    var usernamePasswordBase64  = btoa(usernamePasswordAscii);
    var result = "Basic " + usernamePasswordBase64;
    return result;
}

function login() {
    var divLoginErrorLog = document.getElementById("divLoginErrorLog");
    divLoginErrorLog.innerText = "";
    
    var resource = location.protocol + "//" + location.host + "/docs/user/preferences";
    USERNAME = document.getElementById("inputName").value;    
    PASSWORD = document.getElementById("inputPassword").value;   
    var method = "GET";
    var headers = {
        'Content-Type': 'application/json',
        authorization: createAuthorizationHeaderValue()
    };
    
    fetch(resource, {
            method  : method,
            headers : headers
        })
        .then()
        .then(res => res.json())
        .then((output) => {
            if (output.preferences) {
                USER_PREFERENCES = output.preferences;
                loadMainPage();
            } else {
                divLoginErrorLog.innerText = "Wrong username/password";
            }
            
        })
        .catch(err => { console.log("ERROR GET " + resource) });
}

window.onload = function() {    
    var resource = location.protocol + "//" + location.host + "/docs/authentication/settings";
    
    fetch(resource)
        .then()
        .then(res => res.json())
        .then((output) => {
            if (output.authenticationRequired) {
                AUTH_REQUIRED = true;
                loadLoginScreen();
            } else {
                AUTH_REQUIRED = false;
                loadMainPage();
            }
            
        })
        .catch(err => { console.log("ERROR GET " + resource) });
}