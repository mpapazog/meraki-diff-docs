// Config.js

const fs   = require('fs');
const yaml = require('js-yaml');
const csv = require('csv-parser');

class ConfigClass {
    constructor() {
                
        const rawConfig = yaml.load(fs.readFileSync('./config/config.yaml', 'utf8'));
        
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
        this.preferencesFile= "./config/" + rawConfig.authentication.userPreferencesFilename;
        
        this.defaultPreferences = {
                colourScheme: "default",
                apiVersion: "v1"            
            };
        
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
                            
                    var userPreferences = null;
                    try {
                        userPreferences = yaml.load(fs.readFileSync(this.preferencesFile, 'utf8'));            
                    }
                    catch (err) {
                        console.log("Unable to load user preferences file");
                    }
                    
                    var modifiedDefaultPreferences = false;
                    
                    for (var i=0; i<this.users.length; i++) {
                        if (userPreferences) {
                            var uname = this.users[i].username;
                            if (userPreferences[uname]) {
                                this.users[i].preferences = userPreferences[uname];
                            } else {
                                this.users[i].preferences = this.defaultPreferences;  
                                modifiedDefaultPreferences = true;
                            }
                        } else {
                            this.users[i].preferences = this.defaultPreferences;   
                            modifiedDefaultPreferences = true;
                        }
                    }
                    
                    if (modifiedDefaultPreferences) {
                        this.saveUserPreferences(this.users, this.preferencesFile);
                    }
                });
        }
    }
    
    saveUserPreferences (users, file) {
        console.log("Saving user preferences");
        var preferences = {};
        
        for (var i=0; i<users.length; i++) {
            preferences[users[i].username] = {
                colourScheme: users[i].preferences.colourScheme,
                apiVersion: users[i].preferences.apiVersion
            };
        }
        
        var yamlStr = yaml.dump(preferences);
        
        try {
            fs.writeFileSync(file, yamlStr, 'utf8');
        }
        catch(err) {
            console.log(err);
        }
    }
    
    getUserPreferences (username) {
        for (var i=0; i<this.users.length; i++) {
            if (this.users[i].username == username) {
                return this.users[i].preferences;
            }
        }
        return this.defaultPreferences;
    }
    
    updateUserPreferences (username, preferences) {
        var validApiVersions = ["v0", "v1"];
        var validColourSchemes = ["default", "colourBlind"];
        
        var apiVersionIsValid = false;
        if (preferences.apiVersion) {
            for (var i=0; i<validApiVersions.length; i++) {
                if (preferences.apiVersion == validApiVersions[i]) {
                    apiVersionIsValid = true;
                }
            }            
        }
        if (!apiVersionIsValid) {
            return null;
        }
        
        var colourSchemeIsValid = false;
        if (preferences.apiVersion) {
            for (var i=0; i<validApiVersions.length; i++) {
                if (preferences.colourScheme == validColourSchemes[i]) {
                    colourSchemeIsValid = true;
                }
            }            
        }
        if (!colourSchemeIsValid) {
            return null;
        }
        
        for (var i=0; i<this.users.length; i++) {            
            if (this.users[i].username == username) {
                if ( (this.users[i].preferences.apiVersion   != preferences.apiVersion  ) ||
                     (this.users[i].preferences.colourScheme != preferences.colourScheme) )  {
                        this.users[i].preferences.apiVersion    = preferences.apiVersion;
                        this.users[i].preferences.colourScheme  = preferences.colourScheme;
                        
                        this.saveUserPreferences (this.users, this.preferencesFile);                         
                     }
                
                return this.users[i].preferences;
            }
        }
        return null;
    }
} // class ConfigClass

const Config = new ConfigClass();

module.exports = Config;