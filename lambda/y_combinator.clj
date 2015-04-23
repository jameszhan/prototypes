;; Y Combinator
;;
;; 对任一伪递归F，必存在一个理想f（F就是从这个理想f演变而来的），满足F(f) = f。
;; Y(F) = f
;; Y(F) = f = F(f) = F(Y(F))
;; 即有：
;; Y(F) = F(Y(F))
;;
;; Y = λfλgλn.f (g g) n
;; Y F = λfλgλn.f (g g) n
;;
;;
;;
;;


;; (def fact-maker (fn [f] (fn [n] (if (= 0 n) 1 (* n (f (dec n)))))))
(defn fact-maker [f] (fn [n] (if (= 0 n) 1 (* n (f (dec n))))))

(defn Y1 [f]
  (fn [g]
    (fn [n]
      ((f (g g)) n))))

(assert (= (((Y1 fact-maker) (Y1 fact-maker)) 5) 120))

(defn Y [gen]
  ((fn [g] (g g))
    (fn [f]
      (fn [n] ((gen (f f)) n)))))


(assert (= ((Y fact-maker) 5) 120))
(assert (= ((fact-maker (Y fact-maker)) 5) 120))
