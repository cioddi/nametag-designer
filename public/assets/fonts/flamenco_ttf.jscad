(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.flamenco_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEAEADKAAMAAQQJAAIADgDaAAMAAQQJAAMANgDoAAMAAQQJAAQAIAEeAAMAAQQJAAUAGgE+AAMAAQQJAAYAIAFYAAMAAQQJAAcAXAF4AAMAAQQJAAgAHgHUAAMAAQQJAAkAHgHUAAMAAQQJAAsAJAHyAAMAAQQJAAwAJAHyAAMAAQQJAA0BIAIWAAMAAQQJAA4ANAM2AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACAAYgB5ACAATABhAHQAaQBuAG8AVAB5AHAAZQAgAEwAaQBtAGkAdABhAGQAYQAgACgAaQBuAGYAbwBAAGwAYQB0AGkAbgBvAHQAeQBwAGUALgBjAG8AbQApACwAIAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQBzACAAIgBGAGwAYQBtAGUAbgBjAG8AIgBGAGwAYQBtAGUAbgBjAG8AUgBlAGcAdQBsAGEAcgAxAC4AMAAwADMAOwBVAEsAVwBOADsARgBsAGEAbQBlAG4AYwBvAC0AUgBlAGcAdQBsAGEAcgBGAGwAYQBtAGUAbgBjAG8AIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMARgBsAGEAbQBlAG4AYwBvAC0AUgBlAGcAdQBsAGEAcgBGAGwAYQBtAGUAbgBjAG8AIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABMAGEAdABpAG4AbwBUAHkAcABlACAATABpAG0AaQB0AGEAZABhAEwAdQBjAGkAYQBuAG8AIABWAGUAcgBnAGEAcgBhAHcAdwB3AC4AbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAg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//IAP//bAED/6QBg/98Acv/2AAYABf+OAAr/swAM/+0AP//jAED/6ABg/+MABQAF/4kACv+zAD//3ABy/90Aef/wABAABf+DAAr/swAO/+IAEP/bABb/7gAY//QAGf/2ABr/4AAc//YAIP/uAD//yQBA//IAYP/vAHL/xwB5/9IA4gANAAYABf+RAAr/swAO/+wAEP/pAD//5QBy/+8ABQAM/+0AP//oAED/6wBg//AAcv/YAAoABf+cAAr/swAM/+kAEf/nABL/9gAX/+0AP//yAED/6wBg/+wA4v/2AAgABf+IAAr/swAM//EAP//cAED/9gBg//EAcv/dAHn/7gAEAAr/9QA3/9AAOf/4ADz/5gAGAAr/wwA3/+0AOf/zADr/9QA8/+UA1v/IABYACv+6AA3/1QASABAAIv/vACb/+gAy//kANP/5ADf/yQA4//gAOf/dADr/4QA8/8sAP//bAEn/+ABX//UAWf/sAFr/8QBc/+wAYP/sANX/vQDW/74A5P/hABAACv/3AAz/8gA3//YAOf/6ADr/+wA7//QAPP/vAED/8ABJ//IAV//zAFn/9ABa//cAW//2AFz/9ABd//oAYP/qAAUASf/3AFf/+ABZ/+kAWv/uAFz/6AAVAAr/2QAM/+4AEf/uABL/9QAk//YAN//2ADn/+AA6//oAO//pADz/6gA9//sAQP/uAET/+gBF//sASv/6AEv/+wBW//sAYP/sAIj/8wDV/94A1v/gAAcAR//1AEn/+gBS//QAV//6AFn/9ABa//UAXP/0ABEAEf/BABL/3gAk/9sARP/hAEf/5QBJ//kASv/iAFL/5QBW/+QAV//5AFn/9ABa//IAW//tAFz/8wBd/+oAiP/TAOD/9AAJAAr/9AA8//cASf/3AFf/9wBZ//cAWv/5AFz/9wBg//UA1f/4AAgAPP/7AEf/+gBJ//oAUv/4AFf/+ABZ//AAWv/zAFz/8AAHAEf/9gBJ//UAUv/0AFf/8wBZ/+sAWv/vAFz/6gAOAA0ADgBE//IAR//0AEn/9ABK//UAUf/5AFL/8gBW/+8AV//tAFn/6ABa/+wAW//uAFz/5wBd/+wAEQAMAAoADQAOABD/9AAiAAgAJv/pADL/6QA0/+kARP/7AEf/7gBJ//YAUf/wAFL/7gBX/+4AWP/tAFn/zwBa/9UAXP/OABgACv+zAA3/rwAi/+kAJv/4ADL/9wA0//cAN/+gADj/+AA5/7YAOv+5ADz/qQA//9MAQP/yAEn/9ABX//MAWf/UAFr/5QBc/9MAYP/qAHn/rwCIAAsA1f+1ANb/tQDk/7EADQBE//EAR//zAEn/9ABK//UAUf/4AFL/8QBW/+8AV//sAFn/5wBa/+oAW//uAFz/5wBd/+wAFQAK/9gADP/uABH/7QAS//UAJP/2ADf/9gA5//kAOv/6ADv/6gA8/+oAPf/7AED/7QBE//oARf/7AEr/+gBL//sAVv/7AGD/7ACI//MA1f/dANb/3gAOAAr/9QAR/7kAEv/bACT/2wA7//EAPP/5AET/9QBH/+0ASv/uAFL/7ABW//UAYP/wAIj/zADg//QAEQAK/9kAEf/uACT/9wA3//UAOf/5ADr/+gA7/+sAPP/qAD3/+wBE//oARf/7AEr/+gBL//sAVv/7AIj/9wDV/94A1v/fABUACv/uADf/+wA8//MARP/3AEX/+QBH/+0ASf/6AEr/+ABL//kAT//5AFL/7ABW//gAV//5AFn/+ABa//gAXP/4AF3/+wBg/+sA1f/zANb/9QDg//IACwAK//gAPP/3AEn/8QBK//sAV//1AFn/8gBa//QAW//3AFz/8QBd//kAYP/zACQACf/2AA0ABgAQ/8EAEf++ABL/xQAd/9AAI//pACT/yAAm//cAMv/2ADT/9gBE/38AR/9vAEn/6QBK/3QATP/vAFH/tQBS/2wAVv93AFf/5QBY/7gAWf+kAFr/pwBb/6kAXP+kAF3/nwCI/74Apf+3AKb/lwCt/4sAsf/2ALf/nwC4/4MAx/+EAOD/vADh/8QABwBE//cAR//5AEr/9ABS//kAVv/4AFv/+gBd//kAHQANAAYAEP/lABH/xgAS/9AAHf/4ACP/7wAk/9sAJv/5ADL/+AA0//gAPwAJAET/xABH/8cASf/1AEr/yQBR/+wAUv/FAFb/wQBX/+0AWP/wAFn/3ABa/9wAW//dAFz/3ABd/9IAiP/JAOD/3gDh/+0A5AAJABsADQAJABD/6QAR/8wAEv/XACP/8gAk/98AJv/6ADL/+gA0//oARP/LAEf/zQBJ//YASv/RAFH/8QBS/8wAVv/IAFf/8ABY//YAWf/jAFr/4ABb/+MAXP/iAF3/3ACI/84A4P/iAOH/8ADkAAUADgANAAkAEP/3ACb/6gAy/+oANP/qAEf/9gBJ//MAUf/3AFL/9ABX/+sAWP/7AFn/2ABa/+MAXP/XACQACf/wAAwACgANABQAEP/KABH/wAAS/8YAHf/mACP/4QAk/8gAJv/rADL/6gA0/+oANv/3AD8ACgBE/6kAR/+VAEn/6wBK/5kATP/1AFH/xgBS/5MAVv+lAFf/2QBY/8sAWf+6AFr/tgBb/7AAXP+5AF3/qgBgAAYAcP/wAIj/tQCv/+cA4P/HAOH/2QDkAAsADwAy//sANP/7AEX/+wBH//sASf/rAEv/+wBM//sAT//7AFH/9wBS//sAV//uAFj/+QBZ/+AAWv/mAFz/3wAXABP/5gAU/+kAFf/qABf/5gAa/+0AHP/nACT/9AAm/+4AMv/tADT/7AA5AAgAOgAHAET/5gBH/+UAUv/kAFb/5wBX//EAWf/oAFr/6ABb/+wAXP/uAF3/6ACI//YACwAK/7oAFv/0ADf/0wA5/9sAOv/fADz/zwBZ/+8AWv/0AFz/7wCIABAA1v+9AAoAEgAIADf/egA4//kAOf/AADr/zAA8/5wAP//nAFn/+QBc//gAYP/1ABsACv/zAAz/5gAN//YAIv/sACv/8wAs//UALf/0ADb/+wA3/28AOP/uADn/xwA6/80AO//0ADz/lwA9//QAP//fAED/5QBJ//oAV//6AFn/9gBa//YAW//7AFz/9QBg/+YAoP/2ANX/8wDW//MAEgAK//AADP/sACL/9gAr/+4ALf/uADf/gwA4/+4AOf/JADr/0wA8/58AP//nAED/6gBZ//kAWv/6AFz/+QBg/+YA1f/xANb/8QAOABD/9wAm//UAK//3AC3/9wAy//UANP/1ADf/uAA4//EAOf/oADr/6QA8/94AWf/yAFr/9QBc//EAFgAK/+0ADP/pACL/8AAr/+wALf/sADf/dQA4/+wAOf+7ADr/xgA8/6AAPf/5AD//4QBA/+YASf/8AFf//ABZ//cAWv/3AFz/9gBg/+UAoP/7ANX/7gDW/+4AGwAKAAsADAAaAA0ADQAQ/9YAEf/TABL/5QAk/9MAKwAWACwAEQAtABYANwAZADgAHQA5ACkAOgAnADsAFgA8ACgAPQAKAD8AEgBAABAAR//3AEr/+gBS//QAYAAdAIj/zwDVAAkA4P/kAOQAFgALAAr/9wAMAAsAK//5AC3/+AA8//MAQAAFAEoAEQBNAAcAYAAFANX/9wDW//gACAAm//sAMv/7ADT/+wA2//sAN//6AD3/+wBg//QAoP/7AA8AJv/4ACv/9AAt//QAMv/4ADT/+AA3/4AAOP/zADn/wQA6/8sAPP+sAD//6ABA//UAR//1AFL/9ABg/+8AEQAQ//UAJv/0ACv/9QAt//UAMv/zADT/8wA3/7YAOP/wADn/5wA6/+cAPP/dAFf//ABZ//AAWv/0AFz/7wB5/+QA4P/2AA8AJv/6ACv/+QAt//kAMv/6ADT/+gA3/3UAOP/yADn/ugA6/8YAPP+WAD//4ABZ//MAWv/3AFz/8gBg/+4AGgAK/+wADP/lACL/7QAr//EALP/0AC3/8wA2//sAN/9sADj/7QA5/8UAOv/MADv/9AA8/5QAPf/zAD//3wBA/+QASf/5AFf/+QBZ//UAWv/2AFv/+gBc//UAYP/lAKD/9gDV/+0A1v/tABAACv/vACL/9QAm//oAMv/6ADT/+gA2//oAN/+VADj/+AA5/9AAOv/YADz/sgA9//YAP//pAKD/+gDV//AA1v/wABcACv/wAAz/5QAR/8sAEv/uACT/3wAr/+wALP/rAC3/7AA2/+0AN/+oADj/8wA5/9cAOv/dADv/zQA8/7IAPf/dAD//8ABA/+YAYP/pAIj/1ACg//sA1f/xANb/8QAUAAr/7gAM/+kAIv/0ACv/8QAt//IAN/+EADj/7AA5/8YAOv/QADz/rQA9//oAP//lAED/5wBZ//gAWv/4AFz/+ABg/+QAoP/5ANX/7wDW/+8ACwAK//IAN/+aADj/9gA5/9YAOv/dADz/tAA///AAQP/wAGD/6wDV//UA1v/1ABAAJv/4ACv/9gAt//YAMv/4ADT/+AA3/3oAOP/xADn/xAA6/88APP+gAD//4wBA//QAWf/0AFr/+ABc//QAYP/qAB0ACv/wAAz/5wAQ//QAEf/gABL/6gAk/+gAK//oACz/6wAt/+cANv/1ADf/pAA4/+4AOf/cADr/4gA7/9kAPP+6AD3/4QA//+4AQP/oAET/9wBH//UASv/2AFL/9QBW//cAYP/pAIj/4gDV//EA1v/xAOD/8AAeAAr/8AAM/+YAEP/2ABH/6AAS//AAJP/tACv/6wAs/+8ALf/sADb/9gA3/6gAOP/tADn/3AA6/98AO//jADz/tgA9/+MAP//tAED/6ABE//gAR//3AEr/9wBS//YAVv/4AGD/6QCI/+gAoP/7ANX/8QDW//EA4P/zABIACv/xAAz/8QAQ/+4AK//uAC3/7gA3/6kAOP/tADn/3QA6/+MAPP+wAD//7wBA/+wAR//7AFL/+gBg/+YA1f/yANb/8gDg/+4AHQAK//AADP/oABD/9AAR/98AEv/qACT/6AAr/+YALP/qAC3/5gA2//QAN/+kADj/7QA5/9wAOv/hADv/1gA8/7kAPf/hAD//7gBA/+kARP/3AEf/9QBK//UAUv/0AFb/9wBg/+oAiP/hANX/8QDW//EA4P/vABUACv/vAAz/7gAQ//QAJv/7ACv/7AAt/+wAMv/7ADT/+wA3/5wAOP/sADn/zgA6/9gAPP+pAD//6QBA/+kAWf/4AFr/+ABc//gAYP/jANX/8ADW//AAGAAL//IAE//lABT/5AAV/+QAF//cABn/9gAa/+0AHP/oACT/6gAm/+wAMv/sADT/6wA2/+8ARP/jAEf/5gBS/+UAVv/jAFf/7ABZ/+kAWv/pAFv/5gBc/+8AXf/lAIj/7AABABb/9gADAAr/3QA8/+8A1v/iAAUAE//2ABb/5AAX/8IAGP/sABz/4gADABf/ywAc//IAT//qAAUAN//nADn/7gA6/+8APP/mAIgACQAQAAr/wwAM/+0AEf/TABL/7gAk//IAN//1ADn/+AA6//oAO//YADz/5gA9//kAQP/tAGD/7gCI/+sA1f/IANb/ywAaAAz/7gAi/+wAJv/2ACv/6wAt/+sAMv/2ADT/9gA3/6gAOP/rADn/vQA6/8MAPP+mAD3/+QA//+0AQP/sAEn/7wBM//kAUf/5AFf/8ABY//wAWf/pAFr/7gBb//sAXP/oAGD/7QCg//QAAQANAAcAEAAM//UAJP/2ACv/9gAs//cALf/3ADb/+gA3//UAOP/7ADn/9gA6//cAO//zADz/7AA9//YAYP/zAIj/+ACg//cAFQAR/6kAJP/SACb/3AAy/9sANP/bADb/8QBE/+4ARQAJAEf/9gBK/+0ASwAJAFL/7QBW/+4AV//2AFn/8ABa//AAW//yAFz/8QBd//AAiP+2AKEAAQAaAAn/4gAQ/6gAEf+oABL/qAAd//YAI/++ACT/zwAm/9cAMv/WADT/1gA2/+0ARP/tAEf/9wBK/+sAUv/rAFb/7QBX//YAWf/wAFr/7wBb//EAXP/wAF3/7wBw/9sAiP+0AOD/qADh/6gAAQAF/50AAgAP/50AEf+fAAEABf+DAAcABf+XAAr/swA3/8QAOf/sADr/7wA8/9gA1v+oAA4ABf+HAAr/swA3/7wAOf/eADr/4gA8/8cASf/wAFf/8ABZ//AAWv/zAFv/7gBc/+8AXf/2ANb/qAAIABP/3gAU/+QAFf/lABb/3gAX/8AAGP/eABr/7QAc/94ADQAk/9kAKwAFAC0ABQAy//gANP/4ADcADAA4ABAAOQAlADoAIwA7ABMAPAAlAIj/wADWAAsAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
