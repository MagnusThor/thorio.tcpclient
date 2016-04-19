var ThorIOClient = ThorIOClient || {};

ThorIOClient.TcpClient = (function (net) {
    var Message = (function () {
        function message(topic, object, controller) {
            this.T = topic;
            this.D = object;
            this.C = controller;
            this.JSON = {
                T: topic,
                D: JSON.stringify(object),
                C: controller
            };
        };
        message.prototype.toString = function () {
            return JSON.stringify(this.JSON);
        };
        message.prototype.toBytes = function () {
            var data = this.toString();
            var buf = new Buffer(data.length + 2);
            buf[0] = 0x00;
            buf.write(data, 1);
            buf[data.length + 1] = 0xff;
            return buf;
        };
        return message;
    })();

    var client = function (host, port, controller) {
        var self = this; 
        var getListener = function (topic) {
            var listener = self.listeners.find(function (pre) {
                return pre.topic === topic;
            });
            return listener;
        };
        var dispatch = function (topic, data) {
            var listener = getListener(topic);
            if (!listener) return;
            listener.fn.apply(self, [data, topic]);
        };
        var send = function (data) {
            var bytes = data.toBytes();
            self.socket.write(bytes);
        };
       
        this.controller = controller;
        this.listeners = [];
        this.socket = new net.Socket();
        this.socket.on('error', function (err) {
            self.onclose.apply(self, [err]);        
        });
        this.socket.on("end", function (event) {
            self.onclose.apply(self, [event]);
        });
        this.socket.on("data", function (bytes) {
            var raw = bytes.slice(bytes.indexOf(0x00) + 1, bytes.indexOf(0xff));
            var message = JSON.parse(raw.toString());
            if (message.T === "$open_") {
                self.onopen.apply(self, [message.D]);
            } else {
                dispatch(message.T, message.D);
            }
        });
        this.connect = function (timeout) {
            var t = setTimeout(function (){
                send(new Message("$open_", {}, self.controller));
                clearTimeout(t); 
            }, timeout || 1000)
        };
        this.close = function () {
            self.socket.destroy();
        };
        this.onopen = function () {
        };
        this.onclose = function () {
        };
        this.on = function (topic, fn) {
            this.listeners.push({
                topic: topic, fn: fn
            });
        };
        this.off = function (topic) {
            var index = this.listeners.findIndex(function (pre) {
                return pre.topic === topic;
            });
            if (index < 0) return;
            this.listeners.splice(index, 1);
        };
        this.setProperty = function (name, value) {
            var property = "$set_" + name;
            var data;
            this.invoke(property, value);
            return this;
        };
        this.invoke = function (topic, data){
            var message = new Message(topic, data, this.controller);
            send(message);
        }
        self.socket.connect(port, host, function () {
        });
    };
    return client;
})(require('net'));

module.exports = ThorIOClient;