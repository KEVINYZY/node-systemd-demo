require('systemd');
require('autoquit');

var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World');
});

server.autoQuit({ timeOut: 60 });
server.listen('systemd');

console.log('Server running at http://0.0.0.0:5000/');
