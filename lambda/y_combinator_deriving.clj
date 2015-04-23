;;
;; Having read the synopsis, we know that the point here is that higher order functions,
;; being functions, can have fixed points - i.e. f(g)=g, and that if we were able to
;; find that fixed point we would be able to implement recursion in a language that
;; doesn't have it. But it's best to forget that for the moment and just convince yourself
;; that the following steps follow from each other.

;; Here is a standard definition of the factorial function:
(defn fact [n] (if (= 0 n) 1 (* n (fact (- n 1)))))
(assert (= (fact 5) 120))


;; Following the usual path, we now do something that seems pointless. Rather than explicitly
;; call the function recursively, we pass in the function to call.
(defn fact2 [f n] (if (= 0 n) 1 (* n (f f (- n 1)))))
(assert (= (fact2 fact2 5) 120))
;; This fact2 thing is no longer explicitly recursive, but it is of course not particularly
;; useful as it presupposes its own existence. We're going to try to make it more useful.


;; First, we're going to curry it, so we only have to deal with functions of one argument.
(defn fact3 [f]
  (fn [n] (if (= 0 n) 1 (* n ((f f) (- n 1))))))
(assert (= ((fact3 fact3) 5) 120))
;; What we're edging towards is something where the middle bit looks as much like a normal
;; factorial function as possible, so I'm going to pull the (f f) bit out, passing it in
;; as an argument to an inner function:


(defn fact4 [h] (fn [n]
                  (let [fact (fn [f n] (if (= 0 n) 1 (* n (f (- n 1)))))]
                    (fact (h h) n)
                    )))
(assert (= ((fact4 fact4) 5) 120))
;; Now f no longer has a (f f) in it, and we'll make it even prettier by currying it:


(defn fact5 [h] (fn [n]
                  (let [fact (fn [f] (fn [n] (if (= 0 n) 1 (* n (f (- n 1))))))]
                    ((fact (h h)) n)
                    )))
(assert (= ((fact5 fact5) 5) 120))
;; The exciting news is that (fn [f] (fn [n] (if (= 0 n) 1 (* n (f (- n 1)))))) in the middle is self
;; contained, normal function. It's not a closure, and it looks a lot like the original factorial.
;; In fact, it's almost exactly like fact2. Let's pull it out and give it an evocative name


(def fact-maker (fn [f]
                  (fn [n] (if (= 0 n) 1 (* n (f (- n 1)))))))
;; suggesting that it might be used to make factorial functions, in concert with another function
;; to which we pass it as an argument:

(defn fact6 [f]
  (fn [g] (fn [n] ((f (g g)) n))))
(assert (= (((fact6 fact-maker) (fact6 fact-maker)) 5) 120))
;; Things have started to get cool. We've broken a complicated expression that doesn't know how
;; to do anything but make factorial functions into two simpler functions, of which fact-maker
;; defines the mathematics of a factorial, and fact6 has nothing to do with factorials and could
;; potentially be used to make anything-maker into a recursive function.

;; Now let's make spruce things up a bit, so the person invoking this doesn't have to type fact6 twice.
(defn fact7 [f]
  (let [h (fn [g] (fn [n] ((f (g g)) n)))] (h h)))
(assert (= ((fact7 fact-maker) 5) 120))


;; And we'll make it look like more vanilla lisp, by getting rid of the let:
(defn fact8 [f]
  ((fn [h] (h h))
    (fn [g] (fn [n] ((f (g g)) n)))))
(assert (= ((fact8 fact-maker) 5) 120))

;; Sensing victory, we now make the variable names short and pretty.
(defn Y [f]
  ((fn [g] (g g))
    (fn [h] (fn [n] ((f (h h)) n)))))
(assert (= ((Y fact-maker) 5) 120))
;; And we're done. Before getting philosophical, let's verify that our lovely combinator can be
;; used to make other recursive functions, irrespective of the type of argument or return value.
;; Here's an example using a function that returns a list.

(defn range-maker [f] (fn [n] (if (= 0 n) () (conj (f (- n 1)) n))))
(assert (= ((Y range-maker) 5) (list 5 4 3 2 1)))

;; Remember that the point of *Y* is that it finds fixed points. In infix notion, it's like we
;; were able to vary a function *g* until <code> (f(g))(x) = g(x) for all x </code> with *Y(f)*
;; being a shortcut to *g*. If that doesn't sound impressive enough, imagine you had a machine
;; that, given something you want but don't know how to make, will make an exact copy, and then
;; it somehow figures out how to make it without being told.


;; To verify and emphasize that what we've got here is a fixed point, we can explicitly pass the
;; output of the combinator back into the maker function.
(assert (= ((fact-maker (Y fact-maker)) 5) 120))
(assert (= ((fact-maker (fact-maker (Y fact-maker))) 5) 120))
(assert (= ((fact-maker (fact-maker (fact-maker (Y fact-maker)))) 5) 120))
(assert (= ((fact-maker (fact-maker (fact-maker (fact-maker (Y fact-maker))))) 5) 120))
;; This might be magic.

