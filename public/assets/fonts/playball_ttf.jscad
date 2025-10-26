(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.playball_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ABQAOP/OADkAKAA6/+wAPAAoABwAJv/iACcAoAAoABQAKQCqACoAlgArAIwALAAyAC0AbgAuAIIALwAoADAAWgAxALQAMgBuADMAZAA1AIIANwCCADkAqgA6AGQAOwCCADwAjAA9ABQAPgCMAD8AKABNAB4AUAAeAFIAKABTAB4AVQAeABsAJv+6ACcAtAApALQAKgCqACsAlgAsADIALQB4AC4AeAAvACgAMAB4ADEAoAAyAG4AMwBuADUAggA2//YANwCqADj/4gA5AKoAOgB4ADsAeAA8AKAAPQAUAD4AlgBL/8QAUgAKAFb/7ABc/+wAFwAm/7oAJwC0ACgAHgApALQAKgCWACsAggAtAGQALgCCAC8APAAwAIIAMQC0ADIAeAAzAGQANQCCADb/9gA3AKoAOP/OADkAggA6AHgAOwCWADwAoAA+AIIATwBaAB4AJv/OACcAtAApALQAKgC+ACsAggAtAG4ALgCWAC8AUAAwAG4AMQCgADIAggAzAHgANP/sADUAeAA2/84ANwCqADkAtAA6AFAAOwCgADwAtAA9ABQAPgCWAD8AMgBNADIAUAAeAFIAKABTACgAVQAoAFb/9gBX/8QAGAAm/7AAKP/YACv/9gAs/9gALf/OAC7/4gAv/9gAMP/YADEAFAAy/9gAM//YADT/zgA1/+wANv/OADj/2AA5/5IAOv+wADv/sAA8/9gAPf/YAD7/dABW/+IAV//OAF//2AAYACb/4gAnAJYAKAAoACkAqgAqAKAAKwCWACwAHgAtAHgALgB4AC8ARgAwAHgAMQCqADIAggAzAGQANAAeADUAggA3AIwAOQCWADoAeAA7AIIAPACMAD0AKAA+AIIAPwAeABwAJv/OACcAqgAoACgAKQDIACoAqgArAKAALAA8AC0AjAAuAJYALwBaADAAjAAxAL4AMgCCADMAlgA0ACgANQCqADcAqgA5AL4AOgB4ADsAlgA8AKoAPQAoAD4AyABHADIATQAyAE4AHgBRABQAUwAyABUAJv90ACcAUAApAGQAKgBQACsAPAAtAB4ALgA8ADAAKAAxAFoAMgAoADMAKAA1AEYANwBQADj/zgA5AFoAOgAoADsAPAA8AFAAPf/YAD4AZABXAAoAJwAm/+IAJwDIACgAUAApANIAKgDcACsAvgAsAFAALQCgAC4AyAAvAHgAMACWADEA3AAyAJYAMwCqADQARgA1AL4ANgA8ADcAvgA5AMgAOgCgADsAqgA8ALQAPQAoAD4AyAA/AAoARv/2AEcAMgBI/+IASf/2AEz/4gBNADIAUAA8AFEAMgBXAEYAWP/sAFkAPABa//YAXP/sAF7/7AAWACb/sAAnAGQAKAAyACkAeAAqAGQAKwBaACwAMgAtADIALgBGADAAMgAxAG4AMgAoADMAPAA0ABQANQBaADcAZAA4/9gAOQB4ADoAUAA7AEYAPAB4AD4AggAiACb/fgAnAFAAKQA8ACoARgArADIALQAUAC4AKAAv//YAMAAeADEAPAAzABQANP/OADUAMgA2/8QANwA8ADj/zgA5AEYAOwAoADwAPAA9/7oAPgA8AEb/2ABH/+IASP/OAEr/zgBM/+IATf/iAFT/2ABW/+wAV//EAFv/2ABd/+wAXv/sAF//7AAXACb/2AAnAIIAKAAUACkAeAAqAIIAKwBaAC0AMgAuAFAALwAeADAAUAAxAIwAMgBGADMARgA0ABQANQBkADcAZAA5AHgAOgBGADsAWgA8AG4APgBkAFIAKABTAB4AIwAmAGQAJwFAACgAUAApASwAKgFKACsBDgAsAIIALQEEAC4BIgAvAMgAMAEOADEBLAAyAQ4AMwEYADQAeAA1ASwANgBQADcBIgA4AGQAOQFKADoBBAA7ASIAPAFAAD0AyAA+ATYAPwCWAEcAbgBNADwAUAA8AFEAPABX/9gAWP/iAFn/9gBa//YAXP/sABoAJv/iACcAoAAoAB4AKQCWACoAlgArAIwALAAUAC0AZAAuAHgALwAoADAAeAAxAKoAMgBkADMAZAA0AB4ANQCMADcAlgA5AKoAOgBaADsAggA8AIwAPgCWAD8AFABI/+IATQAeAFAAFAAaACb/4gAnANIAKAAoACkA0gAqAMgAKwC0ACwAPAAtAJYALgCqAC8AUAAwAJYAMQDIADIAjAAzAJYANQCqADcAqgA5AMgAOgCMADsAqgA8AL4APQA8AD4AqgBHABQATP/iAFT/4gBa/9gAFwAm/5wAJwB4ACgAPAApAJYAKgCCACsAggAsACgALQBuAC4AbgAvACgAMABaADEAlgAyAFoAMwBkADQAKAA1AIIANwB4ADkAjAA6AFAAOwBkADwAjAA+AHgAVwAUABsAJwCqACgAKAApAL4AKgCqACsAlgAtAIIALgCgAC8AWgAwAIIAMQC+ADIAjAAzAJYANQCqADcAvgA5AL4AOgCCADsAlgA8ALQAPQBGAD4AqgA/ADIATQAyAE8AMgBQADwAUwA8AFf/4gBbAB4AKAAm/0IAJwAyACj/nAAs/34AL/+6ADD/9gAxACgAMv/2ADT/dAA2/2AAOP9gADr/9gA9/4gAP/90AEb/LgBH/4gASP9MAEn/QgBK/yQAS/84AEz/JABN/4gATv9qAE//agBQ/4gAUf9+AFL/YABT/2AAVP84AFX/TABW/zgAV/9MAFj/BgBZ/2oAWv8uAFv/VgBc/0wAXf9qAF7/QgBf/y4AEQAm/8QAJwBaACkAUAAqAGQAKwBGAC4AKAAwABQAMQBuADUAKAA3AEYAOP/sADkAUAA6ABQAOwA8ADwAWgA+AEYATQAeAAEAJwBGAAEAKABGAAIAKQAyACsAHgASACcAjAApAJYAKgB4ACsAggAtAFoALgBQAC8AKAAwAFoAMQCMADIAUAAzAFoANQBkADcAggA5AHgAOgBGADsAWgA8AGQAPgCWAAEAKwAyABoAJgBGACcBLAAoAFAAKQEiACoBNgArAQ4ALAB4AC0A5gAuAQQALwDmADABBAAxASIAMgD6ADMBDgA0AG4ANQEiADcBIgA4AEYAOQEiADoBBAA7APoAPAEiAD0AoAA+ATYAPwB4AFcAUAABACoAMgAFACcARgAqACgALgAoADEARgA3ACgAEQAnALQAKQCWACsAlgAtAG4ALgCMAC8ARgAwAG4AMQCqADIAggAzAIIANQCMADcAlgA5AKoAOgBkADsAZAA8AIIAPgCgAA0AJwC+AC4AjAAvAFoAMAB4ADEAoAAyAIwAMwCMADUAlgA3ALQAOQCqADsAeAA8AIwAPgCgAAkAJwAyACkAPAAqACgAMQA8ADMAMgA3AFAAOgAoADwARgA+ADwAFAAnAMgAKQDIACoA0gArAL4ALQCWAC4AqgAvAGQAMACMADEA0gAyAJYAMwCWADUAvgA3ALQAOQC+ADoAtAA7AIwAPADcAD0AKAA+AL4APwA8AAIAJwA8ACsAHgABADP/ugACACsAHgA2AB4AAQA3ACgAAgA4ADIAPAAUAAIAMP/sAD7/pgARACcAlgAoADIAKgCqACsAeAAtAFAALgBkAC8APAAwAFoAMQCMADIAbgAzAG4ANQBuADkAoAA6AGQAOwBuADwAjAA+AJYAAQArACgAAgA8AB4APv+SAAMAL//EAD3/zgA+/7AAAwAr/+IAN//iAD7/pgADACoAKAA+/8QAP//sAAIAKwAoAC8AHgAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
