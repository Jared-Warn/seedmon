import { exec } from 'child_process';
import { exceptions } from 'winston';
import { logger as lg } from './logger';
import { bombay12 as bom12, columbus5 as col5 } from './seeds';

lg.info('Starting monitor');
setInterval(() => {
  main().catch((err) => {
    lg.error(`An error occurred: ${err.toString()}`);
  });
}, 10000);
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

function run(nodes: string[], net: string) {
  let pms = [];
  for (let i = 0; i < nodes.length; i++) {
    let entry = nodes[i];
    let [_nodeId, addr] = entry.trim().split('@');
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
    pms.push(
      new Promise((resolve) => {
        exec(`nc -z ${ip} ${port} -w 5`, (err, stdout, stderr) => {
          let out = `Pinging ${addr}`;
          if (err) {
            out += `\n    Error: ${err.message}`;
          } else if (stderr) {
            out += `\n    Error: ${stderr}`;
          } else if (stdout) {
            out += `\n    OK: ${stdout}`;
          } else {
            out += ` OK`;
          }
          console.info(out);
          resolve(out);
        });
      })
    );
  }
  return Promise.all(pms);
}
