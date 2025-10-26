(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rosarivo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGkAdgBvACAAUAByAG8AIgAsACAAIgBSAG8AcwBhAHIAaQB2AG8AIABVAEcAUgAiAFIAbwBzAGEAcgBpAHYAbwBSAGUAZwB1AGwAYQByAFAAYQBiAGwAbwBVAGcAZQByAG0AYQBuADoAIABSAG8AcwBhAHIAaQB2AG8AOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBSAG8AcwBhAHIAaQB2AG8ALQBSAGUAZwB1AGwAYQByAFIAbwBzAGEAcgBpAHYAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFAAYQBiAGwAbwAgAFUAZwBlAHIAbQBhAG4ALgBQAGEAYgBsAG8AIABVAGcAZQByAG0AYQBuAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB1AGcAcgBkAGUAcwBpAGcAbgAuAGMAbwBtAC4AYQByAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/nABDAAAAAAAAAAAAAAAAAAAAAAAAAAAA6AAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMBBADXAQUBBgEHAQgBCQEKAOIA4wELAQwAsACxAQ0BDgEPARABEQDYANkAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAvgC/ARIAwADBBGhiYXIGSXRpbGRlBml0aWxkZQJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAhrY2VkaWxsYQxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24ERXVybwAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAgADAOUAAQDmAOcAAgABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAgAKBsAAAQCYAAQAAABHASoBNAF6AcgB3gH0BMoCCgTgA0oCFAIeArAFfAQEBOADSgTgA1QDtgO8A7wD0gTuBAQEDgUSBTYEHAUABDIFAAUABRIFEgR4BH4FJAUkBIQFJATKBMoEygTKBMoEygTgBOAE4ATgBOAE4ATgBO4FAAUSBRIFEgUSBRIFEgUkBRIFJAU2BXwFkgYMBl4GaAABAEcACgARABIAEwAYABoAJAAlACcAKAAqAC0ALgAvADAAMgAzADQANQA3ADkAOgA7ADwAPQBEAEUARgBJAEsATgBQAFEAUgBTAFUAVwBZAFoAWwBcAIAAgQCCAIMAhACFAJAAkgCTAJQAlQCWAJgAnQCxALIAswC0ALUAtgC4AL0AvgC/AMgAygDSANkA2gDcAAIANv+6AFb/xAARACb/4gAq/+IAMv/iADT/4gA3/84AOf+cADr/nAA8/7AAh//iAJL/4gCT/+IAlP/iAJX/4gCW/+IAmP/iAJ3/sADO/+IAEwAk/7oAJv/YACr/2AAy/9gANP/YAID/ugCB/7oAgv+6AIP/ugCE/7oAhf+6AIf/2ACS/9gAk//YAJT/2ACV/9gAlv/YAJj/2ADO/9gABQAP/+IAEf/iANv/4gDe/+IA4v/iAAUAD//sABH/7ADb/+wA3v/sAOL/7AAFAA//2AAR/9gA2//YAN7/2ADi/9gAAgDa/9gA3f/YAAIA2v/xAN3/8QAkAET/3QBG/+wAR//sAEj/7ABM/+wAUv/sAFT/7ABY/+wAdf/sAKD/3QCh/90Aov/dAKP/3QCk/90Apf/dAKb/3QCn/+wAqP/sAKn/7ACq/+wAq//sAKz/7ACt/+wArv/sAK//7ACy/+wAs//sALT/7AC1/+wAtv/sALj/7AC5/+wAuv/sALv/7AC8/+wAz//sACYAJv+6ACr/ugAy/7oANP+6ADn/4gA6/+IARv/iAEf/4gBI/+IAUv/iAFT/4gBZ/84AWv/OAFz/zgCH/7oAkv+6AJP/ugCU/7oAlf+6AJb/ugCY/7oAp//iAKj/4gCp/+IAqv/iAKv/4gCy/+IAs//iALT/4gC1/+IAtv/iALj/4gC9/84Av//OAM7/ugDP/+IA2v/sAN3/7AACANr/7ADd/+wAGAAm/84AKv/OADL/zgA0/84AN//YADn/tQA6/7UAPP/EAFn/4gBa/+IAXP/iAIf/zgCS/84Ak//OAJT/zgCV/84Alv/OAJj/zgCd/8QAvf/iAL//4gDO/84A2v+6AN3/ugABAFX/4gAFAA0AHgBQ/+IAVf/iAFv/4gCG/2oADAAm/84AKv/OADL/zgA0/84Ah//OAJL/zgCT/84AlP/OAJX/zgCW/84AmP/OAM7/zgACANr/9gDd//YAAwAK/84A2v/sAN3/7AAFAAoAUAANAHMAbgAyANoAcwDdAHMAEQBG//YAR//2AEj/9gBS//YAVP/2AKf/9gCo//YAqf/2AKr/9gCr//YAsv/2ALP/9gC0//YAtf/2ALb/9gC4//YAz//2AAEAbgAUAAEAbgAKABEARv/iAEf/4gBI/+IAUv/iAFT/4gCn/+IAqP/iAKn/4gCq/+IAq//iALL/4gCz/+IAtP/iALX/4gC2/+IAuP/iAM//4gAFAAr/sAAN/9gAbv/EANr/ugDd/7oAAwA7/84A2v/xAN3/8QAEAA0AHgBT/+IAVf/iAFf/4gAEAAr/yQAN/+IA2v/nAN3/5wAEAAr/2AAN/+IA2v/YAN3/2AAEAEr/4gBuABQA2gAPAN0ADwARAEb/7ABH/+wASP/sAFL/7ABU/+wAp//sAKj/7ACp/+wAqv/sAKv/7ACy/+wAs//sALT/7AC1/+wAtv/sALj/7ADP/+wABQAdAB4AHgAeAG7/zgDa/84A3f/OAB4ABQAoAAoAKABE/+wARv/sAEf/7ABI/+wASv/2AFL/7ABU/+wAoP/sAKH/7ACi/+wAo//sAKT/7ACl/+wApv/sAKf/7ACo/+wAqf/sAKr/7ACr/+wAsv/sALP/7AC0/+wAtf/sALb/7AC4/+wAz//sANoAKADdACgAFAAk/6YAJv/xACr/8QAy//EANP/xADb/5wCA/6YAgf+mAIL/pgCD/6YAhP+mAIX/pgCH//EAkv/xAJP/8QCU//EAlf/xAJb/8QCY//EAzv/xAAIANv/OAFb/yQATACT/pgAm//EAKv/xADL/8QA0//EAgP+mAIH/pgCC/6YAg/+mAIT/pgCF/6YAh//xAJL/8QCT//EAlP/xAJX/8QCW//EAmP/xAM7/8QACAUgABAAAAaICQgAMAA0AAP/Y//H/3QAAAAD/4v/E/7r/zv/EAAD/4gAAAAD/0//O/7D/ugAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/x/7oAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9j/uv/O/6b/7P/sAAAAAP/EAAD/xP+//+IAAAAeAAAAAAAAAAAAAAAA/+IAAP/O/7oAAAAA/9gAAP/OAAAAAAAAAAAAAAAAAAAAAAAA/+z/zgAAAAAAAAAAAAD/xAAA/84AAAAA/+L/tf+c/7r/kv/s/8QAAP/OAAD/xAAAAAD/2P+6/8T/v//O/+z/xAAAAAAAAAAAAAAAAP/iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/zv+I/9P/pv/xAAAAAQArACQAJwApAC8AMgAzADQANwA5ADoAPAA9AEUAUgBTAFUAWQBaAFwAgACBAIIAgwCEAIUAkACSAJMAlACVAJYAmACdALIAswC0ALUAtgC4AL0AvgC/AMoAAgAaACQAJAABACcAJwAGACkAKQAEAC8ALwAFADIAMgAGADMAMwALADQANAAGADkAOgAIADwAPAAJAD0APQAKAEUARQACAFIAUwACAFUAVQAHAFkAWgADAFwAXAADAIAAhQABAJAAkAAGAJIAlgAGAJgAmAAGAJ0AnQAJALIAtgACALgAuAACAL0AvQADAL4AvgACAL8AvwADAMoAygAFAAIAJgAPAA8ACAARABEACAAkACQACgAmACYAAwAqACoAAwAyADIAAwA0ADQAAwA3ADcAAgA5ADoABAA8ADwABQBEAEQACQBGAEgABwBMAEwACwBSAFIABwBUAFQABwBWAFYAAQBYAFgADABZAFoABgBcAFwABgB1AHUADACAAIUACgCHAIcAAwCSAJYAAwCYAJgAAwCdAJ0ABQCgAKYACQCnAKsABwCsAK8ACwCyALYABwC4ALgABwC5ALwADAC9AL0ABgC/AL8ABgDOAM4AAwDPAM8ABwDbANsACADeAN4ACADiAOIACAAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFsaWcgAAgAAAABAAAAAQAEAAQAAAABAAgAAQAaAAEACAACAAYADADnAAIATwDmAAIATAABAAEASQ==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
