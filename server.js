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

var terminate = function (res, ip) {
    if (config.verbose && config.verbose === true)
        console.log(`[${now()}] ${ip} terminated`);

    res.statusCode = 400;
    res.statusMessage = "Missing X-Host parameter request was terminated.";
    res.write("Missing X-Host parameter request was terminated.");
    res.end();
};

var denied = function (res, ip) {
    if (config.verbose && config.verbose === true)
        console.log(`[${now()}] ${ip} access denied`);

    res.statusCode = 403;
    res.statusMessage = "Access denied.";
    res.write("Access denied.");
    res.end();
};

var rewrite = function (headers, host) {
    var headerString = "";
    for (var key in headers) {
        if (key === "x-host" || key === "X-Host")
            continue;

        if (key === "x-key" || key === "X-Key")
            continue;

        // TODO: Remove when gzip is supported
        if (key === "Accept" || key === "accept")
            headers[key] = "text/html,application/xhtml+xml,application/xml,application/json;";

        // TODO: Remove when gzip is supported
        if (key === "Accept-Encoding" || key === "accept-encoding")
            continue;

        if (host) {
            if (key === "host" || key === "Host")
                headers[key] = host;
        }

        headerString += `${key}: ${headers[key]}\r\n`;
    }

    return headerString;
};

var now = function () {
    var date = new Date();
    return `${(((date.getMonth() +1) < 10) ? "0" : "") + (date.getMonth() +1)}/${((date.getDate() < 10) ? "0" : "") + date.getDate()}/${date.getFullYear()} ${(date.getHours() < 10 ? "0" : "") + date.getHours()}:${((date.getMinutes() < 10) ? "0" : "") + date.getMinutes()}:${((date.getSeconds() < 10) ? "0" : "") + date.getSeconds()}`;
}

var server = https.createServer(options, function (req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    var uri = url.parse(req.url);
    var query = querystring.parse(uri.query) || {};
    var host = req.headers["X-Host"] || req.headers["x-host"] || query["X-Host"] || query["x-host"];
    var key = req.headers["X-Key"] || req.headers["x-key"] || query["X-Key"] || query["x-key"];

    if (!key) {
        denied(res, ip);
        return;
    }

    if (config.keys.indexOf(key) === -1) {
        denied(res, ip);
        return;
    }

    if (!host) {
        var referer = req.headers["referer"];
        if (referer) {
            var refererUri = url.parse(referer);
            var refererQuery = querystring.parse(refererUri.query) || {};

            host = refererQuery["X-Host"] || refererQuery["x-host"];
            if (!host) {
                terminate(res, ip);
                return;
            }

            host = url.parse(`https://${host}`).hostname;
        } else {
            terminate(res, ip);
            return;
        }
    }

    if (config.verbose && config.verbose === true)
        console.log(`[${now()}] ${ip} -> ${host}`);

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
                socket.write(payload);
            });
        } else {
            var payload = `${req.method} ${host_uri.path} HTTP/1.0\r\n${rewrite(req.headers, host_uri.hostname)}\r\n\r\n`;
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
        socket.destroy();
    });

    setTimeout(function () {
        if (config.verbose && config.verbose === true)
            console.log(`[${now()}] ${ip} <- ${host}`);

        var packet = response.split("\r\n\r\n");
        var headers = packet[0].split("\r\n");

        for (var i in headers) {
            var header = headers[i].split(": ");
            if (header[0].indexOf("HTTP/1.0") != -1 || header[0].indexOf("HTTP/1.1") != -1)
                continue;

            res.setHeader(header[0], header[1]);
        }

        res.write(packet[1]);
        res.end();
        socket.destroy();
    }, 1000 + Math.floor((Math.random() * 1000) + 1));
});

server.listen(config.port);
console.log(`$ ${config.port}`);