/* global CodeMirror, webgl */
;(function(g) {

  var editors = {
    init: function() {
      this.vertex = CodeMirror(function(elt) {
        $('#vertex-editor').append(elt);
      }, {
        theme: 'monokai',
        lineNumbers: true,
        mode: 'x-shader/x-vertex',
        gutters: ['CodeMirror-linenumbers', 'errors'],
        value: [
          'attribute vec4 a_position;',
          'attribute vec2 a_texCoord;',
          'attribute vec4 a_color;',
          '',
          '#ifdef GL_ES',
          'varying lowp vec4 v_fragmentColor;',
          'varying mediump vec2 v_texCoord;',
          '#else',
          'varying vec4 v_fragmentColor;',
          'varying vec2 v_texCoord;',
          '#endif',
          '',
          'void main() {',
          '  gl_Position = CC_PMatrix * a_position;',
          '  v_fragmentColor = a_color;',
          '  v_texCoord = a_texCoord;',
          '}'
        ].join('\n')
      });
      this.vertex.on('change', function() {
        webgl.waitAndInit();
      });
      this.fragment = CodeMirror(function(elt) {
        $('#fragment-editor').append(elt);
      }, {
        theme: 'monokai',
        lineNumbers: true,
        mode: 'x-shader/x-fragment',
        gutters: ['CodeMirror-linenumbers', 'errors'],
        value: [
          '#ifdef GL_ES',
          'precision mediump float;',
          '#endif',
          '',
          'varying vec4 v_fragmentColor;',
          'varying vec2 v_texCoord;',
          'uniform sampler2D CC_Texture0;',
          '',
          'void main(void) {',
          '  gl_FragColor = texture2D(CC_Texture0, v_texCoord);',
          '}'
        ].join('\n')
      });
      this.fragment.on('change', function() {
        webgl.waitAndInit();
      });
      return this;
    },

    get: function(type) {
      if (type === 'shader-vs') {
        return this.vertex;
      } else if (type === 'shader-fs') {
        return this.fragment;
      }
    },

    clearError: function(type) {
      var editor = this.get(type);
      if (editor.__errors) {
        editor.__errors.forEach(function(err) {
          editor.removeLineClass(err.line, err.where, err.class);
        });
      }
      // clear error
      if (editor.__widgets) {
        editor.__widgets.forEach(function(widget) {
          widget.clear();
        });
      }
      editor.clearGutter('errors');
      editor.__errors = [];
      editor.__widgets = [];
    },

    addError: function(type, line, message) {
      var editor = this.get(type);
      var elm = document.createElement('div');

      var msg = document.createElement('span');
      msg.appendChild(document.createTextNode(message));
      msg.className = 'error-message';

      elm.appendChild(msg);
      elm.className = 'error-line';

      editor.__widgets.push(editor.addLineWidget(line, elm, { coverGutter: false, noHScroll: true }));
      editor.__errors.push({ line: line, where: 'background', class: 'line-error' });
      editor.addLineClass(line, 'background', 'line-error');

      var mark = document.createElement('div');
      mark.className = 'error-mark';
      mark.innerHTML = '!';

      var info = editor.getLineHandle(line);
      editor.setGutterMarker(info, 'errors', mark);
    }

  };
  g.editors = editors;

})(window);
