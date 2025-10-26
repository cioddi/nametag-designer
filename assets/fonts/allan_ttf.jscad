(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.allan_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAQAQAABAAAR0RFRgD6AdEAAJMEAAAAHEdQT1PTwPs5AACTIAAAG5pHU1VCC44CyQAArrwAAABUT1MvMn/LC1wAAIrkAAAAYGNtYXDWl/blAACLRAAAAPRjdnQgEWQVYQAAjgwAAABMZnBnbTJKZpgAAIw4AAAAx2dseWbKiv1IAAABDAAAg9poZWFkBaQjkwAAhuAAAAA2aGhlYQz4BPoAAIrAAAAAJGhtdHjsIBNLAACHGAAAA6hsb2NhiXRoLwAAhQgAAAHWbWF4cAIBAbEAAIToAAAAIG5hbWU03l0iAACOWAAAAlxwb3N0m+rrpgAAkLQAAAJPcHJlcJsXgXEAAI0AAAABCgACAGcAAAWdBcsADAAQAIEAsgQBACu0DggAJQQrsA8ysgoEACu0DQgAJQQrsBAyAbARL7ESASuwNhqxDg2HsA4uDrAIELAOELEHJPkFsAgQsQ0k+bEPEIewDy4OsAAQsA8QsQEY+QWwABCxEBj5AwCzAAEHCC4uLi4BtwABBwgNDg8QLi4uLi4uLi6wQBoAMDEBAQYGIyEiNwE2MyEyBQEhAQWO/pAIISH80T4VAWoPNQM9Nvy2/qoCsgFWBZj6nyAXRgVQNWX7AAUAAAAC/8P/2QI1Bd0ACwAXADIAsAwvtBIKABIEKwGwGC+wFta0EBQAEgQrsRkBK7EQFhESsAs5ALEMEhESsRAWOTkwMRMTNjMzMgcBBiMjIgczMhYUBiMjIiY0Nk72CDV5Ow7+jw4pDC8RFyc/QTQUKTs/AW0EQy0v+7wtfEZgQkRgRAD//wDWBDEDFQaBECcACgEzAAAQBgAKAAAAAgA9AAAGRQYSAD0AQQEEALIrAQArsDMzsg0FACuwFTOzASsNCCuyIT4/MzMzsSgG6bIvMDcyMjKzAisNCCuyIEBBMzMzsQoG6bIREhkyMjIBsEIvsUMBK7A2GrE2C4cOsDYQsAvAsTEW+bAQwLEuE4ewLhCwE8CxKRb5sBjAsTYLBwWxATYQwLACwLAKwLERMRDAsRIuEMCxGSkQwLAgwLAhwLAowLEvLhDAsTAxEMCxNzYQwLE+MRDAsT8uEMCwQMCxQTEQwAMAtwsQExgpLjE2Li4uLi4uLi4BQBgBAgoLEBESExgZICEoKS4vMDE2Nz4/QEEuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi6wQBoAMDETIRMhIjc3NjYzIRM2MzMyBwMhEzYzMzIHAyEyBwYGIyEDITIHBgYjIQMGIyMiNxMhAwYjIyI3EyEiNzc2NiEhEyF4ATlc/ug8FQYGDQ4BPWkMMS86DWgBj2kMMS86DWgBEj4PCCsW/uVaARI+DwgrFv7jag0xI0sQaP51ag0xI0sQaP7sOxQGBg0B5QGLXP5zAmABY0kbGw4BlS0v/m0BlS0v/m1CLR7+nUEtH/5aLUIBkf5aLUIBkUoaGw4BYwAAAQAD/64C5AYbADgAqAABsDkvsBbWsCXWsBwysTgBK7EzDumxOgErsDYasRMqhw6wExCwKsCxDgn5sC/AsQ4vB7ANwLINLw4REjmxFBMQwLIUKhMREjmwKcCwKTmxMA4QwLIwLw4REjkAtw0OExQpKi8wLi4uLi4uLi4Btw0OExQpKi8wLi4uLi4uLi6wQBoBsSUWERKwEjmwOBG3BwkbISIjJCckFzmwMxKzAgEuCiQXOQAwMQE3NCYHDgIWFxYCAgcHBiMjIjc3JhM2Nzc2FgYWMz4CNzYnJjc2Ejc3NjMzMgcHFhYHBgcHBiYCQwovIU5iG0ZeniO0jhoMMCJCDhl5DAMoKR8tEBY+PW0nAgKkiwIGrIEfDC8tNwwdVC0MBCk7GRYD149rNwIO1bQ4EiP+i/7TI2QrQFg7ATc0IBkOFI7jAqC4MWMeG4O0AUAtdystbRm6sC0QFQQQAP///6H/yQZuBh8QJgDfRgAQJgB7AAAQBwB7Awb8oAAC//r/gQS9BW0ABwA6AFQAsDQvsQgI6bEZLTIysB4vsSMI6QGwOy+wG9axLQErsQgN6bE8ASuxLRsREkAMAAoRGQYfIyQnKy8wJBc5sAgRsAw5ALE0CBESsDA5sCMRsBs5MDEBDgIWNjcmAQIHFhcWBicmJwYnJiY3NjY3JjQ2NhcWBwcGIyYHBgYWFxYXNjcjIjQ3NzYzITIHBwYjAY5YfQ9j2XmSAh9Ye2JlL4k6TFSu35OSFRa9ey1izZUjBgoNK1ZaLzcYZytgcylSIwoOBRoBeSMRCA4dAlotmqp0BmbiAQ7+zbeJeTspJVJ1oB8WvJKVrkB5y9CGDwQlMR0JRCOR389YkLe4HRwtGS0ZOQAAAQDWBDEB4gaBAA0AKgCwCy+0BAoABwQrAbAOL7AJ1rEAEOmxDwErALELBBESswEABwkkFzkwMQEUBwIjIj4CNTQzMzYB4jFwVBcCTB8zOzEGTH2B/uNCspmSKQgAAAEAyf6WA98GpgAWABMAAbAXL7AA1rEMDemxGAErADAxExAAJTYXFxYWBwQAERQSFxYGBwcGJwLJAVwBBisnPRsKEP7y/plUTAoGEFskFZEBcQFqAqr4KQQGAisN7f1Y/ri+/o9kDR4EGRQoAQsAAf9b/pwCdAaqABUAEwABsBYvsA/WsQIN6bEXASsAMDEBEhAABQYGJycmNzY3JAAQJyY2Nzc2AeCU/qX+/BwdG0MjBgQLARABYqAMChFWJQaB/vL87/1Y9xsMAgYEHwwI7gKmAuv0EBsEGRQAAQBmAwIDBAXHACUAJgABsCYvsCTWtBQVAAcEK7EnASuxFCQRErYJDwARGBofJBc5ADAxAScmJjc3NjYXFzc2MzMyFgcHNzYVFRQHBxcWBwcGJycHBicnJjcBWMcXFAgKBCcTyxwIRBsaIwpO1UY07YEbLh4zF1KmLSUSIykEVCECKxodFRoIUuU0IyHZSBY9Hy8KJdUvGxAdNdPGNCsVKScAAQAyAR0DLQPpAB0AYwCwEC+wFzOxAQbpsAgyAbAeL7EfASuwNhqxBxGHDrAHELARwLECD/mwFsCxAhYHBbABwLEIBxDAsBDAsRcCEMADALMCBxEWLi4uLgG3AQIHCBARFhcuLi4uLi4uLrBAGgAwMQEhAwYjIyI3EyMiNzc2NjMzNzYzMzIHBzMyFgcHBgLq/vxGDDEzOgxE4zEMDgQXFPA7DTEzOQw5/BIUBAoKAlL++C0vAQYvOxUO3S0v2xgXMysAAAH/zP6wAOABBgANAB0AsAQvtAwKAAcEKwGwDi+wCdaxABPpsQ8BKwAwMTcUBwYjIiY2Njc0Nzc24JMzNBgCPx8IK1Ix1dP6WDWYvIUjCxIIAAABAFYCUgK3At8ADAAdALAAL7EHBukBsA0vsArWtAMVAAcEK7EOASsAMDETITIWBwcGIyEiNzc2kAIAEhUECwgt/hUyDRIGAt8aFTMrL0gWAAEAM//ZASEAwQALACoAsAAvtAYKABIEKwGwDC+wCta0BBQAEgQrsQ0BKwCxAAYRErEECjk5MDE3MzIWFAYjIyImNDakFidAQjMUKTxAwUZgQkRgRAAAAQAeAAAD6QYUAAwAQwCyBgEAK7IABQArAbANL7EOASuwNhqxCguHDrAKELALwLEECfmwA8AAswMECgsuLi4uAbMDBAoLLi4uLrBAGgEAMDEBMzIHAQYjIyImNwE2A2pFOiH9ABsiRhkODgMAFwYUP/pYLSkWBagtAAACAB//9gNzBYsACgAUACcAsggBACuxDgnpsAMvsRMJ6QGwFS+wCtaxFgErALETDhESsAU5MDETEgAgFhACACAmEDcGEjI2ExICIgZWTgEjASKKkv72/uyk2UAZ0aZFSBfQrAMSATYBQ7z+jf3s/q64AXPI6/6T5gEKASUBTOoAAAEAOgAAAoQFcwAVAD4AsgYBACsBsBYvsRcBK7A2GrEKC4cOsAoQsAvAsQQP+bADwACzAwQKCy4uLi4BswMECgsuLi4usEAaAQAwMQE2FgcBBiMjIiY3AQcGIyMiJjclNjMCXRcQBv62DCs8GBcGARmwLSc7JRMjARBzLwVxAiMX+vQtJRoEULQtQiDucwAB/6sAAANVBYkAIQBhALIHAQArsQAG6bIcAwArsRAI6QGwIi+wGdaxEg7psSMBK7A2GrEAIYewAC4OsCHAsQsI+bAMwACyCwwhLi4uAbMACwwhLi4uLrBAGgEAsRAAERK3AQINEhMXGRokFzkwMTclMhYHBwYjISImNwE2NiYiBhUUBgcHBiY1NDYzMhYWBgd5AfwfGQkKCjv9tkAgKQJNWkZIun8ZDkMVFtOydJQdVmWLCBQhLTFkLQKiZ9uVkW0OHQQOBBwZj/qBwvRvAAEABv/jAwkFgwAzAGUAshYDACuxCwjpsC8vsSEG6bAFL7EBBukBsDQvsCXWsSsN6bESASuwKjKxDQ7psTUBK7ErJRESsCI5sQ0SERK0AQACFCEkFzkAsQEvERKxKSs5ObAFEbAcObALErINDhE5OTkwMQEGJjc3NhcyNjYmIgYHFAcHBiY3NjYgFgcGBwYHFgcUAiMiJyY3NDc3NhYGHgIXMjY2JgEhHRoGCAZOcawSQYxuBjE8GhMCCL8BGoYFAiRMmJAC4rKPMS4FIEAYHQYCFystS4MhYgKJAhMcKzECmN2Bf3ApCw4GIRqW47SWVEuaOTjpqv7nb2B3Mw4dChRMWkEpA6bokQAAAf/PAAADIwVxACQAiwCyBAEAK7AVL7EWHjMzsQEG6bAJMgGwJS+xJgErsDYasRUUh7AVLg6wFMCxDQ/5sA7AsQgXhw6wCBCwF8CxAhH5sB3AsQIdBwWwAcCxCQgQwLAWwLEeAhDAAwC2AggNDhQXHS4uLi4uLi4BQAwBAggJDQ4UFRYXHR4uLi4uLi4uLi4uLi6wQBoAMDEBIwMGIyMiJjcTISImNwE2MzMyFgcBJRM2MzMyFgcDMzIWBwcGAs1QSAwxPBgXBkT+VEAcJwJRFSlMIgsV/bsBVkcNMTsZFgZDSyEXCRQKAUr+4y0lGgELaDMDcRsvHfywAgEdLSUb/vYUGUAgAAEAIv/fA7wFcQArAH0AsAIvsRgG6bAjL7ErBukBsCwvsAnWsRUBK7EEDemxLQErsDYasRorh7ArLg6wGsCxIRf5sCDAsRorB7EAGhDAsgArGhESOQCzABogIS4uLi4BtAAaICErLi4uLi6wQBoBsRUJERK1Ag8QERsfJBc5ALErAhESsSkqOTkwMQE2MyADBgAHBiY2NzYXFxYHBhYWNhImJyYGBwYnJyYmNxM2MyEyBwcGBiMlAVNWdQEUWjP+5YVwcwYzEyUrMRMpJWumYgIzVGU3FiVEFAsGtwwxAf48DwwGDxT+SANoOv5i5/7PAwqHw1YfDQ4QJWB9DdEBFcYJBE5WIQwfCBccAogrNDcaDwgAAAIAEf/lA8EFfwAKACMAQACyGwMAK7AEL7ETCOmwDC+xCQjpsBsuAbAkL7EHASuxDxDpsSUBKwCxCQQRErAAObAMEbELDjk5sBsSsCA5MDEBAhcWMzISNxIjIic2FxYDBgIGIyInJhI3EgA3FxYWDgIHBgEbfy0ZQ1SmECGiRxFOVO4ZCG3KdbI6HClJaQFqg8ESFRVmj06oAvz+jbpnATh/AQpcJwQM/qx5/u3Xx2ABQMsBHgFIAhcCGh0ONTBmAAEAV//8A54FcQASAD4AsA8vsQgJ6QGwEy+xFAErsDYasQcIh7AILg6wB8CxABD5sAHAALIAAQcuLi4BswABBwguLi4usEAaAQAwMQEBBicnJiY3AQUiNzc2NjMhMhYDgP2FFy01JRAQAnH96TsQDwYOFAKCJikE+PszLwYGAi8bBIkEOTYaDzwAAAMAH//lA1YFjwAWACAAKwB5ALAdL7ETCOmwBi+xJwjpAbAsL7AV1rEbD+mwA9axKhDpsB/WsRAL6bAl1rEJC+mxLQErsSobERKxEwA5ObAfEbIdFyE5OTmwJRKxBg05ObAQEbEHJjk5ALEnHRESQA8DBAkKDRARFQAbFx8hJiokFzmwBhGwKDkwMQEmJjU0EjMyFhUUBwYHFhYVFAIjIBE0JQYHBhQWMjY1NCc2NzY3NicmBhQWAT9BTOGvf5UvUo1BSOqy/uoBk4dMJ0amh0xQQD8EDI1YhzsC0S+RVJwBDqOGWlaRUDmkVqL+5QEp6plLlEqRbblkwdcpVFZQvgwGl7ppAAACAAb/3wNiBX8ADAAqAGAAshUDACuxBAjpsCcvsRwG6bAKL7EPCOkBsCsvsB7WsSQQ6bARMrAkLrEIEOmxAgErsSwBK7EIJBESsRAcOTkAsQ8nERK0Hh8iJCUkFzmwChGwDTmwBBKyAAgSOTk5MDEBEicmIyIGBhUUMzI2BwYjIiYQEjYzMhcWAgcCISIRNDc3NhYUBhYXMjc2Alx3IRRMQoFQfx1pHUpMeHdw1X+gPh4pTdz+vccpQBgdBhwtZ2w6AokBdaBinvN5siR2K50BDQE3165a/rTd/ZEBMzwMEwgRL3JbAqxYAAACADP/2QHuBDEACwAXAEgAsAwvtBIKABIEK7AAL7QGCgASBCsBsBgvsBbWtBAUABIEK7AK1rQEFAASBCuxGQErALEMEhESsRAWOTmxAAYRErEECjk5MDEBMzIWFAYjIyImNDYDMzIWFAYjIyImNDYBcRYnQEIzFSk7P5sWJ0BCMxQpPEAEMUVhQUNhQ/yQRmBCRGBEAAAC/+X+sAHbBDEACwAZADEAsAAvtAYKABIEKwGwGi+wFdaxDBPpsArWtAQUABIEK7EbASsAsQAGERKxBAo5OTAxATMyFhQGIyMiJjQ2AxQHBiMiNDY2NzQ3NzYBXhcnP0E0FCk7PzWUMzMZQCEEK1IxBDFFYUFDYUP8pNP6WDWz0lQjCxIIAAEABgECA6QD3wAUAFwAAbAVL7EWASuwNhqxCAeHDrAIELAHwLEADPmwAcCxDQ6HDrANELAOwLEAAQixABj5DrAUwAC2AAEHCA0OFC4uLi4uLi4BtgABBwgNDhQuLi4uLi4usEAaAQAwMRMFFgcHBgYnASY3NzY3ATYWBwcGB88CGDEKCAYdHf1xMQoGCDYDECcZCQgOJwJzzxM5KSEMDAEVFDMdLRMBDAwjICEzCwAAAgA1AbQDhQOLAA0AGwAaALAVL7EOBumwBy+xAAbpAbAcL7EdASsAMDEBISI3NzY2MyEyFgcHBgMhIjc3NjYzITIWBwcGA0H9eS8KEwQQHwKDEhUECguB/XkvChMEEB8CgxIVBAoLAv4vSBAGGBczK/62L0gQBxkXMysAAAEAEAEEA60D4QAUADkAAbAVL7EWASuwNhqxAQCHDrABELAAwLEHDvmwCMAAswABBwguLi4uAbMAAQcILi4uLrBAGgEAMDEBJSY3NzY2FwEWBwcGBwEGJjc3NjcC5f3nMQoIBh0dAo8xCgYINvzwJxgICA4nAnPPEjknIQwM/uwVMx0tEv7zDCMhIjIMAAACAAj/2QLLBewACwAvAD4AsAAvtAYKABIEKwGwMC+wCta0DBQAEgQrsAMysAwusREN+bExASuxDAoRErEQIDk5ALEABhESsQQKOTkwMTczMhYUBiMjIiY0NjcUJycmNz4EEiYmJwYHBicnJjc+AhYWBwYCBwYGBwYGeRYnQEIzFCk8QKo+Ky8KJX+LPDUpDDEVIXAbJyMkGCuYXpw1BBWJcR5jEBAlwUZgQkRgRLIvBgQESOtrEjlvAQZxJwIIcRkVFhsnPXcTTIF71/7JHwgVBCuiAAIAQf6oBpsFhQA0AEAAlACyIwMAK7QOCAAzBCuwHC+0FwgAJQQrsArWsSgJ6bA91rEsCekBsEEvsUIBK7A2GrE1AYcOsDUQsAHAsQcO+bAGwLE1AQexADUQwLIAATUREjkAtAABBgc1Li4uLi4BtAABBgc1Li4uLi6wQBoBALEXHBESsBU5sQosERKwKTmxDj0REkAJNAIDBAUIDzM4JBc5MDEBNzYzNzIHAwYWMjYSACUGAAIXFhcWJTYWBwcGBwYkAgISACQEEgIAICcGBiImJyYSEjc2MhcmJyYDBhcWMzI3NgRJBAspM0cQphAthbp7/uH+1f3+j4snJpSoAQgXEgwREC+m/t/pRrIBqgItAVp3cv7l/uk9I2hxahtCQJdOQo1CISuJbU4EBl89KUwDxQ41AkH9kVRk3QHwAZ8CBv6k/kDT1ZSeCwIbFB8fAgp3ATMB4QHhAWkI8v57/in+13EtPkA7kgFUARw8M7YWCiz++bx1sEJ4AAL/ef/6A0UFyQACABcArwCyEwEAK7AGM7IOBAArswATDggrsAEzsQMJ6bAXMgGwGC+xGQErsDYasQoLhw6wChCwC8CxBBD5sALAsRYChw6wFhCxBAIIsALADrERGfmwEMCxBAIHBbEABBDAsRYCB7EBFhDAsQQCB7EDBBDAsRYCB7EXFhDAAwC2AgQKCxARFi4uLi4uLi4BQAsAAQIDBAoLEBEWFy4uLi4uLi4uLi4usEAaALEDExESsAg5MDEBIRMBAwYnJyYmNwE2MzcyBwMGByciNxMBOwEtMf5bxxc1LyMWDgKqK0ZSUQZHBDpFNAQbAlACx/yl/m0vBgQCMRsFI1ICY/rHKwICNwGDAAP/4wAAA40FywAWAB8AJwB3ALIKAQArsRkJ6bIABAArsQ8G6bAgMrMXCgAIK7EhCekBsCgvsSkBK7A2GrEOD4ewDy4OsA7ABbEgEfkOsBjAsRggBwWxFxgQwLAhwAMAsQ4YLi4BtQ4PFxggIS4uLi4uLrBAGgCxFxkRErAaObAhEbEGIzk5MDETITIWAgYHFgIEIyMiJjcBIyImNzc2NhMDNzY2EicmJhMDFxY2NiYj+gFUmqUCm06HSv7269cZFwcBRTMbKQcMBB9DjYFotzlBGWYYf6ZgbSNGWAXLov6yySBO/lb6JRoE/iEVLxAZ/On91wYFqQEbNRcOAon+CQQDnM+TAAAB//f/7AOCBdsAJgAyALIdAQArsREJ6bIiBAArtA0JADEEKwGwJy+xKAErALENEREStwMCCAkKExQVJBc5MDEBFhUUBwcGJicmJyYjJgICEhc2NzY2FxcWBwYGIwYmAhIANzIeAgOAAis5FykCEDUbIWTLlTNOmWUSHSNBJR9euIdIrCeLAUS2GVZHRgRkDgwdDBEEIRudQgoE/t396P6eEw7eKRAOGxBCrpEEhwGwAjUBgQIdNbIAAv/I//gDXwXbABAAGQBcALINAQArsRIG6bIHBAArsREG6bAAMgGwGi+wGNaxGwErsDYasRAAh7AALrASLrAAELEREPkOsBIQsRAQ+QCwEC4BswAQERIuLi4usEAaAQCxERIRErEBAjk5MDEBByI3NzY3NgQWEgIAByImNwEBFjMyGgImARxrJwcIBh1RAWnZEJv+5+FvkxYB5v7IE0yB2XQHdQVGDS86HwgSBt3+VP3+/rACFlgE5Ps/AgEpAawBKcMAAAH/5QAAA8kFywAlAGoAsgABACuxHwbpsg0EACuxBQbpsBUysx4ADQgrsRYG6QGwJi+xJwErsDYasQQFh7AFLrAfLrAFELEVEfkOsB8QsQQR+bEfFQcFsRYfEMCwHsADALAELgG1BAUVFh4fLi4uLi4usEAaADAxISEiJjcBIyImNzc2NjMhMhYHBwYjIQMhMhYHBwYjIQMhMhYHBwYCAP4VGRcHAUVSHg8IDQgSHQKcHBMIDwop/lh3AWsSDwQPCjP+opgBiRMOBA4LJRoE/hMjLxoPFR40J/4tHBMzK/2wHBMzKwAAAf/lAAADywXLACAAYwCyDQEAK7IaBAArsQEG6bASMrMCDRoIK7EKBukBsCEvsSIBK7A2GrEREoewEi4OsBHABbEBGvkOsAvAsQsBBwWxAgsQwLAKwAMAsQsRLi4BtQECCgsREi4uLi4uLrBAGgAwMQEhAyEyFgcHBiMhAwYjIyImNwEjIiY3NzY2MyEyFgcHBgOB/laRAXQTDgQOCjT+lpQMMTsZFwcBRVAeDwkMCBIdApwcEwgPCgU9/cEdEjMr/bwtJRoE/hMjLxoPFR40JwAAAQAH/+kDiAXpACIAIwCwAC+xHQbpAbAjL7ETASuxDhHpsSQBK7EOExESsAI5ADAxASEyBwICBCYCEgAkFhYUBwcGLgInJgoCFjY2NyMiNzc2Aa8BdSAOdeX+6a4QkQEXAQCNTClIFBsGOS9h43sKP5CVSMUnDxAIArgt/oz+6ReqAc0CEQFJL2LjcxAVBBd/hQwZ/tf+P/7NqAq16zk6GAAAAf/jAAAEfQXLAB8AmgCyEgEAK7AbM7ICBAArsAszsxcSAggrsBgzsQcG6bAIMgGwIC+xIQErsDYasR8Ahw6wHxCwAMCxGRr5sAbAsRYJh7AWELAJwLEQEfmwD8CxGQYHBbEHGRDAsQgWEMCwF8CxGBkQwAMAtwAGCQ8QFhkfLi4uLi4uLi4BQAwABgcICQ8QFhcYGR8uLi4uLi4uLi4uLi6wQBoAMDEBNjMzMhYHAyETNjMzMhYHAQYjIyImNxMhAwYjIyImNwFIDDE8GBcGjgHokQwyOxkWBv6iDTE7GRYGqv4YrgwxOxkXBwWeLSUb/dkCOi0lG/qiLSUaApj9Vi0lGgAB/98AAAHsBcsADQBLALIJAQArsgIEACsBsA4vsA3WtAYVAAgEK7EPASuwNhqxDQCHBLANLg6wAMCxBxH5BLAGwAKzAAYHDS4uLi4BsQAHLi6wQBoBADAxATYzMzIWBwEGIyMiJjcBRAwxPBgXB/6iDDE8GBcGBZ4tJRv6oi0lGgAAAf7+/ucB8QXLABEAPgCyAAQAKwGwEi+xEwErsDYasQ8Qhw6wDxCwEMCxBRH5sATAALMEBQ8QLi4uLgGzBAUPEC4uLi6wQBoBADAxATMyFgcBBgYHBicnJjc2NwE2AYU9GRYG/qoptF4lDBkSJ6EtAVcMBcslGfq/nqAaDRkvJRJKsgU8LQAB/98AAAQEBcsAHgDIALIUAQArsBozsgIEACuwCjMBsB8vsSABK7A2GrEeAIcOsB4QsADAsRgR+bAGwLEXFIcFsBQuDrAXwLEQEfmwD8CxBwiHDrAHELAIwLEPEAixDw35DrAOwLEYBgexBwgIsQcYEMCxFxQHDrEVFxDAshUUFxESObAWwLAWObEYBgexFxQIsRcYEMAAQAwABgcIDg8QFRYXGB4uLi4uLi4uLi4uLi4BQA0ABgcIDg8QFBUWFxgeLi4uLi4uLi4uLi4uLrBAGgEAMDEBNjMzMhYHAwE2MzMyFgcBExYjIyImJwMDBiMjIiY3AUQMMTwYFweRAewaKVYbEBD90dESNUwdFAjBpgwxPBgXBgWeLSUb/ckCViElFf1p/UM9FB8Ch/1zLSUaAAAB/98AAAKSBcsAEgBFALIAAQArsQwG6bIHBAArAbATL7EUASuwNhqxDAuHsAwuDrALwLEEEfmwBcAAsgQFCy4uLgGzBAULDC4uLi6wQBoBADAxISEiJjcBNjMzMhYHASEyFgcHBgI+/dAYFwYBXwwxPBgXB/67Ac8SEQUOCiUaBV8tJRv7AhwTMysAAAH/3wAABM0FywAoANwAshIBACuwJDOyAgQAK7ALMwGwKS+wH9axCA3psAYysSoBK7A2GrEoAIcOsCgQsADAsSIR+bAhwLEICYcEsAguDrAJwLEaDPmwF8CxFgmHDrAWELEICQiwCcAOsRAR+bAPwLEWCQexGhcIsRcWEMCxGhcHDrEYGhDAshgXGhESObAZwLAZOQBADQAICQ8QFhcYGRohIiguLi4uLi4uLi4uLi4uAUAMAAkPEBYXGBkaISIoLi4uLi4uLi4uLi4usEAaAbEIHxESsCA5ALECEhEStRscHR4fICQXOTAxATY3MzIXEhIHATYzMzIWBwEGIyMiJjcTBgIHBicnJjc2AwMGIyMiJjcBRAwvQisGJQgKAgwWJ0AaFQb+og0xOxkWButW7SUzNCk5Bg8Z9gwxPBgXBgWeKwIv/n/+sJIDaycnGfqiLSUaA5qV/o07VAQCBE7fAXX8Py0lGgAB/98AAARcBcsAHQCPALIRAQArsBkzsgIEACuwCjMBsB4vsR8BK7A2GrEdAIcOsB0QsADAsRcR+bAWwLEWFYexFxYIsBYQDrAVwLEGCfmwB8CxBwiHsQYHCLAHEA6wCMCxDxr5sA7AAEAKAAYHCA4PFRYXHS4uLi4uLi4uLi4BQAoABgcIDg8VFhcdLi4uLi4uLi4uLrBAGgEAMDEBNjczMhYXEwE2MzMyFgcBBiMjIiYnAwEGIyMiJjcBRAwvPhYbBLYBDA0xOxkWBv6iDDJJDxQGtP7zDDE8GBcGBZ4rAh8h+/QEHy0lG/qiLRItBAn75S0lGgACAA7/9AOkBdsAEgAhADoAshABACuxFwbpsgUEACu0HgkAMQQrAbAiL7AA1rEVC+mxIwErALEXEBESsBI5sB4RsgEKADk5OTAxEzQSEjYzMhcWFhADBgcOAicmEwYCFjMyNzYTEgIjIgcGDm+e6X1WXEAxSEF/RLquUJLkOgJKO21SZFxUK2pxWGwBvLsBcgElzTknqP64/vD8umFsBCtLAqq+/smea4sBKwEfAXJykAAAAv/jAAADjQXLABcAIQCIALILAQArsgAEACuxEAbpsBgysAsusxoLAAgrAbAiL7Ae1rEEC+mxIwErsDYasQ8Qh7AQLg6wD8AFsRga+Q6wCcCxCRgHsQgJEMCyCBgJERI5sBnAsBk5ALMICQ8ZLi4uLgG1CAkPEBgZLi4uLi4usEAaAQCxGgsRErAHObAQEbIbHh85OTkwMRMhMhYSAgYGBwMGIyMiJjcBIiImNzc2NhcDNz4CNTQnJvoBQqWoBGi84mqSDDE7GRcHAUUzKxkHDAQd6ZVypGcoixgFy4z+8P7hhyMC/cktJRoFACMXKRAZjv21Bgy4wT95BgIAAgAD/yUDogXbACEAKwAvALIXAQArsQMSMzOyCwQAK7QqCQAxBCuwFy4BsCwvsS0BKwCxKhcRErElJjk5MDEXNzY3JicmAhISNjIWFhICBwYHFhcWNzYWBwcGBwYmBwYmEwYCFjY2EgIiApIOCTsnIYMWgZfqyKQvAoVqd7AQD3KDFRYGDAYjd+WDFxBkNwRMrqy0Ld3DZC8pDgwRUgH+AYkBHMdeqv64/g+swSsGBjg4CCMaNCMON3E6CCMDnb7+yaQO6AJQAXL+/gAAAv/jAAADjQXLAB8AKADBALIUAQArsBszsggEACuxAAbpsCAyAbApL7Al1rEMC+mxKgErsDYasR8Ah7AALg6wH8AFsSAa+Q6wGcCxFxSHBbAULg6wF8CxEBb5sA/AsRcUB7EVFxDAshUUFxESObAWwLAWObEZIAcOsRgZEMCyGCAZERI5sCHAsCE5AEAJDxAVFhcYGR8hLi4uLi4uLi4uAUAMAA8QFBUWFxgZHyAhLi4uLi4uLi4uLi4usEAaAQCxABQRErUMIiMlJickFzkwMQEiIiY3NzY2MyEyFhAHBgcTFiMjIiYnAwcDBiMjIiY3AQM3NjY1NCYmAS8zKRkHCgQfDAFcjaozWMReCjdGGxgETn+aDDE7GRcHAeuLf4uRRWkFPSMXKxAZjv7uec8//aJGIScCQwL9pC0lGgT8/dkHBt+8NkMGAAEAMP/fA44F4QAxAJEAsCEvsRcI6bAwL7EKCekBsDIvsBrWsSAP6bEsASuxDgvpsAbWsQAP6bEzASuwNhqxKSiHDrApELAowLEQEPmwEcAAsxARKCkuLi4uAbMQESgpLi4uLrBAGgGxDiwRErAqObAGEbESJjk5sAASsxMUFTAkFzkAsTAXERJADzEBAAYHCQQSHR8gIiosLSQXOTAxARQHBwYmNRAnJgcGBgcGFhcXFhYHBgAHIhEmNzc2FhUCFxY3PgImJycmJjU0EjYgFgOOI0gQIVgpMUB2BAIoOlR3SwIC/uS38QQiTBUaAlQfMVSBFzJoVjlUbNUBAG8EOzMKFwYXGgEPKRQWIdGFNTwSHSlsad3+iwIBiVILGAgWGf7NJwYUJebbRiAbEl9HfwERyNkAAQCAAAAEOAXLABUASACyBAEAK7IQBAArsQEJ6bAJMgGwFi+xFwErsDYasQgJh7AJLg6wCMAFsQER+Q6wAsAAsQIILi4BswECCAkuLi4usEAaAQAwMQEhAQYjIyImNwEhIjc3NjYzITIHBwYD4P7H/rYMMjsZFgYBRP68Ow4OBxgfAx8/DgsIBTf69i0lGgT4LzwaDzovKwAB/8X/8gQFBcsAHQBrALIAAQArsQ4I6bIHBAArsBQzAbAeL7EfASuwNhqxBAWHDrAEELAFwLEMEfmwC8CxERKHsBEQsBLAsRkP+bAYwAC3BAULDBESGBkuLi4uLi4uLgG3BAULDBESGBkuLi4uLi4uLrBAGgEAMDEFJicmExM2MzMyFgcDAjMyNjcTNjMzMhYHAwIHBgYBJ4tIj17dDTE7GRYG52LtYpox9AwxNBgVB+9CeTGXDgJHlgFqA2MtJRv8b/59pMgDuy0lG/xK/vhrL0EAAAEAc//8BEgFzwATADkAAbAUL7EVASuwNhqxDQ6HDrANELAOwLEAEfmwE8AAswANDhMuLi4uAbMADQ4TLi4uLrBAGgEAMDElATYXFxYHAQYHBwYmNxM2MzMyBwEdAm0WOC1DGP1UJVZAKS0ESAY4RTUGsgTuLwYEB0f6204EAgI/NAUrLTgAAQA5AAAF4QXLADEAQgCyIQEAK7ApM7IABAArsQ0ZMzMBsDIvsBbWsRwT6bEzASuxHBYRErAeOQCxACEREkALAgMFCAkQERMWFyYkFzkwMQEWBwYCFzYANzc2NzYzMzIHBgITNhITNjYzMzIWBwYCAAcjIicmEwYCByMiJwISEzYzAa84J1aNMZsBES8EEhUSNUoxFlI+QLr8DQIMGlIhEwILn/7IvhklDk4ISf5vMyUOWFiNDikFywRMnv0h+qoCWOgEWko1PvH9YP7y0wLGARMcFRUe2v3e/eeDKeEBkLH+knspARQDSAEpHQAB/4UAAAO7Bc0AHACFALIEAQArsAszshIEACuwGTMBsB0vsR4BK7A2GrEQB4cOsBAQsAfAsRUQ+bABwLEVAQewAMCyAAEVERI5sQgQEMCyCAcQERI5sA/AsA85sRYVEMCyFgEVERI5ALcAAQcIDxAVFi4uLi4uLi4uAbcAAQcIDxAVFi4uLi4uLi4usEAaAQAwMQETFgYjIyInAwEGIyMiNwEDJjMzMhcTATYzMzIHAfCHBhIZTDMOVv72FTVMSikBg4UWTDFDC1wBIxAzQlYvAqz9lhsnRgIA/ekvVgK2Am9SRv3qAjkjVgABAJIAAAPoBdMAHgBEALIOAQArAbAfL7AT1rEADOmxIAErsDYasRIThwSwEy4OsBLAsQsa+bAMwACzCwwSEy4uLi4BsgsMEi4uLrBAGgEAMDEBEhI3NhcXFhYHAgEDBiMjIiY3EzQCJyY2Nzc2FhcSAai/nT4OL0AWExHr/tmMDDE7GRYGjz8hDRsfOR0YBz8DAAEdARCDHwQIAich/mT+d/3ZLSUaAjaHAfKBJDQCCAISIf6DAAH/uQAABAEFzQAYAE8Asg4BACuxCAnpshgEACuxBwnpsBMyAbAZL7EaASuwNhqxEhOHsBMusAgusBMQsQcN+Q6wCBCxEg35ALASLgGzBwgSEy4uLi6wQBoBADAxASEyBwcGJyMBITIHBwYjISImNwEhIjc3NgE2ApswCQwIMQj87wHoOwwLDDf9pjMdEAMv/jg6DRIGBcsrPC8C+1w3Ly03JwTZNkEfAAH/YP6wAzEG5QAVAEsAsAgvsQEG6bAOL7EABukBsBYvsRcBK7A2GrEBAIewAS4OsAwQsAEQsQsN+QWwDBCxAA35AwCxCwwuLgGzAAELDC4uLi6wQBoAMDEBATMyBwcGBiMhIjcBNjMhMgcHBgYjAfP+Kb89DgQFKxb+9FQYAfgSQgEvPg8EBCsWBlb46UEVFiNcB5o/QRUWIwABAKsAAAHHBhQADABLALIKAQArsgMFACsBsA0vsAHWtAcVADQEK7EOASuwNhqxAQCHBLABLg6wAMCxBg75BLAHwAKzAAEGBy4uLi4BsQAGLi6wQBoBADAxJQMmMzMyFxMWBiMjIgEwfwY5LzEEfQIaFTkrKQWsPy36RhQZAAAB/uL+sAKvBuUAFQBLALAOL7EABumwCC+xAQnpAbAWL7EXASuwNhqxAAGHsAAuDrALELAAELEMDvkFsAsQsQEO+QMAsQsMLi4BswABCwwuLi4usEAaADAxFwEjIjc3NjYzITIHAQYjISI3NzY2Mx8Bz7w+DwQEKxYBD1QZ/g8TQf7OPQ4EBCsXwQcVQhYXIlz4Z0BCFBciAAH/+gHyAxcFFwAUAEoAAbAVL7AK1rEFD+mxFgErsDYasRIThw6wEhCwE8CxDAb5sAvAALMLDBITLi4uLgGzCwwSEy4uLi6wQBoBsQUKERKxAwQ5OQAwMQEzMhYXExQjIyI1AwEGIyMiJjcBNgJ7FxwrAjw8KzUn/lQQG14ZDAoB1zwFFykn/U0iJQJq/Y0cFg8CpVsAAAH/f/8bA2n/qAALABMAsAYvsQAG6QGwDC+xDQErADAxByEyBwcGIyEiNzc2RwOFKwgLCC38kDINEgZYLzMrL0cXAAEAcQSPAbcFlgANABYAsAAvtAYKABAEKwGwDi+xDwErADAxEzIXFxYGIyMiJycmNjP4KRd0CxMSIR8ctw4KEQWWI70QFx2+FRcAAv/8//QC/gQZACAAKQA8ALIWAQArshEBACuyAwIAK7AWLrAe1rEhCemwAy4BsCovsSsBKwCxIRYRErQICRMGJyQXObAeEbAiOTAxATYzNxYHAzY3NhcXFgcGBgcGJycGBiMjIi4CNhI2FzIXJgYCBhYWNhICVQgnL0sU9kA/FxwyIBZUjWEcCSY6UhYEEUNCHSGaonpEH22JgycGQplzA+cwAgJI/M0vWCETIRYdYm0WBBpxTDkvTFrtAaqoApc9df6YzUoiqAEkAAL/4//4At8GEgAJACQAgACyCgEAK7IOAQArshQFACuwCi6wDi6wFC4BsCUvsATWsSYBK7A2GrEREocOsBEQsBLAsQwb+bAXwLEMFwewCcCyCRcMERI5sBjAsBg5ALUJDBESFxguLi4uLi4BtQkMERIXGC4uLi4uLrBAGgEAsRQOERK2AAEGGxwdHiQXOTAxNxY2EjYmJgYCBxciJwYjIyI3ATYzMzIHAzc2NjMzMh4CBgIGpmKPhycGQ5xxQ1xEPxEmI0gMAXcMMi85DLIeK28jBBBGQxklnJ+PO2YBcdFKIrD+3vSqJx9CBaMtL/1GM0hmL1Rc9P5WlQAB/7f/5QKWBB8AHwAWALAOLwGwIC+wGtaxDAzpsSEBKwAwMQEWBwcGJycmBwYCAhcWFjc2NzYXFxYHBgYmJyYSNjYWAnUhGSIjGxZKK0qkRxIERBI+SxcrH0GwSlKlEzluoJqyA54jHScnHRlLCg7+4f7PZhkpBCFaHxsUJ44/F1QpfQHN9H8RAAACAAj/8gORBhIACAApAHQAshoBACuxBgrpshUBACuyJwUAKwGwKi+wH9axKwErsDYasQAlhw6wABCwJcCxChf5sAnAsQAlB7EkABDAsiQlABESOQC0AAkKJCUuLi4uLgG0AAkKJCUuLi4uLrBAGgEAsScaERK3AQUMDRchIiMkFzkwMQEmBgICFjc2EgEBNjc2FxcWBwYGBwYnJwYGIyMiJicmEjYXMhcTNjMzMgI7Zol9OSkvYJkBnP57O0AWHTEhF1SNYB0IJylcHQQngQICuaF3RD2JDTE1OwN1OWL+rv8AYhw+AU0DpPq5L1ghEyEWHWJtFgYccTlMh06gAgCfAiUB/i0AAv/U/90CcAQZABYAHgBGALACL7EMBumwFy+xBQjpsAAyAbAfL7AO1rEADemxGwErsAgysRQO6bEgASuxGwARErUCBAUXHB0kFzkAsQUCERKwBDkwMRMGFzY3NhcXFgcGBicmJyYSNzY2FgIAJz4CNCMiAoAcVEtvExYnGwkn0kCRGR2gjzKVpgL+4bZgiVkwXo0BG5YQHH0RDRgVGEqmDCVzmgIaiS4tRv62/ts8KW6epv7NAAABADoAAAOlBicAJQB8ALIAAQArsgwCACuwHDOxBQbpsCMysAAusBIvsRkI6QGwJi+xJwErsDYasQQNhw6wBBCwDcCxJA/5sBvAsQQNBwWxBQQQwLAMwLEcJBDAsCPAAwCzBA0bJC4uLi4BtwQFDA0bHCMkLi4uLi4uLi6wQBoAsRkMERKwFzkwMTMjIiY3EyMiNzc2MzM3NjY3NhcXFgcHBicnBgcHMzIHBwYjIwMGoTUZGQTgcykODwgleRg1okY/LX1CIRsOOYNpOxmUKw0ODimU3wwbFANSMTcnX8jJFBMKIRA8MR0TLVbdXy01LfysLQAAAv9L/nkC4AQSACMALQAlALIbAQArsAAvsAQzAbAuL7EvASsAsQAbERK0AhgkJSokFzkwMQEyFzYzNzYHBgMGBwYGJycmNzc2FxcWNxMGBiMjIi4CNhI2FyYGAgYWFjYSNwG5RD8MH0YzCi/+NW05QEHRMSAfISPjLxViLW8jBBBGQRsllaLdZomJJwZDnm9DBAwnKQICN7z8e787IwQldhkxKyUUjBRMAWZMZi9QWvYBn6SXOWL+jdFKIrQBH/MAAf/wAAADUwYSACcAuACyAAEAK7AYM7IHBQArshACACsBsCgvsSkBK7A2GrEEBYcOsAQQsAXAsSYG+bAKwLEMDYcOsAwQsA3AsSQI+bAhwLEmCgcOsQsmEMCyCwomERI5sQwNCLAMwLEkIQcOsSIkEMCyIiEkERI5sCPAsCM5AEALBAUKCwwNISIjJCYuLi4uLi4uLi4uLgFACwQFCgsMDSEiIyQmLi4uLi4uLi4uLi6wQBoBALEQABEStBscHR4fJBc5MDEzIyImNwE2MzMyBwMHEzY2MzMyFhYHAwYjIyI3EzY0IgYHDgMHBkY5Dg8HAXgNMS85DMtM00SPNCsgJRcX5QYbah8O1w8bJyEnbFSeQREhFAWwLS/85PYBYG9wFk5M/L0dMQK/NyMlMTiyg/F5HQAC/88AAAHDBUgACwAYAGMAsg8BACuyFQIAK7AAL7EGCukBsBkvsArWsQQU6bEaASuwNhqxEhOHDrASELATwLENEfmwDMAAswwNEhMuLi4uAbMMDRITLi4uLrBAGgGxBAoRErAYOQCxAAYRErEECjk5MDEBMzIWFAYjIyImNDYTAwYjIyI3EzYzMzIWAVQTIjo8LRAjNzlQ+AwxPDkM+govRBsSBUg+UDk7UDz+nfxILS8DuCkSAAL+tf59Ad4FSAASAB4AXgCyAAIAK7ATL7EZCukBsB8vsB3WsRcU6bEgASuwNhqxEBGHDrAQELARwLEED/mwA8AAswMEEBEuLi4uAbMDBBARLi4uLrBAGgGxFx0RErACOQCxExkRErEXHTk5MDEBMzIHAwYGBwYnJyY2NzY2NxM2EzMyFhQGIyMiJjQ2ASw/Mgv6MelrKxQRDggXWrAl8gpxEiM5Oy0RIzc5BBAr/Ei2zx8MHRgRKwgjsokDkykBOD5QOTtQPAAAAf/SAAAC8AYSABwApgCyDAEAK7AUM7IaBQArsgQCACsBsB0vsR4BK7A2GrEXGIcOsBcQsBjAsRIW+bAAwLEREIcOsBEQsBDAsQkG+bAKwLEBAocOsAEQsALAsQkKCLEJHPkOsAjAsRIAB7EBAgixARIQwLEREAiwEcAAQAsAAQIICQoQERIXGC4uLi4uLi4uLi4uAUALAAECCAkKEBESFxguLi4uLi4uLi4uLrBAGgEAMDEBAwE2MzMyFgcBExYjIyImJwMDBiMjIjcBNjMzMgHz4AE2ECdMIAQY/qCfEz43HxYIhXUMMiJMEAF3DDEvOgXj/JIBhRYtGv5i/gw3EB0Byf43LUIFoy0AAAH/0gAAAf8GEgALAEsAsgMBACuyCQUAKwGwDC+wBta0ABUACAQrsQ0BK7A2GrEGB4cEsAYuDrAHwLEBFvkEsADAArMAAQYHLi4uLgGxAQcuLrBAGgEAMDEBAQYjIyI3ATYzMzIB8/6LDDIiTBABdwwxLzoF4/pKLUIFoy0AAAH/8AAABScEEABCAQQAsh0BACuxLj4zM7IDAgArsQsVMzOxJArpsDQyAbBDL7FEASuwNhqxBwiHDrAHELAIwLE6HPmwN8CxMTKHDrAxELAywLEsHfmwEMCxERKHDrARELASwLEpGPmwJ8CxICGHDrAgELAhwLEbD/mwGsCxLBAHsRESCLERLBDAsSknBw6xKCkQwLIoJykREjmxODoQwLI4NzoREjmwOcCwOTkAQBMHCBAREhobICEnKCksMTI3ODk6Li4uLi4uLi4uLi4uLi4uLi4uLgFAEwcIEBESGhsgIScoKSwxMjc4OTouLi4uLi4uLi4uLi4uLi4uLi4usEAaAQCxJB0RErIiMzw5OTkwMRM2NjMzMgcDEzY2MzMyFhYHAxM2NjMzMhYWBwMGIyMiNxM2NCIGBw4CBwYHBiMjIjcTNjQiBgcGBgcGBwYjIyImN+4KEQ5UMxKa1T6XMSshJRcXaMRAkzMrISUWFuUHGmseDtcQHCchJ1yWGFwtDRZpHg7XEBwnISduVJ5CECE5DBEGA9snDjv9/AFgZ3gWTkz+gQFSb24WTkz8vR0xAr83IyUxOJXqKZViHTECvzcjJTE4soPxeR0hFAAB//AAAANVBBAAJgBvALIMAQArsBwzsgQCACuwIzOwDC6wBC4BsCcvsSgBK7A2GrEgIYcOsCAQsCHAsRoe+bAmwLEaJgewAMCyACYaERI5ALQAGiAhJi4uLi4uAbQAGiAhJi4uLi4usEAaAQCxBAwRErQPEBESEyQXOTAxExM2NjMzMhYWBwMGIyMiNxM2NCIGBwYGBwYHBiMjIiY3EzYzMzIH8tVEjzMrISUXF+UGG2seDtcQHCchJ25UnkIQITkMEQb4Ch9UMRAB0QFgb3AWTkz8vR0xAr83IyUxOLKD8XkdIRQDpjU7AAAC//r/6QKaBCUADgAbAEMAsgsBACuxGwbpsgICACuxFAnpAbAcL7AA1rEZC+mxEgErsQcR6bEdASuxGQARErABObASEbEQFzk5sAcSsAg5ADAxERIAFxYXFgcCAwYnJicmJTYTNiYmBgcGBwYXFgkBAMZnOSsICJ5tuEE4VAFjiwgCHVxMJFsIBEQ7ASkBEgHqBAZhQ6D+0f7+vQcCN1Be2wEPeFICWE629LgGAgAC/3/+ZgLXBBAACQAmAIkAshgBACuyHQAAK7IkAgArsB0usBgusA/WsCQuAbAnL7AE1rEoASuwNhqxISKHDrAhELAiwLEbG/mwCsCxGwoHsAnAsgkKGxESObALwLALObAawLAaOQC2CQoLGhshIi4uLi4uLi4BtgkKCxobISIuLi4uLi4usEAaAQCxDxgRErIAAQY5OTkwMTcWNhI2JiYGAgcTBzc2NjMzMh4CAgIGIyInAwYjIyImNwE2MzMyoGSNhycGQ55vQ9MvHCtvIwQQRj8bH6Sbd0Q9ZA0xJSEaBgFYDCs8NY85YAF10Uoktv7i9ANBti9IZi9QVP8A/lCPJf52LSUdBT0rAAL/9/5mAvMEEAAJACUAgACyGwEAK7ISAAArsiQCACuwDDOxCgfpsBIusBsusCQuAbAmL7EnASuwNhqxFgqHsAouDrAWwLEPDvmwEMCxFgoHsQkWEMCyCQoWERI5sBfAsBc5ALQJDxAWFy4uLi4uAbUJCg8QFhcuLi4uLi6wQBoBALEKGxESsgABBjk5OTAxASYGAgYWFjYSNzc2MzMyBwEGIyMiJjcTBwYGIyMiLgISEjYzMgIuZI6HJwdDnm5EJQotPDMN/qQMMSUhGgaPGytuIwQQRkAaH6Ocd0MDdTlg/ovRSiS2AR/zhSkv+rItJR0CLS1IZi9QVAEAAbCPAAAB/+EAAAK/BBcAIQBzALIXAQArsgQCACuyHQIAKwGwIi+xIwErsDYasRobhw6wGhCwG8CxFRH5sCHAsRUhB7AAwLIAIRUREjmwFMCwFDkAtQAUFRobIS4uLi4uLgG1ABQVGhshLi4uLi4usEAaAQCxBBcRErUJCwwNDhIkFzkwMQE+AjMzMgcOAhUUFxYGBwcGJicDBiMjIjcTNjMzMhYHAUxBbzNAFDwTClCJMwwKEE4hIyudDTE7Og36Ci8/GxIGAv5qjCMuGEiuGjYvChcEDgYaUP2gLS8DuCkSGQAB/77/6QKcBB0AMgBlALIAAgArsQ4I6bAnL7EcBukBsDMvsDDWsREQ6bEqASuxFwvpsTQBK7ERMBESsiUtLjk5ObAqEbEULDk5sBcSsgsOFTk5OQCxDicREkASCwgREhQVFhcYIyQlKiwtLjAxJBc5MDEBMzIWFxYHBwYnLgMnBgYVFBYXFxYVFAcGBiMjIiYmNzc2HgIXNjY0JicnJiY1NDYBhx9GdiUVIz4rEgIdEi0dM1orNzl9UCaETQ9OejIZLRUxElIjPVoeNi1PQr4EHWtOKxYjHykERB0kBQtyaS0jDAwbtGuLQVttcRwlFQREYAIKfaItDAoTXlCF+AAAAQAKAAACPwV7ABwAcQCyCwEAK7IBAgArsBczsQgG6bAQMgGwHS+wD9a0BBUACAQrsR4BK7A2GrEPGIcEsA8uDrAYwLEJD/mwAMCxCQAHBbABwLAIwLEQDxDAsBfAAwCzAAkPGC4uLi4BtgABCAkQFxguLi4uLi4usEAaADAxAQMzMgcHBiMjAwYjIyImNxMjIjc3NjMzEzYzMzIB+FBqLQ4ODydq2QwyJiEbBtVSKQ8QDCFSUgwxNDkFTP7ELTUt/KwtJR0DPzE3JwE+LQAB/98AAAM3BBAAIACJALIEAQArsB0zsgsCACuwFjMBsCEvsSIBK7A2GrEICYcOsAgQsAnAsQ8X+bAOwLESFIcOsBIQsBTAsQEI+bAAwLESFAexExIQwLITFBIREjkAQAkAAQgJDg8SExQuLi4uLi4uLi4BQAkAAQgJDg8SExQuLi4uLi4uLi6wQBoBALELBBESsBA5MDEBAwYGIyMiJjcTNjMzMgcDBhcWNgE2MzMyFgcDBiMjIjcCKbtBhzMNP0gf0QYaax8Pzw4KF6ABTREhTQ0QBvgKH1QxEAIZ/sZwb4tvAvocMf06QBIh8gJcHCAV/Fo1OwABAIr//gMNBB0AFgA2ALISAgArsgQCACsBsBcvsA7WsQAN6bAVMrECASuxBxDpsRgBK7EADhESsA85sAIRsBY5ADAxJRITNhcXFgcCAwYnJyY3EgMmMzMyFxIBJ7uBCi85OA2h0044OT8GGB4ENTkvAhvBATUB/CsEBQop/dv+uXcCBARgAX0B4Esv/hUAAQCG//4E0wQdACoAVACyBQIAK7EPJjMzAbArL7Al1rEpEOmxGQErsQoN6bAIMrEMASuxEhDpsSwBK7EpJRESsSMAOTmwGRG0AgMEGCokFzmwChKxGhs5ObAMEbAJOQAwMSU2Ejc2MzMyFxIDEhM2FxcWFgcCAwYnJyY3NicGAwYnJyY3EgMmMzMyFxIBHXHABwQtQScGHx+7gQovORcaBqHTTDU+PwYMBEybSDVAPwYaEgQ1Pi0CDr61AghuJy/+Qv6eATMB/isEBQIcFf3b/rl3AgQEYPrbyP8AdwIEBGAB4gGZLS/+XgAAAf+Q//YDIwQQACoA1gCyGAEAK7AnM7IGAgArsA8zAbArL7EsASuwNhqxAAKHDrAAELACwLEjHfmwHsCxBByHDrAEELAcwLEJCfmwFMCxBBwHsQACCLECBBDADrELCRDAsgsUCRESObEjHgixHgQQwLEjHgcOsR8jEMCyHx4jERI5sCDAsCA5sCHAsCE5sCLAsCI5AEANAAIECQsUHB4fICEiIy4uLi4uLi4uLi4uLi4BQA0AAgQJCxQcHh8gISIjLi4uLi4uLi4uLi4uLrBAGgEAsQYYERK1KgENHSQlJBc5MDEnEjcmJyYzMzIXFhc2NzYzMzIHBgMWFxYHBwYmJyYnDgUHBiMjIiZi+HszRBo7OS0PNyVaiQ4pRjctbtUvJQYnPhwVChQhjVsQBA4LCAwVOx0SMwEtqtfkSy++moPqGkm//t3R6SkCBgQYK4yXtG0UBhEEBAgjAAH/y/5tA0oEEAAtAIcAshsBACuyAAIAK7AjMwGwLi+xLwErsDYasSAhhw6wIBCwIcCxJxf5sCbAsRUsh7AVELAswLEFDvmwBMCxFSwHsRYVEMCyFiwVERI5AEAJBAUVFiAhJicsLi4uLi4uLi4uAUAJBAUVFiAhJicsLi4uLi4uLi4usEAaAQCxABsRErEoKjk5MDEBMzIWBwEGBwYHBicnJiY3NzYXFxY3EwcHBgYjIyInJjcTNjMzMgcDBhcWNgE2At9ODRAG/tMxcTERKU/RGwQOHyEj4y0Xxi95QYc0DCsdRyfRCBhrHw/PEAwXogFLEQQQIBX7v709GwYSMXYNLw4rIxKMGFACvlrLcG8fTo0C+hwx/TpAECPyAlwcAAH/pAAAAxsEEAAfAKEAsgsBACuxAAjpsAEyshsCACuxEAjpsBEyAbAgL7EhASuwNhqxDxCHsBAuDrAPwLEfHfkFsADAsRIRh7ARLg6wEsCxGQ75sBjAsQEChwWwAS4OsALAsQkN+bAIwAC3AggJDxIYGR8uLi4uLi4uLgFADAABAggJDxAREhgZHy4uLi4uLi4uLi4uLrBAGgEAsRAAERK3AwQFBhMUFRYkFzkwMTchNzY3NzYWBwcGIyEiJjcBIQcGBwcGJjc3NjMhMhYHeQEnIQo1KxsZBjoMMf4aPRslAoH+4SALNS0aGQY7DS8BzTUxNYODKQQEAhoZ2S1cJQMMgykEBAIbGN0pXkUAAAH/0/6uA3cG7gA1AKoAsAAvsS4J6bAXL7EeCekBsDYvsBLWsC8ysSQO6bEiDOmxNwErsDYasQUHhw6wBRCwB8CxLAn5sCnAsQUHB7EGBRDAsgYHBRESObEqLBDAsiopLBESObArwLArOQC2BQYHKSorLC4uLi4uLi4BtgUGBykqKywuLi4uLi4usEAaAbEiEhESsiEoMDk5OQCxHi4REkALCQoLDxARFBUiIyYkFzmwFxGwFjkwMQEHBiYnJhI3NicnJjc3Njc3NjYmJyYSNzMyBwcGBiMjIgYXFhYGBxYWDgMWMzMyBwcGBiMBNFpngwwRryZSnS8yDw4KPlJgTAQLHInujz0OCAQpF417PwwOBHCoTkEbQ1w8J1BzPQ4IBCsX/rQEAn1iawE9VLs9EhU7PCkMEBVcnHTmAR4FQicWH5bKkLqPNCWVi5Kuj30+JhcjAAAB/2r+ZgHpBhIADABLALIDAAArsgoFACsBsA0vsAfWtAAVAAcEK7EOASuwNhqxBwiHBLAHLg6wCMCxAQb5BLAAwAKzAAEHCC4uLi4BsQEILi6wQBoBADAxAQEGIyMiJjcBNjMzMgHd/iEMMhohGwcB2wwxJzkF4/iwLSUdBz0tAAH/Af6wAqUG8AA3AEgAsBcvsR4J6bAAL7ExCekBsDgvsCTWsREN6bAyMrE5ASuxESQRErIhKzM5OTkAsTEeERJADgYFCQsPEBMUCiInKCkuJBc5MDEBNzYWFgcGBwYXFxYHBwYHBgYWFxYHBgcjIjc3NjYzMzI2AicmNzY3NjcmJj4DJiMjIjc3NjYBRFpngx19MiRWny8yDw4KPrBOBAscQ0bujz0OCAQpF417QhsCBC87fSMOTkMfQV44IVRzPQ4IBCkG6QUCfeDVVlG9PRMUPDspDB1knHXlj5AEQicWH5cBWjaDO04pCgYllouRro5/PScXJQAAAQBfApYDTQOLABIAABM3Njc2NhY3NhYHBwYHBiQHBiZpDQYbN7rhrRodCAsGN5H+zqocFQMZIh0MHwhWOAglHykjFjl+QQonAAACABn/6QKOBeMACwAXAC8AsAAvsQYK6QGwGC+wCta0BBQAEQQrsRkBK7EEChESsBc5ALEABhESsQQKOTkwMQEzMhYUBiMjIiY0NhMDBiMjIjcBNjMzMgINFylBRjMSK0BCJ/YINXk8DwFwDykMLwXjRVg+QFw//nf7vS4wBEMtAAH/3P89ApsFHwAqACAAAbArL7AX1rENDemxLAErsQ0XERKzDxgZJCQXOQAwMRciNzcmJhISNzc2MzMyBwcWFgcGJycmNzYmIgYCFjI2NzYXFxYHBgcHBiOLQg40VllE44M8DC8tOA07XCU3Cy8xNxIrCl6yaSVtcCcPHEQvF2qkNQ0vw0C4JegBdAFAHuArLeIg9JgcCAwKMpGT1/6k749aGwgdFTHjIccrAAAB/1j/7gOyBaoANgBRALI1AQArsSsK6bAEMrIxAQArsAsvsB4zsQYG6bAkMgGwNy+wDdaxHg7psTgBK7EeDRESsR0lOTkAsSs1ERKyAyozOTk5sAYRsigpLDk5OTAxJzc2NzYSNyMiNzc2FzMmEjYEFgcGBwcGJjcSJyICEyEyBwcGIyMGBgc2BDc2FgcHDgIkBAYmnxAEDj7zLGUtDAsGGGsXbckBFo89DiNEHhUIe9OHgxABES8KCwgt+hCHSGgBJaYVGggMCn2a/vD+3TMPNTMZCikBFYU5KysC+gFCkw7o3TcIEwglFgFUD/7f/uEvNSllyk4IbEMGHB05JScKZmAEIAAAAgBS/8EEKwTJAC4AOwCVALA7L7EiCOmwCy+xNAjpAbA8L7Au1rE5E+mxGQErsDEysRYL6bE9ASuwNhqxAwKHDrADELACwLEJH/mwCsAAswIDCQouLi4uAbMCAwkKLi4uLrBAGgGxOS4RErMBBCQtJBc5sBkRsiEwNzk5ObAWErMNGBUbJBc5ALE7IhESsSQhOTmwNBGyFRktOTk5sAsSsA05MDETNjcnJjc3NhYXFzYWFzc2FxcWFgcHFgcGBxcWBgcHBicnBiYnBwYiJycmJjc3JgU2NzYmJgYHBgcGFxblCIJOFx9GGi8KNl6kKWghJTMjBBePEAQIoEYKEiMjUhQjSosrWhclCj0fChaDCAFtkQgCHmFNJ1wLBEg9AY/gyvxGFCcTISe2PQIYnzEWHxQlHbY1VO7h1x0fEhQrWI8hAhmUIAgpEiEhvikQtuFlQwJJQJjKmgQCAAP/ugAABCoF0wAMABkAOABJALIoAQArsA0vsRMI6bAAL7EGCOkBsDkvsCzWsSYR6bAt1rEaDOmxOgErsS0sERKxMDE5OQCxEygRErAsObEABhESsSUtOTkwMRMhMgcHBiMhIjc3NjYDITIHBwYjISI3NzY2ARISNzYXFxYWBwIBAwYjIyImNxM0AicmNjc3NhYXEjkDUC8LCAo5/Mw9EAsIECMDUC8KCAo6/M09EAoJEAH+vp49Dy8/FxIQ7P7ajAwxPBgXBpBAIA0bHzkdGAZAArwtKSs2IhsO/v4tKSs2IhsOAUYBHQEQgx8ECAInIf5k/nf92S0lGgI2hwHygSQ0AggCEiH+gwAAAv9c/mQB6AYZAAsAFwCEAAGwGC+wBta0DBUABwQrsRkBK7A2GrEGE4cEsAYuDrATwLEBBvkEsAzAsQEMBw6wAMCyAAwBERI5sQcGEMCyBxMGERI5sQ0BEMCyDQwBERI5sRIGEMCyEhMGERI5ALcAAQYHDA0SEy4uLi4uLi4uAbUAAQcNEhMuLi4uLi6wQBoBADAxEwMGIyMiNxM2MzMyAQMGIyMiNxM2MzMyxcsMMSc6DcoNMSc5AQrKDTEnOQzLDDEnOgGc/PUtLwMLLQQe/PYtLwMLLQAAAv/h/1QDiwYQADAAOgA8ALAFLwGwOy+wB9axDhDpsBfWsTQL6bAc1rEsC+mxPAErsTQOERKxBRU5ObEsHBEStBMaMTY3JBc5ADAxARYVFAIjIhE0Nzc2FhYGFhY+AiYnJjU0NjcmNTQSMhYHBgcHBiY3NicOAhYWEAYDJgYUFhYXPgICGQbRpscnPBohBAgIHWBxEilGoY1cEM/fkQwEI0gWFwIPaTleBDvNd6ZWbDlkEzdSCgFtGR2y/s8BTDkTHg8VG2BcTBWNpk4lVHKM7y8hJawBErCyJQ4VBA8a8gYOsmc5e/78/AHuBstnNzsPH4nDAAIBKQTTA0QFmgALABcANQCwAC+wDDOxBgrpsBIyAbAYL7AK1rEEFOmxFgErsRAU6bEZASsAsQAGERKzBAoQFiQXOTAxATMyFhQGIyMiJjQ2ITMyFhQGIyMiJjQ2AY0TIzk7LhAjNzkBcxIjOjwtECM3OQWaPlA5O1A8PlA5O1A8AAADAED/8AXiBdcADwAdAD0AOQCyDAEAK7QTCAAzBCuyAwQAK7QbCAAlBCsBsD4vsT8BKwCxGxMREkALHiEiKCktLjI2NzkkFzkwMRMSADMgFxYXFgcCACAnJgI3AhIhMgA3NgImJiMiAAE2Njc2FxcWBwYGIiYmEgAXFhYHBicnJjc2JyYGBgIWekkBovoBJ6pMJUFFUP52/d63bjzDTvoBEN4BOT0nIWTLhdv+uAFlM3UaCRhMHw05rLBzO1wBCKR7PVAMHz8pDGBiMX1eSCEDZAELAWjNWn3t+P7f/sO2cQGHlf7R/lwBPPOIAQTOf/6//TUKpE4bCx4PHIeiXucBjAEMDg+4xRoEDAYl+BAIXqb+/PwAAAIAXwMZAqUGJwAjACoAGQCwEi+0JAgAJQQrAbArL7AP1rEsASsAMDEBNjc2FxcWBwYHBicnBiYmNjYXNicGBwcGJycmNzY2HgIHBicOAhY2NgHYTicMFR4ZDF6GJAsWWLIHdbBYJyk9YhEMDiUTBhmmZFgVEytsXnEZVk43A6QrQxcKDwwSoB8GEidNT8GcTwaeFwdyEwwKIw4RM30ENWNm21wCZYseU5L//wCnAKYDgwPDECcA3QEjAAAQBgDd/gAAAQDYAY0FrQOcABAAPgCwBy+xAAnpAbARL7ESASuwNhqxEACHsAAuDrAQwLEKD/mwC8AAsgoLEC4uLgGzAAoLEC4uLi6wQBoBADAxASEiNzc2NjMhMgcDBiMjIjcE5PwwPBUGCh8jBBxSGGsMMTQ5DAMEShQlFVj+di0vAAQAQP/wBdYF1wAdACcANABCALMAsjEBACu0OAgAMwQrsioEACu0QAgAJQQrsx4xKggrtBUIACUEK7AWMgGwQy+xRAErsDYasR0Ahw6wHRCwAMCxFx35sCfAsRUUhwWwFS4OsBTAsQ4M+bAPwLEXJwcFsRYXEMCwHsADALYADg8UFx0nLi4uLi4uLgFACgAODxQVFhcdHicuLi4uLi4uLi4usEAaALEVOBEStxASExEYGRobJBc5sUAeERK0AggLICYkFzkwMQEGBiY3NzY3NhYWFAcGBxMWIyMiJwMjAwYjIyImNxM3Njc2NzYnJicFEgAEABIHAgAgJyYCNwISITIANzYCJiYjIgACkBYrFwQRBCN06IEtQmhMDClKHQo/VlgJKTUSEwT6QFQjSwcESClA/WFJAaICAgEjTDlQ/nb93rduPMNO+gEQ3gE3PychZMuF2/64BEQFCBkQPBIKHSV5ukxwI/62MycBQ/63HxgTAaQCBBw8dUcnFwLoAQsBaAb+4f6U+P7f/sO2cQGHlf7R/lwBOvWIAQTOf/6/AAEAYQZCA4MGtgAKABMAsAAvsQQI6QGwCy+xDAErADAxEyEyBiMhIiY3NzaWAs8eIhv9PyAEDAoIBrZ0HB0jGAACAQIERgM7BnEACQASAFEAsA4vtAMIACUEK7AIL7QSCAAlBCsBsBMvsAXWtAwMABMEK7EQASu0AAwAEwQrsRQBK7EQDBESsggDDjk5OQCxEg4RErYJAQAGBQwQJBc5MDEBFAYiJjU0NjIWBQYUFjI2NCYiAzvO6IPR54H+b0JWkIdSmgWFj7CHZouzhRtAk1h7m1QAAv/3ADkDQAPJABwAKAB3ALAdL7EjCOmwDy+wFjOxAQjpsAgyAbApL7EqASuwNhqxBxCHDrAHELAQwLECHvmwFcCxAhUHBbABwLEIBxDAsA/AsRYCEMADALMCBxAVLi4uLgG3AQIHCA8QFRYuLi4uLi4uLrBAGgCxAR0RErMDBAUGJBc5MDEBIQcGIyMiNzcjIjc3NjMzNzYzMzIHByEyFgcHBgEhMgcHBiMhIjc3NgMD/vA6DC8pNww5+iAGEAgl+DMMMCk3DDIBCRASBA4G/PYCgyUHCAYj/YsiBgwEAl7dKy3bH0EfwSstvxIPPSH+WikxJSVEFgABAAsCjwKtBh8AHgBFALAAL7EHCOkBsB8vsBjWsREM6bEgASuwNhqxAB6HsAAuDrAewLELIPmwDMAAsgsMHi4uLgGzAAsMHi4uLi6wQBoBADAxEyEyBwcGBiMhIiY3ATYmJgYVFAYHBwYmNTQ2MhYGB9oBSC8NDAQhEP5UKyEnAZFaBpdhGg44Fg2z82sxZQMOKy8OF0YvAaZingpgSAwUAwgCExJ3pJDbZAAAAQBoAnsCqAYjACsAZwCyEwIAK7QaCAAzBCuwDy+0BQgAJQQrsCcvtB4IACUEKwGwLC+wB9axDQzpsCXWsSAM6bEtASuxDSURErAOObAgEbAWOQCxEw8RErQCCAcNCyQXObAaEbAAObAeErMgIyUmJBc5MDEBFhAGBwYmNTQ3NzYWFQYWNjc2IyInJjc3NhY2NiYiBgYHBwYmNTQ2HgIGAgRguoNgXxs7Hw8JokwIH5gUCg8EBAdgcB8zbVYEIDgWDajTbQRWBGIa/vzFAgKTYykMGAsRGrUCby+aCAgTLSICSoVWWHAHBgIVFnOoBHeeiQABAH8EjwHABZYADQAZALAAL7QGCgAQBCsBsA4vsArWsQ8BKwAwMQEyFgcHBiMjIiY3NzYzAZ8XChKzFiMrEAgGfxYpBZYbGboZFwbHIwAB/3z+ZgNdBBAAJQC5ALIaAQArsBIzsh8AACuyCgIAK7AAMwGwJi+xJwErsDYasSMkhw6wIxCwJMCxHQb5sAPAsRUKhwWwCi4OsBXAsQ8P+bAQwLEdAwexBB0QwLIEAx0REjmxCRUQwLIJChUREjmwFsCwFjmxHB0QwLIcAx0REjkAQAsDBAkPEBUWHB0jJC4uLi4uLi4uLi4uAUAMAwQJCg8QFRYcHSMkLi4uLi4uLi4uLi4usEAaAQCxChoRErEFBzk5MDEBMzIHAwYXFjYANjMzMhYHAwYjIyI3EwIGIyMGBwMGIyMiJjcBNgEWah8Pzg8KF54BOyUhTgwQBvgKH1QxEY3hnjcpAhNKDDEbIhsIAXEGBBAx/TpAEiHtAjxBIBX8WjU7Ad7+bIUjRf77LScbBUwcAAABAOv+ZgXpBcsAHAB2ALIDAAArsBczsg0EACuxAAnpsRQcMjIBsB0vsR4BK7A2GrEBAIewAC4OsAHAsQgh+bAHwLEbHIcFsBwuDrAbwAWxFCH5DrAVwAC0AQcIFRsuLi4uLgG3AAEHCBQVGxwuLi4uLi4uLrBAGgEAsQADERKwCTkwMQEBBiMjIiY3ASYmEiQzITIHBwYjIwEGIyMiJjcBA37+UAwxMiAbBgEPkrwKATP2ApwvDQwIMZj+UAwxMSEbBgGsBTn5Wi0lHQQlBq4BUPoxOCn5Wi0lHQaRAAABALICRAGoAysACwAqALAAL7QGCgASBCsBsAwvsArWtAQUABEEK7ENASsAsQAGERKxBAo5OTAxATMyFhQGIyMiJjQ2AScWJ0RGMxQpQEQDK0hcQ0VeRAAAAQBq/okB0P+4AA8AJQCwBS+0CggAFgQrAbAQL7AN1rEDDOmxEQErALEKBRESsAQ5MDEFFxYHBgciJycmNzY2NTQ2AXI8Igwx9h8GBggjUmAnUBAKNM8KGxgnAgdcRxsOAAABAGUCjwIXBhsAFABCAAGwFS+wD9a0AhUACgQrsRYBK7A2GrEDAocEsAIuDrADwLEJHvmwCMAAswIDCAkuLi4uAbIDCAkuLi6wQBoBADAxATYHAwYjIyI3EwcGIyMiJjc3NjYzAfIlDvgIHU4lDc9bHBs9GQgXuCcvFgYZAin8vB8pArBWHCsUnCMlAAIAjwNQAtcGHwAJABAATACwCi+xBgjpsAAvsQ0I6QGwES+wCNaxEA7psQ0BK7EDDemxEgErsRAIERKwBjmwDRGzCQAKCyQXObADErABOQCxDQoRErEIAzk5MDEBMhYUBgYiJhASEzI2EgYGEAIAam1OrNF9xyNiaQS9aAYfls3QnIMBLQEf/azVAQYCz/72//8ADwCmAwADwxAnAN4BKwAAEAYA3v4A//8AHv/JBusGHRAnAN8AwwAAECcAegCJ/90QBwDgA7L9c///AB7/yQbrBh0QJwDfAMMAABAnAHoAif/dEAcAcwQK/XP//wAe/8kG6wYdECcA3wDDAAAQJgB0H90QBwDgA8H9cwAC//T/4QK+BcsAIAAsADsAsicEACu0IQoAEgQrAbAtL7Al1rQrFAARBCuwANaxBA/psS4BK7EEABESsBQ5ALEnIRESsSUrOTkwMQE0FxcWDgYWFhc+AhcXFgcOAiYmEhI2NzY2NyMiJjQ2MzMyFhQGAdk+Ly0CUmWXPDEnCSsgFVY1JycjGzOFXJY7Fm95rhghcRcnQ0U0FCk/QwRaLwYGCInFUgQzjPtjLwYEVjsaGRglQHATRoMBSAEWWgsgqK5IXERGXkQA////ef/6A0UHNhImACQAABAHAEMBRgGg////ef/6A+kHNhAmACQAABAHAHUCKQGg////ef/6A68HShAmACQAABAHAMoBUAF/////ef/6BBwHBBImACQAABAHANAAmgH0////ef/6A+wHSBAmACQAABAHAGoAqAGuAAP/eP/6A9oGwQAEABsAJABnALIPAQArsBczsAQvsRMJ6QGwJS+wEtaxDRPpsSYBK7A2GrESAIcEsBIuDrAAwASxDRn5DrAMwLESAAcFsQQSEMCwE8ADALMADA0SLi4uLgGzAAQMEy4uLi6wQBqxDRIRErACOQAwMQEmJwEhAyYSNhYWAgcDBiMnIjcTIQMGJycmJjcBBgYWFjY2JiYCkB8a/uUBLY1EIajwiSt7OwI8RTQEG/6Uxxc1LyEaEAL2Ohwldl8pLW8EhQIG/cMCgU4BCpgJl/7fVPuBLQI3AYP+bS8GBAQpIQXhLY9rGFCHchsAAv80//4F2gXLAAIAKwDiALIGAQArsCczsSAG6bIOBAArsRYG6bMABg4IK7ABM7EDCemwKzKzHwYOCCuxFwbpAbAsL7EtASuwNhqxBgCHsAYuDrAMELAGELELEfkFsAwQsQAR+bEgFoewIC4OsAIQsCAQsSoa+QWwAhCxFhr5sSoCB7EBKhDAsQYAB7EDBhDADrAEwLIEAAYREjmwBcCwBTmxIBYHBbEXIBDAsB/AsSsqEMADALUCBAULDCouLi4uLi4BQA8AAQIDBAUGCwwWFx8gKisuLi4uLi4uLi4uLi4uLi6wQBoAsSAGERKwCTkwMQEhEwEDBgYnJyYmNwE2MyEyFgcHBiMhAyEyFgcHBiMhAyEyFgcHBiMhIjcTAUkBJ3T+Bv4QFh1IHBEOA2c7PgKJHRIIDwop/gBQAZwQEwYPDDH+e2UBfRMOBA4KOP4zNQZEAlACj/zd/msZEAIEAjEVBSlWFxw0J/4tGhUzK/2wHBMzKzcBhQD////5/okDhAXbECYAJgIAEAYAeW8A//8BFwZNAl0HVBAHAEMApgG+//8CQAZNA4EHVBAHAHUBwQG+//8BpAaBA2sHiRAHAMoBDAG+//8BYAaPA3sHVhAHAGoANwG8AAL/+gAAAgYHVAANABsASwCyCQEAK7ICBAArAbAcL7AN1rQGFQAIBCuxHQErsDYasQ0AhwSwDS4OsADAsQcR+QSwBsACswAGBw0uLi4uAbEABy4usEAaAQAwMQE2MzMyFgcBBiMjIiY3ATIXFxYGIyMiJycmNjMBXg0xOxkWBv6iDDI7GBcGASMpFnUKEhIhHx22DgoQBZ4tJRv6oi0lGgcVI7wRFhy/FBcAAv/fAAACwQdUAA0AGwBDALIJAQArsgIEACsBsBwvsR0BK7A2GrENAIcOsA0QsADAsQcR+bAGwACzAAYHDS4uLi4BswAGBw0uLi4usEAaAQAwMQE2MzMyFgcBBiMjIiY3ATIWBwcGIyMiJjc3NjMBRAwxPBgXB/6iDDE8GBcGArsWCxOyFyIrEQgGfxcpBZ4tJRv6oi0lGgcVGxi7GBYGxyMAAv/fAAACfwdKAA0AIgBMALIJAQArsgIEACsBsCMvsA3WtBwVAAcEK7EkASuwNhqxDQCHBLANLg6wAMCxBxH5sAbAALMABgcNLi4uLgGyAAYHLi4usEAaAQAwMQE2MzMyFgcBBiMjIiY3AQcGIyMiJjc3NhcXFhcXFgYjIyInAUQMMTwYFwf+ogwxPBgXBgHegRcjMRYJE88jEBIVFG0KDBM7IQoFni0lG/qiLSUaBpyDFh4Ruh8CAgIjvQ4UFgAAA//fAAACpgdGAAsAFwAlAHQAsiEBACuyGgQAK7AAL7AMM7EGCumwEjIBsCYvsArWsQQU6bEWASuxEBTpsScBK7A2GrElGIcOsCUQsBjAsR8R+bAewACzGB4fJS4uLi4BsxgeHyUuLi4usEAaAbEQFhESsB05ALEABhESswQKEBYkFzkwMQEzMhYUBiMjIiY0NiEzMhYUBiMjIiY0NgM2MzMyFgcBBiMjIiY3AScSIzo8LRAjNzkBOxMjOTstESM3OcgMMTwYFwf+ogwxPBgXBgdGPlA5O1A8PlA5O1A8/lgtJRv6oi0lGgAAAQBWAlIDTALfAAsAEwCwAC+xBgbpAbAML7ENASsAMDETITIHBwYjISI3NzaQAo8tCgoLK/2GMg0SBgLfLzMrL0gWAP//AfoGIwSIBwQQBwDQAQYB9P//AA7/9AOkB1QSJgAyAAAQBwBDATUBvv//AA7/9APdB1QSJgAyAAAQBwB1Ah0Bvv//AA7/9AOkB0oQJgAyAAAQBwDKAS0Bf///AA7/9APoBwQSJgAyAAAQBwDQAGYB9P//AA7/9AOxB0gQJgAyAAAQBwBqAG0BrgAB/80ABgOVBPoAHgDGAAGwHy+xIAErsDYasQ8Yhw6wDxCwGMCxCQv5sB7AsREHhw6wERCwB8CxFgv5sAHAsRYBB7AAwLEJHgexFgEIsQAJEMCxEQcHDrEIERDAsQkeB7ERBwixCAkQwLERBwcOsRAREMCxDxgHsREHCLEQDxDAsRYBBw6xFxYQwLEPGAexFgEIsRcPEMAAQAwAAQcICQ8QERYXGB4uLi4uLi4uLi4uLi4BQAwAAQcICQ8QERYXGB4uLi4uLi4uLi4uLi6wQBoBADAxARMWBgcHBicDAQYnJyYmNwEDJjc3NhcTATYXFxYWBwH8sgoUIRlLG3n+5B8nMx8KFgFtrBsnNzoajgE3ISUpIgQWAmr+IRwfEwwrWAF//ncxGCETICEBzwHfRBYjH1T+WgGsMRYZFCcbAAAD/5L/9ARuBdsAIwArADQAxACyGAEAK7EmBumyBQQAK7ALM7QxCQAxBCsBsDUvsTYBK7A2GrEhCYcOsCEQsAnAsRse+bAPwLEhCQexCCEQwLIICSEREjmxEBsQwLIQDxsREjmwGsCwGjmwJMCwJDmwK8CwKzmxLiEQwLIuCSEREjmwL8CwLzkAQAsICQ8QGhshJCsuLy4uLi4uLi4uLi4uAUALCAkPEBobISQrLi8uLi4uLi4uLi4uLrBAGgEAsSYYERKwHDmwMRG1IwEAEhMiJBc5MDETNBISNjMyFhc3NjYXFxYHBxYVFAIHDgImJwcGJycmJjc3JhcWMzI3NhI3BQYHASYjIgcGFm6e6X1WhRtQFBkfHjYdqgSJf0S6roUtKy0ZKRYDG28GshZrZmJUkAz9+C0MAjUdWHFYbAG8uwFyASXNVC1iFwgOFSIjzzNCtv4GumFsBElQNTUUIRIfI4c+Rqp/dwG6qseVgQK2f3KQAP///8X/8gQFB1QSJgA4AAAQBwBDAS0Bvv///8X/8gQFB1QSJgA4AAAQBwB1AfwBvv///8X/8gQFB0oSJgA4AAAQBwDKAUwBf////8X/8gQFB0gSJgA4AAAQBwBqAKABrv//AJIAAAPoB1QSJgA8AAAQBwB1AZYBvgAC/+UAAAOcBcsAFgAhAIkAshIBACuyAgQAK7MhEgIIK7EPBumxBwIQIMAvsSAG6QGwIi+wHNaxIwErsDYasRYAhw6wFhCwAMCxEBr5sAbAsRAGBwWwB8CwD8CwIMCwIcADALMABhAWLi4uLgG3AAYHDxAWICEuLi4uLi4uLrBAGgCxDxIRErAOObEgIRESsxgXHRwkFzkwMQE2MzMyFgcHMzIWAgYHBiUDBiMjIiY3ATY3NjY1NCcmJwMBSgwxPBgXBhVvprAKXUeW/qJtDDE7GRcHAdGjPh8zjD1zlwWeLSUbTpH+4/lAhQb+Vi0lGgIrCXI0wFZ5BgIC/bAAAAH/zv/fA60GBAA2ALMAsjIDACuxCAjpsCIvsRcI6QGwNy+wHNaxHw3psSkBK7EQEemxJQErsRQP6bE4ASuwNhqxBAWHDrAEELAFwLE1DvmwNMAAswQFNDUuLi4uAbMEBTQ1Li4uLrBAGgGxHxwRErAhObApEbAYObAQErUXIiMnKDIkFzmwJRGxCC45ObAUErUJDRIMLzAkFzkAsSIXERKzNgECACQXObAyEUAODRASFBUcDCAfJygpLi8kFzkwMTMjIiY3ATY2MzIWAgcGBwYUHgIVFAYjIiYnJjQ3NzYHBjMyNjYmJicmNzQ3Njc2NiYiBgcBBjIzGRgEAR8x06J6nBJtYBExQlBBtJ4/XBUnHTc+AglrP10CLUIhUAREQENIGEmMiyX+4g0bFAQ3u+Ow/vR1YBVBZU5Be0yf5DovVpEIERQp0YeaUjsdQlRqWFZEUKponIf7zy0A/////P/0Av4FjBImAEQAABAHAEMA4f/2/////P/0AyQFjBImAEQAABAHAHUBZP/2/////P/0Av4FdxAmAEQAABAGAMp/rP////z/9ANNBVYQJgBEAAAQBgDQy0b////8//QDFQVtEiYARAAAEAYAatHT/////P/0A0YGmRAmAEQAABAHAM7/Lf/fAAP/2f/NBBAEIQAFADEAOQAxAAGwOi+wGNaxJRHpsTYBK7E7ASuxNiUREkAQAgYHCQsMFBodHiEiACsyNyQXOQAwMQEOAjYSFwYWFzY3NhcXFgcGBiYnBgYmAgA3Njc2JwYGBwYnJyY3NjYWFhc2NhYWBgYnPgI0IgYGAbZoywqmaI4PKSVMbhMWJx8MJ+G9GjyqywgBL8kCAhtEGoQYERgvHwwj22NcEkbNmQpc26xijFxia1wCSiPP5wIBBGBMTggcfRMPGBUYSrZSVFpIcwEcATYzCAp9NQZ/JRQQHRQZRrIRXDlkOkb6ssc8KW6ipl7kAP///7z+mwKcBB8QJgBGBgAQBwB5/1IAEv///9T/3QJwBYwSJgBIAAAQBgBDe/b////U/90DCgWMECcAdQFK//YQBgBIAAD////U/90CzAV3ECYAym2sEAYASAAA////1P/dAyEFbRAmAGrd0xAGAEgAAP///9sAAAHBBYwSJgDEDAAQBgBDCvb////PAAACTQWMECcAdQCN//YQBgDEAAD////PAAACIgV3ECYAysOsEAYAxAAAAAP/5QAAAkIFagALABcAJAB0ALIbAQArsiECACuwAC+wDDOxBgrpsBIyAbAlL7AK1rEEE+mxFgErsRAT6bEmASuwNhqxHh+HDrAeELAfwLEZEfmwGMAAsxgZHh8uLi4uAbMYGR4fLi4uLrBAGgGxEBYRErAkOQCxAAYRErMEChAWJBc5MDETMzIWFAYjIyImNDYhMzIWFAYjIyImNDYDAwYjIyI3EzYzMzIW9hAfMTMnDh8vMQEQER8xNCYPHy8yLvcNMTs6DfoKL0QaEwVqPVA5O1A7PVA5O1A7/nv8SC0vA7gpEgAAAv/2/+kDKwYUAAcAMgCqALIWBQArsggCACuzEAgWCCuxCwjpAbAzL7AI1rAAMrEnD+mxNAErsDYasRAdh7AQLg6wHcAFsQsI+Q6wI8CxCyMHsArAsgojCxESObEREBDAshEdEBESObAcwLAcObEkCxDAsiQjCxESOQC1ChEcHSMkLi4uLi4uAbcKCxARHB0jJC4uLi4uLi4usEAaAbEnCBESsgEbKDk5OQCxFggRErMMGx4wJBc5MDEBNiYGAgIWEhMmJwcGJycmNzcmJyY2MzMyFxYWFzc2FxcWBgcHFhIHAgInJicmEhI2FxYB8gYhiaQMi6gdERqyJQoZDBrDFyQJFRhfKxACFwqgHAwbCAwOshQpEBf2vEI3VBeqrGgSAsFmagz+mv5iCAE3AmtmWCUIHzkfCCc5WBUcMwZKHCEEFzMRHAQlUP6sqv7y/ksHAjdUAb4BX40GAgD////wAAADhgVWEiYAUQAAEAYA0ARG////+v/pApoFjBAmAENQ9hAGAFIAAP////r/6QLtBYwQJwB1AS3/9hAGAFIAAP////r/6QK3BW0QJgDKWKIQBgBSAAD////6/+kDCwVIEiYAUgAAEAcA0v99AAD////6/+kDAAVtECYAarzTEAYAUgAA/////ABmA+YExxAmANOmLRAnABEBngQGEAcAEQDPAI0AA/+m/+kEBgQpABwAIwAsAL8AsgYBACuxIwbpshQCACuxFwnpsCUyAbAtL7EuASuwNhqxEBiHDrAQELAYwLEKBvmwAMCxCgAHsAHAsgEAChESObAJwLAJObEREBDAshEYEBESOQWwF8AOsR8KEMCyHwAKERI5sCDAsCA5sSoQEMCyKhgQERI5sCvAsCs5AEALAAEJChARGB8gKisuLi4uLi4uLi4uLgFADAABCQoQERcYHyAqKy4uLi4uLi4uLi4uLrBAGgEAsSMGERKwCzkwMQEHFQIDBicmJicHBicnJiY3NxI3NhcWFzc2FxcWATY3ARYXFhMmJgYHBgcBJgPm4giebLlBYhNcMxccFwQfrg55gcd/M38nIxov/cloH/7DAj08wg5cTCU5GQE5BAOqzwT+0f7+vQcCXkFULRchGh0loAEE5/YEBox1JSEWK/0QpMD+4JgEAgLlKQJYTnKJAR4+AP///98AAAM3BYwQJgBDVPYQBgBYAAD////fAAADNwWMECcAdQFM//YQBgBYAAD////fAAADNwVvECYAynukEAYAWAAA////3wAAAzwFbRAmAGr40xAGAFgAAP///9X+bQNUBYwQJwB1AV7/9hAGAFwKAAAC/3/+ZgLdBhIACQAmAH4AshgBACuyHQAAK7IkBQArAbAnL7EoASuwNhqxISKHDrAhELAiwLEbFvmwCsCxGwoHsAnAsgkKGxESObALwLALObAawLAaOQC2CQoLGhshIi4uLi4uLi4B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/+EAcf/XAAsACv/NAAz/4QAU/9cAFwApABr/zQA3/8MAOf/hADz/zQA//80AQP/hAHH/wwAIAA//1wAR/9cAEv/XABoAHwAk/9cAJwAKAED/4QDf/5oABgAM/+EAN//XADz/4QA//+EAQP/hAHH/1wAIAAz/1wA3/80APP/XAD//4QBA/9cAYP/hAHH/1wDf/7gAAQAa/7gABAAK/9cAN/+4ADz/1wDW/9cAHQAK/80ADf/XABr/1wAn//YAKP/2ADL/4QA1//YANv/XADf/mgA4/+wAOf/NADr/zQA8/64AP//XAED/4QBE//YASf/hAFL/7ABX/+wAWP/2AFn/zQBa/80AXP/2ALH/7ADV/80A1v/NAOT/rgDm/80A6P/DABsADP/DACj/9gA1//YAN//XADv/4QA8/9cAPf/hAED/zQBE/+wARv/2AEj/9gBM/+wAT//sAFH/7ABS/+wAVv/sAFj/7ABb/+EAXP/sAF3/4QBg/9cAoP/sAKf/9gCvAAoAsf/sAOT/zQDo/+wACAAQ/80AMv/sADf/7AA7/+EAPP/sAD3/4QBA/+wArwAUABIADP/XACf/7AAo/+wANf/sADf/uAA5/+wAO//NADz/zQA9/+EAQP/sAEn/9gBb//YAXf/2AGD/7ACH//YA1v/sAOT/4QDo/+wAEwAy//YANv/sAET/7ABG/+EASP/hAEn/7ABR/+wAUv/hAFb/7ABY/+wAXP/sAF3/7ABg/+wAp//hAK0ASACwADMAsf/hAOb/7ADo/+wAIwAP/2YAEf9mABL/zQAU/+wAHf/XAB7/wwAk/7gANv/hAED/7ABE/9cARv/hAEj/4QBJ/+EAUf/XAFL/4QBW/+wAV//sAFj/1wBZ/9cAWv/XAFv/wwBc/9cAXf/DAIf/pACg/+wAp//XAKkACgCtAEgArwAfALAAPQCx/+EA1/9mAN7/7ADm/9cA6P/DABUADP/XACf/7AAo/+wANf/sADf/1wA5/9cAO//NADz/wwA9/9cAQP/hAEn/7ABX//YAWf/sAFr/7ABb/+wAXf/sAGD/7ACn//YA5P/sAOb/7ADo/+EAFQBA/+wARP/hAEb/7ABI/+wASf/2AEz/9gBP//YAUf/hAFL/9gBW//YAWP/hAFn/9gBa//YAXP/hAGD/4QCg/+EAp//2AK0AFACx//YA5v/2AOj/9gAUAED/4QBE/+wARv/2AEj/9gBJ//YATP/2AE//9gBR/+EAUv/sAFb/7ABY/+EAWf/2AFr/9gBc/+EAYP/hAKD/4QCn/+wArf/2ALH/7ADo//YAEwBA/+wARP/sAEb/9gBI//YASf/2AEz/9gBP//YAUf/hAFL/7ABW/+wAWP/hAFn/9gBa//YAXP/hAGD/4QCg/+EAp//sALH/7ADo//YAGAAQ/80AMv/XADb/1wBE/80ARv/hAEj/4QBJ/+EAUv/DAFb/4QBX/+wAWP/hAFn/zQBa/80AXP/hAKX/1wCn/+EArQBSALAAMwCx/80AswAKAN3/4QDkAIUA5v/NAOj/4QAsAAr/mgAN/5oAEP+aABP/zQAU/7gAF/+uABr/1wAn/9cAKP/XADL/rgA1/9cANv+4ADf/MwA4/8MAOf+aADr/mgA8/2YAP/+kAED/1wBE/9cARv/hAEj/4QBJ/80ATP/sAE//7ABR/+EAUv/NAFb/7ABX/9cAWP/hAFn/mgBa/5oAXP/hAG//mgCg/+wAp//hALH/zQC5AFIA1f+aANb/mgDd/80A5P+aAOb/mgDo/9cAFABA/+EARP/sAEb/9gBI//YASf/2AEz/9gBP//YAUf/hAFL/7ABW/+wAWP/hAFn/9gBa//YAXP/hAGD/4QCg/+EAp//sALH/7ADm//YA6P/hABMAQP/hAET/9gBG//YASP/2AEn/9gBM//YAT//2AFH/4QBS/+wAVv/sAFj/4QBZ//YAWv/2AFz/4QBg/+EAoP/2AKf/7ACx/+wA6P/hABIADP/XACf/7AAo/+wANf/sADf/wwA5//YAO//XADz/1wA9/9cAQP/XAEn/7ABS//YAXf/2AGD/4QCH//YAoP/2AOT/4QDo/+wAGwAM/8MAD/+aABH/mgAS/80AJP+aADv/1wA8/80APf/XAED/1wBE/6QARv+uAEj/rgBM/8MAT//DAFH/uABS/8MAVv/NAFj/uABc/7gAXf/NAGD/7ACH/2YAoP/sAKf/zQCv/+wAsf/DANf/mgADAEAAFABNABQAYAAUACEAJ//sACj/7AAy/+wANf/sADf/1wA4/+wAOf/sADr/7AA7/+wAPP/hAD3/7ABA/9cARP/XAEb/4QBI/+EASf/hAEz/4QBP/+MAUf/ZAFL/zwBW/+EAV//sAFj/1wBZ/9cAWv/XAFz/1wCg/+wAp//hALH/1wDd/+wA5P/hAOb/4QDo/80ACQAM/+EANf/2ADf/4QA7/+EAPP/hAD3/4QBA/+EAXf/2AOT/9gBAAAn/zQAN//YAD/+uABD/uAAR/64AEv/NABP/4QAU/9cAF//NABn/zQAaAB8AHf+uAB7/rgAj/8MAJP+aADL/1wA2/+EAQP/hAET/MwBG/zMASP8zAEn/wwBM/+EAT//hAFH/MwBS/zMAVv9mAFf/zQBY/zMAWf8zAFr/MwBb/2YAXP8zAF3/MwCH/5oAoP/hAKH/uACj/3sApP/2AKX/4QCm/+EAp/8zAKv/rgCs/9cArQBSALAASACx/9cAsv/hALMAHwC1/5oAtv/2ALf/9gC6ACkAvP+aAL3/1wDA/9cAw/+4AMn/mgDX/64A3f/NAN7/zQDkAKQA5v8zAOj/MwAUACT/9gBA/+wARP/2AEb/9gBI//YATP/2AE//9gBR/+EAUv/hAFb/7ABX//YAWP/sAFz/4QBd/+wAYP/2AIf/9gCg/+wAp//sALH/4QDo/+EALAANAB8AD//DABD/4QAR/8MAEv/NABf/1wAaAB8AHv/hACT/ZgAy//YAQP/hAET/pABG/64ASP+uAEn/7ABR/8MAUv+4AFb/uABX//YAWP/DAFn/4QBa/+EAW//XAFz/wwBd/+EAh/9mAKD/4QCh/6QApP/XAKX/1wCn/8MAqf/sAK0AXACvAB8AsABIALH/zQCzAB8AtgAUAL3/uADX/8MA3f/hAOQAjwDm/+EA6P/hABgAD//XABH/1wAk/9cAQP/hAET/4QBG/+EASP/hAEz/7ABP/+wAUf/hAFL/1wBW/+EAWP/hAFz/4QBd/+EAh/+4AKD/7ACn/+EArQAUAK8AKQCwABQAsf/XANf/1wDo//YAFgAQ/+EAMv/XADb/4QBE/9cARv/XAEj/1wBJ/+EAUv/DAFb/4QBX/+wAWP/sAFn/zQBa/80AXP/sAKf/7ACp/9cArQApALAACgCx/8MA3f/hAOb/zQDo/+EANAAJ/+EAD/+uABD/1wAR/9cAEv/NABf/zQAZ/9cAHf/sAB7/7AAk/5oAMv/hADb/7ABA/+EARP+aAEb/mgBI/5oASf/hAE//9gBR/7gAUv+aAFb/uABX//YAWP/DAFn/4QBa/+EAW//hAFz/wwBd/80Ah/9mAKD/4QCh/5oApP/XAKX/zQCm/80Ap/+kAKn/7ACs/9cArQBmAK8AHwCwAEgAsf/hALMAFAC2//YAt//2ALoACgC9/8MA1/+uAN3/1wDe/+wA5ACuAOb/4QDo/80AGAANAAoAEP/XABf/1wAy/9cANv/hAET/zQBG/80ASP/NAEn/4QBS/8MAVv/DAFf/7ABY/+EAWf/XAFr/1wBc/+EAp//hAKn/zQCtABQAsf/NALP/7ADd/+EA5v/XAOj/wwAxABP/4QAU/+EAF//hABn/1wAb/+EAHP/hACT/4QAnAAoALP/sAC0AZgAy/+EANv/hADcAFAA4/+EAOf/sADr/7AA7ABQAPAAKAET/4QBG/+EASP/hAEn/4QBNAJoAUf/XAFL/1wBW/9cAV//hAFj/1wBZ/+EAWv/hAFv/4QBc/+EAXf/hAIf/4QCNAJoAjwCaAJAAmgCg/+EAof/hAKT/4QCl/+EApv/hAKf/4QCp/+EAsf/XALP/1wC2/9cAuv/XAL3/1wAMAAr/rgAU/+EAGv/XADL/7AA3/6QAOf/NADr/1wA8/80AWf/hAFr/4QCHAJoA1v+uABYACv/hAA3/4QAa/+wAJ//sACj/7AAy/+wANf/sADf/MwA4//YAOf/NADr/1wA8/5oAP//hAED/7ABZ//YAWv/2AGD/7ADP/YMA1f/hANb/4QDk/80A5v/2AB0ACv/DAAz/1wAN/+EAGv/NACf/zQAo/80ALP/sAC3/7AA1/80AN/8zADj/7AA5/80AOv/XADv/zQA8/5oAPf/XAD//1wBA/+EASf/NAFn/4QBa/+EAW//hAF3/7ABg/+wA1f/DANb/wwDk/8MA5v/hAOj/4QAUAAr/4QAUAAoAGv/XACf/4QAo/+EANf/hADf/MwA5/+EAO//XADz/wwA9/+wAQP/hAET/7ABG/+wASP/sAFL/7ACx/+wA1v/hAN3/4QDk/+EAAQA3/+EAGgAK/80ADP/hAA3/7AAa/80AJ//XACj/1wA1/9cAN/8zADj/7AA5/9cAOv/XADv/1wA8/5oAPf/sAD//4QBA/+EAWf/sAFr/7ABb/+wAYP/sAM/9sADV/80A1v/NAOT/1wDm/+wA6P/sADEABABSAAoAZgAMAJoADQCaAA//4QAQ/+EAEf/hABQASAAWACkAGAAzABoAmgAiAFIAJP/hACcArgAoAJoALAApAC0AHwA1AJoANwCuADgAPQA5AJoAOgA9ADsAmgA8AJoAPQBmAD8AzQBAAGYARP/sAEb/7ABI/+wAUv/sAF8AXABgAJoApAAUAKUAFACmAD0AqQBmAK0A4QCvAD0AsADNALEAFACzAJoAugCaAMYAPQDVAGYA1gBmANf/4QDd//YA5AEzABIACv/hAAz/4QAa/80AJ//XACj/1wAs/+wANf/XADf/HwA4/+EAOf/XADr/1wA7/80APP+uAD3/4QA//+EAQP/XANb/4QDk/9cAFQAK/+EADP/hAA3/4QAa/80AJ//XACj/1wAs/+wANf/XADf/MwA4/+EAOf/XADr/1wA7/80APP+aAD3/7AA//+EAQP/NAGD/7ADV/+EA1v/hAOT/zQACAED/1wCwAAoAAQCwAAoAEQAQ/+EAFAAKACf/4QAo/+EAMv/hADX/4QA2/+EAN/8zADz/1wBE/9cARv/XAEj/1wBS/9cAVv/hAKf/1wCx/9cA3f/sABQACv/hAAz/4QAN/+EAGv/NACf/1wAo/9cANf/XADf/MwA4/+EAOf/XADr/1wA7/80APP+aAD3/7AA//+EAQP/NAGD/7ADV/+EA1v/hAOT/zQAdAAr/1wAM/9cADf/hABr/1wAn/+EAKP/hACz/9gAt//YANf/hADf/MwA4/+wAOf/DADr/1wA7/9cAPP+kAD3/7AA//9cAQP/XAEn/7ABZ//YAWv/2AFv/7ABd//YAYP/sANX/1wDW/9cA5P/DAOb/9gDo/+EAEgAK/+wAGv/NACf/7AAo/+wALP/2AC0AFAA1/+wAN/8zADj/9gA5/9cAOv/sADv/1wA8/64AP//hAED/9gBNADMA1v/sAOT/1wAZAAz/4QANABQAD//DABH/wwAS/+EAFABmABr/4QAi/+wAJP/DACf/9gAo//YANf/2ADf/MwA7/+wAPP/sAD3/rgBA/9cARP/2AEb/9gBI//YAUv/2AGD/4QCn/+wAsf/2ANf/wwAVAAr/zQAM/+EADf/sABr/zQAn/9cAKP/XADX/1wA3/zMAOP/sADn/1wA6/+wAO//XADz/mgA9/+EAP//hAED/4QBb/+wAYP/hANX/zQDW/80A5P/NABcADP/hAA//4QAQ/+EAEf/hABQAPQAk/+EAJ//2ACj/9gA1//YAN//XADn/9gA7/+EAPP/hAD3/zQBA/9cARP/sAEb/9gBI/+wAUv/sAGD/4QCx/+wA1//hAN3/4QASAAr/7AAM/+EAGv/NACf/4QAo/+EANf/hADf/MwA4//YAOf/hADr/7AA7/9cAPP+uAD3/7AA//+EAQP/XAGD/4QDW/+wA5P/XABQADP/XAA//1wAR/9cAGv/NACT/7AAn/+EAKP/hACz/4QAt/+EANf/hADf/MwA4//YAOf/sADv/wwA8/7gAPf+4AED/1wBg/+EA1//XAOT/7AAVAAz/1wAP/9cAEf/XABr/zQAk/9cAJ//hACj/4QAs/+EALf/hADX/4QA3/zMAOP/2ADn/7AA6/+wAO//DADz/uAA9/7gAQP/XAGD/4QDX/9cA5P/sABIAGv/hACf/7AAo/+wANf/sADb/4QA3/zMAOP/2ADn/9gA8/80ARP/hAEb/4QBI/+EAUv/hAFb/7ACn/+EAsf/hAN3/7ADk/+wAEQAM/+EAGv/NACf/1wAo/9cALP/sADX/1wA3/x8AOP/hADn/1wA6/9cAO//NADz/rgA9/+EAP//hAED/1wDW/+EA5P/XABQAEP/sABr/9gAn/+wAKP/sADX/7AA3/zMAOP/sADn/7AA6//YAO//2ADz/wwA//+wAQP/hAEb/7ABI/+wAUv/sAGD/4QCx/+wA3f/sAOT/4QAqABP/4QAX//YAGf/sACT/4QAnAAoALP/sAC0AmgAy/+EANv/hADcACgA4/+EAOQAKADr/7AA7ABQAPAAKAET/4QBG/+EASP/hAE0AzQBR/+EAUv/hAFMACgBW/+EAV//sAFj/4QBZ/+EAWv/hAFv/4QBc/+EAXf/hAIf/7ACNAJoAjwCaAJAAmgCh/+EAp//hAKn/4QCz/+EAuv/hAL3/4QC/ABQAxwAzAAIATQAUAK0AHwABALAAPQAEAAr/4QA3/7gAPP/sANb/4QABABf/4QABAGAAHwAHAAoAFAAMABQAPwApAEAAKQBgACkA1gAUAOQAmgAGAAoAFAAMABQAQAApAGAAKQDWABQA5ACaAAEA5ADDABcADP/XAA//mgAR/5oAEv/hACT/wwAn/+wAKP/sADX/7AA3/80AO//NADz/1wA9/8MAQP/XAET/9gBG//YASP/2AEz/9gBR//YAXf/sAGD/4QCH/5oA1/+aAOT/4QAQAAr/1wAM/+EADf/sABD/4QA//9cAQP/sAEn/4QBZ/+EAWv/hAFsAHwBg/+wA1f/hANb/4QDk/+wA5v/hAOj/4QAFAAr/9gBg/+wAsAAzANb/9gDkAHEAAQANACkAAgANAHsA5ABSAAUACgAUAA0AUgA/AD0A1gA9AOQAjwAFAAoAKQANAHsAIgAUANUAPQDWAD0ABwAKACkADQBmACIAPQA/AD0A1QBSANYAPQDkAI8ACgBA/+EASf/sAFf/9gBZ//YAWv/2AFv/7ABd//YAYP/sAOb/9gDo/8MABAAK/+wADP/XAA0AKQBg//YAAQAM/9cAAQDkAFIAAwAK//YA1f/2AOQAPQAOAA//MwAR/zMAJP/NAET/4QBG/+EASP/hAFL/4QBW/+wAh/+uAKf/4wCtAAoArwAKALAACgCx/+EAHAAP/zMAEP+aABH/MwAS/80AI//hACT/zQA7ABQARP/hAEb/4QBI/+EAUf/hAFL/4QBW/9cAWP/hAFz/4QBd/+EAh/+aAI8ACgCQAAoApf/hAKf/wwCp/+EAs//hALr/4QC9/+EA1/8zAN3/mgDe/8MADQAK/s0AMv/hADf/rgA4/+wAOf/XADr/1wA8/8MATQAUAFL/7ABZ/9cAWv/XALH/7ADW/s0ABAAK/80AN/+kADz/1wDW/80ACwAK/5oAJ//2ADf/pAA5/+EAO//hADz/wwBZ/+wAWv/sAFv/7ABd/+wA1v+aAAYAFP/DABX/wwAW/8MAF/9mABj/wwAZ/5oADgAk/+EAJwDNADcAzQA5ALgAOwCkADwApABaAGYAh//DAI8AmgCpAJoArQEAAK8AzQCwAM0AswDNAAMAFP/XABX/1wAa/64AAgC5ACkA6P/sAAAAAQAAAAoAJAAyAAIgICAgAA5sYXRuAA4ABAAAAAD//wABAAAAAXRpdGwACAAAAAEAAAABAAQAAQAAAAEACAACAAwAAwDoAOkA5gABAAMAVQBYAFw=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
