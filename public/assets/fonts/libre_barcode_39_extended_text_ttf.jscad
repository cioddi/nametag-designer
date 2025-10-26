(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.libre_barcode_39_extended_text_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAmxBQG4/sGwMysA//8AAP7AAeACTgImAGEAAAEHACMAov7BAAmxBQK4/sGwMysA//8AAP7BAeACTgImAGIAAAEHACQAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGMAAAEHACUAov7BAAmxBQG4/sGwMysA//8AAP69AeACTgImAGQAAAEHACYAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGUAAAEHACcAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGYAAAEHACgAov7BAAmxBQG4/sGwMysA//8AAP69AeACTgImAGcAAAEHACkAov7BAAmxBQG4/sGwMysA//8AAP6/AeACTgImAGgAAAEHACoAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGkAAAEHACsAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGoAAAEHACwAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAGsAAAEHAC0Aov7BAAmxBQG4/sGwMysA//8AAP69AeACTgImAGwAAAEHAC4Aov7BAAmxBQK4/sGwMysA//8AAP7BAeACTgImAG0AAAEHAC8Aov7BAAmxBQK4/sGwMysA//8AAP6JAeACTgImAG4AAAEHADAAov7BAAmxBQK4/sGwMysA//8AAP7BAeACTgImAG8AAAEHADEAov7BAAmxBQK4/sGwMysA//8AAP69AeACTgImAHAAAAEHADIAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAHEAAAEHADMAov7BAAmxBQG4/sGwMysA//8AAP69AeACTgImAHIAAAEHADQAov7BAAmxBQG4/sGwMysA//8AAP6/AeACTgImAHMAAAEHADUAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAHQAAAEHADYAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAHUAAAEHADcAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAHYAAAEHADgAov7BAAmxBQG4/sGwMysA//8AAP7BAeACTgImAHcAAAEHADkAov7BAAmxBQG4/sGwMysA//8AAP6gBBoCTgAmAH8AAAAnAGgCOgAAAQcAOgG//sEACbEKAbj+wbAzKwD//wAA/rEEGgJOACYAfwAA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sAFjsAQmYSCwBCVgZCOwAyVgZFBYIRsjIVkjICCwBCYjRmE4WS2wOiywABawESNCICAgsAUmIC5HI0cjYSM8OC2wOyywABawESNCILAII0IgICBGI0ewASsjYTgtsDwssAAWsBEjQrADJbACJUcjRyNhsABUWC4gPCMhG7ACJbACJUcjRyNhILAFJbAEJUcjRyNhsAYlsAUlSbACJWG5CAAIAGNjIyBYYhshWWO4BABiILAAUFiwQGBZZrABY2AjLiMgIDyKOCMhWS2wPSywABawESNCILAIQyAuRyNHI2EgYLAgYGawAmIgsABQWLBAYFlmsAFjIyAgPIo4LbA+LCMgLkawAiVGsBFDWFAbUllYIDxZLrEuARQrLbA/LCMgLkawAiVGsBFDWFIbUFlYIDxZLrEuARQrLbBALCMgLkawAiVGsBFDWFAbUllYIDxZIyAuRrACJUawEUNYUhtQWVggPFkusS4BFCstsEEssDgrIyAuRrACJUawEUNYUBtSWVggPFkusS4BFCstsEIssDkriiAgPLAEI0KKOCMgLkawAiVGsBFDWFAbUllYIDxZLrEuARQrsARDLrAuKy2wQyywABawBCWwBCYgICBGI0dhsAojQi5HI0cjYbAJQysjIDwgLiM4sS4BFCstsEQssQgEJUKwABawBCWwBCUgLkcjRyNhILAEI0KxCgBCsAlDKyCwYFBYILBAUVizAiADIBuzAiYDGllCQiMgR7AEQ7ACYiCwAFBYsEBgWWawAWNgILABKyCKimEgsAJDYGQjsANDYWRQWLACQ2EbsANDYFmwAyWwAmIgsABQWLBAYFlmsAFjYbACJUZhOCMgPCM4GyEgIEYjR7ABKyNhOCFZsS4BFCstsEUssQA4Ky6xLgEUKy2wRiyxADkrISMgIDywBCNCIzixLgEUK7AEQy6wListsEcssAAVIEewACNCsgABARUUEy6wNCotsEgssAAVIEewACNCsgABARUUEy6wNCotsEkssQABFBOwNSotsEossDcqLbBLLLAAFkUjIC4gRoojYTixLgEUKy2wTCywCCNCsEsrLbBNLLIAAEQrLbBOLLIAAUQrLbBPLLIBAEQrLbBQLLIBAUQrLbBRLLIAAEUrLbBSLLIAAUUrLbBTLLIBAEUrLbBULLIBAUUrLbBVLLMAAABBKy2wViyzAAEAQSstsFcsswEAAEErLbBYLLMBAQBBKy2wWSyzAAABQSstsFosswABAUErLbBbLLMBAAFBKy2wXCyzAQEBQSstsF0ssgAAQystsF4ssgABQystsF8ssgEAQystsGAssgEBQystsGEssgAARistsGIssgABRistsGMssgEARistsGQssgEBRistsGUsswAAAEIrLbBmLLMAAQBCKy2wZyyzAQAAQistsGgsswEBAEIrLbBpLLMAAAFCKy2waiyzAAEBQistsGssswEAAUIrLbBsLLMBAQFCKy2wbSyxADorLrEuARQrLbBuLLEAOiuwPistsG8ssQA6K7A/Ky2wcCywABaxADorsEArLbBxLLEBOiuwPistsHIssQE6K7A/Ky2wcyywABaxATorsEArLbB0LLEAOysusS4BFCstsHUssQA7K7A+Ky2wdiyxADsrsD8rLbB3LLEAOyuwQCstsHgssQE7K7A+Ky2weSyxATsrsD8rLbB6LLEBOyuwQCstsHsssQA8Ky6xLgEUKy2wfCyxADwrsD4rLbB9LLEAPCuwPystsH4ssQA8K7BAKy2wfyyxATwrsD4rLbCALLEBPCuwPystsIEssQE8K7BAKy2wgiyxAD0rLrEuARQrLbCDLLEAPSuwPistsIQssQA9K7A/Ky2whSyxAD0rsEArLbCGLLEBPSuwPistsIcssQE9K7A/Ky2wiCyxAT0rsEArLbCJLLMJBAIDRVghGyMhWUIrsAhlsAMkUHixBQEVRVgwWS0AAAAAS7gAyFJYsQEBjlmwAbkIAAgAY3CxAAdCswAeAgAqsQAHQrUjAhEKAggqsQAHQrUlABsGAggqsQAJQrsJAASAAAIACSqxAAtCuwBAAMAAAgAJKrEDAESxJAGIUViwQIhYsQNkRLEmAYhRWLoIgAABBECIY1RYsQMARFlZWVm1JQAVBgIMKrgB/4WwBI2xAgBEswVkBgBERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0AHQBaAAcAFgAWAk4BugJO/sECTgJO/sH+gwJO/r0CTgJO/r3+gAAYABgAGAAYAAAAAAAJAHIAAwABBAkAAACMAAAAAwABBAkAAQA8AIwAAwABBAkAAgAOAMgAAwABBAkAAwBaANYAAwABBAkABABMATAAAwABBAkABQBCAXwAAwABBAkABgBEAb4AAwABBAkADQEgAgIAAwABBAkADgA0AyIAQwBvAHAAeQByAGkAZwBoAHQAIAAyADAAMQA3ACAAVABoAGUAIABMAGkAYgByAGUAIABCAGEAcgBjAG8AZABlACAAUAByAG8AagBlAGMAdAAgAEEAdQB0AGgAbwByAHMAIAAoAGwAYQBzAHMAZQBAAGcAcgBhAHAAaABpAGMAbwByAGUALgBkAGUAKQBMAGkAYgByAGUAIABCAGEAcgBjAG8AZABlACAAMwA5ACAARQB4AHQAZQBuAGQAZQBkACAAVABlAHgAdABSAGUAZwB1AGwAYQByADEALgAwADAAMgA7AEcAUgBDAFIAOwBMAGkAYgByAGUAQgBhAHIAYwBvAGQAZQAzADkARQB4AHQAZQBuAGQAZQBkAFQAZQB4AHQALQBSAGUAZwB1AGwAYQByAEwAaQBiAHIAZQAgAEIAYQByAGMAbwBkAGUAIAAzADkAIABFAHgAdABlAG4AZABlAGQAIABUAGUAeAB0ACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyADsAIAB0AHQAZgBhAHUAdABvAGgAaQBuAHQAIAAoAHYAMQAuADYAKQBMAGkAYgByAGUAQgBhAHIAYwBvAGQAZQAzADkARQB4AHQAZQBuAGQAZQBkAFQAZQB4AHQALQBSAGUAZwB1AGwAYQByAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAQsAAAECAQMBBAEFAQYBBwEIAQkBCgELAQwBDQEOAQ8BEAERARIBEwEUARUBFgEXARgBGQEaARsBHAEdAR4BHwEgASEBIgEjASQBJQEmAScBKAEpASoBKwEsAS0BLgEvATABMQEyATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHAUgBSQFKAUsBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfAWABYQFiAWMBZAFlAWYBZwFoAWkBagFrAWwBbQFuAW8BcAFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfAF9AX4BfwGAAYEBggGDAYQBhQGGAYcBiAGJAYoBiwGMAY0BjgGPAZABkQGSAZMBlAGVAZYBlwGYAZkBmgGbAZwBnQGeAZ8BoAGhAaIBowGkAaUBpgGnAagBqQGqAasBrAGtAa4BrwGwAbEBsgGzAbQBtQG2AbcBuAG5AboBuwG8Ab0BvgG/AcABwQHCAcMBxAHFAcYBxwHIAckBygHLAcwBzQHOAc8B0AHRAdIB0wHUAdUB1gHXAdgB2QHaAdsB3AHdAd4B3wHgAeEB4gHjAeQB5QHmAecB6AHpAeoB6wHsAe0B7gHvAfAB8QHyAfMB9AH1AfYB9wH4AfkB+gH7AfwB/QH+Af8CAAIBAgICAwIEAgUCBgIHAggCCQIKAgsNYmVsb3cudW5pMDAyMQ1iZWxvdy51bmkwMDIyDWJlbG93LnVuaTAwMjMNYmVsb3cudW5pMDAyNA1iZWxvdy51bmkwMDI1DWJlbG93LnVuaTAwMjYNYmVsb3cudW5pMDAyNw1iZWxvdy51bmkwMDI4DWJlbG93LnVuaTAwMjkNYmVsb3cudW5pMDAyQg1iZWxvdy51bmkwMDJDDWJlbG93LnVuaTAwMkQNYmVsb3cudW5pMDAyRQ1iZWxvdy51bmkwMDJGDWJlbG93LnVuaTAwMzANYmVsb3cudW5pMDAzMQ1iZWxvdy51bmkwMDMyDWJlbG93LnVuaTAwMzMNYmVsb3cudW5pMDAzNA1iZWxvdy51bmkwMDM1DWJlbG93LnVuaTAwMzYNYmVsb3cudW5pMDAzNw1iZWxvdy51bmkwMDM4DWJlbG93LnVuaTAwMzkNYmVsb3cudW5pMDAzQQ1iZWxvdy51bmkwMDNCDWJlbG93LnVuaTAwM0MNYmVsb3cudW5pMDAzRA1iZWxvdy51bmkwMDNFDWJlbG93LnVuaTAwM0YNYmVsb3cudW5pMDA0MA1iZWxvdy51bmkwMDQxDWJlbG93LnVuaTAwNDINYmVsb3cudW5pMDA0Mw1iZWxvdy51bmkwMDQ0DWJlbG93LnVuaTAwNDUNYmVsb3cudW5pMDA0Ng1iZWxvdy51bmkwMDQ3DWJlbG93LnVuaTAwNDgNYmVsb3cudW5pMDA0OQ1iZWxvdy51bmkwMDRBDWJlbG93LnVuaTAwNEINYmVsb3cudW5pMDA0Qw1iZWxvdy51bmkwMDREDWJlbG93LnVuaTAwNEUNYmVsb3cudW5pMDA0Rg1iZWxvdy51bmkwMDUwDWJlbG93LnVuaTAwNTENYmVsb3cudW5pMDA1Mg1iZWxvdy51bmkwMDUzDWJlbG93LnVuaTAwNTQNYmVsb3cudW5pMDA1NQ1iZWxvdy51bmkwMDU2DWJlbG93LnVuaTAwNTcNYmVsb3cudW5pMDA1OA1iZWxvdy51bmkwMDU5DWJlbG93LnVuaTAwNUENYmVsb3cudW5pMDA1Qg1iZWxvdy51bmkwMDVDDWJlbG93LnVuaTAwNUQNYmVsb3cudW5pMDA1RQ1iZWxvdy51bmkwMDVGDWJlbG93LnVuaTAwNjANYmVsb3cudW5pMDA2MQ1iZWxvdy51bmkwMDYyDWJlbG93LnVuaTAwNjMNYmVsb3cudW5pMDA2NA1iZWxvdy51bmkwMDY1DWJlbG93LnVuaTAwNjYNYmVsb3cudW5pMDA2Nw1iZWxvdy51bmkwMDY4DWJlbG93LnVuaTAwNjkNYmVsb3cudW5pMDA2QQ1iZWxvdy51bmkwMDZCDWJlbG93LnVuaTAwNkMNYmVsb3cudW5pMDA2RA1iZWxvdy51bmkwMDZFDWJlbG93LnVuaTAwNkYNYmVsb3cudW5pMDA3MA1iZWxvdy51bmkwMDcxDWJlbG93LnVuaTAwNzINYmVsb3cudW5pMDA3Mw1iZWxvdy51bmkwMDc0DWJlbG93LnVuaTAwNzUNYmVsb3cudW5pMDA3Ng1iZWxvdy51bmkwMDc3DWJlbG93LnVuaTAwNzgNYmVsb3cudW5pMDA3OQ1iZWxvdy51bmkwMDdBDWJlbG93LnVuaTAwN0INYmVsb3cudW5pMDA3Qw1iZWxvdy51bmkwMDdEDWJlbG93LnVuaTAwN0UGY29kZS5BBmNvZGUuQgZjb2RlLkMGY29kZS5EBmNvZGUuRQZjb2RlLkYGY29kZS5HBmNvZGUuSAZjb2RlLkkGY29kZS5KBmNvZGUuSwZjb2RlLkwGY29kZS5NBmNvZGUuTgZjb2RlLk8GY29kZS5QBmNvZGUuUQZjb2RlLlIGY29kZS5TBmNvZGUuVAZjb2RlLlUGY29kZS5WBmNvZGUuVwZjb2RlLlgGY29kZS5ZBmNvZGUuWgtjb2RlLmRvbGxhcgpjb2RlLmVpZ2h0CWNvZGUuZml2ZQljb2RlLmZvdXIKY29kZS5taW51cwljb2RlLm5pbmUIY29kZS5vbmUMY29kZS5wZXJjZW50C2NvZGUucGVyaW9kCWNvZGUucGx1cwpjb2RlLnNldmVuCGNvZGUuc2l4CmNvZGUuc2xhc2gKY29kZS5zcGFjZQ5jb2RlLnN0YXJ0c3RvcApjb2RlLnRocmVlCGNvZGUudHdvCWNvZGUuemVybwd1bmkwMDAwB3VuaTAwMDEHdW5pMDAwMgd1bmkwMDAzB3VuaTAwMDQHdW5pMDAwNQd1bmkwMDA2B3VuaTAwMDcHdW5pMDAwOAd1bmkwMDA5B3VuaTAwMEEHdW5pMDAwQgd1bmkwMDBDB3VuaTAwMEQHdW5pMDAwRQd1bmkwMDBGB3VuaTAwMTAHdW5pMDAxMQd1bmkwMDEyB3VuaTAwMTMHdW5pMDAxNAd1bmkwMDE1B3VuaTAwMTYHdW5pMDAxNwd1bmkwMDE4B3VuaTAwMTkHdW5pMDAxQQd1bmkwMDFCB3VuaTAwMUMHdW5pMDAxRAd1bmkwMDFFB3VuaTAwMUYHdW5pMDAyMAd1bmkwMDIxB3VuaTAwMjIHdW5pMDAyMwd1bmkwMDI0B3VuaTAwMjUHdW5pMDAyNgd1bmkwMDI3B3VuaTAwMjgHdW5pMDAyOQd1bmkwMDJBB3VuaTAwMkIHdW5pMDAyQwd1bmkwMDJEB3VuaTAwMkUHdW5pMDAyRgd1bmkwMDMwB3VuaTAwMzEHdW5pMDAzMgd1bmkwMDMzB3VuaTAwMzQHdW5pMDAzNQd1bmkwMDM2B3VuaTAwMzcHdW5pMDAzOAd1bmkwMDM5B3VuaTAwM0EHdW5pMDAzQgd1bmkwMDNDB3VuaTAwM0QHdW5pMDAzRQd1bmkwMDNGB3VuaTAwNDAHdW5pMDA0MQd1bmkwMDQyB3VuaTAwNDMHdW5pMDA0NAd1bmkwMDQ1B3VuaTAwNDYHdW5pMDA0Nwd1bmkwMDQ4B3VuaTAwNDkHdW5pMDA0QQd1bmkwMDRCB3VuaTAwNEMHdW5pMDA0RAd1bmkwMDRFB3VuaTAwNEYHdW5pMDA1MAd1bmkwMDUxB3VuaTAwNTIHdW5pMDA1Mwd1bmkwMDU0B3VuaTAwNTUHdW5pMDA1Ngd1bmkwMDU3B3VuaTAwNTgHdW5pMDA1OQd1bmkwMDVBB3VuaTAwNUIHdW5pMDA1Qwd1bmkwMDVEB3VuaTAwNUUHdW5pMDA1Rgd1bmkwMDYwB3VuaTAwNjEHdW5pMDA2Mgd1bmkwMDYzB3VuaTAwNjQHdW5pMDA2NQd1bmkwMDY2B3VuaTAwNjcHdW5pMDA2OAd1bmkwMDY5B3VuaTAwNkEHdW5pMDA2Qgd1bmkwMDZDB3VuaTAwNkQHdW5pMDA2RQd1bmkwMDZGB3VuaTAwNzAHdW5pMDA3MQd1bmkwMDcyB3VuaTAwNzMHdW5pMDA3NAd1bmkwMDc1B3VuaTAwNzYHdW5pMDA3Nwd1bmkwMDc4B3VuaTAwNzkHdW5pMDA3QQd1bmkwMDdCB3VuaTAwN0MHdW5pMDA3RAd1bmkwMDdFB3VuaTAwN0YHdW5pMDBBMAAAAQAB//8ADw==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
