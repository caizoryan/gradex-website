var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@thi.ng/hiccup-css/index.js
var hiccup_css_exports = {};
__export(hiccup_css_exports, {
  COMPACT: () => COMPACT,
  DEFAULT_VENDORS: () => DEFAULT_VENDORS,
  PRECISION: () => PRECISION,
  PRETTY: () => PRETTY,
  QUOTED_FNS: () => QUOTED_FNS,
  animation: () => animation,
  appendStyleSheet: () => appendStyleSheet,
  at_import: () => at_import,
  at_keyframes: () => at_keyframes,
  at_media: () => at_media,
  at_namespace: () => at_namespace,
  at_supports: () => at_supports,
  attribContains: () => attribContains,
  attribEq: () => attribEq,
  attribMatches: () => attribMatches,
  attribPrefix: () => attribPrefix,
  attribSuffix: () => attribSuffix,
  cap: () => cap,
  ch: () => ch,
  cm: () => cm,
  comment: () => comment,
  conditional: () => conditional,
  css: () => css,
  deg: () => deg,
  em: () => em,
  ex: () => ex,
  ff: () => ff,
  inch: () => inch,
  injectStyleSheet: () => injectStyleSheet,
  lh: () => lh,
  mm: () => mm,
  ms: () => ms,
  percent: () => percent,
  px: () => px,
  rad: () => rad,
  rem: () => rem,
  sec: () => sec,
  second: () => second,
  setPrecision: () => setPrecision,
  turn: () => turn,
  url: () => url,
  vh: () => vh,
  vmax: () => vmax,
  vmin: () => vmin,
  vw: () => vw,
  withAttrib: () => withAttrib
});

// node_modules/@thi.ng/hiccup-css/api.js
var DEFAULT_VENDORS = ["-moz-", "-ms-", "-o-", "-webkit-"];
var COMPACT = {
  rules: "",
  ruleSep: ",",
  valSep: "",
  decls: "",
  declStart: "{",
  declEnd: "}",
  indent: "",
  comments: false
};
var PRETTY = {
  rules: "\n",
  ruleSep: ", ",
  valSep: " ",
  decls: "\n",
  declStart: " {\n",
  declEnd: "}\n",
  indent: "    ",
  comments: true
};

// node_modules/@thi.ng/checks/is-array.js
var isArray = Array.isArray;

// node_modules/@thi.ng/checks/is-function.js
var isFunction = (x) => typeof x === "function";

// node_modules/@thi.ng/checks/is-iterable.js
var isIterable = (x) => typeof x?.[Symbol.iterator] === "function";

// node_modules/@thi.ng/checks/is-plain-object.js
var OBJP = Object.getPrototypeOf;
var isPlainObject = (x) => {
  let p;
  return x != null && typeof x === "object" && ((p = OBJP(x)) === null || OBJP(p) === null);
};

// node_modules/@thi.ng/checks/is-string.js
var isString = (x) => typeof x === "string";

// node_modules/@thi.ng/errors/deferror.js
var defError = (prefix, suffix = (msg) => msg !== void 0 ? ": " + msg : "") => class extends Error {
  origMessage;
  constructor(msg) {
    super(prefix(msg) + suffix(msg));
    this.origMessage = msg !== void 0 ? String(msg) : "";
  }
};

// node_modules/@thi.ng/errors/illegal-arguments.js
var IllegalArgumentError = defError(() => "illegal argument(s)");
var illegalArgs = (msg) => {
  throw new IllegalArgumentError(msg);
};

// node_modules/@thi.ng/errors/illegal-arity.js
var IllegalArityError = defError(() => "illegal arity");
var illegalArity = (n) => {
  throw new IllegalArityError(n);
};

// node_modules/@thi.ng/compose/comp.js
function comp(...fns) {
  let [a, b, c, d, e, f, g, h, i, j] = fns;
  switch (fns.length) {
    case 0:
      illegalArity(0);
    case 1:
      return a;
    case 2:
      return (...args) => a(b(...args));
    case 3:
      return (...args) => a(b(c(...args)));
    case 4:
      return (...args) => a(b(c(d(...args))));
    case 5:
      return (...args) => a(b(c(d(e(...args)))));
    case 6:
      return (...args) => a(b(c(d(e(f(...args))))));
    case 7:
      return (...args) => a(b(c(d(e(f(g(...args)))))));
    case 8:
      return (...args) => a(b(c(d(e(f(g(h(...args))))))));
    case 9:
      return (...args) => a(b(c(d(e(f(g(h(i(...args)))))))));
    case 10:
    default:
      const fn = (...args) => a(b(c(d(e(f(g(h(i(j(...args))))))))));
      return fns.length === 10 ? fn : comp(fn, ...fns.slice(10));
  }
}

// node_modules/@thi.ng/checks/implements-function.js
var implementsFunction = (x, fn) => typeof x?.[fn] === "function";

// node_modules/@thi.ng/transducers/ensure.js
var ensureTransducer = (x) => implementsFunction(x, "xform") ? x.xform() : x;

// node_modules/@thi.ng/transducers/comp.js
function comp2(...fns) {
  fns = fns.map(ensureTransducer);
  return comp.apply(null, fns);
}

// node_modules/@thi.ng/checks/is-not-string-iterable.js
var isNotStringAndIterable = (x) => x != null && typeof x !== "string" && typeof x[Symbol.iterator] === "function";

// node_modules/@thi.ng/transducers/compr.js
var compR = (rfn, fn) => [rfn[0], rfn[1], fn];

// node_modules/@thi.ng/api/api.js
var SEMAPHORE = Symbol();
var NO_OP = () => {
};

// node_modules/@thi.ng/api/fn.js
var identity = (x) => x;

// node_modules/@thi.ng/checks/is-arraylike.js
var isArrayLike = (x) => x != null && typeof x !== "function" && x.length !== void 0;

// node_modules/@thi.ng/transducers/reduced.js
var Reduced = class {
  value;
  constructor(val) {
    this.value = val;
  }
  deref() {
    return this.value;
  }
};
var isReduced = (x) => x instanceof Reduced;
var unreduced = (x) => x instanceof Reduced ? x.deref() : x;

// node_modules/@thi.ng/transducers/reduce.js
var __parseArgs = (args) => args.length === 2 ? [void 0, args[1]] : args.length === 3 ? [args[1], args[2]] : illegalArity(args.length);
function reduce(...args) {
  const rfn = args[0];
  const init = rfn[0];
  const complete = rfn[1];
  const reduce2 = rfn[2];
  args = __parseArgs(args);
  const acc = args[0] == null ? init() : args[0];
  const src = args[1];
  return unreduced(
    complete(
      implementsFunction(src, "$reduce") ? src.$reduce(reduce2, acc) : isArrayLike(src) ? __reduceArray(reduce2, acc, src) : __reduceIterable(reduce2, acc, src)
    )
  );
}
var __reduceArray = (rfn, acc, src) => {
  for (let i = 0, n = src.length; i < n; i++) {
    acc = rfn(acc, src[i]);
    if (isReduced(acc)) {
      acc = acc.deref();
      break;
    }
  }
  return acc;
};
var __reduceIterable = (rfn, acc, src) => {
  for (let x of src) {
    acc = rfn(acc, x);
    if (isReduced(acc)) {
      acc = acc.deref();
      break;
    }
  }
  return acc;
};
var reducer = (init, rfn) => [init, identity, rfn];

// node_modules/@thi.ng/transducers/push.js
function push(src) {
  return src ? [...src] : reducer(
    () => [],
    (acc, x) => (acc.push(x), acc)
  );
}

// node_modules/@thi.ng/transducers/iterator.js
function* iterator(xform, src) {
  const rfn = ensureTransducer(xform)(push());
  const complete = rfn[1];
  const reduce2 = rfn[2];
  for (let x of src) {
    const y = reduce2([], x);
    if (isReduced(y)) {
      yield* unreduced(complete(y.deref()));
      return;
    }
    if (y.length) {
      yield* y;
    }
  }
  yield* unreduced(complete([]));
}
function* iterator1(xform, src) {
  const reduce2 = ensureTransducer(xform)([NO_OP, NO_OP, (_, x) => x])[2];
  for (let x of src) {
    let y = reduce2(SEMAPHORE, x);
    if (isReduced(y)) {
      y = unreduced(y.deref());
      if (y !== SEMAPHORE) {
        yield y;
      }
      return;
    }
    if (y !== SEMAPHORE) {
      yield y;
    }
  }
}

// node_modules/@thi.ng/transducers/flatten-with.js
function flattenWith(fn, src) {
  return isIterable(src) ? iterator(flattenWith(fn), isString(src) ? [src] : src) : (rfn) => {
    const reduce2 = rfn[2];
    const flatten2 = (acc, x) => {
      const xx = fn(x);
      if (xx) {
        for (let y of xx) {
          acc = flatten2(acc, y);
          if (isReduced(acc)) {
            break;
          }
        }
        return acc;
      }
      return reduce2(acc, x);
    };
    return compR(rfn, flatten2);
  };
}

// node_modules/@thi.ng/transducers/flatten.js
function flatten(src) {
  return flattenWith(
    (x) => isNotStringAndIterable(x) ? x : void 0,
    src
  );
}

// node_modules/@thi.ng/transducers/map.js
function map(fn, src) {
  return isIterable(src) ? iterator1(map(fn), src) : (rfn) => {
    const r = rfn[2];
    return compR(rfn, (acc, x) => r(acc, fn(x)));
  };
}

// node_modules/@thi.ng/arrays/ensure-iterable.js
var ensureIterable = (x) => {
  (x == null || !x[Symbol.iterator]) && illegalArgs(`value is not iterable: ${x}`);
  return x;
};

// node_modules/@thi.ng/arrays/ensure-array.js
var ensureArrayLike = (x) => isArrayLike(x) ? x : [...ensureIterable(x)];

// node_modules/@thi.ng/transducers/permutations.js
function* permutations(...src) {
  const n = src.length - 1;
  if (n < 0) {
    return;
  }
  const step = new Array(n + 1).fill(0);
  const realized = src.map(ensureArrayLike);
  const total = realized.reduce((acc, x) => acc * x.length, 1);
  for (let i = 0; i < total; i++) {
    const tuple = [];
    for (let j = n; j >= 0; j--) {
      const r = realized[j];
      let s = step[j];
      if (s === r.length) {
        step[j] = s = 0;
        j > 0 && step[j - 1]++;
      }
      tuple[j] = r[s];
    }
    step[n]++;
    yield tuple;
  }
}

// node_modules/@thi.ng/transducers/repeat.js
function* repeat(x, n = Infinity) {
  while (n-- > 0) {
    yield x;
  }
}

// node_modules/@thi.ng/transducers/str.js
function str(sep, src) {
  sep = sep || "";
  let first = true;
  return src ? [...src].join(sep) : reducer(
    () => "",
    (acc, x) => (acc = first ? acc + x : acc + sep + x, first = false, acc)
  );
}

// node_modules/@thi.ng/transducers/transduce.js
function transduce(...args) {
  return $transduce(transduce, reduce, args);
}
var $transduce = (tfn, rfn, args) => {
  let acc, src;
  switch (args.length) {
    case 4:
      src = args[3];
      acc = args[2];
      break;
    case 3:
      src = args[2];
      break;
    case 2:
      return map((x) => tfn(args[0], args[1], x));
    default:
      illegalArity(args.length);
  }
  return rfn(ensureTransducer(args[0])(args[1]), acc, src);
};

// node_modules/@thi.ng/hiccup-css/impl.js
var EMPTY = /* @__PURE__ */ new Set();
var NO_SPACES = ":[";
var __xfSel = comp2(
  flatten(),
  map(
    (x) => x[0] === "&" ? x.substring(1) : NO_SPACES.includes(x[0]) ? x : " " + x
  )
);
var __withScope = (xf, scope) => comp2(
  xf,
  map((x) => isString(x) && x.startsWith(" .") ? x + scope : x)
);
var expand = (acc, parent, rules, opts) => {
  const n = rules.length;
  const sel = [];
  let curr, isFn;
  const process = (i, r) => {
    let rfn = null;
    if (isArray(r)) {
      expand(acc, __makeSelector(parent, sel), r, opts);
    } else if (isIterable(r) && !isString(r)) {
      expand(acc, __makeSelector(parent, sel), [...r], opts);
    } else if ((isFn = isFunction(r)) || (rfn = opts.fns[r])) {
      if (!parent.length) {
        if (rfn) {
          rfn.apply(null, rules.slice(i + 1))(acc, opts);
          return true;
        }
        r(acc, opts);
      } else if (isFn) {
        process(i, r());
      } else {
        illegalArgs(`quoted fn ('${r}') only allowed at head position`);
      }
    } else if (isPlainObject(r)) {
      curr = Object.assign(curr || {}, r);
    } else if (r != null) {
      sel.push(r);
    }
  };
  for (let i = 0; i < n; i++) {
    if (process(i, rules[i])) {
      return acc;
    }
  }
  curr && acc.push(__formatRule(parent, sel, curr, opts));
  return acc;
};
var __makeSelector = (parent, curr) => parent.length ? [...permutations(parent, curr)] : curr;
var __formatRule = (parent, sel, curr, opts) => {
  const f = opts.format;
  const space = indent(opts);
  const xf = opts.scope ? __withScope(__xfSel, opts.scope) : __xfSel;
  return [
    space,
    transduce(
      map(
        (sel2) => transduce(xf, str(), isArray(sel2) ? sel2 : [sel2]).trim()
      ),
      str(f.ruleSep),
      __makeSelector(parent, sel)
    ),
    f.declStart,
    formatDecls(curr, opts),
    space,
    f.declEnd
  ].join("");
};
var formatDecls = (rules, opts) => {
  const f = opts.format;
  const prefixes = opts.autoprefix || EMPTY;
  const space = indent(opts, opts.depth + 1);
  const acc = [];
  for (let r in rules) {
    if (rules.hasOwnProperty(r)) {
      let val = rules[r];
      if (isFunction(val)) {
        val = val(rules);
      }
      if (isArray(val)) {
        val = val.map((v) => isArray(v) ? v.join(" ") : v).join(f.ruleSep);
      }
      if (prefixes.has(r)) {
        for (let v of opts.vendors) {
          acc.push(`${space}${v}${r}:${f.valSep}${val};`);
        }
      }
      acc.push(`${space}${r}:${f.valSep}${val};`);
    }
  }
  return acc.join(f.decls) + f.decls;
};
var indent = (opts, d = opts.depth) => d > 1 ? [...repeat(opts.format.indent, d)].join("") : d > 0 ? opts.format.indent : "";

// node_modules/@thi.ng/hiccup-css/keyframes.js
function at_keyframes(id, ...args) {
  const stops = args.length === 1 ? args[0] : args.reduce((acc, x, i) => {
    acc[i / (args.length - 1) * 100 | 0] = x;
    return acc;
  }, {});
  return (acc, opts) => {
    const outer = indent(opts);
    opts.depth++;
    const inner = indent(opts);
    acc.push(`${outer}@keyframes ${id}${opts.format.declStart}`);
    for (let s in stops) {
      if (stops.hasOwnProperty(s)) {
        acc.push(
          [
            inner,
            s + "%",
            opts.format.declStart,
            formatDecls(stops[s], opts),
            inner,
            opts.format.declEnd
          ].join("")
        );
      }
    }
    opts.depth--;
    acc.push(outer + opts.format.declEnd);
    return acc;
  };
}

// node_modules/@thi.ng/hiccup-css/animation.js
var animation = (id, opts, ...keyframes) => {
  const $opts = {
    duration: "250ms",
    name: id,
    ...opts
  };
  return [
    at_keyframes.apply(null, [id, ...keyframes]),
    [
      `.${id}`,
      Object.entries($opts).reduce(
        (acc, [k, v]) => (acc[`animation-${k}`] = v, acc),
        {}
      )
    ]
  ];
};

// node_modules/@thi.ng/hiccup-css/attribs.js
var $ = (op) => (id, x, caseSensitve = true) => `[${id}${op}="${x}"${caseSensitve ? "" : " i"}]`;
var withAttrib = (id) => `[${id}]`;
var attribEq = $("");
var attribContains = $("~");
var attribPrefix = $("^");
var attribSuffix = $("$");
var attribMatches = $("*");

// node_modules/@thi.ng/hiccup-css/comment.js
var comment = (body, force = false) => (acc, opts) => {
  const space = indent(opts);
  const inner = indent(opts, opts.depth + 1);
  if (opts.format.comments || force) {
    acc.push(
      space + "/*",
      body.split("\n").map((l) => inner + l).join("\n"),
      space + "*/"
    );
  }
  return acc;
};

// node_modules/@thi.ng/hiccup-css/conditional.js
var conditional = (type, cond, rules) => (acc, opts) => {
  const space = indent(opts);
  acc.push(
    `${space}${type} ${__formatCond(cond)}${opts.format.declStart}`
  );
  opts.depth++;
  expand(acc, [], rules, opts);
  opts.depth--;
  acc.push(space + opts.format.declEnd);
  return acc;
};
var __formatCond = (cond) => {
  if (isString(cond)) {
    return cond;
  }
  const acc = [];
  for (let c in cond) {
    if (cond.hasOwnProperty(c)) {
      let v = cond[c];
      if (v === true) {
        v = MEDIA_TYPES.has(c) ? c : `(${c})`;
      } else if (v === false) {
        v = `(not ${MEDIA_TYPES.has(c) ? c : `(${c})`})`;
      } else if (v === "only") {
        v += " " + c;
      } else {
        v = `(${c}:${v})`;
      }
      acc.push(v);
    }
  }
  return acc.join(" and ");
};
var MEDIA_TYPES = /* @__PURE__ */ new Set(["all", "print", "screen"]);

// node_modules/@thi.ng/hiccup-css/css.js
var css = (rules, opts) => {
  opts = {
    format: COMPACT,
    vendors: DEFAULT_VENDORS,
    fns: {},
    depth: 0,
    ...opts
  };
  isArray(opts.autoprefix) && (opts.autoprefix = new Set(opts.autoprefix));
  return isPlainObject(rules) ? formatDecls(rules, opts) : isFunction(rules) ? rules([], opts).join(opts.format.rules) : expand(
    [],
    [],
    isArray(rules) ? rules : isNotStringAndIterable(rules) ? [...rules] : illegalArgs(`invalid rules`),
    opts
  ).join(opts.format.rules);
};

// node_modules/@thi.ng/hiccup-css/import.js
var at_import = (url2, ...queries) => (acc, opts) => (acc.push(
  queries.length ? `@import url(${url2}) ${queries.join(opts.format.ruleSep)};` : `@import url(${url2});`
), acc);

// node_modules/@thi.ng/hiccup-css/inject.js
var injectStyleSheet = (css2, first = false) => appendStyleSheet(css2, document.head, first);
var appendStyleSheet = (css2, parent, first = false) => {
  const sheet = document.createElement("style");
  sheet.setAttribute("type", "text/css");
  if (sheet.styleSheet !== void 0) {
    sheet.styleSheet.cssText = css2;
  } else {
    sheet.textContent = css2;
  }
  if (first) {
    parent.insertBefore(sheet, parent.firstChild);
  } else {
    parent.appendChild(sheet);
  }
  return sheet;
};

// node_modules/@thi.ng/hiccup-css/media.js
var at_media = (cond, rules) => conditional("@media", cond, rules);

// node_modules/@thi.ng/hiccup-css/namespace.js
function at_namespace(...args) {
  return (acc, _) => (acc.push(
    args.length > 1 ? `@namespace ${args[0]} url(${args[1]});` : `@namespace url(${args[0]});`
  ), acc);
}

// node_modules/@thi.ng/hiccup-css/supports.js
var at_supports = (cond, rules) => conditional("@supports", cond, rules);

// node_modules/@thi.ng/hiccup-css/quoted-functions.js
var QUOTED_FNS = {
  "@comment": comment,
  "@import": at_import,
  "@keyframes": at_keyframes,
  "@media": at_media,
  "@namespace": at_namespace,
  "@supports": at_supports
};

// node_modules/@thi.ng/hiccup-css/units.js
var PRECISION = 4;
var setPrecision = (n) => PRECISION = n;
var ff = (x) => x === (x | 0) ? String(x) : x.toFixed(PRECISION).replace(/^0./, ".").replace(/^-0./, "-.").replace(/0+$/, "");
var cap = (x) => `${ff(x)}cap`;
var ch = (x) => `${ff(x)}ch`;
var cm = (x) => `${ff(x)}cm`;
var em = (x) => `${ff(x)}em`;
var ex = (x) => `${ff(x)}ex`;
var inch = (x) => `${ff(x)}in`;
var lh = (x) => `${ff(x)}lh`;
var mm = (x) => `${ff(x)}mm`;
var rem = (x) => `${ff(x)}rem`;
var percent = (x) => `${ff(x)}%`;
var px = (x) => `${ff(x)}px`;
var vh = (x) => `${ff(x)}vh`;
var vw = (x) => `${ff(x)}vw`;
var vmin = (x) => `${ff(x)}vmin`;
var vmax = (x) => `${ff(x)}vmax`;
var ms = (x) => `${x | 0}ms`;
var second = (x) => `${ff(x)}s`;
var sec = second;
var deg = (x) => `${ff(x)}deg`;
var rad = (x) => `${ff(x)}rad`;
var turn = (x) => `${ff(x)}turn`;
var url = (x) => `url(${x})`;

// index.js
var css_default = hiccup_css_exports;
export {
  css_default as default
};
