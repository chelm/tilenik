var Mercator = require('./mercator');
 
var LatLng = Mercator.LatLng;
var Point = Mercator.Point;

var latlng = new LatLng(0, 0);
var prj = new Mercator.MercatorProjection();

function map_latlon(ll, x, y, zoom) {
  latlng.latitude  = ll[1];
  latlng.longitude = ll[0];
  var point =  prj.latLngToTilePoint(latlng, x, y, zoom);
  return point;
}

var primitive_conversion =  {
  'LineString': function(x, y, zoom, coordinates) {
    var converted = [];
    var pc = primitive_conversion['Point'];
    for(var i=0; i < coordinates.length; ++i) {
      converted.push(pc(x, y, zoom, coordinates[i]));
    }
    return converted;
  },

  'Point': function(x, y, zoom, coordinates) {
    return map_latlon(coordinates, x, y, zoom);
  },

  'MultiPoint': function(x, y, zoom, coordinates) {
    var converted = [];
    var pc = primitive_conversion['Point'];
    for(var i=0; i < coordinates.length; ++i) {
      converted.push(pc(x, y, zoom, coordinates[i]));
    }
    return converted;
  },
  //do not manage inner polygons!
  'Polygon': function(x, y, zoom, coordinates) {
    if(coordinates[0]) {
      var coords = [];
      for(var i=0; i < coordinates[0].length; ++i) {
        coords.push(map_latlon(coordinates[0][i], x, y, zoom));
      }
      return [coords];
    }
    return null;
  },
  'MultiPolygon': function(x, y, zoom, coordinates) {
    var polys = [];
    var poly;
    var pc = primitive_conversion['Polygon'];
    for(var i=0; i < coordinates.length; ++i) {
      poly = pc(x, y, zoom, coordinates[i]);
      if(poly)
        polys.push(poly);
    }
    return polys;
  }
};

var project = function(geometry, zoom, x, y) {
  var conversor = primitive_conversion[geometry.type];
  if(conversor) {
    return conversor(x, y , zoom, geometry.coordinates);
  }
};

module.exports = project;

