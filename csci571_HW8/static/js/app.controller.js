var app = angular.module('myApp', ['ngMaterial', 'ngAnimate']);
var ip_api = "http://ip-api.com/json";
var google_geo_coding_api = "https://maps.googleapis.com/maps/api/geocode/json?address=####&key=AIzaSyBJSJy6yNIZUesq8hihLyXcFf90o9ixh08";
var google_photos_api = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=280&photoreference=####&key=AIzaSyCw8tqq66Hs5gTExCKz7zpQiwJWmZTpywU";

app.controller('searchDetailsController', searchDetailsController);

app.factory('getService', function ($http, $q) {
    var getHttp = function (url) {
        var deferred = $q.defer();

        $http({method: 'GET', url: url}).success(function (data, status, headers, config) {
            deferred.resolve(data);
        }).error(function (data, status, headers, config) {
            deferred.reject(data);
        });

        return deferred.promise;
    }

    return {getHttp: getHttp};
});

function searchDetailsController($scope, $http, $rootScope, $timeout, getService) {
    $scope.current = "1";

    $scope.real_current_lat = "";
    $scope.real_current_lng = "";

    $scope.map_current_lat = "";
    $scope.map_current_lng = "";

    $scope.current_lat = "";
    $scope.current_lng = "";

    $scope.keyword = "";
    $scope.category = "default";
    $scope.distance = "10";
    $scope.location = "";

    $scope.location_mode = "1";

    $scope.keywordInvalid = true;
    $scope.locationInvalid = false;
    $scope.searchBtnDisable = true;
    $scope.locationInputDisabled = true;

    $scope.showProgressBar = false;
    $scope.placeDetailsShow = false;
    $scope.getPlaceDetailsFailed = false;
    $scope.placeListEmpty = false;

    /*********************** Pagination ***********************/
    $scope.nextToken = "";
    $scope.historyDataArray = [];
    $scope.paginationIndex = 0;
    $scope.showPreviousBtn = false;
    $scope.showNextBtn = false;
    /*************************** end ***************************/

    /************************ Place Details ********************/
    $scope.detailsBtnDisabled = true;
    $scope.currentPlaceId = "";
    $scope.currentPlaceName = "";

    $scope.itemInfoData = {};

    $scope.itemPhotoInfo = [];
    $scope.itemPhotoEmpty = false;

    $scope.itemMapInfo = {};

    $scope.itemReviewInfo = [];
    $scope.itemReviewInfoPre = [];
    $scope.itemReviewInfoPreYelp = [];
    $scope.itemReviewInfoPreGoogle = [];

    $scope.itemReviewEmpty = false;

    $scope.mapYourLocation = "Your location";

    $scope.itemReviewTypeText = "Google Reviews";
    $scope.itemReviewSortText = "Default Order";

    $scope.twitterConent = "";
    $scope.itemAddrInfo = {};
    /***************************** end *************************/

    /************************ Favorite Details ********************/
    $scope.favorite_data = [];
    $scope.favorite_is_empty = true;
    $scope.showFavoritePage = false;
    /************************** end ****************************/


    $scope.category_items = ["default", "Airport", "Amusement Park", "Aquarium", "Art Gallery", "Bakery", "Bar", "Beauty Salon",
    "Bowling Alley", "Bus Station", "Cafe", "Campground", "Car Rental", "Casino", "Lodging", "Movie Theater", "Museum", "Night Club",
    "Park", "Parking", "Restaurant", "Shopping Mall", "Stadium", "Subway Station", "Taxi Stand", "Train Station", "Transit Station",
    "Travel Agency", "Zoo"];

    $scope.place_list = [];

    $scope.init = function () {
        $scope.favorite_data = loadFromLocalStorage();
        if ($scope.favorite_data.length > 0) {
            $scope.favorite_is_empty = false;
        }

        $scope.getCurrentLocation();
    }

    $scope.tableTrClass = function (place_id) {
        if (place_id == $scope.currentPlaceId) {
            return "yellow_background";
        } else {
            return "";
        }
    }

    $scope.starGlyphiconClass = function (item) {
        if (typeof item == "string") {
            item = getPlaceItemById(item);
        }

        if (inFavoriteData(item)) {
            return "glyphicon glyphicon-star";
        } else {
            return "glyphicon glyphicon-star-empty";
        }
    }

    $scope.onBlurForKeyword = function () {
        var tmp = $scope.keyword.trim();
        if (tmp == "") {
            $("#keyword").parent().addClass("has-error");
            $("#keyword_error_msg").show();
            $scope.keywordInvalid = true;
        }
        else {
            $("#keyword").parent().removeClass("has-error");
            $("#keyword_error_msg").hide();
            $scope.keywordInvalid = false;
        }
    }

    $scope.onBlurForLocation = function () {
        var tmp = $scope.location.trim();
        if (tmp == "") {
            $("#location").parent().addClass("has-error");
            $("#location_error_msg").show();
            $scope.locationInvalid = true;
        }
        else {
            $("#location").parent().removeClass("has-error");
            $("#location_error_msg").hide();
            $scope.locationInvalid = false;

            $scope.getGivenPlaceLocation();
        }
    }

    $scope.onSearchBtnClicked = function () {
        if ($scope.current != "1") {
            $scope.current = "1";
        }
        $scope.onResultTabClick();

        var location = $scope.current_lat + "," + $scope.current_lng;
        var dist = 10 * 1600;
        if ($scope.distance != "") {
            dist = parseInt($scope.distance) * 1600;
        }

        $scope.showProgressBar = true;
        $scope.placeDetailsShow = false;

        var params = "location=" + encodeURI(location) + "&radius="
            + dist + "&type=" + encodeURI($scope.category) + "&keyword=" + encodeURI($scope.keyword);

        if ($scope.nextToken != "") {
            params += "&pagetoken=" + $scope.nextToken;
        }

        var url = "/get/nearby/places?" + params;
        var promise = getService.getHttp(url);
        promise.then(function (data) {
            extractPlaceDetails(data)
        }, function onError(res) {
            $scope.getPlaceDetailsFailed = true;
            $scope.placeListEmpty = false;
            $scope.showProgressBar = false;
        });
    }

    $scope.onClearButtonClick = function () {
        window.location.href = "/";
    }

    $scope.onLocationModeSelected = function () {
        $scope.searchBtnDisable = true;

        if ($scope.location_mode == "2") {
            $scope.locationInputDisabled = false;
            $scope.locationInvalid = true;
        } else {
            $scope.locationInputDisabled = true;
            $scope.getCurrentLocation();

            $("#location").parent().removeClass("has-error");
            $("#location_error_msg").hide();
            $scope.location = "";
            $scope.locationInvalid = false;
        }
    }

    $scope.getCurrentLocation = function () {
        var promise = getService.getHttp(ip_api);
        promise.then(function (data) {
            extractCurrentLocation(data);
            $scope.searchBtnDisable = false;
        }, function onError(res) {
            $scope.searchBtnDisable = true;
        })
    }

    $scope.getGivenPlaceLocation = function () {
        $timeout(function () {
            if ($scope.location != "") {
                var url = google_geo_coding_api.replace("####", encodeURI($scope.location));
                var promise = getService.getHttp(url);
                promise.then(function (data) {
                    extractGivenPlaceLocation(data);
                    $scope.searchBtnDisable = false;
                }, function onError(res) {
                    $scope.searchBtnDisable = true;
                })
            }
        }, 500);
    }

    $scope.onResultTabClick = function () {
        $("#result_tab").addClass("clicked_a");
        $("#result_tab").removeClass("none_clicked_a");

        $("#favorites_tab").addClass("none_clicked_a");
        $("#favorites_tab").removeClass("clicked_a");

        $scope.showFavoritePage = false;
    }

    $scope.onFavoritesTabClick = function () {
        $("#favorites_tab").addClass("clicked_a");
        $("#favorites_tab").removeClass("none_clicked_a");

        $("#result_tab").addClass("none_clicked_a");
        $("#result_tab").removeClass("clicked_a");

        $scope.showFavoritePage = true;
    }

    $scope.onNextPageBtnClick = function () {
        if ($scope.paginationIndex < $scope.historyDataArray.length - 1) {
            $scope.paginationIndex += 1;
            $scope.place_list = $scope.historyDataArray[$scope.paginationIndex];

            $scope.showPreviousBtn = true;
        } else {
            if ($scope.nextToken == "") {
                $scope.showNextBtn = false;
            } else {
                $scope.onSearchBtnClicked();
                $scope.showPreviousBtn = true;
            }
        }

        if ($scope.paginationIndex == $scope.historyDataArray.length - 1 && $scope.nextToken == "") {
            $scope.showNextBtn = false;
        }
    }

    $scope.onPreviousPageBtnClick = function () {
        if ($scope.paginationIndex > 0) {
            $scope.paginationIndex -= 1;
            $scope.place_list = $scope.historyDataArray[$scope.paginationIndex];
            $scope.showNextBtn = true;
        }

        if ($scope.paginationIndex <= 0) {
            $scope.showPreviousBtn = false;
        }
    }

    $scope.onItemDetailsSwitchClick = function () {
        $scope.current = "2";
    }

    $scope.onItemListSwitchClick = function () {
        $scope.current = "1";
    }

    $scope.onItemDetailsBtnClick = function (place_id, name) {
        $scope.detailsBtnDisabled = false;
        $scope.currentPlaceId = place_id;
        $scope.currentPlaceName = name;

        var params = "place_id=" + place_id;

        var url = "/get/place/details?" + params;
        var promise = getService.getHttp(url);
        promise.then(function (data) {
            parsePlaceDetailsData(data);
        }, function onError(res) {
        });
    }

    $scope.onItemFavoriteBtnClick = function (item) {
        if (typeof item == "string") {
            item = getPlaceItemById(item);
        }

        if (!inFavoriteData(item)) {
            addToLocalStorage(item);
        } else {
            removeFromStorage(item);
        }
    }

    $scope.onItemFavoriteDeleteBtnClick = function (item) {
        removeFromStorage(item);
    }

    $scope.onPhotoClicked = function (photo) {
        var url = photo["reference"].replace("maxwidth=280", "&maxwidth=" + photo["width"]);
        window.open(url);
    }

    $scope.onMapYourLocationBlur = function () {
        $timeout(function () {
            var text = $("#map_your_location").val();
            if (text != "") {
                var url = google_geo_coding_api.replace("####", encodeURI(text));
                var promise = getService.getHttp(url);
                promise.then(function (data) {
                    var results = data["results"];
                    if (results.length > 0) {
                        var location = results[0]["geometry"]["location"];
                        $scope.map_current_lat = location["lat"];
                        $scope.map_current_lng = location["lng"];
                    }
                }, function onError(res) {
                })
            }
        }, 1000);
    }

    $scope.onReviewTypeSelected = function (type, text) {
        $scope.itemReviewTypeText = text;

        if (type == "0") {
            $scope.itemReviewInfo = $scope.itemReviewInfoPreGoogle;
            $scope.itemReviewInfoPre = $scope.itemReviewInfoPreGoogle;

            return;
        }
        var params = "city=" + $scope.itemAddrInfo["city"] + "&state=" + $scope.itemAddrInfo["state"] + "&country=" +
            $scope.itemAddrInfo["country"] + "&name=" + $scope.itemAddrInfo["name"] + "&addr1=" + $scope.itemAddrInfo["addr1"];

        var url = "/get/yelp/best_match?" + params;
        var promise = getService.getHttp(url);
        promise.then(function (data) {
            if (data != "error") {
                getYelpReviews(data);
            }
            else {
                $scope.itemReviewInfo = [];
                $scope.itemReviewInfoPre = [];
                $scope.itemReviewEmpty = true;
            }
        }, function onError(res) {
        });
    }

    $scope.onReviewSortSelected = function (type, text) {
        $scope.itemReviewSortText = text;

        if (type == "0") {
            $scope.itemReviewInfo = $scope.itemReviewInfoPre;
        }
        else if (type == "1") {
            $scope.itemReviewInfo.sort(compare("rating"));
            $scope.itemReviewInfo.reverse();
        }
        else if (type == "2") {
            $scope.itemReviewInfo.sort(compare("rating"));
        }
        else if (type == "3") {
            $scope.itemReviewInfo.sort(compare("time"));
            $scope.itemReviewInfo.reverse();
        }
        else if (type == "4") {
            $scope.itemReviewInfo.sort(compare("time"));
        }
    }

    function getYelpReviews(id) {
        var url = "/get/yelp/reviews?id=" + id;
        var promise = getService.getHttp(url);
        promise.then(function (data) {
            if ("0" in data) {
                var tmp = [];
                var author_name, text, profile_photo_url, author_url, timeStr, time;
                for (var index in data) {
                    author_name = data[index]["user"]["name"];
                    profile_photo_url = data[index]["user"]["image_url"];
                    author_url = data[index]["url"];
                    text = data[index]["text"];
                    timeStr = data[index]["time_created"];
                    time = getTs(timeStr);

                    tmp.push({
                        author_name: author_name,
                        profile_photo_url: profile_photo_url,
                        author_url: author_url,
                        text: text,
                        timeStr: timeStr,
                        time: time,
                        rating: data[index]["rating"],
                        ratingArray: initArray(data[index]["rating"]),
                    })
                }

                $scope.itemReviewInfo = tmp;
                $scope.itemReviewInfoPre = tmp;

                if (tmp.length > 0) {
                    $scope.itemReviewEmpty = false;
                }
                else {
                    $scope.itemReviewEmpty = true;
                }
            }
            else {
                $scope.itemReviewInfo = [];
                $scope.itemReviewInfoPre = [];
                $scope.itemReviewEmpty = true;
            }
        }, function onError(res) {
        });
    }

    function extractCurrentLocation(data) {
        $scope.current_lat = data["lat"];
        $scope.current_lng = data["lon"];

        $scope.real_current_lat = data["lat"];
        $scope.real_current_lng = data["lon"];
    }

    function extractGivenPlaceLocation(data) {
        var results = data["results"];
        if (results.length > 0) {
            var location = results[0]["geometry"]["location"];
            $scope.current_lat = location["lat"];
            $scope.current_lng = location["lng"];
        }
    }

    function extractPlaceDetails(data) {
        if ("results" in data) {
            $scope.place_list = data["results"];

            if ($scope.place_list.length == 0) {
                $scope.placeListEmpty = true;
            } else {
                $scope.placeListEmpty = false;
                $scope.historyDataArray.push($scope.place_list);
                $scope.paginationIndex = $scope.historyDataArray.length - 1;
            }
            $scope.placeDetailsShow = true;
            $scope.getPlaceDetailsFailed = false;
        }
        else {
            $scope.getPlaceDetailsFailed = true;
            $scope.placeListEmpty = false;
        }

        $scope.showProgressBar = false;

        if ("next_page_token" in data) {
            $scope.nextToken = data["next_page_token"];
            $scope.showNextBtn = true;
        } else {
            $scope.nextToken = "";
            $scope.showNextBtn = false;
        }
    }

    function parsePlaceDetailsData(data) {
        if ("result" in data) {
            var results = data["result"];
            extractInfo(results);
            extractPhotos(results);
            extractMapInfo(results);
            extractGoogleReviewInfo(results);
            parseAddress(results);

            $scope.current = "2";
        }
    }

    function extractInfo(results) {
        $scope.itemInfoData = {
            formatted_address: results["formatted_address"],
            formatted_phone_number: results["formatted_phone_number"],
            url: results["url"],
            price_level: results["price_level"],
            rating: results["rating"],
            place_id: results["place_id"],
            rating_int: initArray(Math.round(results["rating"])),
            website: results["website"],
            opening_hour: parseOpeningHour(results["opening_hours"])
        }

        $scope.twitterConent = "Check out " + $scope.currentPlaceName + " located at "
        + results["formatted_address"] + " Website: " + results["website"] + " #TravelAndEntertainmentSearch";
    }

    function extractPhotos(results) {
        var photos = results["photos"];

        if (!photos) {
            $scope.itemPhotoEmpty = true;
            $scope.itemPhotoInfo = [];
            return;
        }

        $scope.itemPhotoEmpty = false;

        var result = [];
        for (var i = 0; i < photos.length; i++) {
            var photo = photos[i];
            var width = photo["width"];
            var reference = photo["photo_reference"];
            result.push({
                width: width,
                reference: google_photos_api.replace("####", reference)
            })
        }

        $scope.itemPhotoInfo = result;
    }

    function extractMapInfo(results) {
        var location = results["geometry"]["location"];
        $scope.itemMapInfo = location;
    }

    function extractGoogleReviewInfo(results) {
        var reviews = results["reviews"];

        if (!reviews) {
            $scope.itemReviewEmpty = true;
            $scope.itemReviewInfo = [];
            $scope.itemReviewInfoPre = [];

            return;
        }

        $scope.itemReviewEmpty = false;

        for (var index in reviews) {
            var item = reviews[index];
            item["timeStr"] = timeFormat(item["time"]);
            item["ratingArray"] = initArray(Math.round(results["rating"]));
        }

        $scope.itemReviewInfo = reviews;
        $scope.itemReviewInfoPre = reviews;
        $scope.itemReviewInfoPreGoogle = reviews;
    }

    function parseAddress(results) {
        var components = results["address_components"];
        if (!components) {
            $scope.itemAddrInfo = {};
            return;
        }

        var city = "", state = "", country = "";
        for (var index in components) {
            var component = components[index];
            var type = component["types"][0];
            if (type == "administrative_area_level_1") {
                state = component["short_name"];
            }
            if (type == "country") {
                country = component["short_name"];
            }
            if (type == "administrative_area_level_2" || type == "locality") {
                city = component["short_name"];
            }
        }

        $scope.itemAddrInfo = {
            name: results["name"],
            addr1: results["formatted_address"],
            city: city,
            state: state,
            country: country
        }
    }

    function parseOpeningHour(opening_hours) {
        if (!opening_hours) {
            return {
                msg: "unknown",
                periods: []
            }
        }
        var today = new Date().getDay() - 1;
        if (today < 0) {
            today = 6;
        }

        var week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        var periods = [];
        for (var index in opening_hours["periods"]) {
            var item = opening_hours["periods"][index];
            var open = item["open"]["time"];
            var close = item["close"]["time"];

            if (parseInt(open) <= 1200) {
                open = open.substring(0,2) + ":" + open.substring(2, 4) + " AM"
            } else {
                open = open.substring(0,2) + ":" + open.substring(2, 4) + " PM"
            }

            if (parseInt(open) <= 1200) {
                close = close.substring(0,2) + ":" + close.substring(2, 4) + " AM"
            } else {
                close = close.substring(0,2) + ":" + close.substring(2, 4) + " PM"
            }

            periods.push(
                {
                    name: week[index],
                    time: open + " - " + close
                }
            );
        }

        for (var i = 0; i < today; i++) {
            var tmp = periods[i];
            periods.push(tmp);
        }

        periods.splice(0, today + 1);

        var msg = "Closed";
        if (opening_hours["open_now"] == true) {
            msg = "Open now: " + periods[0]["time"];
        }

        return {
            msg: msg,
            periods: periods
        };
    }

    function initArray(n) {
        var result = []
        for (var i = 0; i < n; i++) {
            result.push(i);
        }

        return result;
    }

    function loadFromLocalStorage() {
        var tmp = localStorage.getItem("favorite_items")
        var all_items = [];
        if (tmp) {
            all_items = JSON.parse(tmp);
        }

        var result = [];
        for (var i in all_items) {
            var item = all_items[i];
            result.push(JSON.parse(item));
        }

        return result;
    }

    function removeFromStorage(item) {
        var place_id = item["place_id"];

        for (var i = 0; i < $scope.favorite_data.length; i++) {
            if ($scope.favorite_data[i]['place_id'] == place_id) {
                $scope.favorite_data.splice(i, 1);
                break;
            }
        }

        var tmp = localStorage.getItem("favorite_items")
        var all_items = [];
        if (tmp) {
            all_items = JSON.parse(tmp);
        }
        for (var i = 0; i < all_items.length; i++) {
            var tmp = JSON.parse(all_items[i])
            if (tmp["place_id"] == place_id) {
                all_items.splice(i, 1);
                break;
            }
        }

        if (all_items.length == 0) {
            $scope.favorite_is_empty = true;
        }

        localStorage.setItem("favorite_items", JSON.stringify(all_items));
    }

    function addToLocalStorage(item) {
        var tmp = localStorage.getItem("favorite_items")
        var all_items = [];
        if (tmp) {
            all_items = JSON.parse(tmp);
        }

        all_items.push(JSON.stringify(item));
        localStorage.setItem("favorite_items", JSON.stringify(all_items));

        $scope.favorite_data.push(item);
        $scope.favorite_is_empty = false;
    }

    function inFavoriteData (item) {
        var place_id = item["place_id"];

        for (var index in $scope.favorite_data) {
            var item = $scope.favorite_data[index];
            if (item["place_id"] == place_id) {
                return true;
            }
        }

        return false;
    }

    function getPlaceItemById(place_id) {
        for (var index in $scope.place_list) {
            var item = $scope.place_list[index];
            if (item["place_id"] == place_id) {
                return item;
            }
        }

        return null;
    }
    
    function timeFormat(ts) {
        var time = new Date(ts * 1000);
        var y = time.getFullYear();
        var m = time.getMonth() + 1;
        var d = time.getDate();
        var h = time.getHours();
        var mm = time.getMinutes();
        var s = time.getSeconds();
        return y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s;
    }

    function getTs(date) {
        date = date.substring(0, 19);
        date = date.replace(/-/g, '/');
        var timestamp = new Date(date).getTime();

        return timestamp;
    }

    function compare(property){
        return function(a, b) {
            var value1 = a[property];
            var value2 = b[property];
            return value1 - value2;
        }
    }
}
