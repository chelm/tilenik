
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

