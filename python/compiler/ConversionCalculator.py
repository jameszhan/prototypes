def eval(e):
    if type(e) == type(1): return (e, {})  # <--- (e,{})    common mistake: e
    if type(e) == type(1.1): return (e, {})  # <--- (e,{})    common mistake: e
    if type(e) == type('m'): return (1, {e: 1})  # <--- base case   common mistakes: {e:1}
    if type(e) == type(()):
        if e[0] == '+': return add(eval(e[1]), eval(e[2]))
        if e[0] == '-': return sub(eval(e[1]), eval(e[2]))
        if e[0] == '*': return mul(eval(e[1]), eval(e[2]))
        if e[0] == '/': return div(eval(e[1]), eval(e[2]))
        if e[0] == '^': return pow(eval(e[1]), eval(e[2]))


def add(v1, v2):
    n1, u1 = v1
    n2, u2 = v2
    if u1 != u2: raise Exception("Adding incompatible units")
    return (n1 + n2, u1)


def sub(v1, v2):
    n1, u1 = v1
    n2, u2 = v2
    if u1 != u2: raise Exception("Adding incompatible units")
    return (n1 - n2, u1)


def mul(v1, v2):
    n1, u1 = v1
    n2, u2 = v2
    return (n1 * n2, mulUnits(u1, u2))


def div(v1, v2):
    n1, u1 = v1
    n2, u2 = v2
    return (n1 / n2, divUnits(u1, u2))


def pow(v1, v2):
    n1, u1 = v1
    n2, u2 = v2
    if u2 != {}: raise Exception("Exponent must be a unit-less value")
    return (n1 ** n2, powUnits(u1, n2))


def canonize(u):
    return dict([(s, u[s]) for s in u if u[s] != 0])


def mulUnits(u1, u2):
    u = u1.copy()
    for s in u2:
        if s in u:
            u[s] = u[s] + u2[s]
        else:
            u[s] = u2[s]
    return canonize(u)


def divUnits(u1, u2):
    u = u1.copy()
    for s in u2:
        if s in u:
            u[s] = u[s] - u2[s]
        else:
            u[s] = -u2[s]
    return canonize(u)


def powUnits(u, n):
    return canonize(dict([(s, u[s] * n) for s in u.keys()]))


p6 = 'm'  # m
p7 = ('+', 'm', 'm')  # m+m
p8_ = ('+', 'm', 's')  # m+s  ERROR
p9 = ('^', ('*', 2, 'm'), 2)  # (2 m)^2
p10 = ('*', ('*', 1, 'm'), ('^', 's', -1))  # 1 m * s^(-1)
p11 = ('/', 'm', 's')  # m/s
p12 = ('/', ('*', 1, 'm'), ('^', 's', 1))  # 1 m / s^1
p13 = ('/', p12, p11)
p14 = ('+', 1, ('/', 'm', 'm'))


def runTests(tests):
    for p in tests:
        print("%s \t--> %s" % (p, eval(p)))


def runFailedTests(tests):
    for p in tests:
        try:
            eval(p)
        except Exception:
            print("OK")


runTests((p6, p7, p9, p10, p11, p12, p13, p14))
runFailedTests((p8_,))
