var express = require('express');
var request = require('request');
var port = process.env.PORT || 9001;

const apiKey = "CczP8MPU12TDyEr7RZbSd4evhxhgywyFQNa7MrJELN6mKRhcg0aCe-WI0ffzqY9114hrweDnrEkAZU6nvOQKBiTieK5m_wT4K_QwIrSdTmPst293oulvFRE6b5PEWnYx";
const yelp = require('yelp-fusion');
const client = yelp.client(apiKey);

var app = express();

var google_nearby_api        = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?####&key=AIzaSyCw8tqq66Hs5gTExCKz7zpQiwJWmZTpywU";
var google_place_details_api = "https://maps.googleapis.com/maps/api/place/details/json?####&key=AIzaSyCw8tqq66Hs5gTExCKz7zpQiwJWmZTpywU";

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/get/nearby/places', function(req, res) {
    var location = req.query.location;
    var radius = req.query.radius;
    var type = req.query.type;
    var keyword = req.query.keyword;

    if ("pagetoken" in req.query) {
        var params = "pagetoken=" + req.query.pagetoken;
    }
    else {
        var params = "location=" + encodeURI(location) + "&radius=" + radius + "&type=" + type + "&keyword=" + encodeURI(keyword);
    }

    var url = google_nearby_api.replace("####", params);
    req.pipe(request(url)).pipe(res);
});


app.get('/get/place/details', function(req, res) {
    var place_id = req.query.place_id;
    var params = "placeid=" + place_id;

    var url = google_place_details_api.replace("####", params);
    req.pipe(request(url)).pipe(res);
});

app.get('/get/yelp/best_match', function(req, res) {
    var name = req.query.name;
    var addr1 = req.query.addr1;
    var city = req.query.city;
    var state = req.query.state;
    var country = req.query.country;

    client.businessMatch('lookup', {
        name: name,
        address1: addr1,
        city: city,
        state: state,
        country: country
    }).then(function (response) {
        res.send(response.jsonBody.businesses[0].id);
    }).catch(function (e) {
        res.send("error");
    });
});

app.get('/get/yelp/reviews', function(req, res) {
    var id = req.query.id;
    client.reviews(id).then(function (response) {
        console.log(response.jsonBody.reviews);
        res.send(response.jsonBody.reviews);
    }).catch(function (e) {
        console.log(e);
        res.header("Content-Type",'application/json');
        res.send("{\"status\": \"error\"}");
    });
});



app.listen(port, function(){
    console.log('app listening on port 9001');
});