//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

;/**
 * @license
 * Copyright (c) 2012-2014 The Polymer Authors. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 * 
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
// @version: 0.2.1
function PointerGestureEvent(a,b){var c=b||{},d=document.createEvent("Event"),e={bubbles:Boolean(c.bubbles)===c.bubbles||!0,cancelable:Boolean(c.cancelable)===c.cancelable||!0};d.initEvent(a,e.bubbles,e.cancelable);for(var f,g=Object.keys(c),h=0;h<g.length;h++)f=g[h],d[f]=c[f];return d.preventTap=this.preventTap,d}"undefined"==typeof WeakMap&&!function(){var a=Object.defineProperty,b=Date.now()%1e9,c=function(){this.name="__st"+(1e9*Math.random()>>>0)+(b++ +"__")};c.prototype={set:function(b,c){var d=b[this.name];d&&d[0]===b?d[1]=c:a(b,this.name,{value:[b,c],writable:!0})},get:function(a){var b;return(b=a[this.name])&&b[0]===a?b[1]:void 0},"delete":function(a){this.set(a,void 0)}},window.WeakMap=c}(),function(a){"use strict";function b(){function a(a){b=a}if("function"!=typeof Object.observe||"function"!=typeof Array.observe)return!1;var b=[],c={};if(Object.observe(c,a),c.id=1,c.id=2,delete c.id,Object.deliverChangeRecords(a),3!==b.length)return!1;if("new"==b[0].type&&"updated"==b[1].type&&"deleted"==b[2].type)L="new",M="updated",N="reconfigured",O="deleted";else if("add"!=b[0].type||"update"!=b[1].type||"delete"!=b[2].type)return console.error("Unexpected change record names for Object.observe. Using dirty-checking instead"),!1;return Object.unobserve(c,a),c=[0],Array.observe(c,a),c[1]=1,c.length=0,Object.deliverChangeRecords(a),2!=b.length?!1:b[0].type!=P||b[1].type!=P?!1:(Array.unobserve(c,a),!0)}function c(){if(a.document&&"securityPolicy"in a.document&&!a.document.securityPolicy.allowsEval)return!1;try{var b=new Function("","return true;");return b()}catch(c){return!1}}function d(a){return+a===a>>>0}function e(a){return+a}function f(a){return a===Object(a)}function g(a,b){return a===b?0!==a||1/a===1/b:S(a)&&S(b)?!0:a!==a&&b!==b}function h(a){return"string"!=typeof a?!1:(a=a.trim(),""==a?!0:"."==a[0]?!1:$.test(a))}function i(a,b){if(b!==_)throw Error("Use Path.get to retrieve path objects");return""==a.trim()?this:d(a)?(this.push(a),this):(a.split(/\s*\.\s*/).filter(function(a){return a}).forEach(function(a){this.push(a)},this),void(R&&this.length&&(this.getValueFrom=this.compiledGetValueFromFn())))}function j(a){if(a instanceof i)return a;null==a&&(a=""),"string"!=typeof a&&(a=String(a));var b=ab[a];if(b)return b;if(!h(a))return bb;var b=new i(a,_);return ab[a]=b,b}function k(b){for(var c=0;db>c&&b.check_();)c++;return a.testingExposeCycleCount&&(a.dirtyCheckCycleCount=c),c>0}function l(a){for(var b in a)return!1;return!0}function m(a){return l(a.added)&&l(a.removed)&&l(a.changed)}function n(a,b){var c={},d={},e={};for(var f in b){var g=a[f];(void 0===g||g!==b[f])&&(f in a?g!==b[f]&&(e[f]=g):d[f]=void 0)}for(var f in a)f in b||(c[f]=a[f]);return Array.isArray(a)&&a.length!==b.length&&(e.length=a.length),{added:c,removed:d,changed:e}}function o(){if(!eb.length)return!1;for(var a=0;a<eb.length;a++)eb[a]();return eb.length=0,!0}function p(){function a(a){b&&b.state_===kb&&!d&&b.check_(a)}var b,c,d=!1,e=!0;return{open:function(c){if(b)throw Error("ObservedObject in use");e||Object.deliverChangeRecords(a),b=c,e=!1},observe:function(b,d){c=b,d?Array.observe(c,a):Object.observe(c,a)},deliver:function(b){d=b,Object.deliverChangeRecords(a),d=!1},close:function(){b=void 0,Object.unobserve(c,a),gb.push(this)}}}function q(a,b,c){var d=gb.pop()||p();return d.open(a),d.observe(b,c),d}function r(){function a(b){if(f(b)){var c=j.indexOf(b);c>=0?(j[c]=void 0,i.push(b)):i.indexOf(b)<0&&(i.push(b),Object.observe(b,e)),a(Object.getPrototypeOf(b))}}function b(){var b=j===hb?[]:j;j=i,i=b;var c;for(var d in g)c=g[d],c&&c.state_==kb&&c.iterateObjects_(a);for(var f=0;f<j.length;f++){var h=j[f];h&&Object.unobserve(h,e)}j.length=0}function c(){l=!1,k&&b()}function d(){l||(k=!0,l=!0,fb(c))}function e(){b();var a;for(var c in g)a=g[c],a&&a.state_==kb&&a.check_()}var g=[],h=0,i=[],j=hb,k=!1,l=!1,m={object:void 0,objects:i,open:function(b){g[b.id_]=b,h++,b.iterateObjects_(a)},close:function(a){if(g[a.id_]=void 0,h--,h)return void d();k=!1;for(var b=0;b<i.length;b++)Object.unobserve(i[b],e),t.unobservedCount++;g.length=0,i.length=0,ib.push(this)},reset:d};return m}function s(a,b){return cb&&cb.object===b||(cb=ib.pop()||r(),cb.object=b),cb.open(a),cb}function t(){this.state_=jb,this.callback_=void 0,this.target_=void 0,this.directObserver_=void 0,this.value_=void 0,this.id_=nb++}function u(a){t._allObserversCount++,pb&&ob.push(a)}function v(){t._allObserversCount--}function w(a){t.call(this),this.value_=a,this.oldObject_=void 0}function x(a){if(!Array.isArray(a))throw Error("Provided object is not an Array");w.call(this,a)}function y(a,b){t.call(this),this.object_=a,this.path_=b instanceof i?b:j(b),this.directObserver_=void 0}function z(){t.call(this),this.value_=[],this.directObserver_=void 0,this.observed_=[]}function A(a){return a}function B(a,b,c,d){this.callback_=void 0,this.target_=void 0,this.value_=void 0,this.observable_=a,this.getValueFn_=b||A,this.setValueFn_=c||A,this.dontPassThroughSet_=d}function C(a,b){if("function"==typeof Object.observe){var c=Object.getNotifier(a);return function(d,e){var f={object:a,type:d,name:b};2===arguments.length&&(f.oldValue=e),c.notify(f)}}}function D(a,b,c){for(var d={},e={},f=0;f<b.length;f++){var g=b[f];tb[g.type]?(g.name in c||(c[g.name]=g.oldValue),g.type!=M&&(g.type!=L?g.name in d?(delete d[g.name],delete c[g.name]):e[g.name]=!0:g.name in e?delete e[g.name]:d[g.name]=!0)):(console.error("Unknown changeRecord type: "+g.type),console.error(g))}for(var h in d)d[h]=a[h];for(var h in e)e[h]=void 0;var i={};for(var h in c)if(!(h in d||h in e)){var j=a[h];c[h]!==j&&(i[h]=j)}return{added:d,removed:e,changed:i}}function E(a,b,c){return{index:a,removed:b,addedCount:c}}function F(){}function G(a,b,c,d,e,f){return yb.calcSplices(a,b,c,d,e,f)}function H(a,b,c,d){return c>b||a>d?-1:b==c||d==a?0:c>a?d>b?b-c:d-c:b>d?d-a:b-a}function I(a,b,c,d){for(var e=E(b,c,d),f=!1,g=0,h=0;h<a.length;h++){var i=a[h];if(i.index+=g,!f){var j=H(e.index,e.index+e.removed.length,i.index,i.index+i.addedCount);if(j>=0){a.splice(h,1),h--,g-=i.addedCount-i.removed.length,e.addedCount+=i.addedCount-j;var k=e.removed.length+i.removed.length-j;if(e.addedCount||k){var c=i.removed;if(e.index<i.index){var l=e.removed.slice(0,i.index-e.index);Array.prototype.push.apply(l,c),c=l}if(e.index+e.removed.length>i.index+i.addedCount){var m=e.removed.slice(i.index+i.addedCount-e.index);Array.prototype.push.apply(c,m)}e.removed=c,i.index<e.index&&(e.index=i.index)}else f=!0}else if(e.index<i.index){f=!0,a.splice(h,0,e),h++;var n=e.addedCount-e.removed.length;i.index+=n,g+=n}}}f||a.push(e)}function J(a,b){for(var c=[],f=0;f<b.length;f++){var g=b[f];switch(g.type){case P:I(c,g.index,g.removed.slice(),g.addedCount);break;case L:case M:case O:if(!d(g.name))continue;var h=e(g.name);if(0>h)continue;I(c,h,[g.oldValue],1);break;default:console.error("Unexpected record type: "+JSON.stringify(g))}}return c}function K(a,b){var c=[];return J(a,b).forEach(function(b){return 1==b.addedCount&&1==b.removed.length?void(b.removed[0]!==a[b.index]&&c.push(b)):void(c=c.concat(G(a,b.index,b.index+b.addedCount,b.removed,0,b.removed.length)))}),c}var L="add",M="update",N="reconfigure",O="delete",P="splice",Q=b(),R=c(),S=a.Number.isNaN||function(b){return"number"==typeof b&&a.isNaN(b)},T="__proto__"in{}?function(a){return a}:function(a){var b=a.__proto__;if(!b)return a;var c=Object.create(b);return Object.getOwnPropertyNames(a).forEach(function(b){Object.defineProperty(c,b,Object.getOwnPropertyDescriptor(a,b))}),c},U="[$_a-zA-Z]",V="[$_a-zA-Z0-9]",W=U+"+"+V+"*",X="(?:[0-9]|[1-9]+[0-9]+)",Y="(?:"+W+"|"+X+")",Z="(?:"+Y+")(?:\\s*\\.\\s*"+Y+")*",$=new RegExp("^"+Z+"$"),_={},ab={};i.get=j,i.prototype=T({__proto__:[],valid:!0,toString:function(){return this.join(".")},getValueFrom:function(a){for(var b=0;b<this.length;b++){if(null==a)return;a=a[this[b]]}return a},iterateObjects:function(a,b){for(var c=0;c<this.length;c++){if(c&&(a=a[this[c-1]]),!a)return;b(a)}},compiledGetValueFromFn:function(){var a=this.map(function(a){return d(a)?'["'+a+'"]':"."+a}),b="",c="obj";b+="if (obj != null";for(var e=0;e<this.length-1;e++){{this[e]}c+=a[e],b+=" &&\n     "+c+" != null"}return b+=")\n",c+=a[e],b+="  return "+c+";\nelse\n  return undefined;",new Function("obj",b)},setValueFrom:function(a,b){if(!this.length)return!1;for(var c=0;c<this.length-1;c++){if(!f(a))return!1;a=a[this[c]]}return f(a)?(a[this[c]]=b,!0):!1}});var bb=new i("",_);bb.valid=!1,bb.getValueFrom=bb.setValueFrom=function(){};var cb,db=1e3,eb=[],fb=Q?function(){var a={pingPong:!0},b=!1;return Object.observe(a,function(){o(),b=!1}),function(c){eb.push(c),b||(b=!0,a.pingPong=!a.pingPong)}}():function(){return function(a){eb.push(a)}}(),gb=[],hb=[],ib=[],jb=0,kb=1,lb=2,mb=3,nb=1;t.prototype={open:function(a,b){if(this.state_!=jb)throw Error("Observer has already been opened.");return u(this),this.callback_=a,this.target_=b,this.state_=kb,this.connect_(),this.value_},close:function(){this.state_==kb&&(v(this),this.state_=lb,this.disconnect_(),this.value_=void 0,this.callback_=void 0,this.target_=void 0)},deliver:function(){this.state_==kb&&k(this)},report_:function(a){try{this.callback_.apply(this.target_,a)}catch(b){t._errorThrownDuringCallback=!0,console.error("Exception caught during observer callback: "+(b.stack||b))}},discardChanges:function(){return this.check_(void 0,!0),this.value_}};var ob,pb=!Q;t._allObserversCount=0,pb&&(ob=[]);var qb=!1,rb="function"==typeof Object.deliverAllChangeRecords;a.Platform=a.Platform||{},a.Platform.performMicrotaskCheckpoint=function(){if(!qb){if(rb)return void Object.deliverAllChangeRecords();if(pb){qb=!0;var b,c,d=0;do{d++,c=ob,ob=[],b=!1;for(var e=0;e<c.length;e++){var f=c[e];f.state_==kb&&(f.check_()&&(b=!0),ob.push(f))}o()&&(b=!0)}while(db>d&&b);a.testingExposeCycleCount&&(a.dirtyCheckCycleCount=d),qb=!1}}},pb&&(a.Platform.clearObservers=function(){ob=[]}),w.prototype=T({__proto__:t.prototype,arrayObserve:!1,connect_:function(){Q?this.directObserver_=q(this,this.value_,this.arrayObserve):this.oldObject_=this.copyObject(this.value_)},copyObject:function(a){var b=Array.isArray(a)?[]:{};for(var c in a)b[c]=a[c];return Array.isArray(a)&&(b.length=a.length),b},check_:function(a){var b,c;if(Q){if(!a)return!1;c={},b=D(this.value_,a,c)}else c=this.oldObject_,b=n(this.value_,this.oldObject_);return m(b)?!1:(Q||(this.oldObject_=this.copyObject(this.value_)),this.report_([b.added||{},b.removed||{},b.changed||{},function(a){return c[a]}]),!0)},disconnect_:function(){Q?(this.directObserver_.close(),this.directObserver_=void 0):this.oldObject_=void 0},deliver:function(){this.state_==kb&&(Q?this.directObserver_.deliver(!1):k(this))},discardChanges:function(){return this.directObserver_?this.directObserver_.deliver(!0):this.oldObject_=this.copyObject(this.value_),this.value_}}),x.prototype=T({__proto__:w.prototype,arrayObserve:!0,copyObject:function(a){return a.slice()},check_:function(a){var b;if(Q){if(!a)return!1;b=K(this.value_,a)}else b=G(this.value_,0,this.value_.length,this.oldObject_,0,this.oldObject_.length);return b&&b.length?(Q||(this.oldObject_=this.copyObject(this.value_)),this.report_([b]),!0):!1}}),x.applySplices=function(a,b,c){c.forEach(function(c){for(var d=[c.index,c.removed.length],e=c.index;e<c.index+c.addedCount;)d.push(b[e]),e++;Array.prototype.splice.apply(a,d)})},y.prototype=T({__proto__:t.prototype,connect_:function(){Q&&(this.directObserver_=s(this,this.object_)),this.check_(void 0,!0)},disconnect_:function(){this.value_=void 0,this.directObserver_&&(this.directObserver_.close(this),this.directObserver_=void 0)},iterateObjects_:function(a){this.path_.iterateObjects(this.object_,a)},check_:function(a,b){var c=this.value_;return this.value_=this.path_.getValueFrom(this.object_),b||g(this.value_,c)?!1:(this.report_([this.value_,c]),!0)},setValue:function(a){this.path_&&this.path_.setValueFrom(this.object_,a)}});var sb={};z.prototype=T({__proto__:t.prototype,connect_:function(){if(this.check_(void 0,!0),Q){for(var a,b=!1,c=0;c<this.observed_.length;c+=2)if(a=this.observed_[c],a!==sb){b=!0;break}return this.directObserver_?b?void this.directObserver_.reset():(this.directObserver_.close(),void(this.directObserver_=void 0)):void(b&&(this.directObserver_=s(this,a)))}},closeObservers_:function(){for(var a=0;a<this.observed_.length;a+=2)this.observed_[a]===sb&&this.observed_[a+1].close();this.observed_.length=0},disconnect_:function(){this.value_=void 0,this.directObserver_&&(this.directObserver_.close(this),this.directObserver_=void 0),this.closeObservers_()},addPath:function(a,b){if(this.state_!=jb&&this.state_!=mb)throw Error("Cannot add paths once started.");this.observed_.push(a,b instanceof i?b:j(b))},addObserver:function(a){if(this.state_!=jb&&this.state_!=mb)throw Error("Cannot add observers once started.");a.open(this.deliver,this),this.observed_.push(sb,a)},startReset:function(){if(this.state_!=kb)throw Error("Can only reset while open");this.state_=mb,this.closeObservers_()},finishReset:function(){if(this.state_!=mb)throw Error("Can only finishReset after startReset");return this.state_=kb,this.connect_(),this.value_},iterateObjects_:function(a){for(var b,c=0;c<this.observed_.length;c+=2)b=this.observed_[c],b!==sb&&this.observed_[c+1].iterateObjects(b,a)},check_:function(a,b){for(var c,d=0;d<this.observed_.length;d+=2){var e=this.observed_[d+1],f=this.observed_[d],h=f===sb?e.discardChanges():e.getValueFrom(f);b?this.value_[d/2]=h:g(h,this.value_[d/2])||(c=c||[],c[d/2]=this.value_[d/2],this.value_[d/2]=h)}return c?(this.report_([this.value_,c,this.observed_]),!0):!1}}),B.prototype={open:function(a,b){return this.callback_=a,this.target_=b,this.value_=this.getValueFn_(this.observable_.open(this.observedCallback_,this)),this.value_},observedCallback_:function(a){if(a=this.getValueFn_(a),!g(a,this.value_)){var b=this.value_;this.value_=a,this.callback_.call(this.target_,this.value_,b)}},discardChanges:function(){return this.value_=this.getValueFn_(this.observable_.discardChanges()),this.value_},deliver:function(){return this.observable_.deliver()},setValue:function(a){return a=this.setValueFn_(a),!this.dontPassThroughSet_&&this.observable_.setValue?this.observable_.setValue(a):void 0},close:function(){this.observable_&&this.observable_.close(),this.callback_=void 0,this.target_=void 0,this.observable_=void 0,this.value_=void 0,this.getValueFn_=void 0,this.setValueFn_=void 0}};var tb={};tb[L]=!0,tb[M]=!0,tb[O]=!0,t.defineComputedProperty=function(a,b,c){var d=C(a,b),e=c.open(function(a,b){e=a,d&&d(M,b)});return Object.defineProperty(a,b,{get:function(){return c.deliver(),e},set:function(a){return c.setValue(a),a},configurable:!0}),{close:function(){c.close(),Object.defineProperty(a,b,{value:e,writable:!0,configurable:!0})}}};var ub=0,vb=1,wb=2,xb=3;F.prototype={calcEditDistances:function(a,b,c,d,e,f){for(var g=f-e+1,h=c-b+1,i=new Array(g),j=0;g>j;j++)i[j]=new Array(h),i[j][0]=j;for(var k=0;h>k;k++)i[0][k]=k;for(var j=1;g>j;j++)for(var k=1;h>k;k++)if(this.equals(a[b+k-1],d[e+j-1]))i[j][k]=i[j-1][k-1];else{var l=i[j-1][k]+1,m=i[j][k-1]+1;i[j][k]=m>l?l:m}return i},spliceOperationsFromEditDistances:function(a){for(var b=a.length-1,c=a[0].length-1,d=a[b][c],e=[];b>0||c>0;)if(0!=b)if(0!=c){var f,g=a[b-1][c-1],h=a[b-1][c],i=a[b][c-1];f=i>h?g>h?h:g:g>i?i:g,f==g?(g==d?e.push(ub):(e.push(vb),d=g),b--,c--):f==h?(e.push(xb),b--,d=h):(e.push(wb),c--,d=i)}else e.push(xb),b--;else e.push(wb),c--;return e.reverse(),e},calcSplices:function(a,b,c,d,e,f){var g=0,h=0,i=Math.min(c-b,f-e);if(0==b&&0==e&&(g=this.sharedPrefix(a,d,i)),c==a.length&&f==d.length&&(h=this.sharedSuffix(a,d,i-g)),b+=g,e+=g,c-=h,f-=h,c-b==0&&f-e==0)return[];if(b==c){for(var j=E(b,[],0);f>e;)j.removed.push(d[e++]);return[j]}if(e==f)return[E(b,[],c-b)];for(var k=this.spliceOperationsFromEditDistances(this.calcEditDistances(a,b,c,d,e,f)),j=void 0,l=[],m=b,n=e,o=0;o<k.length;o++)switch(k[o]){case ub:j&&(l.push(j),j=void 0),m++,n++;break;case vb:j||(j=E(m,[],0)),j.addedCount++,m++,j.removed.push(d[n]),n++;break;case wb:j||(j=E(m,[],0)),j.addedCount++,m++;break;case xb:j||(j=E(m,[],0)),j.removed.push(d[n]),n++}return j&&l.push(j),l},sharedPrefix:function(a,b,c){for(var d=0;c>d;d++)if(!this.equals(a[d],b[d]))return d;return c},sharedSuffix:function(a,b,c){for(var d=a.length,e=b.length,f=0;c>f&&this.equals(a[--d],b[--e]);)f++;return f},calculateSplices:function(a,b){return this.calcSplices(a,0,a.length,b,0,b.length)},equals:function(a,b){return a===b}};var yb=new F;a.Observer=t,a.Observer.runEOM_=fb,a.Observer.hasObjectObserve=Q,a.ArrayObserver=x,a.ArrayObserver.calculateSplices=function(a,b){return yb.calculateSplices(a,b)},a.ArraySplice=F,a.ObjectObserver=w,a.PathObserver=y,a.CompoundObserver=z,a.Path=i,a.ObserverTransform=B,a.Observer.changeRecordTypes={add:L,update:M,reconfigure:N,"delete":O,splice:P}}("undefined"!=typeof global&&global&&"undefined"!=typeof module&&module?global:this||window),window.Platform=window.Platform||{},window.logFlags=window.logFlags||{},function(a){var b=a.flags||{};location.search.slice(1).split("&").forEach(function(a){a=a.split("="),a[0]&&(b[a[0]]=a[1]||!0)});var c=document.currentScript||document.querySelector('script[src*="platform.js"]');if(c)for(var d,e=c.attributes,f=0;f<e.length;f++)d=e[f],"src"!==d.name&&(b[d.name]=d.value||!0);b.log&&b.log.split(",").forEach(function(a){window.logFlags[a]=!0}),b.shadow=b.shadow||b.shadowdom||b.polyfill,b.shadow="native"===b.shadow?!1:b.shadow||!HTMLElement.prototype.createShadowRoot,b.register&&(window.CustomElements=window.CustomElements||{flags:{}},window.CustomElements.flags.register=b.register),b.imports&&(window.HTMLImports=window.HTMLImports||{flags:{}},window.HTMLImports.flags.imports=b.imports),a.flags=b}(Platform),Platform.flags.shadow?(window.ShadowDOMPolyfill={},function(a){"use strict";function b(a){if(!a)throw new Error("Assertion failed")}function c(a,b){return L(b).forEach(function(c){K(a,c,M(b,c))}),a}function d(a,b){return L(b).forEach(function(c){switch(c){case"arguments":case"caller":case"length":case"name":case"prototype":case"toString":return}K(a,c,M(b,c))}),a}function e(a,b){for(var c=0;c<b.length;c++)if(b[c]in a)return b[c]}function f(a){var b=a.__proto__||Object.getPrototypeOf(a),c=E.get(b);if(c)return c;var d=f(b),e=t(d);return q(b,e,a),e}function g(a,b){o(a,b,!0)}function h(a,b){o(b,a,!1)}function i(a){return/^on[a-z]+$/.test(a)}function j(a){return/^\w[a-zA-Z_0-9]*$/.test(a)}function k(a){return H&&j(a)?new Function("return this.impl."+a):function(){return this.impl[a]}}function l(a){return H&&j(a)?new Function("v","this.impl."+a+" = v"):function(b){this.impl[a]=b}}function m(a){return H&&j(a)?new Function("return this.impl."+a+".apply(this.impl, arguments)"):function(){return this.impl[a].apply(this.impl,arguments)}}function n(a,b){try{return Object.getOwnPropertyDescriptor(a,b)}catch(c){return O}}function o(b,c,d){for(var e=L(b),f=0;f<e.length;f++){var g=e[f];if("polymerBlackList_"!==g&&!(g in c||b.polymerBlackList_&&b.polymerBlackList_[g])){N&&b.__lookupGetter__(g);var h,j,o=n(b,g);if(d&&"function"==typeof o.value)c[g]=m(g);else{var p=i(g);h=p?a.getEventHandlerGetter(g):k(g),(o.writable||o.set)&&(j=p?a.getEventHandlerSetter(g):l(g)),K(c,g,{get:h,set:j,configurable:o.configurable,enumerable:o.enumerable})}}}}function p(a,b,c){var e=a.prototype;q(e,b,c),d(b,a)}function q(a,c,d){var e=c.prototype;b(void 0===E.get(a)),E.set(a,c),F.set(e,a),g(a,e),d&&h(e,d),K(e,"constructor",{value:c,configurable:!0,enumerable:!1,writable:!0}),c.prototype=e}function r(a,b){return E.get(b.prototype)===a}function s(a){var b=Object.getPrototypeOf(a),c=f(b),d=t(c);return q(b,d,a),d}function t(a){function b(b){a.call(this,b)}var c=Object.create(a.prototype);return c.constructor=b,b.prototype=c,b}function u(a){return a instanceof G.EventTarget||a instanceof G.Event||a instanceof G.Range||a instanceof G.DOMImplementation||a instanceof G.CanvasRenderingContext2D||G.WebGLRenderingContext&&a instanceof G.WebGLRenderingContext}function v(a){return Q&&a instanceof Q||a instanceof S||a instanceof R||a instanceof T||a instanceof U||a instanceof P||a instanceof V||W&&a instanceof W||X&&a instanceof X}function w(a){return null===a?null:(b(v(a)),a.polymerWrapper_||(a.polymerWrapper_=new(f(a))(a)))}function x(a){return null===a?null:(b(u(a)),a.impl)}function y(a){return a&&u(a)?x(a):a}function z(a){return a&&!u(a)?w(a):a}function A(a,c){null!==c&&(b(v(a)),b(void 0===c||u(c)),a.polymerWrapper_=c)}function B(a,b,c){K(a.prototype,b,{get:c,configurable:!0,enumerable:!0})}function C(a,b){B(a,b,function(){return w(this.impl[b])})}function D(a,b){a.forEach(function(a){b.forEach(function(b){a.prototype[b]=function(){var a=z(this);return a[b].apply(a,arguments)}})})}var E=new WeakMap,F=new WeakMap,G=Object.create(null),H=!("securityPolicy"in document)||document.securityPolicy.allowsEval;if(H)try{var I=new Function("","return true;");H=I()}catch(J){H=!1}var K=Object.defineProperty,L=Object.getOwnPropertyNames,M=Object.getOwnPropertyDescriptor;L(window);var N=/Firefox/.test(navigator.userAgent),O={get:function(){},set:function(){},configurable:!0,enumerable:!0},P=window.DOMImplementation,Q=window.EventTarget,R=window.Event,S=window.Node,T=window.Window,U=window.Range,V=window.CanvasRenderingContext2D,W=window.WebGLRenderingContext,X=window.SVGElementInstance;a.assert=b,a.constructorTable=E,a.defineGetter=B,a.defineWrapGetter=C,a.forwardMethodsToWrapper=D,a.isWrapper=u,a.isWrapperFor=r,a.mixin=c,a.nativePrototypeTable=F,a.oneOf=e,a.registerObject=s,a.registerWrapper=p,a.rewrap=A,a.unwrap=x,a.unwrapIfNeeded=y,a.wrap=w,a.wrapIfNeeded=z,a.wrappers=G}(window.ShadowDOMPolyfill),function(a){"use strict";function b(){g=!1;var a=f.slice(0);f=[];for(var b=0;b<a.length;b++)a[b]()}function c(a){f.push(a),g||(g=!0,d(b,0))}var d,e=window.MutationObserver,f=[],g=!1;if(e){var h=1,i=new e(b),j=document.createTextNode(h);i.observe(j,{characterData:!0}),d=function(){h=(h+1)%2,j.data=h}}else d=window.setImmediate||window.setTimeout;a.setEndOfMicrotask=c}(window.ShadowDOMPolyfill),function(a){"use strict";function b(){p||(k(c),p=!0)}function c(){p=!1;do for(var a=o.slice(),b=!1,c=0;c<a.length;c++){var d=a[c],e=d.takeRecords();f(d),e.length&&(d.callback_(e,d),b=!0)}while(b)}function d(a,b){this.type=a,this.target=b,this.addedNodes=new m.NodeList,this.removedNodes=new m.NodeList,this.previousSibling=null,this.nextSibling=null,this.attributeName=null,this.attributeNamespace=null,this.oldValue=null}function e(a,b){for(;a;a=a.parentNode){var c=n.get(a);if(c)for(var d=0;d<c.length;d++){var e=c[d];e.options.subtree&&e.addTransientObserver(b)}}}function f(a){for(var b=0;b<a.nodes_.length;b++){var c=a.nodes_[b],d=n.get(c);if(!d)return;for(var e=0;e<d.length;e++){var f=d[e];f.observer===a&&f.removeTransientObservers()}}}function g(a,c,e){for(var f=Object.create(null),g=Object.create(null),h=a;h;h=h.parentNode){var i=n.get(h);if(i)for(var j=0;j<i.length;j++){var k=i[j],l=k.options;if((h===a||l.subtree)&&!("attributes"===c&&!l.attributes||"attributes"===c&&l.attributeFilter&&(null!==e.namespace||-1===l.attributeFilter.indexOf(e.name))||"characterData"===c&&!l.characterData||"childList"===c&&!l.childList)){var m=k.observer;f[m.uid_]=m,("attributes"===c&&l.attributeOldValue||"characterData"===c&&l.characterDataOldValue)&&(g[m.uid_]=e.oldValue)}}}var o=!1;for(var p in f){var m=f[p],q=new d(c,a);"name"in e&&"namespace"in e&&(q.attributeName=e.name,q.attributeNamespace=e.namespace),e.addedNodes&&(q.addedNodes=e.addedNodes),e.removedNodes&&(q.removedNodes=e.removedNodes),e.previousSibling&&(q.previousSibling=e.previousSibling),e.nextSibling&&(q.nextSibling=e.nextSibling),void 0!==g[p]&&(q.oldValue=g[p]),m.records_.push(q),o=!0}o&&b()}function h(a){if(this.childList=!!a.childList,this.subtree=!!a.subtree,this.attributes="attributes"in a||!("attributeOldValue"in a||"attributeFilter"in a)?!!a.attributes:!0,this.characterData="characterDataOldValue"in a&&!("characterData"in a)?!0:!!a.characterData,!this.attributes&&(a.attributeOldValue||"attributeFilter"in a)||!this.characterData&&a.characterDataOldValue)throw new TypeError;if(this.characterData=!!a.characterData,this.attributeOldValue=!!a.attributeOldValue,this.characterDataOldValue=!!a.characterDataOldValue,"attributeFilter"in a){if(null==a.attributeFilter||"object"!=typeof a.attributeFilter)throw new TypeError;this.attributeFilter=q.call(a.attributeFilter)}else this.attributeFilter=null}function i(a){this.callback_=a,this.nodes_=[],this.records_=[],this.uid_=++r,o.push(this)}function j(a,b,c){this.observer=a,this.target=b,this.options=c,this.transientObservedNodes=[]}var k=a.setEndOfMicrotask,l=a.wrapIfNeeded,m=a.wrappers,n=new WeakMap,o=[],p=!1,q=Array.prototype.slice,r=0;i.prototype={observe:function(a,b){a=l(a);var c,d=new h(b),e=n.get(a);e||n.set(a,e=[]);for(var f=0;f<e.length;f++)e[f].observer===this&&(c=e[f],c.removeTransientObservers(),c.options=d);c||(c=new j(this,a,d),e.push(c),this.nodes_.push(a))},disconnect:function(){this.nodes_.forEach(function(a){for(var b=n.get(a),c=0;c<b.length;c++){var d=b[c];if(d.observer===this){b.splice(c,1);break}}},this),this.records_=[]},takeRecords:function(){var a=this.records_;return this.records_=[],a}},j.prototype={addTransientObserver:function(a){if(a!==this.target){this.transientObservedNodes.push(a);var b=n.get(a);b||n.set(a,b=[]),b.push(this)}},removeTransientObservers:function(){var a=this.transientObservedNodes;this.transientObservedNodes=[];for(var b=0;b<a.length;b++)for(var c=a[b],d=n.get(c),e=0;e<d.length;e++)if(d[e]===this){d.splice(e,1);break}}},a.enqueueMutation=g,a.registerTransientObservers=e,a.wrappers.MutationObserver=i,a.wrappers.MutationRecord=d}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a,b){this.root=a,this.parent=b}function c(a,b){if(a.treeScope_!==b){a.treeScope_=b;for(var d=a.firstChild;d;d=d.nextSibling)c(d,b)}}function d(a){if(a.treeScope_)return a.treeScope_;var c,e=a.parentNode;return c=e?d(e):new b(a,null),a.treeScope_=c}b.prototype={get renderer(){return this.root instanceof a.wrappers.ShadowRoot?a.getRendererForHost(this.root.host):null},contains:function(a){for(;a;a=a.parent)if(a===this)return!0;return!1}},a.TreeScope=b,a.getTreeScope=d,a.setTreeScope=c}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){return a instanceof P.ShadowRoot}function c(a){var b=a.localName;return"content"===b||"shadow"===b}function d(a){return!!a.shadowRoot}function e(a){var b;return a.parentNode||(b=a.defaultView)&&O(b)||null}function f(f,g,h){if(h.length)return h.shift();if(b(f))return j(f)||f.host;var i=a.eventParentsTable.get(f);if(i){for(var k=1;k<i.length;k++)h[k-1]=i[k];return i[0]}if(g&&c(f)){var l=f.parentNode;if(l&&d(l))for(var m=a.getShadowTrees(l),n=j(g),k=0;k<m.length;k++)if(m[k].contains(n))return n}return e(f)}function g(a){for(var d=[],e=a,g=[],i=[];e;){var j=null;if(c(e)){j=h(d);var k=d[d.length-1]||e;d.push(k)}else d.length||d.push(e);var l=d[d.length-1];g.push({target:l,currentTarget:e}),b(e)&&d.pop(),e=f(e,j,i)}return g}function h(a){for(var b=a.length-1;b>=0;b--)if(!c(a[b]))return a[b];return null}function i(a,d){for(var e=[];a;){for(var g=[],i=d,j=void 0;i;){var m=null;if(g.length){if(c(i)&&(m=h(g),k(j))){var n=g[g.length-1];g.push(n)}}else g.push(i);if(l(i,a))return g[g.length-1];b(i)&&g.pop(),j=i,i=f(i,m,e)}a=b(a)?a.host:a.parentNode}}function j(b){return a.insertionParentTable.get(b)}function k(a){return j(a)}function l(a,b){return K(a)===K(b)}function m(a){return R.get(a)?void 0:(R.set(a,!0),n(O(a),O(a.target)))}function n(b,c){if(S.get(b))throw new Error("InvalidStateError");S.set(b,!0),a.renderAllPending();var d=g(c);return"load"===b.type&&2===d.length&&d[0].target instanceof P.Document&&d.shift(),$.set(b,d),o(b,d)&&p(b,d)&&q(b,d),W.set(b,t.NONE),U.delete(b,null),S.delete(b),b.defaultPrevented}function o(a,b){for(var c,d=b.length-1;d>0;d--){var e=b[d].target,f=b[d].currentTarget;if(e!==f&&(c=t.CAPTURING_PHASE,!r(b[d],a,c)))return!1}return!0}function p(a,b){var c=t.AT_TARGET;return r(b[0],a,c)}function q(a,b){for(var c,d=a.bubbles,e=1;e<b.length;e++){var f=b[e].target,g=b[e].currentTarget;if(f===g)c=t.AT_TARGET;else{if(!d||Y.get(a))continue;c=t.BUBBLING_PHASE}if(!r(b[e],a,c))return}}function r(a,b,c){var d=a.target,e=a.currentTarget,f=Q.get(e);if(!f)return!0;if("relatedTarget"in b){var g=N(b);if(g.relatedTarget){var h=O(g.relatedTarget),j=i(e,h);if(j===d)return!0;V.set(b,j)}}W.set(b,c);var k=b.type,l=!1;T.set(b,d),U.set(b,e);for(var m=0;m<f.length;m++){var n=f[m];if(n.removed)l=!0;else if(!(n.type!==k||!n.capture&&c===t.CAPTURING_PHASE||n.capture&&c===t.BUBBLING_PHASE))try{if("function"==typeof n.handler?n.handler.call(e,b):n.handler.handleEvent(b),Y.get(b))return!1}catch(o){window.onerror?window.onerror(o.message):console.error(o,o.stack)}}if(l){var p=f.slice();f.length=0;for(var m=0;m<p.length;m++)p[m].removed||f.push(p[m])}return!X.get(b)}function s(a,b,c){this.type=a,this.handler=b,this.capture=Boolean(c)}function t(a,b){return a instanceof _?void(this.impl=a):O(x(_,"Event",a,b))}function u(a){return a&&a.relatedTarget?Object.create(a,{relatedTarget:{value:N(a.relatedTarget)}}):a}function v(a,b,c){var d=window[a],e=function(b,c){return b instanceof d?void(this.impl=b):O(x(d,a,b,c))};if(e.prototype=Object.create(b.prototype),c&&L(e.prototype,c),d)try{M(d,e,new d("temp"))}catch(f){M(d,e,document.createEvent(a))}return e}function w(a,b){return function(){arguments[b]=N(arguments[b]);var c=N(this);c[a].apply(c,arguments)}}function x(a,b,c,d){if(ib)return new a(c,u(d));var e=N(document.createEvent(b)),f=hb[b],g=[c];return Object.keys(f).forEach(function(a){var b=null!=d&&a in d?d[a]:f[a];"relatedTarget"===a&&(b=N(b)),g.push(b)}),e["init"+b].apply(e,g),e}function y(){t.call(this)}function z(a){return"function"==typeof a?!0:a&&a.handleEvent}function A(a){switch(a){case"DOMAttrModified":case"DOMAttributeNameChanged":case"DOMCharacterDataModified":case"DOMElementNameChanged":case"DOMNodeInserted":case"DOMNodeInsertedIntoDocument":case"DOMNodeRemoved":case"DOMNodeRemovedFromDocument":case"DOMSubtreeModified":return!0}return!1}function B(a){this.impl=a}function C(a){return a instanceof P.ShadowRoot&&(a=a.host),N(a)}function D(a,b){var c=Q.get(a);if(c)for(var d=0;d<c.length;d++)if(!c[d].removed&&c[d].type===b)return!0;return!1}function E(a,b){for(var c=N(a);c;c=c.parentNode)if(D(O(c),b))return!0;return!1}function F(a){J(a,lb)}function G(b,c,d,e){a.renderAllPending();for(var f=O(mb.call(c.impl,d,e)),h=g(f,this),i=0;i<h.length;i++){var j=h[i];if(j.currentTarget===b)return j.target}return null}function H(a){return function(){var b=Z.get(this);return b&&b[a]&&b[a].value||null}}function I(a){var b=a.slice(2);return function(c){var d=Z.get(this);d||(d=Object.create(null),Z.set(this,d));var e=d[a];if(e&&this.removeEventListener(b,e.wrapped,!1),"function"==typeof c){var f=function(b){var d=c.call(this,b);d===!1?b.preventDefault():"onbeforeunload"===a&&"string"==typeof d&&(b.returnValue=d)};this.addEventListener(b,f,!1),d[a]={value:c,wrapped:f}}}}var J=a.forwardMethodsToWrapper,K=a.getTreeScope,L=a.mixin,M=a.registerWrapper,N=a.unwrap,O=a.wrap,P=a.wrappers,Q=(new WeakMap,new WeakMap),R=new WeakMap,S=new WeakMap,T=new WeakMap,U=new WeakMap,V=new WeakMap,W=new WeakMap,X=new WeakMap,Y=new WeakMap,Z=new WeakMap,$=new WeakMap;s.prototype={equals:function(a){return this.handler===a.handler&&this.type===a.type&&this.capture===a.capture},get removed(){return null===this.handler},remove:function(){this.handler=null}};var _=window.Event;_.prototype.polymerBlackList_={returnValue:!0,keyLocation:!0},t.prototype={get target(){return T.get(this)},get currentTarget(){return U.get(this)},get eventPhase(){return W.get(this)},get path(){var a=new P.NodeList,b=$.get(this);if(b){for(var c=0,d=b.length-1,e=K(U.get(this)),f=0;d>=f;f++){var g=b[f].currentTarget,h=K(g);h.contains(e)&&(f!==d||g instanceof P.Node)&&(a[c++]=g)}a.length=c}return a},stopPropagation:function(){X.set(this,!0)},stopImmediatePropagation:function(){X.set(this,!0),Y.set(this,!0)}},M(_,t,document.createEvent("Event"));
var ab=v("UIEvent",t),bb=v("CustomEvent",t),cb={get relatedTarget(){return V.get(this)||O(N(this).relatedTarget)}},db=L({initMouseEvent:w("initMouseEvent",14)},cb),eb=L({initFocusEvent:w("initFocusEvent",5)},cb),fb=v("MouseEvent",ab,db),gb=v("FocusEvent",ab,eb),hb=Object.create(null),ib=function(){try{new window.FocusEvent("focus")}catch(a){return!1}return!0}();if(!ib){var jb=function(a,b,c){if(c){var d=hb[c];b=L(L({},d),b)}hb[a]=b};jb("Event",{bubbles:!1,cancelable:!1}),jb("CustomEvent",{detail:null},"Event"),jb("UIEvent",{view:null,detail:0},"Event"),jb("MouseEvent",{screenX:0,screenY:0,clientX:0,clientY:0,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,button:0,relatedTarget:null},"UIEvent"),jb("FocusEvent",{relatedTarget:null},"UIEvent")}y.prototype=Object.create(t.prototype),L(y.prototype,{get returnValue(){return this.impl.returnValue},set returnValue(a){this.impl.returnValue=a}});var kb=window.EventTarget,lb=["addEventListener","removeEventListener","dispatchEvent"];[Node,Window].forEach(function(a){var b=a.prototype;lb.forEach(function(a){Object.defineProperty(b,a+"_",{value:b[a]})})}),B.prototype={addEventListener:function(a,b,c){if(z(b)&&!A(a)){var d=new s(a,b,c),e=Q.get(this);if(e){for(var f=0;f<e.length;f++)if(d.equals(e[f]))return}else e=[],Q.set(this,e);e.push(d);var g=C(this);g.addEventListener_(a,m,!0)}},removeEventListener:function(a,b,c){c=Boolean(c);var d=Q.get(this);if(d){for(var e=0,f=!1,g=0;g<d.length;g++)d[g].type===a&&d[g].capture===c&&(e++,d[g].handler===b&&(f=!0,d[g].remove()));if(f&&1===e){var h=C(this);h.removeEventListener_(a,m,!0)}}},dispatchEvent:function(b){var c=N(b),d=c.type;R.set(c,!1),a.renderAllPending();var e;E(this,d)||(e=function(){},this.addEventListener(d,e,!0));try{return N(this).dispatchEvent_(c)}finally{e&&this.removeEventListener(d,e,!0)}}},kb&&M(kb,B);var mb=document.elementFromPoint;a.adjustRelatedTarget=i,a.elementFromPoint=G,a.getEventHandlerGetter=H,a.getEventHandlerSetter=I,a.wrapEventTargetMethods=F,a.wrappers.BeforeUnloadEvent=y,a.wrappers.CustomEvent=bb,a.wrappers.Event=t,a.wrappers.EventTarget=B,a.wrappers.FocusEvent=gb,a.wrappers.MouseEvent=fb,a.wrappers.UIEvent=ab}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a,b){Object.defineProperty(a,b,{enumerable:!1})}function c(){this.length=0,b(this,"length")}function d(a){if(null==a)return a;for(var b=new c,d=0,e=a.length;e>d;d++)b[d]=f(a[d]);return b.length=e,b}function e(a,b){a.prototype[b]=function(){return d(this.impl[b].apply(this.impl,arguments))}}var f=a.wrap;c.prototype={item:function(a){return this[a]}},b(c.prototype,"item"),a.wrappers.NodeList=c,a.addWrapNodeListMethod=e,a.wrapNodeList=d}(window.ShadowDOMPolyfill),function(a){"use strict";a.wrapHTMLCollection=a.wrapNodeList,a.wrappers.HTMLCollection=a.wrappers.NodeList}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){A(a instanceof w)}function c(a){var b=new y;return b[0]=a,b.length=1,b}function d(a,b,c){C(b,"childList",{removedNodes:c,previousSibling:a.previousSibling,nextSibling:a.nextSibling})}function e(a,b){C(a,"childList",{removedNodes:b})}function f(a,b,d,e){if(a instanceof DocumentFragment){var f=h(a);N=!0;for(var g=f.length-1;g>=0;g--)a.removeChild(f[g]),f[g].parentNode_=b;N=!1;for(var g=0;g<f.length;g++)f[g].previousSibling_=f[g-1]||d,f[g].nextSibling_=f[g+1]||e;return d&&(d.nextSibling_=f[0]),e&&(e.previousSibling_=f[f.length-1]),f}var f=c(a),i=a.parentNode;return i&&i.removeChild(a),a.parentNode_=b,a.previousSibling_=d,a.nextSibling_=e,d&&(d.nextSibling_=a),e&&(e.previousSibling_=a),f}function g(a){if(a instanceof DocumentFragment)return h(a);var b=c(a),e=a.parentNode;return e&&d(a,e,b),b}function h(a){for(var b=new y,c=0,d=a.firstChild;d;d=d.nextSibling)b[c++]=d;return b.length=c,e(a,b),b}function i(a){return a}function j(a,b){I(a,b),a.nodeIsInserted_()}function k(a,b){for(var c=D(b),d=0;d<a.length;d++)j(a[d],c)}function l(a){I(a,new z(a,null))}function m(a){for(var b=0;b<a.length;b++)l(a[b])}function n(a,b){var c=a.nodeType===w.DOCUMENT_NODE?a:a.ownerDocument;c!==b.ownerDocument&&c.adoptNode(b)}function o(b,c){if(c.length){var d=b.ownerDocument;if(d!==c[0].ownerDocument)for(var e=0;e<c.length;e++)a.adoptNodeNoRemove(c[e],d)}}function p(a,b){o(a,b);var c=b.length;if(1===c)return J(b[0]);for(var d=J(a.ownerDocument.createDocumentFragment()),e=0;c>e;e++)d.appendChild(J(b[e]));return d}function q(a){if(void 0!==a.firstChild_)for(var b=a.firstChild_;b;){var c=b;b=b.nextSibling_,c.parentNode_=c.previousSibling_=c.nextSibling_=void 0}a.firstChild_=a.lastChild_=void 0}function r(a){if(a.invalidateShadowRenderer()){for(var b=a.firstChild;b;){A(b.parentNode===a);var c=b.nextSibling,d=J(b),e=d.parentNode;e&&U.call(e,d),b.previousSibling_=b.nextSibling_=b.parentNode_=null,b=c}a.firstChild_=a.lastChild_=null}else for(var c,f=J(a),g=f.firstChild;g;)c=g.nextSibling,U.call(f,g),g=c}function s(a){var b=a.parentNode;return b&&b.invalidateShadowRenderer()}function t(a){for(var b,c=0;c<a.length;c++)b=a[c],b.parentNode.removeChild(b)}function u(a,b,c){var d;if(d=K(c?O.call(c,a.impl,!1):P.call(a.impl,!1)),b){for(var e=a.firstChild;e;e=e.nextSibling)d.appendChild(u(e,!0,c));if(a instanceof M.HTMLTemplateElement)for(var f=d.content,e=a.content.firstChild;e;e=e.nextSibling)f.appendChild(u(e,!0,c))}return d}function v(a,b){if(!b||D(a)!==D(b))return!1;for(var c=b;c;c=c.parentNode)if(c===a)return!0;return!1}function w(a){A(a instanceof Q),x.call(this,a),this.parentNode_=void 0,this.firstChild_=void 0,this.lastChild_=void 0,this.nextSibling_=void 0,this.previousSibling_=void 0,this.treeScope_=void 0}var x=a.wrappers.EventTarget,y=a.wrappers.NodeList,z=a.TreeScope,A=a.assert,B=a.defineWrapGetter,C=a.enqueueMutation,D=a.getTreeScope,E=a.isWrapper,F=a.mixin,G=a.registerTransientObservers,H=a.registerWrapper,I=a.setTreeScope,J=a.unwrap,K=a.wrap,L=a.wrapIfNeeded,M=a.wrappers,N=!1,O=document.importNode,P=window.Node.prototype.cloneNode,Q=window.Node,R=window.DocumentFragment,S=(Q.prototype.appendChild,Q.prototype.compareDocumentPosition),T=Q.prototype.insertBefore,U=Q.prototype.removeChild,V=Q.prototype.replaceChild,W=/Trident/.test(navigator.userAgent),X=W?function(a,b){try{U.call(a,b)}catch(c){if(!(a instanceof R))throw c}}:function(a,b){U.call(a,b)};w.prototype=Object.create(x.prototype),F(w.prototype,{appendChild:function(a){return this.insertBefore(a,null)},insertBefore:function(a,c){b(a);var d;c?E(c)?d=J(c):(d=c,c=K(d)):(c=null,d=null),c&&A(c.parentNode===this);var e,h=c?c.previousSibling:this.lastChild,i=!this.invalidateShadowRenderer()&&!s(a);if(e=i?g(a):f(a,this,h,c),i)n(this,a),q(this),T.call(this.impl,J(a),d);else{h||(this.firstChild_=e[0]),c||(this.lastChild_=e[e.length-1]);var j=d?d.parentNode:this.impl;j?T.call(j,p(this,e),d):o(this,e)}return C(this,"childList",{addedNodes:e,nextSibling:c,previousSibling:h}),k(e,this),a},removeChild:function(a){if(b(a),a.parentNode!==this){for(var d=!1,e=(this.childNodes,this.firstChild);e;e=e.nextSibling)if(e===a){d=!0;break}if(!d)throw new Error("NotFoundError")}var f=J(a),g=a.nextSibling,h=a.previousSibling;if(this.invalidateShadowRenderer()){var i=this.firstChild,j=this.lastChild,k=f.parentNode;k&&X(k,f),i===a&&(this.firstChild_=g),j===a&&(this.lastChild_=h),h&&(h.nextSibling_=g),g&&(g.previousSibling_=h),a.previousSibling_=a.nextSibling_=a.parentNode_=void 0}else q(this),X(this.impl,f);return N||C(this,"childList",{removedNodes:c(a),nextSibling:g,previousSibling:h}),G(this,a),a},replaceChild:function(a,d){b(a);var e;if(E(d)?e=J(d):(e=d,d=K(e)),d.parentNode!==this)throw new Error("NotFoundError");var h,i=d.nextSibling,j=d.previousSibling,m=!this.invalidateShadowRenderer()&&!s(a);return m?h=g(a):(i===a&&(i=a.nextSibling),h=f(a,this,j,i)),m?(n(this,a),q(this),V.call(this.impl,J(a),e)):(this.firstChild===d&&(this.firstChild_=h[0]),this.lastChild===d&&(this.lastChild_=h[h.length-1]),d.previousSibling_=d.nextSibling_=d.parentNode_=void 0,e.parentNode&&V.call(e.parentNode,p(this,h),e)),C(this,"childList",{addedNodes:h,removedNodes:c(d),nextSibling:i,previousSibling:j}),l(d),k(h,this),d},nodeIsInserted_:function(){for(var a=this.firstChild;a;a=a.nextSibling)a.nodeIsInserted_()},hasChildNodes:function(){return null!==this.firstChild},get parentNode(){return void 0!==this.parentNode_?this.parentNode_:K(this.impl.parentNode)},get firstChild(){return void 0!==this.firstChild_?this.firstChild_:K(this.impl.firstChild)},get lastChild(){return void 0!==this.lastChild_?this.lastChild_:K(this.impl.lastChild)},get nextSibling(){return void 0!==this.nextSibling_?this.nextSibling_:K(this.impl.nextSibling)},get previousSibling(){return void 0!==this.previousSibling_?this.previousSibling_:K(this.impl.previousSibling)},get parentElement(){for(var a=this.parentNode;a&&a.nodeType!==w.ELEMENT_NODE;)a=a.parentNode;return a},get textContent(){for(var a="",b=this.firstChild;b;b=b.nextSibling)b.nodeType!=w.COMMENT_NODE&&(a+=b.textContent);return a},set textContent(a){var b=i(this.childNodes);if(this.invalidateShadowRenderer()){if(r(this),""!==a){var c=this.impl.ownerDocument.createTextNode(a);this.appendChild(c)}}else q(this),this.impl.textContent=a;var d=i(this.childNodes);C(this,"childList",{addedNodes:d,removedNodes:b}),m(b),k(d,this)},get childNodes(){for(var a=new y,b=0,c=this.firstChild;c;c=c.nextSibling)a[b++]=c;return a.length=b,a},cloneNode:function(a){return u(this,a)},contains:function(a){return v(this,L(a))},compareDocumentPosition:function(a){return S.call(this.impl,J(a))},normalize:function(){for(var a,b,c=i(this.childNodes),d=[],e="",f=0;f<c.length;f++)b=c[f],b.nodeType===w.TEXT_NODE?a||b.data.length?a?(e+=b.data,d.push(b)):a=b:this.removeNode(b):(a&&d.length&&(a.data+=e,cleanUpNodes(d)),d=[],e="",a=null,b.childNodes.length&&b.normalize());a&&d.length&&(a.data+=e,t(d))}}),B(w,"ownerDocument"),H(Q,w,document.createDocumentFragment()),delete w.prototype.querySelector,delete w.prototype.querySelectorAll,w.prototype=F(Object.create(x.prototype),w.prototype),a.cloneNode=u,a.nodeWasAdded=j,a.nodeWasRemoved=l,a.nodesWereAdded=k,a.nodesWereRemoved=m,a.snapshotNodeList=i,a.wrappers.Node=w}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a,c){for(var d,e=a.firstElementChild;e;){if(e.matches(c))return e;if(d=b(e,c))return d;e=e.nextElementSibling}return null}function c(a,b,d){for(var e=a.firstElementChild;e;)e.matches(b)&&(d[d.length++]=e),c(e,b,d),e=e.nextElementSibling;return d}var d={querySelector:function(a){return b(this,a)},querySelectorAll:function(a){return c(this,a,new NodeList)}},e={getElementsByTagName:function(a){return this.querySelectorAll(a)},getElementsByClassName:function(a){return this.querySelectorAll("."+a)},getElementsByTagNameNS:function(a,b){if("*"===a)return this.getElementsByTagName(b);for(var c=new NodeList,d=this.getElementsByTagName(b),e=0,f=0;e<d.length;e++)d[e].namespaceURI===a&&(c[f++]=d[e]);return c.length=f,c}};a.GetElementsByInterface=e,a.SelectorsInterface=d}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){for(;a&&a.nodeType!==Node.ELEMENT_NODE;)a=a.nextSibling;return a}function c(a){for(;a&&a.nodeType!==Node.ELEMENT_NODE;)a=a.previousSibling;return a}var d=a.wrappers.NodeList,e={get firstElementChild(){return b(this.firstChild)},get lastElementChild(){return c(this.lastChild)},get childElementCount(){for(var a=0,b=this.firstElementChild;b;b=b.nextElementSibling)a++;return a},get children(){for(var a=new d,b=0,c=this.firstElementChild;c;c=c.nextElementSibling)a[b++]=c;return a.length=b,a}},f={get nextElementSibling(){return b(this.nextSibling)},get previousElementSibling(){return c(this.previousSibling)}};a.ChildNodeInterface=f,a.ParentNodeInterface=e}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){d.call(this,a)}var c=a.ChildNodeInterface,d=a.wrappers.Node,e=a.enqueueMutation,f=a.mixin,g=a.registerWrapper,h=window.CharacterData;b.prototype=Object.create(d.prototype),f(b.prototype,{get textContent(){return this.data},set textContent(a){this.data=a},get data(){return this.impl.data},set data(a){var b=this.impl.data;e(this,"characterData",{oldValue:b}),this.impl.data=a}}),f(b.prototype,c),g(h,b,document.createTextNode("")),a.wrappers.CharacterData=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){return a>>>0}function c(a){d.call(this,a)}var d=a.wrappers.CharacterData,e=(a.enqueueMutation,a.mixin),f=a.registerWrapper,g=window.Text;c.prototype=Object.create(d.prototype),e(c.prototype,{splitText:function(a){a=b(a);var c=this.data;if(a>c.length)throw new Error("IndexSizeError");var d=c.slice(0,a),e=c.slice(a);this.data=d;var f=this.ownerDocument.createTextNode(e);return this.parentNode&&this.parentNode.insertBefore(f,this.nextSibling),f}}),f(g,c,document.createTextNode("")),a.wrappers.Text=c}(window.ShadowDOMPolyfill),function(a){"use strict";function b(b,c){var d=b.parentNode;if(d&&d.shadowRoot){var e=a.getRendererForHost(d);e.dependsOnAttribute(c)&&e.invalidate()}}function c(a,b,c){k(a,"attributes",{name:b,namespace:null,oldValue:c})}function d(a){h.call(this,a)}function e(a,c,d){var e=d||c;Object.defineProperty(a,c,{get:function(){return this.impl[c]},set:function(a){this.impl[c]=a,b(this,e)},configurable:!0,enumerable:!0})}var f=a.ChildNodeInterface,g=a.GetElementsByInterface,h=a.wrappers.Node,i=a.ParentNodeInterface,j=a.SelectorsInterface,k=(a.addWrapNodeListMethod,a.enqueueMutation),l=a.mixin,m=(a.oneOf,a.registerWrapper),n=a.wrappers,o=window.Element,p=["matches","mozMatchesSelector","msMatchesSelector","webkitMatchesSelector"].filter(function(a){return o.prototype[a]}),q=p[0],r=o.prototype[q];d.prototype=Object.create(h.prototype),l(d.prototype,{createShadowRoot:function(){var b=new n.ShadowRoot(this);this.impl.polymerShadowRoot_=b;var c=a.getRendererForHost(this);return c.invalidate(),b},get shadowRoot(){return this.impl.polymerShadowRoot_||null},setAttribute:function(a,d){var e=this.impl.getAttribute(a);this.impl.setAttribute(a,d),c(this,a,e),b(this,a)},removeAttribute:function(a){var d=this.impl.getAttribute(a);this.impl.removeAttribute(a),c(this,a,d),b(this,a)},matches:function(a){return r.call(this.impl,a)}}),p.forEach(function(a){"matches"!==a&&(d.prototype[a]=function(a){return this.matches(a)})}),o.prototype.webkitCreateShadowRoot&&(d.prototype.webkitCreateShadowRoot=d.prototype.createShadowRoot),e(d.prototype,"id"),e(d.prototype,"className","class"),l(d.prototype,f),l(d.prototype,g),l(d.prototype,i),l(d.prototype,j),m(o,d,document.createElementNS(null,"x")),a.matchesNames=p,a.wrappers.Element=d}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){switch(a){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case" ":return"&nbsp;"}}function c(a){return a.replace(z,b)}function d(a){return a.replace(A,b)}function e(a){for(var b={},c=0;c<a.length;c++)b[a[c]]=!0;return b}function f(a,b){switch(a.nodeType){case Node.ELEMENT_NODE:for(var e,f=a.tagName.toLowerCase(),h="<"+f,i=a.attributes,j=0;e=i[j];j++)h+=" "+e.name+'="'+c(e.value)+'"';return h+=">",B[f]?h:h+g(a)+"</"+f+">";case Node.TEXT_NODE:var k=a.data;return b&&C[b.localName]?k:d(k);case Node.COMMENT_NODE:return"<!--"+a.data+"-->";default:throw console.error(a),new Error("not implemented")}}function g(a){a instanceof y.HTMLTemplateElement&&(a=a.content);for(var b="",c=a.firstChild;c;c=c.nextSibling)b+=f(c,a);return b}function h(a,b,c){var d=c||"div";a.textContent="";var e=w(a.ownerDocument.createElement(d));e.innerHTML=b;for(var f;f=e.firstChild;)a.appendChild(x(f))}function i(a){o.call(this,a)}function j(a,b){var c=w(a.cloneNode(!1));c.innerHTML=b;for(var d,e=w(document.createDocumentFragment());d=c.firstChild;)e.appendChild(d);return x(e)}function k(b){return function(){return a.renderAllPending(),this.impl[b]}}function l(a){p(i,a,k(a))}function m(b){Object.defineProperty(i.prototype,b,{get:k(b),set:function(c){a.renderAllPending(),this.impl[b]=c},configurable:!0,enumerable:!0})}function n(b){Object.defineProperty(i.prototype,b,{value:function(){return a.renderAllPending(),this.impl[b].apply(this.impl,arguments)},configurable:!0,enumerable:!0})}var o=a.wrappers.Element,p=a.defineGetter,q=a.enqueueMutation,r=a.mixin,s=a.nodesWereAdded,t=a.nodesWereRemoved,u=a.registerWrapper,v=a.snapshotNodeList,w=a.unwrap,x=a.wrap,y=a.wrappers,z=/[&\u00A0"]/g,A=/[&\u00A0<>]/g,B=e(["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"]),C=e(["style","script","xmp","iframe","noembed","noframes","plaintext","noscript"]),D=/MSIE/.test(navigator.userAgent),E=window.HTMLElement,F=window.HTMLTemplateElement;i.prototype=Object.create(o.prototype),r(i.prototype,{get innerHTML(){return g(this)},set innerHTML(a){if(D&&C[this.localName])return void(this.textContent=a);var b=v(this.childNodes);this.invalidateShadowRenderer()?this instanceof y.HTMLTemplateElement?h(this.content,a):h(this,a,this.tagName):!F&&this instanceof y.HTMLTemplateElement?h(this.content,a):this.impl.innerHTML=a;var c=v(this.childNodes);q(this,"childList",{addedNodes:c,removedNodes:b}),t(b),s(c,this)},get outerHTML(){return f(this,this.parentNode)},set outerHTML(a){var b=this.parentNode;if(b){b.invalidateShadowRenderer();var c=j(b,a);b.replaceChild(c,this)}},insertAdjacentHTML:function(a,b){var c,d;switch(String(a).toLowerCase()){case"beforebegin":c=this.parentNode,d=this;break;case"afterend":c=this.parentNode,d=this.nextSibling;break;case"afterbegin":c=this,d=this.firstChild;break;case"beforeend":c=this,d=null;break;default:return}var e=j(c,b);c.insertBefore(e,d)}}),["clientHeight","clientLeft","clientTop","clientWidth","offsetHeight","offsetLeft","offsetTop","offsetWidth","scrollHeight","scrollWidth"].forEach(l),["scrollLeft","scrollTop"].forEach(m),["getBoundingClientRect","getClientRects","scrollIntoView"].forEach(n),u(E,i,document.createElement("b")),a.wrappers.HTMLElement=i,a.getInnerHTML=g,a.setInnerHTML=h}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=a.wrap,g=window.HTMLCanvasElement;b.prototype=Object.create(c.prototype),d(b.prototype,{getContext:function(){var a=this.impl.getContext.apply(this.impl,arguments);return a&&f(a)}}),e(g,b,document.createElement("canvas")),a.wrappers.HTMLCanvasElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=window.HTMLContentElement;b.prototype=Object.create(c.prototype),d(b.prototype,{get select(){return this.getAttribute("select")},set select(a){this.setAttribute("select",a)},setAttribute:function(a,b){c.prototype.setAttribute.call(this,a,b),"select"===String(a).toLowerCase()&&this.invalidateShadowRenderer(!0)}}),f&&e(f,b),a.wrappers.HTMLContentElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){d.call(this,a)}function c(a,b){if(!(this instanceof c))throw new TypeError("DOM object constructor cannot be called as a function.");var e=f(document.createElement("img"));d.call(this,e),g(e,this),void 0!==a&&(e.width=a),void 0!==b&&(e.height=b)}var d=a.wrappers.HTMLElement,e=a.registerWrapper,f=a.unwrap,g=a.rewrap,h=window.HTMLImageElement;b.prototype=Object.create(d.prototype),e(h,b,document.createElement("img")),c.prototype=b.prototype,a.wrappers.HTMLImageElement=b,a.wrappers.Image=c}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=window.HTMLShadowElement;b.prototype=Object.create(c.prototype),d(b.prototype,{}),f&&e(f,b),a.wrappers.HTMLShadowElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){if(!a.defaultView)return a;var b=k.get(a);if(!b){for(b=a.implementation.createHTMLDocument("");b.lastChild;)b.removeChild(b.lastChild);k.set(a,b)}return b}function c(a){for(var c,d=b(a.ownerDocument),e=h(d.createDocumentFragment());c=a.firstChild;)e.appendChild(c);return e}function d(a){if(e.call(this,a),!l){var b=c(a);j.set(this,i(b))}}var e=a.wrappers.HTMLElement,f=a.mixin,g=a.registerWrapper,h=a.unwrap,i=a.wrap,j=new WeakMap,k=new WeakMap,l=window.HTMLTemplateElement;d.prototype=Object.create(e.prototype),f(d.prototype,{get content(){return l?i(this.impl.content):j.get(this)}}),l&&g(l,d),a.wrappers.HTMLTemplateElement=d}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.registerWrapper,e=window.HTMLMediaElement;b.prototype=Object.create(c.prototype),d(e,b,document.createElement("audio")),a.wrappers.HTMLMediaElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){d.call(this,a)}function c(a){if(!(this instanceof c))throw new TypeError("DOM object constructor cannot be called as a function.");var b=f(document.createElement("audio"));d.call(this,b),g(b,this),b.setAttribute("preload","auto"),void 0!==a&&b.setAttribute("src",a)}var d=a.wrappers.HTMLMediaElement,e=a.registerWrapper,f=a.unwrap,g=a.rewrap,h=window.HTMLAudioElement;b.prototype=Object.create(d.prototype),e(h,b,document.createElement("audio")),c.prototype=b.prototype,a.wrappers.HTMLAudioElement=b,a.wrappers.Audio=c}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){return a.replace(/\s+/g," ").trim()}function c(a){e.call(this,a)}function d(a,b,c,f){if(!(this instanceof d))throw new TypeError("DOM object constructor cannot be called as a function.");var g=i(document.createElement("option"));e.call(this,g),h(g,this),void 0!==a&&(g.text=a),void 0!==b&&g.setAttribute("value",b),c===!0&&g.setAttribute("selected",""),g.selected=f===!0}var e=a.wrappers.HTMLElement,f=a.mixin,g=a.registerWrapper,h=a.rewrap,i=a.unwrap,j=a.wrap,k=window.HTMLOptionElement;c.prototype=Object.create(e.prototype),f(c.prototype,{get text(){return b(this.textContent)},set text(a){this.textContent=b(String(a))},get form(){return j(i(this).form)}}),g(k,c,document.createElement("option")),d.prototype=c.prototype,a.wrappers.HTMLOptionElement=c,a.wrappers.Option=d}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=a.unwrap,g=a.wrap,h=window.HTMLSelectElement;b.prototype=Object.create(c.prototype),d(b.prototype,{add:function(a,b){"object"==typeof b&&(b=f(b)),f(this).add(f(a),b)},remove:function(a){"object"==typeof a&&(a=f(a)),f(this).remove(a)},get form(){return g(f(this).form)}}),e(h,b,document.createElement("select")),a.wrappers.HTMLSelectElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=a.unwrap,g=a.wrap,h=a.wrapHTMLCollection,i=window.HTMLTableElement;b.prototype=Object.create(c.prototype),d(b.prototype,{get caption(){return g(f(this).caption)},createCaption:function(){return g(f(this).createCaption())},get tHead(){return g(f(this).tHead)},createTHead:function(){return g(f(this).createTHead())},createTFoot:function(){return g(f(this).createTFoot())},get tFoot(){return g(f(this).tFoot)},get tBodies(){return h(f(this).tBodies)},createTBody:function(){return g(f(this).createTBody())},get rows(){return h(f(this).rows)},insertRow:function(a){return g(f(this).insertRow(a))}}),e(i,b,document.createElement("table")),a.wrappers.HTMLTableElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=a.wrapHTMLCollection,g=a.unwrap,h=a.wrap,i=window.HTMLTableSectionElement;b.prototype=Object.create(c.prototype),d(b.prototype,{get rows(){return f(g(this).rows)},insertRow:function(a){return h(g(this).insertRow(a))}}),e(i,b,document.createElement("thead")),a.wrappers.HTMLTableSectionElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.HTMLElement,d=a.mixin,e=a.registerWrapper,f=a.wrapHTMLCollection,g=a.unwrap,h=a.wrap,i=window.HTMLTableRowElement;b.prototype=Object.create(c.prototype),d(b.prototype,{get cells(){return f(g(this).cells)},insertCell:function(a){return h(g(this).insertCell(a))}}),e(i,b,document.createElement("tr")),a.wrappers.HTMLTableRowElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){switch(a.localName){case"content":return new c(a);case"shadow":return new e(a);case"template":return new f(a)}d.call(this,a)}var c=a.wrappers.HTMLContentElement,d=a.wrappers.HTMLElement,e=a.wrappers.HTMLShadowElement,f=a.wrappers.HTMLTemplateElement,g=(a.mixin,a.registerWrapper),h=window.HTMLUnknownElement;b.prototype=Object.create(d.prototype),g(h,b),a.wrappers.HTMLUnknownElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";var b=a.registerObject,c="http://www.w3.org/2000/svg",d=document.createElementNS(c,"title"),e=b(d),f=Object.getPrototypeOf(e.prototype).constructor;a.wrappers.SVGElement=f}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){m.call(this,a)}var c=a.mixin,d=a.registerWrapper,e=a.unwrap,f=a.wrap,g=window.SVGUseElement,h="http://www.w3.org/2000/svg",i=f(document.createElementNS(h,"g")),j=document.createElementNS(h,"use"),k=i.constructor,l=Object.getPrototypeOf(k.prototype),m=l.constructor;b.prototype=Object.create(l),"instanceRoot"in j&&c(b.prototype,{get instanceRoot(){return f(e(this).instanceRoot)},get animatedInstanceRoot(){return f(e(this).animatedInstanceRoot)}}),d(g,b,j),a.wrappers.SVGUseElement=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.EventTarget,d=a.mixin,e=a.registerWrapper,f=a.wrap,g=window.SVGElementInstance;g&&(b.prototype=Object.create(c.prototype),d(b.prototype,{get correspondingElement(){return f(this.impl.correspondingElement)},get correspondingUseElement(){return f(this.impl.correspondingUseElement)},get parentNode(){return f(this.impl.parentNode)},get childNodes(){throw new Error("Not implemented")},get firstChild(){return f(this.impl.firstChild)},get lastChild(){return f(this.impl.lastChild)},get previousSibling(){return f(this.impl.previousSibling)},get nextSibling(){return f(this.impl.nextSibling)}}),e(g,b),a.wrappers.SVGElementInstance=b)}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){this.impl=a}var c=a.mixin,d=a.registerWrapper,e=a.unwrap,f=a.unwrapIfNeeded,g=a.wrap,h=window.CanvasRenderingContext2D;c(b.prototype,{get canvas(){return g(this.impl.canvas)},drawImage:function(){arguments[0]=f(arguments[0]),this.impl.drawImage.apply(this.impl,arguments)},createPattern:function(){return arguments[0]=e(arguments[0]),this.impl.createPattern.apply(this.impl,arguments)}}),d(h,b,document.createElement("canvas").getContext("2d")),a.wrappers.CanvasRenderingContext2D=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){this.impl=a}var c=a.mixin,d=a.registerWrapper,e=a.unwrapIfNeeded,f=a.wrap,g=window.WebGLRenderingContext;if(g){c(b.prototype,{get canvas(){return f(this.impl.canvas)},texImage2D:function(){arguments[5]=e(arguments[5]),this.impl.texImage2D.apply(this.impl,arguments)},texSubImage2D:function(){arguments[6]=e(arguments[6]),this.impl.texSubImage2D.apply(this.impl,arguments)}});var h=/WebKit/.test(navigator.userAgent)?{drawingBufferHeight:null,drawingBufferWidth:null}:{};d(g,b,h),a.wrappers.WebGLRenderingContext=b}}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){this.impl=a}var c=a.registerWrapper,d=a.unwrap,e=a.unwrapIfNeeded,f=a.wrap,g=window.Range;b.prototype={get startContainer(){return f(this.impl.startContainer)},get endContainer(){return f(this.impl.endContainer)},get commonAncestorContainer(){return f(this.impl.commonAncestorContainer)},setStart:function(a,b){this.impl.setStart(e(a),b)},setEnd:function(a,b){this.impl.setEnd(e(a),b)},setStartBefore:function(a){this.impl.setStartBefore(e(a))},setStartAfter:function(a){this.impl.setStartAfter(e(a))},setEndBefore:function(a){this.impl.setEndBefore(e(a))},setEndAfter:function(a){this.impl.setEndAfter(e(a))},selectNode:function(a){this.impl.selectNode(e(a))},selectNodeContents:function(a){this.impl.selectNodeContents(e(a))},compareBoundaryPoints:function(a,b){return this.impl.compareBoundaryPoints(a,d(b))},extractContents:function(){return f(this.impl.extractContents())},cloneContents:function(){return f(this.impl.cloneContents())},insertNode:function(a){this.impl.insertNode(e(a))},surroundContents:function(a){this.impl.surroundContents(e(a))},cloneRange:function(){return f(this.impl.cloneRange())},isPointInRange:function(a,b){return this.impl.isPointInRange(e(a),b)},comparePoint:function(a,b){return this.impl.comparePoint(e(a),b)},intersectsNode:function(a){return this.impl.intersectsNode(e(a))},toString:function(){return this.impl.toString()}},g.prototype.createContextualFragment&&(b.prototype.createContextualFragment=function(a){return f(this.impl.createContextualFragment(a))}),c(window.Range,b,document.createRange()),a.wrappers.Range=b}(window.ShadowDOMPolyfill),function(a){"use strict";var b=a.GetElementsByInterface,c=a.ParentNodeInterface,d=a.SelectorsInterface,e=a.mixin,f=a.registerObject,g=f(document.createDocumentFragment());e(g.prototype,c),e(g.prototype,d),e(g.prototype,b);var h=f(document.createComment(""));a.wrappers.Comment=h,a.wrappers.DocumentFragment=g}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){var b=k(a.impl.ownerDocument.createDocumentFragment());c.call(this,b),i(b,this),this.treeScope_=new d(this,g(a));var e=a.shadowRoot;m.set(this,e),l.set(this,a)}var c=a.wrappers.DocumentFragment,d=a.TreeScope,e=a.elementFromPoint,f=a.getInnerHTML,g=a.getTreeScope,h=a.mixin,i=a.rewrap,j=a.setInnerHTML,k=a.unwrap,l=new WeakMap,m=new WeakMap,n=/[ \t\n\r\f]/;b.prototype=Object.create(c.prototype),h(b.prototype,{get innerHTML(){return f(this)},set innerHTML(a){j(this,a),this.invalidateShadowRenderer()},get olderShadowRoot(){return m.get(this)||null},get host(){return l.get(this)||null},invalidateShadowRenderer:function(){return l.get(this).invalidateShadowRenderer()},elementFromPoint:function(a,b){return e(this,this.ownerDocument,a,b)},getElementById:function(a){return n.test(a)?null:this.querySelector('[id="'+a+'"]')}}),a.wrappers.ShadowRoot=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){a.previousSibling_=a.previousSibling,a.nextSibling_=a.nextSibling,a.parentNode_=a.parentNode}function c(a,c,e){var f=G(a),g=G(c),h=e?G(e):null;if(d(c),b(c),e)a.firstChild===e&&(a.firstChild_=e),e.previousSibling_=e.previousSibling;else{a.lastChild_=a.lastChild,a.lastChild===a.firstChild&&(a.firstChild_=a.firstChild);var i=H(f.lastChild);i&&(i.nextSibling_=i.nextSibling)}f.insertBefore(g,h)}function d(a){var c=G(a),d=c.parentNode;if(d){var e=H(d);b(a),a.previousSibling&&(a.previousSibling.nextSibling_=a),a.nextSibling&&(a.nextSibling.previousSibling_=a),e.lastChild===a&&(e.lastChild_=a),e.firstChild===a&&(e.firstChild_=a),d.removeChild(c)}}function e(a,b){g(b).push(a),x(a,b);var c=J.get(a);c||J.set(a,c=[]),c.push(b)}function f(a){I.set(a,[])}function g(a){var b=I.get(a);return b||I.set(a,b=[]),b}function h(a){for(var b=[],c=0,d=a.firstChild;d;d=d.nextSibling)b[c++]=d;return b}function i(a,b,c){for(var d=a.firstChild;d;d=d.nextSibling)if(b(d)){if(c(d)===!1)return}else i(d,b,c)}function j(a,b){var c=b.getAttribute("select");if(!c)return!0;if(c=c.trim(),!c)return!0;if(!(a instanceof z))return!1;if("*"===c||c===a.localName)return!0;if(!M.test(c))return!1;if(":"===c[0]&&!N.test(c))return!1;try{return a.matches(c)}catch(d){return!1}}function k(){for(var a=0;a<P.length;a++){var b=P[a],c=b.parentRenderer;c&&c.dirty||b.render()}P=[]}function l(){y=null,k()}function m(a){var b=L.get(a);return b||(b=new q(a),L.set(a,b)),b}function n(a){var b=E(a).root;return b instanceof D?b:null}function o(a){return m(a.host)}function p(a){this.skip=!1,this.node=a,this.childNodes=[]}function q(a){this.host=a,this.dirty=!1,this.invalidateAttributes(),this.associateNode(a)}function r(a){return a instanceof A}function s(a){return a instanceof A}function t(a){return a instanceof B}function u(a){return a instanceof B}function v(a){return a.shadowRoot
}function w(a){for(var b=[],c=a.shadowRoot;c;c=c.olderShadowRoot)b.push(c);return b}function x(a,b){K.set(a,b)}var y,z=a.wrappers.Element,A=a.wrappers.HTMLContentElement,B=a.wrappers.HTMLShadowElement,C=a.wrappers.Node,D=a.wrappers.ShadowRoot,E=(a.assert,a.getTreeScope),F=(a.mixin,a.oneOf),G=a.unwrap,H=a.wrap,I=new WeakMap,J=new WeakMap,K=new WeakMap,L=new WeakMap,M=/^[*.:#[a-zA-Z_|]/,N=new RegExp("^:("+["link","visited","target","enabled","disabled","checked","indeterminate","nth-child","nth-last-child","nth-of-type","nth-last-of-type","first-child","last-child","first-of-type","last-of-type","only-of-type"].join("|")+")"),O=F(window,["requestAnimationFrame","mozRequestAnimationFrame","webkitRequestAnimationFrame","setTimeout"]),P=[],Q=new ArraySplice;Q.equals=function(a,b){return G(a.node)===b},p.prototype={append:function(a){var b=new p(a);return this.childNodes.push(b),b},sync:function(a){if(!this.skip){for(var b=this.node,e=this.childNodes,f=h(G(b)),g=a||new WeakMap,i=Q.calculateSplices(e,f),j=0,k=0,l=0,m=0;m<i.length;m++){for(var n=i[m];l<n.index;l++)k++,e[j++].sync(g);for(var o=n.removed.length,p=0;o>p;p++){var q=H(f[k++]);g.get(q)||d(q)}for(var r=n.addedCount,s=f[k]&&H(f[k]),p=0;r>p;p++){var t=e[j++],u=t.node;c(b,u,s),g.set(u,!0),t.sync(g)}l+=r}for(var m=l;m<e.length;m++)e[m].sync(g)}}},q.prototype={render:function(a){if(this.dirty){this.invalidateAttributes(),this.treeComposition();var b=this.host,c=b.shadowRoot;this.associateNode(b);for(var d=!e,e=a||new p(b),f=c.firstChild;f;f=f.nextSibling)this.renderNode(c,e,f,!1);d&&e.sync(),this.dirty=!1}},get parentRenderer(){return E(this.host).renderer},invalidate:function(){if(!this.dirty){if(this.dirty=!0,P.push(this),y)return;y=window[O](l,0)}},renderNode:function(a,b,c,d){if(v(c)){b=b.append(c);var e=m(c);e.dirty=!0,e.render(b)}else r(c)?this.renderInsertionPoint(a,b,c,d):t(c)?this.renderShadowInsertionPoint(a,b,c):this.renderAsAnyDomTree(a,b,c,d)},renderAsAnyDomTree:function(a,b,c,d){if(b=b.append(c),v(c)){var e=m(c);b.skip=!e.dirty,e.render(b)}else for(var f=c.firstChild;f;f=f.nextSibling)this.renderNode(a,b,f,d)},renderInsertionPoint:function(a,b,c,d){var e=g(c);if(e.length){this.associateNode(c);for(var f=0;f<e.length;f++){var h=e[f];r(h)&&d?this.renderInsertionPoint(a,b,h,d):this.renderAsAnyDomTree(a,b,h,d)}}else this.renderFallbackContent(a,b,c);this.associateNode(c.parentNode)},renderShadowInsertionPoint:function(a,b,c){var d=a.olderShadowRoot;if(d){x(d,c),this.associateNode(c.parentNode);for(var e=d.firstChild;e;e=e.nextSibling)this.renderNode(d,b,e,!0)}else this.renderFallbackContent(a,b,c)},renderFallbackContent:function(a,b,c){this.associateNode(c),this.associateNode(c.parentNode);for(var d=c.firstChild;d;d=d.nextSibling)this.renderAsAnyDomTree(a,b,d,!1)},invalidateAttributes:function(){this.attributes=Object.create(null)},updateDependentAttributes:function(a){if(a){var b=this.attributes;/\.\w+/.test(a)&&(b["class"]=!0),/#\w+/.test(a)&&(b.id=!0),a.replace(/\[\s*([^\s=\|~\]]+)/g,function(a,c){b[c]=!0})}},dependsOnAttribute:function(a){return this.attributes[a]},distribute:function(a,b){var c=this;i(a,s,function(a){f(a),c.updateDependentAttributes(a.getAttribute("select"));for(var d=0;d<b.length;d++){var g=b[d];void 0!==g&&j(g,a)&&(e(g,a),b[d]=void 0)}})},treeComposition:function(){for(var a=this.host,b=a.shadowRoot,c=[],d=a.firstChild;d;d=d.nextSibling)if(r(d)){var e=g(d);e&&e.length||(e=h(d)),c.push.apply(c,e)}else c.push(d);for(var f,j;b;){if(f=void 0,i(b,u,function(a){return f=a,!1}),j=f,this.distribute(b,c),j){var k=b.olderShadowRoot;if(k){b=k,x(b,j);continue}break}break}},associateNode:function(a){a.impl.polymerShadowRenderer_=this}},C.prototype.invalidateShadowRenderer=function(){var a=this.impl.polymerShadowRenderer_;return a?(a.invalidate(),!0):!1},A.prototype.getDistributedNodes=function(){return k(),g(this)},B.prototype.nodeIsInserted_=A.prototype.nodeIsInserted_=function(){this.invalidateShadowRenderer();var a,b=n(this);b&&(a=o(b)),this.impl.polymerShadowRenderer_=a,a&&a.invalidate()},a.eventParentsTable=J,a.getRendererForHost=m,a.getShadowTrees=w,a.insertionParentTable=K,a.renderAllPending=k,a.visual={insertBefore:c,remove:d}}(window.ShadowDOMPolyfill),function(a){"use strict";function b(b){if(window[b]){d(!a.wrappers[b]);var i=function(a){c.call(this,a)};i.prototype=Object.create(c.prototype),e(i.prototype,{get form(){return h(g(this).form)}}),f(window[b],i,document.createElement(b.slice(4,-7))),a.wrappers[b]=i}}var c=a.wrappers.HTMLElement,d=a.assert,e=a.mixin,f=a.registerWrapper,g=a.unwrap,h=a.wrap,i=["HTMLButtonElement","HTMLFieldSetElement","HTMLInputElement","HTMLKeygenElement","HTMLLabelElement","HTMLLegendElement","HTMLObjectElement","HTMLOutputElement","HTMLTextAreaElement"];i.forEach(b)}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){this.impl=a}{var c=a.registerWrapper,d=a.unwrap,e=a.unwrapIfNeeded,f=a.wrap;window.Selection}b.prototype={get anchorNode(){return f(this.impl.anchorNode)},get focusNode(){return f(this.impl.focusNode)},addRange:function(a){this.impl.addRange(d(a))},collapse:function(a,b){this.impl.collapse(e(a),b)},containsNode:function(a,b){return this.impl.containsNode(e(a),b)},extend:function(a,b){this.impl.extend(e(a),b)},getRangeAt:function(a){return f(this.impl.getRangeAt(a))},removeRange:function(a){this.impl.removeRange(d(a))},selectAllChildren:function(a){this.impl.selectAllChildren(e(a))},toString:function(){return this.impl.toString()}},c(window.Selection,b,window.getSelection()),a.wrappers.Selection=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){k.call(this,a),this.treeScope_=new p(this,null)}function c(a){var c=document[a];b.prototype[a]=function(){return A(c.apply(this.impl,arguments))}}function d(a,b){D.call(b.impl,z(a)),e(a,b)}function e(a,b){a.shadowRoot&&b.adoptNode(a.shadowRoot),a instanceof o&&f(a,b);for(var c=a.firstChild;c;c=c.nextSibling)e(c,b)}function f(a,b){var c=a.olderShadowRoot;c&&b.adoptNode(c)}function g(a){this.impl=a}function h(a,b){var c=document.implementation[b];a.prototype[b]=function(){return A(c.apply(this.impl,arguments))}}function i(a,b){var c=document.implementation[b];a.prototype[b]=function(){return c.apply(this.impl,arguments)}}var j=a.GetElementsByInterface,k=a.wrappers.Node,l=a.ParentNodeInterface,m=a.wrappers.Selection,n=a.SelectorsInterface,o=a.wrappers.ShadowRoot,p=a.TreeScope,q=a.cloneNode,r=a.defineWrapGetter,s=a.elementFromPoint,t=a.forwardMethodsToWrapper,u=a.matchesNames,v=a.mixin,w=a.registerWrapper,x=a.renderAllPending,y=a.rewrap,z=a.unwrap,A=a.wrap,B=a.wrapEventTargetMethods,C=(a.wrapNodeList,new WeakMap);b.prototype=Object.create(k.prototype),r(b,"documentElement"),r(b,"body"),r(b,"head"),["createComment","createDocumentFragment","createElement","createElementNS","createEvent","createEventNS","createRange","createTextNode","getElementById"].forEach(c);var D=document.adoptNode,E=document.getSelection;if(v(b.prototype,{adoptNode:function(a){return a.parentNode&&a.parentNode.removeChild(a),d(a,this),a},elementFromPoint:function(a,b){return s(this,this,a,b)},importNode:function(a,b){return q(a,b,this.impl)},getSelection:function(){return x(),new m(E.call(z(this)))}}),document.registerElement){var F=document.registerElement;b.prototype.registerElement=function(b,c){function d(a){return a?void(this.impl=a):c.extends?document.createElement(c.extends,b):document.createElement(b)}var e=c.prototype;if(a.nativePrototypeTable.get(e))throw new Error("NotSupportedError");for(var f,g=Object.getPrototypeOf(e),h=[];g&&!(f=a.nativePrototypeTable.get(g));)h.push(g),g=Object.getPrototypeOf(g);if(!f)throw new Error("NotSupportedError");for(var i=Object.create(f),j=h.length-1;j>=0;j--)i=Object.create(i);["createdCallback","attachedCallback","detachedCallback","attributeChangedCallback"].forEach(function(a){var b=e[a];b&&(i[a]=function(){A(this)instanceof d||y(this),b.apply(A(this),arguments)})});var k={prototype:i};c.extends&&(k.extends=c.extends),d.prototype=e,d.prototype.constructor=d,a.constructorTable.set(i,d),a.nativePrototypeTable.set(e,i);F.call(z(this),b,k);return d},t([window.HTMLDocument||window.Document],["registerElement"])}t([window.HTMLBodyElement,window.HTMLDocument||window.Document,window.HTMLHeadElement,window.HTMLHtmlElement],["appendChild","compareDocumentPosition","contains","getElementsByClassName","getElementsByTagName","getElementsByTagNameNS","insertBefore","querySelector","querySelectorAll","removeChild","replaceChild"].concat(u)),t([window.HTMLDocument||window.Document],["adoptNode","importNode","contains","createComment","createDocumentFragment","createElement","createElementNS","createEvent","createEventNS","createRange","createTextNode","elementFromPoint","getElementById","getSelection"]),v(b.prototype,j),v(b.prototype,l),v(b.prototype,n),v(b.prototype,{get implementation(){var a=C.get(this);return a?a:(a=new g(z(this).implementation),C.set(this,a),a)}}),w(window.Document,b,document.implementation.createHTMLDocument("")),window.HTMLDocument&&w(window.HTMLDocument,b),B([window.HTMLBodyElement,window.HTMLDocument||window.Document,window.HTMLHeadElement]),h(g,"createDocumentType"),h(g,"createDocument"),h(g,"createHTMLDocument"),i(g,"hasFeature"),w(window.DOMImplementation,g),t([window.DOMImplementation],["createDocumentType","createDocument","createHTMLDocument","hasFeature"]),a.adoptNodeNoRemove=d,a.wrappers.DOMImplementation=g,a.wrappers.Document=b}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){c.call(this,a)}var c=a.wrappers.EventTarget,d=a.wrappers.Selection,e=a.mixin,f=a.registerWrapper,g=a.renderAllPending,h=a.unwrap,i=a.unwrapIfNeeded,j=a.wrap,k=window.Window,l=window.getComputedStyle,m=window.getSelection;b.prototype=Object.create(c.prototype),k.prototype.getComputedStyle=function(a,b){return j(this||window).getComputedStyle(i(a),b)},k.prototype.getSelection=function(){return j(this||window).getSelection()},delete window.getComputedStyle,delete window.getSelection,["addEventListener","removeEventListener","dispatchEvent"].forEach(function(a){k.prototype[a]=function(){var b=j(this||window);return b[a].apply(b,arguments)},delete window[a]}),e(b.prototype,{getComputedStyle:function(a,b){return g(),l.call(h(this),i(a),b)},getSelection:function(){return g(),new d(m.call(h(this)))}}),f(k,b),a.wrappers.Window=b}(window.ShadowDOMPolyfill),function(a){"use strict";var b=a.unwrap,c=window.DataTransfer||window.Clipboard,d=c.prototype.setDragImage;c.prototype.setDragImage=function(a,c,e){d.call(this,b(a),c,e)}}(window.ShadowDOMPolyfill),function(a){"use strict";function b(a){var b=c[a],d=window[b];if(d){var e=document.createElement(a),f=e.constructor;window[b]=f}}var c=(a.isWrapperFor,{a:"HTMLAnchorElement",area:"HTMLAreaElement",audio:"HTMLAudioElement",base:"HTMLBaseElement",body:"HTMLBodyElement",br:"HTMLBRElement",button:"HTMLButtonElement",canvas:"HTMLCanvasElement",caption:"HTMLTableCaptionElement",col:"HTMLTableColElement",content:"HTMLContentElement",data:"HTMLDataElement",datalist:"HTMLDataListElement",del:"HTMLModElement",dir:"HTMLDirectoryElement",div:"HTMLDivElement",dl:"HTMLDListElement",embed:"HTMLEmbedElement",fieldset:"HTMLFieldSetElement",font:"HTMLFontElement",form:"HTMLFormElement",frame:"HTMLFrameElement",frameset:"HTMLFrameSetElement",h1:"HTMLHeadingElement",head:"HTMLHeadElement",hr:"HTMLHRElement",html:"HTMLHtmlElement",iframe:"HTMLIFrameElement",img:"HTMLImageElement",input:"HTMLInputElement",keygen:"HTMLKeygenElement",label:"HTMLLabelElement",legend:"HTMLLegendElement",li:"HTMLLIElement",link:"HTMLLinkElement",map:"HTMLMapElement",marquee:"HTMLMarqueeElement",menu:"HTMLMenuElement",menuitem:"HTMLMenuItemElement",meta:"HTMLMetaElement",meter:"HTMLMeterElement",object:"HTMLObjectElement",ol:"HTMLOListElement",optgroup:"HTMLOptGroupElement",option:"HTMLOptionElement",output:"HTMLOutputElement",p:"HTMLParagraphElement",param:"HTMLParamElement",pre:"HTMLPreElement",progress:"HTMLProgressElement",q:"HTMLQuoteElement",script:"HTMLScriptElement",select:"HTMLSelectElement",shadow:"HTMLShadowElement",source:"HTMLSourceElement",span:"HTMLSpanElement",style:"HTMLStyleElement",table:"HTMLTableElement",tbody:"HTMLTableSectionElement",template:"HTMLTemplateElement",textarea:"HTMLTextAreaElement",thead:"HTMLTableSectionElement",time:"HTMLTimeElement",title:"HTMLTitleElement",tr:"HTMLTableRowElement",track:"HTMLTrackElement",ul:"HTMLUListElement",video:"HTMLVideoElement"});Object.keys(c).forEach(b),Object.getOwnPropertyNames(a.wrappers).forEach(function(b){window[b]=a.wrappers[b]})}(window.ShadowDOMPolyfill),function(){window.wrap=ShadowDOMPolyfill.wrapIfNeeded,window.unwrap=ShadowDOMPolyfill.unwrapIfNeeded,Object.defineProperty(Element.prototype,"webkitShadowRoot",Object.getOwnPropertyDescriptor(Element.prototype,"shadowRoot"));var a=Element.prototype.createShadowRoot;Element.prototype.createShadowRoot=function(){var b=a.call(this);return CustomElements.watchShadow(this),b},Element.prototype.webkitCreateShadowRoot=Element.prototype.createShadowRoot}(),function(a){function b(a,b){var c="";return Array.prototype.forEach.call(a,function(a){c+=a.textContent+"\n\n"}),b||(c=c.replace(l,"")),c}function c(a){var b=document.createElement("style");return b.textContent=a,b}function d(a){var b=c(a);document.head.appendChild(b);var d=[];if(b.sheet)try{d=b.sheet.cssRules}catch(e){}else console.warn("sheet not found",b);return b.parentNode.removeChild(b),d}function e(){v.initialized=!0,document.body.appendChild(v);var a=v.contentDocument,b=a.createElement("base");b.href=document.baseURI,a.head.appendChild(b)}function f(a){v.initialized||e(),document.body.appendChild(v),a(v.contentDocument),document.body.removeChild(v)}function g(a,b){if(b){var e;if(a.match("@import")&&x){var g=c(a);f(function(a){a.head.appendChild(g.impl),e=g.sheet.cssRules,b(e)})}else e=d(a),b(e)}}function h(a){a&&j().appendChild(document.createTextNode(a))}function i(a,b){var d=c(a);d.setAttribute(b,""),d.setAttribute(z,""),document.head.appendChild(d)}function j(){return w||(w=document.createElement("style"),w.setAttribute(z,""),w[z]=!0),w}var k={strictStyling:!1,registry:{},shimStyling:function(a,c,d){var e=this.prepareRoot(a,c,d),f=this.isTypeExtension(d),g=this.makeScopeSelector(c,f),h=b(e,!0);h=this.scopeCssText(h,g),a&&(a.shimmedStyle=h),this.addCssToDocument(h,c)},shimStyle:function(a,b){return this.shimCssText(a.textContent,b)},shimCssText:function(a,b){return a=this.insertDirectives(a),this.scopeCssText(a,b)},makeScopeSelector:function(a,b){return a?b?"[is="+a+"]":a:""},isTypeExtension:function(a){return a&&a.indexOf("-")<0},prepareRoot:function(a,b,c){var d=this.registerRoot(a,b,c);return this.replaceTextInStyles(d.rootStyles,this.insertDirectives),this.removeStyles(a,d.rootStyles),this.strictStyling&&this.applyScopeToContent(a,b),d.scopeStyles},removeStyles:function(a,b){for(var c,d=0,e=b.length;e>d&&(c=b[d]);d++)c.parentNode.removeChild(c)},registerRoot:function(a,b,c){var d=this.registry[b]={root:a,name:b,extendsName:c},e=this.findStyles(a);d.rootStyles=e,d.scopeStyles=d.rootStyles;var f=this.registry[d.extendsName];return!f||a&&!a.querySelector("shadow")||(d.scopeStyles=f.scopeStyles.concat(d.scopeStyles)),d},findStyles:function(a){if(!a)return[];var b=a.querySelectorAll("style");return Array.prototype.filter.call(b,function(a){return!a.hasAttribute(A)})},applyScopeToContent:function(a,b){a&&(Array.prototype.forEach.call(a.querySelectorAll("*"),function(a){a.setAttribute(b,"")}),Array.prototype.forEach.call(a.querySelectorAll("template"),function(a){this.applyScopeToContent(a.content,b)},this))},insertDirectives:function(a){return a=this.insertPolyfillDirectivesInCssText(a),this.insertPolyfillRulesInCssText(a)},insertPolyfillDirectivesInCssText:function(a){return a=a.replace(m,function(a,b){return b.slice(0,-2)+"{"}),a.replace(n,function(a,b){return b+" {"})},insertPolyfillRulesInCssText:function(a){return a=a.replace(o,function(a,b){return b.slice(0,-1)}),a.replace(p,function(a,b,c,d){var e=a.replace(b,"").replace(c,"");return d+e})},scopeCssText:function(a,b){var c=this.extractUnscopedRulesFromCssText(a);if(a=this.insertPolyfillHostInCssText(a),a=this.convertColonHost(a),a=this.convertColonAncestor(a),a=this.convertCombinators(a),b){var a,d=this;g(a,function(c){a=d.scopeRules(c,b)})}return a=a+"\n"+c,a.trim()},extractUnscopedRulesFromCssText:function(a){for(var b,c="";b=q.exec(a);)c+=b[1].slice(0,-1)+"\n\n";for(;b=r.exec(a);)c+=b[0].replace(b[2],"").replace(b[1],b[3])+"\n\n";return c},convertColonHost:function(a){return this.convertColonRule(a,cssColonHostRe,this.colonHostPartReplacer)},convertColonAncestor:function(a){return this.convertColonRule(a,cssColonAncestorRe,this.colonAncestorPartReplacer)},convertColonRule:function(a,b,c){return a.replace(b,function(a,b,d,e){if(b=polyfillHostNoCombinator,d){for(var f,g=d.split(","),h=[],i=0,j=g.length;j>i&&(f=g[i]);i++)f=f.trim(),h.push(c(b,f,e));return h.join(",")}return b+e})},colonAncestorPartReplacer:function(a,b,c){return b.match(s)?this.colonHostPartReplacer(a,b,c):a+b+c+", "+b+" "+a+c},colonHostPartReplacer:function(a,b,c){return a+b.replace(s,"")+c},convertCombinators:function(a){for(var b=0;b<combinatorsRe.length;b++)a=a.replace(combinatorsRe[b]," ");return a},scopeRules:function(a,b){var c="";return a&&Array.prototype.forEach.call(a,function(a){a.selectorText&&a.style&&a.style.cssText?(c+=this.scopeSelector(a.selectorText,b,this.strictStyling)+" {\n	",c+=this.propertiesFromRule(a)+"\n}\n\n"):a.type===CSSRule.MEDIA_RULE?(c+="@media "+a.media.mediaText+" {\n",c+=this.scopeRules(a.cssRules,b),c+="\n}\n\n"):a.cssText&&(c+=a.cssText+"\n\n")},this),c},scopeSelector:function(a,b,c){var d=[],e=a.split(",");return e.forEach(function(a){a=a.trim(),this.selectorNeedsScoping(a,b)&&(a=c&&!a.match(polyfillHostNoCombinator)?this.applyStrictSelectorScope(a,b):this.applySimpleSelectorScope(a,b)),d.push(a)},this),d.join(", ")},selectorNeedsScoping:function(a,b){var c=this.makeScopeMatcher(b);return!a.match(c)},makeScopeMatcher:function(a){return a=a.replace(/\[/g,"\\[").replace(/\[/g,"\\]"),new RegExp("^("+a+")"+selectorReSuffix,"m")},applySimpleSelectorScope:function(a,b){return a.match(polyfillHostRe)?(a=a.replace(polyfillHostNoCombinator,b),a.replace(polyfillHostRe,b+" ")):b+" "+a},applyStrictSelectorScope:function(a,b){b=b.replace(/\[is=([^\]]*)\]/g,"$1");var c=[" ",">","+","~"],d=a,e="["+b+"]";return c.forEach(function(a){var b=d.split(a);d=b.map(function(a){var b=a.trim().replace(polyfillHostRe,"");return b&&c.indexOf(b)<0&&b.indexOf(e)<0&&(a=b.replace(/([^:]*)(:*)(.*)/,"$1"+e+"$2$3")),a}).join(a)}),d},insertPolyfillHostInCssText:function(a){return a.replace(hostRe,s).replace(colonHostRe,s).replace(colonAncestorRe,t)},propertiesFromRule:function(a){return a.style.content&&!a.style.content.match(/['"]+/)?a.style.cssText.replace(/content:[^;]*;/g,"content: '"+a.style.content+"';"):a.style.cssText},replaceTextInStyles:function(a,b){a&&b&&(a instanceof Array||(a=[a]),Array.prototype.forEach.call(a,function(a){a.textContent=b.call(this,a.textContent)},this))},addCssToDocument:function(a,b){a.match("@import")?i(a,b):h(a)}},l=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,m=/\/\*\s*@polyfill ([^*]*\*+([^/*][^*]*\*+)*\/)([^{]*?){/gim,n=/polyfill-next-selector[^}]*content\:[\s]*'([^']*)'[^}]*}([^{]*?){/gim,o=/\/\*\s@polyfill-rule([^*]*\*+([^/*][^*]*\*+)*)\//gim,p=/(polyfill-rule)[^}]*(content\:[\s]*'([^']*)'[^;]*;)[^}]*}/gim,q=/\/\*\s@polyfill-unscoped-rule([^*]*\*+([^/*][^*]*\*+)*)\//gim,r=/(polyfill-unscoped-rule)[^}]*(content\:[\s]*'([^']*)'[^;]*;)[^}]*}/gim,s="-shadowcsshost",t="-shadowcssancestor",u=")(?:\\(((?:\\([^)(]*\\)|[^)(]*)+?)\\))?([^,{]*)";cssColonHostRe=new RegExp("("+s+u,"gim"),cssColonAncestorRe=new RegExp("("+t+u,"gim"),selectorReSuffix="([>\\s~+[.,{:][\\s\\S]*)?$",hostRe=/@host/gim,colonHostRe=/\:host/gim,colonAncestorRe=/\:ancestor/gim,polyfillHostNoCombinator=s+"-no-combinator",polyfillHostRe=new RegExp(s,"gim"),polyfillAncestorRe=new RegExp(t,"gim"),combinatorsRe=[/\^\^/g,/\^/g,/\/shadow\//g,/\/shadow-deep\//g];var v=document.createElement("iframe");v.style.display="none";var w,x=navigator.userAgent.match("Chrome"),y="shim-shadowdom",z="shim-shadowdom-css",A="no-shim";if(window.ShadowDOMPolyfill){h("style { display: none !important; }\n");var B=wrap(document),C=B.querySelector("head");C.insertBefore(j(),C.childNodes[0]),document.addEventListener("DOMContentLoaded",function(){var b=a.urlResolver;if(window.HTMLImports&&!HTMLImports.useNative){var c="link[rel=stylesheet]["+y+"]",d="style["+y+"]";HTMLImports.importer.documentPreloadSelectors+=","+c,HTMLImports.importer.importsPreloadSelectors+=","+c,HTMLImports.parser.documentSelectors=[HTMLImports.parser.documentSelectors,c,d].join(",");var e=HTMLImports.parser.parseGeneric;HTMLImports.parser.parseGeneric=function(a){if(!a[z]){var c=a.__importElement||a;if(!c.hasAttribute(y))return void e.call(this,a);a.__resource?(c=a.ownerDocument.createElement("style"),c.textContent=b.resolveCssText(a.__resource,a.href)):b.resolveStyle(c),c.textContent=k.shimStyle(c),c.removeAttribute(y,""),c.setAttribute(z,""),c[z]=!0,c.parentNode!==C&&(a.parentNode===C?C.replaceChild(c,a):C.appendChild(c)),c.__importParsed=!0,this.markParsingComplete(a)}};var f=HTMLImports.parser.hasResource;HTMLImports.parser.hasResource=function(a){return"link"===a.localName&&"stylesheet"===a.rel&&a.hasAttribute(y)?a.__resource:f.call(this,a)}}})}a.ShadowCSS=k}(window.Platform)):!function(){window.templateContent=window.templateContent||function(a){return a.content},window.wrap=window.unwrap=function(a){return a};var a=Element.prototype.webkitCreateShadowRoot;Element.prototype.webkitCreateShadowRoot=function(){var b=this.webkitShadowRoot,c=a.call(this);return c.olderShadowRoot=b,c.host=this,CustomElements.watchShadow(this),c},Object.defineProperties(Element.prototype,{shadowRoot:{get:function(){return this.webkitShadowRoot}},createShadowRoot:{value:function(){return this.webkitCreateShadowRoot()}}}),window.templateContent=function(a){if(window.HTMLTemplateElement&&HTMLTemplateElement.bootstrap&&HTMLTemplateElement.bootstrap(a),!a.content&&!a._content){for(var b=document.createDocumentFragment();a.firstChild;)b.appendChild(a.firstChild);a._content=b}return a.content||a._content}}(),function(a){"use strict";function b(a){return void 0!==m[a]}function c(){h.call(this),this._isInvalid=!0}function d(a){return""==a&&c.call(this),a.toLowerCase()}function e(a){var b=a.charCodeAt(0);return b>32&&127>b&&-1==[34,35,60,62,63,96].indexOf(b)?a:encodeURIComponent(a)}function f(a){var b=a.charCodeAt(0);return b>32&&127>b&&-1==[34,35,60,62,96].indexOf(b)?a:encodeURIComponent(a)}function g(a,g,h){function i(a){t.push(a)}var j=g||"scheme start",k=0,l="",r=!1,s=!1,t=[];a:for(;(a[k-1]!=o||0==k)&&!this._isInvalid;){var u=a[k];switch(j){case"scheme start":if(!u||!p.test(u)){if(g){i("Invalid scheme.");break a}l="",j="no scheme";continue}l+=u.toLowerCase(),j="scheme";break;case"scheme":if(u&&q.test(u))l+=u.toLowerCase();else{if(":"!=u){if(g){if(o==u)break a;i("Code point not allowed in scheme: "+u);break a}l="",k=0,j="no scheme";continue}if(this._scheme=l,l="",g)break a;b(this._scheme)&&(this._isRelative=!0),j="file"==this._scheme?"relative":this._isRelative&&h&&h._scheme==this._scheme?"relative or authority":this._isRelative?"authority first slash":"scheme data"}break;case"scheme data":"?"==u?(query="?",j="query"):"#"==u?(this._fragment="#",j="fragment"):o!=u&&"	"!=u&&"\n"!=u&&"\r"!=u&&(this._schemeData+=e(u));break;case"no scheme":if(h&&b(h._scheme)){j="relative";continue}i("Missing scheme."),c.call(this);break;case"relative or authority":if("/"!=u||"/"!=a[k+1]){i("Expected /, got: "+u),j="relative";continue}j="authority ignore slashes";break;case"relative":if(this._isRelative=!0,"file"!=this._scheme&&(this._scheme=h._scheme),o==u){this._host=h._host,this._port=h._port,this._path=h._path.slice(),this._query=h._query;break a}if("/"==u||"\\"==u)"\\"==u&&i("\\ is an invalid code point."),j="relative slash";else if("?"==u)this._host=h._host,this._port=h._port,this._path=h._path.slice(),this._query="?",j="query";else{if("#"!=u){var v=a[k+1],w=a[k+2];("file"!=this._scheme||!p.test(u)||":"!=v&&"|"!=v||o!=w&&"/"!=w&&"\\"!=w&&"?"!=w&&"#"!=w)&&(this._host=h._host,this._port=h._port,this._path=h._path.slice(),this._path.pop()),j="relative path";continue}this._host=h._host,this._port=h._port,this._path=h._path.slice(),this._query=h._query,this._fragment="#",j="fragment"}break;case"relative slash":if("/"!=u&&"\\"!=u){"file"!=this._scheme&&(this._host=h._host,this._port=h._port),j="relative path";continue}"\\"==u&&i("\\ is an invalid code point."),j="file"==this._scheme?"file host":"authority ignore slashes";break;case"authority first slash":if("/"!=u){i("Expected '/', got: "+u),j="authority ignore slashes";continue}j="authority second slash";break;case"authority second slash":if(j="authority ignore slashes","/"!=u){i("Expected '/', got: "+u);continue}break;case"authority ignore slashes":if("/"!=u&&"\\"!=u){j="authority";continue}i("Expected authority, got: "+u);break;case"authority":if("@"==u){r&&(i("@ already seen."),l+="%40"),r=!0;for(var x=0;x<l.length;x++){var y=l[x];if("	"!=y&&"\n"!=y&&"\r"!=y)if(":"!=y||null!==this._password){var z=e(y);null!==this._password?this._password+=z:this._username+=z}else this._password="";else i("Invalid whitespace in authority.")}l=""}else{if(o==u||"/"==u||"\\"==u||"?"==u||"#"==u){k-=l.length,l="",j="host";continue}l+=u}break;case"file host":if(o==u||"/"==u||"\\"==u||"?"==u||"#"==u){2!=l.length||!p.test(l[0])||":"!=l[1]&&"|"!=l[1]?0==l.length?j="relative path start":(this._host=d.call(this,l),l="",j="relative path start"):j="relative path";continue}"	"==u||"\n"==u||"\r"==u?i("Invalid whitespace in file host."):l+=u;break;case"host":case"hostname":if(":"!=u||s){if(o==u||"/"==u||"\\"==u||"?"==u||"#"==u){if(this._host=d.call(this,l),l="",j="relative path start",g)break a;continue}"	"!=u&&"\n"!=u&&"\r"!=u?("["==u?s=!0:"]"==u&&(s=!1),l+=u):i("Invalid code point in host/hostname: "+u)}else if(this._host=d.call(this,l),l="",j="port","hostname"==g)break a;break;case"port":if(/[0-9]/.test(u))l+=u;else{if(o==u||"/"==u||"\\"==u||"?"==u||"#"==u||g){if(""!=l){var A=parseInt(l,10);A!=m[this._scheme]&&(this._port=A+""),l=""}if(g)break a;j="relative path start";continue}"	"==u||"\n"==u||"\r"==u?i("Invalid code point in port: "+u):c.call(this)}break;case"relative path start":if("\\"==u&&i("'\\' not allowed in path."),j="relative path","/"!=u&&"\\"!=u)continue;break;case"relative path":if(o!=u&&"/"!=u&&"\\"!=u&&(g||"?"!=u&&"#"!=u))"	"!=u&&"\n"!=u&&"\r"!=u&&(l+=e(u));else{"\\"==u&&i("\\ not allowed in relative path.");var B;(B=n[l.toLowerCase()])&&(l=B),".."==l?(this._path.pop(),"/"!=u&&"\\"!=u&&this._path.push("")):"."==l&&"/"!=u&&"\\"!=u?this._path.push(""):"."!=l&&("file"==this._scheme&&0==this._path.length&&2==l.length&&p.test(l[0])&&"|"==l[1]&&(l=l[0]+":"),this._path.push(l)),l="","?"==u?(this._query="?",j="query"):"#"==u&&(this._fragment="#",j="fragment")}break;case"query":g||"#"!=u?o!=u&&"	"!=u&&"\n"!=u&&"\r"!=u&&(this._query+=f(u)):(this._fragment="#",j="fragment");break;case"fragment":o!=u&&"	"!=u&&"\n"!=u&&"\r"!=u&&(this._fragment+=u)}k++}}function h(){this._scheme="",this._schemeData="",this._username="",this._password=null,this._host="",this._port="",this._path=[],this._query="",this._fragment="",this._isInvalid=!1,this._isRelative=!1}function i(a,b){void 0===b||b instanceof i||(b=new i(String(b))),this._url=a,h.call(this);var c=a.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g,"");g.call(this,c,null,b)}var j=!1;if(!a.forceJURL)try{var k=new URL("b","http://a");j="http://a/b"===k.href}catch(l){}if(!j){var m=Object.create(null);m.ftp=21,m.file=0,m.gopher=70,m.http=80,m.https=443,m.ws=80,m.wss=443;var n=Object.create(null);n["%2e"]=".",n[".%2e"]="..",n["%2e."]="..",n["%2e%2e"]="..";var o=void 0,p=/[a-zA-Z]/,q=/[a-zA-Z0-9\+\-\.]/;i.prototype={get href(){if(this._isInvalid)return this._url;var a="";return(""!=this._username||null!=this._password)&&(a=this._username+(null!=this._password?":"+this._password:"")+"@"),this.protocol+(this._isRelative?"//"+a+this.host:"")+this.pathname+this._query+this._fragment},set href(a){h.call(this),g.call(this,a)},get protocol(){return this._scheme+":"},set protocol(a){this._isInvalid||g.call(this,a+":","scheme start")},get host(){return this._isInvalid?"":this._port?this._host+":"+this._port:this._host},set host(a){!this._isInvalid&&this._isRelative&&g.call(this,a,"host")},get hostname(){return this._host},set hostname(a){!this._isInvalid&&this._isRelative&&g.call(this,a,"hostname")},get port(){return this._port},set port(a){!this._isInvalid&&this._isRelative&&g.call(this,a,"port")},get pathname(){return this._isInvalid?"":this._isRelative?"/"+this._path.join("/"):this._schemeData},set pathname(a){!this._isInvalid&&this._isRelative&&(this._path=[],g.call(this,a,"relative path start"))},get search(){return this._isInvalid||!this._query||"?"==this._query?"":this._query},set search(a){!this._isInvalid&&this._isRelative&&(this._query="?","?"==a[0]&&(a=a.slice(1)),g.call(this,a,"query"))},get hash(){return this._isInvalid||!this._fragment||"#"==this._fragment?"":this._fragment},set hash(a){this._isInvalid||(this._fragment="#","#"==a[0]&&(a=a.slice(1)),g.call(this,a,"fragment"))}},a.URL=i}}(window),function(a){function b(a){for(var b=a||{},d=1;d<arguments.length;d++){var e=arguments[d];try{for(var f in e)c(f,e,b)}catch(g){}}return b}function c(a,b,c){var e=d(b,a);Object.defineProperty(c,a,e)}function d(a,b){if(a){var c=Object.getOwnPropertyDescriptor(a,b);return c||d(Object.getPrototypeOf(a),b)}}Function.prototype.bind||(Function.prototype.bind=function(a){var b=this,c=Array.prototype.slice.call(arguments,1);return function(){var d=c.slice();return d.push.apply(d,arguments),b.apply(a,d)}}),a.mixin=b}(window.Platform),function(a){"use strict";function b(a,b,c){var d="string"==typeof a?document.createElement(a):a.cloneNode(!0);if(d.innerHTML=b,c)for(var e in c)d.setAttribute(e,c[e]);return d}var c=DOMTokenList.prototype.add,d=DOMTokenList.prototype.remove;DOMTokenList.prototype.add=function(){for(var a=0;a<arguments.length;a++)c.call(this,arguments[a])},DOMTokenList.prototype.remove=function(){for(var a=0;a<arguments.length;a++)d.call(this,arguments[a])},DOMTokenList.prototype.toggle=function(a,b){1==arguments.length&&(b=!this.contains(a)),b?this.add(a):this.remove(a)},DOMTokenList.prototype.switch=function(a,b){a&&this.remove(a),b&&this.add(b)};var e=function(){return Array.prototype.slice.call(this)},f=window.NamedNodeMap||window.MozNamedAttrMap||{};if(NodeList.prototype.array=e,f.prototype.array=e,HTMLCollection.prototype.array=e,!window.performance){var g=Date.now();window.performance={now:function(){return Date.now()-g}}}window.requestAnimationFrame||(window.requestAnimationFrame=function(){var a=window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame;return a?function(b){return a(function(){b(performance.now())})}:function(a){return window.setTimeout(a,1e3/60)}}()),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(){return window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||function(a){clearTimeout(a)}}());var h=[],i=function(){h.push(arguments)};window.Polymer=i,a.deliverDeclarations=function(){return a.deliverDeclarations=function(){throw"Possible attempt to load Polymer twice"},h},window.addEventListener("DOMContentLoaded",function(){window.Polymer===i&&(window.Polymer=function(){console.error('You tried to use polymer without loading it first. To load polymer, <link rel="import" href="components/polymer/polymer.html">')})}),a.createDOM=b}(window.Platform),window.templateContent=window.templateContent||function(a){return a.content},function(a){a=a||(window.Inspector={});var b;window.sinspect=function(a,d){b||(b=window.open("","ShadowDOM Inspector",null,!0),b.document.write(c),b.api={shadowize:shadowize}),f(a||wrap(document.body),d)};var c=["<!DOCTYPE html>","<html>","  <head>","    <title>ShadowDOM Inspector</title>","    <style>","      body {","      }","      pre {",'        font: 9pt "Courier New", monospace;',"        line-height: 1.5em;","      }","      tag {","        color: purple;","      }","      ul {","         margin: 0;","         padding: 0;","         list-style: none;","      }","      li {","         display: inline-block;","         background-color: #f1f1f1;","         padding: 4px 6px;","         border-radius: 4px;","         margin-right: 4px;","      }","    </style>","  </head>","  <body>",'    <ul id="crumbs">',"    </ul>",'    <div id="tree"></div>',"  </body>","</html>"].join("\n"),d=[],e=function(){var a=b.document,c=a.querySelector("#crumbs");
c.textContent="";for(var e,g=0;e=d[g];g++){var h=a.createElement("a");h.href="#",h.textContent=e.localName,h.idx=g,h.onclick=function(a){for(var b;d.length>this.idx;)b=d.pop();f(b.shadow||b,b),a.preventDefault()},c.appendChild(a.createElement("li")).appendChild(h)}},f=function(a,c){var f=b.document;k=[];var g=c||a;d.push(g),e(),f.body.querySelector("#tree").innerHTML="<pre>"+j(a,a.childNodes)+"</pre>"},g=Array.prototype.forEach.call.bind(Array.prototype.forEach),h={STYLE:1,SCRIPT:1,"#comment":1,TEMPLATE:1},i=function(a){return h[a.nodeName]},j=function(a,b,c){if(i(a))return"";var d=c||"";if(a.localName||11==a.nodeType){var e=a.localName||"shadow-root",f=d+l(a);"content"==e&&(b=a.getDistributedNodes()),f+="<br/>";var h=d+"&nbsp;&nbsp;";g(b,function(a){f+=j(a,a.childNodes,h)}),f+=d,{br:1}[e]||(f+="<tag>&lt;/"+e+"&gt;</tag>",f+="<br/>")}else{var k=a.textContent.trim();f=k?d+'"'+k+'"<br/>':""}return f},k=[],l=function(a){var b="<tag>&lt;",c=a.localName||"shadow-root";return a.webkitShadowRoot||a.shadowRoot?(b+=' <button idx="'+k.length+'" onclick="api.shadowize.call(this)">'+c+"</button>",k.push(a)):b+=c||"shadow-root",a.attributes&&g(a.attributes,function(a){b+=" "+a.name+(a.value?'="'+a.value+'"':"")}),b+="&gt;</tag>"};shadowize=function(){var a=Number(this.attributes.idx.value),b=k[a];b?f(b.webkitShadowRoot||b.shadowRoot,b):(console.log("bad shadowize node"),console.dir(this))},a.output=j}(window.Inspector),function(){var a=document.createElement("style");a.textContent="body {transition: opacity ease-in 0.2s; } \nbody[unresolved] {opacity: 0; display: block; overflow: hidden; } \n";var b=document.querySelector("head");b.insertBefore(a,b.firstChild)}(Platform),function(a){function b(a,b){return b=b||[],b.map||(b=[b]),a.apply(this,b.map(d))}function c(a,c,d){var e;switch(arguments.length){case 0:return;case 1:e=null;break;case 2:e=c.apply(this);break;default:e=b(d,c)}f[a]=e}function d(a){return f[a]}function e(a,c){HTMLImports.whenImportsReady(function(){b(c,a)})}var f={};a.marshal=d,a.module=c,a.using=e}(window),function(a){function b(a){f.textContent=d++,e.push(a)}function c(){for(;e.length;)e.shift()()}var d=0,e=[],f=document.createTextNode("");new(window.MutationObserver||JsMutationObserver)(c).observe(f,{characterData:!0}),a.endOfMicrotask=b}(Platform),function(a){function b(a,b,d){return a.replace(d,function(a,d,e,f){var g=e.replace(/["']/g,"");return g=c(b,g),d+"'"+g+"'"+f})}function c(a,b){var c=new URL(b,a);return d(c.href)}function d(a){var b=document.baseURI,c=new URL(a,b);return c.host===b.host&&c.port===b.port&&c.protocol===b.protocol?e(b.pathname,c.pathname):a}function e(a,b){for(var c=a.split("/"),d=b.split("/");c.length&&c[0]===d[0];)c.shift(),d.shift();for(var e=0,f=c.length-1;f>e;e++)d.unshift("..");return d.join("/")}var f={resolveDom:function(a,b){b=b||a.ownerDocument.baseURI,this.resolveAttributes(a,b),this.resolveStyles(a,b);var c=a.querySelectorAll("template");if(c)for(var d,e=0,f=c.length;f>e&&(d=c[e]);e++)d.content&&this.resolveDom(d.content,b)},resolveTemplate:function(a){this.resolveDom(a.content,a.ownerDocument.baseURI)},resolveStyles:function(a,b){var c=a.querySelectorAll("style");if(c)for(var d,e=0,f=c.length;f>e&&(d=c[e]);e++)this.resolveStyle(d,b)},resolveStyle:function(a,b){b=b||a.ownerDocument.baseURI,a.textContent=this.resolveCssText(a.textContent,b)},resolveCssText:function(a,c){return a=b(a,c,g),b(a,c,h)},resolveAttributes:function(a,b){a.hasAttributes&&a.hasAttributes()&&this.resolveElementAttributes(a,b);var c=a&&a.querySelectorAll(j);if(c)for(var d,e=0,f=c.length;f>e&&(d=c[e]);e++)this.resolveElementAttributes(d,b)},resolveElementAttributes:function(a,b){b=b||a.ownerDocument.baseURI,i.forEach(function(d){var e=a.attributes[d];if(e&&e.value&&e.value.search(k)<0){var f=c(b,e.value);e.value=f}})}},g=/(url\()([^)]*)(\))/g,h=/(@import[\s]+(?!url\())([^;]*)(;)/g,i=["href","src","action"],j="["+i.join("],[")+"]",k="{{.*}}";a.urlResolver=f}(Platform),function(a){function b(a){u.push(a),t||(t=!0,q(d))}function c(a){return window.ShadowDOMPolyfill&&window.ShadowDOMPolyfill.wrapIfNeeded(a)||a}function d(){t=!1;var a=u;u=[],a.sort(function(a,b){return a.uid_-b.uid_});var b=!1;a.forEach(function(a){var c=a.takeRecords();e(a),c.length&&(a.callback_(c,a),b=!0)}),b&&d()}function e(a){a.nodes_.forEach(function(b){var c=p.get(b);c&&c.forEach(function(b){b.observer===a&&b.removeTransientObservers()})})}function f(a,b){for(var c=a;c;c=c.parentNode){var d=p.get(c);if(d)for(var e=0;e<d.length;e++){var f=d[e],g=f.options;if(c===a||g.subtree){var h=b(g);h&&f.enqueue(h)}}}}function g(a){this.callback_=a,this.nodes_=[],this.records_=[],this.uid_=++v}function h(a,b){this.type=a,this.target=b,this.addedNodes=[],this.removedNodes=[],this.previousSibling=null,this.nextSibling=null,this.attributeName=null,this.attributeNamespace=null,this.oldValue=null}function i(a){var b=new h(a.type,a.target);return b.addedNodes=a.addedNodes.slice(),b.removedNodes=a.removedNodes.slice(),b.previousSibling=a.previousSibling,b.nextSibling=a.nextSibling,b.attributeName=a.attributeName,b.attributeNamespace=a.attributeNamespace,b.oldValue=a.oldValue,b}function j(a,b){return w=new h(a,b)}function k(a){return x?x:(x=i(w),x.oldValue=a,x)}function l(){w=x=void 0}function m(a){return a===x||a===w}function n(a,b){return a===b?a:x&&m(a)?x:null}function o(a,b,c){this.observer=a,this.target=b,this.options=c,this.transientObservedNodes=[]}var p=new WeakMap,q=window.msSetImmediate;if(!q){var r=[],s=String(Math.random());window.addEventListener("message",function(a){if(a.data===s){var b=r;r=[],b.forEach(function(a){a()})}}),q=function(a){r.push(a),window.postMessage(s,"*")}}var t=!1,u=[],v=0;g.prototype={observe:function(a,b){if(a=c(a),!b.childList&&!b.attributes&&!b.characterData||b.attributeOldValue&&!b.attributes||b.attributeFilter&&b.attributeFilter.length&&!b.attributes||b.characterDataOldValue&&!b.characterData)throw new SyntaxError;var d=p.get(a);d||p.set(a,d=[]);for(var e,f=0;f<d.length;f++)if(d[f].observer===this){e=d[f],e.removeListeners(),e.options=b;break}e||(e=new o(this,a,b),d.push(e),this.nodes_.push(a)),e.addListeners()},disconnect:function(){this.nodes_.forEach(function(a){for(var b=p.get(a),c=0;c<b.length;c++){var d=b[c];if(d.observer===this){d.removeListeners(),b.splice(c,1);break}}},this),this.records_=[]},takeRecords:function(){var a=this.records_;return this.records_=[],a}};var w,x;o.prototype={enqueue:function(a){var c=this.observer.records_,d=c.length;if(c.length>0){var e=c[d-1],f=n(e,a);if(f)return void(c[d-1]=f)}else b(this.observer);c[d]=a},addListeners:function(){this.addListeners_(this.target)},addListeners_:function(a){var b=this.options;b.attributes&&a.addEventListener("DOMAttrModified",this,!0),b.characterData&&a.addEventListener("DOMCharacterDataModified",this,!0),b.childList&&a.addEventListener("DOMNodeInserted",this,!0),(b.childList||b.subtree)&&a.addEventListener("DOMNodeRemoved",this,!0)},removeListeners:function(){this.removeListeners_(this.target)},removeListeners_:function(a){var b=this.options;b.attributes&&a.removeEventListener("DOMAttrModified",this,!0),b.characterData&&a.removeEventListener("DOMCharacterDataModified",this,!0),b.childList&&a.removeEventListener("DOMNodeInserted",this,!0),(b.childList||b.subtree)&&a.removeEventListener("DOMNodeRemoved",this,!0)},addTransientObserver:function(a){if(a!==this.target){this.addListeners_(a),this.transientObservedNodes.push(a);var b=p.get(a);b||p.set(a,b=[]),b.push(this)}},removeTransientObservers:function(){var a=this.transientObservedNodes;this.transientObservedNodes=[],a.forEach(function(a){this.removeListeners_(a);for(var b=p.get(a),c=0;c<b.length;c++)if(b[c]===this){b.splice(c,1);break}},this)},handleEvent:function(a){switch(a.stopImmediatePropagation(),a.type){case"DOMAttrModified":var b=a.attrName,c=a.relatedNode.namespaceURI,d=a.target,e=new j("attributes",d);e.attributeName=b,e.attributeNamespace=c;var g=a.attrChange===MutationEvent.ADDITION?null:a.prevValue;f(d,function(a){return!a.attributes||a.attributeFilter&&a.attributeFilter.length&&-1===a.attributeFilter.indexOf(b)&&-1===a.attributeFilter.indexOf(c)?void 0:a.attributeOldValue?k(g):e});break;case"DOMCharacterDataModified":var d=a.target,e=j("characterData",d),g=a.prevValue;f(d,function(a){return a.characterData?a.characterDataOldValue?k(g):e:void 0});break;case"DOMNodeRemoved":this.addTransientObserver(a.target);case"DOMNodeInserted":var h,i,d=a.relatedNode,m=a.target;"DOMNodeInserted"===a.type?(h=[m],i=[]):(h=[],i=[m]);var n=m.previousSibling,o=m.nextSibling,e=j("childList",d);e.addedNodes=h,e.removedNodes=i,e.previousSibling=n,e.nextSibling=o,f(d,function(a){return a.childList?e:void 0})}l()}},a.JsMutationObserver=g,a.MutationObserver||(a.MutationObserver=g)}(this),window.HTMLImports=window.HTMLImports||{flags:{}},function(a){var b=(a.path,a.xhr),c=a.flags,d=function(a,b){this.cache={},this.onload=a,this.oncomplete=b,this.inflight=0,this.pending={}};d.prototype={addNodes:function(a){this.inflight+=a.length;for(var b,c=0,d=a.length;d>c&&(b=a[c]);c++)this.require(b);this.checkDone()},addNode:function(a){this.inflight++,this.require(a),this.checkDone()},require:function(a){var b=a.src||a.href;a.__nodeUrl=b,this.dedupe(b,a)||this.fetch(b,a)},dedupe:function(a,b){if(this.pending[a])return this.pending[a].push(b),!0;return this.cache[a]?(this.onload(a,b,this.cache[a]),this.tail(),!0):(this.pending[a]=[b],!1)},fetch:function(a,d){c.load&&console.log("fetch",a,d);var e=function(b,c){this.receive(a,d,b,c)}.bind(this);b.load(a,e)},receive:function(a,b,c,d){this.cache[a]=d;for(var e,f=this.pending[a],g=0,h=f.length;h>g&&(e=f[g]);g++)this.onload(a,e,d),this.tail();this.pending[a]=null},tail:function(){--this.inflight,this.checkDone()},checkDone:function(){this.inflight||this.oncomplete()}},b=b||{async:!0,ok:function(a){return a.status>=200&&a.status<300||304===a.status||0===a.status},load:function(c,d,e){var f=new XMLHttpRequest;return(a.flags.debug||a.flags.bust)&&(c+="?"+Math.random()),f.open("GET",c,b.async),f.addEventListener("readystatechange",function(){4===f.readyState&&d.call(e,!b.ok(f)&&f,f.response||f.responseText,c)}),f.send(),f},loadDocument:function(a,b,c){this.load(a,b,c).responseType="document"}},a.xhr=b,a.Loader=d}(window.HTMLImports),function(a){function b(a){return"link"===a.localName&&a.rel===g}function c(a){var b,c=d(a);try{b=btoa(c)}catch(e){b=btoa(unescape(encodeURIComponent(c))),console.warn("Script contained non-latin characters that were forced to latin. Some characters may be wrong.",a)}return"data:text/javascript;base64,"+b}function d(a){return a.textContent+e(a)}function e(a){var b=a.__nodeUrl;if(!b){b=a.ownerDocument.baseURI;var c="["+Math.floor(1e3*(Math.random()+1))+"]",d=a.textContent.match(/Polymer\(['"]([^'"]*)/);c=d&&d[1]||c,b+="/"+c+".js"}return"\n//# sourceURL="+b+"\n"}function f(a){var b=a.ownerDocument.createElement("style");return b.textContent=a.textContent,n.resolveUrlsInStyle(b),b}var g="import",h=a.flags,i=/Trident/.test(navigator.userAgent),j=window.ShadowDOMPolyfill?window.ShadowDOMPolyfill.wrapIfNeeded(document):document,k={documentSelectors:"link[rel="+g+"]",importsSelectors:["link[rel="+g+"]","link[rel=stylesheet]","style","script:not([type])",'script[type="text/javascript"]'].join(","),map:{link:"parseLink",script:"parseScript",style:"parseStyle"},parseNext:function(){var a=this.nextToParse();a&&this.parse(a)},parse:function(a){if(this.isParsed(a))return void(h.parse&&console.log("[%s] is already parsed",a.localName));var b=this[this.map[a.localName]];b&&(this.markParsing(a),b.call(this,a))},markParsing:function(a){h.parse&&console.log("parsing",a),this.parsingElement=a},markParsingComplete:function(a){a.__importParsed=!0,a.__importElement&&(a.__importElement.__importParsed=!0),this.parsingElement=null,h.parse&&console.log("completed",a),this.parseNext()},parseImport:function(a){if(a.import.__importParsed=!0,HTMLImports.__importsParsingHook&&HTMLImports.__importsParsingHook(a),a.dispatchEvent(a.__resource?new CustomEvent("load",{bubbles:!1}):new CustomEvent("error",{bubbles:!1})),a.__pending)for(var b;a.__pending.length;)b=a.__pending.shift(),b&&b({target:a});this.markParsingComplete(a)},parseLink:function(a){b(a)?this.parseImport(a):(a.href=a.href,this.parseGeneric(a))},parseStyle:function(a){var b=a;a=f(a),a.__importElement=b,this.parseGeneric(a)},parseGeneric:function(a){this.trackElement(a),document.head.appendChild(a)},trackElement:function(a,b){var c=this,d=function(d){b&&b(d),c.markParsingComplete(a)};if(a.addEventListener("load",d),a.addEventListener("error",d),i&&"style"===a.localName){var e=!1;if(-1==a.textContent.indexOf("@import"))e=!0;else if(a.sheet){e=!0;for(var f,g=a.sheet.cssRules,h=g?g.length:0,j=0;h>j&&(f=g[j]);j++)f.type===CSSRule.IMPORT_RULE&&(e=e&&Boolean(f.styleSheet))}e&&a.dispatchEvent(new CustomEvent("load",{bubbles:!1}))}},parseScript:function(b){var d=document.createElement("script");d.__importElement=b,d.src=b.src?b.src:c(b),a.currentScript=b,this.trackElement(d,function(){d.parentNode.removeChild(d),a.currentScript=null}),document.head.appendChild(d)},nextToParse:function(){return!this.parsingElement&&this.nextToParseInDoc(j)},nextToParseInDoc:function(a,c){for(var d,e=a.querySelectorAll(this.parseSelectorsForNode(a)),f=0,g=e.length;g>f&&(d=e[f]);f++)if(!this.isParsed(d))return this.hasResource(d)?b(d)?this.nextToParseInDoc(d.import,d):d:void 0;return c},parseSelectorsForNode:function(a){var b=a.ownerDocument||a;return b===j?this.documentSelectors:this.importsSelectors},isParsed:function(a){return a.__importParsed},hasResource:function(a){return b(a)&&!a.import?!1:!0}},l=/(url\()([^)]*)(\))/g,m=/(@import[\s]+(?!url\())([^;]*)(;)/g,n={resolveUrlsInStyle:function(a){var b=a.ownerDocument,c=b.createElement("a");return a.textContent=this.resolveUrlsInCssText(a.textContent,c),a},resolveUrlsInCssText:function(a,b){var c=this.replaceUrls(a,b,l);return c=this.replaceUrls(c,b,m)},replaceUrls:function(a,b,c){return a.replace(c,function(a,c,d,e){var f=d.replace(/["']/g,"");return b.href=f,f=b.href,c+"'"+f+"'"+e})}};a.parser=k,a.path=n,a.isIE=i}(HTMLImports),function(a){function b(a){return c(a,m)}function c(a,b){return"link"===a.localName&&a.getAttribute("rel")===b}function d(a,b){var c=a;c instanceof Document||(c=document.implementation.createHTMLDocument(m)),c._URL=b;var d=c.createElement("base");d.setAttribute("href",b),c.baseURI||(c.baseURI=b);var e=c.createElement("meta");return e.setAttribute("charset","utf-8"),c.head.appendChild(e),c.head.appendChild(d),a instanceof Document||(c.body.innerHTML=a),window.HTMLTemplateElement&&HTMLTemplateElement.bootstrap&&HTMLTemplateElement.bootstrap(c),c}function e(a,b){b=b||n,g(function(){h(a,b)},b)}function f(a){return"complete"===a.readyState||a.readyState===u}function g(a,b){if(f(b))a&&a();else{var c=function(){("complete"===b.readyState||b.readyState===u)&&(b.removeEventListener(v,c),g(a,b))};b.addEventListener(v,c)}}function h(a,b){function c(){f==g&&requestAnimationFrame(a)}function d(){f++,c()}var e=b.querySelectorAll("link[rel=import]"),f=0,g=e.length;if(g)for(var h,j=0;g>j&&(h=e[j]);j++)i(h)?d.call(h):(h.addEventListener("load",d),h.addEventListener("error",d));else c()}function i(a){return k?a.import&&"loading"!==a.import.readyState:a.__importParsed}var j="import"in document.createElement("link"),k=j,l=a.flags,m="import",n=window.ShadowDOMPolyfill?ShadowDOMPolyfill.wrapIfNeeded(document):document;if(k)var o={};else var p=(a.xhr,a.Loader),q=a.parser,o={documents:{},documentPreloadSelectors:"link[rel="+m+"]",importsPreloadSelectors:["link[rel="+m+"]"].join(","),loadNode:function(a){r.addNode(a)},loadSubtree:function(a){var b=this.marshalNodes(a);r.addNodes(b)},marshalNodes:function(a){return a.querySelectorAll(this.loadSelectorsForNode(a))},loadSelectorsForNode:function(a){var b=a.ownerDocument||a;return b===n?this.documentPreloadSelectors:this.importsPreloadSelectors},loaded:function(a,c,e){if(l.load&&console.log("loaded",a,c),c.__resource=e,b(c)){var f=this.documents[a];f||(f=d(e,a),f.__importLink=c,this.bootDocument(f),this.documents[a]=f),c.import=f}q.parseNext()},bootDocument:function(a){this.loadSubtree(a),this.observe(a),q.parseNext()},loadedAll:function(){q.parseNext()}},r=new p(o.loaded.bind(o),o.loadedAll.bind(o));var s={get:function(){return HTMLImports.currentScript||document.currentScript},configurable:!0};if(Object.defineProperty(document,"_currentScript",s),Object.defineProperty(n,"_currentScript",s),!document.baseURI){var t={get:function(){return window.location.href},configurable:!0};Object.defineProperty(document,"baseURI",t),Object.defineProperty(n,"baseURI",t)}var u=HTMLImports.isIE?"complete":"interactive",v="readystatechange";a.hasNative=j,a.useNative=k,a.importer=o,a.whenImportsReady=e,a.IMPORT_LINK_TYPE=m,a.isImportLoaded=i,a.importLoader=r}(window.HTMLImports),function(a){function b(a){for(var b,d=0,e=a.length;e>d&&(b=a[d]);d++)"childList"===b.type&&b.addedNodes.length&&c(b.addedNodes)}function c(a){for(var b,e=0,g=a.length;g>e&&(b=a[e]);e++)d(b)&&f.loadNode(b),b.children&&b.children.length&&c(b.children)}function d(a){return 1===a.nodeType&&g.call(a,f.loadSelectorsForNode(a))}function e(a){h.observe(a,{childList:!0,subtree:!0})}var f=(a.IMPORT_LINK_TYPE,a.importer),g=HTMLElement.prototype.matches||HTMLElement.prototype.matchesSelector||HTMLElement.prototype.webkitMatchesSelector||HTMLElement.prototype.mozMatchesSelector||HTMLElement.prototype.msMatchesSelector,h=new MutationObserver(b);a.observe=e,f.observe=e}(HTMLImports),function(){function a(){HTMLImports.importer.bootDocument(b)}"function"!=typeof window.CustomEvent&&(window.CustomEvent=function(a,b){var c=document.createEvent("HTMLEvents");return c.initEvent(a,b.bubbles===!1?!1:!0,b.cancelable===!1?!1:!0,b.detail),c});var b=window.ShadowDOMPolyfill?window.ShadowDOMPolyfill.wrapIfNeeded(document):document;HTMLImports.whenImportsReady(function(){HTMLImports.ready=!0,HTMLImports.readyTime=(new Date).getTime(),b.dispatchEvent(new CustomEvent("HTMLImportsLoaded",{bubbles:!0}))}),HTMLImports.useNative||("complete"===document.readyState||"interactive"===document.readyState&&!window.attachEvent?a():document.addEventListener("DOMContentLoaded",a))}(),window.CustomElements=window.CustomElements||{flags:{}},function(a){function b(a,c,d){var e=a.firstElementChild;if(!e)for(e=a.firstChild;e&&e.nodeType!==Node.ELEMENT_NODE;)e=e.nextSibling;for(;e;)c(e,d)!==!0&&b(e,c,d),e=e.nextElementSibling;return null}function c(a,b){for(var c=a.shadowRoot;c;)d(c,b),c=c.olderShadowRoot}function d(a,d){b(a,function(a){return d(a)?!0:void c(a,d)}),c(a,d)}function e(a){return h(a)?(i(a),!0):void l(a)}function f(a){d(a,function(a){return e(a)?!0:void 0})}function g(a){return e(a)||f(a)}function h(b){if(!b.__upgraded__&&b.nodeType===Node.ELEMENT_NODE){var c=b.getAttribute("is")||b.localName,d=a.registry[c];if(d)return A.dom&&console.group("upgrade:",b.localName),a.upgrade(b),A.dom&&console.groupEnd(),!0}}function i(a){l(a),r(a)&&d(a,function(a){l(a)})}function j(a){if(E.push(a),!D){D=!0;var b=window.Platform&&window.Platform.endOfMicrotask||setTimeout;b(k)}}function k(){D=!1;for(var a,b=E,c=0,d=b.length;d>c&&(a=b[c]);c++)a();E=[]}function l(a){C?j(function(){m(a)}):m(a)}function m(a){(a.attachedCallback||a.detachedCallback||a.__upgraded__&&A.dom)&&(A.dom&&console.group("inserted:",a.localName),r(a)&&(a.__inserted=(a.__inserted||0)+1,a.__inserted<1&&(a.__inserted=1),a.__inserted>1?A.dom&&console.warn("inserted:",a.localName,"insert/remove count:",a.__inserted):a.attachedCallback&&(A.dom&&console.log("inserted:",a.localName),a.attachedCallback())),A.dom&&console.groupEnd())}function n(a){o(a),d(a,function(a){o(a)})}function o(a){C?j(function(){p(a)}):p(a)}function p(a){(a.attachedCallback||a.detachedCallback||a.__upgraded__&&A.dom)&&(A.dom&&console.group("removed:",a.localName),r(a)||(a.__inserted=(a.__inserted||0)-1,a.__inserted>0&&(a.__inserted=0),a.__inserted<0?A.dom&&console.warn("removed:",a.localName,"insert/remove count:",a.__inserted):a.detachedCallback&&a.detachedCallback()),A.dom&&console.groupEnd())}function q(a){return window.ShadowDOMPolyfill?ShadowDOMPolyfill.wrapIfNeeded(a):a}function r(a){for(var b=a,c=q(document);b;){if(b==c)return!0;b=b.parentNode||b.host}}function s(a){if(a.shadowRoot&&!a.shadowRoot.__watched){A.dom&&console.log("watching shadow-root for: ",a.localName);for(var b=a.shadowRoot;b;)t(b),b=b.olderShadowRoot}}function t(a){a.__watched||(w(a),a.__watched=!0)}function u(a){if(A.dom){var b=a[0];if(b&&"childList"===b.type&&b.addedNodes&&b.addedNodes){for(var c=b.addedNodes[0];c&&c!==document&&!c.host;)c=c.parentNode;var d=c&&(c.URL||c._URL||c.host&&c.host.localName)||"";d=d.split("/?").shift().split("/").pop()}console.group("mutations (%d) [%s]",a.length,d||"")}a.forEach(function(a){"childList"===a.type&&(G(a.addedNodes,function(a){a.localName&&g(a)}),G(a.removedNodes,function(a){a.localName&&n(a)}))}),A.dom&&console.groupEnd()}function v(){u(F.takeRecords()),k()}function w(a){F.observe(a,{childList:!0,subtree:!0})}function x(a){w(a)}function y(a){A.dom&&console.group("upgradeDocument: ",a.baseURI.split("/").pop()),g(a),A.dom&&console.groupEnd()}function z(a){a=q(a);for(var b,c=a.querySelectorAll("link[rel="+B+"]"),d=0,e=c.length;e>d&&(b=c[d]);d++)b.import&&b.import.__parsed&&z(b.import);y(a)}var A=window.logFlags||{},B=window.HTMLImports?HTMLImports.IMPORT_LINK_TYPE:"none",C=!window.MutationObserver||window.MutationObserver===window.JsMutationObserver;a.hasPolyfillMutations=C;var D=!1,E=[],F=new MutationObserver(u),G=Array.prototype.forEach.call.bind(Array.prototype.forEach);a.IMPORT_LINK_TYPE=B,a.watchShadow=s,a.upgradeDocumentTree=z,a.upgradeAll=g,a.upgradeSubtree=f,a.insertedNode=i,a.observeDocument=x,a.upgradeDocument=y,a.takeRecords=v}(window.CustomElements),function(a){function b(b,f){var g=f||{};if(!b)throw new Error("document.registerElement: first argument `name` must not be empty");if(b.indexOf("-")<0)throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '"+String(b)+"'.");if(m(b))throw new Error("DuplicateDefinitionError: a type with name '"+String(b)+"' is already registered");if(!g.prototype)throw new Error("Options missing required prototype property");return g.__name=b.toLowerCase(),g.lifecycle=g.lifecycle||{},g.ancestry=c(g.extends),d(g),e(g),k(g.prototype),n(g.__name,g),g.ctor=o(g),g.ctor.prototype=g.prototype,g.prototype.constructor=g.ctor,a.ready&&a.upgradeDocumentTree(document),g.ctor}function c(a){var b=m(a);return b?c(b.extends).concat([b]):[]}function d(a){for(var b,c=a.extends,d=0;b=a.ancestry[d];d++)c=b.is&&b.tag;a.tag=c||a.__name,c&&(a.is=a.__name)}function e(a){if(!Object.__proto__){var b=HTMLElement.prototype;if(a.is){var c=document.createElement(a.tag);b=Object.getPrototypeOf(c)}for(var d,e=a.prototype;e&&e!==b;){var d=Object.getPrototypeOf(e);e.__proto__=d,e=d}}a.native=b}function f(a){return g(z(a.tag),a)}function g(b,c){return c.is&&b.setAttribute("is",c.is),b.removeAttribute("unresolved"),h(b,c),b.__upgraded__=!0,j(b),a.insertedNode(b),a.upgradeSubtree(b),b}function h(a,b){Object.__proto__?a.__proto__=b.prototype:(i(a,b.prototype,b.native),a.__proto__=b.prototype)}function i(a,b,c){for(var d={},e=b;e!==c&&e!==HTMLElement.prototype;){for(var f,g=Object.getOwnPropertyNames(e),h=0;f=g[h];h++)d[f]||(Object.defineProperty(a,f,Object.getOwnPropertyDescriptor(e,f)),d[f]=1);e=Object.getPrototypeOf(e)}}function j(a){a.createdCallback&&a.createdCallback()}function k(a){if(!a.setAttribute._polyfilled){var b=a.setAttribute;a.setAttribute=function(a,c){l.call(this,a,c,b)};var c=a.removeAttribute;a.removeAttribute=function(a){l.call(this,a,null,c)},a.setAttribute._polyfilled=!0}}function l(a,b,c){var d=this.getAttribute(a);c.apply(this,arguments);var e=this.getAttribute(a);this.attributeChangedCallback&&e!==d&&this.attributeChangedCallback(a,d,e)}function m(a){return a?x[a.toLowerCase()]:void 0}function n(a,b){x[a]=b}function o(a){return function(){return f(a)}}function p(a,b,c){return a===y?q(b,c):A(a,b)}function q(a,b){var c=m(b||a);if(c){if(a==c.tag&&b==c.is)return new c.ctor;if(!b&&!c.is)return new c.ctor}if(b){var d=q(a);return d.setAttribute("is",b),d}var d=z(a);return a.indexOf("-")>=0&&h(d,HTMLElement),d}function r(a){if(!a.__upgraded__&&a.nodeType===Node.ELEMENT_NODE){var b=a.getAttribute("is"),c=m(b||a.localName);if(c){if(b&&c.tag==a.localName)return g(a,c);if(!b&&!c.extends)return g(a,c)}}}function s(b){var c=B.call(this,b);return a.upgradeAll(c),c}a||(a=window.CustomElements={flags:{}});var t=a.flags,u=Boolean(document.registerElement),v=!t.register&&u&&!window.ShadowDOMPolyfill;if(v){var w=function(){};a.registry={},a.upgradeElement=w,a.watchShadow=w,a.upgrade=w,a.upgradeAll=w,a.upgradeSubtree=w,a.observeDocument=w,a.upgradeDocument=w,a.upgradeDocumentTree=w,a.takeRecords=w}else{var x={},y="http://www.w3.org/1999/xhtml",z=document.createElement.bind(document),A=document.createElementNS.bind(document),B=Node.prototype.cloneNode;document.registerElement=b,document.createElement=q,document.createElementNS=p,Node.prototype.cloneNode=s,a.registry=x,a.upgrade=r}var C;C=Object.__proto__||v?function(a,b){return a instanceof b}:function(a,b){for(var c=a;c;){if(c===b.prototype)return!0;c=c.__proto__}return!1},a.instanceof=C,document.register=document.registerElement,a.hasNative=u,a.useNative=v}(window.CustomElements),function(a){function b(a){return"link"===a.localName&&a.getAttribute("rel")===c}var c=a.IMPORT_LINK_TYPE,d={selectors:["link[rel="+c+"]"],map:{link:"parseLink"},parse:function(a){if(!a.__parsed){a.__parsed=!0;var b=a.querySelectorAll(d.selectors);e(b,function(a){d[d.map[a.localName]](a)}),CustomElements.upgradeDocument(a),CustomElements.observeDocument(a)}},parseLink:function(a){b(a)&&this.parseImport(a)},parseImport:function(a){a.import&&d.parse(a.import)}},e=Array.prototype.forEach.call.bind(Array.prototype.forEach);a.parser=d,a.IMPORT_LINK_TYPE=c}(window.CustomElements),function(a){function b(){CustomElements.parser.parse(document),CustomElements.upgradeDocument(document);var a=window.Platform&&Platform.endOfMicrotask?Platform.endOfMicrotask:setTimeout;a(function(){CustomElements.ready=!0,CustomElements.readyTime=Date.now(),window.HTMLImports&&(CustomElements.elapsed=CustomElements.readyTime-HTMLImports.readyTime),document.dispatchEvent(new CustomEvent("WebComponentsReady",{bubbles:!0})),window.HTMLImports&&(HTMLImports.__importsParsingHook=function(a){CustomElements.parser.parse(a.import)})})}if("function"!=typeof window.CustomEvent&&(window.CustomEvent=function(a){var b=document.createEvent("HTMLEvents");return b.initEvent(a,!0,!0),b}),"complete"===document.readyState||a.flags.eager)b();else if("interactive"!==document.readyState||window.attachEvent||window.HTMLImports&&!window.HTMLImports.ready){var c=window.HTMLImports&&!HTMLImports.ready?"HTMLImportsLoaded":"DOMContentLoaded";window.addEventListener(c,b)}else b()}(window.CustomElements),function(){if(window.ShadowDOMPolyfill){var a=["upgradeAll","upgradeSubtree","observeDocument","upgradeDocument"],b={};a.forEach(function(a){b[a]=CustomElements[a]}),a.forEach(function(a){CustomElements[a]=function(c){return b[a](wrap(c))}})}}(),function(a){function b(a){this.regex=a}var c=a.endOfMicrotask;b.prototype={extractUrls:function(a,b){for(var c,d,e=[];c=this.regex.exec(a);)d=new URL(c[1],b),e.push({matched:c[0],url:d.href});return e},process:function(a,b,c){var d=this.extractUrls(a,b);this.fetch(d,{},c)},fetch:function(a,b,d){var e=a.length;if(!e)return d(b);for(var f,g,h,i=function(){0===--e&&d(b)},j=function(a,c){var d=c.match,e=d.url;if(a)return b[e]="",i();var f=c.response||c.responseText;b[e]=f,this.fetch(this.extractUrls(f,e),b,i)},k=0;e>k;k++)f=a[k],h=f.url,b[h]?c(i):(g=this.xhr(h,j,this),g.match=f,b[h]=g)},xhr:function(a,b,c){var d=new XMLHttpRequest;return d.open("GET",a,!0),d.send(),d.onload=function(){b.call(c,null,d)},d.onerror=function(){b.call(c,null,d)},d}},a.Loader=b}(window.Platform),function(a){function b(){this.loader=new d(this.regex)}var c=a.urlResolver,d=a.Loader;b.prototype={regex:/@import\s+(?:url)?["'\(]*([^'"\)]*)['"\)]*;/g,resolve:function(a,b,c){var d=function(d){c(this.flatten(a,b,d))}.bind(this);this.loader.process(a,b,d)},resolveNode:function(a,b){var c=a.textContent,d=a.ownerDocument.baseURI,e=function(c){a.textContent=c,b(a)};this.resolve(c,d,e)},flatten:function(a,b,d){for(var e,f,g,h=this.loader.extractUrls(a,b),i=0;i<h.length;i++)e=h[i],f=e.url,g=c.resolveCssText(d[f],f),g=this.flatten(g,f,d),a=a.replace(e.matched,g);return a},loadStyles:function(a,b){function c(){e++,e===f&&b&&b()}for(var d,e=0,f=a.length,g=0;f>g&&(d=a[g]);g++)this.resolveNode(d,c)}};var e=new b;a.styleResolver=e}(window.Platform),function(a){a=a||{},a.external=a.external||{};var b={shadow:function(a){return a?a.shadowRoot||a.webkitShadowRoot:void 0},canTarget:function(a){return a&&Boolean(a.elementFromPoint)},targetingShadow:function(a){var b=this.shadow(a);return this.canTarget(b)?b:void 0},olderShadow:function(a){var b=a.olderShadowRoot;if(!b){var c=a.querySelector("shadow");c&&(b=c.olderShadowRoot)}return b},allShadows:function(a){for(var b=[],c=this.shadow(a);c;)b.push(c),c=this.olderShadow(c);return b},searchRoot:function(a,b,c){if(a){var d,e,f=a.elementFromPoint(b,c);for(e=this.targetingShadow(f);e;){if(d=e.elementFromPoint(b,c)){var g=this.targetingShadow(d);return this.searchRoot(g,b,c)||d}e=this.olderShadow(e)}return f}},owner:function(a){for(var b=a;b.parentNode;)b=b.parentNode;return b.nodeType!=Node.DOCUMENT_NODE&&b.nodeType!=Node.DOCUMENT_FRAGMENT_NODE&&(b=document),b},findTarget:function(a){var b=a.clientX,c=a.clientY,d=this.owner(a.target);return d.elementFromPoint(b,c)||(d=document),this.searchRoot(d,b,c)}};a.targetFinding=b,a.findTarget=b.findTarget.bind(b),window.PointerEventsPolyfill=a}(window.PointerEventsPolyfill),function(){function a(a){return"body ^^ "+b(a)}function b(a){return'[touch-action="'+a+'"]'}function c(a){return"{ -ms-touch-action: "+a+"; touch-action: "+a+"; touch-action-delay: none; }"}var d=["none","auto","pan-x","pan-y",{rule:"pan-x pan-y",selectors:["pan-x pan-y","pan-y pan-x"]}],e="";d.forEach(function(d){String(d)===d?(e+=b(d)+c(d)+"\n",e+=a(d)+c(d)+"\n"):(e+=d.selectors.map(b)+c(d.rule)+"\n",e+=d.selectors.map(a)+c(d.rule)+"\n")});var f=document.createElement("style");f.textContent=e,document.head.appendChild(f)}(),function(a){function b(a,e){e=e||{};var f=e.buttons;if(!d&&!f&&"touch"!==a)switch(e.which){case 1:f=1;break;case 2:f=4;break;case 3:f=2;break;default:f=0}var i;if(c)i=new MouseEvent(a,e);else{i=document.createEvent("MouseEvent");for(var j,k={},l=0;l<g.length;l++)j=g[l],k[j]=e[j]||h[l];i.initMouseEvent(a,k.bubbles,k.cancelable,k.view,k.detail,k.screenX,k.screenY,k.clientX,k.clientY,k.ctrlKey,k.altKey,k.shiftKey,k.metaKey,k.button,k.relatedTarget)}i.__proto__=b.prototype,d||Object.defineProperty(i,"buttons",{get:function(){return f},enumerable:!0});var m=0;return m=e.pressure?e.pressure:f?.5:0,Object.defineProperties(i,{pointerId:{value:e.pointerId||0,enumerable:!0},width:{value:e.width||0,enumerable:!0},height:{value:e.height||0,enumerable:!0},pressure:{value:m,enumerable:!0},tiltX:{value:e.tiltX||0,enumerable:!0},tiltY:{value:e.tiltY||0,enumerable:!0},pointerType:{value:e.pointerType||"",enumerable:!0},hwTimestamp:{value:e.hwTimestamp||0,enumerable:!0},isPrimary:{value:e.isPrimary||!1,enumerable:!0}}),i}var c=!1,d=!1;try{var e=new MouseEvent("click",{buttons:1});c=!0,d=1===e.buttons,e=null}catch(f){}var g=["bubbles","cancelable","view","detail","screenX","screenY","clientX","clientY","ctrlKey","altKey","shiftKey","metaKey","button","relatedTarget"],h=[!1,!1,null,null,0,0,0,0,!1,!1,!1,!1,0,null];b.prototype=Object.create(MouseEvent.prototype),a.PointerEvent||(a.PointerEvent=b)}(window),function(a){function b(){if(c){var a=new Map;return a.pointers=d,a}this.keys=[],this.values=[]}var c=window.Map&&window.Map.prototype.forEach,d=function(){return this.size};b.prototype={set:function(a,b){var c=this.keys.indexOf(a);
c>-1?this.values[c]=b:(this.keys.push(a),this.values.push(b))},has:function(a){return this.keys.indexOf(a)>-1},"delete":function(a){var b=this.keys.indexOf(a);b>-1&&(this.keys.splice(b,1),this.values.splice(b,1))},get:function(a){var b=this.keys.indexOf(a);return this.values[b]},clear:function(){this.keys.length=0,this.values.length=0},forEach:function(a,b){this.values.forEach(function(c,d){a.call(b,c,this.keys[d],this)},this)},pointers:function(){return this.keys.length}},a.PointerMap=b}(window.PointerEventsPolyfill),function(a){var b=["bubbles","cancelable","view","detail","screenX","screenY","clientX","clientY","ctrlKey","altKey","shiftKey","metaKey","button","relatedTarget","buttons","pointerId","width","height","pressure","tiltX","tiltY","pointerType","hwTimestamp","isPrimary","type","target","currentTarget","which"],c=[!1,!1,null,null,0,0,0,0,!1,!1,!1,!1,0,null,0,0,0,0,0,0,0,"",0,!1,"",null,null,0],d="undefined"!=typeof SVGElementInstance,e={targets:new WeakMap,handledEvents:new WeakMap,pointermap:new a.PointerMap,eventMap:{},eventSources:{},eventSourceList:[],registerSource:function(a,b){var c=b,d=c.events;d&&(d.forEach(function(a){c[a]&&(this.eventMap[a]=c[a].bind(c))},this),this.eventSources[a]=c,this.eventSourceList.push(c))},register:function(a){for(var b,c=this.eventSourceList.length,d=0;c>d&&(b=this.eventSourceList[d]);d++)b.register.call(b,a)},unregister:function(a){for(var b,c=this.eventSourceList.length,d=0;c>d&&(b=this.eventSourceList[d]);d++)b.unregister.call(b,a)},contains:a.external.contains||function(a,b){return a.contains(b)},down:function(a){a.bubbles=!0,this.fireEvent("pointerdown",a)},move:function(a){a.bubbles=!0,this.fireEvent("pointermove",a)},up:function(a){a.bubbles=!0,this.fireEvent("pointerup",a)},enter:function(a){a.bubbles=!1,this.fireEvent("pointerenter",a)},leave:function(a){a.bubbles=!1,this.fireEvent("pointerleave",a)},over:function(a){a.bubbles=!0,this.fireEvent("pointerover",a)},out:function(a){a.bubbles=!0,this.fireEvent("pointerout",a)},cancel:function(a){a.bubbles=!0,this.fireEvent("pointercancel",a)},leaveOut:function(a){this.out(a),this.contains(a.target,a.relatedTarget)||this.leave(a)},enterOver:function(a){this.over(a),this.contains(a.target,a.relatedTarget)||this.enter(a)},eventHandler:function(a){if(!this.handledEvents.get(a)){var b=a.type,c=this.eventMap&&this.eventMap[b];c&&c(a),this.handledEvents.set(a,!0)}},listen:function(a,b){b.forEach(function(b){this.addEvent(a,b)},this)},unlisten:function(a,b){b.forEach(function(b){this.removeEvent(a,b)},this)},addEvent:a.external.addEvent||function(a,b){a.addEventListener(b,this.boundHandler)},removeEvent:a.external.removeEvent||function(a,b){a.removeEventListener(b,this.boundHandler)},makeEvent:function(a,b){this.captureInfo&&(b.relatedTarget=null);var c=new PointerEvent(a,b);return b.preventDefault&&(c.preventDefault=b.preventDefault),this.targets.set(c,this.targets.get(b)||b.target),c},fireEvent:function(a,b){var c=this.makeEvent(a,b);return this.dispatchEvent(c)},cloneEvent:function(a){for(var e,f={},g=0;g<b.length;g++)e=b[g],f[e]=a[e]||c[g],!d||"target"!==e&&"relatedTarget"!==e||f[e]instanceof SVGElementInstance&&(f[e]=f[e].correspondingUseElement);return a.preventDefault&&(f.preventDefault=function(){a.preventDefault()}),f},getTarget:function(a){return this.captureInfo&&this.captureInfo.id===a.pointerId?this.captureInfo.target:this.targets.get(a)},setCapture:function(a,b){this.captureInfo&&this.releaseCapture(this.captureInfo.id),this.captureInfo={id:a,target:b};var c=new PointerEvent("gotpointercapture",{bubbles:!0});this.implicitRelease=this.releaseCapture.bind(this,a),document.addEventListener("pointerup",this.implicitRelease),document.addEventListener("pointercancel",this.implicitRelease),this.targets.set(c,b),this.asyncDispatchEvent(c)},releaseCapture:function(a){if(this.captureInfo&&this.captureInfo.id===a){var b=new PointerEvent("lostpointercapture",{bubbles:!0}),c=this.captureInfo.target;this.captureInfo=null,document.removeEventListener("pointerup",this.implicitRelease),document.removeEventListener("pointercancel",this.implicitRelease),this.targets.set(b,c),this.asyncDispatchEvent(b)}},dispatchEvent:a.external.dispatchEvent||function(a){var b=this.getTarget(a);return b?b.dispatchEvent(a):void 0},asyncDispatchEvent:function(a){setTimeout(this.dispatchEvent.bind(this,a),0)}};e.boundHandler=e.eventHandler.bind(e),a.dispatcher=e,a.register=e.register.bind(e),a.unregister=e.unregister.bind(e)}(window.PointerEventsPolyfill),function(a){function b(a,b,c,d){this.addCallback=a.bind(d),this.removeCallback=b.bind(d),this.changedCallback=c.bind(d),g&&(this.observer=new g(this.mutationWatcher.bind(this)))}var c=Array.prototype.forEach.call.bind(Array.prototype.forEach),d=Array.prototype.map.call.bind(Array.prototype.map),e=Array.prototype.slice.call.bind(Array.prototype.slice),f=Array.prototype.filter.call.bind(Array.prototype.filter),g=window.MutationObserver||window.WebKitMutationObserver,h="[touch-action]",i={subtree:!0,childList:!0,attributes:!0,attributeOldValue:!0,attributeFilter:["touch-action"]};b.prototype={watchSubtree:function(b){a.targetFinding.canTarget(b)&&this.observer.observe(b,i)},enableOnSubtree:function(a){this.watchSubtree(a),a===document&&"complete"!==document.readyState?this.installOnLoad():this.installNewSubtree(a)},installNewSubtree:function(a){c(this.findElements(a),this.addElement,this)},findElements:function(a){return a.querySelectorAll?a.querySelectorAll(h):[]},removeElement:function(a){this.removeCallback(a)},addElement:function(a){this.addCallback(a)},elementChanged:function(a,b){this.changedCallback(a,b)},concatLists:function(a,b){return a.concat(e(b))},installOnLoad:function(){document.addEventListener("readystatechange",function(){"complete"===document.readyState&&this.installNewSubtree(document)}.bind(this))},isElement:function(a){return a.nodeType===Node.ELEMENT_NODE},flattenMutationTree:function(a){var b=d(a,this.findElements,this);return b.push(f(a,this.isElement)),b.reduce(this.concatLists,[])},mutationWatcher:function(a){a.forEach(this.mutationHandler,this)},mutationHandler:function(a){if("childList"===a.type){var b=this.flattenMutationTree(a.addedNodes);b.forEach(this.addElement,this);var c=this.flattenMutationTree(a.removedNodes);c.forEach(this.removeElement,this)}else"attributes"===a.type&&this.elementChanged(a.target,a.oldValue)}},g||(b.prototype.watchSubtree=function(){console.warn("PointerEventsPolyfill: MutationObservers not found, touch-action will not be dynamically detected")}),a.Installer=b}(window.PointerEventsPolyfill),function(a){var b=a.dispatcher,c=b.pointermap,d=25,e={POINTER_ID:1,POINTER_TYPE:"mouse",events:["mousedown","mousemove","mouseup","mouseover","mouseout"],register:function(a){b.listen(a,this.events)},unregister:function(a){b.unlisten(a,this.events)},lastTouches:[],isEventSimulatedFromTouch:function(a){for(var b,c=this.lastTouches,e=a.clientX,f=a.clientY,g=0,h=c.length;h>g&&(b=c[g]);g++){var i=Math.abs(e-b.x),j=Math.abs(f-b.y);if(d>=i&&d>=j)return!0}},prepareEvent:function(a){var c=b.cloneEvent(a),d=c.preventDefault;return c.preventDefault=function(){a.preventDefault(),d()},c.pointerId=this.POINTER_ID,c.isPrimary=!0,c.pointerType=this.POINTER_TYPE,c},mousedown:function(a){if(!this.isEventSimulatedFromTouch(a)){var d=c.has(this.POINTER_ID);d&&this.cancel(a);var e=this.prepareEvent(a);c.set(this.POINTER_ID,a),b.down(e)}},mousemove:function(a){if(!this.isEventSimulatedFromTouch(a)){var c=this.prepareEvent(a);b.move(c)}},mouseup:function(a){if(!this.isEventSimulatedFromTouch(a)){var d=c.get(this.POINTER_ID);if(d&&d.button===a.button){var e=this.prepareEvent(a);b.up(e),this.cleanupMouse()}}},mouseover:function(a){if(!this.isEventSimulatedFromTouch(a)){var c=this.prepareEvent(a);b.enterOver(c)}},mouseout:function(a){if(!this.isEventSimulatedFromTouch(a)){var c=this.prepareEvent(a);b.leaveOut(c)}},cancel:function(a){var c=this.prepareEvent(a);b.cancel(c),this.cleanupMouse()},cleanupMouse:function(){c["delete"](this.POINTER_ID)}};a.mouseEvents=e}(window.PointerEventsPolyfill),function(a){var b,c=a.dispatcher,d=a.findTarget,e=a.targetFinding.allShadows.bind(a.targetFinding),f=c.pointermap,g=Array.prototype.map.call.bind(Array.prototype.map),h=2500,i=200,j="touch-action",k=!1,l={scrollType:new WeakMap,events:["touchstart","touchmove","touchend","touchcancel"],register:function(a){k?c.listen(a,this.events):b.enableOnSubtree(a)},unregister:function(a){k&&c.unlisten(a,this.events)},elementAdded:function(a){var b=a.getAttribute(j),d=this.touchActionToScrollType(b);d&&(this.scrollType.set(a,d),c.listen(a,this.events),e(a).forEach(function(a){this.scrollType.set(a,d),c.listen(a,this.events)},this))},elementRemoved:function(a){this.scrollType["delete"](a),c.unlisten(a,this.events),e(a).forEach(function(a){this.scrollType["delete"](a),c.unlisten(a,this.events)},this)},elementChanged:function(a,b){var c=a.getAttribute(j),d=this.touchActionToScrollType(c),f=this.touchActionToScrollType(b);d&&f?(this.scrollType.set(a,d),e(a).forEach(function(a){this.scrollType.set(a,d)},this)):f?this.elementRemoved(a):d&&this.elementAdded(a)},scrollTypes:{EMITTER:"none",XSCROLLER:"pan-x",YSCROLLER:"pan-y",SCROLLER:/^(?:pan-x pan-y)|(?:pan-y pan-x)|auto$/},touchActionToScrollType:function(a){var b=a,c=this.scrollTypes;return"none"===b?"none":b===c.XSCROLLER?"X":b===c.YSCROLLER?"Y":c.SCROLLER.exec(b)?"XY":void 0},POINTER_TYPE:"touch",firstTouch:null,isPrimaryTouch:function(a){return this.firstTouch===a.identifier},setPrimaryTouch:function(a){(0===f.pointers()||1===f.pointers()&&f.has(1))&&(this.firstTouch=a.identifier,this.firstXY={X:a.clientX,Y:a.clientY},this.scrolling=!1,this.cancelResetClickCount())},removePrimaryPointer:function(a){a.isPrimary&&(this.firstTouch=null,this.firstXY=null,this.resetClickCount())},clickCount:0,resetId:null,resetClickCount:function(){var a=function(){this.clickCount=0,this.resetId=null}.bind(this);this.resetId=setTimeout(a,i)},cancelResetClickCount:function(){this.resetId&&clearTimeout(this.resetId)},typeToButtons:function(a){var b=0;return("touchstart"===a||"touchmove"===a)&&(b=1),b},touchToPointer:function(a){var b=c.cloneEvent(a);return b.pointerId=a.identifier+2,b.target=d(b),b.bubbles=!0,b.cancelable=!0,b.detail=this.clickCount,b.button=0,b.buttons=this.typeToButtons(this.currentTouchEvent),b.width=a.webkitRadiusX||a.radiusX||0,b.height=a.webkitRadiusY||a.radiusY||0,b.pressure=a.webkitForce||a.force||.5,b.isPrimary=this.isPrimaryTouch(a),b.pointerType=this.POINTER_TYPE,b},processTouches:function(a,b){var c=a.changedTouches;this.currentTouchEvent=a.type;var d=g(c,this.touchToPointer,this);d.forEach(function(b){b.preventDefault=function(){this.scrolling=!1,this.firstXY=null,a.preventDefault()}},this),d.forEach(b,this)},shouldScroll:function(a){if(this.firstXY){var b,c=this.scrollType.get(a.currentTarget);if("none"===c)b=!1;else if("XY"===c)b=!0;else{var d=a.changedTouches[0],e=c,f="Y"===c?"X":"Y",g=Math.abs(d["client"+e]-this.firstXY[e]),h=Math.abs(d["client"+f]-this.firstXY[f]);b=g>=h}return this.firstXY=null,b}},findTouch:function(a,b){for(var c,d=0,e=a.length;e>d&&(c=a[d]);d++)if(c.identifier===b)return!0},vacuumTouches:function(a){var b=a.touches;if(f.pointers()>=b.length){var c=[];f.forEach(function(a,d){if(1!==d&&!this.findTouch(b,d-2)){var e=a.out;c.push(this.touchToPointer(e))}},this),c.forEach(this.cancelOut,this)}},touchstart:function(a){this.vacuumTouches(a),this.setPrimaryTouch(a.changedTouches[0]),this.dedupSynthMouse(a),this.scrolling||(this.clickCount++,this.processTouches(a,this.overDown))},overDown:function(a){f.set(a.pointerId,{target:a.target,out:a,outTarget:a.target});c.over(a),c.enter(a),c.down(a)},touchmove:function(a){this.scrolling||(this.shouldScroll(a)?(this.scrolling=!0,this.touchcancel(a)):(a.preventDefault(),this.processTouches(a,this.moveOverOut)))},moveOverOut:function(a){var b=a,d=f.get(b.pointerId);if(d){var e=d.out,g=d.outTarget;c.move(b),e&&g!==b.target&&(e.relatedTarget=b.target,b.relatedTarget=g,e.target=g,b.target?(c.leaveOut(e),c.enterOver(b)):(b.target=g,b.relatedTarget=null,this.cancelOut(b))),d.out=b,d.outTarget=b.target}},touchend:function(a){this.dedupSynthMouse(a),this.processTouches(a,this.upOut)},upOut:function(a){this.scrolling||(c.up(a),c.out(a),c.leave(a)),this.cleanUpPointer(a)},touchcancel:function(a){this.processTouches(a,this.cancelOut)},cancelOut:function(a){c.cancel(a),c.out(a),c.leave(a),this.cleanUpPointer(a)},cleanUpPointer:function(a){f["delete"](a.pointerId),this.removePrimaryPointer(a)},dedupSynthMouse:function(b){var c=a.mouseEvents.lastTouches,d=b.changedTouches[0];if(this.isPrimaryTouch(d)){var e={x:d.clientX,y:d.clientY};c.push(e);var f=function(a,b){var c=a.indexOf(b);c>-1&&a.splice(c,1)}.bind(null,c,e);setTimeout(f,h)}}};k||(b=new a.Installer(l.elementAdded,l.elementRemoved,l.elementChanged,l)),a.touchEvents=l}(window.PointerEventsPolyfill),function(a){var b=a.dispatcher,c=b.pointermap,d=window.MSPointerEvent&&"number"==typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE,e={events:["MSPointerDown","MSPointerMove","MSPointerUp","MSPointerOut","MSPointerOver","MSPointerCancel","MSGotPointerCapture","MSLostPointerCapture"],register:function(a){b.listen(a,this.events)},unregister:function(a){b.unlisten(a,this.events)},POINTER_TYPES:["","unavailable","touch","pen","mouse"],prepareEvent:function(a){var c=a;return d&&(c=b.cloneEvent(a),c.pointerType=this.POINTER_TYPES[a.pointerType]),c},cleanup:function(a){c["delete"](a)},MSPointerDown:function(a){c.set(a.pointerId,a);var d=this.prepareEvent(a);b.down(d)},MSPointerMove:function(a){var c=this.prepareEvent(a);b.move(c)},MSPointerUp:function(a){var c=this.prepareEvent(a);b.up(c),this.cleanup(a.pointerId)},MSPointerOut:function(a){var c=this.prepareEvent(a);b.leaveOut(c)},MSPointerOver:function(a){var c=this.prepareEvent(a);b.enterOver(c)},MSPointerCancel:function(a){var c=this.prepareEvent(a);b.cancel(c),this.cleanup(a.pointerId)},MSLostPointerCapture:function(a){var c=b.makeEvent("lostpointercapture",a);b.dispatchEvent(c)},MSGotPointerCapture:function(a){var c=b.makeEvent("gotpointercapture",a);b.dispatchEvent(c)}};a.msEvents=e}(window.PointerEventsPolyfill),function(a){var b=a.dispatcher;if(void 0===window.navigator.pointerEnabled){if(Object.defineProperty(window.navigator,"pointerEnabled",{value:!0,enumerable:!0}),window.navigator.msPointerEnabled){var c=window.navigator.msMaxTouchPoints;Object.defineProperty(window.navigator,"maxTouchPoints",{value:c,enumerable:!0}),b.registerSource("ms",a.msEvents)}else b.registerSource("mouse",a.mouseEvents),void 0!==window.ontouchstart&&b.registerSource("touch",a.touchEvents);b.register(document)}}(window.PointerEventsPolyfill),function(a){function b(a){if(!e.pointermap.has(a))throw new Error("InvalidPointerId")}var c,d,e=a.dispatcher,f=window.navigator;f.msPointerEnabled?(c=function(a){b(a),this.msSetPointerCapture(a)},d=function(a){b(a),this.msReleasePointerCapture(a)}):(c=function(a){b(a),e.setCapture(a,this)},d=function(a){b(a),e.releaseCapture(a,this)}),window.Element&&!Element.prototype.setPointerCapture&&Object.defineProperties(Element.prototype,{setPointerCapture:{value:c},releasePointerCapture:{value:d}})}(window.PointerEventsPolyfill),PointerGestureEvent.prototype.preventTap=function(){this.tapPrevented=!0},function(a){a=a||{},a.utils={LCA:{find:function(a,b){if(a===b)return a;if(a.contains){if(a.contains(b))return a;if(b.contains(a))return b}var c=this.depth(a),d=this.depth(b),e=c-d;for(e>0?a=this.walk(a,e):b=this.walk(b,-e);a&&b&&a!==b;)a=this.walk(a,1),b=this.walk(b,1);return a},walk:function(a,b){for(var c=0;b>c;c++)a=a.parentNode;return a},depth:function(a){for(var b=0;a;)b++,a=a.parentNode;return b}}},a.findLCA=function(b,c){return a.utils.LCA.find(b,c)},window.PointerGestures=a}(window.PointerGestures),function(a){function b(){if(c){var a=new Map;return a.pointers=d,a}this.keys=[],this.values=[]}var c=window.Map&&window.Map.prototype.forEach,d=function(){return this.size};b.prototype={set:function(a,b){var c=this.keys.indexOf(a);c>-1?this.values[c]=b:(this.keys.push(a),this.values.push(b))},has:function(a){return this.keys.indexOf(a)>-1},"delete":function(a){var b=this.keys.indexOf(a);b>-1&&(this.keys.splice(b,1),this.values.splice(b,1))},get:function(a){var b=this.keys.indexOf(a);return this.values[b]},clear:function(){this.keys.length=0,this.values.length=0},forEach:function(a,b){this.values.forEach(function(c,d){a.call(b,c,this.keys[d],this)},this)},pointers:function(){return this.keys.length}},a.PointerMap=b}(window.PointerGestures),function(a){var b=["bubbles","cancelable","view","detail","screenX","screenY","clientX","clientY","ctrlKey","altKey","shiftKey","metaKey","button","relatedTarget","buttons","pointerId","width","height","pressure","tiltX","tiltY","pointerType","hwTimestamp","isPrimary","type","target","currentTarget","screenX","screenY","pageX","pageY","tapPrevented"],c=[!1,!1,null,null,0,0,0,0,!1,!1,!1,!1,0,null,0,0,0,0,0,0,0,"",0,!1,"",null,null,0,0,0,0],d={handledEvents:new WeakMap,targets:new WeakMap,handlers:{},recognizers:{},events:{},registerRecognizer:function(a,b){var c=b;this.recognizers[a]=c,c.events.forEach(function(a){if(c[a]){this.events[a]=!0;var b=c[a].bind(c);this.addHandler(a,b)}},this)},addHandler:function(a,b){var c=a;this.handlers[c]||(this.handlers[c]=[]),this.handlers[c].push(b)},registerTarget:function(a){this.listen(Object.keys(this.events),a)},unregisterTarget:function(a){this.unlisten(Object.keys(this.events),a)},eventHandler:function(a){if(!this.handledEvents.get(a)){var b=a.type,c=this.handlers[b];c&&this.makeQueue(c,a),this.handledEvents.set(a,!0)}},makeQueue:function(a,b){var c=this.cloneEvent(b);setTimeout(this.runQueue.bind(this,a,c),0)},runQueue:function(a,b){this.currentPointerId=b.pointerId;for(var c,d=0,e=a.length;e>d&&(c=a[d]);d++)c(b);this.currentPointerId=0},listen:function(a,b){a.forEach(function(a){this.addEvent(a,this.boundHandler,!1,b)},this)},unlisten:function(a){a.forEach(function(a){this.removeEvent(a,this.boundHandler,!1,inTarget)},this)},addEvent:function(a,b,c,d){d.addEventListener(a,b,c)},removeEvent:function(a,b,c,d){d.removeEventListener(a,b,c)},makeEvent:function(a,b){return new PointerGestureEvent(a,b)},cloneEvent:function(a){for(var d,e={},f=0;f<b.length;f++)d=b[f],e[d]=a[d]||c[f];return e},dispatchEvent:function(a,b){var c=b||this.targets.get(a);c&&(c.dispatchEvent(a),a.tapPrevented&&this.preventTap(this.currentPointerId))},asyncDispatchEvent:function(a,b){var c=function(){this.dispatchEvent(a,b)}.bind(this);setTimeout(c,0)},preventTap:function(a){var b=this.recognizers.tap;b&&b.preventTap(a)}};d.boundHandler=d.eventHandler.bind(d),d.registerQueue=[],d.immediateRegister=!1,a.dispatcher=d,a.register=function(b){if(d.immediateRegister){var c=window.PointerEventsPolyfill;c&&c.register(b),a.dispatcher.registerTarget(b)}else d.registerQueue.push(b)},a.register(document)}(window.PointerGestures),function(a){var b=a.dispatcher,c={HOLD_DELAY:200,WIGGLE_THRESHOLD:16,events:["pointerdown","pointermove","pointerup","pointercancel"],heldPointer:null,holdJob:null,pulse:function(){var a=Date.now()-this.heldPointer.timeStamp,b=this.held?"holdpulse":"hold";this.fireHold(b,a),this.held=!0},cancel:function(){clearInterval(this.holdJob),this.held&&this.fireHold("release"),this.held=!1,this.heldPointer=null,this.target=null,this.holdJob=null},pointerdown:function(a){a.isPrimary&&!this.heldPointer&&(this.heldPointer=a,this.target=a.target,this.holdJob=setInterval(this.pulse.bind(this),this.HOLD_DELAY))},pointerup:function(a){this.heldPointer&&this.heldPointer.pointerId===a.pointerId&&this.cancel()},pointercancel:function(){this.cancel()},pointermove:function(a){if(this.heldPointer&&this.heldPointer.pointerId===a.pointerId){var b=a.clientX-this.heldPointer.clientX,c=a.clientY-this.heldPointer.clientY;b*b+c*c>this.WIGGLE_THRESHOLD&&this.cancel()}},fireHold:function(a,c){var d={pointerType:this.heldPointer.pointerType,clientX:this.heldPointer.clientX,clientY:this.heldPointer.clientY};c&&(d.holdTime=c);var e=b.makeEvent(a,d);b.dispatchEvent(e,this.target),e.tapPrevented&&b.preventTap(this.heldPointer.pointerId)}};b.registerRecognizer("hold",c)}(window.PointerGestures),function(a){var b=a.dispatcher,c=new a.PointerMap,d={events:["pointerdown","pointermove","pointerup","pointercancel"],WIGGLE_THRESHOLD:4,clampDir:function(a){return a>0?1:-1},calcPositionDelta:function(a,b){var c=0,d=0;return a&&b&&(c=b.pageX-a.pageX,d=b.pageY-a.pageY),{x:c,y:d}},fireTrack:function(a,c,d){var e=d,f=this.calcPositionDelta(e.downEvent,c),g=this.calcPositionDelta(e.lastMoveEvent,c);g.x&&(e.xDirection=this.clampDir(g.x)),g.y&&(e.yDirection=this.clampDir(g.y));var h={dx:f.x,dy:f.y,ddx:g.x,ddy:g.y,clientX:c.clientX,clientY:c.clientY,pageX:c.pageX,pageY:c.pageY,screenX:c.screenX,screenY:c.screenY,xDirection:e.xDirection,yDirection:e.yDirection,trackInfo:e.trackInfo,relatedTarget:c.target,pointerType:c.pointerType},i=b.makeEvent(a,h);e.lastMoveEvent=c,b.dispatchEvent(i,e.downTarget)},pointerdown:function(a){if(a.isPrimary&&("mouse"===a.pointerType?1===a.buttons:!0)){var b={downEvent:a,downTarget:a.target,trackInfo:{},lastMoveEvent:null,xDirection:0,yDirection:0,tracking:!1};c.set(a.pointerId,b)}},pointermove:function(a){var b=c.get(a.pointerId);if(b)if(b.tracking)this.fireTrack("track",a,b);else{var d=this.calcPositionDelta(b.downEvent,a),e=d.x*d.x+d.y*d.y;e>this.WIGGLE_THRESHOLD&&(b.tracking=!0,this.fireTrack("trackstart",b.downEvent,b),this.fireTrack("track",a,b))}},pointerup:function(a){var b=c.get(a.pointerId);b&&(b.tracking&&this.fireTrack("trackend",a,b),c.delete(a.pointerId))},pointercancel:function(a){this.pointerup(a)}};b.registerRecognizer("track",d)}(window.PointerGestures),function(a){var b=a.dispatcher,c={MIN_VELOCITY:.5,MAX_QUEUE:4,moveQueue:[],target:null,pointerId:null,events:["pointerdown","pointermove","pointerup","pointercancel"],pointerdown:function(a){a.isPrimary&&!this.pointerId&&(this.pointerId=a.pointerId,this.target=a.target,this.addMove(a))},pointermove:function(a){a.pointerId===this.pointerId&&this.addMove(a)},pointerup:function(a){a.pointerId===this.pointerId&&this.fireFlick(a),this.cleanup()},pointercancel:function(){this.cleanup()},cleanup:function(){this.moveQueue=[],this.target=null,this.pointerId=null},addMove:function(a){this.moveQueue.length>=this.MAX_QUEUE&&this.moveQueue.shift(),this.moveQueue.push(a)},fireFlick:function(a){for(var c,d,e,f,g,h,i,j=a,k=this.moveQueue.length,l=0,m=0,n=0,o=0;k>o&&(i=this.moveQueue[o]);o++)c=j.timeStamp-i.timeStamp,d=j.clientX-i.clientX,e=j.clientY-i.clientY,f=d/c,g=e/c,h=Math.sqrt(f*f+g*g),h>n&&(l=f,m=g,n=h);var p=Math.abs(l)>Math.abs(m)?"x":"y",q=this.calcAngle(l,m);if(Math.abs(n)>=this.MIN_VELOCITY){var r=b.makeEvent("flick",{xVelocity:l,yVelocity:m,velocity:n,angle:q,majorAxis:p,pointerType:a.pointerType});b.dispatchEvent(r,this.target)}},calcAngle:function(a,b){return 180*Math.atan2(b,a)/Math.PI}};b.registerRecognizer("flick",c)}(window.PointerGestures),function(a){var b=a.dispatcher,c=new a.PointerMap,d=180/Math.PI,e={events:["pointerdown","pointermove","pointerup","pointercancel"],reference:{},pointerdown:function(b){if(c.set(b.pointerId,b),2==c.pointers()){var d=this.calcChord(),e=this.calcAngle(d);this.reference={angle:e,diameter:d.diameter,target:a.findLCA(d.a.target,d.b.target)}}},pointerup:function(a){c.delete(a.pointerId)},pointermove:function(a){c.has(a.pointerId)&&(c.set(a.pointerId,a),c.pointers()>1&&this.calcPinchRotate())},pointercancel:function(a){this.pointerup(a)},dispatchPinch:function(a,c){var d=a/this.reference.diameter,e=b.makeEvent("pinch",{scale:d,centerX:c.center.x,centerY:c.center.y});b.dispatchEvent(e,this.reference.target)},dispatchRotate:function(a,c){var d=Math.round((a-this.reference.angle)%360),e=b.makeEvent("rotate",{angle:d,centerX:c.center.x,centerY:c.center.y});b.dispatchEvent(e,this.reference.target)},calcPinchRotate:function(){var a=this.calcChord(),b=a.diameter,c=this.calcAngle(a);b!=this.reference.diameter&&this.dispatchPinch(b,a),c!=this.reference.angle&&this.dispatchRotate(c,a)},calcChord:function(){var a=[];c.forEach(function(b){a.push(b)});for(var b,d,e,f=0,g={a:a[0],b:a[1]},h=0;h<a.length;h++)for(var i=a[h],j=h+1;j<a.length;j++){var k=a[j];b=Math.abs(i.clientX-k.clientX),d=Math.abs(i.clientY-k.clientY),e=b+d,e>f&&(f=e,g={a:i,b:k})}return b=Math.abs(g.a.clientX+g.b.clientX)/2,d=Math.abs(g.a.clientY+g.b.clientY)/2,g.center={x:b,y:d},g.diameter=f,g},calcAngle:function(a){var b=a.a.clientX-a.b.clientX,c=a.a.clientY-a.b.clientY;return(360+Math.atan2(c,b)*d)%360}};b.registerRecognizer("pinch",e)}(window.PointerGestures),function(a){var b=a.dispatcher,c=new a.PointerMap,d={events:["pointerdown","pointermove","pointerup","pointercancel","keyup"],pointerdown:function(a){a.isPrimary&&!a.tapPrevented&&c.set(a.pointerId,{target:a.target,buttons:a.buttons,x:a.clientX,y:a.clientY})},pointermove:function(a){if(a.isPrimary){var b=c.get(a.pointerId);b&&a.tapPrevented&&c.delete(a.pointerId)}},shouldTap:function(a,b){return a.tapPrevented?void 0:"mouse"===a.pointerType?1===b.buttons:!0},pointerup:function(d){var e=c.get(d.pointerId);if(e&&this.shouldTap(d,e)){var f=a.findLCA(e.target,d.target);if(f){var g=b.makeEvent("tap",{x:d.clientX,y:d.clientY,detail:d.detail,pointerType:d.pointerType});b.dispatchEvent(g,f)}}c.delete(d.pointerId)},pointercancel:function(a){c.delete(a.pointerId)},keyup:function(a){var c=a.keyCode;if(32===c){var d=a.target;d instanceof HTMLInputElement||d instanceof HTMLTextAreaElement||b.dispatchEvent(b.makeEvent("tap",{x:0,y:0,detail:0,pointerType:"unavailable"}),d)}},preventTap:function(a){c.delete(a)}};b.registerRecognizer("tap",d)}(window.PointerGestures),function(a){function b(){c.immediateRegister=!0;var b=c.registerQueue;b.forEach(a.register),b.length=0}var c=a.dispatcher;"complete"===document.readyState?b():document.addEventListener("readystatechange",function(){"complete"===document.readyState&&b()})}(window.PointerGestures),function(){"use strict";function a(a){for(;a.parentNode;)a=a.parentNode;return"function"==typeof a.getElementById?a:null}function b(a,b){var c=a.bindings;if(!c)return void(a.bindings={});var d=c[b];d&&(d.close(),c[b]=void 0)}function c(a){return null==a?"":a}function d(a,b){a.data=c(b)}function e(a){return function(b){return d(a,b)}}function f(a,b,d,e){return d?void(e?a.setAttribute(b,""):a.removeAttribute(b)):void a.setAttribute(b,c(e))}function g(a,b,c){return function(d){f(a,b,c,d)}}function h(a){switch(a.type){case"checkbox":return s;case"radio":case"select-multiple":case"select-one":return"change";case"range":if(/Trident|MSIE/.test(navigator.userAgent))return"change";default:return"input"}}function i(a,b,d,e){a[b]=(e||c)(d)}function j(a,b,c){return function(d){return i(a,b,d,c)}}function k(){}function l(a,b,c,d){function e(){c.setValue(a[b]),c.discardChanges(),(d||k)(a),Platform.performMicrotaskCheckpoint()}var f=h(a);a.addEventListener(f,e);var g=c.close;c.close=function(){g&&(a.removeEventListener(f,e),c.close=g,c.close(),g=void 0)}}function m(a){return Boolean(a)}function n(b){if(b.form)return r(b.form.elements,function(a){return a!=b&&"INPUT"==a.tagName&&"radio"==a.type&&a.name==b.name});var c=a(b);if(!c)return[];var d=c.querySelectorAll('input[type="radio"][name="'+b.name+'"]');return r(d,function(a){return a!=b&&!a.form})}function o(a){"INPUT"===a.tagName&&"radio"===a.type&&n(a).forEach(function(a){var b=a.bindings.checked;b&&b.setValue(!1)})}function p(a,b){var d,e,f,g=a.parentNode;g instanceof HTMLSelectElement&&g.bindings&&g.bindings.value&&(d=g,e=d.bindings.value,f=d.value),a.value=c(b),d&&d.value!=f&&(e.setValue(d.value),e.discardChanges(),Platform.performMicrotaskCheckpoint())}function q(a){return function(b){p(a,b)}}var r=Array.prototype.filter.call.bind(Array.prototype.filter);Node.prototype.bind=function(a,b){console.error("Unhandled binding to Node: ",this,a,b)},Node.prototype.unbind=function(a){b(this,a)},Node.prototype.unbindAll=function(){if(this.bindings){for(var a=Object.keys(this.bindings),b=0;b<a.length;b++){var c=this.bindings[a[b]];c&&c.close()}this.bindings={}}},Text.prototype.bind=function(a,c,f){return"textContent"!==a?Node.prototype.bind.call(this,a,c,f):f?d(this,c):(b(this,"textContent"),d(this,c.open(e(this))),this.bindings.textContent=c)},Element.prototype.bind=function(a,c,d){var e="?"==a[a.length-1];return e&&(this.removeAttribute(a),a=a.slice(0,-1)),d?f(this,a,e,c):(b(this,a),f(this,a,e,c.open(g(this,a,e))),this.bindings[a]=c)};var s;!function(){var a=document.createElement("div"),b=a.appendChild(document.createElement("input"));b.setAttribute("type","checkbox");var c,d=0;b.addEventListener("click",function(){d++,c=c||"click"}),b.addEventListener("change",function(){d++,c=c||"change"});var e=document.createEvent("MouseEvent");e.initMouseEvent("click",!0,!0,window,0,0,0,0,0,!1,!1,!1,!1,0,null),b.dispatchEvent(e),s=1==d?"change":c}(),HTMLInputElement.prototype.bind=function(a,d,e){if("value"!==a&&"checked"!==a)return HTMLElement.prototype.bind.call(this,a,d,e);this.removeAttribute(a);var f="checked"==a?m:c,g="checked"==a?o:k;return e?i(this,a,d,f):(b(this,a),l(this,a,d,g),i(this,a,d.open(j(this,a,f)),f),this.bindings[a]=d)},HTMLTextAreaElement.prototype.bind=function(a,d,e){return"value"!==a?HTMLElement.prototype.bind.call(this,a,d,e):(this.removeAttribute("value"),e?i(this,"value",d):(b(this,"value"),l(this,"value",d),i(this,"value",d.open(j(this,"value",c))),this.bindings.value=d))},HTMLOptionElement.prototype.bind=function(a,c,d){return"value"!==a?HTMLElement.prototype.bind.call(this,a,c,d):(this.removeAttribute("value"),d?p(this,c):(b(this,"value"),l(this,"value",c),p(this,c.open(q(this))),this.bindings.value=c))},HTMLSelectElement.prototype.bind=function(a,c,d){return"selectedindex"===a&&(a="selectedIndex"),"selectedIndex"!==a&&"value"!==a?HTMLElement.prototype.bind.call(this,a,c,d):(this.removeAttribute(a),d?i(this,a,c):(b(this,a),l(this,a,c),i(this,a,c.open(j(this,a))),this.bindings[a]=c))}}(this),function(a){"use strict";function b(a){if(!a)throw new Error("Assertion failed")}function c(a){for(var b;b=a.parentNode;)a=b;return a}function d(a,b){if(b){for(var d,e="#"+b;!d&&(a=c(a),a.protoContent_?d=a.protoContent_.querySelector(e):a.getElementById&&(d=a.getElementById(b)),!d&&a.templateCreator_);)a=a.templateCreator_;return d}}function e(a){return"template"==a.tagName&&"http://www.w3.org/2000/svg"==a.namespaceURI}function f(a){return"TEMPLATE"==a.tagName&&"http://www.w3.org/1999/xhtml"==a.namespaceURI}function g(a){return Boolean(J[a.tagName]&&a.hasAttribute("template"))}function h(a){return void 0===a.isTemplate_&&(a.isTemplate_="TEMPLATE"==a.tagName||g(a)),a.isTemplate_}function i(a,b){var c=a.querySelectorAll(L);h(a)&&b(a),E(c,b)}function j(a){function b(a){HTMLTemplateElement.decorate(a)||j(a.content)}i(a,b)}function k(a,b){Object.getOwnPropertyNames(b).forEach(function(c){Object.defineProperty(a,c,Object.getOwnPropertyDescriptor(b,c))})}function l(a){var b=a.ownerDocument;if(!b.defaultView)return b;var c=b.templateContentsOwner_;if(!c){for(c=b.implementation.createHTMLDocument("");c.lastChild;)c.removeChild(c.lastChild);b.templateContentsOwner_=c}return c}function m(a){if(!a.stagingDocument_){var b=a.ownerDocument;if(!b.stagingDocument_){b.stagingDocument_=b.implementation.createHTMLDocument("");var c=b.stagingDocument_.createElement("base");c.href=document.baseURI,b.stagingDocument_.head.appendChild(c),b.stagingDocument_.stagingDocument_=b.stagingDocument_}a.stagingDocument_=b.stagingDocument_}return a.stagingDocument_}function n(a){var b=a.ownerDocument.createElement("template");a.parentNode.insertBefore(b,a);for(var c=a.attributes,d=c.length;d-->0;){var e=c[d];I[e.name]&&("template"!==e.name&&b.setAttribute(e.name,e.value),a.removeAttribute(e.name))}return b}function o(a){var b=a.ownerDocument.createElement("template");a.parentNode.insertBefore(b,a);for(var c=a.attributes,d=c.length;d-->0;){var e=c[d];b.setAttribute(e.name,e.value),a.removeAttribute(e.name)
}return a.parentNode.removeChild(a),b}function p(a,b,c){var d=a.content;if(c)return void d.appendChild(b);for(var e;e=b.firstChild;)d.appendChild(e)}function q(a){N?a.__proto__=HTMLTemplateElement.prototype:k(a,HTMLTemplateElement.prototype)}function r(a){a.setModelFn_||(a.setModelFn_=function(){a.setModelFnScheduled_=!1;var b=z(a,a.delegate_&&a.delegate_.prepareBinding);w(a,b,a.model_)}),a.setModelFnScheduled_||(a.setModelFnScheduled_=!0,Observer.runEOM_(a.setModelFn_))}function s(a,b,c,d){if(a&&a.length){for(var e,f=a.length,g=0,h=0,i=0,j=!0;f>h;){var g=a.indexOf("{{",h),k=a.indexOf("[[",h),l=!1,m="}}";if(k>=0&&(0>g||g>k)&&(g=k,l=!0,m="]]"),i=0>g?-1:a.indexOf(m,g+2),0>i){if(!e)return;e.push(a.slice(h));break}e=e||[],e.push(a.slice(h,g));var n=a.slice(g+2,i).trim();e.push(l),j=j&&l,e.push(Path.get(n));var o=d&&d(n,b,c);e.push(o),h=i+2}return h===f&&e.push(""),e.hasOnePath=5===e.length,e.isSimplePath=e.hasOnePath&&""==e[0]&&""==e[4],e.onlyOneTime=j,e.combinator=function(a){for(var b=e[0],c=1;c<e.length;c+=4){var d=e.hasOnePath?a:a[(c-1)/4];void 0!==d&&(b+=d),b+=e[c+3]}return b},e}}function t(a,b,c,d){if(b.hasOnePath){var e=b[3],f=e?e(d,c,!0):b[2].getValueFrom(d);return b.isSimplePath?f:b.combinator(f)}for(var g=[],h=1;h<b.length;h+=4){var e=b[h+2];g[(h-1)/4]=e?e(d,c):b[h+1].getValueFrom(d)}return b.combinator(g)}function u(a,b,c,d){var e=b[3],f=e?e(d,c,!1):new PathObserver(d,b[2]);return b.isSimplePath?f:new ObserverTransform(f,b.combinator)}function v(a,b,c,d){if(b.onlyOneTime)return t(a,b,c,d);if(b.hasOnePath)return u(a,b,c,d);for(var e=new CompoundObserver,f=1;f<b.length;f+=4){var g=b[f],h=b[f+2];if(h){var i=h(d,c,g);g?e.addPath(i):e.addObserver(i)}else{var j=b[f+1];g?e.addPath(j.getValueFrom(d)):e.addPath(d,j)}}return new ObserverTransform(e,b.combinator)}function w(a,b,c,d){for(var e=0;e<b.length;e+=2){var f=b[e],g=b[e+1],h=v(f,g,a,c),i=a.bind(f,h,g.onlyOneTime);i&&d&&d.push(i)}if(b.isTemplate){a.model_=c;var j=a.processBindingDirectives_(b);d&&j&&d.push(j)}}function x(a,b,c){var d=a.getAttribute(b);return s(""==d?"{{}}":d,b,a,c)}function y(a,c){b(a);for(var d=[],e=0;e<a.attributes.length;e++){for(var f=a.attributes[e],g=f.name,i=f.value;"_"===g[0];)g=g.substring(1);if(!h(a)||g!==H&&g!==F&&g!==G){var j=s(i,g,a,c);j&&d.push(g,j)}}return h(a)&&(d.isTemplate=!0,d.if=x(a,H,c),d.bind=x(a,F,c),d.repeat=x(a,G,c),!d.if||d.bind||d.repeat||(d.bind=s("{{}}",F,a,c))),d}function z(a,b){if(a.nodeType===Node.ELEMENT_NODE)return y(a,b);if(a.nodeType===Node.TEXT_NODE){var c=s(a.data,"textContent",a,b);if(c)return["textContent",c]}return[]}function A(a,b,c,d,e,f,g){for(var h=b.appendChild(c.importNode(a,!1)),i=0,j=a.firstChild;j;j=j.nextSibling)A(j,h,c,d.children[i++],e,f,g);return d.isTemplate&&(HTMLTemplateElement.decorate(h,a),f&&h.setDelegate_(f)),w(h,d,e,g),h}function B(a,b){var c=z(a,b);c.children={};for(var d=0,e=a.firstChild;e;e=e.nextSibling)c.children[d++]=B(e,b);return c}function C(a){this.closed=!1,this.templateElement_=a,this.terminators=[],this.deps=void 0,this.iteratedValue=[],this.presentValue=void 0,this.arrayObserver=void 0}var D,E=Array.prototype.forEach.call.bind(Array.prototype.forEach);a.Map&&"function"==typeof a.Map.prototype.forEach?D=a.Map:(D=function(){this.keys=[],this.values=[]},D.prototype={set:function(a,b){var c=this.keys.indexOf(a);0>c?(this.keys.push(a),this.values.push(b)):this.values[c]=b},get:function(a){var b=this.keys.indexOf(a);if(!(0>b))return this.values[b]},"delete":function(a){var b=this.keys.indexOf(a);return 0>b?!1:(this.keys.splice(b,1),this.values.splice(b,1),!0)},forEach:function(a,b){for(var c=0;c<this.keys.length;c++)a.call(b||this,this.values[c],this.keys[c],this)}});"function"!=typeof document.contains&&(Document.prototype.contains=function(a){return a===this||a.parentNode===this?!0:this.documentElement.contains(a)});var F="bind",G="repeat",H="if",I={template:!0,repeat:!0,bind:!0,ref:!0},J={THEAD:!0,TBODY:!0,TFOOT:!0,TH:!0,TR:!0,TD:!0,COLGROUP:!0,COL:!0,CAPTION:!0,OPTION:!0,OPTGROUP:!0},K="undefined"!=typeof HTMLTemplateElement;K&&!function(){var a=document.createElement("template"),b=a.content.ownerDocument,c=b.appendChild(b.createElement("html")),d=c.appendChild(b.createElement("head")),e=b.createElement("base");e.href=document.baseURI,d.appendChild(e)}();var L="template, "+Object.keys(J).map(function(a){return a.toLowerCase()+"[template]"}).join(", ");document.addEventListener("DOMContentLoaded",function(){j(document),Platform.performMicrotaskCheckpoint()},!1),K||(a.HTMLTemplateElement=function(){throw TypeError("Illegal constructor")});var M,N="__proto__"in{};"function"==typeof MutationObserver&&(M=new MutationObserver(function(a){for(var b=0;b<a.length;b++)a[b].target.refChanged_()})),HTMLTemplateElement.decorate=function(a,c){if(a.templateIsDecorated_)return!1;var d=a;d.templateIsDecorated_=!0;var h=f(d)&&K,i=h,k=!h,m=!1;if(h||(g(d)?(b(!c),d=n(a),d.templateIsDecorated_=!0,h=K,m=!0):e(d)&&(d=o(a),d.templateIsDecorated_=!0,h=K)),!h){q(d);var r=l(d);d.content_=r.createDocumentFragment()}return c?d.instanceRef_=c:k?p(d,a,m):i&&j(d.content),!0},HTMLTemplateElement.bootstrap=j;var O=a.HTMLUnknownElement||HTMLElement,P={get:function(){return this.content_},enumerable:!0,configurable:!0};K||(HTMLTemplateElement.prototype=Object.create(O.prototype),Object.defineProperty(HTMLTemplateElement.prototype,"content",P)),k(HTMLTemplateElement.prototype,{bind:function(a,b,c){if("ref"!=a)return Element.prototype.bind.call(this,a,b,c);var d=this,e=c?b:b.open(function(a){d.setAttribute("ref",a),d.refChanged_()});return this.setAttribute("ref",e),this.refChanged_(),c?void 0:(this.unbind("ref"),this.bindings.ref=b)},processBindingDirectives_:function(a){return this.iterator_&&this.iterator_.closeDeps(),a.if||a.bind||a.repeat?(this.iterator_||(this.iterator_=new C(this),this.bindings=this.bindings||{},this.bindings.iterator=this.iterator_),this.iterator_.updateDependencies(a,this.model_),M&&M.observe(this,{attributes:!0,attributeFilter:["ref"]}),this.iterator_):void(this.iterator_&&(this.iterator_.close(),this.iterator_=void 0,this.bindings.iterator=void 0))},createInstance:function(a,b,c,d){b&&(c=this.newDelegate_(b)),this.refContent_||(this.refContent_=this.ref_.content);var e=this.refContent_,f=this.bindingMap_;f&&f.content===e||(f=B(e,c&&c.prepareBinding)||[],f.content=e,this.bindingMap_=f);var g=m(this),h=g.createDocumentFragment();h.templateCreator_=this,h.protoContent_=e;for(var i={firstNode:null,lastNode:null,model:a},j=0,k=e.firstChild;k;k=k.nextSibling){var l=A(k,h,g,f.children[j++],a,c,d);l.templateInstance_=i}return i.firstNode=h.firstChild,i.lastNode=h.lastChild,h.templateCreator_=void 0,h.protoContent_=void 0,h},get model(){return this.model_},set model(a){this.model_=a,r(this)},get bindingDelegate(){return this.delegate_&&this.delegate_.raw},refChanged_:function(){this.iterator_&&this.refContent_!==this.ref_.content&&(this.refContent_=void 0,this.iterator_.valueChanged(),this.iterator_.updateIteratedValue())},clear:function(){this.model_=void 0,this.delegate_=void 0,this.bindings_=void 0,this.refContent_=void 0,this.iterator_&&(this.iterator_.valueChanged(),this.iterator_.close(),this.iterator_=void 0)},setDelegate_:function(a){this.delegate_=a,this.bindingMap_=void 0,this.iterator_&&(this.iterator_.instancePositionChangedFn_=void 0,this.iterator_.instanceModelFn_=void 0)},newDelegate_:function(a){function b(b){var c=a&&a[b];if("function"==typeof c)return function(){return c.apply(a,arguments)}}return a?{raw:a,prepareBinding:b("prepareBinding"),prepareInstanceModel:b("prepareInstanceModel"),prepareInstancePositionChanged:b("prepareInstancePositionChanged")}:{}},set bindingDelegate(a){if(this.delegate_)throw Error("Template must be cleared before a new bindingDelegate can be assigned");this.setDelegate_(this.newDelegate_(a))},get ref_(){var a=d(this,this.getAttribute("ref"));if(a||(a=this.instanceRef_),!a)return this;var b=a.ref_;return b?b:a}}),Object.defineProperty(Node.prototype,"templateInstance",{get:function(){var a=this.templateInstance_;return a?a:this.parentNode?this.parentNode.templateInstance:void 0}}),C.prototype={closeDeps:function(){var a=this.deps;a&&(a.ifOneTime===!1&&a.ifValue.close(),a.oneTime===!1&&a.value.close())},updateDependencies:function(a,b){this.closeDeps();var c=this.deps={},d=this.templateElement_;if(a.if){if(c.hasIf=!0,c.ifOneTime=a.if.onlyOneTime,c.ifValue=v(H,a.if,d,b),c.ifOneTime&&!c.ifValue)return void this.updateIteratedValue();c.ifOneTime||c.ifValue.open(this.updateIteratedValue,this)}a.repeat?(c.repeat=!0,c.oneTime=a.repeat.onlyOneTime,c.value=v(G,a.repeat,d,b)):(c.repeat=!1,c.oneTime=a.bind.onlyOneTime,c.value=v(F,a.bind,d,b)),c.oneTime||c.value.open(this.updateIteratedValue,this),this.updateIteratedValue()},updateIteratedValue:function(){if(this.deps.hasIf){var a=this.deps.ifValue;if(this.deps.ifOneTime||(a=a.discardChanges()),!a)return void this.valueChanged()}var b=this.deps.value;this.deps.oneTime||(b=b.discardChanges()),this.deps.repeat||(b=[b]);var c=this.deps.repeat&&!this.deps.oneTime&&Array.isArray(b);this.valueChanged(b,c)},valueChanged:function(a,b){Array.isArray(a)||(a=[]),a!==this.iteratedValue&&(this.unobserve(),this.presentValue=a,b&&(this.arrayObserver=new ArrayObserver(this.presentValue),this.arrayObserver.open(this.handleSplices,this)),this.handleSplices(ArrayObserver.calculateSplices(this.presentValue,this.iteratedValue)))},getTerminatorAt:function(a){if(-1==a)return this.templateElement_;var b=this.terminators[2*a];if(b.nodeType!==Node.ELEMENT_NODE||this.templateElement_===b)return b;var c=b.iterator_;return c?c.getTerminatorAt(c.terminators.length/2-1):b},insertInstanceAt:function(a,b,c,d){var e=this.getTerminatorAt(a-1),f=e;b?f=b.lastChild||f:c&&(f=c[c.length-1]||f),this.terminators.splice(2*a,0,f,d);var g=this.templateElement_.parentNode,h=e.nextSibling;if(b)g.insertBefore(b,h);else if(c)for(var i=0;i<c.length;i++)g.insertBefore(c[i],h)},extractInstanceAt:function(a){var b=[],c=this.getTerminatorAt(a-1),d=this.getTerminatorAt(a);b.instanceBindings=this.terminators[2*a+1],this.terminators.splice(2*a,2);for(var e=this.templateElement_.parentNode;d!==c;){var f=c.nextSibling;f==d&&(d=c),e.removeChild(f),b.push(f)}return b},getDelegateFn:function(a){return a=a&&a(this.templateElement_),"function"==typeof a?a:null},handleSplices:function(a){if(!this.closed&&a.length){var b=this.templateElement_;if(!b.parentNode)return void this.close();ArrayObserver.applySplices(this.iteratedValue,this.presentValue,a);var c=b.delegate_;void 0===this.instanceModelFn_&&(this.instanceModelFn_=this.getDelegateFn(c&&c.prepareInstanceModel)),void 0===this.instancePositionChangedFn_&&(this.instancePositionChangedFn_=this.getDelegateFn(c&&c.prepareInstancePositionChanged));var d=new D,e=0;a.forEach(function(a){a.removed.forEach(function(b){var c=this.extractInstanceAt(a.index+e);d.set(b,c)},this),e-=a.addedCount},this),a.forEach(function(a){for(var e=a.index;e<a.index+a.addedCount;e++){var f,g=this.iteratedValue[e],h=void 0,i=d.get(g);i?(d.delete(g),f=i.instanceBindings):(f=[],this.instanceModelFn_&&(g=this.instanceModelFn_(g)),void 0!==g&&(h=b.createInstance(g,void 0,c,f))),this.insertInstanceAt(e,h,i,f)}},this),d.forEach(function(a){this.closeInstanceBindings(a.instanceBindings)},this),this.instancePositionChangedFn_&&this.reportInstancesMoved(a)}},reportInstanceMoved:function(a){var b=this.getTerminatorAt(a-1),c=this.getTerminatorAt(a);if(b!==c){var d=b.nextSibling.templateInstance;this.instancePositionChangedFn_(d,a)}},reportInstancesMoved:function(a){for(var b=0,c=0,d=0;d<a.length;d++){var e=a[d];if(0!=c)for(;b<e.index;)this.reportInstanceMoved(b),b++;else b=e.index;for(;b<e.index+e.addedCount;)this.reportInstanceMoved(b),b++;c+=e.addedCount-e.removed.length}if(0!=c)for(var f=this.terminators.length/2;f>b;)this.reportInstanceMoved(b),b++},closeInstanceBindings:function(a){for(var b=0;b<a.length;b++)a[b].close()},unobserve:function(){this.arrayObserver&&(this.arrayObserver.close(),this.arrayObserver=void 0)},close:function(){if(!this.closed){this.unobserve();for(var a=1;a<this.terminators.length;a+=2)this.closeInstanceBindings(this.terminators[a]);this.terminators.length=0,this.closeDeps(),this.templateElement_.iterator_=void 0,this.closed=!0}}},HTMLTemplateElement.forAllTemplatesFrom_=i}(this),function(a){"use strict";function b(a,b){if(!a)throw new Error("ASSERT: "+b)}function c(a){return a>=48&&57>=a}function d(a){return 32===a||9===a||11===a||12===a||160===a||a>=5760&&" ᠎             　﻿".indexOf(String.fromCharCode(a))>0}function e(a){return 10===a||13===a||8232===a||8233===a}function f(a){return 36===a||95===a||a>=65&&90>=a||a>=97&&122>=a}function g(a){return 36===a||95===a||a>=65&&90>=a||a>=97&&122>=a||a>=48&&57>=a}function h(a){return"this"===a}function i(){for(;Y>X&&d(W.charCodeAt(X));)++X}function j(){var a,b;for(a=X++;Y>X&&(b=W.charCodeAt(X),g(b));)++X;return W.slice(a,X)}function k(){var a,b,c;return a=X,b=j(),c=1===b.length?S.Identifier:h(b)?S.Keyword:"null"===b?S.NullLiteral:"true"===b||"false"===b?S.BooleanLiteral:S.Identifier,{type:c,value:b,range:[a,X]}}function l(){var a,b,c=X,d=W.charCodeAt(X),e=W[X];switch(d){case 46:case 40:case 41:case 59:case 44:case 123:case 125:case 91:case 93:case 58:case 63:return++X,{type:S.Punctuator,value:String.fromCharCode(d),range:[c,X]};default:if(a=W.charCodeAt(X+1),61===a)switch(d){case 37:case 38:case 42:case 43:case 45:case 47:case 60:case 62:case 124:return X+=2,{type:S.Punctuator,value:String.fromCharCode(d)+String.fromCharCode(a),range:[c,X]};case 33:case 61:return X+=2,61===W.charCodeAt(X)&&++X,{type:S.Punctuator,value:W.slice(c,X),range:[c,X]}}}return b=W[X+1],e===b&&"&|".indexOf(e)>=0?(X+=2,{type:S.Punctuator,value:e+b,range:[c,X]}):"<>=!+-*%&|^/".indexOf(e)>=0?(++X,{type:S.Punctuator,value:e,range:[c,X]}):void s({},V.UnexpectedToken,"ILLEGAL")}function m(){var a,d,e;if(e=W[X],b(c(e.charCodeAt(0))||"."===e,"Numeric literal must start with a decimal digit or a decimal point"),d=X,a="","."!==e){for(a=W[X++],e=W[X],"0"===a&&e&&c(e.charCodeAt(0))&&s({},V.UnexpectedToken,"ILLEGAL");c(W.charCodeAt(X));)a+=W[X++];e=W[X]}if("."===e){for(a+=W[X++];c(W.charCodeAt(X));)a+=W[X++];e=W[X]}if("e"===e||"E"===e)if(a+=W[X++],e=W[X],("+"===e||"-"===e)&&(a+=W[X++]),c(W.charCodeAt(X)))for(;c(W.charCodeAt(X));)a+=W[X++];else s({},V.UnexpectedToken,"ILLEGAL");return f(W.charCodeAt(X))&&s({},V.UnexpectedToken,"ILLEGAL"),{type:S.NumericLiteral,value:parseFloat(a),range:[d,X]}}function n(){var a,c,d,f="",g=!1;for(a=W[X],b("'"===a||'"'===a,"String literal must starts with a quote"),c=X,++X;Y>X;){if(d=W[X++],d===a){a="";break}if("\\"===d)if(d=W[X++],d&&e(d.charCodeAt(0)))"\r"===d&&"\n"===W[X]&&++X;else switch(d){case"n":f+="\n";break;case"r":f+="\r";break;case"t":f+="	";break;case"b":f+="\b";break;case"f":f+="\f";break;case"v":f+="";break;default:f+=d}else{if(e(d.charCodeAt(0)))break;f+=d}}return""!==a&&s({},V.UnexpectedToken,"ILLEGAL"),{type:S.StringLiteral,value:f,octal:g,range:[c,X]}}function o(a){return a.type===S.Identifier||a.type===S.Keyword||a.type===S.BooleanLiteral||a.type===S.NullLiteral}function p(){var a;return i(),X>=Y?{type:S.EOF,range:[X,X]}:(a=W.charCodeAt(X),40===a||41===a||58===a?l():39===a||34===a?n():f(a)?k():46===a?c(W.charCodeAt(X+1))?m():l():c(a)?m():l())}function q(){var a;return a=$,X=a.range[1],$=p(),X=a.range[1],a}function r(){var a;a=X,$=p(),X=a}function s(a,c){var d,e=Array.prototype.slice.call(arguments,2),f=c.replace(/%(\d)/g,function(a,c){return b(c<e.length,"Message reference must be in range"),e[c]});throw d=new Error(f),d.index=X,d.description=f,d}function t(a){s(a,V.UnexpectedToken,a.value)}function u(a){var b=q();(b.type!==S.Punctuator||b.value!==a)&&t(b)}function v(a){return $.type===S.Punctuator&&$.value===a}function w(a){return $.type===S.Keyword&&$.value===a}function x(){var a=[];for(u("[");!v("]");)v(",")?(q(),a.push(null)):(a.push(bb()),v("]")||u(","));return u("]"),Z.createArrayExpression(a)}function y(){var a;return i(),a=q(),a.type===S.StringLiteral||a.type===S.NumericLiteral?Z.createLiteral(a):Z.createIdentifier(a.value)}function z(){var a,b;return a=$,i(),(a.type===S.EOF||a.type===S.Punctuator)&&t(a),b=y(),u(":"),Z.createProperty("init",b,bb())}function A(){var a=[];for(u("{");!v("}");)a.push(z()),v("}")||u(",");return u("}"),Z.createObjectExpression(a)}function B(){var a;return u("("),a=bb(),u(")"),a}function C(){var a,b,c;return v("(")?B():(a=$.type,a===S.Identifier?c=Z.createIdentifier(q().value):a===S.StringLiteral||a===S.NumericLiteral?c=Z.createLiteral(q()):a===S.Keyword?w("this")&&(q(),c=Z.createThisExpression()):a===S.BooleanLiteral?(b=q(),b.value="true"===b.value,c=Z.createLiteral(b)):a===S.NullLiteral?(b=q(),b.value=null,c=Z.createLiteral(b)):v("[")?c=x():v("{")&&(c=A()),c?c:void t(q()))}function D(){var a=[];if(u("("),!v(")"))for(;Y>X&&(a.push(bb()),!v(")"));)u(",");return u(")"),a}function E(){var a;return a=q(),o(a)||t(a),Z.createIdentifier(a.value)}function F(){return u("."),E()}function G(){var a;return u("["),a=bb(),u("]"),a}function H(){var a,b;for(a=C();v(".")||v("[");)v("[")?(b=G(),a=Z.createMemberExpression("[",a,b)):(b=F(),a=Z.createMemberExpression(".",a,b));return a}function I(){var a,b;return $.type!==S.Punctuator&&$.type!==S.Keyword?b=ab():v("+")||v("-")||v("!")?(a=q(),b=I(),b=Z.createUnaryExpression(a.value,b)):w("delete")||w("void")||w("typeof")?s({},V.UnexpectedToken):b=ab(),b}function J(a){var b=0;if(a.type!==S.Punctuator&&a.type!==S.Keyword)return 0;switch(a.value){case"||":b=1;break;case"&&":b=2;break;case"==":case"!=":case"===":case"!==":b=6;break;case"<":case">":case"<=":case">=":case"instanceof":b=7;break;case"in":b=7;break;case"+":case"-":b=9;break;case"*":case"/":case"%":b=11}return b}function K(){var a,b,c,d,e,f,g,h;if(g=I(),b=$,c=J(b),0===c)return g;for(b.prec=c,q(),e=I(),d=[g,b,e];(c=J($))>0;){for(;d.length>2&&c<=d[d.length-2].prec;)e=d.pop(),f=d.pop().value,g=d.pop(),a=Z.createBinaryExpression(f,g,e),d.push(a);b=q(),b.prec=c,d.push(b),a=I(),d.push(a)}for(h=d.length-1,a=d[h];h>1;)a=Z.createBinaryExpression(d[h-1].value,d[h-2],a),h-=2;return a}function L(){var a,b,c;return a=K(),v("?")&&(q(),b=L(),u(":"),c=L(),a=Z.createConditionalExpression(a,b,c)),a}function M(){var a,b;return a=q(),a.type!==S.Identifier&&t(a),b=v("(")?D():[],Z.createFilter(a.value,b)}function N(){for(;v("|");)q(),M()}function O(){i(),r();var a=bb();a&&(","===$.value||"in"==$.value&&a.type===U.Identifier?Q(a):(N(),"as"===$.value?P(a):Z.createTopLevel(a))),$.type!==S.EOF&&t($)}function P(a){q();var b=q().value;Z.createAsExpression(a,b)}function Q(a){var b;","===$.value&&(q(),$.type!==S.Identifier&&t($),b=q().value),q();var c=bb();N(),Z.createInExpression(a.name,b,c)}function R(a,b){return Z=b,W=a,X=0,Y=W.length,$=null,_={labelSet:{}},O()}var S,T,U,V,W,X,Y,Z,$,_;S={BooleanLiteral:1,EOF:2,Identifier:3,Keyword:4,NullLiteral:5,NumericLiteral:6,Punctuator:7,StringLiteral:8},T={},T[S.BooleanLiteral]="Boolean",T[S.EOF]="<end>",T[S.Identifier]="Identifier",T[S.Keyword]="Keyword",T[S.NullLiteral]="Null",T[S.NumericLiteral]="Numeric",T[S.Punctuator]="Punctuator",T[S.StringLiteral]="String",U={ArrayExpression:"ArrayExpression",BinaryExpression:"BinaryExpression",CallExpression:"CallExpression",ConditionalExpression:"ConditionalExpression",EmptyStatement:"EmptyStatement",ExpressionStatement:"ExpressionStatement",Identifier:"Identifier",Literal:"Literal",LabeledStatement:"LabeledStatement",LogicalExpression:"LogicalExpression",MemberExpression:"MemberExpression",ObjectExpression:"ObjectExpression",Program:"Program",Property:"Property",ThisExpression:"ThisExpression",UnaryExpression:"UnaryExpression"},V={UnexpectedToken:"Unexpected token %0",UnknownLabel:"Undefined label '%0'",Redeclaration:"%0 '%1' has already been declared"};var ab=H,bb=L;a.esprima={parse:R}}(this),function(a){"use strict";function b(a,b,d,e){var f;try{if(f=c(a),f.scopeIdent&&(d.nodeType!==Node.ELEMENT_NODE||"TEMPLATE"!==d.tagName||"bind"!==b&&"repeat"!==b))throw Error("as and in can only be used within <template bind/repeat>")}catch(g){return void console.error("Invalid expression syntax: "+a,g)}return function(a,b,c){var d=f.getBinding(a,e,c);return f.scopeIdent&&d&&(b.polymerExpressionScopeIdent_=f.scopeIdent,f.indexIdent&&(b.polymerExpressionIndexIdent_=f.indexIdent)),d}}function c(a){var b=s[a];if(!b){var c=new j;esprima.parse(a,c),b=new l(c),s[a]=b}return b}function d(a){this.value=a,this.valueFn_=void 0}function e(a){this.name=a,this.path=Path.get(a)}function f(a,b,c){"["==c&&b instanceof d&&Path.get(b.value).valid&&(c=".",b=new e(b.value)),this.dynamicDeps="function"==typeof a||a.dynamic,this.dynamic="function"==typeof b||b.dynamic||"["==c,this.simplePath=!this.dynamic&&!this.dynamicDeps&&b instanceof e&&(a instanceof f||a instanceof e),this.object=this.simplePath?a:i(a),this.property="."==c?b:i(b)}function g(a,b){this.name=a,this.args=[];for(var c=0;c<b.length;c++)this.args[c]=i(b[c])}function h(){throw Error("Not Implemented")}function i(a){return"function"==typeof a?a:a.valueFn()}function j(){this.expression=null,this.filters=[],this.deps={},this.currentPath=void 0,this.scopeIdent=void 0,this.indexIdent=void 0,this.dynamicDeps=!1}function k(a){this.value_=a}function l(a){if(this.scopeIdent=a.scopeIdent,this.indexIdent=a.indexIdent,!a.expression)throw Error("No expression found.");this.expression=a.expression,i(this.expression),this.filters=a.filters,this.dynamicDeps=a.dynamicDeps}function m(a){return String(a).replace(/[A-Z]/g,function(a){return"-"+a.toLowerCase()})}function n(a){return"o"===a[0]&&"n"===a[1]&&"-"===a[2]}function o(a,b){for(;a[w]&&!Object.prototype.hasOwnProperty.call(a,b);)a=a[w];return a}function p(a,b){if(0==b.length)return void 0;if(1==b.length)return o(a,b[0]);for(var c=0;null!=a&&c<b.length-1;c++)a=a[b[c]];return a}function q(a,b,c){var d=b.substring(3);return d=v[d]||d,function(b,e,f){function g(){return"{{ "+a+" }}"}var h,i,j;return j="function"==typeof c.resolveEventHandler?function(d){h=h||c.resolveEventHandler(b,a,e),h(d,d.detail,d.currentTarget),Platform&&"function"==typeof Platform.flush&&Platform.flush()}:function(c){h=h||a.getValueFrom(b),i=i||p(b,a,e),h.apply(i,[c,c.detail,c.currentTarget]),Platform&&"function"==typeof Platform.flush&&Platform.flush()},e.addEventListener(d,j),f?void 0:{open:g,discardChanges:g,close:function(){e.removeEventListener(d,j)}}}}function r(){}var s=Object.create(null);d.prototype={valueFn:function(){if(!this.valueFn_){var a=this.value;this.valueFn_=function(){return a}}return this.valueFn_}},e.prototype={valueFn:function(){if(!this.valueFn_){var a=(this.name,this.path);this.valueFn_=function(b,c){return c&&c.addPath(b,a),a.getValueFrom(b)}}return this.valueFn_},setValue:function(a,b){return 1==this.path.length,a=o(a,this.path[0]),this.path.setValueFrom(a,b)}},f.prototype={get fullPath(){if(!this.fullPath_){var a=this.object instanceof e?this.object.name:this.object.fullPath;this.fullPath_=Path.get(a+"."+this.property.name)}return this.fullPath_},valueFn:function(){if(!this.valueFn_){var a=this.object;if(this.simplePath){var b=this.fullPath;this.valueFn_=function(a,c){return c&&c.addPath(a,b),b.getValueFrom(a)}}else if(this.property instanceof e){var b=Path.get(this.property.name);this.valueFn_=function(c,d){var e=a(c,d);return d&&d.addPath(e,b),b.getValueFrom(e)}}else{var c=this.property;this.valueFn_=function(b,d){var e=a(b,d),f=c(b,d);return d&&d.addPath(e,f),e?e[f]:void 0}}}return this.valueFn_},setValue:function(a,b){if(this.simplePath)return this.fullPath.setValueFrom(a,b),b;var c=this.object(a),d=this.property instanceof e?this.property.name:this.property(a);return c[d]=b}},g.prototype={transform:function(a,b,c,d,e){var f=c[this.name],g=d;if(f)g=void 0;else if(f=g[this.name],!f)return void console.error("Cannot find filter: "+this.name);if(b?f=f.toModel:"function"==typeof f.toDOM&&(f=f.toDOM),"function"!=typeof f)return void console.error("No "+(b?"toModel":"toDOM")+" found on"+this.name);for(var h=[a],j=0;j<this.args.length;j++)h[j+1]=i(this.args[j])(d,e);return f.apply(g,h)}};var t={"+":function(a){return+a},"-":function(a){return-a},"!":function(a){return!a}},u={"+":function(a,b){return a+b},"-":function(a,b){return a-b},"*":function(a,b){return a*b},"/":function(a,b){return a/b},"%":function(a,b){return a%b},"<":function(a,b){return b>a},">":function(a,b){return a>b},"<=":function(a,b){return b>=a},">=":function(a,b){return a>=b},"==":function(a,b){return a==b},"!=":function(a,b){return a!=b},"===":function(a,b){return a===b},"!==":function(a,b){return a!==b},"&&":function(a,b){return a&&b},"||":function(a,b){return a||b}};j.prototype={createUnaryExpression:function(a,b){if(!t[a])throw Error("Disallowed operator: "+a);return b=i(b),function(c,d){return t[a](b(c,d))}},createBinaryExpression:function(a,b,c){if(!u[a])throw Error("Disallowed operator: "+a);return b=i(b),c=i(c),function(d,e){return u[a](b(d,e),c(d,e))}},createConditionalExpression:function(a,b,c){return a=i(a),b=i(b),c=i(c),function(d,e){return a(d,e)?b(d,e):c(d,e)}},createIdentifier:function(a){var b=new e(a);return b.type="Identifier",b},createMemberExpression:function(a,b,c){var d=new f(b,c,a);return d.dynamicDeps&&(this.dynamicDeps=!0),d},createLiteral:function(a){return new d(a.value)},createArrayExpression:function(a){for(var b=0;b<a.length;b++)a[b]=i(a[b]);return function(b,c){for(var d=[],e=0;e<a.length;e++)d.push(a[e](b,c));return d}},createProperty:function(a,b,c){return{key:b instanceof e?b.name:b.value,value:c}},createObjectExpression:function(a){for(var b=0;b<a.length;b++)a[b].value=i(a[b].value);return function(b,c){for(var d={},e=0;e<a.length;e++)d[a[e].key]=a[e].value(b,c);return d}},createFilter:function(a,b){this.filters.push(new g(a,b))},createAsExpression:function(a,b){this.expression=a,this.scopeIdent=b},createInExpression:function(a,b,c){this.expression=c,this.scopeIdent=a,this.indexIdent=b},createTopLevel:function(a){this.expression=a},createThisExpression:h},k.prototype={open:function(){return this.value_},discardChanges:function(){return this.value_},deliver:function(){},close:function(){}},l.prototype={getBinding:function(a,b,c){function d(){g.dynamicDeps&&f.startReset();var c=g.getValue(a,g.dynamicDeps?f:void 0,b);return g.dynamicDeps&&f.finishReset(),c}function e(c){return g.setValue(a,c,b),c}if(c)return this.getValue(a,void 0,b);var f=new CompoundObserver;this.getValue(a,f,b);var g=this;return new ObserverTransform(f,d,e,!0)},getValue:function(a,b,c){for(var d=i(this.expression)(a,b),e=0;e<this.filters.length;e++)d=this.filters[e].transform(d,!1,c,a,b);return d},setValue:function(a,b,c){for(var d=this.filters?this.filters.length:0;d-->0;)b=this.filters[d].transform(b,!0,c,a);return this.expression.setValue?this.expression.setValue(a,b):void 0}};var v={};["webkitAnimationStart","webkitAnimationEnd","webkitTransitionEnd","DOMFocusOut","DOMFocusIn","DOMMouseScroll"].forEach(function(a){v[a.toLowerCase()]=a});var w="@"+Math.random().toString(36).slice(2);r.prototype={styleObject:function(a){var b=[];for(var c in a)b.push(m(c)+": "+a[c]);return b.join("; ")},tokenList:function(a){var b=[];for(var c in a)a[c]&&b.push(c);return b.join(" ")},prepareInstancePositionChanged:function(a){var b=a.polymerExpressionIndexIdent_;if(b)return function(a,c){a.model[b]=c}},prepareBinding:function(a,c,d){var e=Path.get(a);if(n(c))return e.valid?q(e,c,this):void console.error("on-* bindings must be simple path expressions");{if(!e.valid)return b(a,c,d,this);if(1==e.length)return function(a,b,c){if(c)return e.getValueFrom(a);var d=o(a,e[0]);return new PathObserver(d,e)}}},prepareInstanceModel:function(a){var b=a.polymerExpressionScopeIdent_;if(b){var c=a.templateInstance?a.templateInstance.model:a.model,d=a.polymerExpressionIndexIdent_;return function(a){var e=Object.create(c);return e[b]=a,e[d]=void 0,e[w]=c,e}}}},a.PolymerExpressions=r,a.exposeGetExpression&&(a.getExpression_=c),a.PolymerExpressions.prepareEventBinding=q}(this),function(a){function b(){e||(e=!0,a.endOfMicrotask(function(){e=!1,logFlags.data&&console.group("Platform.flush()"),a.performMicrotaskCheckpoint(),logFlags.data&&console.groupEnd()}))}var c=document.createElement("style");c.textContent="template {display: none !important;} /* injected by platform.js */";var d=document.querySelector("head");d.insertBefore(c,d.firstChild);var e,f=125;if(window.addEventListener("WebComponentsReady",function(){b(),Observer.hasObjectObserve||(a.flushPoll=setInterval(b,f))}),window.CustomElements&&!CustomElements.useNative){var g=Document.prototype.importNode;Document.prototype.importNode=function(a,b){var c=g.call(this,a,b);return CustomElements.upgradeAll(c),c}}a.flush=b}(window.Platform);
//# sourceMappingURL=platform.js.map
;(function() {
  var Microphone,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Microphone = (function() {
    function Microphone(dict, callback) {
      this.callback = callback;
      this.createNode = __bind(this.createNode, this);
      this.gotStream = __bind(this.gotStream, this);
      this.length = dict.length || 1;
      this.overlap = dict.overlap || 0;
      this.channels = dict.channels || 1;
      if (this.overlap > 1 || this.overlap < 0) {
        throw "Overlap must be between 0 and 1";
      }
      if (this.channels !== 1 && this.channels !== 2) {
        throw "Channels must be 1 (mono) or 2 (stereo)";
      }
      this.bufferSize = 4096;
      this.total = 0;
      this.bufL = [];
      this.bufR = [];
      this.getUserMedia({
        audio: true
      }, this.gotStream);
    }

    Microphone.prototype.gotStream = function(stream) {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.bufLength = this.length * this.audioContext.sampleRate;
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      window.microphoneProcessingNode = this.createNode();
      this.mediaStreamSource.connect(window.microphoneProcessingNode);
      return window.microphoneProcessingNode.connect(this.audioContext.destination);
    };

    Microphone.prototype.createNode = function() {
      var node,
        _this = this;
      node = this.audioContext.createJavaScriptNode(this.bufferSize, 2, 2);
      node.onaudioprocess = function(e) {
        var left, outBuffer, right;
        left = e.inputBuffer.getChannelData(0);
        right = e.inputBuffer.getChannelData(1);
        _this.bufL.push(new Float32Array(left));
        _this.bufR.push(new Float32Array(right));
        _this.total += _this.bufferSize;
        if (_this.total > _this.bufLength) {
          outBuffer = _this.prepareBuffer();
          return _this.callback(outBuffer);
        }
      };
      return node;
    };

    Microphone.prototype.prepareBuffer = function() {
      var b, i, outL, outR, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1;
      outL = [];
      outR = [];
      _ref = this.bufL;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        b = _ref[_i];
        for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
          x = b[_j];
          outL.push(x);
        }
      }
      _ref1 = this.bufR;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        b = _ref1[_k];
        for (_l = 0, _len3 = b.length; _l < _len3; _l++) {
          x = b[_l];
          outR.push(x);
        }
      }
      this.bufL = [outL.slice((1 - this.overlap) * this.bufLength)];
      this.bufR = [outR.slice((1 - this.overlap) * this.bufLength)];
      this.total = this.bufL[0].length;
      if (this.channels === 1) {
        return (function() {
          var _m, _ref2, _results;
          _results = [];
          for (i = _m = 0, _ref2 = this.bufLength; 0 <= _ref2 ? _m < _ref2 : _m > _ref2; i = 0 <= _ref2 ? ++_m : --_m) {
            _results.push((outL[i] + outR[i]) * .5);
          }
          return _results;
        }).call(this);
      }
      return [outL.slice(0, this.bufLength), outR.slice(0, this.bufLength)];
    };

    Microphone.prototype.getUserMedia = function(dictionary, callback) {
      var e;
      try {
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        return navigator.getMedia(dictionary, callback, function(err) {
          return console.log("The following error occured: " + err);
        });
      } catch (_error) {
        e = _error;
        throw "Could not getMedia";
      }
    };

    return Microphone;

  })();

  window.Microphone = Microphone;

}).call(this);

;/**
* MicrophoneAnalyzerElement
* A polymer element that enables microphone input data analysis on your documents.
*
* @method valuefilter
* @param {Number} rms Computed rms value

* @method createdCallback
* Called when a <microphone-analyzer> element is created.
*/

;(function MicrophoneAnalyzerElement(Microphone) {

  // handle global errors
  var err;

  if (!arguments[0]) {
    err = new Error('Missing dependency: Microphone. Try `bower install srubin/microphone`');
  }

  try {
    // Microphone library dependency
    var _testWebkitAudio = new window.webkitAudioContext()
      .createJavaScriptNode(2048, 1, 1);

    delete _testWebkitAudio;
  }
  catch(e) {
    err = new Error('Fatal: Device not supported.'); 
  }

  if (err) {
    throw err;
  }

  // generates a handler that calls a function with a given ~context
  function proxy(fn, ctxValue) {
    return function proxyHandler() { fn.apply(ctxValue, arguments); }
  }

  function getNumAttr(element, name, defaultValue) {
    return parseFloat(element.getAttribute(name) || defaultValue);
  }

  function withinRange(value, range) {
    return (value >= range.value[0] && value <= range.value[1]);
  }

  // generates a handler that sets the current range if it has changed
  function rangeSetter(v) {
    return function rangeSetterHandler(range, index) {
      if (withinRange(v, range)) {
        this.audioRange = range;

        if (this.lastRange !== range) {
          this.lastRange = range;
        }
      }
    };
  }

  function micInputHandler(data) {
    // presently supporting one channel
    data = 2 === data.length ? data[0] : data;

    // rms calculation via https://github.com/srubin/microphone
    var rms = data.map(function (d) { return d * d; });
    rms = rms.reduce(function (t, s) { return t + s; });
    rms = Math.sqrt(rms / data.length);

    var value = this.valuefilter(rms);

    // set current input descriptive range
    this.ranges.forEach(proxy(rangeSetter(value), this));

    var evt = new CustomEvent('air', {
      detail: {
        data: data,
        rms: rms,
        value: value,
        audioRange: this.audioRange
      }
    });

    this.dispatchEvent(evt);
  }

  var AudioRangePrototype = Object.create(HTMLElement.prototype);

  document.registerElement('audio-range', {
    prototype: AudioRangePrototype
  });

  var MicrophoneAnalyzerPrototype = Object.create(HTMLElement.prototype);

  MicrophoneAnalyzerPrototype.valuefilter = function valuefilter(rms) {
    return rms;
  };

  MicrophoneAnalyzerPrototype.createdCallback = function createdCallback() {
    var ranges = this.ranges = [];

    this.audioRange = {};
    this.lastRange = {};

    this.unit = getNumAttr(this, 'unit', .5);
    this.overlap = getNumAttr(this, 'overlap', .5);
    this.channels = getNumAttr(this, 'channels', 1);

    this.style.display = 'none';

    this.querySelectorAll('audio-range').array()
      .forEach(function (element, index) {
        element.value = {
          index: index,
          innerHTML: element.innerHTML,
          value: [ getNumAttr(element, 'start'), getNumAttr(element, 'end') ]
        };

        ranges.push(element.value);
      });

    this.mic = new Microphone({
        unit: this.unit,
        overlap: this.overlap,
        channels: this.channels
    }, proxy(micInputHandler, this));
  };

  document.registerElement('microphone-analyzer', {
    prototype: MicrophoneAnalyzerPrototype
  });

} (window.Microphone));
