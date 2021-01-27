// DashboardApiV0.js

const axios = require('axios');

class DashboardApiV0Class {
    constructor(apiKey, baseUrl, timeout) {
        this.api = axios.create({
            baseURL: baseUrl,
            timeout: timeout,
            headers: {"X-Cisco-Meraki-API-Key": apiKey}
        });        
    }
    
    async getOpenAPISpec(organizationId) {  
        var endpoint = "/organizations/" + organizationId + "/openapiSpec";
        var result = null;
        
        try {
            const response = await this.api.get(endpoint);
            result = response.data;
        } catch (error) {
            console.error(error);
        }
        return result;
    }
    
} // class MerakiClass

var DashboardApiV0 = new DashboardApiV0Class();

module.exports = DashboardApiV0;
module.exports.DashboardApiV0Class = DashboardApiV0Class;