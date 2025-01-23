import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import DatabaseQueryer from './DatabaseQueryer.js';
import RestApi from './RestApi.js';
const __dirname = import.meta.dirname;

export default class Server {

  app = express();
  port = 4000;

  constructor() {
    this.start();
  }

  start() {
    this.setupExpressSession();
    this.app.use(express.json());
    new RestApi(this.app);
    this.serveDist();
    let message = `Backend listening on port ${this.port}`;
    this.app.listen(this.port, () => console.log(message));
  }

  setupExpressSession() {
    const dbConnection = DatabaseQueryer.connect();
    const MySQLStore = expressMySQLSession(session);
    const { sessionSalt } = JSON.parse(fs.readFileSync('../settings.json', 'utf-8'));
    this.app.use(session({
      secret: sessionSalt,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: 'auto' },
      store: new MySQLStore({}, dbConnection.promise())
    }));
  }


  serveDist() {
    // serve built dist (production React created with npm run build)
    this.app.use(express.static(path.join(__dirname, '../', 'dist')));
    // make hard reload of frontend routes work
    // serve index.html if there is no matching backend route
    this.app.get('*', (req, res) => {
      let indexHtml = path.join(__dirname, '../', 'dist', 'index.html');
      if (!fs.existsSync(indexHtml)) {
        res.status(404);
        res.send('404: No dist built yet...');
        return;
      }
      res.sendFile(indexHtml);
    });
  }

}