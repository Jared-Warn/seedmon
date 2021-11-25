import { Ping, PrismaClient } from '@prisma/client';
import { EOL } from 'os';
import yargs from 'yargs';

import { bombay12 as bom, columbus5 as col } from './seeds';

const prisma = new PrismaClient();
const HEADERS = ['Node ID', 'Number of pings', 'Uptime'];
const MAX_RESULTS = 2880;
const C_NODE = 0;
const C_PING = 1;
const C_TIME = 2;

const argv = yargs(process.argv.slice(2))
  .options({
    c: {
      alias: 'chain',
      choices: ['bom', 'col'],
      demandOption: true,
      describe: 'The chain to retrieve the seed nodes for.',
    },
  })
  .parseSync();

let maxNode = HEADERS[C_NODE].length;
let maxPing = HEADERS[C_PING].length;
let maxTime = '100.00%'.length;

main().catch((err) => {
  process.stderr.write(`An error occurred: ${err.toString()}`);
});

async function main() {
  let nodes = null;
  if (argv.c === 'col') {
    nodes = col;
  } else if (argv.c === 'bom') {
    nodes = bom;
  } else {
    // return statement needed to compile.
    return;
  }
  let results = await calc(nodes);
  print(results);
}

/**
 * Tabulates the data for printout.
 * @param nodes - The list of entries from seeds.ts
 * @returns A 2x2 matrix with the results to render.
 */
async function calc(nodes: string[]): Promise<string[][]> {
  let results = new Array<string[]>(nodes.length);

  for (let i = 0; i < nodes.length; i++) {
    const entry = nodes[i];

    let [nodeId, addr] = entry.trim().split('@');
    results[i] = [nodeId];

    // Fetch the records from DB.
    let node = await prisma.node.findUnique({
      where: {
        id: nodeId,
      },
    });
    if (!node) {
      results[i].push('Node not found');
      continue;
    }
    // Else, get all the pings up to maximum of 2880 i.e. 60 days.
    let pings = await prisma.ping.findMany({
      where: {
        nodeId,
      },
      orderBy: {
        createdAt: 'desc', // Newest first.
      },
      take: MAX_RESULTS,
    });
    if (!pings) {
      results[i].push('No pings made');
      continue;
    }
    // Number of pings.
    let denom = pings.length;
    let numer = pings.reduce<number>(_reduce, 0);
    results[i].push([numer, denom].join('/'));
    // Uptime.
    let uptime = (numer / denom) * 100;
    results[i].push(uptime.toFixed(2) + '%');
  }

  return results;
}

/**
 * Displays the results in a table form.
 * @param matrix - The results from `calc`.
 */
function print(matrix: string[][]) {
  matrix.forEach((row) => {
    // Calculate the maximum widths.
    maxNode = row[C_NODE].length > maxNode ? row[C_NODE].length : maxNode;
    maxPing = row[C_PING].length > maxPing ? row[C_PING].length : maxPing;
    // maxTime cannot be wider than  '100.00%'.
  });

  _c('┌', true);
  _c('─', true, maxNode + 2);
  _c('┬', true);
  _c('─', true, maxPing + 2);
  _c('┬', true);
  _c('─', true, maxTime + 2);
  _c('┐');

  _c('│ ' + HEADERS[C_NODE].padEnd(maxNode, ' '), true);
  _c(' │ ' + HEADERS[C_PING].padStart(maxPing, ' '), true);
  _c(' │ ' + HEADERS[C_TIME].padStart(maxTime, ' '), true);
  _c(' │');

  _c('├', true);
  _c('─', true, maxNode + 2);
  _c('┼', true);
  _c('─', true, maxPing + 2);
  _c('┼', true);
  _c('─', true, maxTime + 2);
  _c('┤');

  for (let i = 0; i < matrix.length; i++) {
    _c('│ ' + matrix[i][C_NODE].padEnd(maxNode, ' '), true);
    _c(' │ ' + matrix[i][C_PING].padStart(maxPing, ' '), true);
    _c(' │ ' + matrix[i][C_TIME].padStart(maxTime, ' '), true);
    _c(' │');
  }

  _c('└', true);
  _c('─', true, maxNode + 2);
  _c('┴', true);
  _c('─', true, maxPing + 2);
  _c('┴', true);
  _c('─', true, maxTime + 2);
  _c('┘');
}

function _c(output: string, noNewline: boolean = false, repeat: number = 1) {
  let out = [];
  for (let i = 0; i < repeat; i++) {
    out.push(output);
  }
  if (noNewline) {
    process.stdout.write(out.join(''));
  } else {
    process.stdout.write(out.join('') + EOL);
  }
}

function _reduce(sum: number, item: Ping) {
  if (item.success) {
    return sum + 1;
  }
  return sum;
}
