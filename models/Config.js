// Config.js

const fs   = require('fs');
const yaml = require('js-yaml');
const csv = require('csv-parser');

class ConfigClass {
    constructor() {
                
        const rawConfig = yaml.load(fs.readFileSync('./config/config.yaml', 'utf8'));
        //console.log(rawConfig);
        
        this.apiKey         = rawConfig.merakiDashboardAPI.apiKey; 
        this.v0BaseUrl      = rawConfig.merakiDashboardAPI.v0BaseUrl;
        this.v1BaseUrl      = rawConfig.merakiDashboardAPI.v1BaseUrl;
        this.updateInterval = rawConfig.merakiDashboardAPI.openApiSpecUpdateFrequencyHours;
        this.gaOrgId        = rawConfig.merakiDashboardAPI.generalAvailabilityOrganization.id; 
        this.gaOrgName      = rawConfig.merakiDashboardAPI.generalAvailabilityOrganization.name; 
        this.betaOrgId      = rawConfig.merakiDashboardAPI.betaOrganization.id;
        this.betaOrgName    = rawConfig.merakiDashboardAPI.betaOrganization.name;
        
        this.requireAuthentication = rawConfig.authentication.required;
        this.usersFile      = "./config/" + rawConfig.authentication.usersFilename;
        this.users          = [];
        
        if (this.requireAuthentication) {
            var users = [];
            fs.createReadStream(this.usersFile)
                .pipe(csv({
                    skipComments:true,
                    headers: ["username", "password"]
                }))
                .on('data', (data) => users.push(data))
                .on('end', () => {
                    this.users = users;
                });
        }
    }
} // class ConfigClass

const Config = new ConfigClass();

module.exports = Config;