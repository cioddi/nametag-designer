(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.qwigley_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
(function (Buffer){

var font = Buffer("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AHcAdwB3AC4AdAB5AHAAZQBzAGUAdABpAHQALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPUAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAQIAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBAwCKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQQA1wEFAQYBBwEIAQkA4wCwALEBCgELAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQwAjACYAJIAjwCUAJUBDQDSA0RFTAd1bmkwMEFEBGhiYXICaWoMS2NvbW1hYWNjZW50DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMEbGRvdAxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BEV1cm8LY29tbWFhY2NlbnQAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMA9AABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABAHgABAAAADcAvgDIAM4A2ADeAOQA6gDwAPYA/AEKARQBHgEkATYBPAFKAWgBvgHEAdIB2AHiAegB9gIEBGACXgJoAm4CdAKSAqQCqgKwAsoC7AMGAxQDPgNQA2IDjAOSA5gDwgPMA+ID7AQGBBwEOgREBFIEYAACAAsAAwADAAAACgAKAAEAFQAVAAIAFwAXAAMAGQAbAAQAJAArAAcALQAwAA8AMgA8ABMARABTAB4AVQBcAC4AZwBnADYAAgBJAA8ATQAOAAEAVv/MAAIAFgAdABgARAABABgASAABABoAGAABABv/6gABABz/+QABACUAgAABAE8ABgADACcAKgBLAAcATwAPAAIAKAAUAFL/8AACAFv/4QBd/90AAQBM//kABAAr//QARP/lAEv/9ABV/+gAAQAsADEAAwAuABQARP/rAFIAFQAHAC8ANwBE/+0ASP/wAEz/9ABS//AAVf/oAFj/8AAVADAAHABE/+MAR//rAEj/9wBJ//UASv/dAEsAEABM/+cATv/oAE//5wBQ/+UAUf/oAFL/5QBV/+gAVv/6AFf/9wBY/+gAWf/YAFv/ugBc//cAXf/wAAEAMQAJAAMAMwBCAEn/9wBZABMAAQA0ACQAAgA1AC0AWv/tAAEANgBCAAMANwCpAEsAHQBXABIAAwA4ADEASwA8AFj/yQAWADkArQBFACwARgARAEcADQBIABEASQAnAEoAMABLADAATAA1AE4AQgBPAE8AUAAaAFEAEQBSADkAUwAaAFUAFgBWABYAVwA9AFgAEQBZAD0AWwAWAFwAHwACADv/1gBE/94AAQA8AFsAAQA9/74ABwBGABEATAANAE8AGgBWABAAVwAhAFkAIQBcAAkABABE/+wATP/0AE3/8QBV/+MAAQBE/+sAAQBE/+MABgBE//MARf/kAEn/8wBT/+8AVv/5AF3/2AAIAET/2QBJ/98ASgAEAEwADwBPAC4AVQAVAFcAGwBZADwABgADAAkARAAEAEwADwBPABkAVgAdAFkADgADAEgADwBPAAkAUgAEAAoARP/qAEX/8ABH//cASf/hAEr/+gBR//AAVv/wAFn/+QBb/98AXf/fAAQARP/vAEgABABSAAYAWP/2AAQASAAaAEwAGQBPACQAXAATAAoAA/+0AET/yQBH/+MASP/jAEz/7wBO//MAUv/2AFj/5ABZ//wAXP/tAAEAU//0AAEARP/vAAoARf/5AEgABgBJ//YASgANAE7//ABR//4AUgAOAFP/8gBb//UAXf/cAAIARP/rAEv/6wAFAET/7wBJ//cATv/yAFIAFQBXAAYAAgBE/+cAU//wAAYACgA+AET/8wBMAA0AWP//AFwAHgBd//AABQBE//AARf/6AEoACgBV//EAWQAVAAcARP/nAEj//ABMABMAUgAtAFgADgBZADUAWv/rAAIATAAEAFIAFQADAET/8wBSAAYAXAAHAAMASQAJAEwAEABd//EAAgBE/+AASP/dAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
