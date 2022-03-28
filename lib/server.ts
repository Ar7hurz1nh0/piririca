import express, { Express, Request, Response as Res } from 'express';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { log, warn, error } from './log4';
import type { Bot } from 'global';

interface Req extends Request {
  body: { [key: string]: any };
}

export default class {
  constructor (bot: Bot, port: number) {
    warn(`Initializing server...`);
    this.bot = bot;
    this.server = express()
    this.port = port;

    this.addRoute('/', 'get', (req, res) => {
      res.send('OK')
    })

    this.addRoute('/config/dynamic', 'post', (req, res) => {})
  }

  public readonly bot: Bot;
  public readonly server: Express;
  private readonly port: number

  public async init (): Promise<void> {
    return new Promise<void>(r => {
      this.server.listen(this.port, () => {
        log(`$c green Listening on port $$$c magentaBright ${this.port}$$`)
        r()
      });
    })
  }

  addRoute(route: string, method: keyof Express, callback: (req: Req, res: Res) => void) {
    this.server[method](route, callback)
  }
}