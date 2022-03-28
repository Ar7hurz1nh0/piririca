import dotenv from "dotenv"
import parser, { Parsed } from "dotenv-parse-variables"
import type { processEnv } from 'global'

const config = dotenv.config({}).parsed as Parsed | undefined

if (config !== undefined) {
  const parsedEnv: processEnv = parser((config as Parsed)) as unknown as processEnv
  Object.assign(process.env, parsedEnv)
}

export default void 0