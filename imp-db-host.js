var impDB = require('imp-db');
var net = require('net');
var util = require('util');
var EventEmitter = require('events');
var JsonSocket = require('json-socket');
var __self;
var db;
class impHost extends EventEmitter {
    constructor() {
        super();
    }
    start(options) {
        if (options.port) {
            this.port = options.port
        }
        if (options.host) {
            this.host = options.host
        }
        if (options.file) {
            this.file = options.file
        }
        if (options.snapInterval) {
            this.snapInterval = options.snapInterval
        }
        if (this.snapInterval == undefined) {
            this.snapInterval = 1000
        }
        if (this.file !== undefined) {
            db = new impDB(this.file, false, this.snapInterval);
        } else {
            db = new impDB();
        }
        this.createHost();
    }
    createHost() {
        __self = this;
        this.server = net.createServer();
        if (this.host !== undefined) {
            this.server.listen({
                host: this.host,
                port: this.port
            });
        } else {
            this.server.listen(this.port);
        }
        this.server.on('connection', function (socket) {
            socket = new JsonSocket(socket);
            socket.on('message', function (obj) {
                this.emit('message', obj);
                var r = __self.parseMessage(obj)
            });
        });
        __self.emit('start');
    }
    parseMessage(obj) {
        var r = {};
        if (obj._ == undefined) {
            this.emit('error', {
                type: 'request',
                desc: 'the request header data type not set in message'
            });
            return false;
        }
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
            default:
                this.emit('error', {
                    type: 'request',
                    desc: 'the request data could not be parsed'
                })
        }
        return r;
    }
}

module.exports = impHost;