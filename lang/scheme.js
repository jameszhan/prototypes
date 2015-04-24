// λ演算规则
// <expression> := <name> | <function> | <application>
// <function> := λ<name>.<expression>
// <application> := <expression><expression>

// expression := <name> | <function> | <application>
// name := \w+
// function := (lambda (name) expression)
// application := (expression expression)

var toString = Object.prototype.toString,
    aps = Array.prototype.slice;
    reduce = Array.prototype.reduce,
    readMacros = {
        "'": 'quote',
        '`': 'syntax-quote',
        '~': 'unquote',
        '~@': 'unquote-splicing'
    };

function isArray(value) { return toString.call(value) === '[object Array]'; }

function doPreprocess(tokens, depth) {
    var token = tokens.shift(),
        elements,
        next;
    if (token === undefined) {
        return undefined;
    } else if (readMacros[token]) {
        return [readMacros[token], doPreprocess(tokens, depth + 1)]
    } else if (token === '(') {
        elements = [];
        next = doPreprocess(tokens, depth + 1);
        while(next === undefined  || next !== ')') {
            if (next === undefined ) {
                throw new SyntaxError("unclosed delimeter till end of file: " + token);
            } else {
                elements.push(next);
            }
            next = doPreprocess(tokens, depth + 1);
        }
        return elements;
    } else if (depth === 0 && token === ')') {
        throw new SyntaxError("unmatched closing delimeter: " + token + " does not close any open delimeter");
    } else {
        return token;
    }
}

function preprocess(tokens) {
    return doPreprocess(tokens, 0);
}

function parseLambda(node) {
    var params, paramNames, statements;
    if (node.length < 3) {
        throw new SyntaxError("syntax error in function definition" + node);
    }
    params = node[1];
    if (!isArray(params)) {
        throw new SyntaxError("incorrect format of parameters: " + params);
    }
    paramNames = params.map(function(param, _){
        if (isArray(param)) {
            throw new SyntaxError("illegal argument name : " + param);
        }
        return param;
    });

    statements = doParseList(aps.call(node, 2));
    return {type: 'lambda', params: paramNames, body: {type: 'block', statements: statements }};
}

function parseApply(node) {
    return {type: 'apply', func: doParse(node[0]), args: doParseList(aps.call(node, 1))};
}

function parseDef(node) {
    if (node.length != 3) {
        throw new SyntaxError("incorrect format of definition " + node);
    }
    return {type: 'def', pattern: doParse(node[1]), value: doParse(node[2])}
}

function parseIf(node) {
    if (node.length !== 4) {
        throw new SyntaxError("incorrect format of if" + node);
    }
    return {type: 'if', predicate: doParse(node[1]), conseq: doParse(node[2]), alter: doParse(node[3])};
}

function doParseList(nodes) {
    return nodes.map(function(node, _){ return doParse(node); });
}

function doParse(node) {
    var head;
    if (isArray(node)) {
        if (node.length == 0) {
            throw new SyntaxError("syntax error: " + node);
        } else {
            head = node[0];
            switch(head) {
                case 'def':
                    return parseDef(node);
                case 'if':
                    return parseIf(node);
                case 'lambda':
                    return parseLambda(node);
                default:
                    return parseApply(node);
            }
        }
    } else {
        return node;
    }
}

function parse(code) {
    var tokens = code.split('"').map(function (x, i) {
        if (i % 2 === 0) { // not in string
            return x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/'/g, " ' ").replace(/`/g, " ` ");
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function (x) {
        return x.replace(/#whitespace#/g, " ");
    });
    return doParse(preprocess(tokens));
}

//parse("'a");
//parse("(car '(1 2 3))");
//parse("(car '(1 `((1 2) 3) 5))");

function interpret(node, scope) {
    if (node.map && node.reduce && node.forEach) { // Array
        return node.map(function(e, _){
            return interpret(e, scope);
        });
    } else {
        switch (node.type) {
            case 'def':
                return scope.define(node.pattern, interpret(node.value, scope));
            case 'if':
                return interpret(node.predicate, scope) ? interpret(node.conseq, scope) : interpret(node.alter, scope);
            case 'block':
                return node.statements.map(function (statement, _) {
                    return interpret(statement, scope)
                }).slice(-1)[0];
            case 'apply':
                var closure = interpret(node.func, scope),
                    args = interpret(node.args, scope),
                    newScope;
                if (closure.type === 'closure') { // Lambda
                    newScope = closure.fn.params.reduce(function(ctx, param, i) {
                        ctx.define(param, args[i]);
                        return ctx;
                    }, closure.env.copy()); // scope.copy() static scope vs. dynamic scope
                    return interpret(closure.fn.body, newScope);
                } else { //BuiltIn Function
                    return closure.apply(scope, args);
                }
            case 'lambda':
                return {type: 'closure', fn: node, env: scope};
            default:
                if (node[0] === '"' && node.slice(-1) === '"') {
                    return node.slice(1, -1);
                } else if (!isNaN(parseFloat(node))) {
                    return parseFloat(node);
                } else {
                    if (scope.defined(node)) {
                        return scope.lookup(node);
                    } else {
                        //console.log(JSON.stringify(scope.trace()));
                        throw new EvalError("Unknown variable " + node);
                    }
                }
        }
    }
}


function Scope(parent){
    var env = {};
    return {
        trace: function(){
            return env;
        },
        defined: function(id) {
            return env.hasOwnProperty(id) || (parent && parent.defined(id));
        },
        lookup: function(id) {
            return env[id] || (parent && parent.lookup(id));
        },
        define: function(id, value) {
            env[id] = value;
            return value;
        },
        copy: function() {
            return Scope(this);
        }
    }
}

var env = Scope();
env.define('+', function(){
    return reduce.call(arguments, function(ret, o){
        return ret + o;
    }, 0);
});
env.define('-', function(){
    if (arguments.length > 0) {
        return reduce.call(arguments, function(ret, o){
            return ret - o;
        }, arguments[0] * 2);
    }
    return 0;
});

env.define('*', function(){
    return reduce.call(arguments, function(ret, o){
        return ret * o;
    }, 1);
});

env.define('/', function(){
    if (arguments.length > 0) {
        return reduce.call(arguments, function(ret, o){
            return ret - o;
        }, arguments[0] * arguments[0]);
    }
    return 0;
});

env.define('>', function(a, b){
    return a > b;
});

env.define('<=', function(a, b){
    return a <= b;
});

env.define('t', function(){
    return true;
});

env.define('println', function(){
    console.log.apply(this, arguments);
});

function eval(code) {
    return interpret(parse(code), env);
}

function log(code) {
    console.log(code, "-> ", JSON.stringify(eval(code)));
}


eval('(def x 100)');
eval('(def y 200)');

log('(((lambda (x) (lambda (y) (- y x))) 5) 20)');

eval('(def add (lambda (x) (lambda (y) (+ x y))))');
eval('(def add5 (add 5))');
log('(add5 10)');
log('(add5 30)');
