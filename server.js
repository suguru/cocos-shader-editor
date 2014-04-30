
var path = require('path');
var express = require('express');
var app = express();

app.set('view engine', 'jade');
app.get('/', function(req, res) {
  res.render('index');
});
app.use(express.static(path.join(__dirname, 'public')));

var port = Number(process.env.PORT || 3000);
app.listen(port);
