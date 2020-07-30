// app.js
var express = require('express');
var app = express();

var DocsController = require('./controllers/DocsController');
app.use('/docs', DocsController);
app.use(express.static('html'));

module.exports = app;