app.post('/feedback', function (req, res) {
    var profile_id = req.body.profile_id;
    var place_id = req.body.place_id;
    var feedback = req.body.feedback || 0;

    if (!profile_id) parameterMissing('Profile id', req, res);
    if (!place_id) parameterMissing('Place id', req, res);

    getProfileBy('id', profile_id, function(profile) {
        if (profile) addFeedback();
        else handleError('Profile not found', req, res, {
            status: 400
        });
    }, req);

    var db = getDb();
    function addFeedback() {
        var query = 'INSERT INTO feedback VALUES (null, ' + profile_id + ',\"' + place_id + '\",' + feedback + ');';
        db.query(query, function (err, rows) {
            if (!err) {
                res.end(JSON.stringify({
                  message: 'Thanks for your feedback'
                }));
            } else handleError('Check in', req, res, {
                status: 500,
                message: err
            });
        });
    }
});

function getDb(){
    var database = config.database;
    var mysql      = require('mysql');
    var connection = mysql.createConnection(database);
    var nodeSql = require('nodesql');
    var db = nodeSql.createMySqlStrategy(connection);
    return db;
}
function getProfileBy(type, id, callback, req) {
    db = getDb();
    var query = 'SELECT * FROM profiles WHERE ';
    if (type == 'id') query += 'id = ' + id;
    if (type == 'device_id') query += 'device_id = ' + id;

    db.query(query, function (err, rows) {
        if (!err) {
            if (!rows.length) {
                callback(false);
            } else {
                callback(rows[0]);
            }
        } else handleError('Getting profile', req, res, {
            status: 500,
            message: err
        });
    });
}

