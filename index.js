const http = require('http')
const httpProxy = require('http-proxy')
const url = require('url')
const {spawn} = require('child_process')

module.exports = function(port, routes, cb) {
  const server = http.createServer(requestHandler)
  const proxy = httpProxy.createProxyServer({})

  server.listen(port, err => {
    if (err) return cb(err)
    console.log('Listening on', port)
    cb(err, server)
  })

  function requestHandler(req, res) {
    if (req.method !== "GET") {
      res.statusCode = 405 // method not allowed
      return res.end('Invalid method')
    }
    const u = url.parse('http://makeurlparseright.com' + req.url)
    
    const route = routes[u.pathname]
    
    if (!route) {
      console.log('Page not found:' + req.url)
      res.statusCode = 404
      return res.end()
    }
    
    const {proxyURL, command, args, options} = route
    if (proxyURL) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      return proxy.web(req, res, {target: proxyURL, ignorePath: true})
    }
    
    console.log('Running:', command, args)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Access-Control-Allow-Origin', '*')
    const p = spawn(command, args, options || {})
    p.stdout.pipe(res, {end: false})
    let exited = false
    p.on('error', err => {
      if (exited) return
      exited = true
      console.error(err.message)
      res.statusCode = 503
      res.end(err.message)
    })
    p.on('close', code => {
      console.log('exit code', code)
      if (exited) return
      exited = true
      res.statusCode = 200
      res.end()
    })
  }
}
