
function Observable(){
    this.observers = [];
}

Observable.prototype.add = function(observer) {
    this.observers.push(observer);
    return this;
};

Observable.prototype.remove = function(observer) {
    var pos = this.observers.indexOf(observer);
    if (pos >= 0) {
        this.observers.splice(pos, 1);
    }
    return this;
};

Observable.prototype.notify = function() {
    var _this = this,
        _args = arguments;
    this.observers.forEach(function(observer, i){
        observer.apply(_this, _args);
    });
    return this;
};

module.exports = Observable;

if (require && require['main'] === module) {

    var subject = new Observable();
    subject.add(function(message){
        console.log(this, arguments);
    });

    var f1 = function(msg){ console.log("Hello World!", msg); },
        f2 = function(msg){ console.log("World Hello!", msg); };

    subject.add(f1);
    subject.add(f2);

    subject.notify("Go...");

    subject.remove(f1);

    subject.notify("Hi...");
}







