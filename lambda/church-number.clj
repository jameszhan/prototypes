;(def zero (fn [f x] x))
(defn zero [f x] x)
(defn succ [n] (fn [f x] (f (n f x))))

;(def one (fn [f x] (f x)))
(defn one [f x] (f x))
;(def two (fn [f x] (f (f x))))
(defn two [f x] (f (f x)))
;(def three (fn [f x] (f (f (f x)))))
(defn three [f x] (f (f (f x))))



(defn plus [m n] (fn [f x] (m f (n f x))))
;(defn mult [m n] (fn [f x] (n #(m f %) x)))
(defn mult [m n] (fn [f x] (n (partial m f) x)))

;(defn church->int [n] (n #(inc %) 0))
(defn church->int [n] (n inc 0))

(println (church->int zero))
(println (church->int one))
(println (church->int two))
(println (church->int three))

(println "SUCC")
(println (church->int (succ zero)))
(println (church->int (succ one)))
(println (church->int (succ two)))

(println "PLUS")
(println (church->int (plus zero zero)))
(println (church->int (plus one one)))
(println (church->int (plus one two)))
(println (church->int (plus three three)))
(println (church->int (plus three (plus three three))))

(println "MUL")
(println (church->int (mult zero three)))
(println (church->int (mult one two)))
(println (church->int (mult one three)))
(println (church->int (mult three two)))
(println (church->int (mult three (succ two))))

