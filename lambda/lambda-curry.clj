(defn zero [f] (fn [x] x))
(defn succ [n] (fn [f] (fn [x] (f ((n f) x)))))

(defn one [f] (fn [x] (f x)))
(defn two [f] (fn [x] (f (f x))))
(defn three [f] (fn [x] (f (f (f x)))))

(defn plus [m] (fn [n] (fn [f] (fn [x] ((m f) ((n f) x))))))
(defn mult [m] (fn [n] (fn [f] (n (m f)))))
;(defn mult [m n] (fn [f] (fn [x] ((n (m f)) x))))
(defn exp [a] (fn [n] (n a)))
;(defn exp [a] (fn [n] (fn [f] (fn [x] (((n a) f) x)))))

(defn pred [n]
  (fn [f]
    (fn [x]
      (((n (fn [g] (fn [h] (h (g f)))))
         (fn [u] x))
        (fn [u] u)))))

(defn sub [n] (fn [m] ((m pred) n)))

(defn church->int [n] ((n (fn [x] (inc x))) 0))

(assert (= (church->int zero) 0))
(assert (= (church->int one) 1))
(assert (= (church->int two) 2))
(assert (= (church->int three) 3))

(println "SUCC")
(assert (= (church->int (succ zero)) 1))
(assert (= (church->int (succ one)) 2))
(assert (= (church->int (succ two)) 3))

(println "PLUS")
(assert (= (church->int ((plus zero) zero)) 0))
(assert (= (church->int ((plus one) one)) 2))
(assert (= (church->int ((plus one) two)) 3))
(assert (= (church->int ((plus three) three)) 6))

(println "MUL")
(assert (= (church->int ((mult zero) three)) 0))
(assert (= (church->int ((mult one) two)) 2))
(assert (= (church->int ((mult one) three)) 3))
(assert (= (church->int ((mult three) two)) 6))
(assert (= (church->int ((mult three) (succ two))) 9))

(println "EXP")
(assert (= (church->int ((exp zero) zero)) 1))
(assert (= (church->int ((exp one) zero)) 1))
(assert (= (church->int ((exp two) zero)) 1))
(assert (= (church->int ((exp two) three)) 8))
(assert (= (church->int ((exp three) two)) 9))

(println "PRED")
(assert (= (church->int (pred zero)) 0))
(assert (= (church->int (pred one)) 0))
(assert (= (church->int (pred two)) 1))
(assert (= (church->int (pred three)) 2))
(assert (= (church->int (pred (succ three))) 3))

(println "SUB")
(assert (= (church->int ((sub zero) zero)) 0))
(assert (= (church->int ((sub two) two)) 0))
(assert (= (church->int ((sub two) one)) 1))
(assert (= (church->int ((sub three) one)) 2))
(assert (= (church->int ((sub (succ three)) one)) 3))


(println "\nEVEN RULES")
(defn church->even [n] ((n #(+ % 2)) 0))
(assert (= (church->even zero) 0))
(assert (= (church->even (succ zero)) 2))
(assert (= (church->even ((plus (succ zero)) (succ (succ zero)))) 6))
(assert (= (church->even ((mult three) three)) 18))

(println "\nEGATIVE NUMBER")
(defn church->neg [n] ((n dec) 0))
(assert (= (church->neg zero) 0))
(assert (= (church->neg (succ zero)) -1))
(assert (= (church->neg ((plus (succ zero)) (succ (succ zero)))) -3))
(assert (= (church->neg ((mult three) three)) -9))