// Expression ::= Term | Term '+|-' Expression
// Term ::= Primary | Primary '*|/' Term
// Primary ::= Number | '(' Expression ')'

function parseExpression(tokens) {
    var v1, v2, token;
    v1 = parseTerm(tokens);
    token = tokens.shift();
    console.log("v1 in expression: ", v1, ", token: ", token);
    if (token === undefined) {
        return v1;
    } else if (token.type === 'plus') {
        v2 = parseExpression(tokens);
        return {type: 'op', value: token.value, v1: v1, v2: v2};
    } else {
        console.warn("token in experssion: ", token);
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
        console.warn("token in term: ", token);
        tokens.unshift(token);
        return v1;
    }
}

function parsePrimary(tokens) {
    var token = tokens.shift(), value;
    if (token === undefined) {
        throw new SyntaxError("Primary can't be null.");
    } else if (token.type === 'number') {
        return token.value;
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
    console.log(tokens);
    return parseExpression(tokens);
}

var ast = parse("(1 + 2)");
//var ast = parse("1 + 2 * 3)");
console.log(ast);

//function compile(node) {
//    switch (node.type) {
//        case 'number':
//            return "ds.push(" + node.value + ")\n";
//        case 'operator':
//            return compile(node.children[0]) + compile(node.children[1]) + "ds.push(ds.pop() " + node.value + " ds.pop())\n";
//        default:
//            return "Unknown Node: " + node;
//    }
//}
//
//var ast = parse('1+2-3+4-5+6');
//var code = compile(ast);
//console.log(code);
//eval("var ds = [];" + code);
//
//
//function interpret(node) {
//    switch (node.type) {
//        case 'number':
//            return +node.value;
//        case 'operator':
//            if (node.value == '+') {
//                return interpret(node.children[0]) + interpret(node.children[1]);
//            } else {
//                return interpret(node.children[0]) - interpret(node.children[1]);
//            }
//        default:
//            return "Unknown Node: " + node;
//    }
//}
//
//var val = interpret(ast);
//console.log(val);
