(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.homenaje_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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sD4sIyAuRrACJUawEENYUBtSWVggPFkusS4BFCstsD8sIyAuRrACJUawEENYUhtQWVggPFkusS4BFCstsEAsIyAuRrACJUawEENYUBtSWVggPFkjIC5GsAIlRrAQQ1hSG1BZWCA8WS6xLgEUKy2wQSywOCsjIC5GsAIlRrAQQ1hQG1JZWCA8WS6xLgEUKy2wQiywOSuKICA8sAQjQoo4IyAuRrACJUawEENYUBtSWVggPFkusS4BFCuwBEMusC4rLbBDLLAAFrAEJbAEJiAuRyNHI2GwCUMrIyA8IC4jOLEuARQrLbBELLEIBCVCsAAWsAQlsAQlIC5HI0cjYSCwBCNCsAlDKyCwYFBYILBAUVizAiADIBuzAiYDGllCQiMgR7AEQ7ACYiCwAFBYsEBgWWawAWNgILABKyCKimEgsAJDYGQjsANDYWRQWLACQ2EbsANDYFmwAyWwAmIgsABQWLBAYFlmsAFjYbACJUZhOCMgPCM4GyEgIEYjR7ABKyNhOCFZsS4BFCstsEUssQA4Ky6xLgEUKy2wRiyxADkrISMgIDywBCNCIzixLgEUK7AEQy6wListsEcssAAVIEewACNCsgABARUUEy6wNCotsEgssAAVIEewACNCsgABARUUEy6wNCotsEkssQABFBOwNSotsEossDcqLbBLLLAAFkUjIC4gRoojYTixLgEUKy2wTCywCCNCsEsrLbBNLLIAAEQrLbBOLLIAAUQrLbBPLLIBAEQrLbBQLLIBAUQrLbBRLLIAAEUrLbBSLLIAAUUrLbBTLLIBAEUrLbBULLIBAUUrLbBVLLMAAABBKy2wViyzAAEAQSstsFcsswEAAEErLbBYLLMBAQBBKy2wWSyzAAABQSstsFosswABAUErLbBbLLMBAAFBKy2wXCyzAQEBQSstsF0ssgAAQystsF4ssgABQystsF8ssgEAQystsGAssgEBQystsGEssgAARistsGIssgABRistsGMssgEARistsGQssgEBRistsGUsswAAAEIrLbBmLLMAAQBCKy2wZyyzAQAAQistsGgsswEBAEIrLbBpLLMAAAFCKy2waiyzAAEBQistsGssswEAAUIrLbBsLLMBAQFCKy2wbSyxADorLrEuARQrLbBuLLEAOiuwPistsG8ssQA6K7A/Ky2wcCywABaxADorsEArLbBxLLEBOiuwPistsHIssQE6K7A/Ky2wcyywABaxATorsEArLbB0LLEAOysusS4BFCstsHUssQA7K7A+Ky2wdiyxADsrsD8rLbB3LLEAOyuwQCstsHgssQE7K7A+Ky2weSyxATsrsD8rLbB6LLEBOyuwQCstsHsssQA8Ky6xLgEUKy2wfCyxADwrsD4rLbB9LLEAPCuwPystsH4ssQA8K7BAKy2wfyyxATwrsD4rLbCALLEBPCuwPystsIEssQE8K7BAKy2wgiyxAD0rLrEuARQrLbCDLLEAPSuwPistsIQssQA9K7A/Ky2whSyxAD0rsEArLbCGLLEBPSuwPistsIcssQE9K7A/Ky2wiCyxAT0rsEArLbCJLLMJBAIDRVghGyMhWUIrsAhlsAMkUHixBQEVRVgwWS0AAABLuADIUlixAQGOWbABuQgACABjcLEAB0KzMBwCACqxAAdCtSMIDwgCCCqxAAdCtS0GGQYCCCqxAAlCuwkABAAAAgAJKrEAC0K7AEAAQAACAAkqsQMARLEkAYhRWLBAiFixA2REsSYBiFFYugiAAAEEQIhjVFixAwBEWVlZWbUlCBEIAgwquAH/hbAEjbECAESzBWQGAEREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATgBOAD4APgK8AAACvAIIAAD/YARc/10Cw//5ArwCD//5/2AEXP9dAE4ATgA+AD4CvAGFArwCCAAA/2AEXP9dAsP/+QK8Ag//+f9gBFz/XQAAAAAADgCuAAMAAQQJAAAA9AAAAAMAAQQJAAEAEAD0AAMAAQQJAAIADgEEAAMAAQQJAAMANgESAAMAAQQJAAQAIAFIAAMAAQQJAAUAGgFoAAMAAQQJAAYAIAGCAAMAAQQJAAcAjgGiAAMAAQQJAAgAVgIwAAMAAQQJAAkAVgIwAAMAAQQJAAsAMgKGAAMAAQQJAAwAMgKGAAMAAQQJAA0BIAK4AAMAAQQJAA4ANAPYAEMAbwBwAHkAcgBpAGcAaAB0ACAAMgAwADEANgAgAFQAaABlACAASABvAG0AZQBuAGEAagBlACAAUAByAG8AagBlAGMAdAAgAEEAdQB0AGgAbwByAHMAIAAoAGgAdAB0AHAAcwA6AC8ALwBnAGkAdABoAHUAYgAuAGMAbwBtAC8AZwBvAG8AZwBsAGUAZgBvAG4AdABzAC8ASABvAG0AZQBuAGEAagBlACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACcASABvAG0AZQBuAGEAagBlIBkALgBIAG8AbQBlAG4AYQBqAGUAUgBlAGcAdQBsAGEAcgAxAC4AMQAwADAAOwBVAEsAVwBOADsASABvAG0AZQBuAGEAagBlAC0AUgBlAGcAdQBsAGEAcgBIAG8AbQBlAG4AYQBqAGUAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAwADAASABvAG0AZQBuAGEAagBlAC0AUgBlAGcAdQBsAGEAcgBIAG8AbQBlAG4AYQBqAGUAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABDAG8AbgBzAHQAYQBuAHoAYQAgAEEAcgB0AGkAZwBhAHMAIABQAHIAZQBsAGwAZQByACwAIABBAGcAdQBzAHQAaQBuAGEAIABNAGkAbgBnAG8AdABlAC4AQwBvAG4AcwB0AGEAbgB6AGEAIABBAHIAdABpAGcAYQBzACAAUAByAGUAbABsAGUAcgAsACAAQQBnAHUAcwB0AGkAbgBhACAATQBpAG4AZwBvAHQAZQBhAGcAdQBzAHQAaQBuAGEAbQBpAG4AZwBvAHQAZQBAAGcAbQBhAGkAbAAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAQIAAgADACQAyQDHAGIArQBjAK4AkAAlACYAZAAnAOkAKABlAMgAygDLACkAKgArACwBAwDMAM0AzgDPAQQALQEFAC4ALwEGAOIAMAAxAQcAZgAyANAA0QBnANMAkQCvALAAMwDtADQANQEIAQkBCgA2ADcAOADUANUAaADWADkAOgA7ADwA6wC7AD0ARABpAGsAbABqAG4AbQCgAEUARgBvAEcA6gBIAHAAcgBzAHEASQBKAEsBCwBMANcAdAB2AHcAdQEMAQ0ATQEOAE4BDwEQAREATwESAOMAUABRARMAeABSAHkAewB8AHoAoQB9ALEAUwDuAFQAVQEUARUAVgCJAFcAWAB+AIAAgQB/AFkAWgBbAFwA7AC6AF0A5wCdAJ4AEwAUABUAFgAXABgAGQAaABsAHAEWARcBGAD0APUA9gANAD8AwwCHAB0ADwCrAAQAowAGABEAIgCiAAUACgAeABIAQgBeAGAAPgBAAAsADACzALIAEAEZAKkAqgC+AL8AxQC0ALUAtgC3AMQBGgEbAIQAvQAHAIUAlgAOAPAAuAAgACEAHwCTAGEApAEcAAgAIwAJAIgAhgCLAIoAgwBfAOgAggBBAR0AjQDhAN4A2ACOAEMA2gDdANkBHgROVUxMAklKBkl0aWxkZQtKY2lyY3VtZmxleApMZG90YWNjZW50Bk5hY3V0ZQZSYWN1dGUGUmNhcm9uDFJjb21tYWFjY2VudARoYmFyAmlqBml0aWxkZQtqY2lyY3VtZmxleAhrY2VkaWxsYQxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljBGxkb3QGbmFjdXRlBnJjYXJvbgxyY29tbWFhY2NlbnQHdW5pMDBCOQd1bmkwMEIyB3VuaTAwQjMHdW5pMDBBRAd1bmkwMEEwBEV1cm8HdW5pMDBCNQd1bmkwMzA3B3VuaUUwMDIAAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAMABACRAAEAyQDkAAEA5QDlAAMAAAABAAAACgAwAEQAAkRGTFQADmxhdG4AGgAEAAAAAP//AAEAAAAEAAAAAP//AAEAAQACa2VybgAOa2VybgAOAAAAAQAAAAEABAACAAgAAgAKACIAAQAMAAQAAAABABIAAQABACMAAQA6/9MAAgBIAAQAAABoAIQABAAHAAD/yf/TAAAAAAAAAAAAAAAAAAD/yf+//7//3QAA/78AAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAAAAQAOAAQABQAGAAcACAAJAAoAIwA6AEAAQQBDAEQARQACAAQAIwAjAAIAOgA6AAMAQABBAAEAQwBFAAEAAgAIAAQACgADADoAOgACAEAAQQABAEMARQABAEcATgAEAFQAWAAFAHIAeQAFAIMAgwAGAAAAAQAAAAoAUgDAAAJERkxUAA5sYXRuACAABAAAAAD//wAEAAAAAwAHAAoACgABQ0FUIAAYAAD//wAEAAEABAAIAAsAAP//AAUAAgAFAAYACQAMAA1hYWx0AFBhYWx0AFBhYWx0AFBmcmFjAFZmcmFjAFZmcmFjAFZsb2NsAFxvcmRuAGJvcmRuAGJvcmRuAGJzdXBzAGhzdXBzAGhzdXBzAGgAAAABAAAAAAABAAMAAAABAAEAAAABAAQAAAABAAIABwAQAD4AYAB4ALQA/AEcAAEAAAABAAgAAgAUAAcAkACRAJAAkQCcAJ0AngABAAcABAAqAEcAcgCTAJQAlQAGAAAAAQAIAAMAAAACAMYAFAABAMYAAQAAAAUAAQABAKQAAQAAAAEACAABAAYACQABAAMAkwCUAJUABAAAAAEACAABACwAAgAKACAAAgAGAA4AnwADALIAlACgAAMAsgCWAAEABAChAAMAsgCWAAEAAgCTAJUABgAAAAIACgAkAAMAAQAsAAEAEgAAAAEAAAAGAAEAAgAEAEcAAwABABIAAQAcAAAAAQAAAAYAAgABAJIAmwAAAAEAAgAqAHIABAAAAAEACAABAAgAAQAOAAEAAQBrAAEABABsAAIApAABAAAAAQAIAAIADgAEAJAAkQCQAJEAAQAEAAQAKgBHAHIAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
