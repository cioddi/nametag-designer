(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.karla_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AUYAAwABBAkABgAaAWAAAwABBAkACQAgAXoAAwABBAkADAAcAZoAAwABBAkADQCYAbYAAwABBAkADgA0Ak4AQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEALQAyADAAMQAyACwAIABKAG8AbgBhAHQAaABhAG4AIABQAGkAbgBoAG8AcgBuACAAKABqAG8AbgBwAGkAbgBoAG8AcgBuAC4AdAB5AHAAZQBkAGUAcwBpAGcAbgBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQBzACAAJwBLAGEAcgBsAGEAJwBLAGEAcgBsAGEAUgBlAGcAdQBsAGEAcgBGAG8AbgB0AEYAbwByAGcAZQAgADIALgAwACAAOgAgAEsAYQByAGwAYQAgAFIAZQBnAHUAbABhAHIAIAA6ACAAMQAzAC0AMQAwAC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAwAEsAYQByAGwAYQAtAFIAZQBnAHUAbABhAHIASgBvAG4AYQB0AGgAYQBuACAAUABpAG4AaABvAHIAbgBqAG8AbgBwAGkAbgBoAG8AcgBuAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgBoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAACdAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCFAI4AjQCtAMkAxwCuAGIAywBlAMgAygDPAMwAzQDOAGYA0wDQANEArwBnANYA1ADVAGgAagBpAGsAbQBsAHEAcAByAHMAdQB0AHYAdwB4AHoAeQB7AH0AfAB/AH4AgACBANcBAgDYANkAsgCzALYAtwEDAO8KYXBvc3Ryb3BoZQtydXBlZXN5bWJvbAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQCcAAEAAAABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAUgAEAAAAJACYALoAwAEGASgBNgE8AUIBSAGeAdgCDgIUAoIClAKiArACvgLYAuIC7ALyAwADCgMUAyYDMAM+A0wDZgNsA3YDjAOeA6gDvgACAAsAJAAkAAAAJwAnAAEAKQApAAIALwAvAAMAMgA0AAQANgA3AAcAOQA8AAkARABGAA0ASABLABAATQBOABQAUABdABYACAA3/9gAOf/kADr/5AA8/+YASf/0AFn/6gBa/+gAXP/kAAEAPP/nABEAJP/HADr/+AA7//AAPP/4AET/6ABG/+QAR//oAEj/5ABK/9MAUv/kAFT/5ABY/+gAWf/gAFr/3ABb/+QAXP/kAF3/6AAIAC0AEAA3/88AOf/TADr/1wA8/7sAWf/oAFr/6ABc/+wAAwA5//gAO//0ADz/8AABACT/2gABADz/8AABADz/5gAVACT/2AAt/7sARP+pAEb/tQBH/6sASP+1AEn/ywBK/6kAUP+7AFH/uwBS/7EAU/+7AFT/tQBV/7cAVv+fAFj/uwBZ/7cAWv/YAFv/xwBc/84AXf/LAA4AJP/fACb/+AAt/7sAMv/4AET/3wBG/98AR//fAEj/3wBJ/9gASv/PAFL/3wBU/+MAVf/vAFb/3wANACT/3wAt/7sARP/fAEb/3wBH/98ASP/fAEn/2ABK/88AUv/fAFT/3wBV/98AVv/YAFj/5AABADL/9AAbACT/uwAm/+8AK//4AC3/rgAy//AANP/wADb/5ABE/8MARv+/AEf/vwBI/78ASf+/AEr/swBQ/78AUf+/AFL/vwBT/78AVP+/AFX/vwBW/78AV//bAFj/vQBZ/9MAWv/TAFv/ywBc/8cAXf+/AAQAN/+nADn/2wA6/+QAPP/LAAMAN//sADn/4wA8/+8AAwA3/8MAOf/kADz/3wADADf/wwA5/+gAPP/XAAYAJP/wAC3/ywBG//AASv/mAE3/8ABW/+gAAgBNAEkAXAAQAAIAN//4ADz/0wABAEn/6gADAEn/8ABN//gAXP/wAAIAN//cADz/1wACADf/1AA8/9cABAA3/7kAOf/fADr/3wA8/78AAgA3/8sAPP/cAAMAN/+3ADz/0QBNAFEAAwAt/9gAN//QAEr/7AAGADf/pwA5/+QAOv/cADz/xwBJ/+QAXP/sAAEAPP/bAAIAN//HADz/zwAFACT/6AAt/8sAN//EADz/0wBK//gABAAk/+QALf/XADf/4AA8/+AAAgA3/9cAPP/PAAUAJP/0AC3/6AA3/8gAPP/kAEr/+AACADf/6AA8/9cAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAW9udW0ACAAAAAEAAAABAAQAAQAAAAEACAACABoACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAQATABwAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
