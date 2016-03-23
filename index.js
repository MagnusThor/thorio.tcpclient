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
        return message;
    })();
    var ctor = function (host, port,controller) {
        var self = this;
        
        this.controller = controller;
        this.listeners = [];

        this.socket = new net.Socket();
        this.socket.on('error', function (err) {
            self.onclose.apply(self, [err]);        
        });
        
        this.socket.on("end", function (event) {
            self.onclose.apply(self, [event]);
        });

        var dispatch = function (topic, data) {
            var listener = self.listeners.find(function (pre) {
                return pre.topic === topic;
            });
            if (!listener) return;
            listener.fn.apply(self, [data, topic]);
        };
        
        function send(data) {
            self.socket.write(data.toString());
        };

        var ondata = function (data) {
            var message = JSON.parse(data.toString());
            if (message.T === "$open_") {
                self.onopen.apply(self, [message.D]);
            } else {
                dispatch(message.T, message.D);
            }
        };
        this.connect = function () {
            self.socket.connect(port, host, function () {
                self.socket.on('data', ondata);
                send(new Message("$open_",{},self.controller));
            });
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
    };
    return ctor;
})(require('net'));

module.exports = ThorIOClient;