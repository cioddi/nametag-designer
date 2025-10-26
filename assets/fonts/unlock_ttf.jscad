(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.unlock_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ATQAPADu/+8COgAbAbYADwI6ACQCOgA2AjoACAI6ADwCOgAoAjoALQI6ACgCOgAoATQAPAE0ADwCHAA8AhwAPAIcADwBvgAKAxMALQJa/+cCjgAeAk4AFAKiAB4COwAeAiIAHgJsABQC2AAeAX0AJwFf//8CnwAeAhMAHgNNAB4C1wAeAmwAFAKdAB4CbAAUAqQAHgIrAA8CQwAFAogACgKMAAADuwAAAoAAAAJyAAACLf/7ATQAUADu/+8BNAAUAhwAKQHmABgBNwAAAmoAIwKgAC0CKwA8ApwAPAJRADwBaAAtAk0AFAK0AC0BYwAtAWgADgKCACgBYwAtA8kALQK0AC0ChwA8ApwAKAKbADwBhwAtAjoAMgGGACgCtAAoAlYAFANXABQCWwAZAlYAFAI0AA8BNAAAAP4AZAE0ABQCHAA8AWMAPwIjADwCPwApAj8AIAI3ABUA/gBkAlUAHgGwADICEAAUAW8AHwHoAA8CHAA8AhAAFAF0ACgBbAAjAhwAPAF9ABsBgAAjATcAMwK0AFACYgAyATQAPAD5AA0BFgAAAWoAHgHoABQDoAA/A6AAPwOgADwBzQAcAkb/3QJG/90CRv/dAkb/3QJG/90CRv/dA3b/5wJOABQCTwAeAk8AHgJPAB4CTwAeAacAPAGnADwBpwAtAacALQKiABsC1wAeAmwAFAJsABQCbAAUAmwAFAJsABQCHABNAmwAFAKIAAoCiAAKAogACgKIAAoCcgAAAp0AHgKLAC0CagAjAmoAIwJqACMCagAjAmoAIwJqACMDewAjAisAPAJRADwCUQA8AlEAPAJRADwBYwAtAWMALQFjAAwBY//9AocAPAJuAAoChwA8AocAPAKHADwChwA8AocAPAIcADwChwA8ArQAKAK0ACgCtAAoArQAKAJWABQCnAAoAlYAFAFjAC0CEwARAWMABQNyABQDogA8AisADwI6ADICcgAAAksAAAI0AA8CPwApAZIAIwGSACMBkgAhATAANwFsADwA+QAXAZMAGQHvABQC5AAeAmAAHgNwAB4BBwAeAQcALQE0ADwB9QAeAfUALQIiADwB3gAZAd4AGQFjADwDnAA8BJkAKAEBAA8BAQAUAO4AFAGmACkBFgAAAX0AGwGAACMBcwAAAkAAFAMVAB4CbAAUAocAJAKaAEYC5AAeAikAHgIcADwCjAAeA14AMgGL//UCHAA8AhwAPAIcADwCHAA8AnIAMgLLAC0ALQAAAAEAAANp/z0AAASZ/93/nARxAAEAAAAAAAAAAAAAAAAAAAD6AAICBQGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAAAAAAAAAAAgAAAr0AAIEsAAAAAAAAAAHB5cnMAQAAg+wIDaf89AAADaQDDIAAAAQAAAAACJgJ7AAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABAFAAAAATABAAAUADAB+AKwA/wExAUIBUwFhAXgBfgGSAscC3QPAIBQgGiAeICIgJiAwIDogRCCEIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvsC//8AAAAgAKEArgExAUEBUgFgAXgBfQGSAsYC2APAIBMgGCAcICAgJiAwIDkgRCCAIKwhIiEmIgIiBiIPIhEiGiIeIisiSCJgImQlyvsB////4//B/8D/j/+A/3H/Zf9P/0v/OP4F/fX9E+DB4L7gveC84LngsOCo4J/gZOA938jfxd7q3ufe397e3tfe1N7I3qzeld6S2y4F+AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBI0AAAAADgCuAAMAAQQJAAAAuAAAAAMAAQQJAAEADAC4AAMAAQQJAAIADgDEAAMAAQQJAAMAVgDSAAMAAQQJAAQAHAEoAAMAAQQJAAUAGgFEAAMAAQQJAAYAHAFeAAMAAQQJAAcAYgF6AAMAAQQJAAgALgHcAAMAAQQJAAkALgHcAAMAAQQJAAsALAIKAAMAAQQJAAwALAIKAAMAAQQJAA0BIAI2AAMAAQQJAA4ANANWAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABFAGQAdQBhAHIAZABvACAAVAB1AG4AbgBpACAAKABoAHQAdABwADoALwAvAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AC4AYQByACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIAVQBuAGwAbwBjAGsAIgBVAG4AbABvAGMAawBSAGUAZwB1AGwAYQByAEUAZAB1AGEAcgBkAG8AUgBvAGQAcgBpAGcAdQBlAHoAVAB1AG4AbgBpADoAIABVAG4AbABvAGMAawAgAFIAZQBnAHUAbABhAHIAOgAgADIAMAAxADEAVQBuAGwAbwBjAGsAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAVQBuAGwAbwBjAGsALQBSAGUAZwB1AGwAYQByAFUAbgBsAG8AYwBrACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAARQBkAHUAYQByAGQAbwAgAFIAbwBkAHIAaQBnAHUAZQB6ACAAVAB1AG4AbgBpAC4ARQBkAHUAYQByAGQAbwAgAFIAbwBkAHIAaQBnAHUAZQB6ACAAVAB1AG4AbgBpAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA+wAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXAOIA4wCwALEA5ADlALsA5gDnAKYA2ADhANsA3ADdAOAA2QDfAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAECAQMBBAEFAQYBBwCMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDAAMEMemVyb2luZmVyaW9yC29uZWluZmVyaW9yC3R3b2luZmVyaW9yDXRocmVlaW5mZXJpb3IMZm91cmluZmVyaW9yBEV1cm8AAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQD6AAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAHAAEAAAACQAyADgAfgCIAOIA4gD4AQYBFAABAAkADwAuAC8ANwA5ADoAPABJAMEAAQA3/8kAEQBG/90AR//dAEj/3QBS/90AVP/dAKf/3QCo/90Aqf/dAKr/3QCr/90Asv/dALP/3QC0/90Atf/dALb/3QC4/90AxP/dAAIACv+1ADf/sAAWAA//yQAR/8kARv/sAEf/7ABI/+wAUv/sAFT/7ACn/+wAqP/sAKn/7ACq/+wAq//sALL/7ACz/+wAtP/sALX/7AC2/+wAuP/sAMT/7ADY/8kA2//JAN//yQAFAA//xAAR/8QA2P/EANv/xADf/8QAAwAR/8kARP/iAEf/zgADAAwANwBAADcAYAA3AAEAN/+wAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
