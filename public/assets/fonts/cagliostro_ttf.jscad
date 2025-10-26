(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cagliostro_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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OHUAAAABAAAAAQBCMPZerV8PPPUACwPoAAAAAMr4i1oAAAAAyviLWv+n/p0EzQPmAAAACAACAAAAAAAAAPoAAAAAAAABTQAAAPoAAAEmAEIBpwBCAroATgHnAAsDmABCA0YAUgD7AEIBjQBCAY0ALAHsADcCLgA4ASsAQgFjADcBJgBCAYIAFgJ3ADcBDwBYAdIAIgG8AA4CBwABAcUAQgIjAEIBuAALAhIAQgIjACEBPABNAUkATQJBADcCXQBOAkEANwHUADcD2wBCA0AADAJqAFkCzwA3Av4AWAI6AFkCCABZAyYANwMoAFkBGABYARb/pwKLAFgCHwBYA9kATQNlAFgDVgA3Aj0AWANWADcCZwBYAecACwLcAAsDVwBNAsMACwP8ABcCnQAhAqAAAQKFACwBeABYAYIAFgF4AC0CJwAtAen/7AFhAE0B1AAhAicATQHVACwCOAAsAfQALAFnACECAAAsAjMATQD2AEcA+f+5AecATgFDAE0DEQBOAioATQIrACwCOwBOAk4ALAFjAE0BUAAhAXcAFgIrAEYB3AAMAtcADAG+ABYB8wALAbsAIQGfACwBHgBjAaoALAIrADcA+gAAASYAQgHVADcCSQAsAqUATgKgAAEBHwBjAc8ANwHWAE0DWABCAcMAQgIHADcCRwA4A1gAQgHhAE0BvQA3Ai4AOAGiAE0BjgBNAWEATgJSAE0C4gAhATwATQF2AE0A4gBNAgQAQgIHAEIDCwBNAxsATQODAE0BiAAhA0AADANAAAwDQAAMA0AADANAAAwDQAAMA/oAAQLPADcCOgBZAjoAWQI6AFkCOgBZARgAFQEYAD4BGP/yARj/7gL+AAIDZQBYA1YANwNWADcDVgA3A1YANwNWADcCJgA4A1YANwNXAE0DVwBNA1cATQNXAE0CoAABAj4AWQIpAE0B1AAhAdQAIQHUACEB1AAhAdQAIQHUACEC9QAhAdUALAH0ACwB9AAsAfQALAH0ACwA9gAEAPYALQD2/+EA9v/dAjkALAIqAE0CKwAsAisALAIrACwCKwAsAisALAJEAEMCKwAYAisARgIrAEYCKwBGAisARgHzAAsCOwBOAfMACwIzAAIBGP/OAPb/vQD2AE0CLgBYAe8ARwEW/6cA+f+5AecATgHnAE4CHwBYAawATQIf//0BQ//9A2UAWAIqAE0ECAA3A3IALAJnAFgCZwBYAWMAQgJnAFgBYwA2AecACwFQAA4CoAABAoUALAG7ACEBZ//iAdAATgHQAE4B2gBNASwATQF/AE0BWQBJAhYATQInAE4BLABNAj0ANwP/ADcBKwBCARUAQgErAEIB9wBCAeEAQgH3AEICigA3AooANwHPAFgDcABCBPkAQgFIADcBSABCAgIAAQLmACED3QAUAi4AOAMMAEMCVwBNAl0ATgFBAE0AAQAAA+b+nQAABPn/p/+9BM0AAQAAAAAAAAAAAAAAAAAAAP4AAgGtAZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAACAAABvEAAASgAAAAAAAAAATUFEVABAACD2wwPm/p0AAAPmAWMAAAABAAAAAAG8ArwAAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEARAAAABAAEAABQAAAH4ArAD/ASkBNQE4AUQBVAFZAWEBeAF+AZICxwLdAwcgFCAaIB4gIiAmIDAgOiBEIKwhIiISIh4iSCJg9sP//wAAACAAoACuAScBMQE3AT8BUgFWAWABeAF9AZICxgLYAwcgEyAYIBwgICAmIDAgOSBEIKwhIiISIh4iSCJg9sP////j/8L/wf+a/5P/kv+M/3//fv94/2L/Xv9L/hj+CP3f4NTg0eDQ4M/gzODD4LvgsuBL39be597c3rPenAo6AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAPALoAAwABBAkAAADyAAAAAwABBAkAAQAUAPIAAwABBAkAAgAOAQYAAwABBAkAAwBQARQAAwABBAkABAAkAWQAAwABBAkABQAQAYgAAwABBAkABgAkAZgAAwABBAkABwBaAbwAAwABBAkACAAeAhYAAwABBAkACQAeAhYAAwABBAkACgBYAjQAAwABBAkACwAsAowAAwABBAkADAAsAowAAwABBAkADQEgArgAAwABBAkADgA0A9gAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABNAGEAdAB0AGgAZQB3ACAARABlAHMAbQBvAG4AZAAgACgAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAG0AYQBkAHQAeQBwAGUALgBjAG8AbQAgAHwAIABtAGEAdAB0AGQAZQBzAG0AbwBuAGQAQABnAG0AYQBpAGwALgBjAG8AbQApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEMAYQBnAGwAaQBvAHMAdAByAG8AIgBDAGEAZwBsAGkAbwBzAHQAcgBvAFIAZQBnAHUAbABhAHIATQBhAHQAdABoAGUAdwBEAGUAcwBtAG8AbgBkADoAIABDAGEAZwBsAGkAbwBzAHQAcgBvACAAUgBlAGcAdQBsAGEAcgA6ACAAMgAwADEAMQBDAGEAZwBsAGkAbwBzAHQAcgBvACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAQwBhAGcAbABpAG8AcwB0AHIAbwAtAFIAZQBnAHUAbABhAHIAQwBhAGcAbABpAG8AcwB0AHIAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAE0AYQB0AHQAaABlAHcAIABEAGUAcwBtAG8AbgBkAC4ATQBhAHQAdABoAGUAdwAgAEQAZQBzAG0AbwBuAGQASQBuAHMAcABpAHIAZQBkACAAYgB5ACAAYQAgAGQAZQBzAGkAZwBuACAAYgB5ACAATwB6AHcAYQBsAGQAIABCAHIAdQBjAGUAIABDAG8AbwBwAGUAcgAuAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBtAGEAZAB0AHkAcABlAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAD+AAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAwEEAQUA1wEGAQcBCAEJAQoBCwEMAQ0A4gDjAQ4BDwCwALEBEAERARIBEwEUAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wEVALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBFgCMAO8AkgCnAI8BFwd1bmkwMEEwBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24MZG90YWNjZW50Y21iBEV1cm8LY29tbWFhY2NlbnQAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQD9AAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAZAAEAAAALQDCAMwA1gD8BlQBDgamAWQBqgHcAfYCUAKqBsAC1AMqBwYHYANoB2AEVgU4BiYHgghwBlQGVAZUBlQGVAZUBqYGwAbABsAGwAbAB4IHBgcGBwYHYAeCCHAIogABAC0ACgAPABAAEQAkACUAJgAnACkAKgAuAC8AMAAyADMANAA1ADYANwA4ADkAOgA7ADwAPQCBAIIAgwCEAIUAhgCIAJMAlACVAJYAlwCeANMA1ADWANgA2gDbAOoAAgBH/84AVv/OAAIA6v+cAO3/nAAJADf/sAA5/8QAOv/EADv/zgA8/7AAPf/OAJ7/sADa/7AA2//OAAQABf+cAAr/nADq/5wA7f+cABUABf/YAAr/2AAk/+wAN//YADn/2AA6/+IAO//sADz/4gA9/+wAgf/sAIL/7ACD/+wAhP/sAIX/7ACG/+wAh//sAJ7/4gDa/+IA2//sAOr/2ADt/9gAEQAk/8QAN//YADn/4gA6/+wAO//iADz/2AA9/+IAgf/EAIL/xACD/8QAhP/EAIX/xACG/8QAh//EAJ7/2ADa/9gA2//iAAwAD/+cABH/nAAk/7AAgf+wAIL/sACD/7AAhP+wAIX/sACG/7AAh/+wAOv/nADy/5wABgA3/9gAOf/iADr/4gA8/9gAnv/YANr/2AAWAAX/2AAK/9gAEP/EACb/2AAq/9gAMv/YADT/2AA3/9gAOP/sADn/7AA6/+wAPP/sAIj/2ACT/9gAlP/YAJX/2ACW/9gAl//YAJ7/7ADa/+wA6v/YAO3/2AAWAAX/nAAK/5wAEP/EACb/2AAq/9gAMv/YADT/2AA3/5IAOP/iADn/xAA6/8QAPP+cAIj/2ACT/9gAlP/YAJX/2ACW/9gAl//YAJ7/nADa/5wA6v+cAO3/nAAKAAX/2AAK/9gAN//iADn/7AA6/+wAPP/iAJ7/4gDa/+IA6v/YAO3/2AAVAA//iAAQ/8QAEf+IACT/nAAw/+wAN//sADr/7AA7/9gAPP/sAD3/2ACB/5wAgv+cAIP/nACE/5wAhf+cAIb/nACH/5wAnv/sANr/7ADb/9gA8v+IAA8AJP/EADf/7AA5//YAOv/sADv/4gA8/+wAgf/EAIL/xACD/8QAhP/EAIX/xACG/8QAh//EAJ7/7ADa/+wAOwAP/2oAEP+wABH/agAd/5wAHv+cACT/agAm/8QAKv/YADD/xAAy/84ANP/OAET/iABI/4gATP/iAFD/iABR/4gAUv+IAFX/iABW/4gAWP+IAFr/nABc/4gAXf+IAIH/agCC/2oAg/9qAIT/agCF/2oAhv9qAIf/agCI/8QAk//OAJT/zgCV/84Alv/OAJf/zgCh/8QAov/EAKP/xACk/8QApf/EAKb/xACp/8QAqv/EAKv/xACs/8QArv/EALP/xAC0/8QAtf/EALb/xAC3/8QAuv/EALv/xAC8/8QAvf/EAMD/xADE/8QA8v9qADgAD/+IABD/xAAR/4gAHf/EAB7/xAAk/2oAJv/YACr/4gAw/8QAMv/YADT/2AA2/+wARP/EAEb/xABI/8QATP/iAFL/xABV/84AVv/EAFj/2ACB/2oAgv9qAIP/agCE/2oAhf9qAIb/agCH/2oAiP/YAJP/2ACU/9gAlf/YAJb/2ACX/9gAof/YAKL/2ACj/9gApP/iAKX/4gCm/9gAqf/EAKr/xACr/8QArP/YAK7/2ACz/8QAtP/EALX/xAC2/84At//EALr/zgC7/84AvP/OAL3/zgDE/+IA2P/sAPL/iAA7AA//iAAQ/8QAEf+aAB3/sAAe/7AAJP+IACb/4gAq/+wAMP/YADL/4gA0/+IANv/sAET/xABI/8QATP/iAFD/zgBS/8QAVf/OAFb/xABY/84AW//OAFz/zgCB/4gAgv+IAIP/iACE/4gAhf+IAIb/iACH/4gAiP/iAJP/4gCU/+IAlf/iAJb/4gCX/+IAof/OAKL/xACj/84ApP/iAKX/2ACm/9gAqf/EAKr/xACr/8QArP/EAK7/4gCz/8QAtP/EALX/xAC2/84At//EALr/zgC7/84AvP/OAL3/zgDA/+IAxP/iANj/7ADy/4gACwAQ/84AJv/iACr/4gAy/+IANP/iAIj/4gCT/+IAlP/iAJX/4gCW/+IAl//iABQABf+wAAr/sAAm/+wAKv/sADL/7AA0/+wAN/+mADn/ugA6/7oAPP+mAIj/7ACT/+wAlP/sAJX/7ACW/+wAl//sAJ7/pgDa/6YA6v+wAO3/sAAGADL/7ACT/+wAlP/sAJX/7ACW/+wAl//sABEAJP/EADf/7AA5//YAOv/sADv/4gA8/+wAPf/iAIH/xACC/8QAg//EAIT/xACF/8QAhv/EAIf/xACe/+wA2v/sANv/4gAWAAX/xAAK/8QAEP/EACb/7AAq/+wAMv/sADT/7AA3/8QAOP/sADn/2AA6/9gAPP/YAIj/7ACT/+wAlP/sAJX/7ACW/+wAl//sAJ7/2ADa/9gA6v/EAO3/xAAIACT/xACB/8QAgv/EAIP/xACE/8QAhf/EAIb/xACH/8QAOwAP/2oAEP+wABH/agAd/5wAHv+cACT/dAAm/9gAKv/iADD/zgAy/9gANP/YADb/7ABE/6YAR/+mAEj/pgBM/9gAUv+mAFP/sABV/7AAVv+mAFj/sABZ/7AAXf+mAIH/dACC/3QAg/90AIT/dACF/3QAhv90AIf/dACI/9gAk//YAJT/2ACV/9gAlv/YAJf/2ACh/6YAov+mAKP/pgCk/8QApf+6AKb/sACp/6YAqv+mAKv/pgCs/6YArv/YALP/pgC0/6YAtf+mALb/sAC3/6YAuv+6ALv/sAC8/7oAvf+6AMT/2ADY/+wA8v9qAAwAEP/OACb/4gAq/+IAMv/iADT/4gA3/+wAiP/iAJP/4gCU/+IAlf/iAJb/4gCX/+IAAwBH/84AVf/iAFb/zgAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
