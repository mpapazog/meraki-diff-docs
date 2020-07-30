// DocsController.js

var express = require('express');
var router = express.Router();
router.use(express.json());

var Docs = require('../models/Docs');

// Returns help 
router.get('/', function (req, res) {
    try 
    {
        var docs = {help:"Request /docs/v0 or /docs/v1"};      
    } 
    catch(err)
    {
        res.status(500).json({errors:"Server error GET /"});
    }
    res.status(200).json(docs); 
});

// Returns docs for Meraki Dashboard API v0
router.get('/v0', function (req, res) {    
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
});

// Returns docs for Meraki Dashboard API v1
router.get('/v1', function (req, res) {
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
});

module.exports = router;