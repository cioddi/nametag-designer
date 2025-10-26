(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.faster_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAAAAAFNAAAAyAAAAhb/JAKZ/5wC6gAAAwL/WgPLAD0DQP8GAav/nAIu/y4CAP7oAoj/TAJYAEcBRf9hAV4AAAFF/2ECi/9qAwX/BgLF/wYDKP8GAxv/BgMs/wYDH/8GAwH/BgK+/wYDDf8GAxP/BgFF/2EBRf9hAlgAYAJYADICWABGAmL/OAQs/yQDU/8GAwb/BgKr/ygDSf8GAtb/BgKa/wYC//8oA07/BgH4/wYCNv7rAwP/BgJu/wYD//8GA1P/BgMv/ygDAf8GAy//KAMb/wYDHv9aAtf/TAMu/ygDGf9MA+H/VgME/t8Cjv8PAuz9zQIt/wYB9wAAAhT/LgJYAD4Blv5mARf+UAL2/wYCyv8EAmz/JAMH/wMCkP8DAk//BAK4/yIDBP8DAen/AwIW/ukCuf8DAjf/AwOF/wMDAf8DAvf/MQK3/wMC3f8jAtH/AwLO/xICb/8iAtf/IgLV/0wDv/9TAr/+3AJ7/xcCmv7QAi3/BgIK/wMCFf8uAlgAFwDIAAACS/8kAn3/BgMa/wYCt/9MAgr/AwL5/wYBrv7tAxT/OAJ5/wYC//84AlgASAMU/zgBj/62AkL/BgJYAB8BkAAMAZAADQGt/mwDEP8DAv7/EwFF/2EB1f+bAZAAJQJ5/wYC9v9qA8sAPwPLACsDywAdAmL+wgNT/wYDU/8GA1P/BgNT/wYDU/8GA1P/BgPy/wYCq/8oAtb/BgLW/wYC1v8GAtb/BgH4/wYB+P8GAfj/BgH4/wYDSf8GA1P/BgMv/ygDL/8oAy//KAMv/ygDL/8oAlgAMgMv/ygDLv8oAy7/KAMu/ygDLv8oAo7/DwMB/wYDBf8GAvb/BgL2/wYC9v8GAvb/BgL2/wYC9v8GA6f/BgJs/yQCkP8DApD/AwKQ/wMCkP8DAen/AwHp/wMB6f8DAen/AwMH/wMDAf8DAvf/MQL3/zEC9/8xAvf/MQL3/zECWABHAvf/MQLX/yIC1/8iAtf/IgLX/yICe/8XAuz/AwJ7/xcB6f8DAm7/BgI3/wMEAP8JA53/MQMe/1oCzv8SAo7/DwLs/c0Cmv7QAnj/BgGB/qkBgf6ZA0EAAAGB/o8BCf6aAQn+0AH0/7kByv7tAlf+RgKRACkCUwAfA1YALQFo/yYByv96AUX/YQJV/yYCuP96AjP/YQLX/0wDLf9MAg7/BgPP/2EEcQA9AhL/OAIJ/2oB9wBGAxj/KAOM/zgCv//oAk4AJgK/AAIDIAA4Ao7/8AJYAEcCIAAvA4kAMwF1/6YCWAAyAlgAMgJYAB8CWAAfArwANQObAGQEOP8EBIb/BAABAAADgv9bAAAEhv3N/44EegBkABUAAAAAAAAAAAAAAAAA+AADAqYBkAAFAAACigJY//AASwKKAlgASgFeADIBLAAAAgAFBQUAAAkABIAAAK9QACBKAAAAAAAAAABUSVBPAEAAIPsCA4L/WwAAA4IApSAAAAEAAAAAAhECcQAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQBUAAAAFAAQAAFABAAfgCjAKwA/wExAUIBUwFhAXgBfgGSAscCyQLdA8AgFCAaIB4gIiAmIDAgOiBEIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvj/+wL//wAAACAAoAClAK4BMQFBAVIBYAF4AX0BkgLGAskC2APAIBMgGCAcICAgJiAwIDkgRCCsISIhJiICIgYiDyIRIhoiHiIrIkgiYCJkJcr4//sB////4//C/8H/wP+P/4D/cf9l/0//S/84/gX+BP32/RTgwuC/4L7gveC64LHgqeCg4DnfxN/B3ube497b3tre097Q3sTeqN6R3o7bKgf2BfUAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAAC4AAAAAwABBAkAAQAUALgAAwABBAkAAgAOAMwAAwABBAkAAwBGANoAAwABBAkABAAUALgAAwABBAkABQAaASAAAwABBAkABgAiAToAAwABBAkABwBiAVwAAwABBAkACAAuAb4AAwABBAkACQAuAb4AAwABBAkACwAsAewAAwABBAkADAAsAewAAwABBAkADQEgAhgAAwABBAkADgA0AzgAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADIALAAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkAIAAoAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAJwBGAGEAcwB0AGUAcgAnAEYAYQBzAHQAZQByACAATwBuAGUAUgBlAGcAdQBsAGEAcgBFAGQAdQBhAHIAZABvAFIAbwBkAHIAaQBnAHUAZQB6AFQAdQBuAG4AaQA6ACAARgBhAHMAdABlAHIAOgAgADIAMAAxADUAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMgBGAGEAcwB0AGUAcgBPAG4AZQAtAFIAZQBnAHUAbABhAHIARgBhAHMAdABlAHIAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBA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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
