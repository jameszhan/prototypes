// Expression ::= Term | Expression '+|-' Term
// Term ::= Primary | Term '*|/' Primary
// Primary_Expression ::= DOUBLE_LITERAL | '(' Expression ')' | '-' Primary_Expression

function parseExpression(tokens) {
    var v1, v2, token;
    v1 = parseTerm(tokens);
    token = tokens.shift();
    if (token === undefined) {
        return v1;
    } else if (token.type === 'plus') {
        v2 = parseExpression(tokens);
        return {type: 'op', value: token.value, v1: v1, v2: v2};
    } else {
        tokens.unshift(token);
        return v1;
    }
}

function parseTerm(tokens){
    var v1, v2, token;
    v1 = parsePrimary(tokens);
    token = tokens.shift();
    if (token === undefined) {
        return v1;
    } else if (token.type === 'mul') {
        v2 = parseTerm(tokens);
        return {type: 'op', value: token.value, v1: v1, v2: v2};
    } else {
        tokens.unshift(token);
        return v1;
    }
}

function parsePrimary(tokens) {
    var token = tokens.shift(), value;
    if (token === undefined) {
        throw new SyntaxError("Primary can't be null.");
    } else if (token.type === 'number') {
        return {type: 'number', value: token.value};
    } else if (token.type === '(') {
        value = parseExpression(tokens);
        token = tokens.shift();
        if (token === undefined || token.type !== ')') {
            throw new SyntaxError("unclosed delimeter till end of file: " + JSON.stringify(token));
        }
        return value;
    } else if (token.value === '-') {
        value = parsePrimary(tokens);
        return {type: 'negative', value: value}
    } else {
        throw new SyntaxError("Unknown token " + JSON.stringify(token) + " in Primary.");
    }
}


function parse(code) {
    var tokens = code.split('"').map(function(x, i){
        if (i % 2 === 0){ // not in string
            return x.replace(/([-+*/()])/g, " $1 ");
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function(x){
        return x.replace(/#whitespace#/g, " ");
    }).map(function(input, i) {
        if (input === '(') {
            return {type: '(', value: '('};
        } else if (input === ')') {
            return {type: ')', vaue: ')'};
        } else if (input === '+' || input === '-') {
            return {type: 'plus', value: input};
        } else if (input === '*' || input === '/') {
            return {type: 'mul', value: input};
        } else if (!isNaN(parseFloat(input))) {
            return {type: 'number', value: parseFloat(input)};
        } else {
            throw new SyntaxError("Unknow token: " + input);
        }
    });
    return parseExpression(tokens);
}

function travel(ast, visitor) {
    var type = ast.type;
    switch (type) {
        case 'number':
            return visitor.visitNumber(ast.value);
        case 'negative':
            return visitor.visitNegative(travel(ast.value, visitor));
        case 'op':
            return visitor.visitOp(ast.value, travel(ast.v1, visitor), travel(ast.v2, visitor));
        default :
            throw new EvalError("Unknown ast node: " + ast);
    }
}

function interpret(ast) {
    var visitor = {
        visitNumber: function(value) {
            return value;
        },
        visitNegative: function(value) {
            return -value;
        },
        visitOp: function(op, v1, v2) {
            switch (op) {
                case '+':
                    return v1 + v2;
                case '-':
                    return v1 - v2;
                case '*':
                    return v1 * v2;
                case '/':
                    return v1 / v2;
                default :
                    throw new EvalError("Unknown operator: " + ast.value);
            }
        }
    };
    return travel(ast, visitor);
}


function compile(ast) {
    var code = [],
        visitor = {
            visitNumber: function(number) {
                code.push("ds.push(" + number + ")");
            },
            visitNegative: function(value) {
                code.push("ds.push(-ds.pop())");
            },
            visitOp: function(op, v1, v2){
                code.push("ds.push(ds.pop() " + op + " ds.pop())");
            }
        };
    travel(ast, visitor);
    return code.join("\n");
}

function printAST(ast) {
    var visitor = {
        visitNumber: function(number) {
            return number;
        },
        visitNegative: function(value) {
            return ['-', value];
        },
        visitOp: function(op, v1, v2){
            return [op, v1, v2];
        }
    }, graph = function(node, i) {
        var indent = '';
        for (var j = 0; j < i; j++){
            indent += "\t";
        }
        if (node.forEach && node.map && node.reduce) { //isArray
            var op = node[0];
            console.log(indent, op);
            node.slice(1).forEach(function(e){
                graph(e, i + 1);
            });
        } else {
            console.log(indent, node);
        }
    };
    return graph(travel(ast, visitor), 0);
}

var vm = (function(){
    var initDs = "var ds = []\n",
        popDs = "\nds.pop()\n";
    return {
        exec: function(code){
            return eval(initDs + code + popDs);
        }
    };
})();


var expression = "3 * -(8 + -2)";
var v = interpret(parse(expression));
console.log(v);
var code = compile(parse(expression));
console.log(code);
console.log(vm.exec(code));

function log(value) {
    console.log(JSON.stringify(value));
}

printAST(parse(expression));
printAST(parse("(2 + 3) * (5 + 6)"));