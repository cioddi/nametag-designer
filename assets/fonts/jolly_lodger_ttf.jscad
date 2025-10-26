(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jolly_lodger_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGUAcgAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsAA0AVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6AA0AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7MAMwAAAAAAAAAAAAAAAAAAAAAAAAAAAOgAAADpAOoA4gDjAOQA5QDrAOwA7QDuAOYA5wD0APUA8QD2APMA8gDoAO8A8AADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAYgBjAGQAZQBmAGcAaABpAGoAawBsAG0AbgBvAHAAcQByAHMAdAB1AHYAdwB4AHkAegB7AHwAfQB+AH8AgACBAIMAhACFAIYAhwCIAIkAigCLAI0AjgCQAJEAkwCUAJUAlgCXAJgAmQCdAJ4AoAChAKIAowCkAKkAqgCrAQIArQCuAK8AsACxALIAswC0ALUAtgC3ALgAugC7ALwBAwC+AL8AwADBAMMAxADFAMYAxwDIAMkAygDLAMwAzQDOAM8A0ADRANMA1ADVANYA1wDYANkA2gDbANwA3QDeAN8A4ADhAL0BBAd1bmkwMEEwBEV1cm8Jc2Z0aHlwaGVuAAAAAAEAAf//AA8=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
