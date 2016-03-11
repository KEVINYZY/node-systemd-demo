var http = require('http');

var hostname = '0.0.0.0';
var port = 5000;

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World');
}).listen(port, hostname, function () {
  console.log('Server running at http://%s:%s/', hostname, port);
});
