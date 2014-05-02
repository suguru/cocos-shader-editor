;(function(global) {

  var uniforms = {};
  var attributes = {};

  panels.addUniform = function(name, type, values) {

    var uniform = {
      type: type,
      inputs: []
    };

    var count = ({
      mat4: 4,
      vec4: 4,
      vec3: 3,
      vec2: 2,
      float: 1
    })[type];

    uniforms[name] = [];

  };

  global.panels = panels;

})(window);
