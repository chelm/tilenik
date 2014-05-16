var Tilenik = function(){
  this.carto = require('./carto'),
  this.shader = require('./shader'),  
  this.renderer = require('./renderer'),
  this.projector = require('./projector');

};

Tilenik.prototype.render = function( canvas, geojson, css, z, x, y, callback ){
  var self = this;

  this.carto.compile( css, function( shaderData ){
    var shader = new self.shader( shaderData );
    var projected = [];

    if ( geojson.features && geojson.features.length ){
      geojson.features.forEach(function(p, i){
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
    }


    var ctx = canvas.getContext('2d');
    self.renderer.render(ctx, projected, shader, function( ){
      callback( canvas.toDataURL() );  
      //canvas.toBuffer(function(e, buf){});
    });

  });
  
};

module.exports = new Tilenik();
