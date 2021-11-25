# Setup

This project stores the collected data in a PostgreSQL database.

Copy the file _.env.template_ into a new file _.env_.

Modify _.env_ with the credentials to the database.

# Monitor

Run the monitor using `npm run monitor`

The monitor runs continuously until it is explicitly stopped. It pings the nodes every half an hour. The results are stored in the table "Ping".

# Statistics

Get the statistics using `npm run stats`.

This script reads the entries in the "Ping" table to generate the uptime percentage.
