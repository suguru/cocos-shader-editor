;(function(global) {

  var uniforms = {};
  var attributes = {};

  var counts = {
    mat4: 16,
    vec4: 4,
    vec3: 3,
    vec2: 2,
    float: 1
  };

  var panels = {};

  /**
   * Create value container
   */
  var createControl = function(name, type, values) {

    var control = $('<div/>');
    control.attr('id', 'control-' + name);
    control.addClass('form-control');

    // label container
    var labelCon = $('<div class="pure-u-1-4"/>');
    var label = $('<label/>');
    label.text(name);
    labelCon.append(label);
    control.append(labelCon);

    var count = counts[type];
    if (!count) {
      throw 'invalid type ' + type;
    }

    // input container
    var inputCon = $('<div class="pure-u-3-4"/>');
    control.append(inputCon);

    for (var i = 0; i < count; i++) {
      var input = $('<input type="text" />');
      var value = (values && values[i]);
      if (value === undefined) {
        value = '1.0';
      }
      input.addClass('pure-input-1-4');
      input.val(value);
      inputCon.append(input);
    }

    return control;
  };

  var valueGetter = function(control) {
    return function() {
      var values = [];
      control.find('input').each(function() {
        var value = Number($(this).val());
        // prevent defining NaN
        if (isNaN(value)) {
          value = 0;
        }
        values.push(value);
      });
      return values;
    };
  };

  var listenValueChange = function(control) {
    return function(handler) {
      control.find('input').on('keyup', handler);
    };
  };

  /**
   * Add uniform form
   * @param {string} name name of the uniform
   * @param {string} type type of value (vec2/vec3/vec4/mat4)
   * @param {array} values default values
   */
  panels.addUniform = function(name, type, values) {
    var control = createControl(name, type, values);
    $('#uniforms > form').append(control);
    var uniform = {
      type: type,
      control: control,
      size: counts[type],
      values: valueGetter(control),
      onChange: listenValueChange(control)
    };
    uniforms[name] = uniform;
    return uniform;
  };

  panels.getUniforms = function() {
    return uniforms;
  };

  /**
   * Add attribute form
   * @param {string} name name of the uniform
   * @param {string} type type of value (vec2/vec3/vec4/mat4)
   * @param {array} values default values
   */
  panels.addAttribute = function(name, type, values) {
    var control = createControl(name, type, values);
    $('#attributes > form').append(control);
    var attribute = {
      type: type,
      control: control,
      size: counts[type] / 4, // per vertex
      values: valueGetter(control),
      onChange: listenValueChange(control)
    };
    attributes[name] = attribute;
    return attribute;
  };

  panels.getUniforms = function() {
    return uniforms;
  };

  panels.getAttributes = function() {
    return attributes;
  };

  global.panels = panels;

})(window);
