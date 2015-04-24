// Lambda Calculus？
//
// 现在让我们过渡到一种更强大的语言：lambda calculus。它虽然名字看起来很吓人，但是其实非常简单。它的三个元素分别是是：变量，函数，调用。用传统的表达法，它们看起来就是：
// 变量：x
// 函数：λx.t
// 调用：t1 t2
//
// 每个程序语言里面都有这三个元素，只不过具体的语法不同，所以你其实每天都在使用 lambda calculus。用 Scheme 作为例子，这三个元素看起来就像：
// 变量：x
// 函数：(lambda (x) e)
// 调用：(e1 e2)

var toString = Object.prototype.toString,
    aps = Array.prototype.slice;
    reduce = Array.prototype.reduce;

function isArray(value) { return toString.call(value) === '[object Array]'; }

function doPreprocess(tokens, depth) {
    var token = tokens.shift(),
        elements,
        next;
    if (token === undefined) {
        return undefined;
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
            return x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ');
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function (x) {
        return x.replace(/#whitespace#/g, " ");
    });
    return doParse(preprocess(tokens));
}

function interpret(node, scope) {
    if (node.map && node.reduce && node.forEach) { // Array
        return node.map(function(e, _){
            return interpret(e, scope);
        });
    } else {
        switch (node.type) {
            case 'def':
                return scope.define(node.pattern, interpret(node.value, scope));
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
                if (node[0] === '"' && node.slice(-1) === '"') { //string
                    return node.slice(1, -1);
                } else {
                    if (scope.defined(node)) {
                        return scope.lookup(node);
                    } else {
                        throw new EvalError("Unknown variable " + JSON.stringify(node));
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
env.define('inc', function(v){
    return v ? v + 1 : 1;
});
env.define('println', function(){
    console.log.apply(this, arguments);
});

function eval(code) {
    return interpret(parse(code), env);
}
//(defn zero [f] (fn [x] x))

eval('(def 0 (lambda (f) (lambda (x) x)))');
eval('(def succ (lambda (n) (lambda (f) (lambda (x) (f ((n f) x))))))');
eval('(def 1 (succ 0))');
eval('(def 2 (succ 1))');
eval('(def 3 (succ 2))');
eval('(def 4 (succ 3))');
eval('(def 5 (succ 4))');
eval('(def 6 (succ 5))');
eval('(def 7 (succ 6))');
eval('(def 8 (succ 7))');
eval('(def 9 (succ 8))');
eval('(def + (lambda (m) (lambda (n) (lambda (f) (lambda (x) ((m f) ((n f) x)))))))');
eval('(def * (lambda (m) (lambda (n) (lambda (f) (n (m f))))))');
eval('(def ** (lambda (a) (lambda (n) (n a))))'); // exp

eval('(def church->int (lambda (n) ((n (lambda (x) (inc x))) "")))');

function log(code) {
    console.log(code, "-> ", JSON.stringify(eval(code)));
}

// do 3 times println
eval('((3 (lambda (x) (println "Hello World"))))');

log('(church->int 0)');
log('(church->int 1)');
log('(church->int 8)');

log('(church->int ((+ 1) 2))');
log('(church->int ((* 2) 3))');
log('(church->int ((** 2) 3))');

// 类型及不变式
//    TRUE := λx.λy.x
//    FALSE := λx.λy.y
//
//    AND := λp q.p q FALSE
//    OR := λp q.p TRUE q
//    NOT := λp.p FALSE TRUE
//    IFTHENELSE := λp x y.p x y


eval('(def true (lambda (x) (lambda (y) x)))');
eval('(def false (lambda (x) (lambda (y) y)))');
eval('(def and (lambda (p) (lambda (q) ((p q) false))))');
eval('(def or (lambda (p) (lambda (q) ((p true) q))))');
eval('(def not (lambda (p) ((p false) true)))))');
eval('(def if (lambda (p) (lambda (x) (lambda (y) ((p x) y)))))');

env.define('assert-equals', function(n1, n2){
    if (n1 !== n2) {
        throw new EvalError(n1 + " must equals " + n2 + "!");
    } else {
        return true;
    }
});

log('(assert-equals ((and true) true) true)');
log('(assert-equals ((and true) false) false)');
log('(assert-equals ((and false) true) false)');
log('(assert-equals ((and false) false) false)');

log('(assert-equals ((or true) true) true)');
log('(assert-equals ((or true) false) true)');
log('(assert-equals ((or false) true) true)');
log('(assert-equals ((or false) false) false)');

log('(assert-equals (not false) true)');
log('(assert-equals (not true) false)');

log('(assert-equals (((if true) 3) 5) 3)');
log('(assert-equals (((if false) 3) 5) 5)');

//    CONS := λx y.λp.IF p x y
//    CAR := λx.x TRUE
//    CDR := λx.x FALSE
eval('(def cons (lambda (x y) (lambda (p) (((if p) x) y)))))');
eval('(def car (lambda (cons) (cons true)))');
eval('(def cdr (lambda (cons) (cons false)))');

eval('(def c (cons 1 (cons 2 (cons 3 (cons 4 (cons 5 0))))))');

log('(assert-equals (car c) 1)');
log('(assert-equals (car (cdr c)) 2)');
log('(assert-equals (car (cdr (cdr c))) 3)');




