(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cambo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AXIAAwABBAkABAAKAVoAAwABBAkABQAaAdwAAwABBAkABgAaAfYAAwABBAkABwB8AhAAAwABBAkACABGAowAAwABBAkACQBGAowAAwABBAkACwBGAtIAAwABBAkADABGAtIAAwABBAkADQEgAxgAAwABBAkADgA0BDgAAwABBAkAEAAKAVoAAwABBAkAEQAOAWQAAwABBAkAEgAKAVoAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEALAAgAEMAYQByAG8AbABpAG4AYQAgAEcAaQBvAHYAYQBnAG4AbwBsAGkAIAAoAGMAYQByAG8AQABoAHUAZQByAHQAYQB0AGkAcABvAGcAcgBhAGYAaQBjAGEALgBjAG8AbQAuAGEAcgApACwADQBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAAQQBuAGQAcgBlAHMAIABUAG8AcgByAGUAcwBpACAAKABhAG4AZAByAGUAcwBAAGgAdQBlAHIAdABhAHQAaQBwAG8AZwByAGEAZgBpAGMAYQAuAGMAbwBtAC4AYQByACkALAANAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgAEMAYQBtAGIAbwAuAEMAYQBtAGIAbwBSAGUAZwB1AGwAYQByAEMAYQByAG8AbABpAG4AYQBHAGkAbwB2AGEAZwBuAG8AbABpACwAQQBuAGQAcgBlAHMAVABvAHIAcgBlAHMAaQA6ACAAQwBhAG0AYgBvACAAUgBlAGcAdQBsAGEAcgA6ACAAMgAwADEAOQBWAGUAcgBzAGkAbwBuACAAMgAuADAAMAAxAEMAYQBtAGIAbwAtAFIAZQBnAHUAbABhAHIAQwBhAG0AYgBvACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAQwBhAHIAbwBsAGkAbgBhACAARwBpAG8AdgBhAGcAbgBvAGwAaQAgAGEAbgBkACAAQQBuAGQAcgBlAHMAIABUAG8AcgByAGUAcwBpAEMAYQByAG8AbABpAG4AYQAgAEcAaQBvAHYAYQBnAG4AbwBsAGkALAAgAEEAbgBkAHIAZQBzACAAVABvAHIAcgBlAHMAaQBoAHQAdABwADoALwAvAHcAdwB3AC4AaAB1AGUAcgB0AGEAdABpAHAAbwBnAHIAYQBmAGkAYwBhAC4AYwBvAG0ALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADqAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQMAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEEAQUBBgDXAQcBCAEJAQoBCwEMAQ0A4gDjAQ4BDwCwALEBEAERARIBEwEUARUA2ADhAN0A2QCyALMAtgC3AMQAtAC1AMUAhwC+AL8BFgEXB25ic3BhY2UHdW5pMDBBRARoYmFyBkl0aWxkZQZpdGlsZGUCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50Ckxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24IZG90bGVzc2oERXVybwtjb21tYWFjY2VudAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAwDpAAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEARAAEAAAAHQCCAJwAogC8AMIA8AEWASABQgFsAXIBhAGaAaQBtgHcAfoCTAKSApwC5gLsAvIDAAMKAxADGgMoAzYAAQAdABAAEQASABoAJAApAC0ALgAvADEAMgAzADUANgA3ADgAOQA6ADsAPABJAFEAUgBVAFcAWABZAFoAXAAGACT/4gA3/8QAOf+/ADr/zgA7/8UAPP+rAAEADf/GAAYAJP+sAET/zABK/8AAUf/gAFL/2QBW/8wAAQAX/+AACwAN/2UAEP/iADL/9AA3/8QAOP/SADn/nAA6/6YAPP+gAFn/ywBa/84AXP/OAAkAEf+xABL/xgAk/8QARP/sAFH/9ABS//EAU//0AFb/6wBY//kAAgAR/+IAVv/2AAgAEP/iADL/8AA2//YAUv/0AFj/8gBZ/84AWv/VAFz/0gAKAA3/mQAQ/+IAN/+6ADj/5wA5/6YAOv+rADz/pgBZ/84AWv/VAFz/1wABABH/7AAEACT/9AA5/+wAOv/vADv/7AAFABH/sQAk/6oARP/xAEr/8QBS//IAAgA4/+wAOf/sAAQAOf/sADv/9gA8/+wATf/4AAkAEP/EABH/pAAS/7kAHf/gACT/xABE/+YASv/qAFL/4ABW/+AABwAR/+wAEv/aACT/xABE//IASv/sAFL/9ABW//EAFAAQ/7gAEf+LABL/nwAd/7IAJP+SADL/7AA2/+IARP+8AEr/zABR/90AUv/CAFP/3gBW/7gAV//jAFj/5wBZ/9UAWv/ZAFv/7ABc/+wAXf/iABEAEP/OABH/ngAS/78AHf/SACT/pgAy/+8ARP/QAFH/7ABS/9EAU//sAFb/xABY//YAWf/eAFr/4gBb//YAXP/sAF3/4gACABD/xQAy/+wAEgAQ/6sAEf+rAB3/zAAk/54ANv/iAET/ugBJ/+wASv+6AFH/zgBS/7oAU//YAFb/vABY/90AWf/OAFr/0wBb/9gAXP/OAF3/zgABAA0AMwABAA3/zAADAFn/9wBa//sAXP/4AAIAEf/iAET/9gABABD/9gACAFn/8QBa//UAAwAR/8YAEv/GAFL/9wADABH/ugAS/9MAUv/7AAMAEf+0ABL/3wBS//oAAAABAAAACgAmACgAAkRGTFQADmxhdG4AGAAEAAAAAP//AAAAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
