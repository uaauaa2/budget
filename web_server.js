/*var express = require('express'),
    app = express();

app.use(express.static(__dirname + '/www2'));

app.listen(8080);*/



var express = require('express');
var app = express();
var server = require('http').createServer(app);

app.get('/', function (request, response) {
    response.sendFile(__dirname + "/www/web_index.html");
});
app.use(express.static(__dirname + '/www'));
app.listen(8080);
