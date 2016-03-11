This demo shows you how working with Systemd. We will run a Node app as a daemon.

## How to Use

**First step, clone the code.**

```bash
$ git clone https://github.com/ruanyf/node-systemd-demo.git
$ cd node-systemd-demo
```

**Second step, modify the `node-server.service`.**

Replace the following placeholders with the real values.

- `[/path/to/node/executable]`
- `[path/to/node-systemd-demo]`
- `[yourUserName]`
- `[yourUserGroup]`

For example, if your node executable is `/usr/bin/node`, and path to `node-systemd-demo` is `/tmp/node-systemd-demo`, and both of your user name and your group name is `nobody`, the modified `node-server.service` should look like the following.

```bash
[Unit]
Description=node simple server

[Service]
ExecStart=/usr/bin/node /tmp/node-systemd-demo/server.js
Restart=always
User=nobody
Group=nobody
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/tmp/node-systemd-demo

[Install]
WantedBy=multi-user.target
```

If you don't know these values, run the following commands.

```bash
# node executable path
$ which node

# your user name
$ id -un

# your group name
$ id -gn
```

**Third step, copy the `node-server.service` into Systemd.**

```bash
$ sudo cp node-server.service /etc/systemd/system
```

**Fourth step, launch the service.**

Reload the unit file.

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl start node-server
```

Now visit http://0.0.0.0:5000, you should see a webpage of "Hello World".

**Fifth step, check the status.**

If you want to see the log, the following commands are helpful.

```bash
# check the service status
$ sudo systemctl status node-server

# view the log
$ sudo journalctl -u node-server

# view the growing log with appended output
$ sudo journalctl --follow -u node-server
```

**Sixth step, restart / stop the service.**

```bash
# restart the service
$ sudo systemctl restart node-server

# stop the servie
$ sudo systemctl stop node-server
```

If you want to launch the app in booting, use `systemctl enable`.

```bash
$ sudo systemctl enable node-server
```

## Advanced Feature: Socket Activation

Now, you have done the above steps, Node listens on the TCP port 5000 and serves requests, and Systemd monitors Node and restarts it when needed. It is the time we try something new.

Systemd has a gread feature called "socket activation".

> [Socket Activation]
>
> "You configure systemd to monitor the TCP port 5000, but don't launch Node. When a request comes in, Systemd will spawn Node and hand over the socket. All of this happens transparently to the client: it doesn’t know it is happening. From then on, Node handles all requests. Systemd goes back to the role of monitoring Node. When Node is done, Systemd will shut Node down automatically, and pick up the monitoring of the TCP port. The cycle can start again."

Before doing the following steps, you should ensure the Node service in the previous part has been stopped.

**First step, install the dependencies.**

Our `socket-server.js` needs two new modules: [`systemd`](https://www.npmjs.com/package/systemd) and [`autoquit`](https://www.npmjs.com/package/autoquit).

```javascript
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
```

Node module `systemd` adds support for running node.js as a socket-activated service, and `autoquit` detects when a server has been inactive for a period of time and shuts it down. As you see, in the above script, the `timeout` option is set 60 seconds of inactivity before triggering the service shutdown method. Moreover, you could use the [`journald`](https://www.npmjs.com/package/journald) module to add your own message into the Systemd log.

Now install the dependencies.

```bash
$ npm install
```

**Second step, modify the `node-socket-server.service`**

Look up the first part.

**Third step, copy the configure files into Systemd.**

Socket activation has two configure files.

```bash
$ sudo cp node-socket-server.socket /etc/systemd/system
$ sudo cp node-socket-server.service /etc/systemd/system
```

**Fourth step, launch the socket activation.**

```
$ sudo systemctl daemon-reload
$ sudo systemctl start node-socket-server.socket
```

Now you check the status.

```bash
$ sudo systemctl status node-socket-server.socket
● node-socket-server.socket
   Loaded: loaded (/etc/systemd/system/node-socket-server.socket; disabled)
   Active: active (listening) since 四 2016-03-10 20:36:41 CST; 7s ago
   Listen: [::]:5000 (Stream)

$ sudo systemctl status node-socket-server.service
● node-socket-server.service - node simple server (socket activation)
      Loaded: loaded (/etc/systemd/system/node-socket-server.service; disabled)
      Active: inactive (dead)
```

You could see the socket is `active` and the service is `inactive`.

You make a visit of http://0.0.0.0:5000. Then check the stutus again.

```bash
$ sudo systemctl status node-socket-server.socket
● node-socket-server.socket
   Loaded: loaded (/etc/systemd/system/node-socket-server.socket; disabled)
   Active: active (running) since 2016-03-10 20:36:41 CST; 1min 20s ago
   Listen: [::]:5000 (Stream)

$ sudo systemctl status node-socket-server.service
● node-socket-server.service - node simple server (socket activation)
   Loaded: loaded (/etc/systemd/system/node-socket-server.service; disabled)
   Active: active (running) since 2016-03-10 20:37:55 CST; 3min 11s ago
 Main PID: 1084 (node)
   CGroup: /system.slice/node-socket-server.service
           └─1084 node /home/ruanyf/project/node-systemd-demo/socket-server.js
```

You could see the output is different. Both of the socket and the service is `active` now.

**Fifth step, stop the service and socket activation.**

You turn off the service. Systemd will give you a warning.

```bash
$ sudo systemctl stop node-socket-server.service
Warning: Stopping node-socket-server.service, but it can still be activated by:
  node-socket-server.socket
```

You should stop the socket activation as well.

```bash
$ sudo systemctl stop node-socket-server.socket
```

## Useful Links

- Ruben Vermeersch, [Deploying Node.js with systemd](https://rocketeer.be/articles/deploying-node-js-with-systemd/)
- Mike MacCana, [How to deploy your node app on Linux, 2016 edition](https://certsimple.com/blog/deploy-node-on-linux)

## License

MIT
