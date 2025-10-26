(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.chango_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAABDgAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBBAEFAQYA1wEHAQgBCQEKAQsBDAENAQ4A4gDjAQ8BEACwALEBEQESARMBFAEVAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wEWAKgAnwCbALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBFwEYARkBGgCMARsAmACaAJkA7wClAJIAnACnAI8AlACVALkBHAduYnNwYWNlB3VuaTAwQUQEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgxkb3RhY2NlbnRjbWIMZm91cnN1cGVyaW9yBGxpcmEERXVybwlhZmlpNjEyODkJZXN0aW1hdGVkA3NfdAAAAAAAAf//AAMAAQAAAAwAAAAAAAAAAgABAAEBDQABAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
