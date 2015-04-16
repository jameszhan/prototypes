function eval(node, env) {
    switch (node.fn) {
        case 'number':
            return node.args[0];
        case 'id':
            return env.lookup(node.args[0]);
        case '+':
            return eval(node.args[0], env) + eval(node.args[1], env);
        case '-':
            return eval(node.args[0], env) - eval(node.args[1], env);
        case '*':
            return eval(node.args[0], env) * eval(node.args[1], env);
        case '/':
            return eval(node.args[0], env) / eval(node.args[1], env);
        case 'define':
            env.define(node.args[0], eval(node.args[1], env));
            break;
        case 'function': // function (ID:arg1) { B:arg2 }
            return new FunctionObj(ID, B);
        default:
            console.warn("Unknown " + node);
            break;
    }
}

function Env(){
    var env = {};
    return {
        trace: function(){
            return env;
        },
        lookup: function(id) {
            return env[id];
        },
        define: function(id, value) {
            env[id] = value;
        }
    }
}

var env = Env();
var val = eval({fn: 'number', args: [1]}, env);
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