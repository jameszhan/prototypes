var Observable = require('./observer2');

function Events() {
    this.__events = {};
}

Events.prototype.on = function(event, callback) {
    var observable;
    if (!callback) return this;

    observable = this.__events[event] || (this.__events[event] = new Observable());
    observable.add(callback);
    return this
};

Events.prototype.off = function(event, callback) {
    var observer;
    if (!callback) return this;

    observer = this.__events[event];
    if (!observer) return this;

    observer.remove(callback);

    return this
};


Events.prototype.trigger = function(event) {
    var aps = Array.prototype.slice,
        args = aps.call( arguments, 1),
        observer;

    observer = this.__events[event];
    if (!observer) return false;

    observer.notify(args);
    return true;
};


if (require && require['main'] === module) {
    var subject = new Events(),
        f1 = function (msg) {
            console.log("Hello %s!", msg);
        },
        f2 = function (msg) {
            console.log("World %s!", msg);
        };

    subject.on('click', function () {
        console.log(this, arguments);
    });

    subject.on("foo", f1);
    subject.on("bar", f2);

    subject.trigger('click', "Go...");
    subject.trigger('foo', "Go...");
    subject.trigger('bar', "Go...");

    subject.off('foo', f1);

    subject.trigger('click', "Go...");
    subject.trigger('foo', "Go...");
    subject.trigger('bar', "Go...");
}

