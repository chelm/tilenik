var Tilenik = function(){
  this.carto = require('./carto')
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
        var line = [];
        f.loadGeometry()[0].forEach(function(g, i) {
          var x = ( g.x * 256 ) / data.layers.tile.extent;
          var y = ( g.y * 256 ) / data.layers.tile.extent;
          line.push({ x: x, y: y });
        });
        var obj = {
          vertexBuffer: [line],
          type: "Polygon",
          metadata: {}
        }
        console.log('obj', obj);
        projected.push( obj );
        
      }
    }

    //console.log('projected', projected);
    
    var ctx = canvas.getContext('2d');
    self.renderer.render(ctx, projected, shader, function( ){
      callback( canvas.toDataURL() );  
      //canvas.toBuffer(function(e, buf){});
    });

  });
  
};

module.exports = new Tilenik();
