var aps = Array.prototype.slice,
    reduce = Array.prototype.reduce,
    some = Array.prototype.some,
    openDelimeters = ['(', '[', '{'],
    closeDelimeters = [')', ']', '}'],
    delimeters = openDelimeters.concat(closeDelimeters),
    delimeterMap = {},
    i;
for (i = 0; i < openDelimeters.length && i < closeDelimeters.length; i++) {
    delimeterMap[openDelimeters[i]] = closeDelimeters[i];
}


function Scope(parent){
    var env = {};
    return {
        trace: function(){
            return env;
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


function isOpen(token) {
    return token && token.type === 'delimeter' && openDelimeters.indexOf(token.value) >= 0;
}

function isClose(token) {
    return token && token.type === 'delimeter' && closeDelimeters.indexOf(delimeter.value) >= 0;
}

function isMatch(open, close) {
    return open && close && open.type === 'delimeter' && close.type === 'delimeter' && delimeterMap[open.value] === close.value;
}

function symbol(input){
    var type = 'literal', value = input;
    if (delimeters.indexOf(input) >= 0) {
        type = 'delimeter';
    } else if (!isNaN(parseFloat(input))) {
        type = 'number';
        value = parseFloat(input);
    } else if (input[0] === '"' && input.slice(-1) === '"') {
        type = 'string';
        value = input.slice(1, -1);
    } else {
        type = 'id';
    }
    return { type: type, value: value }
}

function tuple(elements, open, close) {
    return {type: 'tuple', elements: elements, open: open, close: close};
}

function node(value, elements) {
    return {value: value, elements: elements};
}

function doPreprocess(tokens, depth) {
    var token = tokens.shift(),
        elements,
        next;
    if (token === undefined) {
        return undefined;
    } else if (isOpen(token)) {
        elements = [];
        next = doPreprocess(tokens, depth + 1);
        while(next === undefined  || !isMatch(token, next)) {
            if (next === undefined ) {
                throw new SyntaxError("unclosed delimeter till end of file: " + token);
            } else if (isClose(next)) {
                throw new SyntaxError("unmatched closing delimeter: " + next + " does not close " + token);
            } else {
                elements.push(next);
            }
            next = doPreprocess(tokens, depth + 1);
        }
        return tuple(elements, token, next);
    } else if (depth === 0 && isClose(token)) {
        throw new SyntaxError("unmatched closing delimeter: " + token + " does not close any open delimeter");
    } else {
        return token;
    }
}

function preprocess(tokens) {
    return doPreprocess(tokens, 0);
}

function parseBlock(tuple){
    return {type: 'block', statements: doParseList(aps.call(tuple.elements, 1))}
}

function parseApply(tuple) {
    return {type: 'apply', func: doParse(tuple.elements[0]), args: doParseList(aps.call(tuple.elements, 1))};
}

function parseIf(tuple) {
    var elements = tuple.elements;
    if (elements.length !== 4) {
        throw new SyntaxError("incorrect format of if" + tuple);
    }
    return {type: 'if', predicate: doParse(elements[1]), conseq: doParse(elements[2]), alter: doParse(elements[3])};
}

function parseCond(tuple) {
    var elements = tuple.elements;
    if (elements.length < 2) {
        throw new SyntaxError("incorrect format of definition " + tuple);
    }
    return {type: 'cond', clauses: reduce.call(aps.call(elements, 1), function(ctx, el, i){
        if (el.elements.length !== 2) {
            throw new SyntaxError("incorrect format of definition " + el);
        }
        ctx.push({predicate: doParse(el.elements[0]), conseq: doParse(el.elements[1])});
        return ctx;
    }, [])};
}

function parseDef(tuple) {
    var elements = tuple.elements;
    if (elements.length != 3) {
        throw new SyntaxError("incorrect format of definition " + tuple);
    }
    return {type: 'def', pattern: doParse(elements[1]), value: doParse(elements[2])}
}


function parseAssign(tuple) {
    var elements = tuple.elements;
    if (elements.length != 3) {
        throw new SyntaxError("incorrect format of definition", tuple);
    }
    return {type: 'assign', pattern: doParse(elements[1]), value: doParse(elements[2])};
}

function parseLambda(tuple) {
    var elements = tuple.elements, params, paramNames, statements;
    if (elements.length < 3) {
        throw new SyntaxError("syntax error in function definition", tuple);
    }
    params = elements[1];
    if (params.type !== 'tuple') {
        throw new SyntaxError("incorrect format of parameters: " + params);
    }
    paramNames = params.elements.map(function(param, _){
        if (param.type !== 'id') {
            throw new SyntaxError("illegal argument name : " + param);
        }
        return param.value;
    });

    statements = doParseList(aps.call(elements, 2));
    return {type: 'lambda', params: paramNames, body: {type: 'block', statements: statements }};
}


function doParseList(nodes) {
    return nodes.map(function(node, _){ return doParse(node); });
}


//Quote
//Atom
//Eq
//Car
//Cdr
//Cons
//Cond
function doParse(tuple) {
    var head, elements;
    if (tuple.type !== 'tuple') {
        return tuple;
    } else {
        elements = tuple.elements;
        if (tuple.open.value === '[') {
            return parseVector(tuple);
        } else if (tuple.open.value === '(') {
            if (elements.length == 0) {
                throw new SyntaxError("syntax error: " + tuple);
            } else {
                head = elements[0];
                switch (head.value) {
                    case 'seq':
                        return parseBlock(tuple);
                    case 'def':
                        return parseDef(tuple);
                    case 'set!':
                        return parseAssign(tuple);
                    case 'cond':
                        return parseCond(tuple);
                    case 'if':
                        return parseIf(tuple);
                    case 'lambda':
                        return parseLambda(tuple);
                    default:
                        return parseApply(tuple);
                }
            }
        } else {
            console.warn("Unsupported: ", tuple);
        }
    }
}

function parse(code) {
    var tokens = code.split('"').map(function (x, i) {
        if (i % 2 === 0) { // not in string
            return x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ');
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function (x) {
        return x.replace(/#whitespace#/g, " ");
    }).map(function (token, _) {
        return symbol(token);
    }), elements = [{type: 'keyword', value: 'seq'}], node, root;
    while(node = preprocess(tokens, 0)) {
        elements.push(node);
    }

    root = tuple(elements, {type: 'delimeter', value: '('}, {type: 'delimeter', value: ')'});
    return doParse(root);
}

function interpret(node, scope) {
    var ret;
    if (node.map && node.reduce && node.forEach) {// Array
        return node.map(function(e, _){
            return interpret(e, scope);
        });
    } else {
        switch (node.type) {
            case 'def':
                return scope.define(node.pattern.value, interpret(node.value, scope));
            case 'block':
                return node.statements.map(function (statement, _) {
                    return interpret(statement, scope)
                }).slice(-1)[0];
            case 'apply':
                var fn = interpret(node.func, scope),
                    args = interpret(node.args, scope),
                    newScope = fn.env ? fn.env.copy() : scope.copy(), // static scope vs. dynamic scope
                    params,
                    body;
                if (fn.type === 'closure') {
                    params = fn.fn.params;
                    body = fn.fn.body;
                    newScope = params.reduce(function(ctx, param, i) {
                        ctx.define(param, args[i]);
                        return ctx;
                    }, newScope);
                    return interpret(body, newScope);
                } else {
                    return fn.apply(scope, args);
                }
            case 'lambda':
                return {type: 'closure', fn: node, env: scope};
            case 'if':
                return interpret(node.predicate, scope) ? interpret(node.conseq, scope) : interpret(node.alter, scope);
            case 'cond':
                ret = undefined;
                some.call(node.clauses, function(clause){
                    var predicate = interpret(clause.predicate, scope);
                    if (predicate) {
                        ret = interpret(clause.conseq, scope);
                        return true;
                    }
                });
                return ret;
            case 'number':
                return parseFloat(node.value);
            case 'string':
                return node.value;
            case 'id':
                return scope.lookup(node.value);
            default:
                throw new EvalError("Not know " + JSON.stringify(node));
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

env.define('>', function(a, b){
    return a > b;
});

env.define('<', function(a, b){
    return a < b;
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


var val = eval("(((lambda (x) (lambda (y) (- x y))) 5) 2)");
console.log(val);

eval('(if (> 2 1) (println "2 > 1") (println "2 <= 1"))');
eval('(def x 80)');
eval('(cond ((< x 0) (println "< 0")) ((< x 100) (println "< 50")) ((< 100) (println "< 100")) (t (println "Unknown")))');

console.log("x = ", eval('x'));

// A Example of dynamic scope vs lexical scope
eval('(def sub5 ((lambda (x) (lambda (y) (- y x))) 5))');
console.log("x = ", eval('x'));
console.log(eval('(sub5 100)'));  //80 or 95?

