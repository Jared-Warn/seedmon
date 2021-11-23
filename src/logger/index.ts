/**
 * Setup for the logging mechanism.
 *
 * @module logger
 */

import * as winston from "winston";

import { LOG_FILE, LOG_LEVEL } from "../constants";

let logFile = "seedmon.log";
let errFile = "error.log";
let logLevel = "info";
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    ({ level, message, timestamp }) =>
      `${timestamp}: (${level.toUpperCase()}) ${message}`
  )
);

if (process.env) {
  if (process.env[LOG_FILE]) {
    logFile = process.env[LOG_FILE]!;
  }
  if (process.env[LOG_LEVEL]) {
    // Available options for levels: https://www.npmjs.com/package/winston#logging-levels
    logLevel = process.env[LOG_LEVEL]!;
  }
}

export const logger = winston.createLogger({
  format: logFormat,
  level: logLevel,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: errFile, level: "error" }),
    new winston.transports.File({ filename: logFile }),
  ],
});
