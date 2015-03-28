var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors')
var cookieParser = require('cookie-parser')
var config = require('../config.json');
var server = app.listen(80, function () {
      console.log('p2p listening');
});
function log(req, res, next) {
    console.log(req.originalUrl + '\n');
    next();
}
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json());
app.use(cookieParser());
app.use(log);

