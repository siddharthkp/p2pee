var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors')
var cookieParser = require('cookie-parser')
var config = require('../config.json');
var server = app.listen(3001, function () {
      console.log('p2p listening at localhost:3001');
});
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

