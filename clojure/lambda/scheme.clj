(defn cons [x y]
  (fn [m] (m x y)))

(defn car [z]
  (z (fn [p q] p)))

(defn cdr [z]
  (z (fn [p q] q)))

(defn nth [items i]
  (if (= i 0)
    (car items)
    (recur (cdr items) (dec i))))

(defn map [f items]
  (if (nil? items)
    '()
    (cons (f (car items))
      (map f (cdr items)))))


;;examples
(def a (cons 1 (cons 2 3)))

(println a)
(println (car a))
(println (cdr a))
(println (car (cdr a)))
(println (cdr (cdr a)))

(println "-------------------")
(def items (cons 5 (cons 4 (cons 3 (cons 2 (cons 1 nil))))))
(println (nth items 0))
(println (nth items 1))
(println (nth items 2))
(println (nth items 3))
(println (nth items 4))
;(println (nth items 5))

(println "-------------------")

(def b (->> items (map #(* 2 %))))
(println (nth b 1))
(println (nth b 2))
(println (nth b 3))



