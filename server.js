var express = require('express');
var path = require('path');
var mimeType = require("mime-types");
var app = express();

require("./lib/githubdatafetch");



app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname , "./static/index.html"));
});

app.get('/pullrequests.html', function (req, res) {
  res.sendFile(path.resolve(__dirname , "./static/pullrequests.html"));
});

app.get('/pullrequests.html', function (req, res) {
  res.sendFile(path.resolve(__dirname , "./static/pullrequests.html"));
});

app.get('/api/pullrequests', function (req, res) {
  
  var result = "";
  if (req.query.callback){
    result += req.query.callback + "("
  }
  result += JSON.stringify(require("./lib/pullrequests").getAllOpenPullRequests());
  
  if (req.query.callback){
    result += ");"
  }
  res.send(result);
});

app.get('/api/pullrequests/:id/*', function (req, res) {
  var pr = require("./lib/pullrequests").get( req.params.id);
  var tree = require("./lib/trees").get(pr.sha);
  var path = req.params[0];
  res.set('Content-Type', mimeType.lookup(path));
  require("./lib/blobs").get(tree.paths[path]).then(function(blob) {res.send(blob)});
});

var server = app.listen( process.env.PORT,process.env.IP, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});