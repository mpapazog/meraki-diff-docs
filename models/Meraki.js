// Meraki.js

const Config = require('./Config');
const apiV0 = require('./DashboardApiV0');
const apiV1 = require('./DashboardApiV1');

class MerakiClass {
    constructor() {
        this.v0 = new apiV0.DashboardApiV0Class(Config.apiKey, Config.v0BaseUrl, Config.requestTimeout);
        this.v1 = new apiV1.DashboardApiV1Class(Config.apiKey, Config.v1BaseUrl, Config.requestTimeout);
    }    
} // class MerakiClass

var Meraki = new MerakiClass();

module.exports = Meraki;