import { PrismaClient } from '@prisma/client';

import { exec } from 'child_process';
import { logger as lg } from './logger';
import { bombay12 as bom12, columbus5 as col5 } from './seeds';

const prisma = new PrismaClient();

lg.info('Starting monitor');
setInterval(() => {
  main().catch((err) => {
    lg.error(`An error occurred: ${err.toString()}`);
  });
}, 1800000);
main().catch((err) => {
  lg.error(`An error occurred: ${err.toString()}`);
});

async function main() {
  // Check col-5 first.
  let b = 'bombay-12';
  lg.info(`Checking ${bom12.length} seed nodes in ${b}.`);
  await run(bom12, b);

  let c = 'columbus-5';
  lg.info(`Checking ${col5.length} seed nodes in ${c}.`);
  await run(col5, c);
}

async function run(nodes: string[], net: string) {
  let pms = [];
  for (let i = 0; i < nodes.length; i++) {
    let entry = nodes[i];
    let [nodeId, addr] = entry.trim().split('@');
    if (!addr) {
      throw new Error(`No address found at entry ${i} for ${net}.`);
    }
    let [ip, port] = addr.split(':');
    if (!ip) {
      throw new Error(`No IP address/URL specified for entry ${i} for ${net}.`);
    }
    if (!port) {
      throw new Error(`No port specified for entry ${i} for ${net}.`);
    }
    // Create the node entry in DB if not already.
    let node = await prisma.node.findUnique({
      where: {
        id: nodeId,
      },
    });
    if (!node) {
      await prisma.node.create({
        data: {
          id: nodeId,
        },
      });
    }

    pms.push(
      new Promise((resolve) => {
        exec(`nc -z ${ip} ${port} -w 5`, async (err, stdout, stderr) => {
          let success = false;

          let out = `Pinging ${addr}`;
          if (err) {
            out += `\n    Error: ${err.message}`;
          } else if (stderr) {
            out += `\n    Error: ${stderr}`;
          } else if (stdout) {
            out += `\n    OK: ${stdout}`;
            success = true;
          } else {
            out += ` OK`;
            success = true;
          }

          await prisma.ping.create({
            data: {
              nodeId,
              success,
            },
          });
          console.info(out);
          resolve(out);
        });
      })
    );
  }
  return Promise.all(pms);
}
