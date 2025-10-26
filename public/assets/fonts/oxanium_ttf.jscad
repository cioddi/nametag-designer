(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.oxanium_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ABQAHkASEg4QAgcGCBACBwQUAgEKDBAAAD8zyT/JMisrMDcTIRUhFSEVIRUhFSE1IQcjNzMRIxTiAlL+sAEy/s4BUP5c/vo5RZftdRICoEzWTPhMrq76AWwA//8AUP9MAjACshImACYAABAHATICcgAA//8AWgAAAhwDlhImACgAABAHAWgCfAAA//8AWgAAAhwDlhImACgAABAHAWkCfAAA//8AWgAAAhwDlhImACgAABAHAWoCfAAA//8AWgAAAhwDXhImACgAABAHAW8CfAAA//8ADgAAAMIDlhImACwAABAHAWgBxAAA//8ARgAAAPoDlhImACwAABAHAWkBxAAA////+gAAAQ4DlhImACwAABAHAWoBxAAA//8AAgAAAQYDXhImACwAABAHAW8BxAAAAAIAFAAAAmwCsgALABcAGEANFwIVAAoEBxMEAQ0KAAA/yT/JKzMyMBM1MxEhMhUVFCMhERczMjURNCMjFTMVIxRQASjg4P7YVNSMjNSwsAE4QgE44PLgATjsjAECjOxC//8AWgAAAnYDahImADEAABAHAWsCrgAA//8AUAAAAmwDlhImADIAABAHAWgCngAA//8AUAAAAmwDlhImADIAABAHAWkCngAA//8AUAAAAmwDlhImADIAABAHAWoCngAA//8AUAAAAmwDahImADIAABAHAWsCngAA//8AUAAAAmwDXhImADIAABAHAW8CngAAAAEAVACCAe4CHAALAAmxBwEAGS8YMzA3Nyc3FzcXBxcHJwdUm5sym5sym5sym5u0m5sym5sym5sym5sAAAMAUAAAAmwCsgALABIAGQAWQAoNGRAEARMMFgoAAD/JMjI/yTIyMDcRNDMzMhURFCMjIjcBJiMjIhUTFjMzMjURUJnqmZnqmVQBcwQ/7EQBBD/sRJkBgJmZ/oCZ3QFOO0T+ZTtEAUX//wBUAAACXAOWEiYAOAAAEAcBaAKYAAD//wBUAAACXAOWEiYAOAAAEAcBaQKYAAD//wBUAAACXAOWEiYAOAAAEAcBagKYAAD//wBUAAACXANeEiYAOAAAEAcBbwKYAAD//wAUAAACMAOWEiYAPAAAEAcBaQJiAAAAAgBaAAACOgKyAAsAEwAWQA4NCgACBwQTAAIHAgEAAAA/PysrMDMRMxUzMhUVFCMjFTUzMjU1NCMjWlTzmZnz9ERE9AKyeJmCmYbSRJREAAABAFAAAAISAuQAJQAaQA4KHBoABAcAIgQFFBEAAAA/M8k/yRIrOTAzETQzMzIVFRQHBxcWFRUUIyMnNTMyNTU0IyM1MzI1NTQjIyIVEVCWgpYUIyohlloogkZGeGRGRoJGAk6WlmMiGCojHDR+lh4oRoxGRkZuRkb9qAD//wA0AAAB0gL2EiYARAAAEAcBJgIuAAD//wA0AAAB0gL2EiYARAAAEAcBJwIuAAD//wA0AAAB0gL2EiYARAAAEAcBKAIuAAD//wA0AAAB0gLKEiYARAAAEAcBKQIuAAD//wA0AAAB0gK+EiYARAAAEAcBLQIuAAD//wA0AAAB0gMAEiYARAAAEAcBLgIuAAAAAwA0AAADIgIIAB8AKQAxACZAFisUABAHBCcAEAcNLwgLEAIdIxgbAAAAPzPJMjk/M8kyOSsrMDMiEDMzNTQjIzU3MzIXNjMzMhUVIRUUMzMVByMiJwYjJxQzMzI1NSMiFSUhNTQjIyIVy5eXs0bSKKpGKChGeJb+rEb6KNJGKChGtEZuRrRGAUoBBEZ4RgEuTkYoHigolpBWRigeKCiMRkZcRoZURkb//wBI/0wBygIIEiYARgAAEAcBMgI6AAD//wBIAAAB9gL2EiYASAAAEAcBJgI9AAD//wBIAAAB9gL2EiYASAAAEAcBJwI9AAD//wBIAAAB9gL2EiYASAAAEAcBKAI9AAD//wBIAAAB9gK+EiYASAAAEAcBLQI9AAD//wACAAAAtgL2EiYA4QAAEAcBJgGWAAD//wA6AAAA7gL2EiYA4QAAEAcBJwGWAAD////uAAABAgL2EiYA4QAAEAcBKAGWAAD////2AAAA+gK+EiYA4QAAEAcBLQGWAAAAAgBIAAACAALuABYAIAAUQAsPBB4VCgcKBRoVAAA/yT8rOTA3NTQzMycHJzcnNxc3FwcXFhUVFCMjIjcUMzMyNTUjIhVIlrRObRpmNUA6ahpjVSKWjJZQRoxG0kaWlpZ7NDgxUylbMjgvhzY11paMRkbwRv//AFAAAAH+AsoSJgBRAAAQBwEpAkUAAP//AEgAAAIAAvYSJgBSAAAQBwEmAkIAAP//AEgAAAIAAvYSJgBSAAAQBwEnAkIAAP//AEgAAAIAAvYSJgBSAAAQBwEoAkIAAP//AEgAAAIAAsoSJgBSAAAQBwEpAkIAAP//AEgAAAIAAr4SJgBSAAAQBwEtAkIAAAADAEAAZAICAjoAAwAHAAsADLQEAAoCBAArzNnMMBM1IRUFNTMVAzUzFUABwv7yWlpaASxGRshaWgF8WloAAAMASAAAAgACCAALABIAGQAWQAoNGRAEAhMMFgoAAD/JMjI/yTIyMDc1NDMzMhUVFCMjIjclJiMjIhUTFjMzMjU1SJaMlpaMllABEBAujEYIEC6MRpbclpbclq71H0b+6R9Gzv//AEwAAAH6AvYSJgBYAAAQBwEmAkEAAP//AEwAAAH6AvYSJgBYAAAQBwEnAkEAAP//AEwAAAH6AvYSJgBYAAAQBwEoAkEAAP//AEwAAAH6Ar4SJgBYAAAQBwEtAkEAAP//ABT/OAH0AvYSJgBcAAAQBwEnAiIAAAACAFD/OAH+AuQACwATABRACgAGAgUTBAINCgAAP8k/yT8/MBcRMxUzMhUVFCMjFREzMjU1NCMjUFDIlpbIyEZGyMgDrNyW3JbIAQ5G8EYA//8AFP84AfQCvhImAFwAABAHAS0CIgAA//8AFAAAAmIDURImACQAABAHAWwCewAA//8ANAAAAdICsRImAEQAABAHASoCLgAA//8AFAAAAmIDeBImACQAABAHAW0CewAA//8ANAAAAdIC2BImAEQAABAHASsCLgAA//8AFP9MAmICshImACQAABAHATMDCgAA//8ANP9MAdICCBImAEQAABAHATMCegAA//8AUAAAAjADlhImACYAABAHAWkClAAA//8ASAAAAcoC9hImAEYAABAHAScCOgAA//8AUAAAAjADjBImACYAABAHAXIClAAA//8ASAAAAcoC7BImAEYAABAHATACOgAA//8AWgAAAmIDjBImACcAABAHAXICigAA//8ASAAAApAC+BAmAEcAABAHAWYCXAAA//8AFAAAAmwCshIGAJIAAAACAEgAAAI8AuQAEQAZABtADw4IDAYECgcKBRcEAhUQAAA/yT/JPyszMjA3NTQzMzUjNTM1MxUzFSMRISI3FDMzESMiFUiWyLS0UEZG/uiWUEbIyEaW3JZQPFBQPP2ojEYBfEb//wBaAAACHANREiYAKAAAEAcBbAJ8AAD//wBIAAAB9gKxEiYASAAAEAcBKgI9AAD//wBaAAACHANiEiYAKAAAEAcBbgJ8AAD//wBIAAAB9gLCEiYASAAAEAcBLAI9AAD//wBa/0wCHAKyEiYAKAAAEAcBMwLEAAD//wBI/0wB9gIIEiYASAAAEAcBMwKAAAD//wBaAAACHAOMEiYAKAAAEAcBcgJ8AAD//wBIAAAB9gLsEiYASAAAEAcBMAI9AAD//wBQAAACWAN4EiYAKgAAEAcBbQKUAAD//wBI/zgB9gLYEiYASgAAEAcBKwI9AAD//wBQ/zgCWAKyEiYAKgAAEAcBMQJyAAD//wBI/zgB9gLoEiYASgAAEAcBZwEfAAD//wACAAABBgNREiYALAAAEAcBbAHEAAD////2AAAA+gKxEiYA4QAAEAcBKgGWAAD//wAK/0wAygKyEiYALAAAEAcBMwFyAAD//wAA/0wAwALCEiYATAAAEAcBMwFoAAD//wBaAAAArgNiEiYALAAAEAcBbgHEAAAAAQBQAAAAoAIIAAMACbMCAgAAAD8/MDMRMxFQUAII/fgA//8AWv84AlgCshImAC4AABAHATECXgAA//8AUP84AfQC5BImAE4AABAHATECLAAA//8AUAAAAf4DlhImAC8AABAHAWkBzgAA//8ANv/4AOoDyhImAE8AABAHAScBkgDU//8AWv84Af4CshImAC8AABAHATECSgAA//8ATP84AOIC5BImAE8AABAHATEBuQAA//8AWgAAAf4CxhImAC8AABAHAWYBXP/O//8ATP/4ATYC+BAmAE8AABAHAWYBAgAAAAEACgAAAggCsgANABVACwEEBwwECwMBCQsAAD/JPxIXOTATNxEzETcXBxUhFSERBwpaVIghqQFQ/lw5ARs0AWP+zU85YehMAQMhAAABAAP/+AEPAuQADwAbQA0BBAcOBAsDBQ0ICgsAAD0/GDMzMz8SFzkwEzcRMxE3FwcVFBcVIjU1BwNTUEofaUaWNAFPMAFl/skrNjzgRARGlqofAP//AFoAAAJ2A5YSJgAxAAAQBwFpAq4AAP//AFAAAAH+AvYSJgBRAAAQBwEnAkUAAP//AFr/OAJ2ArISJgAxAAAQBwExAoAAAP//AFD/OAH+AggSJgBRAAAQBwExAkUAAP//AFoAAAJ2A4wSJgAxAAAQBwFyAq4AAP//AFAAAAH+AuwSJgBRAAAQBwEwAkUAAP//AFAAAAJsA1ESJgAyAAAQBwFsAp4AAP//AEgAAAIAArESJgBSAAAQBwEqAkIAAP//AFAAAAJsA5YSJgAyAAAQBwFxAp4AAP//AEgAAAIAAvYSJgBSAAAQBwEvAkIAAAACAFAAAAOQArIADwAXABhADQgKDgQHBhUEARMMDgAAP8kyP8kyKzA3ETQzIRUhFSEVIRUhFSEiNxQzIREhIhVQmQKn/rABMv7OAVD9WZlURAEE/vxEmQGAmUzWTPhMkEQCGkQAAwBIAAADSgIIABoAJgAuACBAESgNGQkHBiwkBAkCFh4RFBkAAD8zyTI5PzPJMjkrMDc1NDMzMhc2MzMyFRUhFRQzMxUHIyInBiMjIjcUMzMyNTU0IyMiFQUhNTQjIyIVSJaCRigoRniW/qxG+ijSRigoRoKWUEaCRkaCRgFeAQRGeEaW3JYoKJaQVkYoHigojEZG8EZGVFRGRgD//wBaAAACTgOWEiYANQAAEAcBaQJ8AAD//wBMAAABWgL2EiYAVQAAEAcBJwHuAAD//wBa/zgCTgKyEiYANQAAEAcBMQJaAAD//wAu/zgBWgIIEiYAVQAAEAcBMQGSAAD//wBaAAACTgOMEiYANQAAEAcBcgJ8AAD//wBGAAABWgLsEiYAVQAAEAcBMAHuAAD//wA8AAACCAOWEiYANgAAEAcBaQJiAAD//wA8AAABuAL2EiYAVgAAEAcBJwIYAAD//wA8/0wCCAKyEiYANgAAEAcBMgJAAAD//wA8/0wBuAIIEiYAVgAAEAcBMgIYAAD//wA8AAACCAOMEiYANgAAEAcBcgJiAAD//wA8AAABuALsEiYAVgAAEAcBMAIYAAD//wAY/0wCOAKyEiYANwAAEAcBMgJGAAD//wBM/0wBZAKyEiYAVwAAEAcBMgH+AAD//wAYAAACOAOMEiYANwAAEAcBcgJoAAD//wBMAAABZAMCEiYAVwAAEAcBZgEWAAr//wBUAAACXANREiYAOAAAEAcBbAKYAAD//wBMAAAB+gKxEiYAWAAAEAcBKgJBAAD//wBUAAACXAOgEiYAOAAAEAcBcAKYAAD//wBMAAAB+gMAEiYAWAAAEAcBLgJBAAD//wBUAAACXAOWEiYAOAAAEAcBcQKYAAD//wBMAAAB+gL2EiYAWAAAEAcBLwJBAAD//wBU/0wCXAKyEiYAOAAAEAcBMwKcAAD//wBM/0wB+gIIEiYAWAAAEAcBMwKiAAD//wAUAAACMANeEiYAPAAAEAcBbwJiAAD//wAyAAACJgOWEiYAPQAAEAcBaQJsAAD//wAyAAABzAL2EiYAXQAAEAcBJwIdAAD//wAyAAACJgNiEiYAPQAAEAcBbgJsAAD//wAyAAABzALCEiYAXQAAEAcBLAIdAAD//wAyAAACJgOMEiYAPQAAEAcBcgJsAAD//wAyAAABzALsEiYAXQAAEAcBMAIdAAAAAQAo/3QB1gLkABUAEbcBFAoHBRAOAgA/yT/JL8kwFzMyNRE0MzMXFSMiFRUzFSMRFCMjJyhQRpZaKIJGvr6WKChGRgJOlh4oRlBG/kiWHv//ADz/OAIIArISJgA2AAAQBwExAkAAAP//ADz/OAG4AggSJgBWAAAQBwExAhgAAP//ABj/OAI4ArISJgA3AAAQBwExAkYAAP//AEz/OAFkArISJgBXAAAQBwExAf4AAAAB//j/MACgAggABwAPtgQCAAIFBwYAPzMzMz8wBzY1ETMRFCMIWFCoigRWAjj90KgA//8AcAJGAYQC9hAHASgCGAAA//8AcAI8AYQC7BAHATACGAAA//8AeAJxAXwCsRAHASoCGAAA//8AfQJWAXcC2BAHASsCGAAA//8A0AJmASQCwhAHASwCGAAA//8AlAI8AWADABAHAS4CGAAA//8AsP9MAXAAOhAHATMCGAAA//8AXwJSAZUCyhAHASkCGAAA//8AegI8AcUC9hAHAS8CGAAAAAH+bAI8/yAC9gADAAu1AQADAgoFACsrMAE3Fwf+bDSAKwLFMZEpAAAB/qQCPP9YAvYAAwALtQEAAwIKBQArKzABNxcH/qSANIkCZZExiQAAAf5YAkb/bAL2AAUAEkAJBAUBAAMFAgoFACsyKxE5MAE3FwcnB/5YioonY2MCb4eHKV5eAAH+RwJS/30CygATABpADRAKCQMAgAYAEw0CCgUAKzIyMhorMjIyMAE3NjIXFxYyNzcXBwYiJycmIgcH/kc2FjoWIAgSCDEnNhY6FiAIEggxAn42FhYgCAgxJzYWFiAICDEAAf5gAnH/ZAKxAAMACrQCAAIKBQAryTABNSEV/mABBAJxQEAAAf5lAlb/XwLYAA8AD7cCCgAGDgIKBQArySsyMAE1MxUUMzMyNTUzFRQjIyL+ZTYSahI2SGpIAp46OhISOjpIAAH+uAJm/wwCwgADAAu1AgAAAgoFACsrMAE1MxX+uFQCZlxcAAL+YAJm/2QCvgADAAcAD7cGAgAEAAIKBQArMisyMAE1MxUzNTMV/mBQZFACZlhYWFgAAv58Ajz/SAMAAAsAFwAPtxUEAA8KAgoFACvJK8kwATU0MzMyFRUUIyMiNxQzMzI1NTQjIyIV/nxGQEZGQEY0FDwUFDwUAoI4RkY4RkIUFEAUFAAAAv5iAjz/rQL2AAMABwAPtwUBAAcDAgoFACsyKzIwATcXBzc3Fwf+YnA2enlwNnoCYZUsjiWVLI4AAAH+WAI8/2wC7AAFABJACQIFAwEABQIKBQArKzIROTABNxc3Fwf+WCdjYyeKAsMpXl4phwAB/pz/OP8M/84ABAAKswQAAgUAL94rMAU3MxcH/pwgRwk4uIYOiAAAAf50/0z/OAAjAAoAC7MJAQsFAC4v3skwBTMyNTUzFRQjIyf+dGQgQGRAIHogfXNkGQAB/pj/TP9YADoAEAAMtA4LAgQAAD/J3skwBTQzMxUjIhUVFDMzFQcjIjX+mGQYHCAgYCA8ZCpkOiA6ICEZZAAAAQBQAAAB/gIIAAcADbUGAgIEAAAAPzM/yTAzESERIxEhEVABrlD+8gII/fgBwv4+AAABAFQAAAJwArIAHAAaQA4XBxYABAcFGQQBEA0AAAA/M8k/yTkrMzAzETQzIRUHMzIVFRQjIyc1MzI1NTQjIzU3IyIVEVSZAUeoS5mZmC3GRESyqOJEAhmZQ9+ZXpkjKURwREPfRP3eAAEAKAEOAhwBVAADAAiyAAIEACvJMBM1IRUoAfQBDkZGAAABACgBDgPAAVQAAwAIsgACBAAryTATNSEVKAOYAQ5GRgAAAQA8AfQA0gLuAAQACbMEAAEFAD8rMBM3FwcjPFo8O1ICAuwP6wABADgB6gDOAuQABAAJswQAAgUAPyswEzczFwc4O1IJWgH56w7sAAEAIP90ALYAbgAEAAu0BAACAgUALysrMBc3MxcHIDtSCVp96w7sAP//ADwB9AGGAu4QJgE4AAAQBwE4ALQAAP//ADgB6gGCAuQQJgE5AAAQBwE5ALQAAP//ACD/dAFqAG4QJgE6AAAQBwE6ALQAAAABADL/nAG4ArIACwATQAoIAgYACgQHBAEKAC8/KzMyMBM1MzUzFTMVIxEjETKeSp6eSgGkRsjIRv34AggAAAEAMv+cAbgCsgATAB1AERACDgASCAcMBgoEEggHCAESAC8/KzMyKzMyMDc1MzUjNTM1MxUzFSMVMxUjFSM1Mp6enkqenp6eSmRG+kbIyEb6RsjIAAEAUAEEARgBzAADAAiyAgAAAC8rMBM1MxVQyAEEyMj//wBQAAACvABuECYAEQAAECcAEQEEAAAQBwARAggAAP//ACgAAASSArIQJgFGAAAQJwFFAWgAABAnAUgB9AAAEAcBSANSAAAAAQAeAFoBBAIcAAUAB7AAABkvGDATNxcHFwceszONjTMBO+Eqt7cqAAEAKABaAQ4CHAAFAAewBAAZLxgwNzcnNxcHKI2NM7OzhLe3KuHhAAAB/4MAAAEJArIAAwAJswEBAwAAPz8wJwEXAX0BSjz+th4ClB79bAAAAgAoARgBQAKyAAsAFwAOtg8KAwMVBAEAP8kryTATNTQzMzIVFRQjIyI3FDMzMjU1NCMjIhUoZFBkZFBkQCBYICBYIAF80mRk0mRaICDmICAAAAEAKAEYAUACsgALABhADwEGAAoDBwgKAwYKAwMDAQA/KysrMzATNRMzFwMzNTMRIzUohjgIfY9AQAFgNQEdDv72gv78SP//ACgAAAFAAZoTBwFGAAD+6AAMtAEACgoYABA8ETU1//8AOgAAAToBmhMHAHsAAP7oAAqzAAAACwAQPBE1//8AKAAAAUABmhMHAHQAAP7oAAqzAAAAGQAQPBE1//8ALgAAAUABmhMHAHUAAP7oAAqzACAgIQAQPBE1//8AKAAAAUABmhMHAUcAAP7oAAqzAAoKDAAQPBE1AAEAIgAAAhYCsgAhACJAEhcAAhUBBhETBB4KBg0KARseAAA/yT/JKzPJMisyyTIwNzUzNSM1MzU0MzMXFSEiFRUhFSEVMxUjFRQzIRUHIyI1NSJGRkaZ6C3+6kQBEP7w5OREARYt6Jn1Pkw+XJkjKURlPkw+ZUQpI5lcAAABABgAAAIMArIAGwAYQA0VBQgBDBUFGQcBERkAAD/JPxIXOS8wEzc1Byc3NTMVNxcHFTcXBxUzMjU1MxUUIyMRBxhkTRdkVL4X1b4X1UelUPqWTQEwKEkfOijOrEw6VUlMOlXrpTsy+gEVHwACACwAAAIMArIAFQAdACBAERIAAhABBhcOBBQIBh0IARQAAD8/ySszyTIrMskyMDc1MzUjNTMRITIVFRQjIxUzFSMVIzU3MzI1NTQjIywyMjIBFZmZwdzcVFTCRETCrkJGRgE2mUqZRkKurs5EYkT//wBM//gA4gLkEgYATwAAAAIAFAFUAtICsgAHABQAH0AQCxIQEwQCCA8GAAQACg0CAQA/MzPJMisyMhEXOTATNSEVIxEjERMRMxc3MxEjNQcjJxUUARxwPN5LbW1LPGE2YQJ8Njb+2AEo/tgBXunp/qL7z8/7AAEAPAAAAoACsgAhABZAChoJARMgAhASAAAAPzPJMjk5P8kwMzUzJyY1ETQzMzIVERQHBzMVIzU3NjURNCMjIhURFBcXFTyASyGZ6pkhS4DmZhhE7EQYZkxkLDgBBZmZ/vs4LGRMRIggKAEORET+8iggiEQAAgA8//EDNALBAA0AEwAUQAsPBg0DBxIDAQkNAAA/yT/JKzA2EDYgFhUhFRYgNxcGIAMhNSYgBzzfATrf/ZRpAQ5wIHr+xlMB4Gn+8mnEASrT06nGZmwhcwF8xmZmAAIASAAAAfYC5AASABwAFEALBBoRCwcICwUWEQAAP8k/ySswNzU0MzM1NCMjNTczMhURFCMjIjcUMzMyNTUjIhVIlsiOpCh64JaCllBGgkbIRpaglkSOKB7g/pKWjEZG+kYAAgAUAAACbAKyAAUACQANtQkCAQcFAAA/yT/JMDcTMxMHITchAyMU54rnDP3AXQGGtxgSAqD9YBJMAhoAAQBa/5wCYgKyAAcADLQEAAYCAQA/yS8zMBcRIREjESERWgIIVP6gZAMW/OoCyv02AAABADL/nAISArIACwAQtgIGBAEACQsAL8k5P8k5MBcTAzUhFSETAyEVITLm5gHg/obf3wF6/iAhAUgBSENM/sH+wUwAAAEAQAEsAgIBcgADAAiyAAIEACvJMBM1IRVAAcIBLEZGAP///4MAAAEJArISBgFFAAD//wBQARgAtAGGEgcAEQAAARgAAQAU//YCRAMWAAgADrUEAAIDBwAAPzMvyS4wEzUzExMXASMDFJNq9D/+8Ep3AVBA/sQCwhb89gFaAAMAKAC5AjoB5QAVACEALQAZQAsGKx8ECQARGSUPFAAvM8kyOSsyyTI5MBM1NDMzMhc2MzMyFRUUIyMiJwYjIyI3FDMzMjU1NCMjIhUXFDMzMjU1NCMjIhUoZF0mIiImXWRkXSYiIiZdZEAgaSAgaSDpIGkgIGkgAR1kZCIiZGRkIiJaICB4ICB4ICB4ICAAAAEAFP84AZAC5AARAA21ARAGCgcFAD/JP8kwFzMyNRE0MzMXFSMiFREUIyMnFFBGligoUEaWKCiCRgKKlh4oRv12lh7//wAxAIcCEQIXEiYAYQCSEAYAYQBuAAEAQABBAgICXQATABO3DAQGChAAAg4ALzPJMtwyyTIwNzUzNyM1ITcXBzMVIwczFSEHJzdAl0zjAQc/OTBzl0zj/vk/OTC+RpZGfR1gRpZGfR1gAAIAQAAAAgICUwADAAoADLMIAgAAAD/JGS8YMDM1IRUBNSUXBQUHQAHC/j4BpB7+hgF6HkZGATxOyT+xsT8AAgBAAAACAgJTAAMACgAMswUCAAAAP8kZLxgwMzUhFS0CNwUVBUABwv4+AXr+hh4BpP5cRkaysbE/yU7JAAACADYAAAIMArIABQAJAA21CQIBBwUAAD8zPzMwExMzEwMjAxMTAzbGSsbGSnyhoaEBWQFZ/qf+pwFZ/ucBGQEZAAABADIAVQKKAl0AAgAOtQEAAgEAAgAvPC88EDwTIQEyAlj+1AJd/fj//wBQAAACHgLkECYASQAAEAcATAF8AAD//wBQ//gCXgLkECYASQAAEAcATwF8AAAAAf/MAkQANAL4AAQACLICAAQALyswAzczFwc0Ij0JNwJQqA6mAAAB/+ACUgBQAugABAAIsgEABAAvKzADNxcHIyA4OCBHAmCIEIYAAAH+SgLc/v4DlgADAAu1AQADAQkFACsrMAE3Fwf+SjSAKwNlMZEpAAAB/oIC3P82A5YAAwALtQEAAwEJBQArKzABNxcH/oKANIkDBZExiQAAAf42Aub/SgOWAAUAEkAJBAUBAAMFAQkFACsyKxE5MAE3FwcnB/42ioonY2MDD4eHKV5eAAH+JQLy/1sDagATABpADRAKCQMAgAYAEw0BCQUAKzIyMhorMjIyMAE3NjIXFxYyNzcXBwYiJycmIgcH/iU2FjoWIAgSCDEnNhY6FiAIEggxAx42FhYgCAgxJzYWFiAICDEAAf4+AxH/QgNRAAMACrQCAAEJBQAryTABNSEV/j4BBAMRQEAAAf5DAvb/PQN4AA8AD7cCCgAGDgEJBQArySsyMAE1MxUUMzMyNTUzFRQjIyL+QzYSahI2SGpIAz46OhISOjpIAAH+lgMG/uoDYgADAAu1AgAAAQkFACsrMAE1MxX+llQDBlxcAAL+PgMG/0IDXgADAAcAD7cGAgAEAAEJBQArMisyMAE1MxUzNTMV/j5QZFADBlhYWFgAAv5aAtz/JgOgAAsAFwAPtxUEAA8KAQkFACvJK8kwATU0MzMyFRUUIyMiNxQzMzI1NTQjIyIV/lpGQEZGQEY0FDwUFDwUAyI4RkY4RkIUFEAUFAAAAv5AAtz/iwOWAAMABwAPtwUBAAcDAQkFACsyKzIwATcXBzc3Fwf+QHA2enlwNnoDAZUsjiWVLI4AAAH+NgLc/0oDjAAFABJACQIFAwEABQEJBQArKzIROTABNxc3Fwf+NidjYyeKA2MpXl4phwADAEAAAAICArIACwAXABsAFEALGhgKBAcVBAEPCgAAP8k/ySswNxE0MzMyFREUIyMiNxQzMzI1ETQjIyIVEzUzFUCZkJmZkJlURJJERJJEX1yZAYCZmf6AmZBERAGSRET++3h4AP//AFwAAAH2ArISBgAUAAD//wBAAAACAgKyEgYAFwAA//8AQAAAAgICshIGABoAAAABAAABdwAyAAQATAAHAAIAAgAAAAgAAADAACoABAADAAAAGwAbABsAGwA0AEAAfgDDANMBDwEgATgBUAFwAYwBoAGxAcEB1AH9AhgCSgKBAqQCzgL/AxwDaAOaA6YDsgPJA+ED+AQmBGAEhwS+BOIFAgUiBT8FagWLBZwFvwXnBfsGIQZBBmoGjwbBBu8HJwc/B18HfAepB9YH+AgWCC0IQAhXCG8IgAiJCLUI2Aj5CR4JTQltCZsJugnUCfYKHQo3CloKdgqeCsIK5wsBCzMLUwtwC40LuQviDAQMIgxODF8Miwy6DLoM1Q0EDTANYA2WDa8N/Q4GDkoOeA6EDpgOoA7vDvgPIA9FD3cPrg+3D9cP9Q/+EAcQJBBNEFkQaRB5EIkQuBDEENAQ3BDoEPQRABEzET8RSxFXEWMRbxF7EYcRkxGfEc8R2xHnEfMR/xILEhcSNRJpEnUSgRKNEpkSpRLNEwsTFxMjEy8TOxNHE1MTpxOzE78TyxPXE+MT7xP7FAcUExRNFFkUZRRxFH0UiRSVFLQU5hTyFP4VChUWFSIVShVWFWIVbhV6FYYVkhWeFaoVthXCFc4V2hXmFe4WIBYsFjgWRBZQFlwWaBZ0FoAWjBaYFqQWsBa8FsgW1BbgFuwW/RcJFxUXIRctFzkXRRdRF10XgxetF7kXxRfRF90X6Rf1GAEYDRgZGCUYVxilGLEYvRjJGNUY4RjtGPkZBRkRGR0ZKRk1GUEZTRlZGWUZcRl9GYkZlRmhGa0ZuRnFGdEZ3RnpGfUaARoNGhkaQRpNGlkaZRpxGooakxqcGqUarhq3GsAayRrSGtsa7xsDGx0bThtgG4AbkhurG9Ub8hwMHCAcORxZHHIcphy3HMgc2xzuHQIdDh0aHSYdRR1vHX8djx2jHbcdyx3fHggeKx47HkoeWR5oHncetR7rHyMfKx9eH5gfxx/4IBYgLyBRIGIgaiBzIJAg2CD6IQUhLyFOIW0hjiGiIa4huiHNIeAh9CIIIiIiUyJlIoUilyKwItoi9yMRI0QjTCNUI1wAAQAAAAEAQTV4erVfDzz1AB8D6AAAAADYUF4AAAAAANnVGOP+Jf8wBJIDygAAAAgAAgAAAAAAAAJKAF0AAAAAAPAAAADwAAABBABQAYYARgKeADICQgBFA1wAKAKUAEYA1gBGATYARgE2ABQB9AApAkIAQAEEACABaAAoAQQAUAGGABQCQgBAAkIAXAJCAEACQgBKAkIAQAJCADYCQgBAAkIAQAJCAEACQgBAAQQAUAEEACACQgBAAkIAQAJCAEAB9AAoAyAAWgJ2ABQChABaAmIAUAKoAFoCTgBaAjoAWgKeAFACvABaAQgAWgJcADwCdgBaAhYAWgNmAFoC0ABaArwAUAJ2AFoCvABQAoAAWgJEADwCUAAYArAAVAJsABQDmAAeAmIAHgJEABQCWAAyAVQAWgGGABQBVAAeAhwAKAJEACgB9ACEAh4ANAJGAFAB+ABIAkYASAI+AEgBfABQAkYASAJKAFAA8ABOAPD/+AIQAFABBABMA4AAUAJKAFACSABIAkYAUAJGAEgBdABMAfQAPAGIAEwCSgBMAggAFAMYABgCCAAeAggAFAH+ADIBfAAyARIAZAF8AB4CQgAxAPAAAAEEAFACQgBeAkIAQAJCADoCQgAeARIAZAIcAFAB9AB4A0gAUAGQACgB9AAeAkIAQAFoACgDSABQAfQAeAGaADwCQgBAAWgAKAFoAC4B9AC8AkoAUAJEAEYBBABQAfQAjAFoADoBrgAyAfQAKANKADoDfAA6AzQALgHgADICdgAUAnYAFAJ2ABQCdgAUAnYAFAJ2ABQDegAUAmIAUAJOAFoCTgBaAk4AWgJOAFoBCAAO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AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/nAAyAAAAAAAAAAAAAAAAAAAAAAAAAAABdwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMBBAEFAI0AlwCIAMMA3gEGAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBBwEIAQkBCgELAQwA/QD+AP8BAAENAQ4BDwEBARABEQESARMBFAEVARYBFwD4APkBGAEZARoBGwEcAR0A+gDXAR4BHwEgASEBIgEjASQBJQDiAOMBJgEnASgBKQEqASsBLAEtAS4BLwCwALEBMAExATIBMwE0ATUBNgE3APsA/ADkAOUBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMAuwFEAUUBRgFHAOYA5wCmAUgBSQFKAUsBTADYAOEBTQDbANwA3QDgANkA3wFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsAmwFcALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAIwAnwFoAJgAqACaAJkA7wFpAWoApQCSAJwApwCPAJQAlQC5AWsBbAFtAW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewF8AX0Bfgd1bmkwMEEwB3VuaTAwQUQHdW5pMDBCMgd1bmkwMEIzB3VuaTAwQjkHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrBkRjYXJvbgZkY2Fyb24GRGNyb2F0B0VtYWNyb24HZW1hY3JvbgpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24HdW5pMDEyMgd1bmkwMTIzB0ltYWNyb24HaW1hY3JvbgdJb2dvbmVrB2lvZ29uZWsHdW5pMDEzNgd1bmkwMTM3BkxhY3V0ZQZsYWN1dGUHdW5pMDEzQgd1bmkwMTNDBkxjYXJvbgZsY2Fyb24GTmFjdXRlBm5hY3V0ZQd1bmkwMTQ1B3VuaTAxNDYGTmNhcm9uBm5jYXJvbgdPbWFjcm9uB29tYWNyb24NT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUHdW5pMDE1Ngd1bmkwMTU3BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQd1bmkwMTYyB3VuaTAxNjMGVGNhcm9uBnRjYXJvbgdVbWFjcm9uB3VtYWNyb24FVXJpbmcFdXJpbmcNVWh1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0B1VvZ29uZWsHdW9nb25lawZaYWN1dGUGemFjdXRlClpkb3RhY2NlbnQKemRvdGFjY2VudAd1bmkwMjE4B3VuaTAyMTkHdW5pMDIxQQd1bmkwMjFCB3VuaTAyMzcHdW5pMDJDOQd1bmkwMzAwB3VuaTAzMDEHdW5pMDMwMgd1bmkwMzAzB3VuaTAzMDQHdW5pMDMwNgd1bmkwMzA3B3VuaTAzMDgHdW5pMDMwQQd1bmkwMzBCB3VuaTAzMEMHdW5pMDMyNgd1bmkwMzI3B3VuaTAzMjgHdW5pMUU5RQd1bmkyMDcwB3VuaTIwNzQHdW5pMjA4MAd1bmkyMDgxB3VuaTIwODIHdW5pMjA4Mwd1bmkyMDg0BEV1cm8HdW5pMjBCQQd1bmkyMEJEB3VuaTIxMTMJZXN0aW1hdGVkB3VuaTIyMTUHdW5pMjIxOQd1bmlGMDAwB3VuaUZCMDEHdW5pRkIwMgt1bmkwMzBDLmFsdAt1bmkwMzI2LmFsdAt1bmkwMzAwLmNhcAt1bmkwMzAxLmNhcAt1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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
