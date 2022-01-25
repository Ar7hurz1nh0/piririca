import dotenv, { config } from "dotenv"
import parser, { Parsed } from "dotenv-parse-variables"
import type { processEnv } from 'global'

config({})

const parsedEnv: processEnv = parser((dotenv.config({}).parsed as Parsed)) as unknown as processEnv
(process.env as unknown as processEnv) = parsedEnv

export default void 0