var finalhandler = require("finalhandler");
var http = require("http");
var serveIndex = require("serve-index");
var serveStatic = require("serve-static");

// Serve directory indexes for public/ftp folder (with icons)
var index = serveIndex(__dirname, {icons: true});

// Serve up public/ftp folder files
var serve = serveStatic(__dirname);

// Create server
var server = http.createServer(function onRequest(req, res) {
    var done = finalhandler(req, res);
    serve(req, res, function onNext(err) {
        if (err) return done(err);
        index(req, res, done);
    });
});

var port = parseInt(process.argv[2]) || 8080;
console.log("Listening on port " + port);

// Listen
server.listen(port);
