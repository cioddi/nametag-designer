(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.candal_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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PT8zVnJATm5LKxcGATlOMRUMFRsP/uQfKTg7Nj0CNzZnUTExUWc2NmdRMjJRZxMBBAoSHCoeMz0TNmAA//8AqgAABYoIehImADkAABAHAHoAfgE9//8AnAAABAAHPRImAFkAABAGAHq1AP//AKr8lAWKBYYSJgA5AAAQBwFdAZYAAP//AJz8lAQABFISJgBZAAAQBwFdAKgAAP//AKoAAAWKCEkSJgA5AAAQBwEqAJwBSf//AE4AAAQABwASJgBZAAAQBgEq0wD//wCJ/+ME7gh7ECYAOgQAEAcAegEkAT7//wBg/+MEKwc9ECcAegCqAAAQBgBaAAD//wCF/OwE6gWhECYAOgAAEAcAfgEoAAD//wBg/OwEKwRSEiYAWgAAEAcAfgCbAAD//wCF/+ME6gg7ECYAOgAAEAcBKgCSATv//wBg/+MEKwcAECYAWgAAEAYBKiIA//8ACvyUBFEFhhImADsAABAHAV0AugAA//8AGfyUA/IFgBImAFsAABAHAV0A4AAA//8ACgAABFEITxAmADsAABAHASoASgFP//8AGf/jBsMFoBAmAFsAABAHAToELgAA//8Aqv/jBYAHtRImADwAABAHAS0BZgF1//8Akf/jBVEGQBImAFwAABAHAS0BRwAA//8Aqv/jBYAIRBImADwAABAHATAAxwFE//8Akf/jBVEHABImAFwAABAHATAAqAAA////6QAABOkHtRImAEAAABAHAG7/xgF1//8AVAAAA+wIjBAmAEEAABAHAHoAggFP//8AVAAABAwHPRAmAGEAABAHAHoAogAA//8AVAAAA9QH2RAmAEEAABAHASz/0wYA//8AVAAAA9EGjxImAGEAABAHASz/7AS2//8AVAAAA/0IOxAmAEEAABAHASoAAAE7//8AVAAABAwHABAmAGEAABAGASoPAAABAAb+SgQEBtUAOQAAJRQOAiMiJic0PgQ1FjMyPgI1ESMRMzU0PgI7ATIWFxQOBBUuASMiDgIdASEOARUhArJJeJpRRoczAwUFBQM/Ki89JA6Tk0l2mE8HWJ4/AwUFBQMzUiA2PR4HATUKD/7kIIW0bi8cFwIqPUc+KgIWHzNCJAMNARC/f6tpLSMaAio+Rz0qAg8RKURYLlU2hVUA//8ACgAABWkISRImACgAABAHATL//gFJ//8AXP/jBMwHABImAEgAABAG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AvkAagMJ/60FfQCcAugAnAjtAJoGJACcBYAAUAXQAJwF3wBUBBoAnASEAGAEHQAZBe0AkQUZAB0H4wBCBVEAHQWtAJEEKwBUBIsA5wNoAOwEiwDnBokAxQH+AAAECQEEBL0AUAV3AHMFCgDaBQwAFwK6AKIDrQAOBUwAsgkIAQEECgBKBQoAXQSYAMUGqwAACQgBCgPbAF4D3wCiBosAxQQnAIAEEAB9BLQBSgXtAJEFqwB1A58AvgQFAO4DbQBxBG8ArwUKAFwKHABxCZkAcQsHAH0FOACTBXMACgVzAAoFcwAKBXMACgVzAAoFcwAKB7oACgWTAFwFJwCrBScAqwUnAKsFJwCiAxYATQMWAH0DFv/LAxb/mQYDAAAGdgCqBjkAXAY5AFwGOQBcBjkAXAY5AFwE9wDnBjkAXAYrAKoGKwCqBisAqgYrAKoE0//pBc8AqgXTAJwFUgBcBVIAXAVSAFwFUgBcBVIAXAVSAFwHugBcBL0AUAURAFAFEQBQBREAUAURAFACngBBAp4AQQKe/48Cnv+FBW8AUAYkAJwFgABQBYAAUAWAAFAFgABQBYAAUAR6AMUFgABQBe0AkQXtAJEF7QCRBe0AkQWtAJEFzwCcBa0AkQVzAAoFUgBcBXkACgVSAFwFkwBcBL0AUAWTAFwEvQBQBgMAqghBAFQGAwCqBe8AVAUnAKsFEQBQBScAqwURAFAFzQAAAxb/fQKe/0EC+QCiBvgAqwYCAGoD4gAXAwn/rQV9AJwFfQCcBH4AqgLoAJwFKwCqBKoAnAarAAAC6ACcBRf//wL0AB4GdgCqBiQAnAZ2AKoGJACcBjkAXAWAAFAIBwBcCCwAUAWwAKoEGgCcBbAAqgQaAJwFsACqBBoATgXTAIkEzABgBagAhQSEAGAFqACFBLAAYARcAAoEHQAZBYMACgP6ABkGKwCqBe0AkQYrAKoF7QCRBNP/6QXmAFQEsQBUBeYAVAQrAFQFvABUBJgAVARLAAYFcwAKBVIAXAVzAAoFUgBcBScAqwURAFAFJwCrBREAUAMW/9cCnv+xAxYAGQL5AAsGOQBcBYAAUAY5AFwFgABQBbAAqgQaAG8FsACqBBoAmwYrAKoF7QCRBisAqgXtAJEGqwAABqsAAARcAAoEHQAZAwn/rQR6AHsEeAB7BCgAoAO6AOQDWQDPA8cBNQVMAJYEegCuA7oAzgSdAK4EKACgA0AAYgZqAAAFIwAwAyAAAAgAAAADUQC+AuwAdQLpAIUFHQC+BR0AqgPlAIUDggAxA34ALwTlAQoIeACTD00AOwMrAI8DKwCuAh3/OAWNAJEFgf/VCGQAogUjADcFXwAABXwAhwQuACcEqgDFBWIARgaJALAEWgAvBokAxQTTAMUESgDFBEAAxQQXAAYHAwAlBrgAJQanACUJqAAlCbMAJQAAAAACyQBVAAEAAAiy/lAAAA9N/zj9Nw8iAAEAAAAAAAAAAAAAAAAAAAFeAAMFMAGQAAUAAAWaBTMAAAEfBZoFMwAAA9EAZgIAAAACAAUDAAAAAgAEgAAA70AAIEsAAAAAAAAAAG5ld3QAQAAA+wYIsv5QAAAIsgGwIAAAEwAAAAAENwWGAAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABAHAAAAAbABAAAUALAAAAAIACgANAH4A/wEHAREBGwEpATUBOgFEAUgBWwFlAXEBfgGSAhsCNwLHAt0DBwMPAxEDJgOpA8AgFCAaIB4gIiAmIDAgOiBEIHQgrCEiIgIiBiIPIhIiGiIeIisiSCJgImUlyvsE+wb//wAAAAAAAgAJAA0AIACgAQIBDAEYAScBMQE3AT0BRwFQAV4BbgF4AZICAAI3AsYC2AMHAw8DEQMmA6kDwCATIBggHCAgICYgMCA5IEQgdCCsISIiAiIGIg8iESIaIh4iKyJIImAiZCXK+wD7Bv//AAEAAf/7//n/5//G/8T/wP+6/6//qP+n/6X/o/+c/5r/kv+M/3n/DP7x/mP+U/4q/iP+Iv4O/Yz9duEk4SHhIOEf4RzhE+EL4QLg0+Cc4CffSN9F3z3fPN813zLfJt8K3vPe8NuMBlcGVgABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAAALEu4AAhQWLEBAY5ZuAH/hbgAMB25AAgAA19eLbgAASwgIEVpRLABYC24AAIsuAABKiEtuAADLCBGsAMlRlJYI1kgiiCKSWSKIEYgaGFksAQlRiBoYWRSWCNlilkvILAAU1hpILAAVFghsEBZG2kgsABUWCGwQGVZWTotuAAELCBGsAQlRlJYI4pZIEYgamFksAQlRiBqYWRSWCOKWS/9LbgABSxLILADJlBYUViwgEQbsEBEWRshISBFsMBQWLDARBshWVktuAAGLCAgRWlEsAFgICBFfWkYRLABYC24AAcsuAAGKi24AAgsSyCwAyZTWLBAG7AAWYqKILADJlNYIyGwgIqKG4ojWSCwAyZTWCMhuADAioobiiNZILADJlNYIyG4AQCKihuKI1kgsAMmU1gjIbgBQIqKG4ojWSC4AAMmU1iwAyVFuAGAUFgjIbgBgCMhG7ADJUUjISMhWRshWUQtuAAJLEtTWEVEGyEhWS0AuAAAKwC6AAEABgACKwC/AAEALAAnABkAFAANAAAACCu/AAIAOwAwACMAGwANAAAACCu/AAMAMwAnACMAFAANAAAACCu/AAQAKAAfABkAFAANAAAACCu/AAUAJAAfABkADgAJAAAACCu/AAYAGgAVABAADgAJAAAACCsAugAHAAQAByu4AAAgRX1pGEQAQAEAAMAA4AEgAUABwAAAAB3+UAAwBDcAHAWGABsAAAAAAA4ArgADAAEECQAAAHAAAAADAAEECQABAAwAcAADAAEECQACAA4AfAADAAEECQADADYAigADAAEECQAEAAwAcAADAAEECQAFABoAwAADAAEECQAGAAwAcAADAAEECQAHAEwA2gADAAEECQAIABgBJgADAAEECQAJABgBJgADAAEECQAKAHAAAAADAAEECQAMACYBPgADAAEECQAOADQBZAADAAEECQASAAwAcABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAHYAZQByAG4AbwBuACAAYQBkAGEAbQBzAC4AIABBAGwAbAAgAHIAaQBnAGgAdABzACAAcgBlAHMAZQByAHYAZQBkAC4AQwBhAG4AZABhAGwAUgBlAGcAdQBsAGEAcgB2AGUAcgBuAG8AbgBhAGQAYQBtAHMAOgAgAEMAYQBuAGQAYQBsADoAIAAyADAAMQAxVXt0AABWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAwAEMAYQBuAGQAYQBsACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAdgBlAHIAbgBvAG4AIABhAGQAYQBtAHMALgB2AGUAcgBuAG8AbgAgAGEAZABhAG0AcwBuAGUAdwB0AHkAcABvAGcAcgBhAHAAaAB5AC4AYwBvAC4AdQBrAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/HQECAAAAAAAAAAAAAAAAAAAAAAAAAAABXgAAAQIAAgEDAQQBBQEGAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQEHAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQgAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEJAQoBCwEMAP0A/gD/AQABDQEOAQ8BAQEQAREBEgETARQBFQEWANcBFwEYARkBGgEbARwBHQEeAR8BIAEhASIA4gDjASMBJAElASYBJwEoALAAsQEpASoBKwEsAS0BLgEvATAA+wD8AOQA5QExATIBMwE0ATUBNgE3ATgAuwE5AToBOwE8AOYA5wCmAT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQDYAOEA2wDcAN0A4ADZAN8BWgFbAVwBXQFeAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAFfAWAAjACYAKgAmgCZAO8ApQCSAJwApwCPAJQAlQC5AWEAwADBAWIBYwFkAWUHdW5pMDAwMAd1bmkwMDAyB3VuaTAwMDkHdW5pMDAwQQd1bmkwMDBEB3VuaTAwQTAHdW5pMDBBRAZBYnJldmUGYWJyZXZlB0FvZ29uZWsHYW9nb25lawZEY2Fyb24GZGNhcm9uBkRjcm9hdAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgRoYmFyBkl0aWxkZQZpdGlsZGUCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlBkxjYXJvbgZsY2Fyb24KTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGTmNhcm9uBm5jYXJvbg1PaHVuZ2FydW1sYXV0DW9odW5nYXJ1bWxhdXQGUmFjdXRlBnJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQxUY29tbWFhY2NlbnQMdGNvbW1hYWNjZW50BlRjYXJvbgZ0Y2Fyb24FVXJpbmcFdXJpbmcNVWh1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0BlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50B3VuaTAyMDAHdW5pMDIwMQd1bmkwMjAyB3VuaTAyMDMHdW5pMDIwNAd1bmkwMjA1B3VuaTAyMDYHdW5pMDIwNwd1bmkwMjA4B3VuaTAyMDkHdW5pMDIwQQd1bmkwMjBCB3VuaTAyMEMHdW5pMDIwRAd1bmkwMjBFB3VuaTAyMEYHdW5pMDIxMAd1bmkwMjExB3VuaTAyMTIHdW5pMDIxMwd1bmkwMjE0B3VuaTAyMTUHdW5pMDIxNgd1bmkwMjE3B3VuaTAyMTgHdW5pMDIxOQd1bmkwMjFBB3VuaTAyMUIIZG90bGVzc2oMZG90YWNjZW50Y21iB3VuaTAzMEYHdW5pMDMxMQd1bmkwMzI2B3VuaTAzQTkMZm91cnN1cGVyaW9yBEV1cm8CZmYDZmZpA2ZmbAJzdAtjb21tYWFjY2VudAAAAAH//wADAAEAAAAMAAAAAAAAAAIAAQABAVwAAQAAAAEAAAAKACQAMgACREZMVAAObGF0bgAOAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQCOAAQAAABCARYGjgE0B6wG7AFKAfwCDgK0BwYDFgOEA4oIKAOwB3oEggVEBcoINgkEB5QGHAYyBmgGegaEB6IGjgaOBo4GjgaOCQQHrAbsBwYHBgcGBwYHBgdAB3oHegd6B3oINgeUB5QHlAeUB5QHlAeiB6IHrAesB8YIKAgoCDYJBAkKCWoJPAlqAAEAQgAUACgAKQAqACsALQAuADIAMwA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBIAE0AUgBZAF0AXgBgAIYAhwCIAIkAigCMAI0AlgCYAJkAmgCbAJwAngCfAKAAoQCiAKMApgCnAKgAqQCqAKsAwwDFAMoAzADmAPgA+gEEAQkBOQE7ATwBPgAHADv+0wA9/2oAPv+kAD//WABA/tMAo/7TAQT+0wAFAD3/rAA+/48AQP+PAKP/jwEE/48ALAAT/rYAFP/BABX+0wAh/48AIv+PACj/FABI/4cATP+sAFb/rABZ/30AXP+aAGD/jwCG/xQAh/8UAIj/FACJ/xQAiv8UAKb/hwCn/4cAqP+HAKn/hwCq/4cAq/+HAKz/hwCu/6wAr/+sALD/rACx/6wAuP+sALn/rAC6/6wAu/+sALz/rAC+/6wAv/+aAMD/mgDB/5oAwv+aAMP/jwDF/48A7/+sAToAJwE7/qwBPv6sAAQAO//bAED/0wCj/9MBBP/TACkAFP9OACr/pAA2/6QAPP/bAEz/2wBW/9sAXP/bAGD/fQCN/6QAmP+kAJn/pACa/6QAm/+kAJz/pACe/8kAn//bAKD/2wCh/9sAov/bAK7/2wCv/9sAsP/bALH/2wC4/9sAuf/bALr/2wC7/9sAvP/bAL7/2wC//9sAwP/bAMH/2wDC/9sAw/99AMX/fQDK/6QAzP+kAO7/mgDv/9sBOwAnAT4AJwAYADb/tgA7/qwAPP+2AD3+5QA+/2AAQP7BAGD/dQCY/7YAmf+2AJr/tgCb/7YAnP+2AJ7/tgCf/7YAoP+2AKH/tgCi/7YAo/7BAMP/dQDF/3UA7v+2AQT+wQE6/ikBPf4UABsAE/6HABT/2wAV/ocAKP9EAEj/yQBa/9sAYAAnAIb/RACH/0QAiP9EAIn/RACK/0QApv/JAKf/yQCo/8kAqf/JAKr/yQCr/8kArP/JAMMAJwDFACcA+f/bAPv/2wE6ADkBO/5gAT0AJwE+/mAAAQAUACcACQATACcAFQAnADv/pABA/48AYP+kAKP/jwDD/6QAxf+kAQT/jwA0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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
