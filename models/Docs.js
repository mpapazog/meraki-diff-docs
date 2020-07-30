// Docs.js

var Meraki = require('./Meraki');
const Config = require('./Config');

class DocsClass {
    constructor() {
    }
        
    diffPaths(shortPaths, longPaths) {
        let diff = {};
        for (var path in longPaths) {
            if (Object.prototype.hasOwnProperty.call(longPaths, path)) {
                if (!Object.prototype.hasOwnProperty.call(shortPaths, path)) {
                    diff[path] = longPaths[path];
                }
            }
        }
        return diff;
    }
    
    async get(version) {
        console.log("getting version " + version);
        var response    = {error: "Invalid API version"}
        var gaSpec      = {};
        var betaSpec    = {};
        var diffPaths   = {};
        
        switch (version) {
            case "v0":
                gaSpec      = await Meraki.v0.getOpenAPISpec(Config.gaOrgId);
                betaSpec    = await Meraki.v0.getOpenAPISpec(Config.betaOrgId);
                break;
            case "v1":
                gaSpec      = await Meraki.v1.getOpenAPISpec(Config.gaOrgId);
                betaSpec    = await Meraki.v1.getOpenAPISpec(Config.betaOrgId);
                break;
        }
        
        diffPaths   = this.diffPaths(gaSpec["paths"], betaSpec["paths"]);
                
        response    = {
            generalAvailabilitySpec : gaSpec,
            betaSpec                : betaSpec,
            diffPaths               : diffPaths
        };
        console.log("processing complete");
        return response;
    }
} // class DocsClass

var Docs = new DocsClass();

module.exports = Docs;