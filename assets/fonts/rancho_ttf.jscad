(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rancho_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHv/9gA+AHz/9gA+AH3/9gA+AH7/9gA+AH//9gA+AID/9gA+AIH/9gA+AIL/7AA+AIP/7AA+AIT/7AA+AIX/7AA+AIr/9gA+AIv/7AA+AIz/7AA+AI3/7AA+AI7/7AA+AI//7AA+AKX/9gA+ALL/7AA+ALr/9gA/ADb/9gA/AET/9gA/AFj/9gA/AFr/9gA/AGf/9gA/AHT/9gA/AHX/9gA/AHn/9gA/AIH/9gA/AIL/9gA/AIP/9gA/AIT/9gA/AIX/9gA/AJ//9gA/AK7/9gA/AK//9gA/ALD/9gA/ALH/9gA/AMb/9gA/AMj/9gA/AM//9gA/AND/9gA/ANH/9gBAACL/4QBAAET/9gBAAEb/9gBAAFj/9gBAAFn/9gBAAFr/9gBAAFv/7ABAAFz/9gBAAGL/7ABAAGP/7ABAAGT/7ABAAGb/9gBAAGf/7ABAAGj/7ABAAGr/9gBAAGv/4QBAAGz/4QBAAG7/9gBAAHn/9gBAAIH/9gBAAIL/9gBAAIP/9gBAAIT/9gBAAIX/9gBAAIr/7ABAAIv/7ABAAIz/7ABAAI3/7ABAAI7/7ABAAI//7ABAAJD/9gBAAJH/9gBAAJL/9gBAAJP/9gBAALD/9gBAALH/9gBAALL/7ABAALr/9gBAAM//9gBAAND/9gBAANH/9gBBACL/zQBCAE7/9gBCALv/9gBEADb/9gBEADn/9gBEAHT/9gBEAHX/9gBEAJ//9gBEAK7/9gBEAK//9gBEAMb/9gBEAMj/9gBFACH/4QBFACP/4QBFADb/9gBFAD//7ABFAHT/9gBFAHX/9gBFAJ//9gBFAK7/9gBFAK//9gBFAMb/9gBFAMj/9gBHAGT/9gBHAGb/9gBHAGj/9gBHAIv/9gBHAIz/9gBHAI3/9gBHAI7/9gBHAI//9gBHALL/9gBIAEz/9gBIAE7/9gBIALv/9gBJADb/7ABJAFb/1wBJAFj/4QBJAFn/7ABJAFr/4QBJAFv/7ABJAFz/4QBJAGL/4QBJAGP/4QBJAGT/1wBJAGX/4QBJAGb/1wBJAGf/5gBJAGj/1wBJAGr/4QBJAGv/4QBJAGz/4QBJAG3/4QBJAG7/7ABJAG//7ABJAHT/7ABJAHX/7ABJAHv/1wBJAHz/1wBJAH3/1wBJAH7/1wBJAH//1wBJAID/1wBJAIH/4QBJAIL/4QBJAIP/4QBJAIT/4QBJAIX/4QBJAIr/4QBJAIv/1wBJAIz/1wBJAI3/1wBJAI7/1wBJAI//1wBJAJD/4QBJAJH/4QBJAJL/4QBJAJP/4QBJAJ//7ABJAKX/1wBJAK7/7ABJAK//7ABJALL/1wBJALr/7ABJAMb/7ABJAMj/7ABKADb/9gBKADn/9gBKAHT/9gBKAHX/9gBKAJ//9gBKAK7/9gBKAK//9gBKAMb/9gBKAMj/9gBLACH/7ABLACP/7ABLADb/9gBLAFb/7ABLAFj/7ABLAFr/7ABLAFz/7ABLAGL/9gBLAGP/7ABLAGT/7ABLAGb/7ABLAGf/9gBLAGj/9gBLAG7/9gBLAHT/9gBLAHX/9gBLAHv/7ABLAHz/7ABLAH3/7ABLAH7/7ABLAH//7ABLAID/7ABLAIH/7ABLAIL/7ABLAIP/7ABLAIT/7ABLAIX/7ABLAIr/7ABLAIv/7ABLAIz/7ABLAI3/7ABLAI7/7ABLAI//7ABLAJ//9gBLAKX/7ABLAK7/9gBLAK//9gBLALL/7ABLALr/9gBLAMb/9gBLAMj/9gBMACH/4QBMACP/4QBMADb/7ABMAD//9gBMAFb/7ABMAFj/9gBMAFn/9gBMAFr/7ABMAFz/9gBMAGT/7ABMAGb/9gBMAGf/9gBMAGj/9gBMAG7/9gBMAHT/7ABMAHX/7ABMAHv/7ABMAHz/7ABMAH3/7ABMAH7/7ABMAH//7ABMAID/7ABMAIH/9gBMAIL/7ABMAIP/7ABMAIT/7ABMAIX/7ABMAIv/7ABMAIz/7ABMAI3/7ABMAI7/7ABMAI//7ABMAJ//7ABMAKX/7ABMAK7/7ABMAK//7ABMALL/7ABMALr/9gBMAMb/7ABMAMj/7ABNACL/4QBOADb/9gBOADn/9gBOAHT/9gBOAHX/9gBOAJ//9gBOAK7/9gBOAK//9gBOAMb/9gBOAMj/9gBXAG3/9gBXAG//9gBaAG3/9gBbAFb/7ABbAHv/7ABbAHz/7ABbAH3/7ABbAH7/7ABbAH//7ABbAID/7ABbAKX/7ABiAGv/9gBiAGz/9gBiAG//9gBjAGv/9gBjAGz/9gBkAG3/9gBkAG//9gBlAGz/9gBlAG3/9gBlAG//7ABrACH/4QBrACP/4QBrAFb/9gBrAHv/9gBrAHz/9gBrAH3/9gBrAH7/9gBrAH//9gBrAID/9gBrAKX/9gBsACH/4QBsACP/4QBsAFb/9gBsAHv/9gBsAHz/9gBsAH3/9gBsAH7/9gBsAH//9gBsAID/9gBsAKX/9gBtAFr/9gBtAGT/9gBtAGb/9gBtAIL/9gBtAIP/9gBtAIT/9gBtAIX/9gBtAIv/9gBtAIz/9gBtAI3/9gBtAI7/9gBtAI//9gBtALL/9gBvAGb/9gB0ADn/7AB0AET/9gB0AEn/7AB0AEr/9gB0AEv/9gB0AEz/7AB0AE7/7AB0AFv/7AB0AGv/9gB0AGz/9gB1ADn/7AB1AET/9gB1AEn/7AB1AEr/9gB1AEv/9gB1AEz/7AB1AE7/7AB1AFv/7AB1AGv/9gB1AGz/9gB3AET/9gB5ADb/9gB5ADn/9gCCAG3/9gCDAG3/9gCEAG3/9gCFAG3/9gCKAGv/9gCKAGz/9gCLAG3/9gCLAG//9gCMAG3/9gCMAG//9gCNAG3/9gCNAG//9gCOAG3/9gCOAG//9gCPAG3/9gCPAG//9gCfAET/9gClAG3/9gCuADn/7ACuAET/9gCuAEn/7ACuAEr/9gCuAEv/9gCuAEz/7ACuAE7/7ACuAFv/7ACuAGv/9gCuAGz/9gCvADn/7ACvAET/9gCvAEn/7ACvAEr/9gCvAEv/9gCvAEz/7ACvAE7/7ACvAFv/7ACvAGv/9gCvAGz/9gCwADb/9gCwADn/9gCxAET/9gCyAG3/9gC7ADb/9gC7ADn/9gDGADn/7ADGAET/9gDGAEn/7ADGAEr/9gDGAEv/9gDGAEz/7ADGAE7/7ADGAFv/7ADGAGv/9gDGAGz/9gDHAET/9gDIADn/7ADIAET/9gDIAEn/7ADIAEr/9gDIAEv/9gDIAEz/7ADIAE7/7ADIAFv/7ADIAGv/9gDIAGz/9gDJAET/9gDKAET/9gDLAFb/9gDLAFj/9gDLAFn/9gDLAFr/7ADLAFv/7ADLAFz/9gDLAGP/9gDLAGT/7ADLAGb/9gDLAGj/7ADLAGv/7ADLAGz/9gDLAG3/9gDLAG7/9gDLAG//9gDMAFb/9gDMAFj/9gDMAFn/9gDMAFr/7ADMAFv/7ADMAFz/9gDMAGP/9gDMAGT/7ADMAGb/9gDMAGj/7ADMAGv/7ADMAGz/9gDMAG3/9gDMAG7/9gDMAG//9gDNAFb/9gDNAFj/9gDNAFn/9gDNAFr/7ADNAFv/7ADNAFz/9gDNAGP/9gDNAGT/7ADNAGb/9gDNAGj/7ADNAGv/7ADNAGz/9gDNAG3/9gDNAG7/9gDNAG//9gDOAFb/9gDOAFj/9gDOAFn/9gDOAFr/7ADOAFv/7ADOAFz/9gDOAGP/9gDOAGT/7ADOAGb/9gDOAGj/7ADOAGv/7ADOAGz/9gDOAG3/9gDOAG7/9gDOAG//9gDPADb/9gDPADn/9gDQADb/9gDQADn/9gDRADb/9gDRADn/9gDSADb/9gDSADn/9gDTADb/9gDTADn/9gDUADb/9gDUADn/9gAAAA4ArgADAAEECQAAAHYAAAADAAEECQABAAwAdgADAAEECQACAA4AggADAAEECQADADIAkAADAAEECQAEABwAwgADAAEECQAFABoA3gADAAEECQAGABwA+AADAAEECQAHAFIBFAADAAEECQAIAB4BZgADAAEECQAJAB4BZgADAAEECQALADABhAADAAEECQAMADABhAADAAEECQANAFwBtAADAAEECQAOAFQCEABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEYAbwBuAHQAIABEAGkAbgBlAHIALAAgAEkAbgBjAC4AIABBAGwAbAAgAHIAaQBnAGgAdABzACAAcgBlAHMAZQByAHYAZQBkAC4AUgBhAG4AYwBoAG8AUgBlAGcAdQBsAGEAcgAxAC4AMAAwADEAOwBEAEkATgBSADsAUgBhAG4AYwBoAG8ALQBSAGUAZwB1AGwAYQByAFIAYQBuAGMAaABvACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAFIAYQBuAGMAaABvAC0AUgBlAGcAdQBsAGEAcgBSAGEAbgBjAGgAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEYAbwBuAHQAIABEAGkAbgBlAHIALAAgAEkAbgBjAC4ARgBvAG4AdAAgAEQAaQBuAGUAcgAsACAASQBuAGMAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGYAbwBuAHQAZABpAG4AZQByAC4AYwBvAG0ATABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABBAHAAYQBjAGgAZQAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAyAC4AMABoAHQAdABwADoALwAvAHcAdwB3AC4AYQBwAGEAYwBoAGUALgBvAHIAZwAvAGwAaQBjAGUAbgBzAGUAcwAvAEwASQBDAEUATgBTAEUALQAyAC4AMAAAAAIAAAAAAAD/swAzAAAAAAAAAAAAAAAAAAAAAAAAAAAA4wAAAOoA4gDjAOQA5QDrAOwA7QDuAOYA5wD0APUA8QD2APMA8gDoAO8A8AADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAYgBjAGQAZQBmAGcAaABpAGoAawBsAG0AbgBvAHAAcQByAHMAdAB1AHYAdwB4AHkAegB7AHwAfQB+AH8AgACBAIMAhACFAIYAhwCIAIkAigCLAI0AjgCQAJEAlgCXAJ0AngCgAKEAogCjAKQAqQCqAKsBAgCtAK4ArwCwALEAsgCzALQAtQC2ALcAuAC6ALsAvAEDAL4AvwDAAMEAwwDEAMUAxgDHAMgAyQDKAMsAzADNAM4AzwDQANEA0wDUANUA1gDXANgA2QDaANsA3ADdAN4A3wDgAOEBBAC9AOkHdW5pMDBBMARFdXJvCXNmdGh5cGhlbgAAAAADAAgAAgAQAAH//wAD","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
