var fs = require('fs');
function handleError(name, req, res, data) {
    var message = req.originalUrl + '\t' + JSON.stringify(data) + '\n';
    console.error(message);
    fs.appendFile('./logs/errors.log', message);
    if (data.status === 404) data.response = name + ' not found';
    if (parseInt(data.status/100, 10) === 4) {
        res.status(data.status).end(data.response);
    }
    else res.status(500).end('Whoops! Phat gaya!');
}
function parameterMissing(parameter, req, res) {
    handleError(parameter, req, res, {
        status: 400,
        response: parameter + ' is missing'
    });
}
