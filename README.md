# tilenik 
--------
renders geojson tiles to canvas in javascript. 

## Vecnik 
This code is all taken from the [VECNIK](https://github.com/Vizzuality/VECNIK/) project by Vizzuality. The purpose of this project is to provide a simple, pure JS lib that can render geojson from CartoCSS strings. 

## Install 

    npm install tilenik 

## Usage 

    var Tilenik = require( 'tilenik' ),
      Canvas = require( 'canvas' ),
      canvas = new Canvas( 256, 256 );

    // cartocss string
    var css = "#layer { line-width: 1; line-color: #f00; point-color: #f00; }";

    Tilenik.render( canvas, geojson, css, function( png ){
      console.log( png );
    }); 
