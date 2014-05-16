(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

//========================================
// Mercator projection
//========================================
//

var TILE_SIZE = 256;

function Point(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

function LatLng(lat, lon) {
  this.latitude = lat || 0;
  this.longitude = lon || 0;
}

LatLng.prototype.lat = function() {
  return this.latitude;
}

LatLng.prototype.lng = function() {
  return this.longitude;
}

function bound(value, opt_min, opt_max) {
  if (opt_min != null) value = Math.max(value, opt_min);
  if (opt_max != null) value = Math.min(value, opt_max);
  return value;
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}

function MercatorProjection() {
  this.pixelOrigin_ = new Point(TILE_SIZE / 2, TILE_SIZE / 2);
  this.pixelsPerLonDegree_ = TILE_SIZE / 360;
  this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
}

MercatorProjection.prototype.fromLatLngToPoint = function (latLng, opt_point) {
  var me = this;
  var point = opt_point || new Point(0, 0);
  var origin = me.pixelOrigin_;

  point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world
  // tile.
  var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999,
      0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) *
      -me.pixelsPerLonRadian_;
  return point;
};

MercatorProjection.prototype.fromPointToLatLng = function (point) {
  var me = this;
  var origin = me.pixelOrigin_;
  var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
  var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) -
    Math.PI / 2);
  return new LatLng(lat, lng);
};

MercatorProjection.prototype.tileBBox = function(x, y, zoom) {
  var numTiles = 1 << zoom;
  var inc = TILE_SIZE/numTiles;
  var px = x*TILE_SIZE/numTiles;
  var py = y*TILE_SIZE/numTiles;
  return [
    this.fromPointToLatLng(new Point(px, py + inc)),
    this.fromPointToLatLng(new Point(px + inc, py))
  ];
};

MercatorProjection.prototype.tilePoint = function(x, y, zoom) {
  var numTiles = 1 << zoom;
  var px = x*TILE_SIZE;
  var py = y*TILE_SIZE;
  return [px, py];
};

MercatorProjection.prototype.latLngToTilePoint = function(latLng, x, y, zoom) {
  var numTiles = 1 << zoom;
  var projection = this;
  var worldCoordinate = projection.fromLatLngToPoint(latLng);
  var pixelCoordinate = new Point(
    worldCoordinate.x * numTiles,
    worldCoordinate.y * numTiles);
  var tp = this.tilePoint(x, y, zoom);
  return new Point(
    Math.floor(pixelCoordinate.x - tp[0]),
    Math.floor(pixelCoordinate.y - tp[1]));
};

MercatorProjection.prototype.latLngToTile = function(latLng, zoom) {
  var numTiles = 1 << zoom;
  var projection = this;
  var worldCoordinate = projection.fromLatLngToPoint(latLng);
  var pixelCoordinate = new Point(
    worldCoordinate.x * numTiles,
    worldCoordinate.y * numTiles);
  return new Point(
    Math.floor(pixelCoordinate.x / TILE_SIZE),
    Math.floor(pixelCoordinate.y / TILE_SIZE));
};


module.exports.MercatorProjection = MercatorProjection;
module.exports.LatLng = LatLng;
module.exports.Point = Point;

},{}],2:[function(require,module,exports){
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


},{"./mercator":1}],3:[function(require,module,exports){

function Renderer() {
  var self = this;
  var primitive_render = this.primitive_render = {
      'Point': function(ctx, coordinates) {
                ctx.save();
                var radius = 2; //shader.shader_src['point-radius']();
                var p = coordinates;
                ctx.translate(p.x, p.y);
                ctx.beginPath();
                ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
      },
      'MultiPoint': function(ctx, coordinates) {
            var prender = primitive_render['Point'];
            for(var i=0; i < coordinates.length; ++i) {
                prender(ctx, coordinates[i]);
            }
      },
      'Polygon': function(ctx, coordinates) {
            ctx.beginPath();
            var p = coordinates[0][0];
            ctx.moveTo(p.x, p.y);
            for(var i=0; i < coordinates[0].length; ++i) {
              p = coordinates[0][i];
              ctx.lineTo(p.x, p.y);
           }
           ctx.closePath();
           ctx.fill();
           ctx.stroke();
      },
      'MultiPolygon': function(ctx, coordinates) {
            var prender = primitive_render['Polygon'];
            for(var i=0; i < coordinates.length; ++i) {
                prender(ctx, coordinates[i]);
            }
      },
      'LineString': function(ctx, coordinates) {
            ctx.beginPath();
            var p = coordinates[0];
            ctx.moveTo(p.x, p.y);
            for(var i=0; i < coordinates.length; ++i) {
              p = coordinates[i];
              ctx.lineTo(p.x, p.y);
           }
           ctx.stroke();
      }
  };
}

Renderer.prototype.render = function( ctx, geometry, shader, callback ) {
  var primitive_render = this.primitive_render;
  ctx.canvas.width = ctx.canvas.width;
  var primitive_type, render_context;
  if(geometry && geometry.length) {
      for(var i = 0; i < geometry.length; ++i) {
          var geo = geometry[i];
          var primitive_type = geo.type;
          var renderer = primitive_render[primitive_type];
          if(renderer) {
            var render_context = {
              zoom: 5,
              id: i
            };
            if(shader) {
              shader.apply(ctx, geo.metadata, render_context);
            }
            renderer(ctx, geo.vertexBuffer);
          }
      }
      callback( ctx );
  }
};

module.exports = new Renderer();


},{}],4:[function(require,module,exports){
function Shader(shader) {

  this.compile = function(shader) {
    if(typeof shader === 'string') {
        shader = eval("(function() { return " + shader +"; })()");
    }
    this.shader_src = shader;
    for(var attr in shader) {
        var c = mapper[attr];
        if(c) {
            this.compiled[c] = eval("(function() { return shader[attr]; })();");
        }
    }
  };

  this.apply = function(canvas_ctx, data, render_context) {
    var shader = this.compiled;
    for(var attr in shader) {
        var fn = shader[attr];
        if(typeof fn === 'function') {
            fn = fn(data, render_context);
        }
        if(fn !== null && canvas_ctx[attr] != fn) {
          canvas_ctx[attr] = fn;
        }
    }
  };

  this.compiled = {};
  this.shader_src = null;
  this.compile(shader);
}


var mapper = {
    'point-color': 'fillStyle',
    'line-color': 'strokeStyle',
    'line-width': 'lineWidth',
    'line-opacity': 'globalAlpha',
    'polygon-fill': 'fillStyle',
    'polygon-opacity': 'globalAlpha'
};

var needed_settings = {
  'LineString': [ 
    'line-color', 
    'line-width',
    'line-opacity'
  ],
  'Polygon': [ 
    'polygon-fill'
  ],
  'MultiPolygon': [ 
    'polygon-fill'
  ]
};
var defaults = {
  'LineString': {
    'strokeStyle': '#000',
    'lineWidth': 1,
    'globalAlpha': 1.0,
    'lineCap': 'round'
  },
  'Point': {
    'radius': 2
  },
  'Polygon': {
    'strokeStyle': '#000',
    'lineWidth': 1,
    'globalAlpha': 1.0
  },
  'MultiPolygon': {
    'strokeStyle': '#000',
    'lineWidth': 1,
    'globalAlpha': 1.0
  }
};

module.exports = Shader;

},{}],5:[function(require,module,exports){
var Tilenik = function(){
  //this.carto = require('./carto')
  this.shader = require('./shader'),  
  this.renderer = require('./renderer'),
  this.projector = require('./projector');

};

Tilenik.prototype.render = function( canvas, data, css, z, x, y, callback ){
  var self = this;

  this.carto.compile( css, function( shaderData ){
    var shader = new self.shader( shaderData );
    var projected = [];

    if ( data.features && data.features.length ){
      data.features.forEach(function(p, i){
        if(p.geometry) {
          var converted = self.projector(p.geometry, z, x, y);
          if(converted && converted.length !== 0) {
            projected.push({
              vertexBuffer: converted,
              type: p.geometry.type,
              metadata: p.properties
            });
          } else {
            delete p.geometry.coordinates;
          }
        }
      }); 
    } else {
      
      var length = data.layers.tile._features.length;
      for ( var i = length; i; ) {
        i--;
        
        var f = data.layers.tile.feature(i);

        f.loadGeometry()[0].forEach(function(g, i) {
          var x = ( g.x * 256 ) / data.layers.tile.extent;
          var y = ( g.y * 256 ) / data.layers.tile.extent;
          var obj = {
            vertexBuffer: { x: x, y: y },
            type: "Point",
            metadata: {}
          }
          projected.push( obj );
        });
        
      }
    }

    console.log('projected', projected);
    console.log('ctx', ctx);
    console.log('shader', shader);

    var ctx = canvas.getContext('2d');
    self.renderer.render(ctx, projected, shader, function( ){
      callback( canvas.toDataURL() );  
      //canvas.toBuffer(function(e, buf){});
    });

  });
  
};

module.exports = new Tilenik();

},{"./projector":2,"./renderer":3,"./shader":4}]},{},[5])