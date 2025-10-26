(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.miniver_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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uAH/hbAEjQAAFQAAAAAADgCuAAMAAQQJAAAAugAAAAMAAQQJAAEADgC6AAMAAQQJAAIADgDIAAMAAQQJAAMAMgDWAAMAAQQJAAQADgC6AAMAAQQJAAUAGgEIAAMAAQQJAAYADgC6AAMAAQQJAAcASgEiAAMAAQQJAAgAFgFsAAMAAQQJAAkAHgGCAAMAAQQJAAsATAGgAAMAAQQJAAwATAGgAAMAAQQJAA0BIAHsAAMAAQQJAA4ANAMMAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACAAYgB5ACAATwBwAGUAbgAgAFcAaQBuAGQAbwB3ACAAKABkAGEAdABoAGEAbgBiAG8AYQByAGQAbQBhAG4AQABnAG0AYQBpAGwALgBjAG8AbQApACAAdwBpAHQAaAAgAFIAZQBzAGUAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIATQBpAG4AaQB2AGUAcgAiAE0AaQBuAGkAdgBlAHIAUgBlAGcAdQBsAGEAcgBPAHAAZQBuAFcAaQBuAGQAbwB3ADoAIABNAGkAbgBpAHYAZQByADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADAATQBpAG4AaQB2AGUAcgAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAE8AcABlAG4AIABXAGkAbgBkAG8AdwBPAHAAZQBuACAAVwBpAG4AZABvAHcARABhAHQAaABhAG4AIABCAG8AYQByAGQAbQBhAG4AaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGYAbwBuAHQAYgByAG8AcwAuAGMAbwBtAC8AbwBwAGUAbgB3AGkAbgBkAG8AdwAuAHAAaABwAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsAA0AVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6AA0AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/swAzAAAAAAAAAAAAAAAAAAAAAAAAAAAA5QAAAOkA6gDiAOMA5ADlAOsA7ADtAO4A5gDnAPQA9QDxAPYA8wDyAOgA7wDwAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQBiAGMAZABlAGYAZwBoAGkAagBrAGwAbQBuAG8AcABxAHIAcwB0AHUAdgB3AHgAeQB6AHsAfAB9AH4AfwCAAIEAgwCEAIUAhgCHAIgAiQCKAIsAjQCOAJAAkQCWAJcAmACdAJ4AoAChAKIAowCkAKYAqQCqAKsBAgCtAK4ArwCwALEAsgCzALQAtQC2ALcAuAC6ALsAvAEDAL4AvwDAAMEAwwDEAMUAxgDHAMgAyQDKAMsAzADNAM4AzwDQANEA0wDUANUA1gDXANgA2QDaANsA3ADdAN4A3wDgAOEAvQEEB3VuaTAwQTAERXVybwlzZnRoeXBoZW4AAAEAAf//AA8=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
