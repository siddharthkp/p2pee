app.post('/profiles', function (req, res) {
    var device_id = req.query.device_id;
    var id = req.query.id;

    if (!email_address && !id) parameterMissing('Device id or profile id', req, res);

    var mysql      = require('mysql');
    var connection = mysql.createConnection(config.database);
    var nodeSql = require('nodesql');
    var db = nodeSql.createMySqlStrategy(connection);

    var query = 'SELECT * FROM profiles WHERE ';
    if (id) query += 'id = ' + id;
    else query += 'device_id = ' + device_id;

    db.query(query, function (err, rows) {
        if (!err) {
            if (!rows.length) {
                createUser(device_id);
            } else {
                res.end(rows);
            }
        } else handleError('Getting profile', req, res, {
            status: 500,
            message: err
        });
    });

    function createUser(device_id) {
        var query = 'INSERT INTO profiles VALUES (null, ' + device_id + ',' + name + ');';

        db.query(query, function (err, rows) {
            if (!err) {
                res.end(rows);
            } else handleError('Create profile', req, res, {
                status: 500,
                message: err
            });
        });
    }
});

