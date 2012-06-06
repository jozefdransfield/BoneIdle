var b_ = require("./../../lib/boneidle");
var fs = require("fs");
var http = require("http");
var url = require("url");

var FILE = "./test/sequence/sample.txt";

var server;
module.exports = {
    "setUp": function(callback) {
        server = http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Hello World\n');
        }).listen(1337, '127.0.0.1', callback);
    },
    "tearDown": function(callback) {
        server.close();
        callback();
    },
    "Read File Then Map":function (test) {
        b_.stream(fs.ReadStream(FILE, {encoding:"utf8"})).map(addNewLine).realise(function (data) {
            test.same(data, ["Sample File Data\n"]);
            test.done();
        })
    },
    "Read File then Filter":function (test) {
        b_.stream(fs.ReadStream(FILE, {encoding:"utf8"})).filter(allways).realise(function (data) {
            test.same(data, ["Sample File Data"]);
            test.done();
        })
    },
    "Read File Stream returns contents":function (test) {
        b_.stream(fs.ReadStream(FILE, {encoding:"utf8"})).realise(function (data) {
            test.same(data, ["Sample File Data"]);
            test.done();
        });
    },
    "Read Invalid File Stream returns error":function (test) {
        b_.stream(fs.ReadStream("./test/badfilename", {encoding:"utf8"})).realise(function (data) {
            test.ok(data[0] instanceof Error);
            test.done();
        });
    },
    "Read URL Stream returns contents":function (test) {
        var req = http.request(url.parse("http://127.0.0.1:1337"), function (res) {
            res.setEncoding('utf8');
            b_.stream(res).realise(function (data) {
                test.ok(data);
                test.done();
            });
        });
        req.end();
    }
}

function addNewLine(s) {
    return s += "\n";
}
function allways() {
    return true;
}