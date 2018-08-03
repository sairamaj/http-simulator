// http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/
// https://itnext.io/building-restful-web-apis-with-node-js-express-mongodb-and-typescript-part-1-2-195bdaf129cf
import * as http from 'http';
import * as https from 'https'
import * as debug from 'debug';
import * as fs from 'fs';
var config = require('./config')
import App from './App';

debug('ts-express:server');

const port = normalizePort(config.app.port);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

var sslOptions = {
  key: fs.readFileSync('localhost.key'),
  cert: fs.readFileSync('localhost.crt'),
  passphrase: '1234'
};
const httpsServer = https.createServer(sslOptions, App)
httpsServer.listen(3443)
httpsServer.on('error', onError);
httpsServer.on('listening', onHttpsListening);

function normalizePort(val: number | string): number | string | boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  console.log('in onError...')
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      console.log('in default throwing error.')
      throw error;
  }
}

function onListening(): void {
  let addr = server.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`http listening on ${bind}`);
  console.log(`provider: ` + config.app.provider);
  if (config.app.provider === 'file') {
    console.log('`t file provider location:' + config.app.fileProviderLocation)
  }
}

function onHttpsListening(): void {
  let addr = httpsServer.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`https listening on ${bind}`);
}

