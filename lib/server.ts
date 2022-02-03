import express from 'express';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import log, { warn, error } from './log4';

const app = express();

export default app.listen(process.env.PORT, () => log(`$c green Webserver enabled, listening on port ${process.env.PORT}$$`))