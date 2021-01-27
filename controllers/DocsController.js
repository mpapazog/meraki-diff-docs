// DocsController.js

var express = require('express');
var router = express.Router();
router.use(express.json());

var Docs = require('../models/Docs');

function decodeCredentials(authorizationString) {
    var username = "";
    var password = "";
    
    if (typeof authorizationString == "string") {
        if (authorizationString.length > 6) {
            var base64part = authorizationString.substring(6); // Skip "Basic "
            var decoded = Buffer.from(base64part, 'base64').toString();
            var splitStr = decoded.split(":");
            if (splitStr.length == 2) {
                username = splitStr[0];
                password = splitStr[1];
            }
        }
    }
    
    return {username: username, password: password};
}

function validateCredentials (headers) {    
    if (Docs.getAuthSettings().authenticationRequired) {
        if (typeof headers.authorization != "undefined") {
            var credentials = decodeCredentials(headers.authorization);
            var user = credentials.username.replace(/['"]+/g, '?');
            var pass = credentials.password.replace(/['"]+/g, '?');
            var success = Docs.authenticate(user, pass);   
            console.log(new Date().toISOString() + ' User "' + user + 
                '": Authentication ' + (success ? 'successful' : 'failed'));
            return success;            
        }
        return false;
    } else { // Authentication is disabled in the config
        return true;
    }
}

// Returns help 
router.get('/', function (req, res) {
    if (validateCredentials (req.headers)) {
        try 
        {
            var docs = {help:"Request /docs/v0 or /docs/v1"};      
        } 
        catch(err)
        {
            res.status(500).json({errors:"Server error GET /"});
        }
        res.status(200).json(docs);
    } else {
        res.status(401).json({errors:"Authorization required"});
    }
});

// Returns docs for Meraki Dashboard API v0
router.get('/v0', function (req, res) {   
    if (validateCredentials (req.headers)) {
        Docs.get('v0')
            .then(function (response) {
                res.status(200).json(response);
            })
            .catch(function (error) {
                res.status(500).json({errors:"Server error GET /docs/0"});
            })
            .finally(function () {
                // always executed
            });    
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

// Returns docs for Meraki Dashboard API v1
router.get('/v1', function (req, res) {
    if (validateCredentials (req.headers)) {    
        Docs.get('v1')
            .then(function (response) {
                res.status(200).json(response);
            })
            .catch(function (error) {
                res.status(500).json({errors:"Server error GET /docs/1"});
            })
            .finally(function () {
                // always executed
            });
    } else {
        res.status(401).json({errors:"Authorization required"});
    }  
});

// Returns authentication requirement parameters
router.get('/authentication/settings', function (req, res) {
    res.status(200).json(Docs.getAuthSettings());
});

// Returns authentication requirement parameters
router.post('/authentication/login', function (req, res) {
    var success = validateCredentials (req.headers);
    res.status(200).json({success: success});    
});

module.exports = router;