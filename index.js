var https = require('https');
var httpProxy = require('http-proxy');
var fs = require('fs');

var proxy = httpProxy.createProxyServer({
    autoRewrite: true,
    changeOrigin: true,
    ssl: {
        pfx: fs.readFileSync('public-cert.pfx'),
        passphrase: "59351!"
    },
    secure: true
});

proxy.on('proxyReq', function (proxyReq, req, res, options) {
    proxyReq.removeHeader('X-Host');
});

var options = {
    pfx: fs.readFileSync('public-cert.pfx'),
    passphrase: "59351!",
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
};

var server = https.createServer(options, function (req, res) {
    var host = req.headers["X-Host"];
    if (!host) {
        res.statusCode = 400;
        res.statusMessage = "Missing X-Host header request was terminated.";
        res.write("Missing X-Host header request was terminated.");
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

server.listen(3232);