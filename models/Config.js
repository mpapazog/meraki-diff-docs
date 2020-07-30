// Config.js

class ConfigClass {
    constructor() {
        
        // Edit this to match the Meraki Dashboard API key you want to use
        this.apiKey         = '1234'; 
        
        // Edit this to match the organizationId of your "General availability" organization, ie. the
        // one that does not have any limited access API endpoints enabled.
        this.gaOrgId        = '4567'; 
        
        // Edit this to match the organizationId of your "Beta" organization, ie. the
        // one that has limited access API endpoints enabled.
        this.betaOrgId      = '6543';
        
        this.v0BaseUrl      = 'https://api-mp.meraki.com/api/v0';
        this.v1BaseUrl      = 'https://api-mp.meraki.com/api/v1';
        this.maxRetries     = 3;
        this.requestTimeout = 60000;
    }
} // class ConfigClass

const Config = new ConfigClass();

module.exports = Config;