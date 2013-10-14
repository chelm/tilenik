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
