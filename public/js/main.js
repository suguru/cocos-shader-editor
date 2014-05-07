/* global CodeMirror */
$(function() {

  var g = window;

  g.log = (function() {
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

  var editors = g.editors;
  var webgl = g.webgl;

  editors.init();
  webgl.init();

  var resize = (function(win) {
    win = $(win);
    return function() {

      var height = win.height();
      var headerHeight = $('header').height();
      var canvasHeight = $('canvas').height();

      var halfHeight = Math.floor((height - headerHeight) / 2);

      var previewHeight = $('#gl-view').height();
      var h5Height = $('#vertex-area > h5').height();
      var menuHeight = $('#panel-view li').height();

      editors.vertex.setSize('100%', (halfHeight - h5Height) + 'px');
      editors.fragment.setSize('100%', (halfHeight - h5Height) + 'px');

      $('#panel-content').height((height - previewHeight - menuHeight - headerHeight) + 'px');
      $('#preview').height(canvasHeight);
    };
  })(g);

  g.selectPanel = function(name) {
    var container = $('#panel-view');
    container.find('ul li').removeClass('pure-menu-selected');
    $('#panel-content > div').hide();
    $('#menu-'+name).addClass('pure-menu-selected');
    $('#'+name).show();
    return false;
  };

  $(g).on('resize', resize);
  resize();
  g.selectPanel('uniforms');

});
