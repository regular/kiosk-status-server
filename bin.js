#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const httpd = require('.')

if (!argv.port) {
  console.error('USAGE: status-server --port PORT --route-PATHNAME=COMMAND ...')
  process.exit(1)
}

const routes = {}
for(let key in argv) {
  if (key.startsWith('proxy-')) {
    let url = argv[key]
    let pathname = '/' + key.slice('proxy-'.length)
    routes[pathname] = {
      proxyURL: url
    }
  }
  if (key.startsWith('route-')) {
    let cmd = argv[key]
    let pathname = '/' + key.slice('route-'.length)
    routes[pathname] = {
      command: '/usr/bin/bash',
      args: ['-c', cmd + ' 2>&1']
    }
  }
}

httpd(argv.port, routes, err => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
})
