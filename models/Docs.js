// Docs.js

var Meraki = require('./Meraki');
const Config = require('./Config');

class DocsClass {
    constructor() {
        this.v0GaSpec   = null;
        this.v0BetaSpec = null;
        this.v1GaSpec   = null;
        this.v1BetaSpec = null;
        this.refreshTimestamp = "<never>";
        this.updateBufferedOpenApiSpec(this);
    }
    
    async updateBufferedOpenApiSpec(self) {
        console.log(new Date().toISOString() + " Starting OpenAPI spec local cache refresh...");
        
        var v0GaSpec   = await Meraki.v0.getOpenAPISpec(Config.gaOrgId);
        var v0BetaSpec = await Meraki.v0.getOpenAPISpec(Config.betaOrgId);
        var v1GaSpec   = await Meraki.v1.getOpenAPISpec(Config.gaOrgId);
        var v1BetaSpec = await Meraki.v1.getOpenAPISpec(Config.betaOrgId);
        
        if( (v0GaSpec   != null) &&
            (v0BetaSpec != null) &&
            (v1GaSpec   != null) &&
            (v1BetaSpec != null) ) {
                self.v0GaSpec   = v0GaSpec;
                self.v0BetaSpec = v0BetaSpec;
                self.v1GaSpec   = v1GaSpec;
                self.v1BetaSpec = v1BetaSpec;
                self.refreshTimestamp = new Date().toISOString();
                console.log(self.refreshTimestamp + " Refresh complete");                
        } else {
            console.log(new Date().toISOString() + " API request errors. Skipping refresh cycle");
        }
        console.log(new Date().toISOString() + " Next refresh in " + 
            Config.updateInterval + " hour" + (Config.updateInterval!=1 ? "s" : ""));
                
        setTimeout( function(){
            self.updateBufferedOpenApiSpec(self);
        }, Config.updateInterval * 3600000 );
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
    
    getAuthSettings() {
        if (Config.requireAuthentication) {
            return { authenticationRequired: true };
        }
        return { authenticationRequired: false };
    }
    
    authenticate(username, password) {
        if (!Config.requireAuthentication) {
            return true;
        }
        for (var i=0;i<Config.users.length;i++) {
            if ( Config.users[i].username == username && Config.users[i].password == password) {
                return true;
            }
        }
        return false;
    }
    
    async get(version) {
        console.log(new Date().toISOString() + " User requested " + version);
        var response    = {error: "Invalid API version"}
        var gaSpec      = {};
        var betaSpec    = {};
        var diffPaths   = {};
        
        switch (version) {
            case "v0":
                gaSpec      = this.v0GaSpec;
                betaSpec    = this.v0BetaSpec;
                break;
            case "v1":
                gaSpec      = this.v1GaSpec;
                betaSpec    = this.v1BetaSpec;
                break;
        }
        
        diffPaths   = this.diffPaths(gaSpec["paths"], betaSpec["paths"]);
                
        response    = {
            generalAvailabilitySpec : gaSpec,
            betaSpec                : betaSpec,
            diffPaths               : diffPaths
        };
        console.log(new Date().toISOString() + " Processing complete");
        return response;
    }
} // class DocsClass

var Docs = new DocsClass();

module.exports = Docs;