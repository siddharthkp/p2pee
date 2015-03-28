app.post('/checkin', function (req, res) {
    var profile_id = req.body.profile_id;
    var place_id = req.body.place_id;

    if (!profile_id) parameterMissing('Profile id', req, res);
    if (!place_id) parameterMissing('Place id', req, res);

    getProfileBy('id', profile_id, function(profile) {
        if (profile) addCheckin(profile_id, place_id);
        else handleError('Profile not found', req, res, {
            status: 400
        });
    }, req);

    var db = getDb();
    function addCheckin(device_id) {
        var query = 'INSERT INTO checkins VALUES (null, ' + profile_id + ',\"' + place_id + '\", null);';
        db.query(query, function (err, rows) {
            if (!err) {
                checkAndReply(profile_id);
            } else handleError('Check in', req, res, {
                status: 500,
                message: err
            });
        });
    }
    function checkAndReply(profile_id) {
        var db = getDb();
        var query = 'SELECT count(*) checkins, profile_id from checkins where place_id = \"' + place_id + '\" GROUP BY profile_id ORDER BY checkins DESC LIMIT 1';
        db.query(query, function (err, rows) {
            if (!err) {
                var isKing = false;
                var king = rows[0].profile_id;
                if (profile_id == king) isKing = true;
                res.end(JSON.stringify({
                    message: 'You have checked in!',
                    king: isKing
                }));
            }
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

