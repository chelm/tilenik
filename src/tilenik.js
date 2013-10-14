var Tilenik = function(){
  this.carto = require('./carto'),
  this.shader = require('./shader'),  
  this.renderer = require('./renderer'),
  this.projector = require('./projector');
};

Tilenik.prototype.render = function( canvas, geojson, css, callback ){
  var self = this;

  this.carto.compile( css, function( shaderData ){

    console.log(shaderData);
    var shader = new self.shader( shaderData );

    var projected = [];

    if ( geojson.features && geojson.features.length ){
      geojson.features.forEach(function(p, i){
        if(p.geometry) {
          var converted = self.projector(p.geometry, 5, 5, 12);
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
    }


    var ctx = canvas.getContext('2d');
    self.renderer.render(ctx, projected, shader, function( ){
      callback( canvas.toDataURL() );  
    });

  });
  
};

module.exports = new Tilenik();
