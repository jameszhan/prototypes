function symbol(input){
    var type = 'literal', value = input;
    if (input === '(' || input === ')') {
        type = 'delimeter';
    } else if (!isNaN(parseFloat(input))) {
        type = 'number';
        value = parseFloat(input);
    } else if (input[0] === '"' && input.slice(-1) === '"') {
        type = 'string';
        value = input.slice(1, -1);
    } else {
        type = 'identifier';
    }
    return { type: type, value: value }
}

function buildAST(tokens, list) {
    var token = tokens.shift();
    if (token === undefined) {
        return list.pop();
    } else if (token.value === "(") {
        list.push(buildAST(tokens, []));
        return buildAST(tokens, list);
    } else if (token.value === ")") {
        return list;
    } else {
        return buildAST(tokens, list.concat(token));
    }
}

function parse(code) {
    var tokens = code.split('"').map(function(x, i){
        if (i % 2 === 0){ // not in string
            return x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ');
        } else { // in string
            return x.replace(/\s/g, "#whitespace#");
        }
    }).join('"').trim().split(/\s+/).map(function(x){
        return x.replace(/#whitespace#/g, " ");
    }).map(function(token, i){
        return symbol(token);
    });

    return buildAST(tokens, []);
}

console.log(JSON.stringify(parse("(+ (+ 1 2) (+ 3 4))")));
console.log(JSON.stringify(parse("(+ 1 2)")));
console.log(JSON.stringify(parse("((lambda (x) (+ x 1)) 2)")));
console.log(JSON.stringify(parse("(((lambda (x) (lambda (y) (+ x y))) 2) 3)")));

