function equals(u1, u2) {
    var key;
    for (key in u1) {
        if (u1.hasOwnProperty(key) &&(!u2.hasOwnProperty(key) || u1[key] !== u2[key])) {
            return false;
        }
    }
    for (key in u2) {
        if (u2.hasOwnProperty(key) &&(!u1.hasOwnProperty(key) || u1[key] !== u2[key])) {
            return false;
        }
    }
    return true;
}


function doApply(v1, v2, op) {
    var n1 = v1[0], u1 = v1[1], n2 = v2[0], u2 = v2[1];
    if (equals(u1, u2)) {
        return [op.call(null, n1, n2), u1];
    } else {
        throw new SyntaxError("Adding incompatible units");
    }
}

function add(v1, v2) {
    return doApply(v1, v2, function(n1, n2){
        return n1 + n2;
    });
}

function sub(v1, v2) {
    return doApply(v1, v2, function(n1, n2){
        return n1 - n2;
    });
}

function copy(o2) {
    var key, o = {};
    for (key in o2) {
        if (o2.hasOwnProperty(key)) {
            o[key] = o2[key];
        }
    }
    return o;
}

function canonize(u) {
    var key;
    for (key in u) {
        if (u.hasOwnProperty(key) && !u[key]) {
            delete u[key];
        }
    }
    return u;
}

function mulUnits(u1, u2) {
    var u = copy(u1), key;
    for (key in u2) {
        if (u.hasOwnProperty(key) && u2.hasOwnProperty(key)) {
            u[key] = u[key] + u2[key];
        } else {
            u[key] = u2[key]
        }
    }
    return canonize(u);
}


function divUnits(u1, u2) {
    var u = copy(u1), key;
    for (key in u2) {
        if (u.hasOwnProperty(key) && u2.hasOwnProperty(key)) {
            u[key] = u[key] - u2[key];
        } else {
            u[key] = -u2[key]
        }
    }
    return canonize(u);
}


function mul(v1, v2) {
    var n1 = v1[0], u1 = v1[1], n2 = v2[0], u2 = v2[1];
    return [n1 * n2, mulUnits(u1, u2)];
}

function div(v1, v2) {
    var n1 = v1[0], u1 = v1[1], n2 = v2[0], u2 = v2[1];
    return [n1 / n2, divUnits(u1, u2)];
}

function pow(v1, v2) {
    var n1 = v1[0], u1 = v1[1], n2 = v2[0], u2 = v2[1];
    if (!equals(u2, {})) {
        throw SyntaxError("Exponent must be a unit-less value");
    } else {
        return [Math.pow(n1, n2), powUnits(u1, n2)];
    }
}

function powUnits(u2, n) {
    var key, u = copy(u2);
    for (key in u2) {
        if (u2.hasOwnProperty(key)) {
            u[key] = u2[key] * n;
        }
    }
    return canonize(u);
}

function eval(e) {
    if (typeof(e) === typeof(1)) {
        return [e, {}];
    } else if (typeof(e) === typeof('m')) {
        var cfg = {};
        cfg[e] = 1;
        return [1, cfg]
    } else if (typeof(e) === typeof([])) {
        switch (e[0]) {
            case '+': return add(eval(e[1]), eval(e[2]));
            case '-': return sub(eval(e[1]), eval(e[2]));
            case '*': return mul(eval(e[1]), eval(e[2]));
            case '/': return div(eval(e[1]), eval(e[2]));
            case '^': return pow(eval(e[1]), eval(e[2]));
        }
    }
}

function runTests(tests) {
    tests.forEach(function(e) {
        console.log(e, " -> ", eval(e));
    })
}

console.log('m' === 'm')

runTests([
    'm',
    ['+', 'm', 'm'],
    ['*', 'm', 's'],
    ['*', 'm', 'm'],
    ['/', 'm', 's'],
    ['^', ['*', 2, 'm'], 2],
    ['/', ['*', 1, 'm'], ['^', 's', 1]]
]);
