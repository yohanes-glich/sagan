var $ = require('jquery');
var leaflet = require('leaflet');
var reduce = Array.prototype.reduce;

var teamMapWrapper = '.js-team-map--wrapper';
var teamMapContainer = '.js-team-map--container';
var fadeDuration = 100;

/**
 * Composition plan for the data-map feature
 * @module
 */
module.exports = initMap;

/**
 * Creates the map and populates it with data found in the server-rendered
 * teamLocations global.  It's unfortunate to rely on a global, but
 * because the data is server-rendered it's a reasonable short term
 * compromise.
 * @returns {{destroy: Function}}
 */
function initMap() {
    /*global teamLocations*/

    var map, _destroy;

    $(ready);

    return {
        destroy: destroy
    };

    function ready() {
        map = createMap();

        var teamMemberIds = getTeamMemberIdMap($('.team-members--wrapper'));

        var bounds = teamLocations.reduce(function(bounds, teamLocation) {
            var element = teamMemberIds[teamLocation.memberId];

            if (element) {
                var marker = createMarker(teamLocation, element);
                marker.addTo(map);

                bounds.push(new leaflet.LatLng(teamLocation.latitude, teamLocation.longitude));
            }

            return bounds;
        }, []);

        setMapView(map, teamLocations, bounds);

        $(teamMapWrapper).on('click', enableMapMouseWheelSupport);

        _destroy = function() {
            map.remove();
            $(teamMapWrapper).off('click', enableMapMouseWheelSupport);
        };
    }

    function destroy() {
        _destroy();
    }

    function enableMapMouseWheelSupport() {
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
        $(teamMapContainer).fadeOut(fadeDuration);

        $(teamMapWrapper).mouseleave(function() {
            map.scrollWheelZoom.disable();
            map.touchZoom.disable();
            $(teamMapContainer).fadeIn(fadeDuration);
        });
    }
}

function createMap() {
    var map = leaflet.map('map', {
        scrollWheelZoom: false,
        touchZoom: false
    }).setView([51.505, -0.09], 2);

    leaflet.tileLayer('http://{s}.tile.cloudmade.com/dc6ad76c483d4e5c92152aa34375ec28/1/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);

    return map;
}

function getTeamMemberIdMap(container) {
    return reduce.call($('[data-member-id]', container), function(ids, el) {
        var id = el.getAttribute('data-member-id');
        if(id != null) {
            ids[id] = el;
        }
        return ids;
    }, {});
}

function createMarker(teamLocation, element) {
    var marker = leaflet.marker([teamLocation.latitude, teamLocation.longitude], {title: teamLocation.name});
    marker.bindPopup(element.html());
}

function setMapView(map, teamLocations, bounds) {
    var length = teamLocations.length;

    if (length > 1) {
        map.fitBounds(bounds);
    } else if (length == 1) {
        var latLng = new leaflet.LatLng(
            teamLocations[0].latitude, teamLocations[0].longitude);
        map.setView(latLng, 5); // Why 5?
    }
}