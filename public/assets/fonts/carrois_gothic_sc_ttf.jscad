(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.carrois_gothic_sc_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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BgUDBAQDBAAEBgMDAwQEBAMDAwUCAwQDBAQDBAsLBgADAwAAAAAAAAAAAAAAAAAAAAAAAAADBAYGCAgDBAQFBgMFAwMGBgYGBgYGBgYGAwMGBgYFCgYGBgcGBQcHAwQGBQgHBwYHBgYFBwYIBgYGBAMEBgUDBgYGBgUFBgcDBAYFCAYHBgcGBgUHBggGBQUEBAQGAwMGBgcGBAYECQUFBgUHBAQGBAQDBgYDAwQFBQkJCQUGBgYGBgYJBgYGBgYDAwMDBwcHBwcHBwYHBwcHBwYGCwYGBgYGBgkGBQUFBQMDAwMHBgcHBwcHBgcHBwcHBQYFBwMDAwcGBAQGBgUFBQMHBgoKBgYGBgYDBAQDBAAEBwMDAwUEBAMDAwYCAwQDBAQDBAwMBwAEBAAAAAAAAAAAAAAAAAAAAAAAAAADBQcGCQgDBAQGBgMFAwMGBgYGBgYGBgYGAwMGBgYGCwcHBwcGBgcHAwUHBgkHCAYIBwcGBwYJBwYGBAMEBgYDBgcHBwYFBwcDBQYGCQcIBggGBgYHBgkGBgYEBAQHBAMGBgcGBAYECgYGBgUHBAQGBAQDBgcEAwQGBgoKCgYHBwcHBwcKBwYGBgYDAwMDBwcICAgICAYIBwcHBwYHDAYGBgYGBgoHBgYGBgMDAwMHBwgICAgIBggHBwcHBgcGCAMDAwgHBQUGBgYGBgMHBwsKBwcGBwYEBQUEBAAFBwMDAwUFBQQEBAYCAwQDBQUEBA0NBwAEBAAAAAAAAAAAAAAAAAAAAAAAAAAEBQcHCgkDBAQGBwMGAwMHBwcHBwcHBwcHAwMHBwcGDAcHCAgHBggIAwUHBgoICQcJBwcGCAcKBwcHBAMEBwYEBwcHCAYGBwgDBQcGCQgIBwgHBwYIBwkHBgYEBAQHBAQHBwgHBAcFCwYGBwYIBAUHBAQEBwcEBAQGBgsLCwYHBwcHBwcLCAcHBwcDAwMDCAgJCQkJCQcJCAgICAcHDQcHBwcHBwoHBgYGBgMDAwMICAgICAgIBwgICAgIBgcGCAMDAwkIBQUHBwYGBgQICAwLBwcHBwcEBQUEBQAFCAMDAwUFBQQEBAcCBAUEBQUEBQ8PCAAFBQAAAAAAAAAAAAAAAAAAAAAAAAAEBgkICwoEBQUHCAMGAwQICAgICAgICAgIAwMICAgHDggJCQkIBwkJBAYIBwsJCggKCAgHCQgLCAgIBQQFCAcECAgICQcHCQkEBggHCwkKCAoICAcJCAsIBwcFBQUIBQQICAkIBQgFDQcHCAYJBQUIBQUECAgFBAUHBw0NDQcICAgICAgMCQgICAgEBAQECQkKCgoKCggKCQkJCQgIDwgICAgICAwIBwcHBwQEBAQJCQoKCgoKCAoJCQkJBwgHCQQEBAoJBgYICAcHBwQJCQ0NCAgICAgFBgYEBQAGCQQEBAYGBgUFBQgCBAUEBgYEBRAQCQAFBQAAAAAAAAAAAAAAAAAAAAAAAAAEBgkJDAsEBQUICQQHBAQJCQkJCQkJCQkJBAQJCQkIDwkJCQoICAoKBAcJCAwKCwgLCQkICggMCQgIBQQFCAgECQkJCQgHCQoEBggHDAkKCAoJCAcKCAwJCAgFBQUJBQQJCQoJBQkGDQgICQcKBQYJBQUECQkFBAUICA0NDQgJCQkJCQkNCQgICAgEBAQECgoLCwsLCwkLCgoKCggJEAkJCQkJCQ0JCAgICAQEBAQKCQoKCgoKCQoKCgoKCAkICgQEBAsJBwYICAgHCAQKCQ4OCQkJCQkFBgYFBgAGCgQEBAcHBwUFBQkDBAYEBgYFBhERCQAFBQAAAAAAAAAAAAAAAAAAAAAAAAAFBwoJDQwEBgYICQQHBAUJCQkJCQkJCQkJBAQJCQkIEAkKCgoJCAoLBQcJCA0KCwkLCQkICgkNCQkJBgUGCQgFCQkKCggICgoEBgkIDAoLCQsJCQgKCQwJCAgGBQYKBQUJCQoJBQkGDggICQcKBgYJBgYFCQkFBQYICA4ODggJCQkJCQkOCgkJCQkFBQUFCwoLCwsLCwkLCgoKCgkKEQkJCQkJCQ0KCAgICAQEBAQKCgsLCwsLCQsKCgoKCAkICwUEBAsKBwYJCQgICAUKCg8PCQkJCQkFBgYFBgAHCgQEBAcHBwUFBQkDBQYFBgYFBhMTCgAGBgAAAAAAAAAAAAAAAAAAAAAAAAAFCAsKDg0FBgYJCgQIBAUKCgoKCgoKCgoKBAQKCgoJEQsLCwwKCQsMBQgKCQ4LDQoNCwoJDAoOCgoKBgUGCgkFCgoLCwkJCwwFBwoJDgsMCgwKCgkLCg4KCQkGBgYLBgUKCgsKBgoHEAkJCggMBgcKBgYFCgoGBQYJCRAQEAkLCwsLCwsQCwoKCgoFBQUFDAsNDQ0NDQoNDAwMDAoLEwoKCgoKCg8LCQkJCQUFBQULCwwMDAwMCgwLCwsLCQoJDAUFBQ0LCAcKCgkJCQULCxERCwsKCwoGBwcGBwAICwUFBQgICAYGBgoDBQcFBwcGBxUVDAAGBgAAAAAAAAAAAAAAAAAAAAAAAAAGCAwLEA8FBwcKCwUJBQYLCwsLCwsLCwsLBQULCwsKEwwMDA0LCg0NBgkLChANDgsODAwKDQsQDAsLBwYHCwoGCwsMDAoJDA0GCAsKDwwNCw0LCwoNCw8LCgoHBwcMBgYLCw0LBwsIEgoKCwkNBwcLBwcGCwwHBgcKChISEgoMDAwMDAwRDAsLCwsGBgYGDQ0ODg4ODgsODQ0NDQsMFQsLCwsLCxEMCgoKCgYGBgYNDA0NDQ0NCw0NDQ0NCgsKDQYGBg4MCQgLCwoKCgYNDBMSDAwLDAsHCAgGBwAIDQUFBQkJCQcHBwsDBggGCAgGBxgZDQAHBwAAAAAAAAAAAAAAAAAAAAAAAAAGCg4NEhEGCAgLDQYKBgYNDQ0NDQ0NDQ0NBgYNDQ0MFg0ODg8MCw4PBgoNCxIOEA0QDQ0LDw0SDQwMCAYIDAwGDQ0ODgwLDg8GCQ0LEQ4PDA8NDQsODBENDAwICAgNBwYNDQ4NCA0JFAsMDQoPCAkNCAgGDQ0IBwgLDBQUFAwNDQ0NDQ0UDgwMDAwGBgYGDw4QEBAQEA0QDw8PDwwNGQ0NDQ0NDRMODAwMDAYGBgYODg8PDw8PDQ8ODg4ODA0MDwYGBhAOCgkNDQsLDAYODhUVDQ0NDQ0ICQkHCAAKDgYGBgoKCggHBw0EBwkHCQkHCBscDwAICAAAAAAAAAAAAAAAAAAAAAAAAAAHCxAPFBMHCQkNDwYLBgcPDw8PDw8PDw8PBgYPDw8NGQ8PEBEODRARBwsPDRQQEg4SDw8NEA4VDw4OCQcJDg0HDw8PEA0MEBAHCg4MExARDhEODgwQDhQPDQ0JCQkPCAcPDxAPCQ8KFw0NDwsRCQoPCQkHDg8JCAkNDRcXFw0PDw8PDw8WEA4ODg4HBwcHERASEhISEg8SEBAQEA4PHA8PDw8PDxUPDQ0NDQcHBwcQEBERERERDxEQEBAQDQ8NEQcHBxIQCwoODg0NDQcQEBgYDw8ODw4JCgoICQALEAcHBwsLCwkICA8EBwoHCgoICR0eEAAJCQAAAAAAAAAAAAAAAAAAAAAAAAAIDBEQFRQH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AHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMgBDAGEAcgByAG8AaQBzAEcAbwB0AGgAaQBjAFMAQwAtAFIAZQBnAHUAbABhAHIAQwBhAHIAcgBvAGkAcwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFIAYQBsAHAAaAAgAGQAdQAgAEMAYQByAHIAbwBpAHMALgBSAGEAbABwAGgAIABkAHUAIABDAGEAcgByAG8AaQBzAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBjAGEAcgByAG8AaQBzAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAABBgAAAAEAAgADAQIBAwEEAQUBBgEHAQgBCQEKAQsBDAENAQ4BDwEQAREBEgETARQABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCsAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkARUAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEWARcBGADXARkBGgEbARwBHQEeAR8BIADiAOMBIQEiALAAsQEjASQBJQEmAScBKADYAOEA3QDZASkAsgCzALYAtwDEALQAtQDFAIcAvgC/ASoBKwEsAS0BLgEvATABMQEyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAwMQd1bmkwMDEwB3VuaTAwMTEHdW5pMDAxMgd1bmkwMDEzB3VuaTAwMTQHdW5pMDAxNQd1bmkwMDE2B3VuaTAwMTcHdW5pMDAxOAd1bmkwMDE5B3VuaTAwMDIHdW5pMDBBRARoYmFyBkl0aWxkZQZpdGlsZGUCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwpMZG90YWNjZW50BGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uCGRvdGxlc3NqDGRvdGFjY2VudGNtYgRFdXJvC2NvbW1hYWNjZW50CWdyYXZlLmNhcAxkaWVyZXNpcy5jYXAJYWN1dGUuY2FwDmNpcmN1bWZsZXguY2FwCWNhcm9uLmNhcAhyaW5nLmNhcAl0aWxkZS5jYXAAAAABAAQACAAKABQACwBgAA///wAKAAEAAAAKADAARAACREZMVAAObGF0bgAaAAQAAAAA//8AAQAAAAQAAAAA//8AAQABAAJrZXJuAA5rZXJuAA4AAAABAAAAAQAEAAIAAAABAAgAAQD8AAQAAAB5EnwXEhaQFxIXaBdoEnwSfBJ8DjgBug76ESYB2AMGE5YDIBR0ESYD7hEmFbwElAVOE5YG7Ah2CaAPgApuFxIRwAsMEjYSwgsqC5gT6BQSFUoSwguyEsIWRgwEDEoT6AzMDVINwBMMDgoWkBd+FpAWkBJ8F2gXnA44DjgOOA44DjgOOA76ESYRJhEmESYRJhEmESYTlhOWE5YTlg+AESYRwBHAEcARwBHAEcASNhLCEsISwhLCEsISwhJ8EsIT6BPoE+gT6BMMEsITDBOWE+gTlhPoFBIVShR0FUoVvBW8FkYVvBZGFpAWkBcSFxIXaBd+F5wAAgAfACEAJAAAADAANAAEADcAOgAJADwAPQANAEAAQgAPAEUAUAASAFUAVQAeAFcAWgAfAFwAXQAjAGAAYgAlAGUAcAAoAHQAdAA0AIAAggA1AIYAhgA4AIwAjAA5AJAAkAA6AJUAmgA7AJwAnABBAKUApQBCAKcAqwBDAK0AswBIALUAugBPALwAvABVAMUAxQBWAMcA1ABXANkA3QBlAOAA4gBqAOcA6wBtAPIA8wByAPYA9gB0APkA/AB1AAcAQP/2AEr/9gBM//EATv/xAE//5wCy/+cA2//2AEsAIv+cACT/nAA3/90AOf/2AD3/9gBA/+cARf/2AEf/9gBJ//sATv/7AFX/nABX/84AWP/2AFn/8QBa//YAW//2AFz/9gBd//EAXv/2AF//9gBg/9MAYf/2AGL/9gBj//YAZP/2AGX/8QBm//YAZ//xAGj/9gBp//YAiv/2AJD/7ACV/90Alv/dAJf/3QCY/90Amf/dAJr/3QCb/90Ap//2AKj/9gCp//YAqv/2AKv/9gCt//YAtf/OALb/zgC3/84AuP/OALn/zgC6/84Au//OAL3/9gC+//YAxf/2AMf/8QDI//EAyf/xAMr/8QDL//EAzf/xANX/9gDY//YA2//nANz/0wDd//YA4P/2AOL/9gDk//YA5f/2AOb/8QDp//YA9v+cAPn/nAD8/+wABgBK//gATP/0AE3/+QBO/+wAT//iALL/4gAzACH/4gAj/8kAMv/iADP/4gA0/+IAOf/TAD3/0wBF/9MAR//TAEn/8QBZ/90AXf/dAGX/3QBn/90Aaf/xAGr/4gBr//EAbP/dAG3/6QBv/9MAdP/JAID/2ACB/8kAgv/JAIb/4gCQ//EAp//TAKj/0wCp/9MAqv/TAKv/0wCt/9MAx//dAMj/3QDJ/90Ayv/dAMv/3QDM/+IAzf/dAM7/8QDP//EA0P/xANH/8QDS/9MA1P/TAOX/0wDm/90A8v/JAPP/yQD7/9gA/P/xACkAIv9+ACT/fgA3/90AQP/iAEr/+wBO/+cAT//zAFD/8QBV/34AV//OAFn/+QBd//kAYP/OAGX/+QBn//kAlf/dAJb/3QCX/90AmP/dAJn/3QCa/90Am//dALL/8wC1/84Atv/OALf/zgC4/84Auf/OALr/zgC7/84Ax//5AMj/+QDJ//kAyv/5AMv/+QDN//kA2//iANz/zgDm//kA9v9+APn/fgAuACL/9gAk//YAN//7ADn/+wA9//sAQP/2AEX/+wBH//sASf/2AEr/9gBM//sATf/2AE7/7ABP/+cAUP/7AFX/9gBX//sAYP/5AJD/8QCV//sAlv/7AJf/+wCY//sAmf/7AJr/+wCb//sAp//7AKj/+wCp//sAqv/7AKv/+wCt//sAsv/nALX/+wC2//sAt//7ALj/+wC5//sAuv/7ALv/+wDb//YA3P/5AOX/+wD2//YA+f/2APz/8QBnACH/zgAi/7AAI//EACT/sAAw/84AMf/OADL/zgAz/84ANP/OADf/zgA5/+cAPf/nAED/0wBF/+cAR//nAFX/sABX/84AWP/nAFn/0wBa/+cAW//nAFz/5wBd/9MAXv/nAF//5wBg/84AYf/nAGL/5wBj/+cAZP/nAGX/0wBm/+cAZ//TAGj/5wBp/9gAa//dAGz/4gBt/+cAbv/YAG//5wBw/+IAdP/EAID/xACB/8QAgv/EAIb/zgCK/+cAjP/OAJD/yQCV/84Alv/OAJf/zgCY/84Amf/OAJr/zgCb/84Ap//nAKj/5wCp/+cAqv/nAKv/5wCt/+cAtf/OALb/zgC3/84AuP/OALn/zgC6/84Au//OAL3/5wC+/+cAxf/nAMf/0wDI/9MAyf/TAMr/0wDL/9MAzP/OAM3/0wDO/90Az//dAND/3QDR/90A0v/nANT/5wDV/+cA2P/nANv/0wDc/84A3f/nAOD/5wDi/+cA5P/nAOX/5wDm/9MA6f/nAPL/xADz/8QA9v+wAPn/sAD6/84A+//EAPz/yQBiACH/4gAi/78AI//nACT/vwAw//EAMf/xADL/4gAz/+IANP/iADf/0wA5//AAPf/wAED/5wBF//AAR//wAEn/+wBV/78AV//EAFj/+wBZ/+IAWv/7AFv/+wBc//sAXf/iAF7/+wBf//sAYP/OAGH/+wBi//sAY//7AGT/+wBl/+IAZv/7AGf/4gBo//sAaf/0AGv/9gBw//gAdP/nAID/7ACB/+cAgv/nAIb/4gCK//sAjP/xAJD/9gCV/9MAlv/TAJf/0wCY/9MAmf/TAJr/0wCb/9MAp//wAKj/8ACp//AAqv/wAKv/8ACt//AAtf/EALb/xAC3/8QAuP/EALn/xAC6/8QAu//EAL3/+wC+//sAxf/7AMf/4gDI/+IAyf/iAMr/4gDL/+IAzP/iAM3/4gDO//YAz//2AND/9gDR//YA1f/7ANj/+wDb/+cA3P/OAN3/+wDg//sA4v/7AOT/+wDl//AA5v/iAOn/+wDy/+cA8//nAPb/vwD5/78A+v/xAPv/7AD8//YASgAh//sAIv/JACP/7AAk/8kAMP/7ADH/+wAy//sAM//7ADT/+wA3/+cAOf/zAD3/8wBA//YARf/zAEf/8wBJ//0AVf/JAFf/2ABZ/+4AXf/uAGD/5wBl/+4AZ//uAGn/+ABr//sAbv/2AHD/9AB0/+wAgP/2AIH/7ACC/+wAhv/7AIz/+wCV/+cAlv/nAJf/5wCY/+cAmf/nAJr/5wCb/+cAp//zAKj/8wCp//MAqv/zAKv/8wCt//MAtf/YALb/2AC3/9gAuP/YALn/2AC6/9gAu//YAMf/7gDI/+4Ayf/uAMr/7gDL/+4AzP/7AM3/7gDO//sAz//7AND/+wDR//sA2//2ANz/5wDl//MA5v/uAPL/7ADz/+wA9v/JAPn/yQD6//sA+//2ADMAIf/sACP/zgAy/+wAM//sADT/7AA5/9YAPf/WAEX/1gBH/9YASf/sAFn/4gBd/+IAZf/iAGf/4gBp//QAav/sAGv/8wBs//EAbf/4AG//6QB0/84AgP/TAIH/zgCC/84Ahv/sAJD/8QCn/9YAqP/WAKn/1gCq/9YAq//WAK3/1gDH/+IAyP/iAMn/4gDK/+IAy//iAMz/7ADN/+IAzv/zAM//8wDQ//MA0f/zANL/6QDU/+kA5f/WAOb/4gDy/84A8//OAPv/0wD8//EAJwAh//EAI//OADL/8QAz//EANP/xADn/9gA9//YARf/2AEf/9gBZ//sAXf/7AGX/+wBn//sAaf/4AHT/zgCA/9MAgf/OAIL/zgCG//EAkP/xAKf/9gCo//YAqf/2AKr/9gCr//YArf/2AMf/+wDI//sAyf/7AMr/+wDL//sAzP/xAM3/+wDl//YA5v/7APL/zgDz/84A+//TAPz/8QAHAGD/+QBq//EAbv/xAG//7gDS/+4A1P/uANz/+QAbACL/ugAk/7oAVf+6AFf/3QBZ//gAXf/4AGD/0wBl//gAZ//4AGn/+wC1/90Atv/dALf/3QC4/90Auf/dALr/3QC7/90Ax//4AMj/+ADJ//gAyv/4AMv/+ADN//gA3P/TAOb/+AD2/7oA+f+6AAYAbP/xAG3/9gBu//YAb//nANL/5wDU/+cAFAAi/7AAJP+wAFX/sABX/90AbP/2AG3/+wBu/+IAb//pAHD/8QC1/90Atv/dALf/3QC4/90Auf/dALr/3QC7/90A0v/pANT/6QD2/7AA+f+wABEAV//4AGD/9gBp//sAbP/4AG3/+ABu//EAb//uALX/+AC2//gAt//4ALj/+AC5//gAuv/4ALv/+ADS/+4A1P/uANz/9gAgACL/xAAj/+IAJP/EAFX/xABX/9YAWf/xAF3/8QBg/9MAZf/xAGf/8QB0/+IAgf/iAIL/4gC1/9YAtv/WALf/1gC4/9YAuf/WALr/1gC7/9YAx//xAMj/8QDJ//EAyv/xAMv/8QDN//EA3P/TAOb/8QDy/+IA8//iAPb/xAD5/8QAIQAi/84AI//xACT/zgBV/84AV//YAFn/5wBd/+cAYP/dAGX/5wBn/+cAaf/0AHT/8QCB//EAgv/xALX/2AC2/9gAt//YALj/2AC5/9gAuv/YALv/2ADH/+cAyP/nAMn/5wDK/+cAy//nAM3/5wDc/90A5v/nAPL/8QDz//EA9v/OAPn/zgAbACL/4gAk/+IAVf/iAFf/5wBZ//QAXf/0AGD/7ABl//QAZ//0AGn/+wC1/+cAtv/nALf/5wC4/+cAuf/nALr/5wC7/+cAx//0AMj/9ADJ//QAyv/0AMv/9ADN//QA3P/sAOb/9AD2/+IA+f/iABIAI//YAFn/3QBd/90AZf/dAGf/3QBp/+wAdP/YAIH/2ACC/9gAx//dAMj/3QDJ/90Ayv/dAMv/3QDN/90A5v/dAPL/2ADz/9gACwBZ//gAXf/4AGX/+ABn//gAx//4AMj/+ADJ//gAyv/4AMv/+ADN//gA5v/4ADAAIf/xACP/8QAy//EAM//xADT/8QA5/+wAPf/sAEX/7ABH/+wASf/2AEr/zgBL//YATP/TAE3/5wBP/8QAWf/sAF3/7ABl/+wAZ//sAGz/8QB0//EAgP/nAIH/8QCC//EAhv/xAKf/7ACo/+wAqf/sAKr/7ACr/+wArf/sAK7/9gCv//YAsP/2ALH/9gCy/8QAx//sAMj/7ADJ/+wAyv/sAMv/7ADM//EAzf/sAOX/7ADm/+wA8v/xAPP/8QD7/+cAIQAh/+wAI//YADL/7AAz/+wANP/sADn/7AA9/+wAQP/2AEX/7ABH/+wASv/xAEz/9gBN//sATv/xAE//5wBQ//sAaf/4AHT/2ACB/9gAgv/YAIb/7ACn/+wAqP/sAKn/7ACq/+wAq//sAK3/7ACy/+cAzP/sANv/9gDl/+wA8v/YAPP/2ABpACH/zgAi/7AAI//EACT/sAAw/+IAMf/iADL/zgAz/84ANP/OADf/xAA5/9gAPf/YAED/3QBF/9gAR//YAEn/7ABV/7AAV/+wAFj/7ABZ/8QAWv/sAFv/7ABc/+wAXf/EAF7/7ABf/+wAYP/EAGH/7ABi/+wAY//sAGT/7ABl/8QAZv/sAGf/xABo/+wAaf/YAGr/9gBr/+wAbP/sAG3/8QBu/+cAb//sAHD/5wB0/8QAgP/JAIH/xACC/8QAhv/OAIr/7ACM/+IAkP/iAJX/xACW/8QAl//EAJj/xACZ/8QAmv/EAJv/xACn/9gAqP/YAKn/2ACq/9gAq//YAK3/2AC1/7AAtv+wALf/sAC4/7AAuf+wALr/sAC7/7AAvf/sAL7/7ADF/+wAx//EAMj/xADJ/8QAyv/EAMv/xADM/84Azf/EAM7/7ADP/+wA0P/sANH/7ADS/+wA1P/sANX/7ADY/+wA2//dANz/xADd/+wA4P/sAOL/7ADk/+wA5f/YAOb/xADp/+wA8v/EAPP/xAD2/7AA+f+wAPr/4gD7/8kA/P/iACYAIv/nACT/5wAw//YAMf/2ADf/7ABA/+IASf/7AEr/5wBM/+wATv/WAE//0wBQ//YAVf/nAFf/6QBg/+IAjP/2AJD/8QCV/+wAlv/sAJf/7ACY/+wAmf/sAJr/7ACb/+wAsv/TALX/6QC2/+kAt//pALj/6QC5/+kAuv/pALv/6QDb/+IA3P/iAPb/5wD5/+cA+v/2APz/8QAdACP/9ABZ/+wAXf/sAGX/7ABn/+wAaf/7AGr/1gBr//MAbP/YAG3/5wBv/8kAdP/0AIH/9ACC//QAx//sAMj/7ADJ/+wAyv/sAMv/7ADN/+wAzv/zAM//8wDQ//MA0f/zANL/yQDU/8kA5v/sAPL/9ADz//QAEQBX//sAYP/2AGr/+wBs//gAbf/8AG7/8QBv/+wAtf/7ALb/+wC3//sAuP/7ALn/+wC6//sAu//7ANL/7ADU/+wA3P/2ABEAN//xAED/7ABK/84ATP/iAE3/+wBO/+wAT//OAFD/8QCV//EAlv/xAJf/8QCY//EAmf/xAJr/8QCb//EAsv/OANv/7AASAFf/7ABg/+cAaf/7AGr/8QBs/+cAbf/0AG7/3QBv/+IAtf/sALb/7AC3/+wAuP/sALn/7AC6/+wAu//sANL/4gDU/+IA3P/nACIAIv+6ACP/4gAk/7oAVf+6AFf/yQBZ/+IAXf/iAGD/zgBl/+IAZ//iAGn/5wBw//EAdP/iAIH/4gCC/+IAtf/JALb/yQC3/8kAuP/JALn/yQC6/8kAu//JAMf/4gDI/+IAyf/iAMr/4gDL/+IAzf/iANz/zgDm/+IA8v/iAPP/4gD2/7oA+f+6ABQAN//4AED/9gBX//EAYP/nAJX/+ACW//gAl//4AJj/+ACZ//gAmv/4AJv/+AC1//EAtv/xALf/8QC4//EAuf/xALr/8QC7//EA2//2ANz/5wAKAFf/8wBg/+4Atf/zALb/8wC3//MAuP/zALn/8wC6//MAu//zANz/7gAYACP/3QBZ/9YAXf/WAGX/1gBn/9YAaf/xAGv/9gBt//QAdP/dAIH/3QCC/90Ax//WAMj/1gDJ/9YAyv/WAMv/1gDN/9YAzv/2AM//9gDQ//YA0f/2AOb/1gDy/90A8//dADUAIf/YACP/ugAy/9gAM//YADT/2AA5/+IAPf/iAEX/4gBH/+IASf/7AEr/vwBL//EATP/TAE3/3QBP/78AWf/2AF3/9gBl//YAZ//2AGr/3QBs/90Abf/xAG//zgB0/7oAgf+6AIL/ugCG/9gAkP/iAKf/4gCo/+IAqf/iAKr/4gCr/+IArf/iAK7/8QCv//EAsP/xALH/8QCy/78Ax//2AMj/9gDJ//YAyv/2AMv/9gDM/9gAzf/2ANL/zgDU/84A5f/iAOb/9gDy/7oA8/+6APz/4gAcACP/zgBZ//EAXf/xAGX/8QBn//EAav/LAGv/+wBs/90Abf/zAG//wgB0/84Agf/OAIL/zgDH//EAyP/xAMn/8QDK//EAy//xAM3/8QDO//sAz//7AND/+wDR//sA0v/CANT/wgDm//EA8v/OAPP/zgAiACP/9gA5//YAPf/2AEX/9gBH//YASf/7AEr/7ABM//YAT//iAFn/8QBd//EAZf/xAGf/8QBp//gAdP/2AIH/9gCC//YAp//2AKj/9gCp//YAqv/2AKv/9gCt//YAsv/iAMf/8QDI//EAyf/xAMr/8QDL//EAzf/xAOX/9gDm//EA8v/2APP/9gASAFn/9ABd//QAZf/0AGf/9ABp//sAav/xAGz/7ABt//gAb//nAMf/9ADI//QAyf/0AMr/9ADL//QAzf/0ANL/5wDU/+cA5v/0ACAAN//xAED/4gBJ/+wASv/EAEz/5wBN/+wATv/OAE//xABQ/9gAV//0AGr/4gBs//EAbv/YAG//4gCV//EAlv/xAJf/8QCY//EAmf/xAJr/8QCb//EAsv/EALX/9AC2//QAt//0ALj/9AC5//QAuv/0ALv/9ADS/+IA1P/iANv/4gAVADn/7AA9/+wARf/sAEf/7ABK/7AATP+/AE3/yQBP/7AAav/EAGz/zgBv/7oAp//sAKj/7ACp/+wAqv/sAKv/7ACt/+wAsv+wANL/ugDU/7oA5f/sAAUASv/OAEz/8QBN//sAT//iALL/4gAHAED/4gBK/8kATP/2AE7/8QBP/+IAsv/iANv/4gARADf/5wBA/+IASv/EAEz/7ABN//YATv/TAE//yQBQ/+IAlf/nAJb/5wCX/+cAmP/nAJn/5wCa/+cAm//nALL/yQDb/+IAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
