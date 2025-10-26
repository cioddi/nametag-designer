(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.almendra_display_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGEAcgBBAGwAbQBlAG4AZAByAGEAIABEAGkAcwBwAGwAYQB5ACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAA0AEEAbABtAGUAbgBkAHIAYQBEAGkAcwBwAGwAYQB5AC0AUgBlAGcAdQBsAGEAcgBBAGwAbQBlAG4AZAByAGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABBAG4AYQAgAFMAYQBuAGYAZQBsAGkAcABwAG8ALgBBAG4AYQAgAFMAYQBuAGYAZQBsAGkAcABwAG8AdwB3AHcALgBhAG4AYQBzAGEAbgBmAGUAbABpAHAAcABvAC4AYwBvAG0ALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEDAQQBBQDXAQYBBwEIAQkBCgELAQwBDQDiAOMBDgEPALAAsQEQAREBEgETARQA2ADhAN0A2QEVALIAswC2ALcAxAC0ALUAxQCHAKsAvgC/ARYBFwduYnNwYWNlBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24MZG90YWNjZW50Y21iBEV1cm8LY29tbWFhY2NlbnQAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQDpAAEAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
