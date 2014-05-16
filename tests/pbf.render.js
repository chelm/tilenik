var  Canvas = require('canvas'),
  should = require('should'),
  canvas = new Canvas(256,256),
  Tilenik = require('../src/tilenik'),
  fs = require('fs'),
  VectorTile = require('vector-tile');
  
describe('Rendering data to a canvas', function(){

  describe('primary rendering', function() {
    it('should return png data', function(done) {
      var data = fs.readFileSync('tests/data/5.5.12.pbf');
      var tile = new VectorTile(data);

      // cartocss string
      var css = "#layer { polygon-fill: #fff; polygon-gamma: 0.5; }";

      Tilenik.render( canvas, tile, css, null, null, null, function( img ){
        var data = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(data, 'base64');
        fs.writeFile( __dirname + '/pbf.png', buf, function( err ) {
          should.exist( img );
          done();
        });
      }); 
    });
  });

});
