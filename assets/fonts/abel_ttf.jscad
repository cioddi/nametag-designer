(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.abel_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AA8AFP/XAA8AFv/HAA8AF/+VAA8AGP/HAA8AGf+yAA8AGv/bAA8AG//HAA8AHP+yABEAE//HABEAFP/bABEAFv/HABEAF/+VABEAGP/HABEAGf+yABEAGv/bABEAG//HABEAHP+yABIAE//sABIAFv/sABIAF/9oABIAGf/XABIAG//sABIAHP/XABIAJP+BABIAJv/sABIAKv/sABIALf95ABIAMv/sABIANP/sABIARP+RABIARv+aABIAR/+aABIASP+aABIASv+iABIAUP/bABIAUf/bABIAUv+aABIAU//bABIAVP+iABIAVf/bABIAVv+RABIAWP/bABIAgf+BABIAgv+BABIAg/+BABIAhP+BABIAhf+BABIAhv+BABIAiP/sABIAk//sABIAlP/sABIAlf/sABIAlv/sABIAl//sABIAof+RABIAov+RABIAo/+RABIApP+RABIApf+RABIApv+RABIAp/+RABIAqf+aABIAqv+aABIAq/+aABIArP+aABIAs/+aABIAtP+aABIAtf+aABIAtv+aABIAt/+aABIAuv/bABIAu//bABIAvP/bABIAvf/bABIAx/95ABMAD//HABMAEf/HABMAEv/nABMAGP/sABMAGf/XABMAGv/XABMAG//sABMA3/9kABQAF//sABQAGf/fABQAHP/fABUAGP/bABUAGf/nABUAGv/sABUAHP/nABYAD//HABYAEf/HABYAE//sABYAFv/sABYAGP/sABYAGf/XABYAGv/XABYAG//sABYAHP/XABcAE//sABcAFv/sABcAGP/sABcAGv/XABcAHP/XABgAD//HABgAEf/HABgAE//sABgAFv/sABgAGP/sABgAGf/XABgAGv/XABgAG//sABgAHP/XABkAD//bABkAEf/bABkAGv/sABsAD//HABsAEf/HABsAEv/nABsAE//sABsAFv/sABsAGP/sABsAGf/XABsAGv/XABsAG//sABsAHP/XABwAD//bABwAEf/bABwAGf/sABwAGv/sACQABf+BACQACv+RACQAIv/XACQAN//DACQAOf/XACQAOv/XACQAPP+aACQAnv+qACQA2v+qACYAD//bACYAEf/bACYAPP/sACYAnv/sACYA2v/sACcAD/++ACcAEf++ACcAEv/nACcAPP/XACcATP/XACcAnv/XACcA2v/XACgAV//XACkAD/5WACkAEf5WACkAEv+FACkAJP/TACkAgf/TACkAgv/TACkAg//TACkAhP/TACkAhf/TACkAhv/TACoAD//bACoAEf/bACoAPP/sACoATP/sACoAnv/sACoA2v/sACsAD//XACsAEf/XACsARP/sACsASP/sACsATP/LACsAUv/sACsAWP/sACsAof/sACsAov/sACsAo//sACsApP/sACsApf/sACsApv/sACsAp//sACsAqf/sACsAqv/sACsAq//sACsArP/sACsAs//sACsAtP/sACsAtf/sACsAtv/sACsAt//sACsAuv/sACsAu//sACsAvP/sACsAvf/sACwATP/TACwATv/LACwAT//LAC0AD//bAC0AEf/bAC8ABf72AC8ACv8GAC8AIv/bAC8AN//LAC8AOf/HAC8AOv/TAC8APP+PAC8Anv+PAC8A2v+PADAABP/sADAAD//XADAAEf/XADAARP/sADAARv/sADAAR//sADAASP/sADAATP/LADAAUf/sADAAUv/sADAAWP/sADAAof/sADAAov/sADAAo//sADAApP/sADAApf/sADAApv/sADAAp//sADAAqf/sADAAqv/sADAAq//sADAArP/sADAAs//sADAAtP/sADAAtf/sADAAtv/sADAAt//sADAAuv/sADAAu//sADAAvP/sADAAvf/sADEAD//XADEAEf/XADEARP/sADEASP/sADEATP/LADEAUv/sADEAWP/sADEAof/sADEAov/sADEAo//sADEApP/sADEApf/sADEApv/sADEAp//sADEAqf/sADEAqv/sADEAq//sADEArP/sADEAs//sADEAtP/sADEAtf/sADEAtv/sADEAt//sADEAuv/sADEAu//sADEAvP/sADEAvf/sADIAD//HADIAEf/HADIAEv/nADIAPP/XADIATP/XADIATv/XADIAT//XADIAnv/XADIA2v/XADMAD/5WADMAEf5WADMAEv+qADMAnv/sADMA2v/sADQAD//HADQAEf/HADQAEv/nADQAPP/XADQATP/XADQATv/XADQAT//XADQAnv/XADQA2v/XADUAPP/XADUAnv/XADUA2v/XADYAD//bADYAEf/bADYAPP/XADYATP/sADYATv/sADYAT//sADYAnv/XADYA2v/XADcAD/9YADcAEP+6ADcAEf9YADcAEv+NADcAHf+uADcAHv+uADcAJP/DADcALf8zADcARP+iADcASP+uADcAUP/DADcAUv+uADcAVf/DADcAVv+eADcAWP/DADcAWv+uADcAXf/bADcAgf/DADcAgv/DADcAg//DADcAhP/DADcAhf/DADcAhv/DADcAof+iADcAov+iADcAo/+iADcApP+iADcApf+iADcApv+iADcAp/+iADcAqf+uADcAqv+uADcAq/+uADcArP+uADcAs/+uADcAtP+uADcAtf+uADcAtv+uADcAt/+uADcAuv/DADcAu//DADcAvP/DADcAvf/DADcAx/8zADgAD//HADgAEf/HADgAEv/nADgATP/fADkAD/9UADkAEf9UADkAEv99ADkAJP/XADkARP/fADkASP/nADkAUv/nADkAgf/XADkAgv/XADkAg//XADkAhP/XADkAhf/XADkAhv/XADkAof/fADkAov/fADkAo//fADkApP/fADkApf/fADkApv/fADkAp//fADkAqf/nADkAqv/nADkAq//nADkArP/nADkAs//nADkAtP/nADkAtf/nADkAtv/nADkAt//nADoAD/9cADoAEf9cADoAEv+JADoAJP/XADoARP/bADoAR//jADoASP/jADoAUv/jADoAgf/XADoAgv/XADoAg//XADoAhP/XADoAhf/XADoAhv/XADoAof/bADoAov/bADoAo//bADoApP/bADoApf/bADoApv/bADoAp//bADoAqf/jADoAqv/jADoAq//jADoArP/jADoAs//jADoAtP/jADoAtf/jADoAtv/jADoAt//jADoAxP/sADwAJP+aADwARP+uADwASP+uADwAUv+uADwAWP/DADwAgf+aADwAgv+aADwAg/+aADwAhP+aADwAhf+aADwAhv+aADwAof+uADwAov+uADwAo/+uADwApP+uADwApf+uADwApv+uADwAp/+uADwAqf+uADwAqv+uADwAq/+uADwArP+uADwAs/+uADwAtP+uADwAtf+uADwAtv+uADwAt/+uADwAuv/DADwAu//DADwAvP/DADwAvf/DAEQAIv9xAEUAD//sAEUAEf/sAEUAIv9tAEUAT//sAEYAD//sAEYAEf/sAEYAIv9tAEYATv/sAEYAT//s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AXQAAwABBAkACAAeAcIAAwABBAkACQAeAcIAAwABBAkACwAsAeAAAwABBAkADAAsAeAAAwABBAkADQEgAgwAAwABBAkADgA0AywAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEALAAgAE0AYQB0AHQAaABlAHcAIABEAGUAcwBtAG8AbgBkACAAKABoAHQAdABwADoALwAvAHcAdwB3AC4AbQBhAGQAdAB5AHAAZQAuAGMAbwBtACAAfAAgAG0AYQB0AHQAZABlAHMAbQBvAG4AZABAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgAEEAYgBlAGwALgBBAGIAZQBsAFIAZQBnAHUAbABhAHIAMQAuADAAMAAzADsATQBBAEQAVAA7AEEAYgBlAGwALQBSAGUAZwB1AGwAYQByAEEAYgBlAGwAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMAQQBiAGUAbAAtAFIAZQBnAHUAbABhAHIAQQBiAGUAbAAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAE0AYQB0AHQAaABlAHcAIABEAGUAcwBtAG8AbgBkAC4ATQBhAHQAdABoAGUAdwAgAEQAZQBzAG0AbwBuAGQAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAG0AYQBkAHQAeQBwAGUALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/o8AUgAAAAAAAAAAAAAAAAAAAAAAAAAAAPsAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAQIAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEDAQQBBQDXAQYBBwEIAQkBCgELAQwBDQDiAOMBDgEPALAAsQEQAREBEgETARQA5ADlALsA5gDnAKYA2ADhANsA3ADdAOAA2QDfARUAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAvgC/ALwBFgCMAO8BFwEYB3VuaTAwQTAEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgxkb3RhY2NlbnRjbWIERXVybwhkb3RsZXNzagtjb21tYWFjY2VudAAAAQAB//8ADw==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
