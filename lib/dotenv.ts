import dotenv, { config } from "dotenv"
import parser, { Parsed } from "dotenv-parse-variables"
import type { processEnv } from 'global'

if (dotenv.config({}).parsed !== undefined) {
  const parsedEnv: processEnv = parser((dotenv.config({}).parsed as Parsed)) as unknown as processEnv
  //(process.env as unknown as processEnv) = parsedEnv
  Object.assign(process.env, parsedEnv)
}

export default void 0