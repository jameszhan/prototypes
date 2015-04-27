// Expression ::= Term | Term '+|-' Expression
// Term ::= Primary | Primary '*|/' Term
// Primary ::= Number | '(' Expression ')'

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
            throw new SyntaxError("unclosed delimeter till end of file: " + token);
        }
        return value;
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


function interpret(ast) {
    var type = ast.type;
    switch (type) {
        case 'number':
            return ast.value;
        case 'op':
            switch (ast.value) {
                case '+':
                    return interpret(ast.v1) + interpret(ast.v2);
                case '-':
                    return interpret(ast.v1) - interpret(ast.v2);
                case '*':
                    return interpret(ast.v1) * interpret(ast.v2);
                case '/':
                    return interpret(ast.v1) / interpret(ast.v2);
                default :
                    throw new EvalError("Unknown operator: " + ast.value);
            }
        default :
            throw new EvalError("Unknown ast node: " + ast);
    }
}

function compile(ast) {
    var type = ast.type;
    switch (type) {
        case 'number':
            return "ds.push(" + ast.value + ")\n";
        case 'op':
            return compile(ast.v1) + compile(ast.v2) + "ds.push(ds.pop() " + ast.value + " ds.pop())\n";
        default :
            throw new EvalError("Unknown ast node: " + ast);
    }
}

var vm = function(){
    var initDs = "var ds = []\n",
        popDs = "ds.pop()\n";
    return {
        exec: function(code){
            return eval(initDs + code + popDs);
        }
    };
}();


var expression = "3 * (2 + 1)";
var v = interpret(parse(expression));
console.log(v);
var code = compile(parse(expression));
console.log(vm.exec(code));


