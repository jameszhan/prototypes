function isNumber(str) {
    return /^\d+$/.test(str);
}

function isOperator(str) {
    return /^[-+*/]$/.test(str);
}

function isId(str) {
    return /^[A-Za-z]\w+$/.test(str);
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
    var symbols = tokens.map(function(token, i){
        if (isNumber(token)) {
            return {value: token, type: 'number'};
        } else if (isOperator(token)) {
            return {value: token, type: 'operator'};
        } else if (isId(token)) {
            return {value: token, type: 'id'};
        } else {
            throw new SyntaxError("Unknown Token: " + token);
        }
    });
    return LR1(symbols);
}

function LR1(symbols){
    var stack = [], op, left, right, node, ast, current, next, i;
    for (i = 0; i < symbols.length; i++) {
        current = symbols[i];
        next = symbols[i + 1];
        if (next === undefined || next.value == '+' || next.value == '-') {
            if (current.type === 'number') {
                right = {value: +current.value, type: 'number'};
                op = stack.pop();
                if (op) {
                    left = stack.pop();
                    stack.push({value: op.value, children: [left, right], type: 'operator'});
                } else {
                    stack.push(right);
                }
            } else {
                throw new SyntaxError("Parse error: " + current + " must be a number.");
            }
        } else if (next.type === 'number' && current.type === 'operator') {
            stack.push(current);
        }
    }
    return stack;
}


var ast = parse("1 + 2 + 3 + 4 + 5");
console.log(JSON.stringify(ast));