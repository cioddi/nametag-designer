(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.average_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGUAcgBhAGcAZQAtAFIAZQBnAHUAbABhAHIAQQB2AGUAcgBhAGcAZQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAVAB1AG4AbgBpAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wDiAOMAsACxAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wCbALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBAgCMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDSAQMAwADBAQQBBQEGAQcBCAEJBEV1cm8CZmYDZmZpA2ZmbAJmagJmaAJmawJmYgAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgACAAMA9AABAPUA/QACAAEAAAAKACIASAABbGF0bgAIAAQAAAAA//8AAwAAAAEAAgADY2FzZQAUY3BzcAAaa2VybgAgAAAAAQABAAAAAQACAAAAAQAAAAMACAhoCK4AAgAAAAMADAFIBeYAAQBQAAQAAAAjATIBMgCaAKAAsgC4AL4A+gIKAQADDAOOAMgBBgEMAQwBDAUWAPoA+gD6APoA+gD6AQABBgEGAQYBBgEMAQwBMgEyATIBMgABACMABQAKABMAFAAWABcAGgAkACkAMQAzADUANwA4ADkAOgA8AEkAgACBAIIAgwCEAIUAkQCZAJoAmwCcAJ0AxwDWANcA2QDaAAEAFP/nAAQAE//iABf/4gBr/5IAev+SAAEAF//2AAEAFv/xAAIAEf+wABf/5wAMABD/0wAR/5wAR/+NAEn/ugBR/7AAU/+wAFX/sABW/5IAWP+wAFv/nABd/5wA9v+6AAEALf/JAAEAEf/YAAEAEf/OAAkAEP/nABH/nAAS/7UAUf+6AFX/ugBW/6YAWP+6AFv/ugBd/7AAAgAR/5wAhv9qAAEAKAAEAAAADwBKAGQAkgCwAM4BUAFuAdACUgMkA64DxAPaBFgEWAABAA8AEAARABIAJQApAC0AMAAzADUAOwBFAEgASQBVAFkABgA3/9MAOf/nADr/5wA8/+cAnf/nAMf/5wALADf/nAA4/84AOf+cADr/nAA8/5wAmf/OAJr/zgCb/84AnP/OAJ3/nADH/5wABwAk/78AgP+/AIH/vwCC/78Ag/+/AIT/vwCF/78ABwAk/9gAgP/YAIH/2ACC/9gAg//YAIT/2ACF/9gAIAAR/3wAJP+6AET/2ABG/84ASP/OAEr/zgBS/84AVP/OAID/ugCB/7oAgv+6AIP/ugCE/7oAhf+6AKD/2ACh/9gAov/YAKP/2ACk/9gApf/YAKf/zgCo/84Aqf/OAKr/zgCr/84Asv/OALP/zgC0/84Atf/OALb/zgC4/84AxP/OAAcAJP/JAID/yQCB/8kAgv/JAIP/yQCE/8kAhf/JABgARP/xAEb/zgBI/84ASv/OAFL/zgBU/84AoP/xAKH/8QCi//EAo//xAKT/8QCl//EAp//OAKj/zgCp/84Aqv/OAKv/zgCy/84As//OALT/zgC1/84Atv/OALj/zgDE/84AIAAR/3sAJP+hAET/ugBG/8QASP/EAEr/xABS/8QAVP/EAID/oQCB/6EAgv+hAIP/oQCE/6EAhf+hAKD/ugCh/7oAov+6AKP/ugCk/7oApf+6AKf/xACo/8QAqf/EAKr/xACr/8QAsv/EALP/xAC0/8QAtf/EALb/xAC4/8QAxP/EADQAJv+1ACr/tQAy/7UANP+1ADj/vwA5/78AOv+/ADz/vwBE/+IARv/OAEj/zgBK/84AUv/OAFT/zgBY/+IAWf+wAFr/sABc/7AAh/+1AJL/tQCT/7UAlP+1AJX/tQCW/7UAmP+1AJn/vwCa/78Am/+/AJz/vwCd/78AoP/iAKH/4gCi/+IAo//iAKT/4gCl/+IAp//OAKj/zgCp/84Aqv/OAKv/zgCy/84As//OALT/zgC1/84Atv/OALj/zgC9/7AAv/+wAMP/tQDE/84Ax/+/ACIAJv/OACr/zgAy/84ANP/OAEb/zgBI/84ASv/OAFL/zgBU/84AWf+rAFr/qwBc/6sAh//OAJL/zgCT/84AlP/OAJX/zgCW/84AmP/OAKf/zgCo/84Aqf/OAKr/zgCr/84Asv/OALP/zgC0/84Atf/OALb/zgC4/84Avf+rAL//qwDD/84AxP/OAAUAWf/nAFr/5wBc/+cAvf/nAL//5wAFAFn/9gBa//YAXP/2AL3/9gC///YAHwAEADIABQBGAAoARgAMAB4ADQAyACIAMgBAADIARv/sAEj/7ABK/+wAUv/sAFT/7ABgADIAagBGAG4ARgCn/+wAqP/sAKn/7ACq/+wAq//sALL/7ACz/+wAtP/sALX/7AC2/+wAuP/sAMT/7ADWAEYA1wBGANkARgDaAEYAEQBG/+cASP/nAEr/5wBS/+cAVP/nAKf/5wCo/+cAqf/nAKr/5wCr/+cAsv/nALP/5wC0/+cAtf/nALb/5wC4/+cAxP/nAAIAxAAEAAABFgGeAAkACgAA/7D/uv/E/4j/nP+cAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAAAAAAAAP+rAAAAAAAAAAAAAAAA/84AAAAA/87/ugAA/5z/sP+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/O/90AAP+IAAAAAAAAAAAAAP+6/5f/lwAAAAAAAAAAAAAAAAAA/7AAAAAAAAAAAAAAAAAAAAAAAAD/nP+S/5wAAAAAAAAAAAAAAAAAAP+I/5f/qgABACcABQAKACQAJwAuAC8AMQAyADQANwA4ADkAOgA8AIAAgQCCAIMAhACFAJAAkQCSAJMAlACVAJYAmACZAJoAmwCcAJ0AwQDHANYA1wDZANoAAgAWAAUABQAIAAoACgAIACcAJwABAC4ALgACAC8ALwADADEAMQAEADIAMgABADQANAABADcANwAFADgAOAAGADkAOgAHADwAPAAHAJAAkAABAJEAkQAEAJIAlgABAJgAmAABAJkAnAAGAJ0AnQAHAMEAwQADAMcAxwAHANYA1wAIANkA2gAIAAIAJAAFAAUABAAKAAoABAAkACQABwAmACYAAwAqACoAAwAyADIAAwA0ADQAAwA3ADcAAgA4ADgABQA5ADoABgA8ADwABgBEAEQACQBGAEYACABIAEgACABKAEoACABSAFIACABUAFQACABZAFoAAQBcAFwAAQCAAIUABwCHAIcAAwCSAJYAAwCYAJgAAwCZAJwABQCdAJ0ABgCgAKUACQCnAKsACACyALYACAC4ALgACAC9AL0AAQC/AL8AAQDDAMMAAwDEAMQACADHAMcABgDWANcABADZANoABAABAAAAAgAKADYAAQAIAAIARgABABAACwAMABAAPgBAAF4AXwBgAGcAbAB7ANQA1QDeAOEA4gABAAgAAgDgAAEAAgBiAH8AAQAAAAEACAABAAoABQAHACMAAgAHACQAPQAAAIAAlgAaAJgAnwAxAMEAwQA5AMMAwwA6AMUAxQA7AMcAyAA8AAAAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWxpZ2EACAAAAAEAAAABAAQABAAAAAEACAABAFYAAQAIAAkAFAAcACQAKgAwADYAPABCAEgA+QADAEkATwD4AAMASQBMAPsAAgBLAPoAAgBNAP0AAgBFAPwAAgBOAPUAAgBJAPcAAgBPAPYAAgBMAAEAAQBJ","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
