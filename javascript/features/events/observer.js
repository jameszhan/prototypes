
function Observable(){
    var observers = [];
    return {
        add: function(observer) {
            observers.push(observer);
            return this;
        },
        remove: function(observer) {
            var pos = observers.indexOf(observer);
            if (pos >= 0) {
                observers.splice(pos, 1);
            }
            return this;
        },
        notify: function() {
            var _this = this,
                _args = arguments;
            observers.forEach(function(observer, i){
                observer.apply(_this, _args);
            });
            return this;
        }
    }
}

module.exports = Observable;

if (require && require['main'] === module) {
    var subject = Observable();
    subject.add(function () {
        console.log(this, arguments);
    });

    var f1 = function (msg) {
            console.log("Hello %s!", msg);
        },
        f2 = function (msg) {
            console.log("World %s!", msg);
        };

    subject.add(f1);
    subject.add(f2);

    subject.notify("Go...");

    subject.remove(f1);

    subject.notify("Hi...");
}




