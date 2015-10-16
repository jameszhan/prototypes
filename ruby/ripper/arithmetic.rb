require 'ripper'
require 'pp'

pp Ripper.tokenize('a = 1 + 2 * 3')

pp Ripper.lex('a = 1 + 2 * 3')

pp Ripper.parse('a = 1 + 2 * 3')

pp Ripper.sexp_raw('a = 1 + 2 * 3')

pp Ripper.sexp('a = 1 + 2 * 3')
