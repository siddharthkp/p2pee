app.get('/places', function(req, res) {
    var lat = req.query.lat;
    var lng = req.query.lng;
    if (!lat) parameterMissing('Lat', req, res);
    if (!lng) parameterMissing('Lng', req, res);

    var https = require('https');
    var key = 'AIzaSyArBmLVB_OqHZAiQo7zoSzbnAiDjkPZ03o';
    var radius = 250;
    var host = 'https://maps.googleapis.com';
    var places = 'accounting|airport|amusement_park|art_gallery|bar|';
    places += 'book_store|bowling_alley|bus_station|cafe|casino|';
    places += 'city_hall|clothing_store|courthouse|dentist|';
    places += 'department_store|doctor|embassy|finance|fire_station|';
    places += 'food|furniture_store|gas_station|hospital|library|';
    places += 'local_government_office|lodging|movie_theater|museum|';
    places += 'night_club|post_office|restaurant|shopping_mall|';
    places += 'stadium|subway_station|train_station|zoo';
    var path = '/maps/api/place/nearbysearch/json?' + 'key=' + key;
    path += '&radius=' + radius + '&places=' + places;
    path += '&location=' + lat + ',' + lng;

    var request = require('request');
    var options = {
        url: host + path
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body).results;
            var places = [];
            for (var i in results) {
                var result = results[i];
                var photo_url = null;
                if (result.photos && result.photos.length) {
                    photo_url = 'https://maps.googleapis.com/maps/api/place/photo?';
                    photo_url+='maxwidth=1000&key=AIzaSyArBmLVB_OqHZAiQo7zoSzbnAiDjkPZ03o&photoreference=';
                    photo_url+= result.photos[0].photo_reference;
                }
                var place = {
                    id: result.place_id,
                    name: result.name,
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    type: result.types[0],
                    photo_url: photo_url
                };
                var blacklist = false;
                if (['sublocality_level_1'].indexOf(place.type) === -1) places.push(place);
                if (places.length === 3) break;
            }
            var structuredPlaces = {};
            structuredPlaces.now = places[0];
            structuredPlaces.can_wait = places[1];
            structuredPlaces.royal_pee = places[2];
            res.end(JSON.stringify(structuredPlaces));
        } else {
            handleError('Finding places', req, res, {
                status: 500,
                message: error
            });
        }
    });
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

app.get('/place', function (req, res) {
    var id = req.query.id;

    if(!id) parameterMissing('id', req, res);

    var https = require('https');
    var key = 'AIzaSyArBmLVB_OqHZAiQo7zoSzbnAiDjkPZ03o';
    var radius = 250;
    var host = 'https://maps.googleapis.com';
    var path = '/maps/api/place/details/json?' + 'key=' + key;
    path += '&placeid=' + id;

    var request = require('request');
    var options = {
        url: host + path
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var result = JSON.parse(body).result;
            var place = {};
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
            attachCheckins(place);
        } else {
            handleError('Fetching place', req, res, {
                status: 500,
                message: error
            });
        }
    });

    function attachCheckins(place) {
        var db = getDb();
        var query = 'SELECT * FROM checkins join profiles on checkins.profile_id = profiles.id WHERE place_id = \"' + place.id + '\"';
        query += 'ORDER BY checkedin_at DESC LIMIT 3';

        db.query(query, function (err, rows) {
            if (!err) {
                place.checkins = rows;
                attachRoyals(place);
            } else handleError('Fetching checkins', req, res, {
                status: 500,
                message: err
            });
        });
    }

    function attachRoyals(place) {
        var db = getDb();
        var query = 'SELECT count(*) checkins, profiles.id, profiles.device_id, profiles.name, profiles.photo_url FROM checkins join profiles on checkins.profile_id = profiles.id WHERE place_id = \"' + place.id + '\"';
        query += 'GROUP BY profiles.id ORDER BY count(*) DESC';

        db.query(query, function (err, rows) {
            if (!err) {
                place.royals = rows;
                attachScore(place);
            } else handleError('Fetching royals', req, res, {
                status: 500,
                message: err
            });
        });
    }

    function attachScore(place) {
        var db = getDb();
        var query = 'SELECT AVG(feedback) score from feedback WHERE place_id = \"' + place.id + '\"';
        db.query(query, function(err, rows) {
            if (!err) {
                place.score = rows[0].score;
                res.end(JSON.stringify(place));
            } else handleError('Fetching score', req, res, {
                status: 500,
                message: err
            });
        });
    }

});

