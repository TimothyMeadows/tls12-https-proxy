var https = require('https');
var tls = require('tls');
var querystring = require('querystring');
var url = require('url');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json'));
if (!config || !config.port) {
    console.log("No configuration file found! Please run 'configure' or 'configure.bat' first.");
    return;
}

var options = {
    pfx: fs.readFileSync('public-cert.pfx'),
    passphrase: config.passphrase,
    ciphers: 'ECDHE-RSA-AES256-SHA:AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
    honorCipherOrder: true
};

var terminate = function (res) {
    res.statusCode = 400;
    res.statusMessage = "Missing X-Host parameter request was terminated.";
    res.write("Missing X-Host parameter request was terminated.");
    res.end();
};

var rewrite = function (headers, host) {
    var headerString = "";
    for (var key in headers) {
        if (key === "x-host" || key === "X-Host" || key === "accept-encoding")
            continue;

        if (key === "accept")
            headers[key] = "text/html,application/xhtml+xml,application/xml;";

        if (key === "accept-language")
            headers[key] = "enUS,en;";

        if (host) {
            if (key === "host" || key === "Host")
                headers[key] = host;
        }

        headerString += `${key}: ${headers[key]}\r\n`;
    }

    return headerString;
};

var server = https.createServer(options, function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    var uri = url.parse(req.url);
    var query = querystring.parse(uri.query) || {};
    var host = req.headers["X-Host"] || req.headers["x-host"] || query["X-Host"] || query["x-host"];

    if (!host) {
        var referer = req.headers["referer"];
        if (referer) {
            var refererUri = url.parse(referer);
            var refererQuery = querystring.parse(refererUri.query) || {};

            host = refererQuery["X-Host"] || refererQuery["x-host"];
            if (!host) {
                terminate(res);
                return;
            }

            host = url.parse(`https://${host}`).hostname;
        } else {
            terminate(res);
            return;
        }
    }

    var socket = tls.connect(443, url.parse(`https://${host}`).hostname, () => {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
        var uri = url.parse(req.url);
        var query = querystring.parse(uri.query) || {};
        var host = req.headers["X-Host"] || req.headers["x-host"] || query["X-Host"] || query["x-host"];
        var host_uri = url.parse(`https://${host}`);

        if (req.method === "POST") {
            var body = "";
            req.on('data', function (data) {
                body += data;
            });

            req.on('end', function () {
                var payload = `${req.method} ${host_uri.path} HTTP/1.0\r\n${rewrite(req.headers, host_uri.hostname)}\r\n${body}\r\n\r\n`;
                //console.log(payload);
                socket.write(payload);
            });
        } else {
            var payload = `${req.method} ${host_uri.path} HTTP/1.0\r\n${rewrite(req.headers, host_uri.hostname)}\r\n\r\n`;
            //console.log(payload);
            socket.write(payload);
        }
        
        process.stdin.pipe(socket);
        process.stdin.resume();
    });

    socket.setEncoding('utf8');
    var response = "";
    socket.on('data', (data) => {
        response += data;
    });

    socket.on('end', () => {
        res.end();
    });

    // TODO: Fix this just a temp hack.
    setTimeout(function() {
        //console.log(response);
        var packet = response.split("\r\n\r\n");
        var headers = packet[0].split("\r\n");

        for (var i in headers) {
            var header = headers[i].split(": ");
            if (header[0].indexOf("HTTP/1.0") != -1)
                continue;

            res.setHeader(header[0], header[1]);
        }

        res.write(packet[1]);
        res.end();
        socket.destroy();
    }, 1000);
});

server.listen(config.port);
console.log(`$ ${config.port}`);