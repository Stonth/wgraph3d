const express = require('express');
const http = require('http');
const path = require('path');

// Directories.
const WEB_DIRECTORY = path.join(__dirname, '..', 'web');
const CLIENT_LIB_DIRECTORY = path.join(__dirname, '..', 'lib');
const CLIENT_SRC_DIRECTORY = path.join(__dirname, 'public');
const CLIENT_MODULE_DIRECTORY = path.join(__dirname, '..', 'node_modules');

// The web port.
const WEB_PORT = 420;

// The socket.io port.
const SOCKET_PORT = 421;

// Create the express web app.
const webApp = express();

// Define basic routes.
webApp.use('/src/', express.static(CLIENT_SRC_DIRECTORY));
webApp.use('/lib/', express.static(CLIENT_MODULE_DIRECTORY));
webApp.use('/lib/', express.static(CLIENT_LIB_DIRECTORY));
webApp.use('/', express.static(WEB_DIRECTORY));

// Create the web server and listen.
const httpServer = http.createServer(webApp);
httpServer.listen(420);
