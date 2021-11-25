# Setup

This project stores the collected data in a PostgreSQL database.

Copy the file _.env.template_ into a new file _.env_.

Modify _.env_ with the credentials to the database.

## Requirements

This script requires the command `nc` to be available in the terminal.

## Installation

#### Step 1: Install the dependencies:

    npm install

#### Step 2: Create the database (if not already created):

    createdb -h localhost -U postgres seedmon

(Replace `postgres` with the user name, and `seedmon` with the name of the database to create. These values should be in sync with what you put in _.env_)

#### Step 3: Initialize the database tables:

    npx prisma migrate deploy

# Monitor

Run the monitor using

    npm run monitor

The monitor runs continuously until it is explicitly stopped. It pings the nodes every half an hour. The results are stored in the table "Ping".

# Statistics

Get the statistics using

    npm run stats -- -c col

This script reads the entries in the "Ping" table to generate the uptime percentage.

`col` specifies the mainnet while `bom` specifies the testnet.
