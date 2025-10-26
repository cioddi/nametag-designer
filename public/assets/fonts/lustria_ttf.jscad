(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lustria_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEADgDqAAMAAQQJAAIADgD4AAMAAQQJAAMAOgEGAAMAAQQJAAQADgDqAAMAAQQJAAUAHgFAAAMAAQQJAAYAHgFeAAMAAQQJAAcAVAF8AAMAAQQJAAgAHgHQAAMAAQQJAAkAHgHQAAMAAQQJAAsALAHuAAMAAQQJAAwALAHuAAMAAQQJAA0BIAIaAAMAAQQJAA4ANAM6AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABNAGEAdAB0AGgAZQB3ACAARABlAHMAbQBvAG4AZAAgACgAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAG0AYQBkAHQAeQBwAGUALgBjAG8AbQAgAHwAIABtAGEAdAB0AGQAZQBzAG0AbwBuAGQAQABnAG0AYQBpAGwALgBjAG8AbQApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIABMAHUAcwB0AHIAaQBhAEwAdQBzAHQAcgBpAGEAUgBlAGcAdQBsAGEAcgBNAGEAdAB0AGgAZQB3AEQAZQBzAG0AbwBuAGQAOgAgAEwAdQBzAHQAcgBpAGEAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADAAMAAxAC4AMAAwADEATAB1AHMAdAByAGkAYQAtAFIAZQBnAHUAbABhAHIATAB1AHMAdAByAGkAYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAE0AYQB0AHQAaABlAHcAIABEAGUAcwBtAG8AbgBkAC4ATQBhAHQAdABoAGUAdwAgAEQAZQBzAG0AbwBuAGQAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAG0AYQBkAHQAeQBwAGUALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0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ADb/7ABE/9gARv/YAEj/2ABS/9gAVv/YAIH/pgCC/6YAg/+mAIT/pgCF/6YAhv+mAIf/pgCI/+IAk//iAJT/4gCV/+IAlv/iAJf/4gCZ/+IAp//YALn/2ADR/+IA0v/YAPL/iAAgAA//iAAQ/8QAEf+IACT/sAAm/+IAKv/sADL/7AA0/+wANv/sAET/2ABI/9gAUv/YAFb/2ACB/7AAgv+wAIP/sACE/7AAhf+wAIb/sACH/7AAiP/iAJP/7ACU/+wAlf/sAJb/7ACX/+wAmf/sAKf/2AC5/9gA0f/sANL/2ADy/4gAEQAQ/5wAJv/YACr/2AAy/9gANP/YADb/4gBc/+IAiP/YAJP/2ACU/9gAlf/YAJb/2ACX/9gAmf/YAL7/4gDA/+IA0f/YACAABf+mAAr/pgAm/+IAKv/iAC3/7AAy/+IANP/iADf/2AA4/9gAOf+mADr/sAA8/6YAWf/YAFr/4gBc/+IAZ/+mAIj/4gCT/+IAlP/iAJX/4gCW/+IAl//iAJn/4gCa/9gAm//YAJz/2ACd/9gAnv+mAL7/4gDA/+IA0f/iANr/pgAGADn/7AA6//YAPP/iAGf/4gCe/+IA2v/iABQAJP/YADj/7AA5/9gAOv/iADv/2AA8/84AZ//OAIH/2ACC/9gAg//YAIT/2ACF/9gAhv/YAIf/2ACa/+wAm//sAJz/7ACd/+wAnv/OANr/zgAWACT/4gA4/+wAOf/iADr/7AA7/9gAPP/YAD3/7ABn/9gAgf/iAIL/4gCD/+IAhP/iAIX/4gCG/+IAh//iAJr/7ACb/+wAnP/sAJ3/7ACe/9gA2v/YANv/7AAYAA//xAAR/8QAJP/YACb/7AAq/+wAMv/sADT/7AA2//YAgf/YAIL/2ACD/9gAhP/YAIX/2ACG/9gAh//YAIj/7ACT/+wAlP/sAJX/7ACW/+wAl//sAJn/7ADR/+wA8v/EAB4AEP/EACb/7AAq/+wAMv/sADT/7AA3/6YAOP/YADn/kgA6/5wAO//iADz/fgBa/+IAXP/iAGf/fgCI/+wAk//sAJT/7ACV/+wAlv/sAJf/7ACZ/+wAmv/YAJv/2ACc/9gAnf/YAJ7/fgC+/+IAwP/iANH/7ADa/34ABwAQ/8QAOf/iADr/7AA8/9gAZ//YAJ7/2ADa/9gAIQAP/4gAEP+cABH/iAAk/6YAJv/iACr/2AAy/9gANP/YADb/4gBE/8QAR//EAEj/xABS/8QAVv/EAIH/pgCC/6YAg/+mAIT/pgCF/6YAhv+mAIf/pgCI/+IAk//YAJT/2ACV/9gAlv/YAJf/2ACZ/9gAp//EALn/xADR/9gA0v/EAPL/iAANABD/zgAm/+wAKv/sADL/7AA0/+wAiP/sAJP/7ACU/+wAlf/sAJb/7ACX/+wAmf/sANH/7AACAFX/zgBW/8QAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
