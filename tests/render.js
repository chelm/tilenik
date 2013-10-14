var should = require('should');
  Canvas = require('canvas'),
  canvas = new Canvas(256,256),
  geojson = require('./data/points.5.5.12.geojson'),
  Tilenik = require('../src/tilenik');

describe('Rendering data to a canvas', function(){

    describe('primary rendering', function() {
      it('should return png data', function(done) {
        var css = "#layer { line-width: 1; line-color: #f00; point-color: #f00; }";
        Tilenik.render(canvas, geojson, css, 5, 5, 12, function( png ){
          console.log('rendered', png);
          should.exist( png );
          return done();
        });
      });
    });

});
