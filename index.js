var https = require('https');
var querystring = require('querystring');
var httpProxy = require('http-proxy');
var fs = require('fs');

var config = fs.readFileSync('config.json');
if (!config) {
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
    proxyReq.removeHeader('X-Host');
});

var options = {
    pfx: fs.readFileSync('public-cert.pfx'),
    passphrase: config.passphrase,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
};

var server = https.createServer(options, function (req, res) {
    var query = querystring.parse(req.url);
    var host = req.headers["X-Host"] || query["X-Host"];
    if (!host) {
        res.statusCode = 400;
        res.statusMessage = "Missing X-Host parameter request was terminated.";
        res.write("Missing X-Host parameter request was terminated.");
        res.end();
        return;
    }

    // TODO: should prob strip the x-host querystring key/value pair so it's not passed to the origin server
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