var should = require('should');
  Canvas = require('canvas'),
  fs = require('fs'),
  canvas = new Canvas(256,256),
  geojson = require('./data/points.5.5.12.geojson'),
  Tilenik = require('../src/tilenik');

describe('Rendering data to a canvas', function(){

    describe('primary rendering', function() {
      it('should return png data', function(done) {
        var css = "#layer { line-width: 2; line-color: #5FF; point-color: #057;}";
        Tilenik.render(canvas, geojson, css, 5, 5, 12, function( img ){
          var data = img.replace(/^data:image\/\w+;base64,/, "");
          var buf = new Buffer(data, 'base64');
          fs.writeFile( __dirname + '/5.5.12.png', buf, function( err ) {
            should.exist( img );
            done();
          });
        });
      });
    });

});
