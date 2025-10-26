(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.signika_negative_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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E6cT2xQTFCUUXRR0FJkUwxTnFRUVfhXlFlsWkxbSFxEXWReyGAgYThicGOYZJRlkGasaARofGj0aYxqXGtUbLhtrG6gb7RxDHJYcyR0NHT0dbR2lHeseHh5GHpAemx7eHuke9B9OH5wf6yAwIDsgbyB6IMUg8CEaIUohiyHQIiAiKyJeImkitiLBIvcjNyNCI3wjhyPXI+IkESRpJKsk9CUuJTkleiWyJfgmNiZ+JrwnAicNJ04niifBKAUoJChPKLIo5ikgKXApvyn6KioqVyqIKrcq9ysCK0krhivTLBssYCxrLLcs7i06LUUtgS3ALgMuSC58LrYu8S78L0YvhC+PL9IwFDBZMGQwjTClML0w1TDyMR4xUjGcMa8xwjHlMggyKTJnMqYy4TL4MxMzLTNDM3gzugAAAAEAAAABAIMaVDh/Xw889QALA+gAAAAAyxBRWwAAAADVMhAk/4H+/AO6A4MAAAAIAAIAAAAAAAAAugAAAAAAAAFNAAAAugAAANwAAAEdAE8BfgAwAn0AGAHyACIDgQAwAmoAMwDPACwBRgA/AUYADwH2AC0CEgA1AQoAIgFbAC8BBAA+AaMACAISADACEgA+AhIAOAISADICEgApAhIAOgISADQCEgA+AhIALgISAC4BCQBBAQ0AIQISADACEgA1AhIAPAGJAAwDsQA0AmAAFQJcAFwCWwAzAoYAXAI1AFwCCABcAoIAMwKhAFwBJABgAb4ACgJSAFwB/wBcAyQATAKmAFwCkQAzAjUAXAKKADMCVwBcAiwAIAHqAA4CnABUAjsAFgNMACACSAATAfIACgIwADEBUQBjAaMACwFRAB8CEgAuAg3//AGOAEEB+gAtAg8AUAHXAC4CEQAuAfUALgFLAAwCDwAuAiAAUAEMACMBEwAcAfMAUAEjAE8DHABQAiIAUAIIAC4CEQBQAhAALgFtADUBtQAgAVwAFgIjADwBxQAHAs4AGQHKABAB0AAFAb4AJAFUACYA/gBRAVQACAJEACkBHQBRAdUALAIQADUCPQAhAgAAGQD4AE8B5AAgAY4ANQMkACkBpAAoAicAIwISADABWwAvAlAAIwGOADgBRAASAhIAPwGkADkBpAA1AY4AfgKVACwBLgBXAY4AcwGkAD8BlwAjAicAJQOkACUDpAAlA6QANAGJAAsCYAAVAmAAFQJgABUCYAAV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ACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/gwAyAAAAAAAAAAAAAAAAAAAAAAAAAAABDgAAAAEAAgECAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMA8gDzAI0AiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQQBBQD9AP4A/wEAAQYBBwEIAQkBCgELAQwBDQEOAQ8A1wEQAREBEgETARQBFQEWARcBGADiAOMBGQEaARsBHACwALEBHQEeAR8BIAEhASIBIwEkAOQA5QElASYBJwEoALsBKQEqASsBLADmAOcBLQDYAOEA3ADdANkAlwEuALIAswC2ALcAxAC0ALUAxQCHAL4AvwC8AS8BMAJDUgd1bmkwMEFEB0FvZ29uZWsHYW9nb25lawZEY2Fyb24GZGNhcm9uB0VvZ29uZWsHZW9nb25lawZFY2Fyb24GZWNhcm9uBEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DEtjb21tYWFjY2VudAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljBExkb3QEbGRvdAZOYWN1dGUGbmFjdXRlBk5jYXJvbgZuY2Fyb24GUmFjdXRlBnJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQZUY2Fyb24GdGNhcm9uBVVyaW5nBXVyaW5nBlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50CGRvdGxlc3NqDmdlcm1hbmRibHMuY2FwDGZvdXJzdXBlcmlvcgRFdXJvAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEBDQABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABAKQABAAAAE0BQgF4AYYBpAHKAewCQgJUAo4C+ANGA4wD2gQcBIIEnATaBSgFTgWgBgoGLAZ2BpgHXgecCB4IlAjqCYQJygnYCgoKNApCClgKZgp4Cu4K+AsKCyQLWguYDggLwgvIDBIMHAxGDFAMhgy4DPINKA1CDVANXg2QDaIPZA3kDfYOCA4WDiwOrg7EDuIO6A7uD1gPXg9kD4YPpA+yAAEATQAKAAwADgAQABEAEwAeACQAJQAmACcAKAApACoAKwAvADAAMQAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAARQBGAEcASABJAEoASwBMAE0ATwBQAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AbQB8AJkAnwCgALEAuQC/AMEAyADbANwA6gDsAO4A8wD3AP8BAgEDAQQADQAl//kAJwADAC7/9wA3//kAOP/kADr/8gA8/+0APf/vAEoACQBYAAwAWgADAFsAAwBdAAMAAwBOAA0AXQARANUADQAHACX/vwAu/70AOAAXADoABgA7AAMAPQAGAIf/uwAJACf/6wA4/6oAOf/oADr/pQA7/8AAPf+bAFr/ygBb/9QAXf/iAAgALv/sADj/ygA6/94APP/jAD3/1QA+/+8AXP/yAF7/8gAVACX/tQAn/+UALv+mADH/7gA4AA0ARf/CAEf/yQBI/8EAUf/QAFb/0QBX/8kAWf/KAFz/1gBd/+wAXv/DAIf/nACn/8IAsf/WAOj/5QDs/9UA9//KAAQAOP/YADr/5QA7/+cAPf/YAA4ALv/sADH//gA3//UAOP/UADr/5wA7//IAPP/sAD3/3AA+//UARf/6AFf/+wBb//YAXP/wAF7/8wAaAA7/vwAn//MALgAUADj/xAA5/+0AOv/NADv/5gA9/8wAQP+1AEf/9wBI//oASv/wAFD/9gBY/+8AWf/2AFr/6QBb//AAXf/wAJn/9wCg//kAsf/6ALn//wDc//IA///5AQL/vgED/8MAEwAu//wAMf/6ADj/6wA6//IAO//4ADz/8gA9/+cAQP/iAEr/5wBW//AAWP/pAFr/8gBb//kAXP/yAF3/8gBe//QAh//+AKD/8wD///MAEQAKAAEADgAGACf/+QA3AAUAOgALAEX/+QBH//kASP/3AEoABwBWAAEAWf/7AG3/8gCZAAEAoAARAKf/+QC5//wA/wARABMAEP/lABP/5wAl//IALv/sADH//AA4/+wAOv/6ADz/7AA9//MAPv/uAED/5wBF//cAXP/3AF7/8wBtAAMAh//fAKAAAwCn//cA/wADABAAJ//6AEX/+QBH//UASP/1AFj/9wBZ//QAWv/xAFv/8QBd//IAbf/5AJn/+wCg//kAp//5ALH/9wC5//sA///5ABkACv/0AA4AEQAQ/58AE/+5ACT/6QAl/8MAJ//9AC7/rABF/98AR//kAEj/5ABR/+QAVv/pAFf/4ABY//MAWf/mAFr/8QBb/+4AXP/mAF3/7wBe/98Ah/+bAKf/3wCx//IA9//kAAYAOv/0AD3/+QBa//cAXf/3AKAABQD/AAUADwAR//IAJ//3ADn/+gBH/+8ASP/wAFj/6QBZ/+0AWv/eAFv/4gBd/+QAbf/nAKD/9gCx//cAuf/3AP//9gATAA7/nAAR/8EAJ//uADj/nAA5/+0AOv+tADv/0gA9/6cAQP+HAEf/7wBI//UAWP/jAFn/8QBa/9AAW//fAF3/2QBt/9wBAv+aAQP/pAAJADj/8AA5//wAOv/pADv/9wA9/+UAQP/uAG3/+QCg//cA///3ABQAEP/hABP/5QAl//MALv/oADj/4wA6//MAO//8ADz/6gA9/+0APv/rAED/5QBF//EAXP/zAF7/8ABtAAMAh//qAKAAAwCn//EA/wADAQT/4gAaAAr/8AAQ/3sAE/+qACT/6QAl/8MALv+rADH/7wA8/+UAPf/8AD7/5QBF/+oAR//kAEj/5wBKAAcAUf/zAFb/8ABX/+0AWAADAFn/8wBaAAYAWwABAG3/9QCH/6oAoAAKAKf/6gD/AAoACAAl//kAPP/yAD7/8gBOAAMAXP/8AF0AAgBe//IA1QAJABIAEf/xACf/8QA4//MAOf/yADr/7wA7//YAPf/oAED/5wBF//cAR//sAEj/8QBZ/+gAbf/nAJn/+wCgAAsAp//3ALn/9gD/AAsACAA8//wAPf/5AFr/6wBb/+4AXP/wAF3/6wBe//kAbQAKADEACv/yAA4AFwAQ/6oAEf/KABP/tgAe/9gAIwAaACT/vAAl/8IAJ//jAC7/tQAx/+4AOAAdAEAADQBF/7YAR/+tAEj/uQBK//sAUf+6AFb/zwBX/7QAWf+uAFr/ugBb/7sAXP/AAF3/uQBe/8EAbf/HAHz/zgCH/78AoP/vAKH/ygCj/7kApP/aAKX/2gCm/9MAp/+2AKn/wgCr/8EArP/MALH/zQCz/8IAtf/BALb/zQC3/8wAxv/BAMz/wQDo//IA///vAA8AEP/nABP/4wAl/+0ALv/uADH//AA8//IAPv/vAEX/5QBX/+UAXP/iAF7/5gCH/+wAoP/7AKf/5QD///sAIAAK/+gADgAGABD/pQAR/94AE/++AB7/5QAjAAYAJP/RACX/zQAn//QALv+6ADH/6ABF/9QAR//NAEj/zgBR/98AVv/oAFf/2wBY//YAWf/gAFr//QBb/+gAXP/jAF3/7ABe/+IAbf/gAHz/6ACH/8oAoP/uAKf/1ACx/9cA///uAB0ACv/oAA4AAwAQ/8AAE//UAB7/5wAjAAYAJP/lACX/5AAn//gALv/HADH/9wA3//IARf/ZAEf/0QBI/9MAVv/vAFf/0wBZ/9sAXP/eAF3//QBe/9wAbf/oAIf/3QCg//wAp//ZALH/2wDo//EA9//mAP///AAVAAr/+AAR/+MAJP/6ACf/6gA5//wARf/1AEf/5QBI/+YAVv/3AFj/8QBZ/+kAWv/fAFv/4ABd/+EAbf/bAJn/9ACg//MAp//1ALH/7QC5//kA///zACYACv/tAA4ABgAQ/5sAEf/VABP/wgAe/9gAIwAJACT/0AAl/8wAJ//vAC7/swAx/+UAN//vAEX/zwBH/8QASP/JAEr/+QBR/9UAVv/hAFf/ygBY//YAWf/XAFr/6gBb/+MAXP/fAF3/6gBe/98Abf/HAHz/0gCH/7UAoP/1AKf/7wCs/8gAsf/RALb/ygC3/8gA9//pAP//9QARABH/3gAn/+kARf/vAEf/4QBI/+UAVv/wAFn/5ABa/+AAW//bAF3/4QBt/+UAmf/6AKD/9gCn/+8Asf/rALn/7gD///YAAwBOAA0AXQANANUADQAMACf/5QA4/7YAOf/jADr/ugA7/9QAPf/CAFb/9QBY/+MAWf/sAFr/6ABb//IAmf/5AAoAQP/HAEf/8gBI//cAWP/1AFr/8QBb//QAXf/zALH/+QC5//cBA//5AAMAQP/RAFz/6wBe/+4ABQBA/90AR//6AE0ACgBc//oAuf/7AAMATf/8ALAABgDQAAsABABA/84AWv/0AFv/8wBd//MAHQAFABcACgAQAA0ALAAOADwAEP/gABP/5wAjAC4AJP/3AEAAPwBBABwAR//2AEj/+QBNACwAVgARAFoAJwBbAB4AXAASAF0AHABhACwAbf/rAK0AQwCvADIAsABDALEADADQAEgA1QA0AOgAGwECAEYBAwBOAAIAQP/OAE3//AAEAED/vwBa//IAW//wAF3/7wAGAEr/+wBY//sAWv/2AFv/9QBc//kAXf/2AA0ACv/1ABH/6AAk//YAQP/AAEf/7ABI//MATf/6AFD/8ABZ/+8Abf/uALH/8QC5//cA3P/wAA8AEf/2AED/5wBH//YASP/6AFD/9QBY/+8AWf/1AFr/9wBb//kAXAAGAF3/9ACx//8AuQADAQL/7gED//oACgBA/8wASv/5AFj/9gBa//YAW//1AFz/7QBd//AAXv/vAQL/6AED//kAAQBA/9gAEgAK//wAEP++ABP/zQAk//MARf/5AEf/7ABI//cASgAdAE0AEQBYABMAWgAdAFsAFQBcAAgAXQAYAF4ACACn//kAsf/5AQIAFAACAED/zgBNAAEACgBA/+cAR//3AEoAEQBNAA4AWgAIAFsABgBcABAAXQADAF4ABAC5//kAAgBA/9IATf/8AA0ACv/3ABD/ygAT/+gAJP/3AEX//wBH//EASP/5AEoAEABNAAcAWAANAFwABwCn//8Asf/zAAwACv/8ABD/1AAT//IAJP/wAEX/9QBH//IASgAMAE0ADABYAAwAXAAHAKf/9QCx//MADgAK//cAEf/yACT/8wBA/9YARf/5AEf/7ABI/+8ASgAGAE0AAwBaAAcAWwAHAG3/7wCn//kAsf/xAA0ACv/2ABD/yQAT/+IAJP/wAED/7ABF//QAR//0AEj/+QBKAA0ATQAJAFgACQCn//MAsf/yAAYAEf/xAED/xwBH//EASP/7AG3/9QCx//oAAwBOAA0AXQAUANUADQADADj/zgA6/+gAPf/SAAwAJwADAC7/7wAx//kAN//yADj/xwA6/+AAO//oADz/2wA9/8cAPv/wAFz/3QBe//cABAA4/+oAOv/1AD7/8gBA//IAEAAl/9kALv+/ADH/7AA3//AAOP/PADr/5QA8/9kAPf/eAD7/2wBF/+4AR//1AEj/9wBX//YAXP/vAF7/7QCn/+4ABABA/+UAWv/6AFv/+QBc//AABABb//kAXP/0AF3/9wBe//gAAwBA/9QAWv/6AFz/8gAFAA0AHgAQACQAQQAJAGEAIQEEACQAIABF/9UAR//UAEj/zgBK/+0AUf/MAFb/zgBX/84AWP/jAFn/yQBa/9MAW//TAFz/zgBd/8kAXv/OAKT/4ACl/+AApv/dAKv/1wCs/90Asv/OALX/1wC2/90At//dALr/zgC9/9EAwP/gAMb/2gDM/9oA6P/pAOz/3wDw/8wA9//dAAUADv/RADj/swA5//MAOv++AD3/wQAHAED/7ABNAA8AWAAGAFoAEwBbAA0AXAASAF0AEAABAED/1AABAED/4gAaACT/9QBAAA8ARf/2AEf/8QBI//QASgAJAE0AAQBR//gAU//rAFb/9QBX//YAWf/2AFr//wBb//wAXAAGAF3/+QBe//kArQANAK8ADQCwABYAsf/2ALn/9gDQACsA1QAMAOj/+wDs//kAAQBA/8wAAQBA/9wACAAn//0AMf/0ADj/5QA6/90AO//pADz/9QA9/9kAPv/wAAcAJf/DAC7/uwBH/9oASP/jAFH/6ABX/+gAh/+cAAMAJf+lAEf/4wBX/9UABgAn//QAOP+6ADr/xAA7/+EAPf/EAFr/4gAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
