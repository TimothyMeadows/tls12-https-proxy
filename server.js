var https = require('https');
var querystring = require('querystring');
var httpProxy = require('http-proxy');
var url = require('url');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json'));
if (!config || !config.port) {
    console.log("No configuration file found! Please run 'configure' or 'configure.bat' first.");
    return;
}

var proxy = httpProxy.createProxyServer({
    autoRewrite: true,
    changeOrigin: true,
    ssl: {
        pfx: fs.readFileSync('public-cert.pfx'),
        passphrase: config.passphrase
    },
    secure: true
});

proxy.on('proxyReq', function (proxyReq, req, res, options) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||req.connection.socket.remoteAddress;
    var uri = url.parse(req.url);
    var query = querystring.parse(uri.query) || {};
    var host = req.headers["X-Host"] || req.headers["x-host"] || query["X-Host"] || query["x-host"];
    var domain = url.parse(`https://${host}`);
    
    proxyReq.removeHeader('X-Host');
    if (proxyReq.path.indexOf("?")) {
        if (query["x-host"] || query["X-Host"]) {
            if (query["x-host"])
                proxyReq.path = proxyReq.path.replace(`x-host=${query["x-host"]}`, "");
            else
                proxyReq.path = proxyReq.path.replace(`X-Host=${query["X-Host"]}`, "");         
        }
    }

    if (proxyReq.path.substr(proxyReq.path.length - 1, 1) === "?")
        proxyReq.path = proxyReq.path.substr(0, proxyReq.path.length - 2);
    
    console.log(`> [${ip}]:[${domain.hostname}] ${proxyReq.path}`);
});

var options = {
    pfx: fs.readFileSync('public-cert.pfx'),
    passphrase: config.passphrase,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
};

var server = https.createServer(options, function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||req.connection.socket.remoteAddress;
    var uri = url.parse(req.url);
    var query = querystring.parse(uri.query) || {};
    var host = req.headers["X-Host"] || req.headers["x-host"] || query["X-Host"] || query["x-host"];
    var domain = url.parse(`https://${host}`);

    console.log(`< [${ip}]:[${domain.hostname}] ${req.url}`);
    if (!host) {
        res.statusCode = 400;
        res.statusMessage = "Missing X-Host parameter request was terminated.";
        res.write("Missing X-Host parameter request was terminated.");
        res.end();
        return;
    }

    proxy.web(req, res, {
        target: `https://${host}/`,
        autoRewrite: true,
        changeOrigin: true,
        ssl: {
            ciphers: 'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
            honorCipherOrder: true
        }
    });
});

server.listen(config.port);
console.log(`$ ${config.port}`);