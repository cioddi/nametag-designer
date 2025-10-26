(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.shadows_into_light_two_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAOAIAAAwBgR1BPU0nhTvEAAIUIAAAGoE9TLzI3Tx2XAABwoAAAAGBWRE1YdGl7xwAAcQAAAAXgY21hcLtM5NcAAHbgAAADZGdhc3AAAAAQAACFAAAAAAhnbHlmbYRAeQAAAOwAAGbkaGVhZPqPfBsAAGq4AAAANmhoZWEJLwVHAABwfAAAACRobXR4hrcVygAAavAAAAWMbG9jYWbJf30AAGfwAAACyG1heHABcADmAABn0AAAACBuYW1lUf98ZQAAekwAAAOwcG9zdIPM3yQAAH38AAAHA3ByZXBoBoyFAAB6RAAAAAcABQAY//0B+QNYABMAIQAvAD0ASQAANwYuAic+Azc2NhYWBw4DFy4CPgI3HgIOAjcmDgIWFhcWPgImJgEmPgMWFxYOAyY3JiYOAhYXFj4ClAoSDw0EF0VRWCoIFhIKAy1UTULIIyIHESAtGSIoDgwgNQMLFA8JAQwODRoVDQMU/n8YAyE5OzcPBg0dKjAygg0hIBsPAQ0TJB4TAgUBCQ4HXc/T02IFAwUPDWXQ0c4VCzE8QTUkAQQuQEg6I9YCEx4lIhsFBBEdJiQcARMbSUU0Cyo8DistJhQHkSQVDCYsKgsEDhokAAABAEIB5ACAAtkACwAAEzY2FhYVBw4CJidCCRYTDAEBERUTAwLJCgYEDAjKBwoCCgwAAAEADf/EAUoDngAbAAATJj4CNzIWBw4DFwYeAhcWFgYGJy4DEgUjRF42FAoBMlc9IAYCIkJgOwMFBhMUO2NHKAFQW6KRhDwWFTx7hZRVNW1fSBAHEg8JAhBUbn4AAQAG/7gA9QOaACEAABMuAycmPgIXHgMVFA4EBwYuAjc+BcECFCtFMgMCCQwIN04zGBAbJCcoEgcRDQUFCB4kJh8TAbI8enNnKQUSEAgFLnSDjUciV15eVEITBgILDwcGNU5gZWEAAQA3AIUB1wJVABkAABMiJjc3NSY2NhYXFTceAgYHBxUUBgYmJydWGgUSlQIQFhYFpwYKAwcMpxEXFAMGASAoEiKxDBMJAwq6MgEPFBQGN6QODwUFCKgAAAEAF/98AGsAfwARAAAXBiYnPgImJzQ+AjMeAgZQFxkJBAsGAwkDCRMPCg8EC3kLCRERMDMxExATCgQPJzlQAAABACMBBAGxAVwADAAAEwYmJjY3JTIWFgYHBUIIEQYLFAFZCgoCBQX+mwEJBREbHAULDxcYBw4AAAEAHv/8AHMAWgAJAAAzIiY2NhcWFgYGSBcTBBoXEw0GFR0iGwEBHyMaAAEAFP/mAVMDTAAKAAABNhYXAQYGJiY1AQEdEiMB/v4KFRIMAQkDPg4CGfy9BQMGDAoDPAACAA7/9wGBA1UAEQAjAAATNh4CDgMHBi4DPgIXDgMeAzc+BC4C4yg8JxMCFy1DLCA+MSMMDjBWQTBAJQ0HGScwHB0uIBMECxwtA1AFQnOXoZt7TQIMO3KapKB/TjUBQWmFioNnPQEMTWyDhHxgOQAAAQArAAAAbgNFAA0AABM0NhYWFxYCFxYGBiYnKw4SEQMFAQUGChMWBwM3CQUCBwLF/nrHChMLAwsAAAEADQAIAa0DSgAnAAA3PgU3JiYGBgcmJjU0NjU+AzMWFg4FByUyFhcFIiYNFjo+OzAeAQYWL1JCChMBFjZARycdFwUcKjQ0MBIBKAwUAv6DDxQnJWh5gnxvKycnDUlJBxAMAQUBGDw1Iw5EX3R6e21aHDgbFE4IAAEACQAEAcYDUQA/AAA3PgU3Ni4CJyYOAyYnNzY2Jg4CBzAGFAYxJiY3PgQWFxYWDgMHNh4CBw4FBwYmPAYzRVBFMQUEDh0oFhcvLiwnIQzaJQckQ0lEEgEBDhMCBi09R0M1DRsMESYuLxEwX0gmCQYrPkpMSBwOEisDGCk2QksqHDUpGgIEEBoaDAgX2So0FwEVJRgHBwYBGA4YKB8VCgIIEC83PTk1ExULNFU2LE5DOi8lDQIQAAACAAj/8QIwA1UAGgAdAAATPgM3PgIWFwMyNjMWDgIHExQGIiYnEQc3EwguWFZRJwMSExABAiZHJgoYMDwZAhAUEwTh4BEBK0eBgIVLBwoBCAr+dhIgFwYDC/6DCggIBQF4BjcBPAABABz/9wHIA1MAMgAANz4FNyYmBgYHLgI0NyUyFgcmDgIHBhQWFhU+AzMyHgIVDgMHLgI2LgUtPUQ8KgMLK0RdPAcNBwYBcyIRFhxfaF4bAwECGCwyOSYXIBQJATpcdDoGCAMCJQUSHzBJZUQzHSRjTAFQkMp8MhkgBAcOEwdljFwuBhszKRgZJy0TT39hRBMCDA8OAAACABH//wG9A00AGgAoAAAXJgITNjYWFgcOAhYXPgQWFxYOBCcWPgQnJg4Eq30dagEUFRABICkTAgsELD5LSD0TBxIpOUBCLBAzNzYoEwcILz0+LhIBFwGgAYYGCwITGFazrJs9IlpYSSISLx1RWlhGLD0NHj1SUUQQGxI9WlpNAAEAB//zAegDSAAmAAAlJiY+AzcmDgIHJiY3ND4EMzIWBw4FFhYXFgYGJgF8BwMFCQwMBC1gX1kmFhQGOVlqY00PEQ8FCA4LCQUDAQUECg4ZHQYWc5irnX0eBA4aHg0EGxAHFBUUEAobEAxNboWHgWZBBQsUCwUAAAMAE///AWoDVAAbACwAOgAAFy4CPgI3LgI+Ajc2HgIGBgceAwYGAw4DFhY3PgM1LgMDDgMWFhc+AyYmszU7FgkdLBkwOxoIKEYyMkEiBBUtIBszIQkgUDEWKRwKEzUxDR0XDgISHCIXJDQcBBczKRsrGgYRKwEFN09dVUQPF1NiZVQ4BAQmQ1pjZCwaUFtcTDABbwo4SE9AJwQBEBgcDilLPS0BwAQvRVJNPw8WQ0tMQS0AAAIAD//vAdcDTQAkADIAAAEOBSciLgI1ND4EMzYWFgYXAxYGBiYnPgQ0BQYWPgU3Jg4CAZ4WNDs+QUEgCA8MBxwxQkpQJjcxEAIDDgURGBYBAQQEBQP+qgkPJjc9PDEfAh9PUk8CtRxGRkEtFAkLEhYKI1NUTzwlAiREXzn9vgUQBwcSHGqDkIZuiyUZDCk7RUM6EhEjT2wAAgBPASUAlgIwAAkAEwAAEzQ2NhYXFAYiJgc0NjYWFxQGIiZPFhoWARYaFgEWGhYBFhoWAgoREwIQERUUEq8REwIQERUUEgAAAgAX/4UAiQF9ABMAHQAAFzY2JiY1NDYyFhcWFhQGBw4CJgM+AhYXFgYiJiIcDAcPERYVAwoMDQ8EFBcWDwMaHRgCARwhGlwnTEAvCxURDQkPP0pMHAwPAQ4BuxcXARYXFBQUAAEAPgCPAbACsQAQAAATJjY3JTYeAgcFBRYWBgYnUBICGQEXCBcPAQ3+7QEiCwQKFQ0BbBYjEPIKAg8YDOzHBxgTCAkAAgB5ANkCDAHgAAsAFwAANwYmJjY3JTIWFgYHJQYmJjY3JTIWFgYHnQgRBgsUAVkKCgIFBf6WCBEGCxQBWQoKAgUF3gURGxwFCw8XGAehBREbHAULDxcYBwAAAQAlAKYBlwLIABAAADcGJiY2NyUlJj4CFwUWFgdRDhQKBAsBIv7tDQEPFwgBFxkCEq8JCBMYB8fsDBgPAgryECMWAAACAA4AAAHkBA8ADQBCAAA3NDYzMhYVFAYjIi4CAzQ+BDU0JiYGIyIOAiMiJjU0PgQzMh4CFRQOAgcGBh4CNjcXBgYjIi4CyA4NExoXDwYMCgY7Kz9LPysbKC8TJEA7Oh4OFCY7SEU3Dhk6MCA5UVgfDgcIGCQvHBUXPxwVKSEUKxMLGxIQDAoODgHGLUlCPkNKLRoZCQEcIRsHFw0bGRcQCggVJx85b2NVIQccHhwOBRErEgwNGSMAAgAdAAAEIgQAAGMAeAAAEzQ+BDMyHgIVFA4CIyIuBCcOAyMiJjU0PgQzMhYVFBQGBicUFAYUFRQeAjMyPgI1NC4CIyIOBBUUHgIzMjY3PgMzMhYHDgMjIi4CASIOBBUyPgI3PgM3MzQmHTFYdoyZTkFuTywSMVRCNz0eCAcOFBM4RE8rGhggNUZMTiItHAUNDQEKHDAnN0EiCRs5VjtJjX9sTiwtV39Rhu9yDhAOFBMkDhRFlJ2mVU+LaT0CHB9CQDgrGRQqJyAKCCYoJAYzEgFHSKCbjGs/PWF6PDZsVzYYJS0qIQcgVEs0HxofU1hXRCojJgYQDggEBBUWFQQhPjAdLEdXKjFqVzk0W3iJkUZUckUeV0YJGRgQGiIxUz0iJE58AecjOkpNSh0XISQNCzhAOQwRGQAAAv///+ACXQNlACsAMgAAIz4CEjc2NhYWBxM3MhYWBgcOAxUTDgImJwMOBQcGBgcGBwYmEwM+AzcBBx8ySTEGFhYPAcVmDRICEBQIGhoSbwIEDBgWcxU+REU6KAQCCwUGCBId5GoRPEZHHRdqxQEw3goHAwsH/iEfDhQXBwMHBgYD/tgFDwkDDQEmBgsLDxYfFg5AICYsEgwC+v5DBg4QEAkAAgAb//MCJwNQAEYAWQAAEyYmNz4DFx4DFz4DFx4DBxQOBAc2NhYWFxYOBicnFj4ENzYmIg4CBw4DBwYGJyImNRMGBhQWFz4FJyYOBCUFBQIBAwcMCgYMCQYBG0JHSCELHRkRAhckLSsmCiJcWUcMAxowQUdIPS4KGAU2S1ZLNAQFL1BiWEIIBAIBAQQDCxgCCj8DAwUFEj9HRC0MFBIzODguHwLoERsQBQwHAwQDDxQSBhAhFwsEAQkPFQ4bOjo4MSgNDRMGJisaQUZHQjgpFQIoASM5SUpFGiMfGys4Hh9CQ0IeFhwEAgECoBQ+Qj4VDzZDSkU5EQIDCxQdJgABABz/9gIPA00AMwAANzQ+BDMyHgIVBi4CJyIOBBUUHgIzMj4CNzY2MzIWFQ4FJyIuAhwPHS4+TzAbJxoMGxwREA8kPDAkGAwFFSomLVdJNwwCEAINGAcxQ09MQRQkNCEPxyR8kJN3TBQiLBkNDh0gBEVqgntkGCA7Lhs0TlkkAQEGESRPS0EsEQopPEUAAQAS//8CYQN0AEIAADcmPgQ3NC4EIyIOAgcTFg4CJwMOAwciBiMiJjU0PgQ1Mh4CFzYeBAcOAwciBiMiJrMBNFBfVDsEIjVEQz4VBRMYGQouBQsVGAcxAxESEAMBBQEGDw8XGxcPFgsCBA4fWmJgTCwDCERpik4BBQEKDSUKNk5ldYFDHzEnHBMJAQUHBv2gCxoSAQ4CbwIICQkBAQYKERUSERwqIRAVFQUDAhIhOE81UpmQiUMBHAAAAQAQ//8CCANYADoAADc0NiYmJzQ+AhceAxUlFhYGBgcFFBYXJTA2NhYXFA4EFQMWPgQ3HgIGBw4DByYmMAcBEBYIDA8IDREJAwGBCQsBDQ3+hQcFARYMERMJMEdTRzAHDzlGTkg9EwkOBgULJ251biYOERZgyMvIYAUPDAcDBR0iHwdgAhEVFARnQYBCYQwIAg4UIRwZGhsP/vkJBxQdGhQBAQsODwURKicdAwIJAAABAB7//wHgA18AMQAAEzQ2NjI3FT4DNzIWFRQHBRM+BTM2FhQGBw4FFRMUBiMiLgU0Hg4UFghJYE5KMwgGDv6QEVJxSikUBAEJBgUDBTdMVUkwAwoLDBMOCgYEAgM4DAoEAWoWIxsXCxAGDQiH/rwuQCoWCgIDBw4SCAciLDEqIAX++w4QP2mJkpF6WgAAAQAL/5ACkgNjAD0AACUOAyYmJyY+BhcyFgYGFSYOBBcWFj4DNyMmNjYyFz4CFgcOAwcOAhYXBy4DAf0dUl5iWEkVDQchOU1fa3Y+CAQCBUmEcVo9HAUEPFdmX0sQtA8YO1IrDS4qGQkBDA8NAhgUAgsIJgoNCALdI0w+JgM1Pix2g4d6Z0EVFQcMEgwKL16CkpdEOikNOVNiLxUWCQIDEwwGFQIJCQgBL36IhjYND1ZoYwAAAQAX//UBwgNQAEsAAAEOBQcOAhQWFhcGBiMiJjcDNDY2FhcWFBYWFz4DNzY0JiYnNDYzMh4CFR4FFRYUFAYHDgMHJiYnNDY0NjQ0AYcIKjc9NysIEhIIBAUBARUQBhABAwwSFAgBAQUHMWZTNgMCAwkHEQ0ODwcCAQICAwICAQIBAQEFDQ0UAwEBAQHSBREUFhURBg0vO0NAOhQQGQYIAzEODQEIBixydGwmFR0nPTQbKiovIBQLDhUaCxFIWWRZSBEVRkxHFQkSEAwDDSQVDD9SW1E/AAEAH//3AGkDUQALAAATNjYWFhcTFAYGJicfBBESEQMPDBESBgNGBgUCCAX8zAwKAQYGAAABAAX/tgG/A1QAKgAANz4CFgcGHgM2NzY2LgU3JjY2FhceAxUUDgIjIi4EDAQODgoBAh0zREhHHQwIBQ8TFBELAQUKExcJDh4aEA8mQTEcQUA6KRPBFBIBDAkbQDwwFQ0fFFJtf4F7ZEULChcOAg9RsrazUixLOCAbLDk7OQABABP/8QIIA1cAJwAAEz4CFhcyHgIUFhc+BxcOAwcFBgYnJRYOAgcWBicTAQoPEAgEBQIBAQEEIzZDR0c8LwtXhmFBEwGjAhMW/nsDAQMGAQIhEAMnDBQLAQkPJ0RqlWQHOVNhYFQ1DxVwpoVwOsoRHgK1EC0wLA4VDg4AAQAhAAACbgNSABAAADcmAiYmNTQ2FhYXEyUyBwUiNgMIBgQRFBIBIAGyQyb+Chwr1gEdsVUNDxIBFRf9I1w5awAAAQAT/+oC0wNlAD8AAAEmDgYnLgUnFB4CFRYGBiYnLgMnJjYzHgUXMj4ENzY2MhYXHgMXBgYmJicCTQQRGh8jJCMfDRAoLTEyMBYSFRIFCRIYCg4MDBERARAMLUg7MTAwHQQHDBYlOCgCEBMQAwoRFBoTAg4UFwoC4wI2VmxqXDYFIhhUYmlaQw1Our+6TwoUCgYPZNDS0GUUCg1FXW5tYyQHH0ByrXwGCQ0QXM3W22oOCwILCAABABv/9wIsA1kAOgAAEzYeAicBPgIuBCc0NjMyHgIVHgQUFxYWFRQGIyIuAjcuBScGHgIVFAYmJjcbCx8bEAQBbwMFAgEDBggKBwwSERYMBQEBAQEBAQENIRQLEQoBBRI4Q0lDOhIFBAoLGBoSBgNJEA0bGwH9jQ9DW2xsaFM3BhAdKDIwBxRXcHtwWBQcKhsWFgYOFxEVY32Ke1wRQauzqkEVCwYPBAACABUABgIpA10AEgAnAAA3Jj4DFhcWFg4DBwYuAhMOBB4CFxY+Ajc2NC4CBhYBNlhtbGAeGxQNLk9uRzhQMxnUESooIRMBHj40KFFEMwwKFio+Uf1+z5pfGi5AOZehnH9TBwMzTVcCBA5GYXJ0blk7BwU+aodDPHNgRh4TAAACABEAAAIhA1EALQA4AAA3ND4CJw4DIyImNTU0Nz4DMzIeAhc+Ah4CFw4FFwMUBiYmEz4DNy4CBgdPBwYCBgUNDQ4FCA0BCRkdGwoKCgcHCCJQUUw/LAcBPlpoWDgCDQ4SEj8zbmBJDQhJZXEwDWe6qp1KAw4OCw0KAwECCzAwJQoOEAUUHQsHHjgqN2BPPS0aA/6yCAcBBwGbEzJBUzY5MwErJgAAAgAV//4CJgNXAC0ATAAAEzIeAgc+AzMyHgMOAgcUHgIXFg4CJyYmJw4DIwYuAz4CEwYmNjYXMB4EMT4CLgInJg4DHgM2N9IFEA0GBBIcGRkRJzgnFwgDDRYNAw0dGwUEDhQKDiIXDyQrMBssTT0qEQorTZIEAggVFA0UGBQODxMFCx0wJEZkQCADFis9SVQtA1cCBwwJCQsHAi9OZnByZlMZAQYaNTALEg0EAxgzGRMpIRYBNl5+jJOIdv5lBBUWCRAbJy4oGihweHVeOwEHMlx8h4VvTxgoQAACABz/8AI6A1QAHwAyAAATNjYyFhcXPgMXHgIOBAcBFAYnJREGBiYmJxMGBhQUFT4GJicmDgIcAxMVEAIGEzRFVjVSSgUxUmZhUxUB1RoR/kcMEQoIAzsCAgU1TFdOOxEjNh5RUUYDRQcICww3BBkYEAYQLDU9PkA7NRb+5hAdAv7+tAoGAgkFArsUOD89GAUbKDE0MywjCgIIFSQAAAEADf//AkkDTwA5AAA3PgU3NC4GNTQ+BDMyNhYWFRQGIyciDgQVFB4GFRQOBCciJmgBN1JkXUoRLEhcYVxILCdAU1pYJgoWEQsqHisZP0A9Lx0sSF1gXUgsME5lZmEjCg4eBhIZISozHxASDAgOFic7LCtZVEo4IAEEDQ0gHA4dMT9DQxsiKxoNCgwVJR8ePDcvIRIBDgAAAf//AAQDHQNyADIAAAEmDgInJiY3NjYXJT4DFx4DFzI3MhYXFg4EBwYGHgMHFgYnLgI0JiYBWCdOTU4nCxcCARQLAS0BBgoOCQ0PCggGoaoDGgUGJUVYV00WCAIDCAcCBAYXIAgIBAIDAwEFBwoJAwEIEQsWARIFExINAQEPEQ4BBgEBERMKBAIEBDR4gISAeDQgCQUpdYmTjn8AAQAc//UCMwNRADMAAAEOAyMuBTY2NyY2NhYXBgYeAxc+Byc2NhYWFxYGBhIXFAYGJicDAdsLIDJHMjRLNCARBQEFAgMUGhcBFAEYLTM2FSI1KB0UDAYBAQcTEQ4DAQsDEB0NEhQHHgEoKWZaPg1MbIOJhXBRERAQAgoIk+CnckklBgNBZ4KKh25NCwwIAgsHGo3V/uugCgoDAQEBMQABAAT//gJJA1kAEQAAEyY2NhYXExM2NhYWBwMGJicBBwMNFBYH99YDExQQAegdIgz+8gM3DQ8BDg/9IgLxCgUFDwn80Q8FCgMqAAEADf/9A5QDWAAmAAATNDY2FhcTPgU3NjYyFhcTEzY2MhYXAw4CJicDAwYGJiYnDQsREwivBBkhKCciDAcVGBYHxpYFERAPBKkCDxUYCc66CRwaFAEDNg8NAwQD/P4ERGd+f3IoDw8MDP2+Au4JCw8T/OAEDQQMFQI4/bQMBQYLAwAB//z/+AH7A1YAIAAANzAGJiY3EwMmNhcTPgU3Nh4CBwMTFgYGJicDA0ERFA0FwNUDGhXSBh4oLCojCgYQDgcD19cHChQXBsO4AQUFFxwBWAGXFxMF/ocJN0tXUUIRAQQIDQn+XP6YDxcKBAwBUP60AAAB//z/+gIGA1gAHwAAAQE0NjMBPgU3Nh4CFQ4JByIiNQEx/sscCwElBBUcIB0WBQcRDwojMCATCwgJDRgmHA8fAVEBlg0P/poIOE5dXFEcBwQMEQZpkmU+Kh0gLEhtUQ8AAAEABQAIAhgDUgAdAAABBS4CNjc0PgYzFwEhFhYGBiMlIi4CNQG6/mMKCwMGBylFV1tZRi0CBP5SAbAJCQMNDP4yCwsFAQMaBgMMDw4DAQMDAgMBAQEv/RwEEhMOAQ4UFwkAAQAN/4wBoAOgAC4AABcmAiY0PgM1Jj4DFjcWFgYGJw4FBxQOAhYSFyUyFhYGBwUGLgIkCQoEAgQEAwUmQlVTSRYNCwMMCQowPkY+MAoDAgEFCwoBJQUNBwML/r0IDwwIR6oBA8GGWDEYBwEYHA8EAQEDAhQVDQUBAQECBQkHARM9dsf+2NEUDhMTAxsCCQ8QAAABAAb/9gG/A1cADAAAEyY2NhYXARYGBiYnAQsFCxIVBwF5BwUPFQn+fgMxCBQKBRD85g8XDAMMAywAAQAG/4wBmQOgAC4AAAUUDgInJSYmNjYzBTYSNi4CNS4FJwYmJjY3FjYeAwcUHgMUBgIBgggMEAf+vQsDBw0FASUKCwUBAgMKMD5GPjAKCQwDCg4VSlNVQiYFAwQEAgQKRwUQDwkCGwMTEw4U0QEox3Y9EwEHCQUCAQEBBQ0VFAIDAQEEDxwYAQcYMViGwf79AAABAEQB4gFdAssAEgAAEwYGJiY3Nz4CFhcXFg4CJyd/BxQTDQJiAQ4QDwR6CQkUGAZZAekGAQcPCrcDCgUDCa0LEgsDBYcAAQAmAAACrgBFABEAACUWFhQGBw4DIiIxIi4CNwKSDw0KCZXNhkkiBwcLBwICRQIRFBQEAQMBAQ4UFwkAAgAP//oBpAJfACEAMAAAJS4CNicOAi4CJyY+BBc2HgIXBh4CFxQGBiYDJg4EFxYWPgM3AW4OBwEBBi9TRTgnFgEHDSEzQUooFBsSCAICDxQTAhAUETsYODcyJBEFDiguMCwjCwoVREtJGmdzMQUjMxcma3JtUCcNAgcWJx5hiGhULRARBQgCASAKO19sayktEh9ET08bAAACABv//QG+A0oAJAA2AAA3LgMnMjYWFhUUFhQWFT4DFzIeAhUOBQcGBiYmNz4FNzQuAiMiDgIHLQYFAgIDDRcRCgEBJ0E6NxwgKhkKAQQTKElvUBodDwMyBS5ASD8sBAkTHRQpQzYpDgJYpL7snwMCCw8pTVx2UTM9HwcDGy06HxYzO0BHTCgHBAEDQQQWJDRFWDYPJB8VKT5JIAABAB0AAAGWAmQAMgAAEz4FFzIeAhUGLgQnJg4EFR4DFzI+BDc2FhUUDgIjIi4CHQMIEBopOykcHg0BDxUNCgcJBhIiHBcQCgEKFiQcJjUjFAwHBBodIDtUNS06IQ0BAClUT0Y0HgEvQkYWBgwbJCQgCggaMURFQBYeRTwrBhknMDErDgcQCy5bSCw5UFgAAgAP/8kBdANTACUAOAAAJQ4DIyIuAicmJj4DFzYmJzQ2NhYXBgYUFBYWFRYGBiYnAyYOAxYXMj4ENTQ0JiYBOwssOkUlEBMPDAkJARUrRWFABgoDEhcVAwEBAQEFDxYXAyomQzQiCRIaGTArJRwPBxHAGUI6KQgPFg4yenxxUCMPP39FCgkDAgNaloV8gpBWEBYGDBECHQY1W3FpVBAjNkNANQ4LODosAAAC/+v/+wHPAl0AMwA8AAATBi4CNz4DNz4DFzIeAhcWDgQHHgMzFj4ENzYWFxYOAicuAyUmJgcOAxc8ByMdChEHERELAQENJEM3FDIuIgQHHjZEPzAHBg4aJx4sPyoZDQUCCxwCASQ/VzEzPCMQAQAgQiMVIBQIAwELBgMMFQ4GBQUKCy1eSiwFEx8rGQoeJSYiGgUnVkgvAyA0PjgnAgYLGCdkVDMIATlRWvosGAUDITM/IQAB/+v/+AGPA2UAKwAAEwYmJjY3NyYmNjYXMh4CFQ4CJicuAyMOAhYXNxYWBwcTDgImJwMRFBACCAV5BgEYNzIYKh8TAQwODwQEERUWCCAfDAMD2AsIDtkeAhAUEQIXAYQBCg8RBzZFim0/Bh8uNhYKCwMDBCQuGwoBLE9vRE4HFRVZ/k0ICwMJDQGhAAIAE/68AbUCaAAqADsAABM+Azc2Ni4DNQ4DJiYnPgUXNh4EFxYOAiciJiY2ERY+BDc0JgcOBVVKaEQiBQMBAwQEAzBUSTssHAUCIjhKVlsuAQMFBQYFAwE6YX1CAw0HBAskLTIzMBULEx87NCseEf79BDdaeEYtRTk0OEEqjaxYEhk5HjJ5dWU8CCMBLk5ncHAwXZxsMg0IDhMBrCQBM1hpbS4MFQQGMUVTU0wAAAEAD//yAeoDUgAuAAAlNjYuAycmDgYXIgYGJjUDNDYWFhcTPgUXHgUXDgImAacDBAEGDRUPIDs0LCUdEgkBBxUUDxEQFBIDBQYTHiw/VzkSHRcRDAcBAxIVFAwiaHZ3YD8DCh9DXWdnVj0JBQMFCgM3CQUCCAT9iBFMXmNPLgUKHzdUfrB2Bw0ECgAAAgAW//cAaANIAA8AGgAAEzY2MhYXFB4CFxYGIiY1AzQ2MzIWFQYGJiYiBhAPDgQDBQQCARIVEhkSCxYLBhQVDwJmAwQGCEGXm5ZADxAPEAMcDQkdEwwKBhYAAv8m/soAWgLtAB8AKQAAByY+AhcWFjY2NzY0JiY3NjYyFhcGFhYGBxYOAyYTJiY2NhcyFhUU1AYEDBMKHEA5LAgGBAMDAxASEQMCAgMBBgEWKDdCSt4SCgkVDQsE5QcZEwUOJiMQSkhGpa6xUQcJBwlbo6ClXiFGOicGIwPFAxMVEAEWBh4AAAEAGP/xAagDWAAWAAATNhYXEwEyFhUBBRYWFAYHJRUGBiYmJxgXGwcCAQMRF/74ASYDCQ4T/tIHEBAPBgNBFwgX/dMBXgsU/pSSBBMTEQGeoxEKAwwFAAABACT/+ABaA1IACwAAEz4CFhcTBgYmJickBg0OCwQGBRAQDQIDQgQJAwYK/McKBwMKBwAAAQAG//UCfAKLAEkAADcuBSc0NhceAxc+Azc2HgIXPgMXHgcXBgYnLgUnJgYHBgYiJicuAycmDgQHBgYiJiQCAwMCBQkGHxQJBwMDBQwaHSIUEiAbFQYiLSIdEhgdEAcFCRIgGwkYDR0jFgoICQgdPTEFDg4OBQ4TEBEKCREQERIUDAQQERAJFFlzgnloHxkHBEt6X0UVXYJTJwMCPV5tLmV2PRABASdBVV5hWEsYEhkIE1t0fWhEAQS+uw0LCQdMjGxCAgIrS2d2fT0ICQgAAAEAFP/tAcMCbQAqAAATPgIWFwM+Azc2HgUGBwYGJyY0LgMnJg4EBw4CJicUAQ4SEgYDEx8uRjofLiEWDQYCAQEHIw4BAwkVJR0ZLyslHRQDAxIVFQUCVAoMAwcH/nBIjXNLBQMrSmNrbFxGEBELFBNdeINvSwUEPmaAfGgcCAoBCAsAAAIADwADAXoCagATACcAADcuAzc+AxceAwcOAxMmDgIHBh4CMxY+Ajc2LgKRKDMeCQIDLUNRJykzHAYEBSo/TzkhOS0eBQQCESUfGTcwJQYHBxclBAU2Tl0tRX5dMwYGQmBxNDtmSikCKAQxUWcyJEw+JwEkPU4pK1tOOQACABT+wgHOAlQAJgAzAAATPgIuAic+AhYXBz4DFhYHDgUjDgUVDgImEz4DNyYmDgMHFAkIAwIEBQICDA8SCQMiVVdSPSEFBC5DUExBEwEEBAUEBAUOEBBEIVxbSg8GKjlEPzYP/th8pHVaZYNkCxEHCA6CLEgvExA3MixlY1xGKw4zQUZANA0FCAIJAYgNT2+EQSAUCyc1QB8AAgAT/sEBmgJeACEAMQAAAQ4FJyYmPgM3Nh4CFwMOAiYnJj4FJgMmDgQXFj4FJgFfAxsrOUBGIx4DIkFNUiMWIxoOAQsCDRITCAIBAwUEBQECDxdER0EpBxYbOTUxKB0OBAEaFUJHQikIFx5rfYJrRgMCDxwnFfzgBwwDBgsDMk5iaGVUOgEIDi1YdHBeFgwVNEtVWU48AAABABT//QGUAmQAJQAANy4ENDU+AhYXFz4DFx4CBgcmDgIHDgIWBw4CJh8DBAIBAQEQExIEAw9DVFsnDQ0BCwktT0ExDhUPAwMBAREVFROKwH5HIgcBCQwDCAnmRVw1EAcDEBMRBAMVKTgfLWNiWCELCwELAAEAEv/8AZACYgAwAAA3FhY+BCYnBgYmJjc+AxceAwcGBicmDgIXFhY2NhYWFw4FJyYmLhM3PT81Jw4QHDNmUTICAzNPYTIKEQ4HAQEUETtePhoJEz1FSDomAgEqQVBPRRUXAkgPAhEhKC0pIgoMDg40NjRbQCIDAQEGDAwPEgIMIj1MHyQTBg8FJzQhPTUrHAoGFCcAAAH/zP/nAUUDVAAjAAATBy4CNjc3AzY2FhYXDgIWFzc2FhYGBwcUHgQVBiInSFwLDwYDB3ICAxQVEgMCAgECA5sOEAUICqwCAgIBAQIiFAHbHwMQEhAEKwEbDQwBDQofRUVBGz8EDRUUBE4KS2Z0ZksKIRAAAQAV/+IBlQJpADUAAAE+AhYXBgYWFhcWBgYmJycOAwcGLgI2Nic2NjIWFxYGBh4CFzI+BDc+BQE5AQsRFQsECwETGQEMFBQGIwQlMTQTLzYZBAQGAwMPEhEEAgICAwwZFxEiIh4WDgEBBAMDAwECTgYPBgsTTZmVkkUHCwUCCKcNMjMnAQNIdZCIbhoICAgIImZzdF8/BBYjKykiCQw1Q0xDNQABAAv/+gGhAmUAFgAAEz4CFhcTPgM3NjYWFgcDBgYmJicLAQwQEgiZMjYZBQEHFxQNA6MDEhMRAwJECw0EBAb+HZW1YyMCFgoMGQz90QYFAQcFAAABAAb/+gJCAmkAOAAANy4FJzY2MhYXEz4FNz4CFhcTEzY2FhYXDgcHBgYmJicDDgMHBgYiJl0DDRETEg4DAxASEgU9AxIXGxgSAwcUFRQHjjoEDxERBwEHCgwMDAkGAQcbGxUDjRIlIR0KBhISEAgRWXSCdFkREhEMCv46C0BVYFVACwkNAwsO/jIB8QoOARUZBjNKXGBcSjMGEA4BDgwBzlSLdF4nCwkIAAEADv//AZYCYQAbAAA3BiImNjc3Az4DFxc3NjIWFhUDFxYOAicnUxIdDgEMgpcBCw8RB5ByBRMSD4KZAwUOFw2RDAkNFg75AQwHEAwFA/XxAwULCf7k+QMTEggH5AABABT+rgGdAlcAHgAAFwMmNjYWFxMTNjYWFhcOAwcOBQcGBiYmJ/ndCAgUGwu4VwYREQ4CBRQYFwYEDA8RDw8FAhQYFQEBAfcMGQ4DD/5IAfEDBAIKCyh8g3cjFUdUW1RFFQwMAg4NAAEAFAANAcQCYAAeAAA3Jj4GNyUGLgI3FhY2NjcWFgcBJTIWBgYHFwIXKTc8OzIkBv7iBBUQBA0lY2lmJxIPBP63ATsMCgIOCg8JLkJQVVRKOxECAgsTFggBAgIHBwERFP4PBgsTGAwAAgAsAAEAcwNPAAkAGQAANzQ2FhYVFAYmJhM2NhYWFxQGBhYXBgYmJicuFRoWFxsVAwgSEAsBBAIDBgQTExACKBQQBBQQERIBEwMnDQYECQM9oaigPAwJAwwJAAACAC4CSwDcA0IACwAXAAATNjYWFhUHBgYiJicnNjYWFhUHDgImJ5gJGBUOAQETFxUDagkWEw0BARIVEwMDMQoFBg0IygcJCwzRCgUFDQjKBwkBCwwAAAIARwC6AesCzQA7AD8AAAEmNjYWFxc3NhYUBgcHFzc2FhQGBwcXFAYGJicnBxcWBgYmJycHBiYmNjc3JwcGJiY2NzcnJjY2FhcXNwc3JwcBPgUPGBoFCU0JCAYFTQhFCQcHBUUNDhMVBw5fDQEOFBYHDUkIDQMMEj4JUQgOAw0SRQkGDxgaBQldT10IXQKtBhEJBRFrEgINExYHE1cQAg0UFwcQjAkLBAEDkRWFCQwEAQSKEQYNFxsIDVYTBg0XGwgQdQYSCQYRcRWoFVcWAAACADQAgwHTAkwAIAAsAAABDgImJyY+AxYXNzQ2NhYXBzceAgYHBxcUBgYmNScmJg4CFhc+AwEbJUk8KwYMDCM0OTgWBg8UFAUNZAgOBgUKbAETFxQaESsrIhEJFhYvJRQBNCcjBRQQHTcvIQ4LFZINDwMJCptABQ0RFg0/qhQVAw4QxxQGDx0fGQQBFhsZAAABACkAaQInApYAOgAAEyYmNzcnJiY2NhcXJzQ2NhYXFzc2NhYGBwc3HgIGBw4DBwYGBxcWFgYGBycXFgYGJicnBwYmNzdLERELp5IKBwUNCZYHDxIQAQlyERQJAgR0yQgOBQcMCzQ7NQoDCAWlCwcEDgq1HQIOExIBHIgSDAKCATYHGQsrRgUSEAkEQb4KDwIOE7KmCAEKEQqaMAENEBAFAgwODAMBAQJjBxEPCwFiwQ0QBgUJtKICFxOjAAEAQgHjAHwC2AALAAATNjYWFhUHBgYiJidCCRURCwEBEBMSAwLJCgUGDQjKBwkLDAAAAQBCAeMAfQLYAAsAABM2NhYWFQcGBiImJ0IJFRILAQEQFBIDAskKBQYNCMoHCQsMAAACAC0CSwDVA0MACwAXAAATNjYWFhUHBgYiJicnNjYWFhUHBgYiJieYCRYSDAEBERQTA2sJFxMNAQESFRQDAzEKBQYNCMoHCQsM0goFBg0IygcJCwwAAAIAMQJLANEDQwALABcAABM2NhYWFQcGBiImJyc2NhYWFQcGBiImJ5gJFRALAQEQExEDZwkVEgwBAREUEgMDMQoFBg0IygcJCwzSCgUGDQjKBwkLDAAAAQAY/5kBlQPFAEEAAAU2FgYGBwYuAzY3NjYmJiMmJjY2Fz4CJicmJj4CFhcUBgcmJg4CFhcWFgcwDgIxFhYOAwceBQFYDgYHEAkyZlY7Cy4+DwMSIBMeBxgsFRMXBQ8TJA8cP1FeLBQOGUNANRYSKC0JHRohGzMhCikuKAQBHzA7OjMwAQ4SDwEIHj1VYmgwDCgoHQ8gGg4DCxIVHxktYFVEJQEaEB4DGwgbN0ZPJis7EREUESI3MTAzOiMsQS0cDwQAAAEADv+SAYsDvgBBAAAXFj4ENy4ENjcwLgIxJjY3NjYuAgYHJiY1NjYeAgYHBgYWFhc2FhYGByIGBhYXFhYOAycuAjZLEDM6OzAfAQQoLikKITMbIRodCS0nExY1QEMZDhQsXlE/HA8kFA4FFxMVLBgHHhMgEgMPPi4LO1ZmMgkQBwY3AQQPHC1BLCM6MzAxNyIRFBEROysmT0Y3GwgbAx4QGgElRFVgLRkfFRILAw4aIA8dKCgMMGhiVT0eCAEPEg4AAQA0/+YAcAODAAkAABM+AhYXEwYmNTQGEBEOBAMdHANzBAkDBgr8hBEIDgABACMBkgGHAioAHwAAATY2Fw4CJicmJgYGFwYuAic0PgIWFhcWFj4DAVYQGwYFJDNAIhEsKBoBCw4IBAMXJC0rJAkUIxsUDQMCHQUBFB4+IQoqGRYHKCQEAwkPCCEsFwULGhMfEAodHRcAAQAQAoEAlQMqAAwAABMuAycmNjceAgZ2Cx0cFQEMDxkXLRkEAoEMHyIiDg4cAhk2LyQAAAEAEwKcAJ0DOAANAAATJiY2NjcyFhUVDgM3HgYdMxoSDgIXHyICnAYiKzIXFA0IDR8fHQABAFoCdwFzA1sAEgAAEwYGJiY3Nz4CFhcXFgYGIicnjQcSEAoCYgEOEA8EegkIEhcGYQKBBgQFDAq3AwoFAwmtCw8IBYkAAQASAnUBdgMNAB8AAAE2NhcOAiYnJiYGBhcGLgInND4CFhYXFhY+AwFFEBsGBSQzQCIRLCgaAQsOCAQDFyQtKyQJFCMbFA0DAwAFARQePiEKKhkWBygkBAMJDwghLBcFCxoTHxAKHR0XAAEAJwJ9AT8DZgASAAABNjYWFgcHDgImJycmPgIXFwEFBxQTDAFiAg0QDwR6CQkUGAZZA18GAQgOCrcDCgUDCa0LEgsCBIcAAAIAIAJsASgDLQANABkAABM0NjYyFhYXFg4CJiY3HgI2NzYmJiIGBiAmOEI5JwIGHzdEPi02Cy4vJgICFCEnIRYCxCMvFxYrIBkoGAcPJyQUFgEWGBMaDQ0bAAIAFQJ4AQwDLAANABsAABMmJjY2NzIWFRUOAxcmJjY2NzIWFRUOAzkeBh0zGhIOAhcfImEeBh0zGhIOAhcfIgKQBiIrMhcUDQgNHx8dIwYiKzIXFA0IDR8fHQAAAQAUAPcAbAFEAA4AABM2NjMyFRQOAicGLgIWEBYSHggNDwcHEQ4HAScRDB0GEQ8IAwUFDRMAAQAUAmoAbALCAA4AABM+AhYXFA4CJwYuAhYBFxwcBggNDwcHEQ4HApoNFQYQGAYRDwgDBQUNEwABACgBAAC6AZ4AEAAAEz4DMzIVFA4CJwYuAiwNFRUXDzENFRkMDBwXDAFhEhcOBj0LIx8RBwoIGygAAQAjAQQBsQFcAAwAABMGJiY2NyUyFhYGBwVCCBEGCxQBWQoKAgUF/psBCQURGxwFCw8XGAcOAAABACMBBAJPAVEADAAAEwYmJjY3BTIWFgYHIUIIEQYLFAH3CgoCBQX9/QEJBREbHAUDDxcYBwABAC4BJwF+AXIAGAAAEzQ2Nz4DMzIWFhQVFAYVBwYGIzAGJiYuDAMxS0NGLAYHAwL5AhgGERQQATgEFgMDCQoHCw4NAgQNAQ4BAQECBwABAAn/9QKDA1MAVwAAEyImNzY2Nz4DMzIeAhUiLgIjIg4CBz4DMzIWBgYnBwYHNx4CBgcHFB4CMzI+Ajc2NhYWFw4EJiciLgI1By4CNjc2Njc2NjcGBkoaDwYRTS8QMD9OLRsnGgwUGBQWESA5MicOFS4qIAgJBgMKB54OBt0ECgILEdEEFSomLVhLOAwGExINAQcxQ09MQRQkNSQRWQcUDQEOID4eAgoGIDEBgCIXAgsGQ4txSBQiLBkVGBU9XnU3AwkIBhQWEgEeRDE3AwgNEg08JD4vGhQmOSQDAgUMCSQ9MCISAQolPEslGQIMEhQKAg0IGz8jBQUAAQAO/+0CTQL1AE4AABM0Njc2Njc+AzMyHgIVIi4CIyIOAgc2NjcyPgIzFA4CBwcWBgYWNz4EFhcWFgYGBy4CBgcGBi4CNjc+AzcGBiMiDgIBEU0vEDxOWy0bJxoMFBgUFhEgRkA0DipGDwISFBICJDlIJBYDBwMJEwsfLDdEUzEbEwwqIggnSG5OChYVEQgDCQEDBAUDIDELJgGqAhADAgsGQ2tMKRQiLBkVGBUdOlU3BQkCAQEBDRgVEQeTJVA/IwgEGRoWBhIbAhQYFQESHAMgKwkKCiVJdVYNFRUYEQUFAAIAKABaAeMC7AA5AE8AADcGJiY2NzcmJjcmJjc2FxYWFzY3Fhc2Njc2HgIHBgYHFhYXFAYHFxYGBw4DJyYmJwYGIwYnBgYTHgI+BCc0LgInIg4CFRUUXRQYCQcNZQ8GFhEVAwsbGw4EHzIvGhEcCQUWFhABCy0aCAMEBRUjAQECAgcLDgkHEgsOIxcuJhEtSwERGiEgHRQHBQELGRgUJRsQYwkLGiANlTtmNiNDGhwLBSgdHgwJGCVEGAMDCQ4IL1AnH0YjIVIwUwEPBAYMCQIGDysaDA4UUxpHAS5MViUDGioqHwMgNy0iCxckKRIEAgAAAQA3AA0B6QOYAGYAABM0NjU2NjIWFx4DFz4EFjc2NhcWFgcOBQcwBgYUFTY2NzI+AjMWDgIHFTY2FxYWBgYHJiIHFA4CIwc3DgImJzQ2NzY2NzcGBiciNTQ2Nz4DNzcuBWgBAwoMDQUSGhogFyc0IhIIAQEHBQwOGQUVJiIdGBQHAQEjNg0CEhQSAg8RMEgoGTAaHxMJGw4RMx8BAQMCPAUhQTQlBQsDNlcmASVEGSYCAQkiLTQbAgoeICAaEgNlAQUBCAYDAgZGXWEgXXZCGwUGAhMJBQURESxCNi81QCsPFhsNBQUCAQEBFB8XEAU8AgEDBA4QDwQFAytPPCMH2AUJAwcLBBYDAw0GPgMBAiQCEAMBBQYHA1oSPUhNRDQAAgAT/+QBmANNAE8AXQAANxQ+BCcmDgInIiY1NDY3JiY1ND4CMzIWFRQGIyIuAiMmDgIVFB4CMzI+AjMyHgIXFg4CBzY2MzIeAhcWDgQnIiYDFBY+AyYmBw4DdS9CRSwEICg3LCcYMSQhHSkeLkpfMhQdGhEBCQkJASRCNCALEBULFy0sLRgMGhcPAQcVKjkeEiUUDBoXDwEHFSs7PTkUFwchJjdANCAJO0AXKB0REQEdLzkzJQUGDRIQAj01LVAhBTwxNF5FKQYXDxwEBgQJKENPHw0OBwEOEQ4NFx4SDzI5OxgHCg0XHhIPMzo7MB4BGwEzGgMdNjs4JAcUDy81NwAAAQAc/80BRQNGAAYAABcBFwEiJjUcAQIn/vsOFgcDTQ/8lhYOAAABAGv+5QF8ABYAGAAABRYOAicmJjY2NzYWBgYHDgIWFzI+AgFmFg0zTywqLAIyNBIJBg0EFxkBGBoSIyMjsRAoIREIDElbWx0BERcUAx07MSIEDA8MAAEASf7xAS0AHgAkAAAXFBY2Njc2NiYmJyIuAjU2Nh4DBx4DFxYOAiciJiY2WCkyKwIBAQsbGxgiFQkEDxAPCQIFAyUwMRATGTtLHwwKAwLQAgQFEhIHERIVDAcTIRoYEwEPEhECEAsNGx8nOSURAw0SFQAAAwAb//sBmQBSAA4AHQAsAAA3NDY2FhcUDgInBi4CNz4CFhcUDgInBi4CNz4CFhcUDgInBi4CHRYdHQYIDQ8HBxEOB5UEGx0YAggNDwcHEQ4HlQQYHBkFCA0PBwcRDgcrDRUFDxgGEQ8IAwUFDRMLDRIEDxQGEQ8IAwUFDRMLDBUGDxgGEQ8IAwUFDRMAAAIAKQJ3ARcC1AAOAB0AABMmNjYWFRQOAicGLgI3NjYyFhUUDgInBi4CLgUaIx4IDQ8HBxEOB4wDHiIcCA0PBwcUEQoCpxAWBRIZBhEPCAMFBQ0TDhQWFhcGEQ8IAwUGDhQAAgAYABUAfQPIABAAIwAAEy4DJzY2MzIWFx4DFxceAxcUBgcGLgI1PgImJzsDCAkKBQoPCggLAwQHCAYCBAQEAgECAQEPGRQLBwgDAwQCUDNtY1AWBwgGCSZcYF0nSUhpYWhGCiIBCAEMEAcvYm+CTwAAAQA8//UAegDrAAsAADc2NhYWFQcGBiYmJzwJFhMMAQERFRMD3QoEBw4IygcIAQwMAAACACn/9gDJAO4ACwAXAAA3NjYWFhUHBgYiJicnNjYWFhUHBgYiJieSCRQQCgEBDxIRA2kJFhMMAQERFRMD3AoFBg0IygcJCwzSCgUGDQjKBwkLDAABADQAfAHBAu8AHAAANz4FJyUmJjU0PgI3BRYOBjciJjQEO1FaRiQN/skECwYJCgQBVBsHME1XVD4dDQwEpBc7P0M9NxSoAxUFBAwNCgPEEj1KUEtBKw8MFgACADQAfAKRAv0AHAA5AAA3PgUnJSYmNTQ+AjcFFg4GNyImNz4FJyUmJjU0PgI3BRYOBjciJjQEO1FaRiQN/skECwYJCgQBVBsHME1XVD4dDQwE0AQ7UVpGJA3+yQQLBgkKBAFUGwcwTVdUPh0NDASkFzs/Qz03FKgDFQUEDA0KA8QSPUpQS0ErDwwWFBc7P0M9NxSoAxUFBAwNCgPEEj1KUEtBKw8MFgABADAAkQHJAtUALAAAEzY1AT4DFxYWBwYVFAcOAwcXHgMXHgMXFhYHBgYHLgU3OQEBUQUICAwKDwQFAQElSE5VMQgBLj9DFQQaHhoGAwIEBRoOEEJNUD4iBwGXAgEBGAYOCgUEBRoOAQMBATNBNzosEgIeJygMAwsLCgEMEAoNFAQPKC4wLywSAAACADAAkQKdAuIALABZAAATNjUBPgMXFhYHBhUUBw4DBxceAxceAxcWFgcGBgcuBTc3NjUBPgMXFhYHBhUUBw4DBxceAxceAxcWFgcGBgcuBTc5AQFRBQgIDAoPBAUBASVITlUxCAEuP0MVBBoeGgYDAgQFGg4QQk1QPiIH1gEBUQUICAwKDwQFAQElSE5VMQgBLj9DFQQaHhoGAwIEBRoOEUFNUD4iBwGXAgEBGAYOCgUEBRoOAQMBATNBNzosEgIeJygMAwsLCgEMEAoNFAQPKC4wLywSEQIBARgGDgoFBAUaDgEDAQEzQTc6LBICHicoDAMLCwoBDBAKDRQEDyguMC8sEgAAAQAo//cAaAJ/AAsAABM2NjIWFxEWBiImNSgIFRMOAQESFRICdgQFCQr9qg8QDxAAAf/S/vQBhgNbAD4AABM0DgIjIi4CNTcuAj4CFx4DFRQGJyYmJyYOAhc3FgcHHgMHDgMnJiY2NhcWPgI3Ni4CdigzLgcFCAUClgEGAQgbLycaKh4RFw4aIw0UHxECCtgNEMQCCwkCBgUZL0QwEQoIFQ8fLR0QAwQECwwBrQUNFRQKDxEHQxJGUlZDKAQDJDA1FQ8IA0M5AgMpT25ATiIWWC+ElJdCMEsqAhgIGBIFCRQFJkMqOo2JeQD////r//gBtANlACYAQgAAAAcARQFMAAr////r//gBrANlACYAQgAAAAcASAFSAAIAAv/pAAACbgNSAAsAHAAAEwYmJjY3NzIWFgYHAyYCJiY1NDYWFhcTJTIHBSIICBEGCxSzCgoCBQWRAwgGBBEUEgEgAbJDJv4KHAFGBREbHAVBDxcYB/6h1gEdsVUNDxIBFRf9I1w5a///AAUACAIYBF4AJgA3AAAABwBoAEwA+P//ABQADQHEA2IAJgBWAAAABgBoNvz//wAN//8CSQRPACYAMAAAAAcAaABZAOkAAgAVAAUDBgNeAEIAVAAANyY+Ajc0PgIXHgMVJRYWBgYHBRQWFyUwNjYWFxQOBBUDFj4ENx4CBgcOAwcmJicGBgcGLgITDgQeAhcWNzY2NCYnBhYBKUZaMAgMDwgNEQkDAYEJCwENDf6FBwUBFgwREwkwR1NHMAcPOUZOSD0TCQ4GBQsnbnVuJg0RChEiEzhQMxnUESooIRMBHj40IigBBQwPFv1tupJnGwYODAYDBR0iHwdgAhEVFARnQYBCYQwIAg4UIRwZGhsP/vkJBxQdGhQBAQsODwURKicdAwIHCwYIAgMzTVcCBA5GYXJ0blk7BwQZVKyurVQMAAEADf/7BY0DZQB6AAABJg4GJy4FJyYmIxQeAhUWBgYmJy4DJw4DBwYeAhUWBgYiJy4FJyMiDgIjIiY1NDY3JT4DMzIeAjMzPgM3JiYnJjYzMh4CFx4FFzI+BDc2NjMyFhceAxcHBQAEERofIyQjHw0IISouKiIIDRUXEhUSBQ8ZHgoJAgIJDiNZV0gSBREZFwQBCxYQCxENDAsOCBQkSEdIJAsYEwsBKgEFCA0JDRALCQYJDUNTVR4CBAIBEAwbKyQbCwkgKCsoIQkEBwwWJTgoAhkJCwcCCg0UHhpMAuMCNlZsalw2BSIQQ1VdVEIQGB5Our+6TwoSCAcPWLa5uVwLCwcFBE+rratOEBEHAShse4OBdjAOEA4GEQsXASsFExMODRENAgcICQMLFAsUChonLhMOQFBYTz0NBx9Acq18BgkOD17O0s9dHgD//wAS//wBkANnACYATwAAAAYAaBUB/////P/6AgYD2gAmADYAAAAHAHoAXwEG//8A1ABdARIC5QBHAFcArgLmN8LO8gACAB3/sQGWAxwAPwBTAAAXNjY3BiIjIi4CNT4DNyYnNjYzMhYXFhYXHgMHIi4CJx4DFxU+Azc2FhYUFRQOAgcWFhUGBicyNjc2LgInDgUVBh4CygIDAggPCC06IQ0EDB86MgcKCg8KCAsDAwYCFjQlChMOGxsXCQMFBAICHx8UFBUNDAUUJjciAwUdJBQIDwcCAQYKBhEdGBIMBgMFFihBDyISAjlQWB85h3lZCkYrBwgGCSA8HAskLC0UFB0eCzt2f4lMCw4zPT4aAwcOEAUkRzwvDRsuAREDhgEBPY+Rjj4HMEJMSTwRHUQ8LAD//wAJAUIA+gJnAEcAPQAAAUUmKx6gAAEASACWAjwBxQAhAAATNDY3PgMzMhYWFBUUFhUUBgYiIyImIycFBgYjMAYmJkgMAzF4e3QsBgcDEQwODQIEDQEE/qACGAYRFBABjwQWAwMICAYLDg0COndHBgcCAvAHAQEBAgcAAAIAGgG1AM0CaQARAB4AABMmPgIzMhYXFhQGBiciLgI3FBYXFhY2Njc2JiIGIAYJGigZIBwLCBczKxEVDQUnDwgTFg0KCAIeJR8CARMlHhIYEiA1JBECERgZCQsNCwICBxIRGhwcAAIAEf//Ah4DAgASAFAAADc+BBYXFhYOAwciLgI3PgMXMh4CFQYuAjMiDgIVBgYWFhc+Azc2Fhc2LgIOAxUUHgIXFj4CNw4DIyIuAhEJOlNjY1ohJREdRWF4Qik3Ig6IBAoeOjIXGAsBFh0RBQIYHhEGAgELHBspKRoZGQ0KAQkXMkdNTDwlBRQpIypJPzMTDCAnLRklLxoJ7oHChEUINjhFl5KEZT0BM0pSkiRVSTEBHCYoDQUVHBkuPj4QESgkGgQMIyUjDQIIBWyQUBUgTnSXWBs8MSEBARwyRScMHBcPKDc6AAMAEf/9Ah8C8wASAE4AXwAANz4EFhcWFg4DJyIuAhMwHgIzMhYHBz4DFxYWDgMHHgMXFhc2Ni4CBgcOAxUUHgIXFj4CNyYnLgMnFScTDgMVPgQmJyYOAhEJN09fX1chKx4TPmGBSyk3Ig6TDQ8MAQILAQQJGiIqGDMhDC03NA0NKy4pChMHFxIMK0ttSA8fGREFFSgjKEc8MRITHAkuNC0JLzkBAgICAyg0NBsIIQ4kJB/ugcB/QQQ4OEmZkIBeNgIzSlIBcAUFBQIFHQIODgoCDicqKyUcBwYZGxcDDQs3enFdMQUoLWFjYi8bOC4jBggOJDYiAhcDHCEcApMFASkIFxoZCgIUGh8cFwUBBQsRAAABABIATwGxAnYASQAANzQ2NzY2NyciJyImIyIGByYmNTQ+BDU1ND4CMxU+AzMUBgcGBgcOAwcGBh0CNjYzMhYWFBUUBhUOAyMwBiYmNgwDKUgjGwMEAwUCIEIbCBYbKC4oGw4SDwIfKCYrIgYNFTYVAw0OCwIDCyVKKQYHAwJeeUgeAxEUEGAEFgMCCweaAQEUCwYSDAwNBgMGDAzxBgcFAfYKDQgECh4EBQoFAQMFBAECCgKqBAgKCw4NAgQNAQYLCgYBAgcA//8AEgEjAQYC+ABHAA8ACgEeJY0kCP//AAwBVwEQAzgARwAQAAcBVSVmJGAAAQAaAAwBzQLXAEAAACUuAzQmJw4DBx4DFRQOAiMiJic2LgInDgMmJjU0PgI3PgIWFxQeBBUUFhUUFgYGIyImAaEICQQBAQEJDAsOCgIJCQYBBg8PCwgCAQcKCwIFKTg+NCIQJz8wOEcyKRoEBQYEBAEBBQwMBAshQGpdWF5oQAcCAQkONoyTjDYJFxQOEgwqgYyGMBQhFwsJHBwtQi8gCgUHAgUGF2J8iHxiFwIbBQgNCgYLAAABAB7/bwGGAmIAOQAAJQ4EJiciDgIUFDUHEzY2MzIWFxQeBBceAxcyPgQ3PgM1Fx4DFw4DIwE3CykvMiobAgMFBAIvBwQPCggPBQIEBAQDAQEEBw0KECMhHRcNAQIEAwE9BgMBBAgCEhYTArsaMCQWAxIXIzM7MR8EEQLkCwQECw05SE9IOA0IJCcfAR0sNjIoCRJHUEcSA12Lc2Y3AgICAf//ACkBPwBkAwwARwAOAAMBPzieI0n//wANATkBLgJuAEcASwABATczCCBB//8AKf/TAu0DPABnAA4AAwEDOJ4osAAmAAwh8ABHABEA6v/dOtMrLP//AE3/5gKTA0wAZwAOACwBEDE7KjcAJgAMWQAARwAPAUYADDG2LuH//wAs/9YDuQNTAGcAEAAlANwycC+OACcADAFQAAAARwARAif/4i3kMcH//wBDACICVAQDAEcAHAJkBAO3+MLW//8AEP/CAm4EDwAmAB4R4gAHAGQAogDl///////gAl0EGAAmAB4AAAAHAGUAhQDg///////gAl0ERgAmAB4AAAAHAGYAGQDr///////gAl0ECwAmAB4AAAAHAGcASAD+///////gAl0DzAAmAB4AAAAHAHoAUgD4///////gAl0ERgAmAB4AAAAHAGkAVwEZAAEAJf98AikDSAA6AAAXFAYnAz4DFhYXFA4EBz4DFhYXFg4EJyc+BiYnJgYHNT4DJyYOBAdiHh0CBD9aZlg7AhkoMC4oCg83QkU7KgYFK0pdWUsSIQg1RlBJOBYVKDiBNiZPOBIWEjM4OC4fA2IaCAsDNx80JBMCGxsbOzw6MykNDhgOARQrJSFbX1tEJwYlAh0vPENFQDYTByEldCJPSz8TAgMLFB0mFwAAAgAd//oBvgNSABcAKQAAFxEyNhYWFRU+AxcyHgIVDgMHBxM+BTc0LgIjIg4CBx0NFxEKJ0E6NxwgKhkKARFDiHkMAwUuQEg/LAQJEx0UKUM2KQ4DA1IDAgsPxzM9HwcDGy06HyFWZXI83QEiBRUkNEVYNg8kHxUpPkkgAAIAHf7YAb4CeAAXACkAABMDMjYWFhUVPgMXMh4CFQ4DBwMDPgU3NC4CIyIOAgcmCQ0XEQonQTo3HCAqGQoBEUOIeQMGBS5ASD8sBAkTHRQpQzYpDv7bA5oDAgsPxzM9HwcDGy06HyFWZXI8/tsBagQWJDRFWDYPJB8VKT5JIAAAAQBMAI8BkQIeADEAAAE2FhYGBwceAwcGJy4DJwYGBwYuAjc3JzQ0NzY2Fx4DFxYzFjMWFD4DAWERFgkGC24JIh8WAgkZGQ0JFiMXOBIEExQOAXprAQQSEQcWHCAPAgEBAgMDCRcoAgAGBxAVCYUSLS4tERIHAxonMRsVPiUCAQUJBpWkAQoDBw8HDCYpKA4BAQEDAgscMf//ABoBJQFqAjAAJgAXfQAABgBw7AAAAgARAAMCFQNOACoAOAAAAQcWFgYGBy4DNjYzMhYXNi4CJwcuAjY3NyYmJyY2NhYXFzcWFgYGAzY2LgMHDgIeAgHDWjQNNW1HM0cpDREvJUJvMRACFR4LuwMHAgkMkBMvHQ4NHB8EZ6kfAR0q9DIkCSo2ORITFwUNIjcCQBZ2wY5WDAM8VmJTN0I8FktTTxoZBxgXEgITKV85DxEGBgjUIRQaEQr+BB9BPTUjEAcHLz1CNBwAAQA8/tsAkP/eABEAABMGJic+AiYnND4CMx4CBnUXGQkECwYDCQMJEw8KDwQL/uYLCRERMDMxExATCgQPJzlQAAEAIwJ3AbECyQAMAAATBiYmNjclMhYWBgcFQggRBgsUAVkKCgIFBf6bAnwFDxkaBQsOFBYHDgAAAQApAnABOAMWABcAABMeAzY2NzYWFgYHDgIuAicmNjYyagQNEhkgJhcXGAYGByI5MScfGAgQCRocAukDEhILCCIlEAMXIQ0sKQkQGx4KChwS///////gAl0EIgAmAB4AAAAHAK4AJAEM///////gAl0DzQAmAB4AAAAHAK0AFgEE//////8FAr0DZQAmAB4AAAAHAHcBQQAg//8AHP/2Ag8D/gAmACAAAAAHAGUAugDG//8AHP/2Ag8EVAAmACAAAAAHAGgAVQDu//8AHP8JAg8DTQAmACAAAAAGAHhSGP//ABz/9gIPBFYAJgAgAAAABwBmAEkA+///ABz/9gIPA/AAJgAgAAAABwBsAMoBLv//ABL//wJhBFYCJgAhAAAABwBoAGIA8P//ABD//wIIA+AAJgAiAAAABwBlALIAqP//ABD//wIIA+EAJgAiAAAABwCuAD0Ay///ABD//wIIBB8AJgAiAAAABwBoACkAuf//ABD//wIIBEIAJgAiAAAABwBmADQA5///ABD//wIIA9EAJgAiAAAABwB6AHAA/f//ABD//wIIA5oAJgAiAAAABwBsAKAA2P//ABD//wIIA+gAJgAiAAAABwBkAH8Avv//ABD//wIIA9QAJgAiAAAABwCtACoBC///ABD/cQJhA1gAJgAiAAAABwB3AOUAjP//AAv/kAKSBAMAJgAkAAAABwCuAJIA7f//AAv/kAKSBFgAJgAkAAAABwBmAI4A/f//AAv+1gKSA2MAJgAkAAAABwCsAIb/+///ACD/nQKnA94AJgAkFQ0ABwBsATgBHP////r/9QHnA1AAJgAlAAAARgCtz9ZPNjwV//8AF//1AcIEYQAmACUAAAAHAGYABAEG//8AJP/3AK4EJgAmACYdAAAHAGUAEQDu////tP/9AMMEHQAmACYUBgAHAK7/iwEH////zf/5AOYEUwAmACYOAgAHAGb/cwD4////1v/yAMQD9AAmACYX+wAHAHr/rQEg//8AGQAAAHUD+gAmACYMCQAHAGwABQE4//8AEP/1AJUECgAmACYX/gAHAGQAAADg////7f8VAP4DVwAmACYLBgAGAHeCMP///3H/9wDVBEAAJgAmEQAABwBn/18BM///AAX/tgHABEYAJgAnAAAABwBmAE0A6///ABP+2wIIA1cAJgAoAAAABgCsOAD//wAhAAACbgQJAiYAKQAAAAcAZQCuANH//wAh/tsCbgNSAiYAKQAAAAYArD8A//8AIQAAAm4DUgImACkAAAAHAGsAxQBW//8AG//3AiwEBAAmACsAAAAHAGUArQDM//8AG//3AiwESAAmACsAAAAHAGgAQwDi//8AG/7bAiwDWQAmACsAAAAGAKxBAP//ABv/9wIsA/0AJgArAAAABwBnAGsA8P//ABUABgIpA/oAJgAsAAAABwBlAM8Awv//ABUABgIpBCkAJgAsAAAABwCuALMBE///ABUABgIpBFUAJgAsAAAABwBmAHcA+v//ABUABgIpA80CJgAsAAAABwB6AKoA+f//ABUABgIpBBsAJgAsAAAABwBkAN0A8f//ABUABgIpBBcAJgAsAAAABwBqANcA6///ABUABgIpA8cAJgAsAAAABwCtAFEA/gADABX/5gIpA1oAJAAvADsAADcmPgQXNzYWFwcWFhcWFg4DBwYmJwcGBiYmNTcuAxMOBBYXASYGEzYmJwEWFhcWPgIWAShEWF5dJgcSIwETBgsFGxQNLk9uRxcoERIKFRIMGhQeFAnUEy8rIgsRHQEhIFu8Dg0b/usLGQ8oUUQz/Wy4kWg4BRoPDgIZKwgTCjmXoZx/UwcCCAgpBQMGDAo7FDI0MgH4EFNwgn9xJgKKGgn+mVSbNf1+BQgCBT5qhwAEABX/5gIpBAkAJAAvADsASQAANxQeAhcHFBYWNjc3FhY3PgQmJyYmJzcmJgcHJg4EEzY2FwEmJj4DAQ4DJyYmJwEWFgMmJjY2NzIWFRUOAxYJFB4UGgwSFQoSESgXR25PLg0UGwULBhMBIxIHJl1eWEQo1TpbIP7fHRELIisvAQkMM0RRKA8ZCwEVGw3PHgYdMxoSDgIXHyL9FDI0MhQ7CgwGAwUpCAgCB1N/nKGXOQoTCCsZAg4PGgU4aJG4AXgwCRr9diZxf4JwU/7ZQ4dqPgUCCAUCgjWbAW8GIisyFxQNCA0fHx3//wAVAAYCKQQDACYALAAAAAcAZwCKAPb//wAc//ACOgQuAiYALwAAAAcAZQDzAPb//wAc//ACOgRYAiYALwAAAAcAaAA6APL//wAc/uQCOgNUAiYALwAAAAYArGkJ//8ADf//AkkD8QAmADAAAAAHAGUA6QC5//8ADf8uAkkDTwAmADAAAAAHAHgAzQA9//8ADf//AkkEQwAmADAAAAAHAGYAcgDo//8ADf7kAkkDTwAmADAAAAAHAKwAiQAJ/////wAEAx0DcgImADEAAAAHAK0Apv7p/////wAEAx0EeQImADEAAAAHAGgAuAET//////7WAx0DcgImADEAAAAHAKwBLP/7//8AHP/1AjMD/gAmADIAAAAHAGUAuADG//8AHP/1AjMD+QAmADIAAAAHAK4ATgDj//8AHP/1AjMEVQAmADIAAAAHAGYALAD6//8AHP/1AjMDzgImADIAAAAHAHoAbgD6//8AHP/1AjMEMgAmADIAAAAHAGQAqwEI//8AHP/1AjMEKwAmADIAAAAHAGoAfQD///8AHP/1AjMDyQAmADIAAAAHAK0AKQEA//8AHP8KAp8DUQAmADIAAAAHAHcBIwAl//8AHP/1AjMEJwAmADIAAAAHAGkAbgD6//8AHP/1AjMD/gAmADIAAAAHAGcAbADx//8ADf/9A5QEDAAmADQAAAAHAGUBegDU//8ADf/9A5QESQAmADQAAAAHAGYA7wDu//8ADf/9A5QDyAImADQAAAAHAHoBBwD0//8ADf/9A5QEAwAmADQAAAAHAGQBXgDZ/////P/6AgYD/AAmADYAAAAHAGUAsQDE/////P/6AgYEUwAmADYAAAAHAGYAIwD4/////P/6AgYD+gAmADYAAAAHAGQAvQDQ//8ABQAIAhgEBwAmADcAAAAHAGUAnwDP//8ABQAIAhgD1AAmADcAAAAHAGwAtgES//8AD//6AaQDOAAmAD0AAAAHAGUAjwAA//8AD//6AaQDFgAmAD0AAAAGAK4IAP//AA//+gGkA1sAJgA9AAAABgBm7QD//wAP//oBpALrACYAPQAAAAYAekgX//8AD//6AaQDKgAmAD0AAAAGAGRtAP//AA//+gGmAskAJgA9AAAABgCt9QD//wAP/xICEgJfACYAPQAAAAcAdwCWAC3//wAP//oBpAMx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AYb/0gHS/+sB2//rAmP/6QIuAAUB5gAUAmgADQMXABUFrwANAaEAEgIm//wAnQDUAcEAHQEDAAgCZQBIAOUAGgIoABEBtAARAhMAEgFqABEBPwAMAf0AGgG5AB4AgAApAPIADAMEACkDFQBNA9wALAJpAEMCgQAQAnb//wJl//8Cav//AnD//wJt//8COQAlAc8AHQHFAB0CBQBMAYkAGgILABEArQA8AccAIwGEACkCef//Al///wKE//8CKwAcAisAHAIrABwCKwAcAisAHAJ3ABICHAAQAhwAEAIcABACHAAQAhwAEAIcABACHAAQAhwAEAIcABACoQALAqEACwKhAAsCoQAgAeP/+gHjABcArwAkAK//tACv/80Ar//WAK8AGQCvABAAr//tAK//cQGmAAUCVQATAmMAIQJjACECYwAhAmgAGwJoABsCaAAbAmgAGwI/ABUCPAAVAjwAFQI3ABUCRQAVAj8AFQIxABUCNAAVAisAFQI5ABUCPQAcAj0AHAI9ABwCaAANAmgADQJoAA0CaAANAqb//wKm//8Cpv//AjQAHAJCABwCQgAcAkUAHAI/ABwCQgAcAlkAHAJTABwCSwAcAk4AHAOeAA0DqgANA6EADQOnAA0CF//8Ahr//AIm//wCLgAFAiAABQGhAA8BoQAPAaEADwGhAA8BqgAPAaEADwGhAA8BoQAPAaEADwLmABUC3QAVAaEAHQGkAB0BpAAdAaQAHQGbABoB3f/rAd3/6wHb/+sB3f/rAdL/6wHV/+sB3f/rAdj/6wHm/+sByQATAdIAEwHJABMCA/+iAf0ADwCA/ysB6AAYAJ0ADQB8ABgA1QAkAJ3/2wHYABQB1QAUAdUAFAHYABQB2wAUAZAADwGKAA8BkAAPAY0ADwGNAA8BfwAPAY3/3wGHAA8BkAAPAYQADwGeABQBmwAUAZ4AFAGhABIBoQASAaEAEgGhABIA9P/PAZ4AGQGbABkBoQAZAZYAGQGeABkBmwAZAZ4AGQGkABkBmwAZAZ4AGQJLAAYCSwAGAlMABgJOAAYBnQAUAZ0AFAGdABQBnQAUAdsAFAHYABQCAAA9AgAAOwNfAAkDXwAJAncADQJjACEAlwAXAJf/yACX/7oAl//iAJcABgCX/5kAf//XAJf/pgBt/yYAzAAdAoEAEADj/6cA7P/MAncABwJfAA0AAQAABHn+qwAABa//Jv+JBY0AAQAAAAAAAAAAAAAAAAAAAWMAAwHTAZAABQAAAs0CmgAAAI8CzQKaAAAB6AAzAQAAAAIABQYAAAACAASgAACvUAAASgAAAAAAAAAAICAgIABAACD7AgR5/qsAAAR5AVUAAACTAAAAAAJiA1AAAAAgAAIAAAABAAEBAQEBAAwA+Aj/AAgACf/9AAkAC//9AAoADP/8AAsADf/8AAwADv/8AA0AD//7AA4AEP/7AA8AEf/7ABAAEv/6ABEAFP/6ABIAFf/6ABMAFv/5ABQAF//5ABUAGP/5ABYAGf/4ABcAGv/4ABgAG//4ABkAHP/3ABoAHv/3ABsAH//3ABwAIP/2AB0AIf/2AB4AIv/2AB8AI//1ACAAJP/1ACEAJf/1ACIAJ//0ACMAKP/0ACQAKf/0ACUAKv/zACYAK//zACcALP/zACgALf/yACkALv/yACoAL//yACsAMf/xACwAMv/xAC0AM//xAC4ANP/wAC8ANf/wADAANv/wADEAN//vADIAOP/vADMAOv/vADQAO//uADUAPP/uADYAPf/uADcAPv/tADgAP//tADkAQP/tADoAQf/sADsAQv/sADwARP/sAD0ARf/rAD4ARv/rAD8AR//rAEAASP/qAEEASf/qAEIASv/qAEMAS//pAEQATf/pAEUATv/pAEYAT//oAEcAUP/oAEgAUf/oAEkAUv/nAEoAU//nAEsAVP/nAEwAVf/mAE0AV//mAE4AWP/mAE8AWf/lAFAAWv/lAFEAW//lAFIAXP/kAFMAXf/kAFQAXv/kAFUAYP/jAFYAYf/jAFcAYv/jAFgAY//iAFkAZP/iAFoAZf/iAFsAZv/hAFwAZ//hAF0AaP/hAF4Aav/gAF8Aa//gAGAAbP/gAGEAbf/fAGIAbv/fAGMAb//fAGQAcP/eAGUAcf/eAGYAc//eAGcAdP/dAGgAdf/dAGkAdv/dAGoAd//cAGsAeP/cAGwAef/cAG0Aev/bAG4Ae//bAG8Aff/bAHAAfv/aAHEAf//aAHIAgP/aAHMAgf/ZAHQAgv/ZAHUAg//ZAHYAhP/YAHcAhv/YAHgAh//YAHkAiP/XAHoAif/XAHsAiv/XAHwAi//WAH0AjP/WAH4Ajf/WAH8Aj//VAIAAkP/VAIEAkf/VAIIAkv/UAIMAk//UAIQAlP/UAIUAlf/TAIYAlv/TAIcAl//TAIgAmf/SAIkAmv/SAIoAm//SAIsAnP/RAIwAnf/RAI0Anv/RAI4An//QAI8AoP/QAJAAov/QAJEAo//PAJIApP/PAJMApf/PAJQApv/PAJUAp//OAJYAqP/OAJcAqf/OAJgAqv/NAJkArP/NAJoArf/NAJsArv/MAJwAr//MAJ0AsP/MAJ4Asf/LAJ8Asv/LAKAAs//LAKEAtf/KAKIAtv/KAKMAt//KAKQAuP/JAKUAuf/JAKYAuv/JAKcAu//IAKgAvP/IAKkAvf/IAKoAv//HAKsAwP/HAKwAwf/HAK0Awv/GAK4Aw//GAK8AxP/GALAAxf/FALEAxv/FALIAyP/FALMAyf/EALQAyv/EALUAy//EALYAzP/DALcAzf/DALgAzv/DALkAz//CALoA0P/CALsA0v/CALwA0//BAL0A1P/BAL4A1f/BAL8A1v/AAMAA1//AAMEA2P/AAMIA2f+/AMMA2/+/AMQA3P+/AMUA3f++AMYA3v++AMcA3/++AMgA4P+9AMkA4f+9AMoA4v+9AMsA4/+8AMwA5f+8AM0A5v+8AM4A5/+7AM8A6P+7ANAA6f+7ANEA6v+6ANIA6/+6ANMA7P+6ANQA7v+5ANUA7/+5ANYA8P+5ANcA8f+4ANgA8v+4ANkA8/+4ANoA9P+3ANsA9f+3ANwA9v+3AN0A+P+2AN4A+f+2AN8A+v+2AOAA+/+1AOEA/P+1AOIA/f+1AOMA/v+0AOQA//+0AOUBAf+0AOYBAv+zAOcBA/+zAOgBBP+zAOkBBf+yAOoBBv+yAOsBB/+yAOwBCP+xAO0BCv+xAO4BC/+xAO8BDP+wAPABDf+wAPEBDv+wAPIBD/+vAPMBEP+vAPQBEf+vAPUBEv+uAPYBFP+uAPcBFf+uAPgBFv+tAPkBF/+tAPoBGP+tAPsBGf+sAPwBGv+sAP0BG/+sAP4BHf+rAP8BHv+rAAAAAgAAAAMAAAAUAAMAAQAAABQABANQAAAAUABAAAUAEAAqAF8AYAB6AH4AuwDFAQ4BEAEiASkBMQE3AUkBfgGSAf8CGwLHAskC3QO8HoUe8yAUIBogHiAiICYgOiBEIKwhIiISIhUiGfa+9sP7Av//AAAAIAArAGAAYQB7AKAAvADGARABEgEkASsBNAE5AUwBkgH8AhgCxgLJAtgDvB6AHvIgEyAYIBwgICAmIDkgRCCsISIiEiIVIhn2vvbB+wH//wAA/90ABP/cAAAAAP/gAAAAQgAAAAAAAAAAAAAAAP7xAAAAAAAA/eQAAPzdAAAAAOBbAAAAAAAA4FMAAOAy38Xfad5e3mHeUgqeAAAFgwABAFAAAAAAAAAAXgBkAAAAmAAAASYBRgFQAVwBYgGCAAAB5AHqAfAAAAHwAAAB+AICAAACAgIGAgoAAAIMAAAAAAAAAAAAAAAAAAACAAAAAAAAAwBXAFgAWQFiAAQAWgAFAAYABwBbAGAAYgBhAGMAAwCOAI8AcgBzAHQAewB1AHoAkwCQAIEAkQAKAJQArQCSAJUAlgCXAGUAmQCYAGsAeACaAJsAfwFQALQAvgC4ALsAvADMAMcAyQDKAWEA1wDcANgA2gDhANsAqQDfAPAA7ADuAO8A+gCoAKYBAwD/AQEBBwECAQYBCAEMARUBDwESARMBWAFUAVYBVwCrAScBLQEoASoBMQErAKoBLwE/AToBPAE9AUgApwFKALABBACvAQAAsQEFALIBCgC1AQ0AtgEOALMBCwC3AL8BFgC5ARAAvQEUAMABFwC6AREAwgEZAMEBGADEARoAwwDGARwAxQEbAM4BWwFZAMgBVQDNAVoAywCCAM8BHQDQAR4A0QEfANIBIAFTAV0A0wEhAIYBIgDUASMA1gEmANUBJAElAN4BLgDZASkA3QEsAIoBXgDiATIA5AE0AOMBMwDlATUA5wE3AOYBNgCJAIwA6wE5AOoBYADpAV8A9QFDAPIBQADtATsA9AFCAPEBPgDzAUEA9wFFAPsBSQCNAP0BTAD+AU0AhwCIAVEBCQDgATAA6AE4AOsBOQBmAGgArgBsAGkAdwBnAGoA+QFHAPYBRAD4AUYA/AFLAF0AXAB8AF4AXwB9AU4BTwBtAIAAfgDmATYArLgB/4WwBI0AAAAADQCiAAMAAQQJAAAASgAAAAMAAQQJAAEALABKAAMAAQQJAAIADgB2AAMAAQQJAAMAWgCEAAMAAQQJAAQALABKAAMAAQQJAAUAJADeAAMAAQQJAAYANgECAAMAAQQJAAgAIAE4AAMAAQQJAAkAIAE4AAMAAQQJAAoASgAAAAMAAQQJAAwANAFYAAMAAQQJAA0BTgGMAAMAAQQJAA4ANALaAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAyACwAIABLAGkAbQBiAGUAcgBsAHkAIABHAGUAcwB3AGUAaQBuAC4AUwBoAGEAZABvAHcAcwAgAEkAbgB0AG8AIABMAGkAZwBoAHQAIABUAHcAbwBSAGUAZwB1AGwAYQByAEsAaQBtAGIAZQByAGwAeQBHAGUAcwB3AGUAaQBuADoAIABTAGgAYQBkAG8AdwBzACAASQBuAHQAbwAgAEwAaQBnAGgAdAAgAFQAdwBvADoAIAAyADAAMQAyAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMAIAAyADAAMQAyAFMAaABhAGQAbwB3AHMASQBuAHQAbwBMAGkAZwBoAHQAVAB3AG8ALQBSAGUAZwB1AGwAYQByAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AaAB0AHQAcAA6AC8ALwBrAGkAbQBiAGUAcgBsAHkAZwBlAHMAdwBlAGkAbgAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGMAbwBwAGkAZQBkACAAYgBlAGwAbwB3ACwAIABhAG4AZAAgAGkAcwAgAGEAbABzAG8AIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFjAAAAAQACAAMACAAKAAsADAAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAAQABQAGAAkADQC3ALYAtAC1AF4AYABfAGEAQwCNANgA2QDhAN0A3wDDANwAhwCyALMA7wECAIUAvQCWAIYAvADgAN4AqwCOAOgAxADFAL8AqgC+AKkA1wCmAMAAwQDiAOYA5wDkALAAjADlALsAowCEAJ0ApACDAIsAigCTAPIA8wCIAJcA8QCeAPUA9AD2AKIArQDJAMcArgBiAGMAiQDuAO0A8AC4AOoBAwDaANsBBAEFAQYA/QD/AGQBBwEIAQkAZQEKAQsAyADKAQwAywENAQ4A+AEPARABEQESARMAzAEUAM0AzgD6AM8BFQEWARcBGAEZARoBGwEcAR0BHgBmANABHwDRAGcA0wEgASEAkQEiAK8BIwEkASUBJgD7AScBKAEpASoBKwDUASwA1QBoANYBLQEuAS8BMAExATIBMwE0ATUA6wE2ATcBOAE5AGkBOgBrAGwAagE7ATwAbgBtAKABPQD+AQAAbwE+AT8AcAFAAUEAcgBzAUIAcQFDAUQA+QFFAUYBRwFIAUkBSgFLAUwBTQDjAU4BTwFQAVEAeAB5AVIAewB8AVMAegFUAKEBVQB9AVYBVwFYAVkA/AFaAVsBXAB+AV0AgACBAV4AfwFfAWABYQFiAWMBZAFlAWYA7AFnALoBaAFpAWoAggDCAJABawFsAW0AdAFuAHYAdwB1AW8BcAFxAXIBcwCxAXQBdQDpAAcERXVybwtjb21tYWFjY2VudAZBYnJldmUHQW1hY3JvbgdBb2dvbmVrC0NjaXJjdW1mbGV4CkNkb3RhY2NlbnQGRGNhcm9uBkVicmV2ZQZFY2Fyb24KRWRvdGFjY2VudAdFbWFjcm9uB0VvZ29uZWsLR2NpcmN1bWZsZXgMR2NvbW1hYWNjZW50Ckdkb3RhY2NlbnQESGJhcgtIY2lyY3VtZmxleAZJYnJldmUHSW9nb25lawZJdGlsZGULSmNpcmN1bWZsZXgMS2NvbW1hYWNjZW50BkxhY3V0ZQxMY29tbWFhY2NlbnQETGRvdAZOYWN1dGUGTmNhcm9uDE5jb21tYWFjY2VudAZPYnJldmUNT2h1bmdhcnVtbGF1dAdPbWFjcm9uC09zbGFzaGFjdXRlBlJhY3V0ZQZSY2Fyb24MUmNvbW1hYWNjZW50BlNhY3V0ZQtTY2lyY3VtZmxleAxTY29tbWFhY2NlbnQEVGJhcgZUY2Fyb24MVGNvbW1hYWNjZW50BlVicmV2ZQ1VaHVuZ2FydW1sYXV0B1VtYWNyb24HVW9nb25lawVVcmluZwZVdGlsZGUGV2FjdXRlC1djaXJjdW1mbGV4CVdkaWVyZXNpcwZXZ3JhdmULWWNpcmN1bWZsZXgGWWdyYXZlBlphY3V0ZQpaZG90YWNjZW50BmFicmV2ZQdhbWFjcm9uB2FvZ29uZWsHYWVhY3V0ZQtjY2lyY3VtZmxleApjZG90YWNjZW50BmVicmV2ZQZlY2Fyb24KZWRvdGFjY2VudAdlbWFjcm9uB2VvZ29uZWsLZ2NpcmN1bWZsZXgKZ2RvdGFjY2VudARoYmFyC2hjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAZsYWN1dGUMbGNvbW1hYWNjZW50BGxkb3QGbmFjdXRlBm5jYXJvbgtuYXBvc3Ryb3BoZQxuY29tbWFhY2NlbnQGb2JyZXZlDW9odW5nYXJ1bWxhdXQHb21hY3Jvbgtvc2xhc2hhY3V0ZQZyYWN1dGUGcmNhcm9uDHJjb21tYWFjY2VudAZzYWN1dGULc2NpcmN1bWZsZXgMc2NvbW1hYWNjZW50DHRjb21tYWFjY2VudAZ1YnJldmUNdWh1bmdhcnVtbGF1dAd1bWFjcm9uB3VvZ29uZWsFdXJpbmcGdXRpbGRlBndhY3V0ZQt3Y2lyY3VtZmxleAl3ZGllcmVzaXMGd2dyYXZlC3ljaXJjdW1mbGV4BnlncmF2ZQZ6YWN1dGUKemRvdGFjY2VudAdBRWFjdXRlBkRjcm9hdAZMY2Fyb24GaWJyZXZlB2ltYWNyb24HaW9nb25lawZpdGlsZGUIZG90bGVzc2oGbGNhcm9uBHRiYXIGdGNhcm9uAAABAAH//wAPAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQBmAAQAAAAuAJQAtgD0ARoBYAF2AaQBtgG8AdoCDAIeAjAChgKUArYDfAPOBAwEGgR4BIoEmASqBToEwATWBQgFhgU6BRIFKAU6BUAFZgVwBYYFjAW2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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
