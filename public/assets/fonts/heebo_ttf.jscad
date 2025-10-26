(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.heebo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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BQ0AqQWCAG0E7QCpBMAAUQTGADIFMACMBRkAHQcZAD0FBQA6BM4ADwTLAFcEWwBtBH4AjAQxAFwEhABfBD8AXQLIAD0EfgBgBGgAjAHyAI4B6/+/BA8AjQHyAJwHAwCLBGsAjASRAFwEfgCMBI0AXwK2AIwEIQBfAp4ACQRpAIgD4QAhBgMAKwP4ACkDyQAWA/gAWQR/AHMEfwCrBH8AXQR/AF8EfwA1BH8AmgR/AIUEfwBOBH8AcQR/AGQC8AB7AvAAQgLwAD8DlACTA6QAewYwAHsFugB7BigAPwd7//AGwgBOB6IAaQdDAGEEsQB+BLoApgSdAJUFKwCPBMIAiwRvAB8EfwBuBGEAaASnAFsENAAPBbQAaQIRAKEB9QCLA8kASwPKAEQBkwAcAh0AkAHyAIUBsgApBVsAkwIYAJMCswCLA50ABAI1ACUFQACiBj8AkAFmAGcCkgCIAZsAYAGbADABmQAkAtcAaQLeADwCxQAkAr4AhQLKACcCIQCSAiEACgK2AEACtgAUAmcAbAJnAFoEigBOBJMAqARHAGEERQBZBJIARwRkAJgEEQBIBC8AhwRvAH8DDgASA04AEgNJACkDowA8BdwAaQH1ALAB7QCTBkkAWwZJAFoC/QCDA3IAHATvAHgE+gBlBy4AaATpAFoD6gBDA1gAQAVxAIMFOgAcBToAHAU6ABwFOgAcBToAHAU6ABwFNQB3BIwAqQSMAKkEjACpBIwAqQVAAAYCLgC3Ai7/6QIu/9QCLv/NBbUAqQWCAHYFggB2BYIAdgWCAHYFggB2BYIAdgUwAIwFMACMBTAAjAUwAIwEzgAPBFsAbQRbAG0EWwBtBFsAbQRbAG0EWwBtBDEAXAQ/AF0EPwBdBD8AXQQ/AF0B/ACcAfz/zwH8/7oB/P+zBGsAjASRAFwEkQBcBJEAXASRAFwEiQBcBJEAXARpAIgEaQCIBGkAiARpAIgDyQAWA8kAFgJ6ADgChAB7A8YAqgPIAHwDrACPA1gAZAKvAHkB/AB0A8EAZAPBAGcB/ACcBH8AYARpAHoB/QCgBIYAZAS3AGQExgBkBNUANwSrAFMFIgCYBDcAPQMYABQEKwA8BLQAlAJcAGQC1ABMBNsAtQTvALUCagA3A/YAQQRNAFEEHABTBRUAtAUTAIQCTQBWAuYAPAUZAGcEoQA9BL8AjwUEAI4ESAA7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AE0AZQBpAHIAIABTAGEAZABhAG4ATwBkAGUAZAAgAEUAegBlAHIAbQBlAGkAcgBzAGEAZABhAG4ALgBjAG8AbQBIAGUAYgByAGUAdwBUAHkAcABvAGcAcgBhAHAAaAB5AC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwAHMAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAVwBlAGkAZwBoAHQAUgBvAG0AYQBuAAIAAAAAAAD/agBkAAAAAAAAAAAAAAAAAAAAAAAAAAABXQAAAAMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQATABQAFQAWABcAGAAZABoAGwAcAQIBAwEEAJ0AngD0APUA9gCQAKAAsACxAOoA7QDuAQUAiQDAAAcAhACFAJYAvQAEAKMAIgCiAA8AEQAdAB4AqwDDAIcAQgAQALIAswAKAAUAtgC3AMQAtAC1AMUACwAMAD4AQABeAGAAvgC/AA4A7wCTAPAAuAAgAB8AIQCkAQYAEgA/ALwACABfAOgAiwCKAIMADQAGAAkAIwCGAIgAQQBhAMkAxwBiAK0AYwCuAGQAZQDIAMoAywDpAMwAzQDOAM8AZgDQANEAZwDTAJEArwDUANUAaADWAOsAaQBrAGwAagBuAG0AbwBwAHIAcwBxAHQAdgB3AHUAeAB5AHsAfAB6AKEAfQB+AIAAgQB/AOwAugBDAI0A2ADZANoAjgDdAN4AqQCqANcBBwCXAQgBCQEKAQsBDAENAQ4BDwEQAREBEgETARQBFQEWARcBGAEZARoBGwEcAR0BHgEfASABIQEiASMBJAElASYBJwEoASkBKgErASwBLQEuAS8BMAExATIBMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQFqAWsBbAFtAW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewF8AX0BfgF/AYABgQGCAYMBhAGFAYYBhwGIAYkBigGLAYwBjQGOB3VuaTAwQjkHdW5pMDBCMgd1bmkwMEIzB3VuaTFFOUUNZGl2aXNpb25zbGFzaARFdXJvBWxvbmdzBWFscGhhB3VuaTA1RjAHdW5pMDVGMQd1bmkwNUYyB3VuaUZCNEYHdW5pMDVEMAd1bmkwNUQxB3VuaTA1RDIHdW5pMDVEMwd1bmkwNUQ0B3VuaTA1RDUHdW5pMDVENgd1bmkwNUQ3B3VuaTA1RDgHdW5pMDVEOQd1bmkwNURBB3VuaTA1REIHdW5pMDVEQwd1bmkwNUREB3VuaTA1REUHdW5pMDVERgd1bmkwNUUwB3VuaTA1RTEHdW5pMDVFMgd1bmkwNUUzB3VuaTA1RTQHdW5pMDVFNQd1bmkwNUU2B3VuaTA1RTcHdW5pMDVFOAd1bmkwNUU5B3VuaTA1RUEHdW5pRkIxRgd1bmlGQjIwDndpZGVhbGVmaGVicmV3D3dpZGVkYWxldGhlYnJldwx3aWRlaGVoZWJyZXcNd2lkZWthZmhlYnJldw93aWRlbGFtZWRoZWJyZXcSZmluYWx3aWRlbWVtaGVicmV3DndpZGVyZXNoaGVicmV3DXdpZGV0YXZoZWJyZXcHdW5pRkIyQQd1bmlGQjJCB3VuaUZCMkMHdW5pRkIyRAd1bmlGQjJFB3VuaUZCMkYHdW5pRkIzMAd1bmlGQjMxB3VuaUZCMzIHdW5pRkIzMwd1bmlGQjM0B3VuaUZCMzUHdW5pRkIzNgd1bmlGQjM4B3VuaUZCMzkHdW5pRkIzQQd1bmlGQjNCB3VuaUZCM0MHdW5pRkIzRQd1bmlGQjQwB3VuaUZCNDETZmluYWxwZWRhZ2VzaGhlYnJldwd1bmlGQjQ0B3VuaUZCNDYHdW5pRkI0Nwd1bmlGQjQ4B3VuaUZCNDkHdW5pRkI0QQd1bmlGQjRCB3VuaUZCNEMHdW5pRkI0RAd1bmlGQjRFCHplcm8uc3VwB29uZS5zdXAHdHdvLnN1cAl0aHJlZS5zdXAIZm91ci5zdXAIZml2ZS5zdXAHc2l4LnN1cAlzZXZlbi5zdXAJZWlnaHQuc3VwCG5pbmUuc3VwB3plcm9zdWIHdW5pMjA4MQZ0d29zdWIIdGhyZWVzdWIHZm91cnN1YgdmaXZlc3ViB3VuaTIwODYIc2V2ZW5zdWIIZWlnaHRzdWIHdW5pMjA4OQd1bmkyMDcwB3VuaTIwNzQHdW5pMjA3NQd1bmkyMDc2B3VuaTIwNzcHdW5pMjA3OAd1bmkyMDc5B3VuaTAwQUQHdW5pMDVGMwd1bmkwNUY0B3VuaTA1QkUHdW5pMjAwRglhZmlpNTc1OTYJYWZpaTU3NTk4B3VuaTIwMEMHdW5pMjBBQRVhbHRlcm5hdGl2ZXBsdXNoZWJyZXcJZ3JhdmVjb21iCWFjdXRlY29tYgl0aWxkZWNvbWIHdW5pMDVCMAd1bmkwNUIxB3VuaTA1QjIHdW5pMDVCMwd1bmkwNUI0B3VuaTA1QjUHdW5pMDVCNgd1bmkwNUI3B3VuaTA1QjgRcWFtYXRzcWF0YW5oZWJyZXcHdW5pMDVCORBob2xhbWhhc2VyaGVicmV3B3VuaTA1QkIHdW5pMDVCQwd1bmkwNUJGB3VuaTA1QzEHdW5pMDVDMgZsb25nc3QCc3QIY3Jvc3NiYXIAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgANAAIANQABAEgASwABAFMAUwABAJEAyAABANMA0wABANYA1wABANgA2gACANwA9gABAPcA9wACAPgBIAABAUYBRwADAUkBWQADAVoBWwABAAAAAQAAAAoAIAA8AAFERkxUAAgABAAAAAD//wACAAAAAQACa2VybgAObWFyawAUAAAAAQAAAAAAAgABAAIAAwAIBVgS3gACAAgAAQAIAAEAYAAEAAAAKwC6AMAA/gEQASIBRAFyAYQBpgHYAfoCKAI6AkwCugLAAvYDKANGA9QD8gP8BA4EFAQiBDgEPgRIBFIEbASW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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
