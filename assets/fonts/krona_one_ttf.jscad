(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.krona_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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CkJwnwZoOWePV1ZfX1ZXj2c5//8AuQAABhUH7gAmAAsAAAAHAOEAxAAAAAMAiQCyBB4FUAADAAcACwAAATMBIwMhFSEVIRUhAynj/XPjEwOV/GsDlfxrBVD7YgOa3sDe//8AFQAABzcH7gImALIAAAAHAJYBagAA//8AFQAABzcH7gImALIAAAAHAJcA/QAA//8AFQAABzcH7gImALIAAAAHAOEBBQAA//8AFQAABzcH7gImALIAAAAHAKUCPAAA//8AFQAABzcH7gImALIAAAAHAJoAgQAA//8AFQAABzcH3QImALIAAAAHANwCSgAA//8AFQAABzcH7gImALIAAAAHAOYCSgAA//8AFQAABzcH7QImALIAAAAHAKQCSgAA//8Af//rBtgH7gImAC8AAAAHAJcBiAAA//8Af//rBtgH7gImAC8AAAAHAOEBkAAA//8Af//rBtgH7gImAC8AAAAHAOIBkQAA//8Af//rBtgH7gImAC8AAAAHAK8C1gAA//8A3v//BvIH7gImABIAAAAHAOIBUAAA//8A3gAABiYH7gImAAQAAAAHAJYBTgAA//8A3gAABiYH7gImAAQAAAAHAJcA4QAA//8A3gAABiYH7gImAAQAAAAHAOEA6QAA//8A3gAABiYH7gImAAQAAAAHAOIA6gAA//8A3gAABiYH7gImAAQAAAAGAJplAP//AN4AAAYmB90CJgAEAAAABwDcAi4AAP//AN4AAAYmB+4CJgAEAAAABwDmAi4AAP//AN4AAAYmB+4CJgAEAAAABwCvAi8AAP//AHP/6weBB+4CJgAwAAAABwDhAV4AAP//AHP/6weBB+4CJgAwAAAABwDmAqMAAP//AHP97geBBi4CJgAwAAAABwCUAnUAAP//AHP/6weBB+4CJgAwAAAABwCvAqQAAP//AN0AAAckB+4CJgARAAAABwDhAWcAAP///+IAAALKB+4CJgAFAAAABwCW/yIAAP///+IAAALKB+4CJgAFAAAABwCX/rUAAP///40AAAMfB+4CJgAFAAAABwDh/r0AAP///5YAAAMWB+4CJgAFAAAABgCl9AD///8pAAADgwfuAiYABQAAAAcAmv45AAD////JAAAC4gfdAiYABQAAAAYA3AEA////lAAAAxYH7gImAAUAAAAGAOYBAP//AH4AAAItB+4CJgAFAAAABgCv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AEP/7gBEAET/7gBFAEX/7gBGAEb/7QBHAEf/7QBIAEj/7QBJAEn/7QBKAEr/7ABLAEv/7ABMAEz/7ABNAE3/7ABOAE7/6wBPAE//6wBQAFD/6wBRAFH/6wBSAFL/6gBTAFP/6gBUAFT/6gBVAFX/6gBWAFb/6QBXAFf/6QBYAFj/6QBZAFn/6ABaAFr/6ABbAFv/6ABcAFz/6ABdAF3/5wBeAF7/5wBfAF//5wBgAGD/5wBhAGH/5gBiAGL/5gBjAGP/5gBkAGT/5gBlAGX/5QBmAGb/5QBnAGf/5QBoAGj/5QBpAGn/5ABqAGr/5ABrAGv/5ABsAGz/5ABtAG3/4wBuAG7/4wBvAG//4wBwAHD/4wBxAHH/4gByAHH/4gBzAHL/4gB0AHP/4QB1AHT/4QB2AHX/4QB3AHb/4QB4AHf/4AB5AHj/4AB6AHn/4AB7AHr/4AB8AHv/3wB9AHz/3wB+AH3/3wB/AH7/3wCAAH//3gCBAID/3gCCAIH/3gCDAIL/3gCEAIP/3QCFAIT/3QCGAIX/3QCHAIb/3QCIAIf/3ACJAIj/3ACKAIn/3ACLAIr/3ACMAIv/2wCNAIz/2wCOAI3/2wCPAI7/2gCQAI//2gCRAJD/2gCSAJH/2gCTAJL/2QCUAJP/2QCVAJT/2QCWAJX/2QCXAJb/2ACYAJf/2ACZAJj/2ACaAJn/2ACbAJr/1wCcAJv/1wCdAJz/1wCeAJ3/1wCfAJ7/1gCgAJ//1gChAKD/1gCiAKH/1gCjAKL/1QCkAKP/1QClAKT/1QCmAKX/1QCnAKb/1ACoAKf/1ACpAKj/1ACqAKn/1ACrAKr/0wCsAKv/0wCtAKz/0wCuAK3/0gCvAK7/0gCwAK//0gCxALD/0gCyALH/0QCzALL/0QC0ALP/0QC1ALT/0QC2ALX/0AC3ALb/0AC4ALf/0AC5ALj/0AC6ALn/zwC7ALr/zwC8ALv/zwC9ALz/zwC+AL3/zgC/AL7/zgDAAL//zgDBAMD/zgDCAMH/zQDDAML/zQDEAMP/zQDFAMT/zQDGAMX/zADHAMb/zADIAMf/zADJAMj/ywDKAMn/ywDLAMr/ywDMAMv/ywDNAMz/ygDOAM3/ygDPAM7/ygDQAM//ygDRAND/yQDSANH/yQDTANL/yQDUANP/yQDVANT/yADWANX/yADXANb/yADYANf/yADZ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AHIAbwBuAGEAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBLAHIAbwBuAGEATwBuAGUALQBSAGUAZwB1AGwAYQByAEsAcgBvAG4AYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAuAFkAdgBvAG4AbgBlACAAUwBjAGgAdQBlAHQAdABsAGUAcgBLAHIAbwBuAGEAIABpAHMAIABhACAAbABvAHcAIABjAG8AbgB0AHIAYQBzAHQAIABzAGUAbQBpAC0AZQB4AHQAZQBuAGQAZQBkACAAcwB0AHkAbABlACAAcwBhAG4AcwAgAHMAZQByAGkAZgAuACAASwByAG8AbgBhACAAaQBzACAAYgBvAHQAaAAgAHIAZQBhAGQAYQBiAGwAZQAgAGEAbgBkACAAZgB1AGwAbAAgAG8AZgAgAHAAZQByAHMAbwBuAGEAbABpAHQAeQAuACAASwByAG8AbgBhACAAYwBhAG4AIABiAGUAIAB1AHMAZQBkACAAZgByAG8AbQAgAHMAbQBhAGwAbAAgAHMAaQB6AGUAcwAgAHQAbwAgAGwAYQByAGcAZQByACAAZABpAHMAcABsAGEAeQAgAHMAZQB0AHQAaQBuAGcAcwAuACAASwByAG8AbgBhACAAdwBhAHMAIABpAG4AcwBwAGkAcgBlAGQAIABiAHkAIABoAGEAbgBkACAAbABlAHQAdABlAHIAaQBuAGcAIABvAG4AIABlAGEAcgBsAHkAIAAyADAAdABoACAAYwBlAG4AdAB1AHIAeQAgAFMAdwBlAGQAaQBzAGgAIABwAG8AcwB0AGUAcgBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgB5AHMAYwBoAC4AZABlAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAagAAAABAAIAAwAoACwAMQA2ADIARABHAEsASABWAEwAUgBRACsAJwBNAEUAVQBXAE8ASgBOAFAASQBGAFMAVABYAFkAWgBbAF0AXAApAC8ANwAlAC0AMwAuADAANQA0ACYAKgA9ADkAOgA7ADgAEAAdAA8APAARABQAFQAXABoAHAAZABYAGAAbABMAHgDDAAQAIgCjAKIADQCHAAkAvgC/AKkAqgASAD8AXwDoAAsADAA+AEAAiACyALMAtgC3ALQAtQAKAMQABQBeAGAAxQAjAIsAigCXAJ0AngCDAB8AIQAOAJMAIADwALgACACNAEMAhgDZANoA3gCOAJYAhQAHAL0AhAAGAKQAYQBBAEIA8QDyAPMA9QD0APYA1wDqAO4BAgDpAO0BAwEEAN0BBQEGAOIA4wEHAJAA3ACRAIkAsACxAKABCAChAQkBCgCrAIwAxgCmAIIAwgC5AGQBCwEMAQ0ArAAkAQ4BDwEQAREBEgETARQBFQEWARcBGAEZARoBGwEcAR0BHgEfASABIQEiAOABIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEBATABMQEyATMBNAE1ATYBNwDYAOEBOAE5AN8A2wE6ATsBPACPAK0AyQDHAK4AYgE9AT4AYwD9AT8A/wFAAUEAywBlAMgBQgDKAUMBRAFFAUYA+AFHAUgBSQDPAMwAzQFKAM4BSwFMAPoBTQFOAU8BUAFRAVIAZgFTANMA0ADRAK8AZwFUAVUBVgFXAVgBWQFaAOQA+wFbAVwBXQDWANQA1QFeAGgBXwFgAWEBYgFjAWQBZQFmAWcBaADrAWkAuwFqAOYBawBqAGkAawBtAGwBbAFtAG4A/gFuAQABbwBvAXAAcQBwAHIBcQBzAXIBcwF0AXUA+QF2AXcAdQB0AHYBeAB3AXkBegF7AOwBfAC6AX0BfgF/AYAAfwB+AIABgQCBAYIBgwGEAYUBhgD8AYcBiADlAYkBigGLAYwAwADBAY0A5wGOAHoAeQB7AH0AfAGPAZABkQGSAHgBkwGUAZUBlgGXAZgBmQGaAZsBnAGdAZ4BnwGgAaEBogGjAaQBpQGmAacBqADvAJIAlACVAJgAmQCaAJsAnACfAKUApwCoALwBqQRoYmFyCGRvdGxlc3NqC2NvbW1hYWNjZW50CWdyYXZlLmNhcAlhY3V0ZS5jYXAMZGllcmVzaXMuY2FwBEV1cm8IcmluZy5jYXAJdGlsZGUuY2FwDGtncmVlbmxhbmRpYw1kb3RhY2NlbnQuY2FwBGxkb3QHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAxMAd1bmkwMDExB3VuaTAwMTIHdW5pMDAxMwd1bmkwMDE0B3VuaTAwMTUHdW5pMDAxNgd1bmkwMDE3B3VuaTAwMTgHdW5pMDAxOQd1bmkwMEFEB2VvZ29uZWsHYW9nb25lawdBb2dvbmVrB0VvZ29uZWsNY2Fyb252ZXJ0aWNhbAZkY2Fyb24GbGNhcm9uBkxjYXJvbgZ0Y2Fyb24HaW9nb25lawdJb2dvbmVrB3VvZ29uZWsHVW9nb25lawZEY3JvYXQGbGFjdXRlBHRiYXIEVGJhcgRIYmFyBkxhY3V0ZQptYWNyb24uY2FwA0VuZwNlbmcOY2lyY3VtZmxleC5jYXAJY2Fyb24uY2FwEGh1bmdhcnVtbGF1dC5jYXAJYnJldmUuY2FwC2hjaXJjdW1mbGV4B0FtYWNyb24GQWJyZXZlC0NjaXJjdW1mbGV4CkNkb3RhY2NlbnQGRGNhcm9uBkVjYXJvbgdFbWFjcm9uBkVicmV2ZQpFZG90YWNjZW50C0djaXJjdW1mbGV4DEdjb21tYWFjY2VudApHZG90YWNjZW50C0hjaXJjdW1mbGV4Bkl0aWxkZQdJbWFjcm9uBklicmV2ZQJJSgtKY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMTGNvbW1hYWNjZW50Bk5hY3V0ZQZOY2Fyb24MTmNvbW1hYWNjZW50B09tYWNyb24GT2JyZXZlBlJhY3V0ZQZSY2Fyb24MUmNvbW1hYWNjZW50BlNhY3V0ZQtTY2lyY3VtZmxleAxTY29tbWFhY2NlbnQGVGNhcm9uDFRjb21tYWFjY2VudAZVdGlsZGUHVW1hY3JvbgZVYnJldmUFVXJpbmcNVWh1bmdhcnVtbGF1dA1PaHVuZ2FydW1sYXV0BldncmF2ZQZXYWN1dGULV2NpcmN1bWZsZXgJV2RpZXJlc2lzBllncmF2ZQtZY2lyY3VtZmxleAZaYWN1dGUKWmRvdGFjY2VudAdhbWFjcm9uBmFicmV2ZQtjY2lyY3VtZmxleApjZG90YWNjZW50B2FlYWN1dGUGZWNhcm9uB2VtYWNyb24GZWJyZXZlCmVkb3RhY2NlbnQLZ2NpcmN1bWZsZXgKZ2RvdGFjY2VudAxnY29tbWFhY2NlbnQGaXRpbGRlB2ltYWNyb24GaWJyZXZlBnlncmF2ZQt5Y2lyY3VtZmxleAZ3Z3JhdmUGd2FjdXRlC3djaXJjdW1mbGV4CXdkaWVyZXNpcwZ1dGlsZGUHdW1hY3JvbgZ1YnJldmUFdXJpbmcMdGNvbW1hYWNjZW50DHNjb21tYWFjY2VudAZzYWN1dGULc2NpcmN1bWZsZXgGcmNhcm9uBnJhY3V0ZQxyY29tbWFhY2NlbnQCZmYGemFjdXRlCnpkb3RhY2NlbnQHb21hY3JvbgZvYnJldmUGbmFjdXRlBm5jYXJvbgxrY29tbWFhY2NlbnQLamNpcmN1bWZsZXgCaWoMbmNvbW1hYWNjZW50DGxjb21tYWFjY2VudAd1bmkxRTYxB3VuaTFFNjAHdW5pMUU1Nwd1bmkxRTU2B3VuaTFFNDEHdW5pMUU0MAd1bmkxRTFFB3VuaTFFMEIHdW5pMUUwQQd1bmkxRTAzB3VuaTFFMDIHdW5pMUUxRgd1bmkxRTZBB3VuaTFFNkINb2h1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0BExkb3QHQUVhY3V0ZQAAAAAAAwAIAAIAEAAB//8AAw==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
