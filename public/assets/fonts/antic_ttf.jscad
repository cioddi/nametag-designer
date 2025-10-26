(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.antic_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AK//8QCw/+oAsf/xALL/8QCz//EAtP/xALX/8QC4//EAuf/xALr/8QC7//EAvP/xAL3/6gC+//EAv//qAMD/8gDB//EAwv/jAHYABP/gAAv/4AAM/+AAFP/gACT/3AAl//sAJv/qACf/+wAo//sAKf/7ACr/6gAr//sALP/7AC3/+wAu//sAL//7ADD/+wAx//sAMv/qADP/+wA0/+oANf/7ADb/8QA4//YAPP/2AD7/4ABA/+AARP/gAEX/4ABG/+cAR//nAEj/5wBJ/+AAS//gAEz/4ABN/+AATv/gAE//4ABQ/+AAUf/gAFL/zABT/+AAVP/nAFX/4ABW/+AAV//gAFj/4ABc/9sAX//gAGL/4ABj/+cAZv/gAHT/4AB//9wAgP/cAIH/3ACC/9wAg//cAIT/3ACF/9wAhv/qAIf/+wCI//sAif/7AIr/+wCL//sAjP/7AI3/+wCO//sAkP/7AJH/6gCS/+oAk//qAJT/6gCV/+oAl//rAJj/9gCZ//YAmv/2AJv/9gCc//YAnf/7AJ7/4ACf/+AAoP/gAKH/4ACi/+AAo//gAKT/4ACl/+IApv/nAKf/5wCo/+cAqf/nAKr/5wCr/+AArP/gAK3/4ACu/+AAr//MALD/4ACx/8wAsv/MALP/zAC0/8wAtf/MALf/vQC4/+AAuf/gALr/4AC7/+AAvP/bAL3/4AC+/9sAv//gAMD/6gDB/8wAwv/2AAMAWv/bAF3/9gCX/+wAAgA5//EAWv/YAAQACv/qADn/1QCX//YAy//LAHgABP/YAAv/2AAM/9gAFP/YACT/1QAl/+UAJv/nACf/5QAo/+UAKf/lACr/5wAr/+UALP/lAC3/5QAu/+UAL//lADD/5QAx/+UAMv/nADP/5QA0/+cANf/lADb/8QA3//EAOP/nADz/4wA9/+MAPv/YAED/2ABE/8oARf/YAEb/pwBH/6cASP+nAEn/2ABK/9AAS//YAEz/2ABN/9gATv/YAE//2ABQ/9gAUf/YAFL/ugBT/9gAVP+nAFX/2ABW/8kAV//WAFj/1gBZ//MAWv/iAFz/3gBf/9gAYv/YAGP/pwBm/9gAdP/YAH//1QCA/9UAgf/VAIL/1QCD/9UAhP/VAIX/1QCG/+cAh//lAIj/5QCJ/+UAiv/lAIv/5QCM/+UAjf/lAI7/5QCQ/+UAkf/nAJL/5wCT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/+sAKf/rACv/6wAs/+sALf/rAC7/6wAv/+sAMP/rADH/6wAz/+sANf/rADn/6gCH/+sAiP/rAIn/6wCK/+sAi//rAIz/6wCN/+sAjv/rAJD/6wCd/+sABQA5//EAO//0AD3/8QBa/9EAXf/nAD8AJP/cACX/6gAm/+oAJ//qACj/6gAp/+oAKv/qACv/6gAs/+oALf/qAC7/6gAv/+oAMP/qADH/6gAy/+oAM//qADT/6gA1/+oAOf/cADz/1QBE/9YARv/cAEf/3ABI/9wAVP/cAGP/3AB//9wAgP/cAIH/3ACC/9wAg//cAIT/3ACF/9wAhv/qAIf/6gCI/+oAif/qAIr/6gCL/+oAjP/qAI3/6gCO/+oAkP/qAJH/6gCS/+oAk//qAJT/6gCV/+oAnP/VAJ3/6gCf/9YAoP/WAKH/1gCi/9YAo//WAKT/1gCm/9wAp//cAKj/3ACp/9wAqv/cAMD/6gDC/9UAAQAK//EABgAK/8oAIv/jAEf/7ABa/+cApf/nAMv/1gACAFr/xQBd/+IAAwBa/9MAXf/jAKX/6gADAFr/+wBd/+wAy//jAAwACv/qABP/pgAV/5MAFv98ABf/hAAY/7cAGf+pABr/sAAb/6EAHP+xAF3/6ADL//IAAwBa/+oAXf/xAMv/6wADADn/+wBa/7oAy//qAAEAOAAEAAAAFwBqAfADMgRkBZYGyAf6CSwKXg4gEdIVlBjeGmweDh8UIS4hwCKCJHwlTiX4Jg4AAQAXAAoAEwAVABYAGAAZABsAHAAlACkAMwA5ADsAPQBaAF0AhQCXAJ0AngCvAMAAywBhAAT/8QAL//EADP/xABT/8QAk/9UAJf/5ACb/wwAn//kAKP/5ACn/+QAq/8MAK//5ACz/+QAt//kALv/5AC//+QAw//kAMf/5ADL/wwAz//kANP/DADX/+QA2/+wAPv/xAED/8QBE/8MARf/xAEb/rQBH/60ASP+tAEn/8QBL//EATP/xAE3/8QBO//EAT//xAFD/8QBR//EAUv/cAFP/8QBU/60AVf/xAF//8QBi//EAY/+tAGb/8QB0//EAf//VAID/1QCB/9UAgv/VAIP/1QCE/9UAhf/VAIb/wwCH//kAiP/5AIn/+QCK//kAi//5AIz/+QCN//kAjv/5AJD/+QCR/8MAkv/DAJP/wwCU/8MAlf/DAJ3/+QCe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/+oAYv/qAGP/5wBj/+cAZv/qAGb/6gB0/+oAdP/qAH//8QB///EAgP/xAID/8QCB//EAgf/xAIL/8QCC//EAg//xAIP/8QCE//EAhP/xAIX/8QCF//EAhv/yAIb/8gCH//kAh//5AIj/+QCI//kAif/5AIn/+QCK//kAiv/5AIv/+QCL//kAjP/5AIz/+QCN//kAjf/5AI7/+QCO//kAkP/5AJD/+QCR//IAkf/yAJL/8gCS//IAk//yAJP/8gCU//IAlP/yAJX/8gCV//IAmP/7AJj/+wCZ//sAmf/7AJr/+wCa//sAm//7AJv/+wCc/+MAnP/jAJ3/+QCd//kAnv/qAJ7/6gCf/+8An//vAKD/7wCg/+8Aof/vAKH/7wCi/+8Aov/vAKP/7wCj/+8ApP/vAKT/7wCm/+cApv/nAKf/5wCn/+cAqP/nAKj/5wCp/+cAqf/nAKr/5wCq/+cAq//qAKv/6gCs/+oArP/qAK3/6gCt/+oArv/qAK7/6gCv//EAr//xALD/6gCw/+oAsf/xALH/8QCy//EAsv/xALP/8QCz//EAtP/xALT/8QC1//EAtf/xALj/8QC4//EAuf/xALn/8QC6//EAuv/xALv/8QC7//EAvP/xALz/8QC9/+oAvf/qAL7/8QC+//EAv//qAL//6gDA//IAwP/yAMH/8QDB//EAwv/jAML/4wDsAAT/4AAE/+AAC//gAAv/4AAM/+AADP/gABT/4AAU/+AAJP/cACT/3AAl//sAJf/7ACb/6gAm/+oAJ//7ACf/+wAo//sAKP/7ACn/+wAp//sAKv/qACr/6gAr//sAK//7ACz/+wAs//sALf/7AC3/+wAu//sALv/7AC//+wAv//sAMP/7ADD/+wAx//sAMf/7ADL/6gAy/+oAM//7ADP/+wA0/+oANP/qADX/+wA1//sANv/xADb/8QA4//YAOP/2ADz/9gA8//YAPv/gAD7/4ABA/+AAQP/gAET/4ABE/+AARf/gAEX/4ABG/+cARv/nAEf/5wBH/+cASP/nAEj/5wBJ/+AASf/gAEv/4ABL/+AATP/gAEz/4ABN/+AATf/gAE7/4ABO/+AAT//gAE//4ABQ/+AAUP/gAFH/4ABR/+AAUv/MAFL/zABT/+AAU//gAFT/5wBU/+cAVf/gAFX/4ABW/+AAVv/gAFf/4ABX/+AAWP/gAFj/4ABc/9sAXP/bAF//4ABf/+AAYv/gAGL/4ABj/+cAY//nAGb/4ABm/+AAdP/gAHT/4AB//9wAf//cAID/3ACA/9wAgf/cAIH/3ACC/9wAgv/cAIP/3ACD/9wAhP/cAIT/3ACF/9wAhf/cAIb/6gCG/+oAh//7AIf/+wCI//sAiP/7AIn/+wCJ//sAiv/7AIr/+wCL//sAi//7AIz/+wCM//sAjf/7AI3/+wCO//sAjv/7AJD/+wCQ//sAkf/qAJH/6gCS/+oAkv/qAJP/6gCT/+oAlP/qAJT/6gCV/+oAlf/qAJf/6wCX/+sAmP/2AJj/9gCZ//YAmf/2AJr/9gCa//YAm//2AJv/9gCc//YAnP/2AJ3/+wCd//sAnv/gAJ7/4ACf/+AAn//gAKD/4ACg/+AAof/gAKH/4ACi/+AAov/gAKP/4ACj/+AApP/gAKT/4ACl/+IApf/iAKb/5wCm/+cAp//nAKf/5wCo/+cAqP/nAKn/5wCp/+cAqv/nAKr/5wCr/+AAq//gAKz/4ACs/+AArf/gAK3/4ACu/+AArv/gAK//zACv/8wAsP/gALD/4ACx/8wAsf/MALL/zACy/8wAs//MALP/zAC0/8wAtP/MALX/zAC1/8wAt/+9ALf/vQC4/+AAuP/gALn/4AC5/+AAuv/gALr/4AC7/+AAu//gALz/2wC8/9sAvf/gAL3/4AC+/9sAvv/bAL//4AC//+AAwP/qAMD/6gDB/8wAwf/MAML/9gDC//YA8AAE/9gABP/YAAv/2AAL/9gADP/YAAz/2AAU/9gAFP/YACT/1QAk/9UAJf/lACX/5QAm/+cAJv/nACf/5QAn/+UAKP/lACj/5QAp/+UAKf/lACr/5wAq/+cAK//lACv/5QAs/+UALP/lAC3/5QAt/+UALv/lAC7/5QAv/+UAL//lADD/5QAw/+UAMf/lADH/5QAy/+cAMv/nADP/5QAz/+UANP/nADT/5wA1/+UANf/lADb/8QA2//EAN//xADf/8QA4/+cAOP/nADz/4wA8/+MAPf/jAD3/4wA+/9gAPv/YAED/2ABA/9gARP/KAET/ygBF/9gARf/YAEb/pwBG/6cAR/+nAEf/pwBI/6cASP+nAEn/2ABJ/9gASv/QAEr/0ABL/9gAS//YAEz/2ABM/9gATf/YAE3/2ABO/9gATv/YAE//2ABP/9gAUP/YAFD/2ABR/9gAUf/YAFL/ugBS/7oAU//YAFP/2ABU/6cAVP+nAFX/2ABV/9gAVv/JAFb/yQBX/9YAV//WAFj/1gBY/9YAWf/zAFn/8wBa/+IAWv/iAFz/3gBc/94AX//YAF//2ABi/9gAYv/YAGP/pwBj/6cAZv/YAGb/2AB0/9gAdP/YAH//1QB//9UAgP/VAID/1QCB/9UAgf/VAIL/1QCC/9UAg//VAIP/1QCE/9UAhP/VAIX/1QCF/9UAhv/nAIb/5wCH/+UAh//lAIj/5QCI/+UAif/lAIn/5QCK/+UAiv/lAIv/5QCL/+UAjP/lAIz/5QCN/+UAjf/lAI7/5QCO/+UAkP/lAJD/5QCR/+cAkf/nAJL/5wCS/+cAk//nAJP/5wCU/+cAlP/nAJX/5wCV/+cAmP/nAJj/5wCZ/+cAmf/nAJr/5wCa/+cAm//nAJv/5wCc/+MAnP/jAJ3/5QCd/+UAnv/YAJ7/2ACf/8oAn//KAKD/ygCg/8oAof/KAKH/ygCi/8oAov/KAKP/ygCj/8oApP/KAKT/ygCm/6cApv+nAKf/pwCn/6cAqP+nAKj/pwCp/6cAqf+nAKr/pwCq/6cAq//YAKv/2ACs/9gArP/YAK3/2ACt/9gArv/YAK7/2ACv/7oAr/+6ALD/2ACw/9gAsf+6ALH/ugCy/7oAsv+6ALP/ugCz/7oAtP+6ALT/ugC1/7oAtf+6ALj/1gC4/9YAuf/WALn/1gC6/9YAuv/WALv/1gC7/9YAvP/eALz/3gC9/9gAvf/YAL7/3gC+/94Av//YAL//2ADA/+cAwP/nAMH/ugDB/7oAwv/jAML/4wDSAAT/1gAE/9YAC//WAAv/1gAM/9YADP/WABT/1gAU/9YAJP+rACT/qwAl//YAJf/2ACb/4wAm/+MAJ//2ACf/9gAo//YAKP/2ACn/9gAp//YAKv/jACr/4wAr//YAK//2ACz/9gAs//YALf/2AC3/9gAu//YALv/2AC//9gAv//YAMP/2ADD/9gAx//YAMf/2ADL/4wAy/+MAM//2ADP/9gA0/+MANP/jADX/9gA1//YANv/xADb/8QA4//gAOP/4AD7/1gA+/9YAQP/WAED/1gBE/60ARP+tAEX/1gBF/9YARv+LAEb/iwBH/4sAR/+LAEj/iwBI/4sASf/WAEn/1gBL/9YAS//WAEz/1gBM/9YATf/WAE3/1gBO/9YATv/WAE//1gBP/9YAUP/WAFD/1gBR/9YAUf/WAFL/nwBS/58AU//WAFP/1gBU/4sAVP+LAFX/1gBV/9YAVv+tAFb/rQBf/9YAX//WAGL/1gBi/9YAY/+LAGP/iwBm/9YAZv/WAHT/1gB0/9YAf/+rAH//qwCA/6sAgP+rAIH/qwCB/6sAgv+rAIL/qwCD/6sAg/+rAIT/qwCE/6sAhf+rAIX/qwCG/+MAhv/jAIf/9gCH//YAiP/2AIj/9gCJ//YAif/2AIr/9gCK//YAi//2AIv/9gCM//YAjP/2AI3/9gCN//YAjv/2AI7/9gCQ//YAkP/2AJH/4wCR/+MAkv/jAJL/4wCT/+MAk//jAJT/4wCU/+MAlf/jAJX/4wCY//gAmP/4AJn/+ACZ//gAmv/4AJr/+ACb//gAm//4AJ3/9gCd//YAnv/WAJ7/1gCf/60An/+tAKD/rQCg/60Aof+tAKH/rQCi/60Aov+tAKP/rQCj/60ApP+tAKT/rQCl/64Apf+uAKb/iwCm/4sAp/+LAKf/iwCo/4sAqP+LAKn/iwCp/4sAqv+LAKr/iwCr/9YAq//WAKz/1gCs/9YArf/WAK3/1gCu/9YArv/WAK//nwCv/58AsP/WALD/1gCx/58Asf+fALL/nwCy/58As/+fALP/nwC0/58AtP+fALX/nwC1/58At/+eALf/ngC9/9YAvf/WAL//1gC//9YAwP/jAMD/4wDB/58Awf+fAGMABP/YAAv/2AAM/9gAFP/YACX/9gAm/+MAJ//2ACj/9gAp//YAKv/jACv/9gAs//YALf/2AC7/9gAv//YAMP/2ADH/9gAy/+MAM//2ADT/4wA1//YAOP/xADz/9gA+/9gAQP/YAET/5wBF/9gARv/PAEf/zwBI/88ASf/YAEv/2ABM/9gATf/YAE7/2ABP/9gAUP/YAFH/2ABS/70AU//YAFT/zwBV/9gAXP/AAF//2ABi/9gAY//PAGb/2AB0/9gAhv/jAIf/9gCI//YAif/2AIr/9gCL//YAjP/2AI3/9gCO//YAkP/2AJH/4wCS/+MAk//jAJT/4wCV/+MAmP/xAJn/8QCa//EAm//xAJz/9gCd//YAnv/YAJ//5wCg/+cAof/nAKL/5wCj/+cApP/nAKb/zwCn/88AqP/PAKn/zwCq/88Aq//YAKz/2ACt/9gArv/YAK//vQCw/9gAsf+9ALL/vQCz/70AtP+9ALX/vQC8/8AAvf/YAL7/wAC//9gAwP/jAMH/vQDC//YA6AAE//YABP/2AAv/9gAL//YADP/2AAz/9gAU//YAFP/2ACT/+wAk//sAJf/xACX/8QAm/9wAJv/cACf/8QAn//EAKP/xACj/8QAp//EAKf/xACr/3AAq/9wAK//xACv/8QAs//EALP/xAC3/8QAt//EALv/xAC7/8QAv//EAL//xADD/8QAw//EAMf/xADH/8QAy/9wAMv/cADP/8QAz//EANP/cADT/3AA1//EANf/xADf/8QA3//EAOP/jADj/4wA6/+wAOv/sADz/6gA8/+oAPv/2AD7/9gBA//YAQP/2AET/+ABE//gARf/2AEX/9gBG/9AARv/QAEf/0ABH/9AASP/QAEj/0ABJ//YASf/2AEv/9gBL//YATP/2AEz/9gBN//YATf/2AE7/9gBO//YAT//2AE//9gBQ//YAUP/2AFH/9gBR//YAUv/PAFL/zwBT//YAU//2AFT/0ABU/9AAVf/2AFX/9gBX/+wAV//sAFj/7ABY/+wAWv/MAFr/zABc/9YAXP/WAF//9gBf//YAYv/2AGL/9gBj/9AAY//QAGb/9gBm//YAdP/2AHT/9gB///sAf//7AID/+wCA//sAgf/7AIH/+wCC//sAgv/7AIP/+wCD//sAhP/7AIT/+wCF//sAhf/7AIb/3ACG/9wAh//xAIf/8QCI//EAiP/xAIn/8QCJ//EAiv/xAIr/8QCL//EAi//xAIz/8QCM//EAjf/xAI3/8QCO//EAjv/xAJD/8QCQ//EAkf/cAJH/3ACS/9wAkv/cAJP/3ACT/9wAlP/cAJT/3ACV/9wAlf/cAJj/4wCY/+MAmf/jAJn/4wCa/+MAmv/jAJv/4wCb/+MAnP/qAJz/6gCd//EAnf/xAJ7/9gCe//YAn//4AJ//+ACg//gAoP/4AKH/+ACh//gAov/4AKL/+ACj//gAo//4AKT/+ACk//gApv/QAKb/0ACn/9AAp//QAKj/0ACo/9AAqf/QAKn/0ACq/9AAqv/QAKv/9gCr//YArP/2AKz/9gCt//YArf/2AK7/9gCu//YAr//PAK//zwCw//YAsP/2ALH/zwCx/88Asv/PALL/zwCz/88As//PALT/zwC0/88Atf/PALX/zwC4/+wAuP/sALn/7AC5/+wAuv/sALr/7AC7/+wAu//sALz/1gC8/9YAvf/2AL3/9gC+/9YAvv/WAL//9gC///YAwP/cAMD/3ADB/88Awf/PAML/6gDC/+oAQQAE/88AC//PAAz/zwAU/88APv/PAED/zwBE/+MARf/PAEb/vwBH/78ASP+/AEn/zwBK/+IAS//PAEz/zwBN/88ATv/PAE//zwBQ/88AUf/PAFL/wgBT/88AVP+/AFX/zwBW//AAV//qAFj/6gBc/+gAX//PAGL/zwBj/78AZv/PAHT/zwCe/88An//jAKD/4wCh/+MAov/jAKP/4wCk/+MApv+/AKf/vwCo/78Aqf+/AKr/vwCr/88ArP/PAK3/zwCu/88Ar//CALD/zwCx/8IAsv/CALP/wgC0/8IAtf/CALj/6gC5/+oAuv/qALv/6gC8/+gAvf/PAL7/6AC//88Awf/CAIYABP/oAAT/6AAL/+gAC//oAAz/6AAM/+gAFP/oABT/6AA6/9wAOv/cAD7/6AA+/+gAQP/oAED/6ABE//IARP/yAEX/6ABF/+gARv/UAEb/1ABH/9QAR//UAEj/1ABI/9QASf/oAEn/6ABL/+gAS//oAEz/6ABM/+gATf/oAE3/6ABO/+gATv/oAE//6ABP/+gAUP/oAFD/6ABR/+gAUf/oAFL/4wBS/+MAU//oAFP/6ABU/9QAVP/UAFX/6ABV/+gAVv/5AFb/+QBX/+gAV//oAFj/6ABY/+gAWv/xAFr/8QBc/+MAXP/jAF3/+QBd//kAX//oAF//6ABi/+gAYv/oAGP/1ABj/9QAZv/oAGb/6AB0/+gAdP/oAJ7/6ACe/+gAn//yAJ//8gCg//IAoP/yAKH/8gCh//IAov/yAKL/8gCj//IAo//yAKT/8gCk//IApv/UAKb/1ACn/9QAp//UAKj/1ACo/9QAqf/UAKn/1ACq/9QAqv/UAKv/6ACr/+gArP/oAKz/6ACt/+gArf/oAK7/6ACu/+gAr//jAK//4wCw/+gAsP/oALH/4wCx/+MAsv/jALL/4wCz/+MAs//jALT/4wC0/+MAtf/jALX/4wC4/+gAuP/oALn/6AC5/+gAuv/oALr/6AC7/+gAu//oALz/4wC8/+MAvf/oAL3/6AC+/+MAvv/jAL//6AC//+gAwf/jAMH/4wAkACX/+wAm//EAJ//7ACj/+wAp//sAKv/xACv/+wAs//sALf/7AC7/+wAv//sAMP/7ADH/+wAy//EAM//7ADT/8QA1//sAN//xAIb/8QCH//sAiP/7AIn/+wCK//sAi//7AIz/+wCN//sAjv/7AI//7ACQ//sAkf/xAJL/8QCT//EAlP/xAJX/8QCd//sAwP/xADAAJf/rACX/6wAn/+sAJ//rACj/6wAo/+sAKf/rACn/6wAr/+sAK//rACz/6wAs/+sALf/rAC3/6wAu/+sALv/rAC//6wAv/+sAMP/rADD/6wAx/+sAMf/rADP/6wAz/+sANf/rADX/6wA5/+oAOf/qAIf/6wCH/+sAiP/rAIj/6wCJ/+sAif/rAIr/6wCK/+sAi//rAIv/6wCM/+sAjP/rAI3/6wCN/+sAjv/rAI7/6wCQ/+sAkP/rAJ3/6wCd/+sAfgAk/9wAJP/cACX/6gAl/+oAJv/qACb/6gAn/+oAJ//qACj/6gAo/+oAKf/qACn/6gAq/+oAKv/qACv/6gAr/+oALP/qACz/6gAt/+oALf/qAC7/6gAu/+oAL//qAC//6gAw/+oAMP/qADH/6gAx/+oAMv/qADL/6gAz/+oAM//qADT/6gA0/+oANf/qADX/6gA5/9wAOf/cADz/1QA8/9UARP/WAET/1gBG/9wARv/cAEf/3ABH/9wASP/cAEj/3ABU/9wAVP/cAGP/3ABj/9wAf//cAH//3ACA/9wAgP/cAIH/3ACB/9wAgv/cAIL/3ACD/9wAg//cAIT/3ACE/9wAhf/cAIX/3ACG/+oAhv/qAIf/6gCH/+oAiP/qAIj/6gCJ/+oAif/qAIr/6gCK/+oAi//qAIv/6gCM/+oAjP/qAI3/6gCN/+oAjv/qAI7/6gCQ/+oAkP/qAJH/6gCR/+oAkv/qAJL/6gCT/+oAk//qAJT/6gCU/+oAlf/qAJX/6gCc/9UAnP/VAJ3/6gCd/+oAn//WAJ//1gCg/9YAoP/WAKH/1gCh/9YAov/WAKL/1gCj/9YAo//WAKT/1gCk/9YApv/cAKb/3ACn/9wAp//cAKj/3ACo/9wAqf/cAKn/3ACq/9wAqv/cAMD/6gDA/+oAwv/VAML/1QA0AAT/2AAL/9gADP/YABT/2AA+/9gAQP/YAET/4gBF/9gARv/FAEf/xQBI/8UASf/Y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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
