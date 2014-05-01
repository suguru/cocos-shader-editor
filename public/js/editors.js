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
    }
  };
  g.editors = editors;
  console.log(g);

})(window);
