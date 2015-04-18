function clone(obj) {
    var copy;
    if (null == obj || "object" != typeof obj) return obj;
    copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function Func(params, body, scope){
    return {
        params: params,
        body: body,
        scope: scope
    };
}

function eval(node, scope) {
    if (node.map) {// Array
        return node.map(function(e, _){
            return eval(e, scope);
        });
    } else {
        switch (node.fn) {
            case 'number':
                return node.args[0];
            case 'id':
                return scope.lookup(node.args[0]);
            case '+':
                return eval(node.args[0], scope) + eval(node.args[1], scope);
            case '-':
                return eval(node.args[0], scope) - eval(node.args[1], scope);
            case '*':
                return eval(node.args[0], scope) * eval(node.args[1], scope);
            case '/':
                return eval(node.args[0], scope) / eval(node.args[1], scope);
            case 'define':
                return scope.define(node.args[0], eval(node.args[1], scope));
            case 'function':
                return Func(node.args[0], node.args[1], scope);
            case 'apply':
                var fun = eval(node.args[0], scope),
                    args = eval(node.args[1], scope),
                    newScope = fun.scope.copy(); //scope.copy(); static scope vs. dynamic scope
                fun.params.forEach(function(param, i){
                    newScope.define(param, args[i]);
                });
                return eval(fun.body, newScope);
            default:
                console.warn("Unknown " + node);
                break;
        }
    }
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

var env = Scope();

var val = eval([{fn: 'number', args: [1]}], env);
console.log(val);

val = eval({fn: '+', args: [
    {fn: '+', args: [{fn: 'number', args: [1]}, {fn: 'number', args: [2]}]},
    {fn: 'number', args: [3]}
]}, env);
console.log(val);

eval({fn: 'define', args:['a', {fn: 'number', args: [10]}]}, env);
eval({fn: 'define', args:['b', {fn: '*', args: [{fn: 'number', args:[11]}, {fn: 'number', args:[12]}]}]}, env);

val = eval({fn: '+', args: [
    {fn: '+', args: [{fn: 'number', args: [1]}, {fn: 'number', args: [2]}]},
    {fn: '+', args: [{fn: 'id', args: ['a']}, {fn: 'id', args: ['b']}]}
]}, env);
console.log(val);

eval({fn: 'define', args: ['add', {fn: 'function', args: [
    ['m', 'n'],
    {fn: '-', args: [
        {fn: 'id', args:['m']}, {fn: 'id', args:['n']}
    ]}]}]}, env);

val = eval({fn: 'apply', args:[{fn: 'id', args: ['add']}, [{fn: 'number', args: [1]}, {fn: 'number', args: [2]}]]}, env);
console.log(val);

val = eval({fn: 'apply', args:[{fn: 'id', args: ['add']}, [{fn: 'number', args: [10]}, {fn: 'number', args: [3]}]]}, env);
console.log(val);

val = eval({fn: 'apply', args:[{fn: 'id', args: ['add']}, [{fn: 'id', args: ['b']}, {fn: 'id', args: ['a']}]]}, env);
console.log(val);

eval({fn: 'define', args: ['test1', {fn: 'function', args: [
    [],
    {fn: '-', args: [
        {fn: 'id', args:['b']}, {fn: 'id', args:['a']}
    ]}]}]}, env);

val = eval({fn: 'apply', args:[{fn: 'id', args: ['test1']}, []]}, env);
console.log(val);
