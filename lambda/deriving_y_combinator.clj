(defn fact [n] (if (<= n 0) 1 (* n (fact (dec n)))))
(assert (= (fact 5) 120))

(defn fact2 [self n] (if (<= n 0) 1 (* n (self self (dec n)))))
(assert (= (fact2 fact2 5) 120))

;; Currying fact2
(defn fact3 [self] (fn [n] (if (<= n 0) 1 (* n ((self self) (dec n))))))
(assert (= ((fact3 fact3) 5) 120))

;; ((self self) (dec n)) 是不是有点丑陋，如果能变成(f (dec n))就更好了，下面我们试着把(self self)拎出来，用作参数f传入。
(defn fact4 [self]
  (fn [n] (letfn [(fac-gen [f] (if (<= n 0) 1 (* n (f (dec n)))))]
            (fac-gen (self self)))))
(assert (= ((fact4 fact4) 5) 120))

;; 我们来看fac-gen的形式，其等价于(defn fac-gen [f] (if (<= n 0) 1 (* n (f (dec n)))))，是不是和我们理想中的fact形式
;; 形式已经很接近了，当然其中有一个自由变量n，没关系，我们给他加个帽子。
(defn fact5 [self]
  (fn [n]
    (letfn [(fac-gen [f]
              (fn [n] (if (<= n 0) 1 (* n (f (dec n))))))]
      ((fac-gen (self self)) n))))
(assert (= ((fact5 fact5) 5) 120))
;; 这次的fac-gen有点像了，换成二元就是(defn fac-gen [f, n] (if (<= n 0) 1 (* n (f (dec n)))))，这正是我们找寻的理想形式。
(defn fact6 [self]
  (letfn [(fac-gen [f]
            (fn [n] (if (<= n 0) 1 (* n (f (dec n))))))]
    (fn [n] ((fac-gen (self self)) n))))
(assert (= ((fact6 fact6) 5) 120))

;; 让我们把fac-gen抽出来，作为一个单独的函数，再试图构建一个函数来调用它。
(defn fac-gen [f] (fn [n] (if (<= n 0) 1 (* n (f (dec n))))))
(defn fact7 [self]
  (fn [n] ((fac-gen (self self)) n)))
(assert (= ((fact7 fact7) 5) 120))

;; 让我们把fact7变得更通用一些，把fac-gen作为参数传入。
(defn fact8 [gen]
  (fn [self]
    (fn [n] ((gen (self self)) n))))
;; (fact8 fac-gen) = fact7
(assert (= (((fact8 fac-gen) (fact8 fac-gen)) 5) 120))

;; 下面的例子无法工作，想一想为什么！
;; (defn fact9 [self]
;;   (fn [gen]
;;     (fn [n] ((gen (self self)) n))))

;; 答案呼之欲出了，可以看出fact8已经和fact本身的运算过程没有任何关系了，所以我们不妨给它换个名字
(defn y [gen]
  (fn [self]
    (fn [n] ((gen (self self)) n))))
(assert (= (((y fac-gen) (y fac-gen)) 5) 120))

(defn fib-gen [f] (fn [n] (if (<= n 2) 1 (+ (f (dec n)) (f (- n 2))))))
(assert (= (((y fib-gen) (y fib-gen)) 1) 1))
(assert (= (((y fib-gen) (y fib-gen)) 2) 1))
(assert (= (((y fib-gen) (y fib-gen)) 3) 2))
(assert (= (((y fib-gen) (y fib-gen)) 4) 3))
(assert (= (((y fib-gen) (y fib-gen)) 5) 5))
(assert (= (((y fib-gen) (y fib-gen)) 6) 8))

(defn range-gen [f] (fn [n] (if (<= n 0) () (conj (f (dec n)) n))))
(assert (= (((y range-gen) (y range-gen)) 5) (list 5 4 3 2 1)))

;; 我们看下我们的调用，都是形如：(((y *-gen) (y *-gen)) n)的形式，还是相当丑陋的，我们下面改写下，简化其调用过程。
(defn y1 [gen]
  (letfn [(g [self] (fn [n] ((gen (self self)) n)))]
    (g g)))
(assert (= ((y1 range-gen) 5) (list 5 4 3 2 1)))
(assert (= ((y1 fib-gen) 6) 8))
(assert (= ((y1 fac-gen) 5) 120))

;; 去除letfn，把self使用f替换。
(defn Y [gen]
  ((fn [g] (g g))
    (fn [f]
      (fn [n] ((gen (f f)) n)))))
(assert (= ((Y range-gen) 5) (list 5 4 3 2 1)))
(assert (= ((Y fib-gen) 6) 8))
(assert (= ((Y fac-gen) 5) 120))

;; 最终版本，具有clojure特色
(defn y-combinator [gen]
  (#(% %) (fn [f] #(apply (gen (f f)) %&))))
(assert (= ((y-combinator range-gen) 5) (list 5 4 3 2 1)))
(assert (= ((y-combinator fib-gen) 6) 8))
(assert (= ((y-combinator fac-gen) 5) 120))



(defn Y1 [gen]
  ((fn [g] (g g))
    (fn [f] (gen (fn [n] ((f f) n))))))
(assert (= ((Y1 range-gen) 5) (list 5 4 3 2 1)))
(assert (= ((Y1 fib-gen) 6) 8))
(assert (= ((Y1 fac-gen) 5) 120))

;; 最终版本，具有clojure特色
(defn y-combinator1 [gen]
  (#(% %) (fn [f] (gen #(apply (f f) %&)))))
(assert (= ((y-combinator1 range-gen) 5) (list 5 4 3 2 1)))
(assert (= ((y-combinator1 fib-gen) 6) 8))
(assert (= ((y-combinator1 fac-gen) 5) 120))



;; 直接lambda演算完成递归，没有使用到任何命名策略
(assert (=
  ((fn [self n] (if (<= n 0) 1 (* n (self self (dec n)))))
    (fn [self n] (if (<= n 0) 1 (* n (self self (dec n))))) 5)
  120))

(assert (=
  (((fn [self] (fn [n] (if (<= n 0) 1 (* n ((self self) (dec n))))))
     (fn [self] (fn [n] (if (<= n 0) 1 (* n ((self self) (dec n))))))) 5)
  120))

;; 以上2例尽管也可以完成递归，但是明显违背DRY原则，使用Y Combinator则简单的多，关键是Y Combinator还可以重用，而且函数调用
;; 还需要把自己当做参数传入明显蹩脚。
(assert (=
          (((fn [gen] ((fn [g] (g g)) (fn [h] (fn [n] ((gen (h h)) n)))))
             (fn [f] (fn [n] (if (= 0 n) 1 (* n (f (dec n))))))) 5) 120))


