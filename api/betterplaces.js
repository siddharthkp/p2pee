app.get('/betterplaces', function(req, res) {
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
            results = results.filter(function(a){
                return (a.types[0].indexOf('sublocality_level') === -1);
            });
            results = results.filter(function(a){
                return (a.types[0] != 'establishment');
            });
            results = results.filter(function(a){
                return (a.types[0] != 'store');
            });
            var places = [];
            var structuredPlaces = {};
            var toprated = results.sort(function(a,b){return b.rating-a.rating;})[0];
            structuredPlaces.royal_pee = getPlace(toprated);
            for (var i in results) {
                var result = results[i];
                if (result.place_id === toprated.place_id) continue;
                var place = getPlace(result);
                places.push(place);
                if (places.length === 2) break;
            }
            structuredPlaces.now = places[0];
            structuredPlaces.can_wait = places[1];
            res.end(JSON.stringify(structuredPlaces));
        } else {
            handleError('Finding places', req, res, {
                status: 500,
                message: error
            });
        }
    });

    function getPlace(result) {
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
        return place;
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

