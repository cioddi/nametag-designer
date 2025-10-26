(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.loved_by_the_king_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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Plckn///AD0ADgRjBdUQZwAUAAcBgjdIJkEQJgASVAgQRwAVAgYALEHQHfH//wA2ABgEVAXfEGcAFgACAWk8wB+7ECcAEgESABIQRwAXAr4AITkCIaP//wA8AB8CBgcTEEcAIgLIB1S5v72Y//8AFP99AvYHvRImACQAABAHAEMAewHu//8AFP99AuMHoBImACQAABAHAHQAfwEA//8AFP99AwoH2RImACQAABAHAT4AaAEM//8AFP99BIkH0xImACQAABAHAUQAVAD+//8AFP99AuMHUhImACQAABAHAGn/uwDR//8AFP99AuMIBBImACQAABAHAUL/DwE3//8AFP99BL4G1RAmACQAABAHACgCKwAI//8AJf0xAuEGzRImACYAABAGAHiCAP//ACb/3QKOCAIQJgAo+wAQBwBD/8YCM///ACb/3QKOB+IQJgAo+wAQBwB0//cBQv//ACb/3QKOCGAQJgAo+wAQBwE+/8QBk///ACb/3QKOB6wQJgAo+wAQBwBp/yYBK///ABj/8AIkB28SJgAsAAAQBwBD/6kBoP//AC//8AGZB1gSJgAsAAAQBwB0/8IAuP//ABP/8AIuB5QSJgAsAAAQBwE+/4wAx///ABr/8AHxB04SJgAsAAAQBwBp/soAzQAC/7T/tgL+B2AAFgAmAAABFjMEERABBiMiNSMTEhMvATUXNjc1NBMzFxUnAzM2Ezc1EiUiFQMBKWJeARX9oBU9OAxSKRmwOO4OCvAMK/o5DPDZHQT+y2McB2CJmv7R/bn9eIlEAVoBRgFyKSlGRNPhmLT8tCgpOfz4jwJ361IBOiDC/nsA////Zf/VA3MIGxImADEAABAHAUT+4gFG//8AKwAAAvoHERImADIAABAHAEMAIQFC//8AKwAAAvoHMxImADIAABAHAHQAHQCT//8AKwAAAvoHLxImADIAABAGAT4QYv//AAEAAAOzB4sSJgAyAAAQBwFE/34Atv//ACsAAAL6B0oSJgAyAAAQBwBp/1EAyQABABcAZAJYA9EAFwAAARcGBxMGIwYDBg8BJjU2NwInNTczMhMXAfRkmj+mExg1kKYzDjdJsIkpKSkpRikDsFysrP7XRiMBGecrDQ0rWvgBZCsrKf76YwD//wArAAAC+gYMEiYAMgAAEAYAEi0A//8AMf/sAroHdRImADgAABAHAEP/6AGm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/+cC4Qe4EiYAJgAAEAcBQQGiAWT//wAS/+cCSgZUEiYARgAAEAcBQQDHAAD//wAl/+cDHQhAEiYAJgAAEAcBP/9nAZ7//wAS/+cCSgaiEiYARgAAEAcBP/5nAAD//wAI/7YC1whEEiYAJwAAEAcBP/7WAaL//wA5/9UDgQZgECYARwAAEAcBUQKLAAD////N/7YC1wbpEiYAJwAAEAcAb/9n/ur//wA5/9UDlAX2EiYARwAAEAcAEACkAX///wAr/90CkwdWEiYAKAAAEAcAbwAbAfj//wAS/+wCSgVeEiYASAAAEAYAb/cA//8AK//dApMIBxImACgAABAHAUD/1gGY//8AEv/sAl4F4xImAEgAABAHAUAAEP90//8AK//dApMHohImACgAABAHAUEAqAFO//8AEv/sAkoGVBImAEgAABAHAUEAxwAA//8AK/69ApMGzRImACgAABAHAUMAxQAl//8AEv6YAkoEgxImAEgAABAHAUMA0QAA//8AK//dApMIQhImACgAABAHAT/+dAGg//8AEv/sAkoF+xImAEgAABAHAT/+dv9Z//8AI/++A3MIMRImACoAABAHAT4A0QFk//8AGfxqAzwF3BImAEoAABAHAT4Amv8P//8AI/++AukHwRImACoAABAHAUAANwFS//8AGfxqApMFdBImAEoAABAHAUAAKf8F//8AI/++AukHxxImACoAABAHAUEBQgFz//8AGfxqApMGVBImAEoAABAHAUEA3wAA//8AI/4OAukGyRImACoAABAHAWAAogAA//8AGfxqApMGrBImAEoAABAHAVABXgBM////9v+eAvAIGxImACsAABAHAT7/5gFO//8ACP/LAz4GbxImAEsAABAHAT4AnP7x////s//LAqAGbxImAEsAABAHAG//Tf86//8AL//wAvwHYBImACwAABBHAUT/5gE2Luk5tAAC/rb/9gJoBtUADAAhAAATFwYVEhcVByMiAxAzAQYvASYvASYPASc2NxcWHwEWNx8BpCs3BksoKUIhVAHZtsBvuhkMWD4GTCfRKahxFJiuFAoDojg3+P76+BwrAosBIQJa6jhB2QkEFpMtCOsbF/chBCuwBg3//wAv//ACBwcOEiYALAAAEAcAb//UAbAAAv+o//YBdQVeAAwAEgAAExcGFRIXFQcjIgMQMxM3FyYFN6QrNwZLKClCIVTBKQK7/u4GA6I4N/j++vgcKwKLASEBrAZoIg5eAP//AC//8AJQB54SJgAsAAAQBwFAAAIBLwAC/77/9gGqBUgADAATAAATFwYVEhcVByMiAxAzAzceATcXAqQrNwZLKClCIVTLJ311lj3wA6I4N/j++vgcKwKLASEBYCuyBtML/eT////i/pEBOQZOEiYALAAAEAYBQ6/5//8AIP61AWYFChImAEwAABAGAUPtHf//AC//8AFtB14SJgAsAAAQBwFBAJgBCgABADX/9gDpA6IADAAAExcGFRIXFQcjIgMQM6QrNwZLKClCIVQDojg3+P76+BwrAosBIQD//wAdAAADCAgAEiYALQAAEAcBPgBmATMAAv9e/AABqgVeABMAIgAAExcHEh0BECEmPQEzHwEzMhECAzYTMzITBicmJyMGDwEjNRK4KQ5g/sOYG2IMHd0pYhQnGznFdxJjHg9UajcNzQPHJ7f9GetI/TFQjVTCDQLPAqgBqkQBl/59M5F7BFZgJ0QBP///AB/+DgLuBpYSJgAuAAAQBgFgdwD//wAK/g4CvgXREiYATgAAEAcBYACHAAD//wBG/+wCzQbDEiYALwAAEAcAdAD2//n////Q/+cBOAdlEiYATwAAEAcAdP9hAMX//wBG/g4CiwbDEiYALwAAEAYBYH0A//8AE/4OANEGWhImAE8AABAGAWCtAP//AEb/7AKLB4ESJgAvAAAQBwFRAWYBIf//AEb/5wGaB7oQJgBPAAAQBwFRAKQBWv//AEb/7AKLBsMSJgAvAAAQBwB3AS8AAP//AEb/5wIIBloQJgBPAAAQBwB3ASEAAP///6D/7AKLBsMSJgAvAAAQBwAQ/zz/zP///0r/5wHWBloSJgBPAAAQBwAQ/uYAAP//ADX/1QNzB5QSJgAxAAAQBwB0AKIA9P//ACX/ugJOBqASJgBRAAAQBgB0GwD//wA1/g4DcwbfEiYAMQAAEAcBYAD2AAD//wAl/g4CTgS+EiYAUQAAEAYBYFgA//8ANf/VA3MHhRImADEAABAHAT/+4gDj//8AJf+6Ak4GVRImAFEAABAHAT/+ev+z//8AD//tAjgGwBImAFHqMxAHAWD/3Act//8AKwAAAvoHGhImADIAABAHAG8AIQG8//8ALv/ZAgYFXhImAFIAABAGAG/IAP//ACsAAAL6B5ASJgAyAAAQBwFAADUBIf//AC//2QI4BakSJgBSAAAQBwFA/+r/Ov//ACsAAAL6CAwSJgAyAAAQBwFFADcBif//AAf/2QIGBoMSJgBSAAAQBgFFpwD//wAr/5AE9waAECYAMgAAEAcAKAJk/7P//wAv/9kD+ARyECYAUgAAEAcASAGu/+///wAU/zUCugeSEiYANQAAEAcAdAA1APL//wAfAAQCHwagEiYAVQAAEAYAdAAA//8AFP4OAroGHxImADUAABAGAWB1AP//AB/+DgIfBEgSJgBVAAAQBgFgOwD//wAU/zUCugeyEiYANQAAEAcBP/61ARD//wAfAAQCHwaiEiYAVQAAEAcBP/5HAAD//wBC/v4C8AgZEiYANgAAEAcAdAB5AXn////D/9kB7AagEiYAVgAAEAYAdOgA//8AQv7+AzoIbRImADYAABAHAT4AmAGg////w//ZAfsGzRImAFYAABAHAT7/WQAA//8AQPxVAvAG4xImADYAABAHAHj/X/8k////w/0xAhoEfxImAFYAABAHAHj/HgAA//8AQv7+AvAIUBImADYAABAHAT//IgGu////w//ZAhMF9RImAFYAABAHAT/+Xf9T////+v4OA5gGTBImADcAABAGAWB/AP///83+DgGYBnMSJgBXAAAQBgFg4AD////6AAADmAe0EiYANwAAEAcBP/8BARL////N//wCfwZzECYAVwAAEAcBUQGJAAD///+3/+wDaQf6EiYAOAAAEAcBRP80ASX///9L//AC/QbVEiYAWAAAEAcBRP7IAAD//wAx/+wCugcKEiYAOAAAEAcAbwAbAaz//wAj//ACIwVeEiYAWAAAEAYAb9YA//8AMf/sAroHfRImADgAABAHAUAATgEO//8AI//wAiMGbxImAFgAABAGAUDSAP//ADH/7AK6B+oSJgA4AAAQBwFC/tgBHf//ACP/8AIjBs0SJgBYAAAQBwFC/lMAAP//ADH/7ALeB/ISJgA4AAAQBwFFAJoBb///ABP/8AIjBoMSJgBYAAAQBgFFswD//wAx/pgCugZcEiYAOAAAEAYBQ1YA//8AI/6YAiMD/hImAFgAABAHAUMAqgAA//8ASP+6BAIIABImADoAABAHAT4AiQEz//8AJwAAA3MGzRImAFoAABAGAT4tAP//ADX/qgN9CAgSJgA8AAAQBwE+ANsBO///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AukALQQ/AEgDDv/pAvYANQOaACcChwAhAn3//gJgABQDdQB7BN0AGwLFAG8CvABMAqgALQKHABICiwA5AocAEgIM/8UCuAAZAs8ACAEdADUBov9eAtsACgEhAEYDiQBCAn0AJQIpAC8CPQAdAq4ANQJEAB8CFP/DAYn/zQJEACMCHwA9A7wAJwKW//wCrgArAwIAJQJ3AB8B6QBGAncAGwTjAIMCDADIAocAEgRI/90DywB3AsP/9gE1AFoDAgBDBiUBUAP6AEQBqAAcBFoAdwQ3AFgDKQArAmoAZgFcAAwECABSAf4AIAHpADACrgBvAjkADAO2AEQBYgBgBFIA4QE9ADgBXAAfBE4ATgUAAD0EtAA9BWAANgIAADwDFAAUAxQAFAMUABQDFAAUAxQAFAMUABQFHQAUAtsAJQLbACYC2wAmAtsAJgLbACYBUAAYAVAALwFQABMBUAAaAtv/tAO2/2UDKQArAykAKwMpACsDKQABAykAKwKTABcDKQArAuMAMQLjADEC4wAxAuMAMQL2ADUCTgAlAvb/3wK8AAgCvABMArwATAK8/4gCvABMArwATAQ/AEwChwASAof/7QKHABIChwASAocAEgEd/04BHf89AR3/sAEd/6IC3QBcAn3/ZwIp/74CKQAvAikALwIp/8MCKQAvAgwAMgIpABYCRP/MAkQAIwJEAA8CRAAjAq4AKwHuABACrgArAxQAFAK8AEwDFAAUArwAYQMUABQCvABMAtsAJQKHABIC2wAlAocAEgLbACUChwASAtsAJQKHABIC2wAIA/IAOQLb/80CiwA5At8AKwKHABIC3wArAocAEgLfACsChwASAt8AKwKHABIC3wArAocAEgMQACMCuAAZAxAAIwK4ABkDEAAjArgAGQMQACMCuAAZAwL/9gLPAAgCz/+zAVAALwEd/rYBUAAvAR3/qAFQAC8BHf++AVD/4gEdACABUAAvAR0ANQJQAB0Bov9eArgAHwLbAAoCxwBGASH/0ALHAEYBIQATAscARgHXAEYCxwBGAoMARgLH/6ABIf9KA7YANQJ9ACUDtgA1An0AJQO2ADUCfQAlAn0ADwMpACsCKQAuAykAKwIpAC8DKQArAikABwVEACsESAAvArQAFAJEAB8CtAAUAkQAHwK0ABQCRAAfAykAQgIU/8MDKQBCAhT/wwMpAEACFP/DAykAQgIU/8MCy//6AYn/zQLL//oC8P/NAuP/twJE/0sC4wAxAkQAIwLjADECRAAjAuMAMQJEACMC4wAxAkQAEwLjADECRAAjBD8ASAO8ACcC9gA1Aq4AKwL2ADUDmgAnAwIAJQOaACcDAgAlA5oAJwMCACUCDP+gBR0AFAQ/AEwDKQArAikABQMpAEICFP/DA9UAhwYlAekCuABiASUAIwYlAekBmgAzBOMAgwL6AGAEPwBIA7wAJwQ/AEgDvAAnBD8ASAO8ACcC9gA1Aq4AKwJqAGADOwBaAWYASgFmAEoBZgBtAp4AgwKeAIMCngCDBBkA4wQZAMUBngBzBiUAtgM1AHcETgBOAskAeQRvADkGpP/+AmoAYAFCAGYDK//FAy//xQABAAAJXvuPAAAGpP62/lUGcQABAAAAAAAAAAAAAAAAAAABYwADAssBkAAFAAAFmgUyAAABGgWaBTIAAAPQAGYCAAAAAgAAAAAAAAAAAKAAAK9QAABKAAAAAAAAAABITCAgAEAAIPsCCV77jwAACV4EcQAAAJMAAAAABFcG7gAAACAAAQAAAAIAAAADAAAAFAADAAEAAAAUAAQBJgAAAEIAQAAFAAIAfgCsAK0BJQExATcBSQFlAX4BkgH/AhsCxwLJAt0DvB6FHvMgFCAaIB4gIiAmIDogRCCsISIiEiIVIhn2w/sC//8AAAAgAKEArQCuAScBNAE5AUwBaAGSAfwCGALGAskC2AO8HoAe8iATIBggHCAgICYgOSBEIKwhIiISIhUiGfbB+wH////j/8H/Y//A/7//vf+8/7r/uP+l/zwAAP54/ab+aPy54sbiWuE74TjhN+E24TPhIeEY4LHgPN9N30feXgAABmAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAE8AT0BHAEdARgBGQFgAAC4AAAsS7gACVBYsQEBjlm4Af+FuABEHbkACQADX14tuAABLCAgRWlEsAFgLbgAAiy4AAEqIS24AAMsIEawAyVGUlgjWSCKIIpJZIogRiBoYWSwBCVGIGhhZFJYI2WKWS8gsABTWGkgsABUWCGwQFkbaSCwAFRYIbBAZVlZOi24AAQsIEawBCVGUlgjilkgRiBqYWSwBCVGIGphZFJYI4pZL/0tuAAFLEsgsAMmUFhRWLCARBuwQERZGyEhIEWwwFBYsMBEGyFZWS24AAYsICBFaUSwAWAgIEV9aRhEsAFgLbgAByy4AAYqLbgACCxLILADJlNYsEAbsABZioogsAMmU1gjIbCAioobiiNZILADJlNYIyG4AMCKihuKI1kgsAMmU1gjIbgBAIqKG4ojWSCwAyZTWCMhuAFAioobiiNZILgAAyZTWLADJUW4AYBQWCMhuAGAIyEbsAMlRSMhIyFZGyFZRC24AAksS1NYRUQbISFZLbgACixLuAAJUFixAQGOWbgB/4W4AEQduQAJAANfXi24AAssICBFaUSwAWAtuAAMLLgACyohLbgADSwgRrADJUZSWCNZIIogiklkiiBGIGhhZLAEJUYgaGFkUlgjZYpZLyCwAFNYaSCwAFRYIbBAWRtpILAAVFghsEBlWVk6LbgADiwgRrAEJUZSWCOKWSBGIGphZLAEJUYgamFkUlgjilkv/S24AA8sSyCwAyZQWFFYsIBEG7BARFkbISEgRbDAUFiwwEQbIVlZLbgAECwgIEVpRLABYCAgRX1pGESwAWAtuAARLLgAECotuAASLEsgsAMmU1iwQBuwAFmKiiCwAyZTWCMhsICKihuKI1kgsAMmU1gjIbgAwIqKG4ojWSCwAyZTWCMhuAEAioobiiNZILADJlNYIyG4AUCKihuKI1kguAADJlNYsAMlRbgBgFBYIyG4AYAjIRuwAyVFIyEjIVkbIVlELbgAEyxLU1hFRBshIVktAAC4Af+FsASNAAAqACoAAAAb/OMA3wXPAAAIGQAAAAAAEADGAAMAAQQJAAAAeAAAAAMAAQQJAAEAIgB4AAMAAQQJAAIADgCaAAMAAQQJAAMAPACoAAMAAQQJAAQAIgB4AAMAAQQJAAUAJADkAAMAAQQJAAYAHAEIAAMAAQQJAAcAagEkAAMAAQQJAAgAIAGOAAMAAQQJAAkAIAGOAAMAAQQJAAoAeAAAAAMAAQQJAAsANAGuAAMAAQQJAAwANAGuAAMAAQQJAA0BmgHiAAMAAQQJAA4ANAN8AAMAAQQJABIAIgB4AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMAA2ACAAYgB5ACAASwBpAG0AYgBlAHIAbAB5ACAARwBlAHMAdwBlAGkAbgAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAEwAbwB2AGUAZAAgAGIAeQAgAHQAaABlACAASwBpAG4AZwBSAGUAZwB1AGwAYQByAEwAbwB2AGUAZAAgAGIAeQAgAHQAaABlACAASwBpAG4AZwA6AFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAIAAyADAAMAA2AEwAbwB2AGUAZABiAHkAdABoAGUASwBpAG4AZwBMAG8AdgBlAGQAIABiAHkAIAB0AGgAZQAgAEsAaQBuAGcAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABLAGkAbQBiAGUAcgBsAHkAIABHAGUAcwB3AGUAaQBuAC4ASwBpAG0AYgBlAHIAbAB5ACAARwBlAHMAdwBlAGkAbgBoAHQAdABwADoALwAvAGsAaQBtAGIAZQByAGwAeQBnAGUAcwB3AGUAaQBuAC4AYwBvAG0AQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAALAAgAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AIAAoAGsAaQBtAGIAZQByAGwAeQBnAGUAcwB3AGUAaQBuAC4AYwBvAG0AKQANAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIAAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIAAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/yEAmgAAAAAAAAAAAAAAAAAAAAAAAAAAAWMAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAgEDAQQBBQEGAQcA/QD+AQgBCQEKAQsA/wEAAQwBDQEOAQEBDwEQAREBEgETARQBFQEWARcBGAEZARoA+AD5ARsBHAEdAR4BHwEgASEBIgEjASQBJQEmAScBKAEpAPoA1wEqASsBLAEtAS4BLwEwATEBMgEzATQBNQDiAOMBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgCwALEBQwFEAUUBRgFHAUgBSQFKAUsBTAD7APwA5ADlAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAC7AWEBYgFjAWQA5gDnAKYBZQFmAWcBaAFpAWoA2ADhANsA3ADdAOAA2QDfAWsBbAFtAW4BbwFwAXEBcgCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwC+AL8AvAFzAIwA7wF0AMAAwQdBbWFjcm9uB2FtYWNyb24GQWJyZXZlBmFicmV2ZQdBb2dvbmVrB2FvZ29uZWsLQ2NpcmN1bWZsZXgLY2NpcmN1bWZsZXgKQ2RvdGFjY2VudApjZG90YWNjZW50BkRjYXJvbgZkY2Fyb24GRGNyb2F0B0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQMR2NvbW1hYWNjZW50DGdjb21tYWFjY2VudAtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARoYmFyBkl0aWxkZQZpdGlsZGUHSW1hY3JvbgdpbWFjcm9uBklicmV2ZQZpYnJldmUHSW9nb25lawdpb2dvbmVrC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DEtjb21tYWFjY2VudAxrY29tbWFhY2NlbnQGTGFjdXRlBmxhY3V0ZQxMY29tbWFhY2NlbnQMbGNvbW1hYWNjZW50BkxjYXJvbgZsY2Fyb24ETGRvdARsZG90Bk5hY3V0ZQZuYWN1dGUMTmNvbW1hYWNjZW50DG5jb21tYWFjY2VudAZOY2Fyb24GbmNhcm9uC25hcG9zdHJvcGhlB09tYWNyb24Hb21hY3JvbgZPYnJldmUGb2JyZXZlDU9odW5nYXJ1bWxhdXQNb2h1bmdhcnVtbGF1dAZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4DFRjb21tYWFjY2VudAx0Y29tbWFhY2NlbnQGVGNhcm9uBnRjYXJvbgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHQUVhY3V0ZQdhZWFjdXRlC09zbGFzaGFjdXRlC29zbGFzaGFjdXRlDFNjb21tYWFjY2VudAxzY29tbWFhY2NlbnQGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMGWWdyYXZlBnlncmF2ZQRFdXJvC2NvbW1hYWNjZW50AAABAAH//wAP","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
