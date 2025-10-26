(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sofia_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ADEAIABiAHkAIABMAGEAdABpAG4AbwBUAHkAcABlACAATABpAG0AaQB0AGEAZABhACAAKABpAG4AZgBvAEAAbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtACkALAAgACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlAHMAIAAiAFMAbwBmAGkAYQAiAFMAbwBmAGkAYQBSAGUAZwB1AGwAYQByAFAAYQB1AGwAYQBOAGEAegBhAGwALABEAGEAbgBpAGUAbABIAGUAcgBuAG4AZABlAHoAOgAgAFMAbwBmAGkAYQA6ACAAMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAFMAbwBmAGkAYQAtAFIAZQBnAHUAbABhAHIAUwBvAGYAaQBhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAATABhAHQAaQBuAG8AVAB5AHAAZQAgAEwAaQBtAGkAdABhAGQAYQBQAGEAdQBsAGEAIABOAGEAegBhAGwALAAgAEQAYQBuAGkAZQBsACAASABlAHIAbgCHAG4AZABlAHoAUABhAHUAbABhACAATgBhAHoAYQBsACAAYQBuAGQAIABEAGEAbgBpAGUAbAAgAEgAZQByAG4AhwBuAGQAZQB6AHcAdwB3AC4AbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtAHcAdwB3AC4AaABlAHIAbgBhAG4AZABlAHoAdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOcAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQIAigCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA2wDcAN0A4ADZAN8AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAEDAIwAjwDAAMEHdW5pMDBBRARFdXJvAAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMA5gABAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
