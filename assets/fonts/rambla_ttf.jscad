(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rambla_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AA3/+AA3//kAQP/xAFf/9gBZ//cAWv/5AGD/8wACAEr/+gCz//kACQAX//EAI//xAEr/6wBX/+UAWf/kAFr/5QBx/+oAsgAMALP/8gADABT/1wAX//YAev/SAAcAQP/zAEr/+gBX//sAWf/8AFr/+wBg//UAs//7AAsAA//tAAn/8wAM//EAEv/UABX/8wAX//YAO//rAED/6ABg/+UAif/PALP/9wAIAAwADQAPAA8AEgAfAEAAEABNABQAYAATANoADwDdAA8ACQAX//YAN//1ADn/+gA//+0AQP/pAEr/+wBg/+YAs//5AOf/9AATAAP/6gAJ//AAEv/RABf/2AAZ//AAI//nAEr/uABX/90AWf/gAFr/4ABb/9UAcf/gAIn/zgCi//gApv/FALEADgCyABoAs//2AMP/twANAAP/6QAJ//EAEv/RABf/6wBK/+MAW//7AHH/8wCJ/9UAov/5AK8ACQCxAAwAsgAjAMP/6QAGABL/7ABK/+8AW//8AIn/6gCz//cAw//2AAkAF//0ACP/9ABK/+oAV//pAFn/6QBa/+sAcf/uALIADQCz//QACgAT//YAF//VABn/7AAb//YAI//nAKL/8ACvAAwAsQAGALIAJADD/9UAFwAL/+sAE//mABT/6QAV//IAFv/1ABf/4wAY//QAGf/kABv/5wAc/+sALQAgADD/8gA6//YASf/wAE0APgBX/+UAWf/jAFr/4wBb/+4AXv/wAIn/7gCRAAQAkgAGAA8AE//vABT/0gAX//MAGf/wABr/8QAtACIAN//QADn/0gA6/+kASf/yAFf/4wBZ/90AWv/jALP/8gDZ/9AABAA3/8cAOf/lADr/+QA8/8gABQA3/8UAOP/5ADn/9QA6//kAPP/eAAUALf/8ADD//AA4//sAOv/7AD3/+wAZAAP/8QAEAA0ADAA1AA0AEwAS/+YAIgAPADcANwA5AEIAOgAfADsAKwA8AEYAPQAeAD8ANwBAADMASv/9AF8ABwBgADcAif/XAK8AXACwAAcAsQA7ALIAXgCz/+cAwwABAOcALQAFAC0AHwA3/+IAPP/7AE0ALwCz//wACwA3/8kAOP/6ADn/9gA6//oAPP/fAD//8ABA//AASv/wAGD/8QCz/94A5//uAAYAN//WADj//AA5/+sAOv/3ADz/2AB6/8AACwAt//kAMP/7ADb/9wA3/70AOP/6ADn/4QA6//AAO//nADz/xwA9//MAif/4AAEATQAaAA4AA//sAAn/8AAM/+0AEv/RADD/+wA3/+AAO//sADz/+AA9//kAQP/kAEr/+gBg/9kAif/NALP/5gAGAC3//AA3/8EAOP/7ADn/7QA6//YAPP/bAAUAN//cADz/9gBA/+4AYP/nALP/+gAPAAP/7QAJ//YADP/rABL/3gAw//wAN//gADv/6gA8//UAPf/2AED/4wBK//0AYP/XAIn/3gCz//MA5//4AA0AA//vAAz/6wAS/+YAMP/7ADf/4AA7/+wAPP/yAD3/9gBA/+MAYP/YAIn/4wCz//cA5//4AAkAN//YADn//AA8/+sAP//0AED/7gBK//IAYP/vALP/6ADn//QABgAw//oAN//eADv/5wA8//MAPf/0AIn/3AAFADf/wgA4//kAOf/xADr/9gA8/9gAFQAL/+gAE//gABT/8gAV//YAF//WABn/2wAb/+MAHP/oAC0AHgAw//UASf/uAE0AIABX/90AWf/XAFr/2ABb/+8AXv/wAIn/7wCRAAcArwAIALIACQADAAz/8gBA//AAYP/wAAIAN//iAE0AHQAEADf/4AA5//MAO//uAIn/8AACABf/zAAZ//IABgAU/+MAFf/0ABb/7wAY//UAGv/kAE//wAAEAC0ADgA3/9wATQAsAIn/8QAMAAP/7gAM/+oAEv/fABX/7QAW//MAN//xADv/2QA///QAQP/mAFv/+wBg/90Aif/dABMAA//xAAz/8QAN/+oALf/8ADf/xAA4//gAOf/dADr/5gA7//wAPP/DAD//4QBA/+UASv/2AFf/5gBZ/+YAWv/qAFv/9wBg/98A5//sAAQADAALAD8AEQBAAA0AYAAZAAEA5wATAAIAYAAMAOcAFAAVAAz/7QAS//MAJP/6AC3//AAw//wANv/4ADf/3wA4//oAOf/qADr/8wA7/+YAPP/gAD3/8wA//+8AQP/pAFn//ABa//0AW//wAGD/5gCJ//UA5//zAAEAA/+nAAEAov/wAAUAA//uAAn/7gAS/8QAI//wAHH/7gACAK8ADQCyAAkABQAT//UAF//WABn/7QAb//QA5f/CAAEAF//zAAEAif/hAAUAFP/jABX/8AAW/+sAGP/1ABr/5AABAOUABQACIDwABAAAIL4ikABHADoAAP/t/+n/5v/zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9P/cAAD/8//z/+f/7f/S//T/7v/m//P/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/cAAD/zP+f/+3/7wAAAAD/1AAA/9QAAAAAAAD/4f/o/9T/9v/y//L/7v/2//P/pv+eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/eAAAAAAAAAAAAAP/WAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/aAAAAAAAAAAAAAAAAAAAAAAAAAAD/8v/IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+T/+b/4v/n//L/5v/w/+//7//rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9wAAAAAAAAAAAAAAAAAAAAAAAAAAP/3/8oAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/5z/7f/o/+7/+P/s//cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0wAAAAAAAAAAAAD/8AAAAAAAAAAA/+QAAAAAAAAAAAAA//H/8QAAAAAAAAAAAAAAAP/e/97/3v/l/90AAAAAAAAAAP/s/+0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5gAA/8v/zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+7/6//rAAAAAAAAAAAAAAAA//H/8v/yAAD/8QAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//P/9v/QAAD/7P/t/+L/6P/T/+//6v/n//j/8f/0//gAAAAAAAAAAP/3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//L/7//zAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5gAAAAAAAAAAAAD/1QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+P/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/94AAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/5//8P/s//EAAP/wAAAAAAAA//UAAAAAAAD/8//Z/8j/9v/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/nAAD/1v/e/+b/6wAAAAD/2QAA/+YAAAAAAAD/6v/uAAD/+v/5//n/8gAAAAD/5f/eAAD/+//8//wAAP/7//oAAP/2AAAAAAAAAAD/6QAAAAAAAAAA/9T/4f/y//H//P/gAAAAAAAAAAAAAAAAAAAAAAAA//z/4wAAAAAAAP/8AAD/9AAAAAAAAAAA/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0f/3//f/9//4//cAAAAAAAAAAP/2//j//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9wAAAAAAAP/1//gAAAAAAAAAAAAAAAD//AAA//j/+AAAAAD/+P/4AAAAAAAAAAAAAAAA//f/+P/3//z/9//2AAAAAAAA//v/+f/8AAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAAAAAAAAAAAAAAAAAAAAP+7AAD/vv/A/8L/vQAAAAD/uwAA/8kAAAAAAAD/vf/AAAD/8v/r/+r/6AAAAAD/wf/AAAD/9f/5//gAAP/2//MAAP/O/+8AAP/8AAD/6wAAAAD/7QAA/8f/wf/u/+3/+f/CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6//r/+v/8//r/+gAAAAAAAP/8//wAAAAAAAAAAAAAAAAAAAAAAAD/9v/5AAD//P/8AAAAAAAAAAAAAAAAAAD/3v/ZAAAAAAAA/+EAAP/JAAAAAAAAAAD/vAAAAAAAAAAAAAD/8P/xAAAAAAAAAAAAAP/U/7z/vf+8/8D/vAAA/9b/0//P/7f/tgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/3gAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAP/8//oAAAAAAAAAAP/6//MAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//b/+v/6//r/+P/6//gAAAAAAAD//P/6AAAAAAAA//EAAAAAAAAAAAAA//P/+gAA//z//AAA//wAAAAAAAAAAAAAAAD/+f/sAAAAAAAA//H/+v/w//b/+v/o//v/7wAAAAAAAAAAAAAAAP/8AAAAAAAAAAD/8QAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAD/7gAAAAD/7gAA/93/5QAA//gAAAAAAAAAAP/pAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//r/+v/6//v/+gAAAAAAAAAA//z//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAAAAAAAAAA/+P/+wAAAAAAAAAAAAAAAP/7AAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8v/+f/5//kAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+v/sAAAAAAAA//H/+//x//f/+v/o//v/8AAAAAAAAAAAAAAAAP/8AAAAAAAAAAD/8wAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAD/7gAAAAD/7wAA/93/5QAA//gAAAAAAAAAAP/pAAAAAAAAAAD/9gAA/+sAAAAA//QAAP/8AAD//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/xAAAAAAAA/+7/8wAAAAAAAAAAAAAAAP/7AAD/8//zAAAAAP/t/+0AAAAAAAD/9wAAAAD/7v/x//D/+//v/+sAAP/t//L/+f/1AAAAAAAAAAD/7gAAAAAAAAAAAAD/9gAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//z//AAAAAAAAAAAAAAAAP/1//j/9wAA//UAAAAAAAD/8wAA//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+wAA//wAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//v/+//7AAD/+wAAAAAAAAAA//z//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8//wAAP/8AAAAAAAAAAAAAP/xAAAAAAAA//P/9AAAAAAAAAAAAAAAAAAAAAD/8v/zAAAAAP/3//cAAAAAAAD/9gAAAAD/+P/6//kAAP/5//EAAP/yAAAAAP/6AAAAAAAAAAD/8wAAAAAAAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5gAAAAAAAAAAAAD/9AAAAAAAAAAA/+MAAAAAAAAAAAAA//r/+gAAAAAAAAAAAAD/1P/g/+D/4P/k/98AAP/w/+r/6v/r/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5AAAAAAAAAAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/3f/dAAAAAAAA//YAAAAA/+H/6P/lAAD/4QAAAAD/4f/yAAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAA//gAAAAAAAAAAP/wAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAA/+7/7//w//D/8//uAAAAAP/3//b/9v/2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//v//AAAAAAAAAAAAAAAAAAA/+8AAP/7AAD/7//v//kAAAAAAAAAAP/4AAAAAP/w//QAAAAAAAAAAAAAAAAAAP/xAAAAAAAAAAAAAP/8AAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//b/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9gAA//oAAAAA//YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//P/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/nAAAAAAAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/o/+cAAAAAAAAAAAAAAAD/5f/q/+gAAP/mAAAAAP/n/+0AAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//P/1QAAAAD/7//x/+j/3AAAAAAAAAAA/8r/w//0//IAAAAA/+v/7AAAAAAAAAAAAAD/zP/F/8f/x//K/8X/xf/e/9D/1//Y/9j/+v/mAAD/yv/i/+kAAAAAAAAAAP/6AAAAAAAA/+0AAAAA//sAAAAAAAAAAP/t//MAAAAAAAAAAAAAAAD/8AAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAAAAD//AAAAAD//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7//3//QAA//sAAAAA//D/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+wAA/8wAAAAAAAD/+AAA/7n/+v/o//z//QAA//z//QAA//sAAAAA//UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/lAAD/2P/iAAD/8AAAAAAAAAAA/+///P/8//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAAA//gAAAAAAAD//QAAAAAAAAAAAAAAAAAAAAAAAP/5//oAAAAA//z/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//AAA/8//+AAAAAAAAAAA/7b/+v/kAAAAAAAA//wAAAAA//v//P/8//UAAAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAP/iAAD/3f/iAAD/7gAAAAAAAAAA//H//P/8//wAAP/2//wAAP/y//j/9//q//kAAAAAAAAAAAAAAAD/9//6AAAAAAAAAAAAAAAAAAAAAP/xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAA/97/9P/T/98AAP/tAAAAAAAAAAD/5QAA//oAAAAAAAD/1QAAAAAAAAAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0P/p/+v/7P/7/+cAAP/0/9P/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//QAAAAAAAAAAAAD/+AAAAAAAAAAAAAAAAAAA//0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/oAAD/2P/jAAD/7QAAAAAAAAAA/+8AAAAAAAAAAAAAAAD/1AAAAAAAAAAAAAD/t//7/+kAAAAAAAAAAAAAAAD/+wAA//z/9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+oAAP/f/+QAAP/xAAAAAAAAAAD/8//8//z//AAAAAD/6gAAAAAAAAAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4P/2//f/9//7//YAAAAA//X/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/uAAAAAAAAAAAAAAAAAAAAAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/o//n/+f/5//3/+QAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MAAAAdAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+L/8P/x//IAAP/vAAAAAP/f/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAAAAAAAAAA//j/+//H/+//+f/4/+v/+P++//L/4//lAAD/9//5//sAAP/6AAAAAP/wAAAAAP/2/+4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9wAAAAD/8wAAAAD/3//x/9P/3wAA/+sAAAAAAAAAAP/l//v/+v/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAD/8//zAAAAAAAAAAAAAAAA/+r/6//rAAD/6gAAAAD/4//lAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/93/9P/0//T/+v/z//v/+P/y//EAAAAAAAD/7QAA/90AAP/zAAAAAP/X/+L/7//3AAAAAAAAAAD/6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAAAAAAA//b/9gAAAAAAAAAAAAAAAP/v//H/8P/8/+7/8gAA/+T/6QAAAAAAAAAAAAAAAAAAAAD/7gAA/+P/5v/u//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+//7AAAAAAAAAAAAAAAA//f/+f/5AAD/9//7AAD/6P/sAAAAAAAAAAAAAAAAAAAAAP/rAAD/5//o//f/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//QAAAAAAAP/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAAAAAAAAAA/+z/7AAAAAAAAAAAAAAAAP/e/+P/4QAA/90AAAAA/9r/3gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9wAAAAAAAP/8AAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAAAAAAAAAAAAAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jAAAAAAAAAAD/7wAAAAAAAAAAAAAAAAAAAAAAAP/nAAAAAP/pAAD/6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6//oAAAAAAAD/4//qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAAAA//sAAAAAAAAAAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAD/7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAD/6f/pAAAAAAAAAAAAAAAA/+T/5v/l//T/5QAAAAAAAAAA//H/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/n//IAAAAAAAAAAAAA/+QAAAAAAAAAAP/ZAAAAAAAAAAAAAP/d/90AAAAAAAAAAAAAAAD/0v/T/9L/3//SAAAAAAAAAAD/3P/W/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8QAAAAAAAAAAAAD/5gAAAAAAAAAA/+IAAAAAAAAAAP/z/+X/5QAAAAAAAAAAAAAAAP/e/+D/3//j/94AAAAAAAAAAP/j/+L/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9gAAAAIAFQADAAMAAAAFAAUAAQAJAAsAAgANAA0ABQAPABMABgAXABcACwAaABoADAAcAB4ADQAkAD8AEABEAF4ALABkAGQARwBuAG4ASABwAHEASQB+AH4ASwCCAJkATACbALkAZAC7AMwAgwDWAN0AlQDjAOQAnQDnAOcAnwDpAOoAoAABAAUA5gASAAAAAAAAABEAEgBEAAAADgAAAAMADQADAAoABQAAAAAAAAACAAAAAAAGAAAABwAEAAQAAAAAAAAAAAAAABUAIAAhAB8AFwAWACkAGQAZAB0AJgAYACMAGQAcAB4AHAAiACgAGgAbACUAJwAqACsAJABGAAsAAAAAAAAAAABBADoAPQAwAC8AOQA/ADIALQAtAEAAMQAyADIAMwA6ADYANAA1AC4ANgA3ADgAOwA8AD4ARQAAAAAAAAAAAAAAEwAAAAAAAAAAAAAAAAAAAAAAAAAPAAAADQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAADAAVABUAFQAVABUAFQAXACEAFwAXABcAFwAZABkAGQAZAB8AGQAcABwAHAAcABwAAAAcABsAGwAbABsAKwAsAEIAQQBBAEEAQQBBAEEALwA9AC8ALwAvAC8ALQAtAC0ALQBDADIAMwAzADMAMwAzAAAAMwA2ADYANgA2ADwAOgA8AC0AGAAxABcALwAoADUAKwAkAD4AAAAAAAAAAAAAAAAAAAAAAAAADQANAAkACAADAAkACAADAAAAAAAAAAAAAAAPAAEAAAAAABQAAAAtADEAAQADAOgAJwAAAAQAAAAAAAAAKwAEAAAANgAtAAAAGgAiABoAKQAWABEAAAAAACgAAAAAABcAAAAAACEAIQAAAAAAAAAAAAAAAgA4ABQAOAA4ADgAFAA4ADgAOQA4ADgANwA4ABMAOAATADgAJgAJABIACwAVAAwAAwAKAAAALAAvAAAAAAAAAA0AMgAfABwAGwAGACAAMgA1ADUAMgAzACQAJAAdACQAHAAkAB4ABQAlAA8AEAAHAAEACAAAAAAALgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAAAAiACoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAAAAAAAAAAAIAAgACAAIAAgACAA4AFAA4ADgAOAA4ADgAOAA4ADgAOAA4ABMAEwATABMAEwAAABMAEgASABIAEgADADgAMgANAA0ADQANAA0ADQANAB8AGwAbABsAGwA1ADUANQA1ADAAJAAdAB0AHQAdAB0AAAAdACUAJQAlACUAAQAyAAEANQA4ADMAEwAdACYAHgADAAoACAAAAAAAAAAAAAAAAAAAAAAAAAAiACIAGQAYABoAGQAYABoAAAAAAAAAGgAAACMANAAAAAAAMQAAAAYABgABAAAACgAcAB4AAURGTFQACAAEAAAAAP//AAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
