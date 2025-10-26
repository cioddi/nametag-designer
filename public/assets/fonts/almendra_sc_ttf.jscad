(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.almendra_sc_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEECQAHAFQBkAADAAEECQAIABwB5AADAAEECQAJABwB5AADAAEECQAMADACAAADAAEECQANASACMAADAAEECQAOADQDUABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEEAbgBhACAAUwBhAG4AZgBlAGwAaQBwAHAAbwAgACgAYQBuAGEAcwBhAG4AZgBlAEAAZwBtAGEAaQBsAC4AYwBvAG0AKQAuACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAcwAgACIAQQBsAG0AZQBuAGQAcgBhACIAIAAiAEEAbABtAGUAbgBkAHIAYQAgAFMAQwAiAEEAbABtAGUAbgBkAHIAYQAgAFMAQwBSAGUAZwB1AGwAYQByADEALgAwADAAMgA7AFUASwBXAE4AOwBBAGwAbQBlAG4AZAByAGEAUwBDAC0AUgBlAGcAdQBsAGEAcgBBAGwAbQBlAG4AZAByAGEAIABTAEMAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAQQBsAG0AZQBuAGQAcgBhAFMAQwAtAFIAZQBnAHUAbABhAHIAQQBsAG0AZQBuAGQAcgBhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAQQBuAGEAIABTAGEAbgBmAGUAbABpAHAAcABvAC4AQQBuAGEAIABTAGEAbgBmAGUAbABpAHAAcABvAHcAdwB3AC4AYQBuAGEAcwBhAG4AZgBlAGwAaQBwAHAAbwAuAGMAbwBtAC4AYQByAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA7AAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMBBADXAQUBBgEHAQgBCQEKAQsBDADiAOMBDQEOALAAsQEPARABEQESARMA5AC7AOYBFADYAOEA3QDZARUAsgCzALYAtwDEALQAtQDFAIcAvgC/ARYEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbghkb3RsZXNzagxkb3RhY2NlbnRjbWIERXVybwAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAOsAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
