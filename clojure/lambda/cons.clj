(defn cons [x y]
  #(cond
      (= % 0) x
      (= % 1) y
      :else (println "Argument not 0 or 1 -- CONS" %)))

(defn car [z] (z 0))
(defn cdr [z] (z 1))

(def a (cons 1 2))
(println (car a))
(println (cdr a))


(def b (cons 1 a))
(println (car b))
(println (cdr b))
(println (car (cdr b)))
(println (cdr (cdr b)))

(def c (cons (cons 1 2) (cons 3 4)))

(println "------------------")
(println (car c))
(println (car (car c)))

