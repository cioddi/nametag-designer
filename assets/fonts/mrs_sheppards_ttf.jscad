(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mrs_sheppards_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AVwAaAHPAJcCg//WAu//0wN1AHYD2f/zAPkAlwGsADUBpgAaAd4AgwJQACkBFQBYAl4ARwEWAEACBv/RArcABgGQAAYClP/OAqcADwLkABAC5gAhAvMAAgKVADkCu//CAxYAKwEtAEABFQBYAigAJwIoABUCKAAtAfQAfQJyAG0CMP//AqT/6QHhACQDKv/2Aj3/6wEo/5UCswAkAo8AGQGDAAwCov+nAvAAGQMi/5cDNv+UAiH/jAIqACQB8P/5AyX/wQLo//kCi/+jAL7/tAKU//ABtv/2AqT/1QJd/7cCIP/oAlD/ugGrADsBdgCNAasAIwGSAC0CKAAFAZIAPAGSACYBYAAhAUoABwHCACwBZgApAQH/LgFk/6QB6AAfAOQACwEB/xYBugAcAUoAHgJuAA0ByAAUAU4AIQGb/0oBef+qAScASQFBAB4BCgAiAcUAIgEs//4CJgAaAVn/9QFuAAsBSQAUAasAIwDHADkBzgAuAcIAbQGR/84BSgCHAxH/hgJuAJACIAAcAMcAOQFBAB4A5AAmAv///QGSAD8BzgBpAlAALQL///0CKABhAZIAgwJ+/9sB0AAqAdoAQwGSAIwCkgCcARYAOwFKAEEBagByAU4AWQHOAGoDkQA4AzAAOAQlAEMB3f++AjD//wIw//8CMP//AjD//wIw//8CMP//A8z//wHsACQCPf/rAj3/6wI9/+sCPf/rAYMADAGDAAwBgwAMAYMADAMq//YCIf+MAioAJAIqACQCKgAkAioAJAIqACQB6gAMAioAJAKU//AClP/wApT/8AKU//ACIP/oAnP/+QIa/+sBkgAmAZIAJgGSACYBkgAmAZIAJgGSACYCdwAmAWcABwFmACkBZgApAWYAKQFmACkA+gALAOQACwD6AAsA5AALAVEANgHIABQBTgAhAU4AIQFOACEBTgAhAU4AIQJVACkBXQAhAcUAIgHFACIBxQAiAcUAIgFuAAsBqP9KAW4ACwD6AAsDIv+XAZIAHgRIACQCDAAhAov/owFBAB4CIP/oAlD/ugFJABQBkgBZAZIARwGSARUBFgA7AZIAhQFmAIMBkgA+AZIA9wFk/80BdgAdAs0AKQD7AEUBFQCcARUANwHSAHAB0gCcAdIALwGnAEcBnAClAt0AQAUAAHYBQQBpATsAagIpACUB2gBDAxUAFwOuAKYB9P+8AlAALQIo/9sCKP/bAngAAAHv/y4CnP8uAAEAAAO//oYAAAUA/xb9igViAAEAAAAAAAAAAAAAAAAAAADrAAIBWAGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAYDAAAAAgAEgAAAJ1AAAEsAAAAAAAAAAFNVRFQAQAAg+wIDv/6GAAADvwF6IAAAAQAAAAABHQKWAAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABAEIAAAAPgAgAAQAHgB+AKwAtAD/ATEBQgFTAWEBeAF+AscC3QPAIBQgGiAeICAgIiAmIDAgOiBEIHQgrCEiIg8iEiJl+P/7Av//AAAAIAChAK4AtgExAUEBUgFgAXgBfQLGAtgDwCATIBggHCAgICIgJiAwIDkgRCB0IKwhIiIPIhIiZPj/+wH////j/8H/wP+//47/f/9w/2T/Tv9K/gP98/0R4L/gvOC74LrgueC24K3gpeCc4G3gNt/B3tXe096CB+kF6AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAMQAAAADAAEECQABABoAxAADAAEECQACAA4A3gADAAEECQADAFQA7AADAAEECQAEACoBQAADAAEECQAFABoBagADAAEECQAGACgBhAADAAEECQAHAF4BrAADAAEECQAIABwCCgADAAEECQAJABwCCgADAAEECQALAC4CJgADAAEECQAMAC4CJgADAAEECQANASACVAADAAEECQAOADQDdABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADAANAAgAEEAbABlAGoAYQBuAGQAcgBvACAAUABhAHUAbAAgACgAcwB1AGQAdABpAHAAbwBzAEAAcwB1AGQAdABpAHAAbwBzAC4AYwBvAG0AKQAsAA0AdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBNAHIAcwAgAFMAaABlAHAAcABhAHIAZABzACIATQByAHMAIABTAGgAZQBwAHAAYQByAGQAcwBSAGUAZwB1AGwAYQByAEEAbABlAGoAYQBuAGQAcgBvAFAAYQB1AGwAOgAgAE0AcgBzACAAUwBoAGUAcABwAGEAcgBkAHMAIABSAGUAZwB1AGwAYQByADoAIAAyADAAMAA0AE0AcgBzACAAUwBoAGUAcABwAGEAcgBkAHMAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADAATQByAHMAUwBoAGUAcABwAGEAcgBkAHMALQBSAGUAZwB1AGwAYQByAE0AcgBzACAAUwBoAGUAcABwAGEAcgBkAHMAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwALgBBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHMAdQBkAHQAaQBwAG8AcwAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsAA0AVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6AA0AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA6wAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCW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ACQAygAlAYkAJwE/ACgBKAAsAG8ALQDKADAA8gAyAPMANADeADUBigA2AS8ANwIOADgA3AA5ARgAOgFDADsBYQA8ARsAPQF2AEABWgBFADwASABIAEkAPABLAFAATgAyAE8AaQBSACoAUwAmAFUAUABWAF0AVwAoAFkAUABbAEQAXAARAGABYQDBABQAFwALAFoADQA7ACQAawAlAK4AJwCNACgAYwAsACkAMABRADIAbwA0AD0ANQDsADYAgwA3AS8AOACDADkAcgA6AKIAOwBbADwAWwA9AJcAPwCWAFYAFABZABMAYAB5ABcADQBPACIAWwAkAKEAJQC/ACcAjQAoAFoALAAyADAAoQAyAHAANAA8ADUA6AA2AG8ANwFEADgAZQA5AG8AOgCNADsAoQA8AFAAPQCiAD8AvABAAHEATwAUAGAAaQAXAA0AaAAiAG8AJAB5ACUAygAnAMUAKACEACwAFAAtAFAALwA8ADAAeQAyAFsANABHADUBGwA2AKwANwFXADgARwA5AG8AOgCsADsAgwA8AGUAPQC2AD8AlwBgAHkAEAAkAHUAJQCBACcAcQAoAFsAMABvADIASQA0ACgANQDEADYAjgA3AN4AOABvADkAcgA6AIQAOwBlADwAbwA9AHoAFAAMAJ4AIgBlACQAMwAlANQAKACDAC0AUQAyADIANABRADUA6AA2AI0ANwFsADgAbwA5AIQAOgCOADsA3wA8AIMAPQDKAD8BAABAANMAYAC0ABIADQBIACIARwAkAEQAJQDEACcAnwAoAFsAMgA9ADQAWwA1AOEANgBwADcBGgA4AD0AOQA1ADoAeQA7AI0APABQAD0AqwBgAEMAGgAMALQADQBbACIAZQAkAHwAJQDzACcAwAAoAIMALAAzAC0APAAvAG8AMACXADIAawA0AGUANQElADYAtgA3AW4AOABiADkAgwA6AI0AOwDpADwAmAA9AL8AQADTAE8AHgBgAMsAwQAeABwADAFhAA0AxAASAGIAJAC0ACUBXAAnATYAKAD6ACwAbwAtAIMALwA8ADAAwAAyAMQANAC2ADUBawA2APIANwHqADgArgA5AMUAOgEHADsBbAA8ARAAPQFNAD8BpQBAAX8ATwAeAFsAKQBgAWEAwQAeAB0ADABiAA0AkAAP/8gAEf/IACIAhwAkAMAAJQDnACcAygAoAJ4ALAA8AC0AVAAvAC0AMADAADIAnQA0AF8ANQFGADYAygA3AWgAOACSADkAmAA6AKMAOwC2ADwAjQA9AMoAPwC8AEAAgABPAB4AYABwAMEAHgAmAAQAUQAMAIcADQDkABIAUwAiALUAJAECACUBRgAnATYAKADeACwAgwAtALYAMACOADIA8wA0AMoANQGKADYBLwA3Aa8AOACvADkBGwA6ARsAOwCrADwA1AA9ARAAPwEHAEAAtABFADwASAAoAEkAKABLAFAATABDAE0AQwBOADgATwBZAFMAOABWAC0AVwAtAGAA0wDBAFkADQASAJYAJQCpACcAiAAoAHoAMgBDADUAbwA2ADMANwCQADgAHgA5AEwAOgA8ADsAPQA9ADMAEQAkABwAJQBwACcAQwAoADMALwCXADAAgQAyACgANABPADUAowA2AHwANwC/ADgALgA5AB8AOgAyADsAbwA8ADMAPQBvABIAJABUACUAfAAnAEcAKAA1ACwACwAvAEcAMgAcADQAUQA1AMUANgB5ADcA/wA4AGIAOQB5ADoAbwA7AD0APABHAD0AWwA/AFoAHQAEAOsADAFpAA0BBgASAMsAIgFhACQBDQAlAeMAJwGKACgBigAsAMAALQDUAC8APAAwAN8AMgEzADQBMwA1AeoANgFhADcCXgA4AUYAOQGCADoBbQA7AdcAPAF4AD0BvwA/AcsAQAGOAEUAEwBJABQAYAF/ABUADABiAA0AVQAiAGMAJABqACUA5AAnALUAKAB5ACwAKQAwAGoAMgBqADQATAA1AQIANgCXADcBNwA4AFsAOQBbADoAnwA7AJ8APAB6AD8A4QBgAIgAIAAEAMAADAFxAA0A+AASAMQAIgFzACQA4QAlAdEAJwGKACgBewAsAKYALQDrAC8ARwAwANQAMgEgADQA6wA1AccANgFVADcCTAA4ARkAOgFVADsA1AA8AVgAPQGCAD8B/wBAAcoATQA4AE4AQwBPAFkAVQBOAFcAQwBgAYcAwQBZACAABAChAAwBDgANANEAEgCPACIBLwAkAPcAJQGKACcBZAAoAFMALAB5AC0AwAAvADIAMAB5ADIAygA1AbMANgEbADcB7gA4AQIAOQDyADsArAA8AUQAPQFYAEABLQBFAEMASQBOAEsAQwBOADgATwBOAFUALABXAEMAYAEPAMEATgAMACUAmAAnADwAMACDADUAmAA3AOsAOAAeADkAHgA6AFEAOwAzADwARgA9AFEAPwAuABwADACeAA0AnQASAEsAIgCXACQAowAlASUAJwD9ACgAxQAsAFEALQBvAC8AUQAwAKsAMgCYADQAeQA1AUMANgDeADcBpwA4AJcAOQCnADoA1AA7ANQAPAC2AD0A8wA/ARYAQACAAE8ANwBgAMMAwQA3AA4AJQCOACcAcQAoACgAMAB6ADQAKAA1AMoANgBRADcBDwA4AC0AOQAtADoAZQA7AFEAPAA8AD0AWwAIACT/lgAo/4cALP+eADL/cQA1/9MAOP+1ADn/tQA8/6YABAAs/70ALwBEADYAHgA3AFoABgASAGIARP/vAEj/6gBK/+4AS//yAEz/9gAGACIAMwBAAGIARgARAF8AaQBgAFIA2gAtAAQARgAWAE8AGgBVACAAwQAaAA4ADACWAA0AsAASAFMAQACeAEf/8QBPAC8AUf/qAFT/7QBVABYAWP/uAF8A2QBgAK0AwQAvANoAqQAHABIANQBPABkAUf/zAFP/9wBVABYAwQAZANoAPAAWAAwAjwANAKoAEgBpACIAgwBAAHEARQAdAEYAGQBJADsATAAUAE0AXwBOACkATwA3AFMAKABVACkAWQAvAFoAFgBbAEgAXQAlAF8ApQBgAJ4AwQA3ANoAmgAKABIASwBGAB0ASQAwAE0AJQBPACUAUgAgAFMAKQBVABsAWQAuAMEAJQADABIAWgBGAA8ASP/rAAgAEgAtAET/9gBGABIATwAqAFUAFwBfAEAAYAA8ANoAfAAIAA0AYgASADUARgAcAEkAKABPABwAXwBDAMEAHADaAHgAAgASAFMAWQAkABAADQCwABIAUgAiAI0AQABwAEUAGQBIABoASwAgAE4AGwBPAC4AVQAuAFcAFwBdABsAXwClAGAAvADBAC4A2gChAAIAEgAtAEj/8QAGAEYAIQBPACAAUgAXAFUAFwBZACAAwQAgAAkARP/uAEn/9wBM/+kAUP/2AFH/7gBU/+kAV//sAFj/7wBb/+wACwBFABIARgAsAEoADgBOABcATwApAFIAJQBTAAIAVQAgAFkAIABcABIAwQApAAcAEgAXAEYAFgBJACUATwASAFIAKABd/+QAwQASAAMATwAbAFUAFwDBABsACwANAUAAEgDLAEsAGwBPAFIAVQAXAFsAIQBdABoAXwEkAGABBwDBAFIA2gFyAAIAEgA1AFP/9gALAEcAEgBKABIASwAcAE0AIABOACQATwA8AFUAOwBdAAYAYAA1AMEAPADaAJYABABVACkAWQAkAGAAQwDaAJoAAgASAC0AR//sAAUASQAhAE8AFgBSABcAVQAbAMEAFgACABIAJQBbAAYAAgAs/6YAMv+PAAgAFABSABUArQAWAJ0AFwBLABkAeAAaANMAGwBqABwAaQAJABMAngAUAI8AFQDLABYApgAYAMMAGQCAABoA4QAbALUAHACeAAoAEwDpABQAtAAVALQAFgCeABcA6QAYAIAAGQDiABoAjwAbAMsAHAC8AAEARP/2AAYATQAKAE4ACgBPACgAVQAoAFkAFADBACgACgBFABIARgAEAEoADgBOABcATwApAFIAJQBVACAAWQAgAFwAEgDBACkABgBGAB0ASQAwAE8AJQBSACAAUwApAMEAJQAHABMAhwAUAD0AFQB4ABYAJQAXAEsAGQBbABsAPQABAAAACgAsAC4AA0RGTFQAFGdyZWsAHmxhdG4AHgAEAAAAAP//AAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
