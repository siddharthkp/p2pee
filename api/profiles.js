app.post('/profiles', function (req, res) {
    var device_id = req.body.device_id;

    if (!device_id) parameterMissing('Device id', req, res);

    getProfileBy('device_id', device_id, function(profile) {
        if (profile) {
            res.end(JSON.stringify(profile));
        } else createUser(device_id);
    }, req, res);

    var db = getDb();
    function createUser(device_id) {
        var Chance = require('chance');
        var chance = new Chance();
        var name = chance.last();
        var photo_url = 'http://api.adorable.io/avatars/250/' + name + '.png';
        var query = 'INSERT INTO profiles VALUES (null, \"' + device_id + '\",\"' + name + '\", \"' + photo_url + '\");';

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
        if (profile) {
            attachCheckins(profile, req, res);
        }
        else res.end('No profile found');
    }, req);
});

function attachCheckins(profile, req, res) {
    var db = getDb();
    var query = 'SELECT * FROM checkins WHERE profile_id = \"' + profile.id + '\"';
    query += 'ORDER BY checkedin_at DESC LIMIT 3';

    db.query(query, function (err, rows) {
        if (!err) {
            profile.checkins = rows;
            attachPlaces(profile, req, res);
        } else handleError('Fetching checkins', req, res, {
            status: 500,
            message: err
        });
    });
}
var count;
function attachPlaces(profile, req, res) {
    count = profile.checkins.length;
    for (var i in profile.checkins) {
        attachPlace(profile.checkins[i], res, profile);
    }
}

function attachPlace(place, res, profile){
      var https = require('https');
      var key = 'AIzaSyArBmLVB_OqHZAiQo7zoSzbnAiDjkPZ03o';
      var radius = 250;
      var host = 'https://maps.googleapis.com';
      var path = '/maps/api/place/details/json?' + 'key=' + key;
      path += '&placeid=' + place.place_id;

      var request = require('request');
      var options = {
          url: host + path
      };

      request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              var result = JSON.parse(body).result;
              place.id = result.place_id;
              place.name = result.name;
              place.lat = result.geometry.location.lat;
              place.lng = result.geometry.location.lng;
              place.type = result.types[0];
              var photo_url = null;
              if (result.photos && result.photos.length) {
                  photo_url = 'https://maps.googleapis.com/maps/api/place/photo?';
                  photo_url+='maxwidth=1000&key=AIzaSyArBmLVB_OqHZAiQo7zoSzbnAiDjkPZ03o&photoreference=';
                  photo_url+= result.photos[0].photo_reference;
              }
              place.photo_url = photo_url;
              count--;
              if (!count) res.end(JSON.stringify(profile));
          } else {
              handleError('Fetching place', req, res, {
                  status: 500,
                  message: error
              });
          }
      });
}

function getDb(){
    var database = config.database;
    var mysql      = require('mysql');
    var connection = mysql.createConnection(database);
    var nodeSql = require('nodesql');
    var db = nodeSql.createMySqlStrategy(connection);
    return db;
}
function getProfileBy(type, id, callback, req, res) {
    db = getDb();
    var query = 'SELECT * FROM profiles WHERE ';
    if (type == 'id') query += 'id = ' + id;
    if (type == 'device_id') query += 'device_id = \"' + id + '\"';

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
    var id = req.body.id;
    var name = req.body.name;

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

