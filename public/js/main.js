/* global CodeMirror, mat4 */
$(function() {

  var log = (function() {
    var logs = [];
    var MAX_LOG = 100;
    var logArea = $('#logs');
    return function() {
      var line = Array.prototype.join.call(arguments, ' ');
      while (logs.length >= MAX_LOG) {
        var elm = logs.shift();
        logArea.removeChild(elm);
      }
      var lineElement = document.createElement('div');
      lineElement.appendChild(document.createTextNode(line));
      logArea.append(lineElement);
      logs.push(lineElement);
      logArea.scrollTop(logArea.get(0).scrollHeight);
    };
  })();

  var vertexEditor = CodeMirror(function(elt) {
    $('#vertex-editor').append(elt);
  }, {
    theme: 'monokai',
    lineNumbers: true,
    mode: 'x-shader/x-vertex',
    value:
      'attribute vec4 a_position;\n' +
      'attribute vec2 a_texCoord;\n' +
      'attribute vec4 a_color;\n' +
      '\n' +
      'varying lowp vec4 v_fragmentColor;\n' +
      'varying mediump vec2 v_texCoord;\n' +
      '\n' +
      'void main() {\n' +
      '  gl_Position = CC_PMatrix * a_position;\n' +
      '  v_fragmentColor = a_color;\n' +
      '  v_texCoord = a_texCoord;\n' +
      '}'
  });
  vertexEditor.on('change', function() {
    waitAndInit();
  });

  var fragmentEditor = CodeMirror(function(elt) {
    $('#fragment-editor').append(elt);
  }, {
    theme: 'monokai',
    lineNumbers: true,
    mode: 'x-shader/x-fragment',
    value:
      'varying lowp vec4 v_fragmentColor;\n' +
      'varying lowp vec2 v_texCoord;\n' +
      'uniform sampler2D CC_Texture0;\n' +
      '\n' +
      'void main(void) {\n' +
      //'  gl_FragColor = vec4(0.9,0.8,1,1);\n' +
      //'  gl_FragColor = v_fragmentColor;\n' +
      '  gl_FragColor = texture2D(CC_Texture0, v_texCoord);\n' +
      '}'
  });
  fragmentEditor.on('change', function() {
    waitAndInit();
  });

  var canvas = document.getElementById('gl');

  var glOption = { premultipliedAlpha: false };

  var gl = canvas.getContext('webgl', glOption) || canvas.getContext('experimental-webgl', glOption);

  var shaderProgram;
  var uniforms;
  var attrs;
  var texture;

  var compileShader = function(source, type) {
    var shader;
    var editor;
    // basic heade
    source = [
      'precision mediump float;',
      'uniform mat4 CC_PMatrix;',
      'uniform mat4 CC_MVMatrix;',
      'uniform mat4 CC_MVPMatrix;',
      'uniform vec4 CC_Time;',
      'uniform vec4 CC_SinTime;',
      'uniform vec4 CC_CosTime;',
      'uniform vec4 CC_Random01;'
    ].join('\n') + '\n\n' + source;

    if (type === 'shader-vs') {
      shader = gl.createShader(gl.VERTEX_SHADER);
      editor = vertexEditor;
    } else if (type === 'shader-fs') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
      editor = fragmentEditor;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // clear error
    if (editor.__errors) {
      editor.__errors.forEach(function(err) {
        editor.removeLineClass(err.line, err.where, err.class);
      });
    }
    if (editor.__widgets) {
      editor.__widgets.forEach(function(widget) {
        widget.clear();
      });
    }

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

      var shaderLog = gl.getShaderInfoLog(shader);
      if (shaderLog) {
        // init error array
        editor.__errors = [];
        editor.__widgets = [];
        // parsing error mesage
        var pattern = /ERROR:\s[0-9]+:([0-9]+):(.*)/;
        shaderLog.split('\n').forEach(function(log) {
          var match = pattern.exec(log);
          if (match) {
            var line = Number(match[1]) - 10;
            var text = match[2];

            var elm = document.createElement('div');
            var icon = document.createElement('span');
            icon.innerHTML = '!';
            icon.className = 'error-icon';

            var msg = document.createElement('span');
            msg.appendChild(document.createTextNode(text));
            msg.className = 'error-message';

            elm.appendChild(icon);
            elm.appendChild(msg);
            elm.className = 'error-line';

            editor.__widgets.push(editor.addLineWidget(line, elm, { coverGutter: false, noHScroll: true }));
            editor.__errors.push({ line: line, where: 'background', class: 'line-error' });
            editor.addLineClass(line, 'background', 'line-error');
          }
        });
        return null;
      }
    }
    return shader;
  };

  var initShaders = function() {

    var vertexShader = compileShader(vertexEditor.getValue(), 'shader-vs');
    var fragmentShader = compileShader(fragmentEditor.getValue(), 'shader-fs');

    if (!vertexShader || !fragmentShader) {
      return;
    }
    log('Compiled shaders successfully');

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      log('Could not link shaders. ' + gl.getProgramInfoLog(shaderProgram));
    }
    log('Linked shader program');

    gl.useProgram(shaderProgram);

    attrs = {};
    attrs.a_position = gl.getAttribLocation(shaderProgram, 'a_position');
    attrs.a_texCoord = gl.getAttribLocation(shaderProgram, 'a_texCoord');
    attrs.a_color = gl.getAttribLocation(shaderProgram, 'a_color');

    uniforms = {};
    uniforms.CC_PMatrix = gl.getUniformLocation(shaderProgram, 'CC_PMatrix');
    uniforms.CC_MVMatrix = gl.getUniformLocation(shaderProgram, 'CC_MVMatrix');
    uniforms.CC_MVPMatrix = gl.getUniformLocation(shaderProgram, 'CC_MVPMatrix');
    uniforms.CC_Texture0 = gl.getUniformLocation(shaderProgram, 'CC_Texture0');
    uniforms.CC_Time = gl.getUniformLocation(shaderProgram, 'CC_Time');
    uniforms.CC_SinTime = gl.getUniformLocation(shaderProgram, 'CC_SinTime');
    uniforms.CC_CosTime = gl.getUniformLocation(shaderProgram, 'CC_CosTime');
    uniforms.CC_Random01 = gl.getUniformLocation(shaderProgram, 'CC_Random01');
  };

  var loadTexture = function(url) {
    var img = new Image();
    img.addEventListener('load', function() {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      texture = tex;
      gl.bindTexture(gl.TEXTURE_2D, texture);
    });
    img.src = url;
  };

  var createVBO = function(data) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  };

  var createIBO = function(data) {
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
  };

  var position = createVBO([
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ]);

  var color = createVBO([
    1, 0, 0, 1,
    0, 1, 0, 1,
    0, 0, 1, 1,
    1, 1, 1, 1
  ]);

  var texCoords = createVBO([
    1.0, 0.0,
    0.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ]);

  var index = createIBO([
    0, 1, 2,
    3, 2, 1
  ]);

  // initialize matrix
  var mMatrix = mat4.create();
  var pMatrix = mat4.create();
  var vMatrix = mat4.create();
  var mvMatrix = mat4.create();
  var mvpMatrix = mat4.create();

  mat4.identity(mMatrix);
  mat4.identity(pMatrix);
  mat4.identity(vMatrix);
  mat4.identity(mvMatrix);
  mat4.identity(mvpMatrix);
  
  mat4.lookAt([0, 1, 3], [0, 0, 0], [0, 1, 0], vMatrix);
  mat4.perspective(90, canvas.width / canvas.height, 0.1, 100.0, pMatrix);

  mat4.multiply(vMatrix, mMatrix, mvMatrix);
  mat4.multiply(pMatrix, vMatrix, mvpMatrix);
  mat4.multiply(mvpMatrix, mMatrix, mvpMatrix);

  var setAttributes = function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
    gl.enableVertexAttribArray(attrs.a_texCoord);
    gl.vertexAttribPointer(attrs.a_texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.enableVertexAttribArray(attrs.a_position);
    gl.vertexAttribPointer(attrs.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, color);
    gl.enableVertexAttribArray(attrs.a_color);
    gl.vertexAttribPointer(attrs.a_color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  };

  var draw = function() {

    gl.clearColor(0,0,0,0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1i(uniforms.CC_Texture0, 0);

    gl.uniformMatrix4fv(uniforms.CC_PMatrix, false, pMatrix);
    gl.uniformMatrix4fv(uniforms.CC_MVMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(uniforms.CC_MVPMatrix, false, mvpMatrix);

    gl.uniform4fv(uniforms.CC_Time, [time/10, time, time*2, time*4]);
    gl.uniform4fv(uniforms.CC_SinTime, [time/8, time/4, time/2, Math.sin(time)]);
    gl.uniform4fv(uniforms.CC_CosTime, [time/8, time/4, time/2, Math.cos(time)]);
    gl.uniform4fv(uniforms.CC_Random01, [Math.random(), Math.random(), Math.random(), Math.random()]);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, index);
    //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
  };

  var time = 0;
  var animationInterval = 1/60000;

  var step = function() {
    draw();
    window.requestAnimationFrame(step);
    time += animationInterval;
  };

  var init = function() {

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.activeTexture(gl.TEXTURE0);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // loadTexture('/img/cocos2dx_portrait.png');
    loadTexture('/img/cocos2dx_logo.png');
    initShaders();
    setAttributes();
    step();
  };

  var initTimeout = -1;
  var waitAndInit = function() {
    if (initTimeout !== -1) {
      clearTimeout(initTimeout);
    }
    initTimeout = setTimeout(function() {
      init();
      initTimeout = -1;
    }, 500);
  };

  init();
  
  var resize = (function(win) {
    win = $(win);
    return function() {
      var width = win.width();
      var height = win.height();
      var halfWidth = Math.floor(width / 2);
      var halfHeight = Math.floor(height / 2);
      vertexEditor.setSize('100%', (halfHeight - 15) + 'px');
      fragmentEditor.setSize('100%', (halfHeight - 15) + 'px');
      $('#logs').height((height - Math.min(512, halfWidth) - 42) + 'px');
    };
  })(window);

  $(window).on('resize', resize);
  resize();

});
