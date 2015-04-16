function isNumber(str) {
    return /^\d+$/.test(str);
}

function isOperator(str) {
    return /^[-+*/]$/.test(str);
}

function buildAst(tokens) {
    var sym, left, right, token, stack = [];
    while (token = tokens.shift()) {
        if (isNumber(token)) {
            sym = {value: token, type: 'number'};
            stack.push(sym);
        } else if (isOperator(token)) {
            left = stack.pop();
            if (left) {
                sym = {children: [left], value: token, type: 'operator'};
            } else {
                console.error('Syntax error at: ' + left + ', ' + sym.value);
                throw 'Syntax error at: ' + left;
            }
            right = tokens.shift();
            if (right && isNumber(right)) {
                sym.children[1] = {value: right, type: 'number'};
                stack.push(sym);
            } else {
                console.error('Syntax error at: ' + right);
                throw 'Syntax error at: ' + right;
            }
        }
    }
    return stack.pop();
}


function parse(code) {
    var tokens = code.split('"').map(function(x, i){
        if (i % 2 === 0){ // not in string
            return x.replace(/([-+*/])/g, " $1 ");
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function(x){
        return x.replace(/#whitespace#/g, " ");
    });
    return buildAst(tokens);
}

function compile(node) {
    switch (node.type) {
        case 'number':
            return "ds.push(" + node.value + ")\n";
        case 'operator':
            return compile(node.children[0]) + compile(node.children[1]) + "ds.push(ds.pop() " + node.value + " ds.pop())\n";
        default:
            return "Unknown Node: " + node;
    }
}

var ast = parse('1+2-3+4-5+6');
var code = compile(ast);
console.log(code);

function interpret(node, ds) {
    switch (node.type) {
        case 'number':
            ds.push(parseInt(node.value));
            break;
        case 'operator':
            interpret(node.children[1], ds);
            interpret(node.children[0], ds);
            console.log(ds);
            console.log(node);
            if (node.value == '+') {
                ds.push(ds.pop() + ds.pop());
            } else {
                ds.push(ds.pop() - ds.pop());
            }
            break;
        default:
            return "Unknown Node: " + node;
    }
}

var ds = [];
interpret(ast, ds);
console.log(ds.pop());
