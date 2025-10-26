(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.squada_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA2ADdANkAwgAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMAvwABAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
