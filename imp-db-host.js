var impDB = require('imp-db');
var program = require('commander');

program
    .version('0.0.1')
    .option('-p, --port <integer>', 'Port for socket server', parseInt)
    .option('-H, --host <integer>', 'IP for socket server')
    .option('-f, --db-file <path>', 'JSON File of db. omit for in memory db')
    .parse(process.argv);

if (program.dbFile !== undefined) {
    // console.log('>> MODE: json file snaps');
    var db = new impDB(program.dbFile, false, 1000);
} else {
    // console.log('>> MODE: in memory');
    var db = new impDB();
}

var net = require('net'),
    JsonSocket = require('json-socket');

var server = net.createServer();
if (program.host !== undefined) {
    server.listen({
        host: program.host,
        port: program.port
    });
    console.log(`Listen on ${program.host}:${program.port}`);
} else {
    server.listen(program.port);
    console.log(`Listen on localhost:${program.port}`);
}
server.on('connection', function (socket) {
    tick();
    socket = new JsonSocket(socket);
    socket.on('message', function (obj) {
        var r = {};
        switch (obj._) {
            case "set":
                db.set(obj.key, obj.val);
                r._ = 'set';
                r.status = true;
                break;
            case "get":
                r.data = db.get(obj.key);
                r.length = r.data.length;
                r._ = 'get';
                break;
            case "setArrayPos":
                db.setArrayPos(obj.key, obj.pos, obj.val)
                r._ = 'set';
                r.status = true;
                break;
            case "getArrayPos":
                r.data = db.getArrayPos(obj.key, obj.pos);
                break;
            case "pushArray":
                db.pushArray(obj.key, obj.val);
                r._ = 'pushArray';
                r.status = true;
                break;
            case "cutArray":
                db.cutArray(obj.key);
                r._ = 'cutArray';
                r.status = true;
                break;
            case "spliceArray":
                db.spliceArray(obj.key, obj.pos);
                r._ = 'spliceArray';
                r.status = true;
                break;
            case "findArrayIndex":
                var index = db.findArrayIndex(obj.key, obj.val);
                r._ = "findArrayIndex";
                r.index = index;
                break;
            case "remove":
                db.remove(obj.key);
                r._ = 'remove';
                r.status = true;
                break;
            case "clear":
                db.clear();
                r._ = 'clear';
                r.status = true;
                break;
        }
        try {
            socket.sendEndMessage(r);
        } catch (err) {
            // if a socket closes before a write is complete, an error will be thrown here, handle it however you please
        }
    });
});