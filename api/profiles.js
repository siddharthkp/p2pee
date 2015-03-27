app.post('/profiles', function (req, res) {
    var device_id = req.query.device_id;

    if (!device_id) parameterMissing('Device id', req, res);

    getProfileBy('device_id', device_id, function(profile) {
        if (profile) {
            res.end(JSON.stringify(profile));
        } else createUser(device_id);
    }, req);

    var db = getDb();
    function createUser(device_id) {
        var Chance = require('chance');
        var chance = new Chance();
        var name = chance.last();
        var query = 'INSERT INTO profiles VALUES (null, ' + device_id + ',\"' + name + '\", null);';

        db.query(query, function (err, rows) {
            if (!err) {
                getProfileBy('device_id', device_id, function(profile) {
                    if (profile) res.end(JSON.stringify(profile));
                }, req);
            } else handleError('Creating profile', req, res, {
                status: 500,
                message: err
            });
        });
    }
});

app.get('/profiles', function(req, res) {
    var id = req.query.id;
    if (!id) parameterMissing('Id', req, res);
    getProfileBy('id', id, function(profile) {
        if (profile) res.end(JSON.stringify(profile));
        else res.end('No profile found');
    }, req);
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

app.patch('/profiles', function (req, res) {
    var id = req.query.id;
    var name = req.query.name;

    if (!id) parameterMissing('Id', req, res);
    if (!name) parameterMissing('Name', req, res);

    getProfileBy('id', id, function(profile){
        getProfileBy('id', id, function(profile) {
            if (profile) {
                var query = 'UPDATE profiles set name = \"' + name + '\" WHERE id = ' + id;
                console.log(query);
                db.query(query, function (err, rows) {
                    if (!err) {
                        profile.name = name;
                        res.end(JSON.stringify(profile));
                    } else handleError('Updating profile', req, res, {
                        status: 500,
                        message: err
                    });
                });
            }
            else res.end('No profile found');
        }, req);
    });

});

