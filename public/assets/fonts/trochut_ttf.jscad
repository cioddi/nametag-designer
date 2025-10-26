(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.trochut_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAN4AAAADAAEECQABAA4A3gADAAEECQACAA4A7AADAAEECQADADYA+gADAAEECQAEAA4A3gADAAEECQAFABoBMAADAAEECQAGAA4A3gADAAEECQAHAFABSgADAAEECQAIABoBmgADAAEECQAJABoBmgADAAEECQALACgBtAADAAEECQAMACgB3AADAAEECQANASACBAADAAEECQAOADQDJABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAAQQBuAGQAcgBlAHUAIABCAGEAbABpAHUAcwAgACgAdwB3AHcALgBhAG4AZAByAGUAdQBiAGEAbABpAHUAcwAuAGMAbwBtAHwAbQBhAGkAbABAAGEAbgBkAHIAZQB1AGIAYQBsAGkAdQBzAC4AYwBvAG0AKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAVAByAG8AYwBoAHUAdABUAHIAbwBjAGgAdQB0AFIAZQBnAHUAbABhAHIAQQBuAGQAcgBlAHUAQgBhAGwAaQB1AHMAOgAgAFQAcgBvAGMAaAB1AHQAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMQBUAHIAbwBjAGgAdQB0ACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAQQBuAGQAcgBlAHUAIABCAGEAbABpAHUAcwAuAEEAbgBkAHIAZQB1ACAAQgBhAGwAaQB1AHMAdwB3AHcALgB0AHkAcABlAHIAZQBwAHUAYgBsAGkAYwAuAGMAbwBtAHcAdwB3AC4AYQBuAGQAcgBlAHUAYgBhAGwAaQB1AHMALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/4UAFAAAAAAAAAAAAAAAAAAAAAAAAAAAANwAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAJYAhgCOAIsAnQCpAIoA2gCDAI0AiADDAN4AngCqAKIArQDJAMcArgBiAGMAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwCRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAChAH8AfgCAAIEA7ADuALoBAgEDANcA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA2wDcAN0A4ADZAN8AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAEEAIwA7wEFAMAAwQdBbWFjcm9uBkFicmV2ZQRFdXJvAmZmAAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA2wABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABADIABAAAABQAXgBkAGoBNAFeAiAC0gOABIYFOAOOA5QDngRWA6gEVgRWBGAEhgU4AAEAFAAVABoAKQAvADcAOQA6ADsAPABJAFUAWQBaAFwAkACuALAAtAC6ANkAAQAX/9gAAQAX/84AMgAt/7oARP/EAEb/xABH/8QASP/EAEr/xABM/+IATf/iAFD/4gBR/+IAUv/EAFP/4gBU/8QAVf/iAFb/4gBY/+IAWf/iAFr/4gBb/+IAXP/iAF3/4gCT/8QAlP/EAJX/xACW/8QAl//EAJj/xACZ/8QAmv/EAJv/xACc/8QAnf/EAJ//4gCi/8QAo//iAKT/xACl/8QApv/EAKf/xACo/8QAqf/EAKr/4gCr/+IArP/iAK3/4gCu/+IAsP/iALf/xAC5/+IAvP/iAAoAN//EADn/4gA6/+IAPP/OAFz/4gCQ/84Arv/iALD/4gC6/84Ayf/YADAAD/+cABH/nAAt/5wARP+wAEb/sABH/7AASP+wAEr/sABQ/8QAUf/EAFL/sABT/8QAVP+wAFX/sABW/7AAWP/EAFn/xABa/8QAW//EAFz/sABd/8QAk//EAJT/sACV/7AAlv+wAJf/xACY/7AAmf+wAJr/xACb/7AAnP+wAJ3/xACi/7AAo//EAKT/xACl/7AApv/EAKj/xACp/7AAqv/EAKv/xACs/8QArf/EAK7/sACw/7AAt/+wALn/sAC8/8QALAAP/8QAEf+6AC3/xABE/84ARv/OAEf/zgBI/84ASv/OAFD/4gBR/+IAUv/OAFP/4gBU/84AVf/iAFb/4gBY/+IAXP/iAJP/zgCU/84Alf/OAJb/zgCX/84AmP/OAJn/zgCa/84Am//OAJz/zgCd/84Aov/OAKP/4gCk/84Apf/OAKb/zgCn/84AqP/OAKn/zgCq/+IAq//iAKz/4gCt/+IArv/iALD/4gC3/84Auf/iACsAD//OABH/zgAt/8QARP/OAEb/zgBH/84ASP/OAEr/zgBQ/+IAUf/iAFL/zgBT/+IAVP/OAFX/4gBW/+IAWP/iAFz/4gCT/84AlP/OAJX/zgCW/84Al//OAJj/zgCZ/84Amv/OAJv/zgCc/84Anf/OAKL/zgCj/+IApP/OAKX/zgCm/84AqP/OAKn/zgCq/+IAq//iAKz/4gCt/+IArv/iALD/4gC3/84Auf/iAAMAXP/OAK7/zgCw/84AAQAR/8QAAgAP/+IAEf/OAAIAD//sABH/2AArAA//ugAt/6YARP+6AEb/ugBH/7oASP+6AEr/ugBQ/84AUf/OAFL/ugBT/84AVP+6AFX/zgBW/84AWP/OAFv/zgBd/84Ak/+6AJT/ugCV/7oAlv+6AJf/ugCY/7oAmf+6AJr/ugCb/7oAnP+6AJ3/ugCi/7oAo//OAKT/ugCl/7oApv+6AKf/ugCo/7oAqf+6AKr/zgCr/84ArP/OAK3/zgC3/7oAuf/OALz/zgACAA//zgAR/8QACQA3/8QAOf/iADr/4gA8/84AXP/iAJD/zgCu/+IAsP/iALr/zgAsAA//ugAR/6YALf+mAET/ugBG/7oAR/+6AEj/ugBK/7oAUP/OAFH/zgBS/7oAU//OAFT/ugBV/84AVv/OAFj/zgBb/84AXf/OAJP/ugCU/7oAlf+6AJb/ugCX/7oAmP+6AJn/ugCa/7oAm/+6AJz/ugCd/7oAov+6AKP/zgCk/7oApf+6AKb/ugCn/7oAqP+6AKn/ugCq/84Aq//OAKz/zgCt/84At/+6ALn/zgC8/84AAgAP/9gAEf/OAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
