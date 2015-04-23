;;
;;
;;<expr> ::= <identifier>
;;<expr> ::= lambda <identifier-list>. <expr>
;;<expr> ::= (<expr> <expr>)
;;
;;

(def zero (fn [f] (fn [x] x)))
(def succ (fn [n] (fn [f] (fn [x] (f ((n f) x))))))

;;
;; one = (succ zero)
;;      = (fn [f] (fn [x] (f (((zero) f) x))))
;;      = (fn [f] (fn [x] (f ((fn [x] x) x))))
;;      = (fn [f] (fn [x] (f x)))
;;
;; two = (succ one)
;;     = (fn [f] (fn [x] (f (((one) f) x))))
;;     = (fn [f] (fn [x] (f ((fn [x] (f x)) x))))
;;     = (fn [f] (fn [x] (f (f x))))
;;

(def one (fn [f] (fn [x] (f x))))
(def two (fn [f] (fn [x] (f (f x)))))
(def three (fn [f] (fn [x] (f (f (f x))))))

(def plus (fn [m n] (fn [f] (fn [x] ((m f) ((n f) x))))))
;(def mult (fn [m n] (fn [f] (n (m f)))))
(def mult (fn [m n] (fn [f] (fn [x] ((n (m f)) x)))))

(def exp (fn [a n] (fn [f] (fn [x] (((n a) f) x)))))

(def church->int (fn [n] ((n (fn [x] (inc x))) 0)))

(assert (= (church->int zero) 0))
(assert (= (church->int one) 1))
(assert (= (church->int two) 2))
(assert (= (church->int three) 3))

(println "SUCC")
(assert (= (church->int (succ zero)) 1))
(assert (= (church->int (succ one)) 2))
(assert (= (church->int (succ two)) 3))

(println "PLUS")
(assert (= (church->int (plus zero zero)) 0))
(assert (= (church->int (plus one one)) 2))
(assert (= (church->int (plus one two)) 3))
(assert (= (church->int (plus three three)) 6))

(println "MUL")
(assert (= (church->int (mult zero three)) 0))
(assert (= (church->int (mult one two)) 2))
(assert (= (church->int (mult one three)) 3))
(assert (= (church->int (mult three two)) 6))
(assert (= (church->int (mult three (succ two))) 9))

(println "EXP")
(assert (= (church->int (exp zero zero)) 1))
(assert (= (church->int (exp one zero)) 1))
(assert (= (church->int (exp two zero)) 1))
(assert (= (church->int (exp two three)) 8))
(assert (= (church->int (exp three two)) 9))



