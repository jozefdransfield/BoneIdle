Bone Idle
=========

### Lazy Functional Library For Node.js

#### Option
###### None
	var none = b_.none();
	assertEquals(none.isEmpty(), true);
	assertEquals(none.getOrNull(), null);
	assertEquals(none.getOr(anotherValue), anotherValue);
###### Some 
	var some = b_.some(value);
	assertEquals(b.isEmpty(), false);
	assertEquals(some.get(), value);
	assertEquals(some.getOrNull(), value);
	assertEquals(none.getOr(anotherValue), value);
	
##### Either
###### Left 
	 var left = b_.left(value);
	 assertEquals(left.isLeft(), true);
	 assertEquals(left.isRight(), false);
	 assertEquals(left.value()), value);
###### Right 
	 var right = b_.right(value);
	 assertEquals(right.isLeft(), false);
	 assertEquals(right.isRight(), true);
	 assertEquals(right.value()), value)



####  Callback Chaining

	isNotNull(str, function(ok) {
		if (ok) {
			hasLengthGreaterThan2(str, function(ok) {
				if (ok) {
					res.send("All good")
				} else {
					res.send("Bad Input");
				}
			})
		} else {
			res.send("Bad Input");
		}
	});

Becomes 
	
	b_.chain(isNotNull).and(hasLengthGreaterThan2).call("some param", function(either) {
		if (either.isRight) {
			res.send("All Good");
		} else {
			res.send("Bad Input");
		}
	})

