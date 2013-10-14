var carto = require('carto'),
  _ = require('underscore');

// monkey patch less classes
carto.tree.Value.prototype.toJS = function() {
    var v = this.value[0].value[0];
    val = v.toString();
    if(v.is === "color") {
      val = "'" + val + "'";
    }
    return "_value = " + val + ";"
};

carto.tree.Selector.prototype.toJS = function() {
  var self = this;
  var opMap = {
    '=': '==='
  };
  var zoom = "(" + self.zoom + " & (1 << ctx.zoom))";
  return [zoom].concat(
    _.map(this.filters, function(filter) {
      var op = filter.op;
      if(op in opMap) {
        op = opMap[op];
      }
      var val = filter.val;
      if(filter._val !== undefined) {
        val = filter._val.toString(true);
      }

      var attrs = "data";
      return attrs + "." + filter.key  + " " + op + " " + val;
    })
  ).join(" && ");
};

carto.tree.Ruleset.prototype.toJS = function() {
  var shaderAttrs = {};
  var _if = this.selectors[0].toJS();
  _.each(this.rules, function(rule) {
      if(rule instanceof carto.tree.Rule) {
        shaderAttrs[rule.name] = shaderAttrs[rule.name] || [];
        if (_if) {
        shaderAttrs[rule.name].push(
          "if(" + _if + "){" + rule.value.toJS() + "}"
        );
        } else {
          shaderAttrs[rule.name].push(rule.value.toJS());
        }
      } else {
        if (rule instanceof carto.tree.Ruleset) {
          var sh = rule.toJS();
          for(var v in sh) {
            shaderAttrs[v] = shaderAttrs[v] || [];
            for(var attr in sh[v]) {
              shaderAttrs[v].push(sh[v][attr]);
            }
          }
        }
      }
  });
  return shaderAttrs;
};

function createFn(ops) {
  var body = ops.join('\n');
  return Function("data","ctx", "var _value = null; " +  body + "; return _value; ");
}

function toCartoShader(ruleset) {
  var shaderAttrs = {};
  shaderAttrs = ruleset.rules[0].toJS();
  try {
    for(var attr in shaderAttrs) {
      shaderAttrs[attr] = createFn(shaderAttrs[attr]);
    }
  }
  catch(e) {
    console.log("error creating shader");
    console.log(e);
    return null;
  }


  return shaderAttrs;
}

/**
 * compile from Carto style to javascript shader
 */
var compile = function(style, callback) {

  var parse_env = {
      error: function(obj) {
        console.log("ERROR");
      }
  };

  var parser = new carto.Parser(parse_env);

  var ruleset = parser.parse(style);
  if(ruleset) {
      var shader = toCartoShader(ruleset);
      callback(shader);
  } else {
      callback(null);
  }
}

carto.tree.Reference.data = require('./reference.json');
carto.tree.Reference.selectors = (function() {
    var list = [];
    for (var i in carto.tree.Reference.data.symbolizers) {
        for (var j in carto.tree.Reference.data.symbolizers[i]) {
            if (carto.tree.Reference.data.symbolizers[i][j].hasOwnProperty('css')) {
                list.push(carto.tree.Reference.data.symbolizers[i][j].css);
            }
        }
    }
    return list;
})();


module.exports = {
  _carto: carto,
  compile: compile
};
