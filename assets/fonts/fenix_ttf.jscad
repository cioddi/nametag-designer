(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fenix_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAPAIAAAwBwR0RFRgD9AcsAAGooAAAAHEdQT1MvLRYXAABqRAAANmpHU1VC393gQAAAoLAAAACGT1MvMmZqHDcAAGKoAAAAYGNtYXCRxv+tAABjCAAAAQxnYXNwAAAAEAAAaiAAAAAIZ2x5Zn3Cgh4AAAD8AABbrGhlYWT8JBm6AABeoAAAADZoaGVhB1gDuQAAYoQAAAAkaG10eMeqHJEAAF7YAAADrGxvY2H4GA8eAABcyAAAAdhtYXhwAUADiwAAXKgAAAAgbmFtZVctiisAAGQcAAAD5HBvc3T/lK3AAABoAAAAAiBwcmVwaAaMhQAAZBQAAAAHAAIAMgAAAgYCqAALAA8AABMHFwcXNxc3JzcnBwMRIRG6JWJjJWNjJWNiJWLqAdQB1SViYyViYiVjYiVi/o0CqP1YAAIARf/4ALMCsAAFAA0AABM3FwMHJwYmNDYyFhQGR1wMIhkNAx8fLyAgAqYKC/4aBALFHy8gIC8fAAACAC0BygEWAqgABAAJAAATNxcPAT8BFw8BLUwMHCJ3TAwcIgKeCgvPBNQKC88EAAACAB4ADAI5An4AKQAvAAATNzM/ARcHPwIXBzcXByInBzcXByInDwEnNjcmIw8BJzcmIyc3MzcmIxcHNjM3JjoSdhg4Cxt3FzgLG3gJEjNEFHcJETNEFjkKDQ0nTxc5Cho4QAkReBU4QLYUKU4UJwGcJ7EKC7ACrwoLrQIMLwGTAgwuAa4KC1tSAa8KC64BDCeWAQGWAZQBAAEAHv+pAa0C3wAwAAABJiIHBhUUHwEeARUUBwYHFwcnNy4BJzcfARYzMjc2NTQvAS4BNTQ2Nyc3FwcWFwcnAT8ZghwNQnBCPjkuQw08DA1BXxc7GAQtSWcLAVxtMDVdRQs8DAtXRD8XAhwOIRAYPxYmFlouRiohB30KC3sDMRtfBlIcRAcGPB0lEEszRU4HdQoLcwVBWwcABQAiAAACpAKKAAsAEwAfACcALwAAJRQzMjc2NTQjIgcGFiY0NjIWFAYBFDMyNzY1NCMiBwYWJjQ2MhYUBgEXAgMHJxITAchVIBYSVCAWEw1LV3ZNVv4SVSAWElQgFhMNS1d2TVYBegzy2EAM8tikdQsnN3YLKNtGnVpPnVEB8XULJzd2CyjbRp1aT51RATEL/s3+2w8LATMBJQAAAwAq/9gCkAKSAC8AOgBGAAAlNjQmLwE3Mj8BFwcmJxYGBx4BMjcXByYnBiImNTQ2Ny4BNTQ2MhcWFRQPARceAgQWMzI3Ji8BBgcGEwYUFhc3NjU0JyYiAcUcMSILDGhrIwsLVEc2AzYhLiIMAmIoM0y3fEU9LShkiSwvWzZeBiEj/shUQzs2H0dUHBgaKgwoLDMzGBxecyBVRwgMJwYCDDQCATOANSITAhooEzYpUk06WS47TihCRyAiPUxEKHcHKywPSRgkWmwVISYBdxA6RzgqKi0jGR4AAQAtAcoAhQKoAAQAABM3Fw8BLUwMHCICngoLzwQAAQAl/1gBEwL2AA8AADY0PgE3NjcXBhAXBy4DJSk3IzIrDp2dDhQkSzPNrpxiKTkbEbP96rMRDR1TXgAAAQAK/1gA+AL2AA4AABIUDgMHJzYQJzceAvgqM0skFA6dnQ4rVTcBe66aXlMdDRGzAhazERtiYgABACUBVQGWArAADgAAEzMXNxcHFwcnByc3JzcXyyUPig2ESR1gYR1JhA2KArCOICE9ehVpaRV6PSEgAAABAB4AYQHeAisAEwAAEzczNjU3FxU3FwciJxcHJzY1JiMeDLcBLQy4CwtYXwExDAFYYAE1LT9+DAu+AgwxAbwLC1JqAQAAAQAr/4EAoQBnAAsAADYWFAYHJzY0LwE3M4wVOysQOS4DOBRaM0VKFxItWh8UGgAAAQA8AMgBUwEIAAgAAD8BMj8BFwcmIzwMaHImCwvjHtknBgIMNAUAAAEANP/4AKIAZgAHAAAWJjQ2MhYUBlMfHy8gIAgfLyAgLx8AAAEAFv/hAYoCxwAHAAABNxcCAwcnEgFDOwyiizsMcwK9Cgv+gf6uCgsBDgAAAgAx//gCHgKSAAsAEwAAEwYVEDMyNzY1ECMiAiYQNjIWEAa+MKI2KzCiNj56ffF/gwI8S5D+1RhLkAEr/aS6AS2zu/7VtAAAAQAeAAABSAKSAA4AADcRBgcnNxcRFwchJzc+AZNBLga3E2AG/u0GSxINWwHGBggWaQj9sycWFh8HEAAAAQAhAAAB1wKSABsAAD4BNTQjIg8CJz4CMzIWFRQHDgEHPwEXByEn14SBNiAFGEEKKWc0VW98LD017C8eCv5gDMqqR40PVAdaCyItaVR1hC44LwJWB5gsAAEAHP/4AbgCkgApAAABFAYHHgEVFAYjIi8BNxYyNzY0JicGIi8BNzYyMzY1NCYiDwInNjMyFgGvNi0xO5WGPiALED2ZMxI4NhUvFgsKHTAKaUR6IwUYPFtxV3AB5zRTGhNQMU1tCBM+EBcaXU8HAwcMJgYXXTRDD1QHZExhAAIAC//4AeICkgARABYAACUiFRcHJzY1IScBNxcUEzcXBycyNRMDAZIXAk0MA/7yDgEbPhQDXAsLxhYBw6wWlggLR2AqAawSCDb+oQMMQEQYAQ3+2wAAAQAn//gBrQKSAB8AACUUBiMiLwE3FjI3PgE0JyYjIiMnEzI/ARcHJiMHBBcWAa2LdUkyCxFLdi4aHwIW8AYFCw2GhCwLDZljBwEWFQLKVnwZEzsgDhE9LA2GDAEkBgIMRwSYDbgPAAACAC7/+AHgApIAFQAjAAABMhYXFhQGIyInJjU0Njc2NxcOAQc2FzQjIgcGFRQXFjM2NzYBHjNOFit9XXY2LEkyXoYMbIYWPbuLRDEBGiFUMCUdAYUiHTmtaFNFZnGaKk8YISd9cSnYkyUSEU40PgEOIwABABv/+AHHAooADQAAARcGAg8BJz4BNwUHJzcBuwxddCpVFEJ7Wf7vLx4KAoosl/7prwkIvv6HAlYHmAADADH/+AHcApIAEwAdACcAABI2MhYVFAYHFhUUBiImNDY3LgE1ExQWMjc2NCYnBhImIgcGFBYXNjU9ca5uQTmMd8RwTzI3PkhLfyoTPl5r8UJtJxMzUGYCL2NbRDNUGTtzTGFWh1gWFlU2/sI3ORkaXD8lNgErNhcdVjsiNEsAAAIAH//4Ac8CkgAWACEAABMiJjQ2MzIXFhUUDgEHBgcnPgE3NjcGJhYyNzY1NCMiBwbiY2B9XHI2LzZCLk5pDDVJJ04WPrtHgTkBlC8gHwEGc6tuVEdrYoZMHC8VIRUnIEB7KoxHJREQwQ8mAAIAO//4AKkBygAHAA8AABImNDYyFhQGAiY0NjIWFAZaHx8vICAvHx8vICABXB8vICAvH/6cHy8gIC8fAAIAOf+BAK8BygALABMAADYWFAYHJzY0LwE3My4BNDYyFhQGmhU7KxA5LgM4FC0fHy8gIFozRUoXEi1aHxQa9R8vICAvHwABAB4AVQGGAiEACQAAEyUfAQ0BFwclNSUBRA8O/u0BDwEa/rUBVssHJ7i2ECDPEQACAEEA1wHZAbQABgANAAATNyUXByQjBzclFwckI0EMAYELC/6dHwsMAYELC/6dHwGFLQIMMQKULQIMMQIAAAEAOQBVAaECIQAJAAABBS8BLQEnNwUVAZr+vA8OARP+8QEaAUsBIMsHJ7i2ECDPEQAAAgAe//kBaQKSABIAGgAAEjY0JyYiByc3NjMyFhQGDwInAjQ2MhYUBiLPTCEgfDULCyQ9YH9gXggmDhAfMB8gLwFnQHkdDBE2EhJinV4pVgKK/towHyAuIAAAAgAo/xcDsAKmADcAQgAAAQIUFjMyNjU0JiMiBhUUFjMyNxcOAiIuAzQ+ATc2IBYVFAYHBiMiJicOASMiJjU0NjMyFzcHJiIHDgEUFjMyNwK0JiIdREusla7usY51bA8QMoB4Z2dOMDplQ4QBUNIxJ09TKzoKHFMpREZ6bjc2J0IoXisbGzQrOjABwv6oJh2OZZe9+MeotzgdDR4pGDlXibWney1az61RfSJCJR8cKG1UcaANDU4TDx5mfUcyAAL/8wAAAokCkgAXABoAACU0LwEjBxcHIyc3PgE3EzcXExcHIyc3NgsBMwHTAy3oNVYG3QY3EQkHyD0U104G9QY3FKVixUYGB3+ZIxYWFwcMEwItEgj9rCAWFhcIAen+5wAAAwAi//gCPwKSABYAIQAsAAA3ESc3NjMyFRQHFhUUDgEHBiIvATc+ATcjIh0BFjI3NjU0AyMiHQEWMjc2NCZ4VgbDPflbeSM2KEKMyAY3Eg3RYRsamjonqFIbGogxJD9TAf4jFgipZTEqfS1DJgwSCBYXBxDtGeMEEh5EjAEqGdoEFBt7TQABAC7/+AI0ApIAGQAABSImEDYzMhcWFwcvASYiBwYVFBYzMjcXDgEBXoWruoJdMyQNQRgFLo0xWoxrUVYPGnEIrgE8sCkcFloHXhAWVJqHkSsdGjIAAAIAIv/4ApICkgAQABwAADcRJzc2MyARFAYjIi8BNz4BEyMiFREWMzI3NhAmeFYG4joBTr3MGcgGNxIN22sbJz2EQj50UwH+IxYI/qqykggWFwcQAhcZ/fMEK0wBFZ4AAAEAIgAAAfQCigAcAAATFTI/ARcHJiMVPwEXFSEnNz4BNREnNyEVBy8BIs1fYiALC3dq2TAe/jQGNxINVgYBxx4wuRsCONgJAww4B/sEWAeJFhcHEA8B/iMWiQdYBAABACIAAAH5AooAHQAAExUXByMnNz4BNREnNyEVBy8BIh0BMzcXFQcnLgEjzVkG+AY3Eg1WBgHRHjDDG6AgFhYTBxAPATL4JBYWFwcQDwH+IxaJB1gEH9BFBroGLRINAAABAC3/+AKCApIAIQAAJRUGICY1NDY3NiAXBy8BJiIHBhAWMzI3Nj0BJzczFwcOAQI9Wf76sToxYwEPO0EYBS6bMWeTdh4ZJVYG4AcmEg3IkT+qnFaHJ1BbWgdeEBZb/uKNBAcegiAWGg8HEAABACIAAAK7AooAJwAAAREXByMnNz4BPQEhFRcHIyc3PgE1ESc3MxcHDgEdASE1JzczFwcOAQJlVgb1BjcSDf69Vgb1BjcSDVYG9QY3Eg0BQ1YG9QY3Eg0CN/4CIxYWFwcQD933IxYWFwcQDwH+IxYWFwcQD87oIxYWFwcQAAABACIAAAEjAooAEQAAExEXByMnNz4BNREnNzMXBw4BzVYG9QY3Eg1WBvUGNxINAjf+AiMWFhcHEA8B/iMWFhcHEAABABn/EgEaAooADwAAExEUByc+ATURJzczFwcOAcSOEikiVgb1BjcSDQI3/cGXTxcwXUoCUSMWFhcHEAACACIAAAKBAooAEgAkAAAhATcnNzMXBw4FDwETFwcBERcHIyc3PgE1ESc3MxcHDgEB7P72+FYG5AY3CAYHBwQNBcvrVgb+UlYG9QY3Eg1WBvUGNxINAVX8IxYWFwMEAgcDDgXP/tEjFgI3/gIjFhYXBxAPAf4jFhYXBxAAAQAiAAAB+QKKABMAABMRPwEXFSEnNz4BNREnNzMXBw4Bzd4wHv4vBjcSDVYG9QY3Eg0CN/39BFgHiRYXBxAPAf4jFhYXBxAAAQAYAAADVQKKACIAAAETFwcjJzc2JwsBBycLARcHIyc3Njc2NxMnNzMXGwEzFwcGAugXVgbtBi0gARbAPhO7HEwG0gY3GQQBARlWBsoNqbHQBjcgAjf+AiMWFhYPGAHq/dcUCgIy/f0jFhYXCwsFCwH+IxYK/fYCFBYXDQAAAQAi//gCygKKABsAAAERBwERFwcjJzc+ATURJzczARU3ESc3MxcHDgECdEj+jlYG4gY3Eg1WBqcBYgFWBuIGNxINAjf9yQgCDv4zIxYWFwcQDwH+Ixb+CAICAb8jFhYXBxAAAAIALv/3ApMCkgALABkAABMGEBYzMjc2ECYjIgM0Njc2IBYVFAYHBiAmyT5xa1k4PnFqWNU0LFwBA6Y0LVr+/KYCLVX+9JYlTAEVlv7uVIQoUrCaVIMoUa4AAAIAIgAAAggCkgAUACAAAAEiJxUXByMnNz4BNREnNzYzMhYVFAMjIh0BFjMyNzY1NAERFi5gBv8GNxINVgafP4N/8S8bGiJGOCQBEQLWJxYWFwcQDwH+IxYIXWHDAUoZ+AQXHEuXAAIALv86A1ICkgAgACwAABM0Njc2IBYVFA4DBxceARcWMjcXBy4DJyYrAS4BEwYQFjMyNzYQJiMiLjQsXAEEpRoiPSYiHCtkLDU/Jw5kL0iVSUsCBAp7lZs+cWtZOD5xalgBQFSEKFKxoTtfOTMWEQoMQBsiEhVDAydxGwIHCawBf1X+9JYlTAEVlgAAAgAi//gCTgKSAB4AKwAAASMVFwcjJzc+ATURJzc2MyAVFAcWFx4BFw8BLgEnJgMVMzI3PgE1NCYrASIBBzpTBvIGNxINVgalPQEDngsJREJFB3A2Nz8NUUFKKhYYRU80GwEa4SMWFhcHEA8B/iMWCLqTIwoTi1IPGQgsVoUbASj1ERArKkFXAAEAI//4AdsCkgAjAAABJiIHBhUUHwEWFRQGIyInNx8BFjMyNTQmLwEmNTQ2MzIXBycBayGLLAxSgoB6YYZXQBgPJUaVNDdzdXxgdUdHGAJCEiUTJE0fMjGAV1pSbQdgGmUpNBUsLXVYX1JjBwAAAQATAAACDAKKABUAAAEVBy8BJgYVERcHIyc3PgE1EQ8BJzUCDBgybQ0OVgb1BjcSDYgyGAKKiQddAwEQC/35IxYWFwcQDwIIBF0HiQAAAQAX//gCowKKAB0AAAERFAYjIBkBJzczFwcOARURFBYyNzY1ESc3MxcHBgJXdHv++0wG6wEyEg1dnjAyVgbYBi0fAjf+yI16AQQBWR8WFhcHEA/+ymFqGDV5AVUjFhYTDAAB//T/+AKKAooAFgAAExQXGwEnNzMXBw4BBwMHJwMnNzMXBwaqA6KoVgbdBjcRCQfIPRTXTgb1BjcUAkQGB/41AeUjFhYXBwwT/dMSCAJUIBYWFwgAAAH/9//4A9sCigAeAAATFBcbATcXGwEnNzMXBw4BBwMHJwsBBycDJzczFwcGrgKFmD0TnY1WBt4GNxEKBqlKFJSNTRS1Tgb1BjcTAkQGB/41AgoUCv3sAeUjFhYXBw0S/dMSCAHz/hcSCAJUIBYWFwgAAAEABAAAAocCigAsAAAlNjQvAQcXByMnNz4CPwEDJzczFwcGFB8BNyc3MxcHDgUPARMXByMnAb0OCYmdVgbiBjcRDAoBsMJIBvUGNw4JgZFWBuIGNwwGAwcCCAKkykgG9QYtBhQMvtgjFhYXBw4QAfMBDiAWFhcGFAy0ziMWFhcFBQIJAg0C6f7oIBYWAAAB//YAAAJlAooAHgAAJTUDJzczFwcGFRQfATcnNzMXBw4BBwMVFwcjJzc+AQECxkYG8QYvFgWIlFYG4AY3ExEHrFYG9QY3Eg1T1wEqIBYWFwoOBwfK5CMWFhcIEwv+9vQjFhYXBxAAAAEAGQAAAgICigANAAApAScBBQcnNSEXASU3FwH8/iMGAXb++DEeAcQG/o8BHDEeHQI5AloHiSH9ywJaBwAAAQBP/1gBDgL2AA0AABIQHwEVByc2ECc3FxUHmAJ0swwDAwyzdAH0/mbNCSQIC+IBxOILCCQJAAABABf/4QGBAsUACQAAExcWFxIXBycAJ0kQKTp8STIQ/ugQAsUIY4z+06kXCAKhJAABABL/WADRAvYADQAANhAvATU3FwYQFwcnNTeIAnSzDAMDDLN0WgGazQkkCAvi/jziCwgkCQABACgBhAGaApIABgAAEzczFwcnByijKqUil5cBnfXzGqytAAABADn/+AIYADMABgAAPwEhFwckIzkMAcgLC/6cZQwnDC8IAAABAB0CKAD9ArAABAAAEyc/ARfw0ysUoQIoTTcEdAACACb/+AGmAcoACAAiAAA2FjI/AQYHBhUXBiImNDY/ATYmIg8CJz4BMzIVBxcPAS8Bcy49MwKAHwGfQWw/aYQBAS1OHQgYNxZYPZUFRQZVFCBbIhF0ByUFCGcmRWs6CEEtNwlMB04ZMLXfGBYQCBwAAv/1//gB0AKwAA4AGAAAEzYyFhQGIyImJxEvATcXExYyNzY1NCMiB5BBol1/YiltGEYGhxQCKHUnJYQxNAGkJobTeRMMAkkLFi8I/Z4ODzFerw0AAQAm//gBmQHKABgAAAEmIgcGFBYyNxcOAiMiJjQ2MzIeARcHJwE4FmAiJlSEOQ4MIkspXXR/Wy1GGAc6GAGGBhEwsmEaGgwZG3vceyIaDU4HAAIAJv/4AfoCsAAUAB4AACUGIiY0NjMyHwE1LwE3FxEXDwEvAQMmIgcGFRQzMjcBZkGiXX9iKyQORgaJFEUGXw4dBih1JyWEMTQeJobTeQYDnwsWLwj9jiAWCAYeAWAODzFerw0AAAIAJv/4AaIBygASABoAABI2MhYdAQchHgEyNxcOAiMiJhMiBw4BBzc0Jn6oVg/+6AJSgTsODCJLKV10xy8eDBcB1gFPe2NWIQ9NXBoaDBkbewEXDw9CHgZ4AAEAFwAAAVsCrgAeAAABJiIHBh0BMxcHJxEXByMnNz4BNREHJzc2NzYzMh8BAU0nTBgObQsKbl4G7wYtEg1GBkwGjiANIg4HAmIHDB5fHgwmBP6pJxYWEwcQDwFEARYiviEFBhUAAAMAE/8SAbEB+gAlADIAQAAAARYUBiMiJwYVFBYXHgEUBiImNTQ3JjQ2Ny4BNTQ2MzIXNjcXBwYDBhQWMjc2NCYnJiMmAxQWMjc+ATU0JiIHDgEBXCljThQSGxxwP1N3v2hKEBwWKi9iTTgrKRwrBjnkJUuBLRAyMUMnCh40XRsIDTRdGwgNAZYsjVsDGhoJBQoGQIhZRztIMxIrNRMUTDJKXBozFTIPHP5bIlswGxdQGgUHAQExMTcQCjgaMTcQCjgAAQAKAAACEgKwACAAAAE0JiIHERcHIyc3PgE1ES8BNxcRNjMyHQEXByMnNz4BNQFyL2g0TwbgBi0SDUYGhxRFSZBPBuAGLRINASUzLQ3+viAWFhMHEA8CEQsWLwj+/CaZ+yAWFhMHEA8AAAIAGAAAAQQCoAANABUAADcRLwE3FxEXByMnNz4BEiY0NjIWFAZkRgaJFE8G4AYtEg0MHx8vICBPASsLFi8I/nQgFhYTBxAB8h8vICAvHwAAAgAN/xIAtAKgAAsAEwAAMxQGByc2NREvATcXLgE0NjIWFAaqTUIOTEYGiRRFHx8vICBQeSUSWXsBggsWLwhwHy8gIC8fAAIACgAAAgICsAANABsAACEnNyc3MxcHBg8BHwEHJREvATcXERcHIyc3PgEBfcudRwbKBi0YJGusTAb+WkYGiRRPBuAGLRIN8pogFhYTCiRozSAWTwIRCxYvCP2OIBYWEwcQAAABAA4AAAD6ArAADQAANxEvATcXERcHIyc3PgFaRgaJFE8G4AYtEg1PAhELFi8I/Y4gFhYTBxAAAAEAGAAAAzwBygA0AAABNCYiBxYdARcHIyc3PgE9ATQmIgcRFwcjJzc+ATURLwE3HwI2Mhc2MzIdARcHIyc3PgE1ApwvajwKTwbgBi0SDS9oNE8G4AYtEg1GBoEUAgRFliRYT5RPBuAGLRINASUzLRAhI/sgFhYTBxAP1jMtDf6+IBYWEwcQDwErCxYvCBwCJi0tmfsgFhYTBxAPAAEAGAAAAiABygAhAAABNCYiBxEXByMnNz4BNREvATcfAjYzMh0BFwcjJzc+ATUBgC9oNE8G4AYtEg1GBoEUAgRFSZBPBuAGLRINASUzLQ3+viAWFhMHEA8BKwsWLwgcAiaZ+yAWFhMHEA8AAAIAJv/4AdQBygALABMAADcUMzI3NjU0IyIHBhImNDYyFhQGe4kyJCWJMiQlH3SAunSA7LQPMF+0DzD+rXrfeXrfeQAAAgAN/xwB6AHKABgAIgAAATIWFAYjIicVFwcjJzc+ATURLwE3HwI2AxYyNzY1NCMiBwEzWF1/Xy4yTwbgBi0SDUYGgRQCBERCKHUnJYQxNAHKh9J5Ca8gFhYTBxAPAg8LFi8IHAIm/nwODzFerw0AAAIAJv8cAgQBygAUAB4AAAU1BiMiJjQ2MzIXNxcRFwcjJzc+AREmIgcGFRQzMjcBZENGV15/Xz04KRNPBuAGLRINKHUnJYQxNJWyJYfSeQ0NCP2QIBYWEwcQAiAODzFerw0AAQAYAAABfQHKABsAAAEiBgcRFwcjJzc+ATURLwE3HwI+ATceARcHJwEkGkcOWQbqBi0SDUYGgRQEBA5XFRUwCUEYAYgPBv7DIBYWEwcQDwErCxYvCCUCCyEDBicRVwcAAQAg//gBbAHKACcAAAEmIgcGFRQfAR4BFRQGIiYnNx8BFjMyNTQmLwEuATU0NjMyFxYXBycBCxdfGAkzZis0YIFXFDMZBCM2WyAkXCksZEIoIzERNxgBigoYDhMqEyQPQy0/RCsYUwdDFD4ZHgweDkAoP0YQFRpOBwABAAr/+AEpAicAFAAANxEjJz8BFxUzFwcnERQWOwEXBiImVkYGTCwldwsKeB4mOQU/YDRZATkWIl0HXgwmBP7cJSMcFDYAAQAH//gCBQHKABkAABciPQEvATcXERQWMjcRLwE3FxEXDwEvAgbjkEYGiRQvaDRGBokURQZVFCAFRQiZ6QsWLwj+2zMtDQEwCxYvCP50GBYQCBwCJgAB//3/+AIEAcIAFgAAEwYUFxsBJzczFwcGBwYHAwcnAyc3Mxe4EgRjcEcGwgYxEwgDBY8uFJtHBtwGAZkHHAv+9QEsIBYWFQgRBg3+lQgIAYwgFhYAAAH/+//4AvABxgAjAAABFxIXEyc3MxcHBgcGBwMHJyYnBg8CJwMnNzMXBwYXEzY3JwGDE2UTYUcGvAYxEgkCBHM8FC0uHzERPBSNRwbcBi0eEFpHFCUBxgj+0DIBMCAWFhUHEgYN/pUICH59Zm8mCAgBjCAWFhMNIf7xol1gAAEACAAAAfMBwgAbAAABBx8BByMnBxcHIyc3Nj8BLwE3Mxc3JzczFwcGAYpigEsGgn5YTAbNBjEdD2l2TAaAdVRMBs0GMR0BdYe6Hha1fyAWFhUMFpKtIBardSAWFhUMAAH/+v8SAgsBwgAaAAATBhQXGwEnNzMXBwYHBgcDBgcvATY3Ayc3Mxe1EwVtcEcGwgYxEwkCBY5FNUsIaSSoRwbcBgGZCBsL/v8BIiAWFhUIEQYN/qGqUBgUcVABjSAWFgAAAQAcAAABhQHCAA4AACkBJwEPASc1NyEXAT8BFwGF/p0GAQOnMBgKAUUG/wC4MBgdAXcEVAd1CiH+jQRUBwABABb/WAEfAvYANwAANg4BFBcWMjcXBwYjIicmNTQ2NTQmLwE1PgE1NCcmNTQ3NjMyHwEHJiIGBwYVFBYUBg8BHgEXFgewEgMHFDseEAsGFk0vHxQtFxcnNAkLIS1NFgYLEB4gGxQHGSkWFgYoCx4CmJMtLQ0LCC0TAzwoQhSdHw0oDg4QGCwNH0lUFEErOgMTLQgBCg0XLcseMBAPAyAMHRgAAAEAUP+UAJMC2AAJAAASEBcHJzYQJzcXkAM3DAICNwwCDf5p2AoLvQGX2woLAAABABL/WAEbAvYANwAAEj4BNCcmIgcnNzYzMhcWFRQGFRQWHwEVDgEVFBcWFRQHBiMiLwE3FjI2NzY1NCY0Nj8BLgEnJjeBEgMHFjkeEAsHFkwvHxQtFxcnNAkLIS1OFQYLEB4gHRIHGSkWFgYoDB0CAbaTLS0NCwgtEwM8KUEUnR8NKA4OEBgsDR9JVBRCKjoDEy0IAQoNFy3LHjAQDwMgDB0YAAEAPAEFAfoBigAZAAABFhc+ATcfAQYHBiInJicmJw4BBy8BNjc2MgFOKgoSIgswCRAgJGE/HhAaChIiCzAJDx8kaQFMHgIELyQOFSMZHikTDBMCBC8kDhUiGx0AAgA6/xIAqAHKAAUADQAAFwcnEzcXLgE0NjIWFAalXAwiGQ0sHx8vICDkCgsB5gQCVx8vICAvHwABACn/3QGBApoAHgAAASYiBwYUFjI3FwYHFwcnNy4BNDY3JzcXBxYXFhcHJwEiEVggI0x2Nw4xVw48DA1JVlpHDTwMDSchMw5BFQHYBQ8znlgXFzQFhQoLhgpstWwMfwoLewEPFhpTBgAAAQAn//kBxAKSADEAACUGIicmByc+ATU0JyYjJzczJjU0NjMyHwEHJiIHBhUUFzcXByYnFhQHBgc2MzIWMjcXAcQsXSVlaRYmIAgfHwsMNgd8aj4UCxAwfCAhBrwLC2FWAwYJKis8PDcrJg4SGQobIigeWSoeUwEMJDUeaHAKEzYNCitVGz4GDDEBAiRNJEArFAgOBAAAAgAwADQCYgJWABcAIwAANyY0Nyc3FzYyFzcXBxYUBxcHJwYiJwcnEwYUFjMyNzY0JiMikCAhYRqBOo03fxpgICJiGoI7jDZ/GrwnTEItJidMQi3HNZA0eB5aKCZYHnY1jTd3HlknJVceAX4xnlsUMZ5bAAADABkAAAKIAooAGwAtADEAABMUHwE3JzczFwcOAQ8BNxcHISc3My8BNzMXBwYTLwE3IRcHJicVFwcjJzc+ATUTFjI30QWIlFYG4AY3ExEHgnoKCv5iCgt2mEYG8QYvFlSkCwwBmwsLSllWBvUGNxINNgEEAgJFBwfK5CMWFhcIEwvHAgwrCyjmIBYWFwr+eAEMJwwrAQGRIxYWFwcQDwETAQIAAAIATf+VAJIC2AAHABAAABcHJxI/ARcWAzcXAg8BJy4BkjkMCAEoDAI/OQwIAScMAQhhCgsBJyAKC2UCTQoL/tkgCgs/+AACAB//OgGFApIAFQArAAAXNAI1NDYzMh8BByYiBwYUEhUUBy8BExQSFRQGIyIvATcWMjc2NAI1NDcfAYpSg3A7FAsQM4MgIUAFJQqQUoNwOxQLEDODICFABSUKDl8BMDxpbAoTOg4KK5P+6EskHQIGAfVf/tA8aWwKEzoOCiuTARhLJB0CBgAAAgAiAjIBVgKgAAcADwAAEiY0NjIWFAYyJjQ2MhYUBkEfHy8gIJcfHy8gIAIyHy8gIC8fHy8gIC8fAAMAK//ZAv8CsQAHAA8AKAAAFiYQNiAWEAYABhAWIDYQJgcmIgcGFRQzMjcXDgEjIiY0NjMyFxYXByf1ytIBOMrR/uOYngEDl51JFE0ZGnkwMwsNSS9LY2tIJR80DDsTJ8ABUsbA/q/HAqCk/uKmpAEepq0FDiVJlhIVESNjv14NFRhLBgAAAwA4ATgBIgKSABcAHgAlAAATBiImNDY3NTYjIg8CJzYzMhUHFw8BLwEyNzUGBwYHPwEXByYjwhc9IzY8AiYQCAIUIiU3UQEgBjINMxQMLw4CRgzTCwu2HgHBEyQ1HQoUJwQiBjAlX1oLGAcEJwYtBQokkycEDC4DAAACABgABgHyAbwABgANAAAlJzU3FwcfASc1NxcHFwEH7+8fqamqy8sijo4GyiLKILu7FMEcwRu0tAAAAQA9AJ0B/wFuAAoAABM3JR8BByc2NyYjPQwBqQsCLwwBAci2AT8tAgy6CwsmYwIABAAr/9kDEwKxAAcADwAzAD8AABYmEDYgFhAGAAYQFiA2ECYDIxUWFwcjJzc2NREnNzYzMhUUBgcWFxYzMjMPASYnNC4BJyYnFTMyNxU2NTQrASL+09sBOtPa/uGhpwEFoKWWIBoWA54FIhM1BW0onS0kAhowLQEBBFYgQAIBAgUnJiwTEUkfDifBAVDHwf6wxwKgpP7jp6UBHKf+sHoLDBMTDwkMASIWEwZxKjYJCDNcFwQSiQEEAwIDroUJAQ8mVQACACsBmgElApIACwATAAATFDMyNzY1NCMiBw4BJjQ2MhYUBm4/ERAUPxEQFANARnNBRgIaUQYUL1EGFK9GcUFHbkMAAAIAOwBUAZcCVQASABkAABM1NxcVNxcHIicXByc2NSYjJzcDNyUXByQjzS0MhgsLP0YBMQwBP0cLDAcMATsLC/7jHwG+iwwLjAIMMQGKCws2VAEMLf6kLQIMMQIAAQAzAU0BEQKHABYAABI2NTQjIg8CJz4BMhYUBgczNxcHIyeFPCwNDAMeKA9FRTc9Ok8aHAXPBwGyTR04BScHNBMfNVdNLyoHVSQAAAEAMgFIAPwChwAiAAASFhQHFhQGIyIvATcWMjc2NTQnIi8BNzI3NjU0JiIPAic2xTIeI0dBHxgFCSNAGQQiLQkHBAE7HRwlDwMVJSwChzBVHB9KNQYOJwoKDA8mCwMJGwQOIBMdBSgFNSwAAAEAKAIoAP0CtwAEAAATNxcPASisKQTEAjx7NBRHAAEAH/8SAh0BygAeAAAXIicXIyc2NREvATcXERQWMjcRLwE3FxEXDwEvAgb7KSAGTAwLRgaJFC9oNEYGiRRFBlUUIAVFCA70C7FrAUELFi8I/tszLQ0BMAsWLwj+dBgWEAgcAiYAAAEAJv+yAdcCkQAeAAA3FjMyNjc2PQEGIyImNDYzMh8BBw4BFREUBiMiJi8BZEE9ECsGDwkXZIiKci6BBjcWE1xRKD8ICw8gBgQcVKEBZ8JfBxYXCQ8O/kVgaRIGEwABADsApQCpARMABwAANiY0NjIWFAZaHx8vICClHy8gIC8fAAABAFr/EgELABIAFAAAFxYyNzY1NCMiIyc3MwceARQGIi8BZBc3FQk+BQYLHh8FJTJBWRAHuwkHDhU3DWhWAipJNQgKAAEAMwFNANQChgAMAAATNQcnNxcRFwcjJzc2aDAFXRgsBpIFLQQBe8QGFzYH/vYVExcRAQADAEABOAEmApIABgASABoAABM/ARcHJiM3FDMyNzY1NCMiBw4BJjQ2MhYUBkAMzwsLsh44NQ4NEDUODRAFPkNlPkMBRycEDC4D6EYFECtGBRCgQ2I/RGBAAAACACYABgIAAbwABgANAAAlByc3JzcXDwEnNyc3FwIA7x+pqR/v7csijo4iy9DKILu7IMofwRu0tBvBAAADACgAAQJSAoYAIgAvADcAAAAWFAcWFAYjIi8BNxYyNzY1NCciLwE3Mjc2NTQmIg8CJzYlNQcnNxcRFwcjJzc2ARcCAwcnEhMCGzIeI0dBHxgFCSNAGQQiLQkHBAE7HRwlDwMVJSz+tTAFXRgsBpIFLQQByQzy2EAM8tgBQDBVHB9KNQYOJwoKDA8mCwMJGwQOIBMdBSgFNSw7xAYXNgf+9hUTFxEBAQAL/s3+2w8LATMBJQADACgAAwJWAoYADAAjACsAABM1Byc3FxEXByMnNzYANjU0IyIPAic+ATIWFAYHMzcXByMnExcCAwcnEhNpMAVdGCwGkgUtBAFhPCwNDAMeKA9FRTc9Ok8aHAXPB7cM8thADPLYAXvEBhc2B/72FRMXEQH+8k0dOAUnBzQTHzVXTS8qB1UkAk8L/s3+2w8LATMBJQAABAAqAAACQAKGAA8AEgAfACcAACUjJz8BFxQXNxcHIxcHJzY1NwclNQcnNxcRFwcjJzc2ARcCAwcnEhMBt3oFgCUTAicHAysBNAkBAT/+8jAFXRgsBpIFLQQByQzy2EAM8thSHsQLBktuAQkmTgQIHlhjY/3EBhc2B/72FRMXEQEBAAv+zf7bDwsBMwElAAIAHP8xAWcBygASABoAADYGFBcWMjcXBwYjIiY0Nj8CFxIUBiImNDYytkwhIHw1CwskPWB/YF4IJg4QHzAfIC9cQHkdDBE2EhJinV4pVgKKASYwHyAuIAAD//MAAAKJA1oAFwAaAB8AACU0LwEjBxcHIyc3PgE3EzcXExcHIyc3NgsBMwMnPwEXAdMDLeg1VgbdBjcRCQfIPRTXTgb1BjcUpWLFCdMrFKFGBgd/mSMWFhcHDBMCLRII/awgFhYXCAHp/ucBzU03BHQAAAP/8wAAAokDYQAXABoAHwAAJTQvASMHFwcjJzc+ATcTNxcTFwcjJzc2CwEzAzcXDwEB0wMt6DVWBt0GNxEJB8g9FNdOBvUGNxSlYsW4rCkExEYGB3+ZIxYWFwcMEwItEgj9rCAWFhcIAen+5wHhezQURwAAA//zAAACiQNaABcAGgAhAAAlNC8BIwcXByMnNz4BNxM3FxMXByMnNzYLATMDNzMXBycHAdMDLeg1VgbdBjcRCQfIPRTXTgb1BjcUpWLF33goeBN5eUYGB3+ZIxYWFwcMEwItEgj9rCAWFhcIAen+5wHmb28TOzsAA//zAAACiQNVABcAGgAsAAAlNC8BIwcXByMnNz4BNxM3FxMXByMnNzYLATMTMDM3Fw8BIiYjMCMHJz8BMhYB0wMt6DVWBt0GNxEJB8g9FNdOBvUGNxSlYsUEATcRNBQahBEBNxE0FBqERgYHf5kjFhYXBwwTAi0SCP2sIBYWFwgB6f7nAhwvC2MFNC8LYwU0AAAE//MAAAKJA0oAFwAaACIAKgAAJTQvASMHFwcjJzc+ATcTNxcTFwcjJzc2CwEzAiY0NjIWFAYyJjQ2MhYUBgHTAy3oNVYG3QY3EQkHyD0U104G9QY3FKVixc4fHy8gIJcfHy8gIEYGB3+ZIxYWFwcMEwItEgj9rCAWFhcIAen+5wHXHy8gIC8fHy8gIC8fAAAE//MAAAKJA28AFwAaACYALgAAJTQvASMHFwcjJzc+ATcTNxcTFwcjJzc2CwEzAxQzMjc2NTQjIgcOASY0NjIWFAYB0wMt6DVWBt0GNxEJB8g9FNdOBvUGNxSlYsV6Kw0HDysNBw8GMzdVNDhGBgd/mSMWFhcHDBMCLRII/awgFhYXCAHp/ucCFzUFCx81BQt4Lk8vL04vAAL/8AAAAy8CigAmACkAAAEVMj8BFwcmIxU/ARcVISc3PgE9ASMHFwcjJzc2NwEnNyEVBy8BIgMRAwImSVsfCwtyUbswHv5SBjcSDeRWVgbxBjckDgEyVgYB7x4wmxtVxQI62ggCDDQF/QRYB4cWFwcQD3iSIxYWFw8XAf4jFocHWAT+qAFN/rMAAAEALv8SAjQCkgAvAAAXFjI3NjU0IyIjJzcuATU0NjMyFxYXBy8BJiIHBhUUFjMyNxcOASsBBx4BFAYiLwH+FzcVCT4FBgsXco26gl0zJA1BGAUujTFajGtRVg8acUsNAyUyQVkQB7sJBw4VNw1SEKmLorApHBZaB14QFlSah5ErHRoyPAIqSTUICgAAAgAiAAAB9ANaABwAIQAAExUyPwEXByYjFT8BFxUhJzc+ATURJzchFQcvASI3Jz8BF81fYiALC3dq2TAe/jQGNxINVgYBxx4wuRuh0ysUoQI42AkDDDgH+wRYB4kWFwcQDwH+IxaJB1gEfE03BHQAAAIAIgAAAfQDYQAcACEAABMVMj8BFwcmIxU/ARcVISc3PgE1ESc3IRUHLwEiJzcXDwHNX2IgCwt3atkwHv40BjcSDVYGAcceMLkbGKwpBMQCONgJAww4B/sEWAeJFhcHEA8B/iMWiQdYBJB7NBRHAAACACIAAAH0A1oAHAAjAAATFTI/ARcHJiMVPwEXFSEnNz4BNREnNyEVBy8BIic3MxcHJwfNX2IgCwt3atkwHv40BjcSDVYGAcceMLkbOngoeBN5eQI42AkDDDgH+wRYB4kWFwcQDwH+IxaJB1gElW9vEzs7AAMAIgAAAfQDSgAcACQALAAAExUyPwEXByYjFT8BFxUhJzc+ATURJzchFQcvASIuATQ2MhYUBjImNDYyFhQGzV9iIAsLd2rZMB7+NAY3Eg1WBgHHHjC5GykfHy8gIJcfHy8gIAI42AkDDDgH+wRYB4kWFwcQDwH+IxaJB1gEhh8vICAvHx8vICAvHwAAAgAiAAABIwNaABEAFgAAExEXByMnNz4BNREnNzMXBw4BNyc/ARfNVgb1BjcSDVYG9QY3Eg0u0ysUoQI3/gIjFhYXBxAPAf4jFhYXBxCMTTcEdAAAAgAiAAABIwNhABEAFgAAExEXByMnNz4BNREnNzMXBw4BJzcXDwHNVgb1BjcSDVYG9QY3Eg2VrCkExAI3/gIjFhYXBxAPAf4jFhYXBxCgezQURwAAAgAWAAABLgNaABEAGAAAExEXByMnNz4BNREnNzMXBw4BJzczFwcnB81WBvUGNxINVgb1BjcSDbd4KHgTeXkCN/4CIxYWFwcQDwH+IxYWFwcQpW9vEzs7AAMACAAAATwDSgARABkAIQAAExEXByMnNz4BNREnNzMXBw4BLgE0NjIWFAYyJjQ2MhYUBs1WBvUGNxINVgb1BjcSDaYfHy8gIJcfHy8gIAI3/gIjFhYXBxAPAf4jFhYXBxCWHy8gIC8fHy8gIC8fAAACACP/+QKTApIAFgAoAAATNSc3NjMgERQGIyIvATc+AT0BJiMnNyUjIh0BNxcHJicVFjMyNzYQJnlWBuI6AU6+zi+vBjcSDRwvCwwBJWsbpwsLUVYnPYRCPnQBXvMjFgj+qrKRBxYXBxAP1wEMJ/0Z4wcMNAIB9AQrTAEVngACACL/+ALKA1UAGwAtAAABEQcBERcHIyc3PgE1ESc3MwEVNxEnNzMXBw4BJzAzNxcPASImIzAjByc/ATIWAnRI/o5WBuIGNxINVganAWIBVgbiBjcSDacBNxE0FBqEEQE3ETQUGoQCN/3JCAIO/jMjFhYXBxAPAf4jFv4IAgIBvyMWFhcHENsvC2MFNC8LYwU0AAMALv/3ApMDWgALABkAHgAAEwYQFjMyNzYQJiMiAzQ2NzYgFhUUBgcGICYBJz8BF8k+cWtZOD5xaljVNCxcAQOmNC1a/vymAYbTKxShAi1V/vSWJUwBFZb+7lSEKFKwmlSDKFGuAixNNwR0AAMALv/3ApMDYQALABkAHgAAEwYQFjMyNzYQJiMiAzQ2NzYgFhUUBgcGICYTNxcPAck+cWtZOD5xaljVNCxcAQOmNC1a/vymyKwpBMQCLVX+9JYlTAEVlv7uVIQoUrCaVIMoUa4CQHs0FEcAAAMALv/3ApMDWgALABkAIAAAEwYQFjMyNzYQJiMiAzQ2NzYgFhUUBgcGICYTNzMXBycHyT5xa1k4PnFqWNU0LFwBA6Y0LVr+/KameCh4E3l5Ai1V/vSWJUwBFZb+7lSEKFKwmlSDKFGuAkVvbxM7OwADAC7/9wKTA1UACwAZACsAABMGEBYzMjc2ECYjIgM0Njc2IBYVFAYHBiAmATAzNxcPASImIzAjByc/ATIWyT5xa1k4PnFqWNU0LFwBA6Y0LVr+/KYBiQE3ETQUGoQRATcRNBQahAItVf70liVMARWW/u5UhChSsJpUgyhRrgJ7LwtjBTQvC2MFNAAEAC7/9wKTA0oACwAZACEAKQAAEwYQFjMyNzYQJiMiAzQ2NzYgFhUUBgcGICYSJjQ2MhYUBjImNDYyFhQGyT5xa1k4PnFqWNU0LFwBA6Y0LVr+/Ka3Hx8vICCXHx8vICACLVX+9JYlTAEVlv7uVIQoUrCaVIMoUa4CNh8vICAvHx8vICAvHwAAAQA9AIUBrwIGAA8AABM3FzcfAQcXDwEnBy8BNyc+JJSSJQGOjwEmkpEmAY6PAecelZYeEJOQECCVlR8QkZIAAAMALv+5ApMC3QAaACIAKgAAEzQ2NzYzMhc/ARcGBxYVFAYHBiMiJw8BJzcmFxYyNzYQJwIDBhAXNjcmIi40LFx+RT40OwsHQHU0LVqBTDstOwtBcMYunjg+QpiTPj13iDCUAUBUhChSG1wKDAxsWbhUgyhRHFEKDG9ZOR4lTAEhSv78AR9V/utJyvMbAAACABf/+AKjA1oAHQAiAAABERQGIyAZASc3MxcHDgEVERQWMjc2NREnNzMXBwYvAT8BFwJXdHv++0wG6wEyEg1dnjAyVgbYBi0fv9MrFKECN/7IjXoBBAFZHxYWFwcQD/7KYWoYNXkBVSMWFhMMfU03BHQAAAIAF//4AqMDYQAdACIAAAERFAYjIBkBJzczFwcOARURFBYyNzY1ESc3MxcHBiU3Fw8BAld0e/77TAbrATISDV2eMDJWBtgGLR/+uqwpBMQCN/7IjXoBBAFZHxYWFwcQD/7KYWoYNXkBVSMWFhMMkXs0FEcAAgAX//gCowNaAB0AJAAAAREUBiMgGQEnNzMXBw4BFREUFjI3NjURJzczFwcGJTczFwcnBwJXdHv++0wG6wEyEg1dnjAyVgbYBi0f/np4KHgTeXkCN/7IjXoBBAFZHxYWFwcQD/7KYWoYNXkBVSMWFhMMlm9vEzs7AAADABf/+AKjA0oAHQAlAC0AAAERFAYjIBkBJzczFwcOARURFBYyNzY1ESc3MxcHBiQmNDYyFhQGMiY0NjIWFAYCV3R7/vtMBusBMhINXZ4wMlYG2AYtH/6BHx8vICCrHx8vICACN/7IjXoBBAFZHxYWFwcQD/7KYWoYNXkBVSMWFhMMhx8vICAvHx8vICAvHwAC//YAAAJlA2EAHgAjAAAlNQMnNzMXBwYVFB8BNyc3MxcHDgEHAxUXByMnNz4BAzcXDwEBAsZGBvEGLxYFiJRWBuAGNxMRB6xWBvUGNxINK6wpBMRT1wEqIBYWFwoOBwfK5CMWFhcIEwv+9vQjFhYXBxACons0FEcAAAIAIgAAAfQCigAbACYAABMVNjMyFhUUIyInFRcHIyc3PgE1ESc3MxcHDgEXIyIdARYyNzY1NM0RHYF45SMfVgb1BjcSDVYG9QY3Eg1KLxsabigaAjdHAVZWqgNlIxYWFwcQDwH+IxYWFwcQiBnUBBQePYIAAQAX//gCCgKwADwAADcUFwcjJzc+ATURIyc3PgEzMhYVFA4CFB8BHgEVFAYiJic3HwEWMzI1NCYvASY1ND4CNzQ1NCYiBwYVrwoIlAYtEg1GBkwBcF1JTycvJx1CNSpMdE4MKRQEHSlJHyM4Ph4jMwk4bh0TTyYgCRYTBxAPAUMWImCGUzkmOBwqOhUwJzkpO0UoEVcFRxA5GykaKCxCHzUcJAkHBzM9Gh56AAMAJv/4AaYCsAAIACIAJwAANhYyPwEGBwYVFwYiJjQ2PwE2JiIPAic+ATMyFQcXDwEvARMnPwEXcy49MwKAHwGfQWw/aYQBAS1OHQgYNxZYPZUFRQZVFCAS0ysUoVsiEXQHJQUIZyZFazoIQS03CUwHThkwtd8YFhAIHAIMTTcEdAADACb/+AGmArcACAAiACcAADYWMj8BBgcGFRcGIiY0Nj8BNiYiDwInPgEzMhUHFw8BLwEDNxcPAXMuPTMCgB8Bn0FsP2mEAQEtTh0IGDcWWD2VBUUGVRQgtqwpBMRbIhF0ByUFCGcmRWs6CEEtNwlMB04ZMLXfGBYQCBwCIHs0FEcAAwAm//gBpgKwAAgAIgApAAA2FjI/AQYHBhUXBiImNDY/ATYmIg8CJz4BMzIVBxcPAS8BAzczFwcnB3MuPTMCgB8Bn0FsP2mEAQEtTh0IGDcWWD2VBUUGVRQg2HgoeBN5eVsiEXQHJQUIZyZFazoIQS03CUwHThkwtd8YFhAIHAIlb28TOzsAAAMAJv/4AaYCqwAIACIANAAANhYyPwEGBwYVFwYiJjQ2PwE2JiIPAic+ATMyFQcXDwEvARMwMzcXDwEiJiMwIwcnPwEyFnMuPTMCgB8Bn0FsP2mEAQEtTh0IGDcWWD2VBUUGVRQgCwE3ETQUGoQRATcRNBQahFsiEXQHJQUIZyZFazoIQS03CUwHThkwtd8YFhAIHAJbLwtjBTQvC2MFNAAEACb/+AGmAqAACAAiACoAMgAANhYyPwEGBwYVFwYiJjQ2PwE2JiIPAic+ATMyFQcXDwEvAQImNDYyFhQGMiY0NjIWFAZzLj0zAoAfAZ9BbD9phAEBLU4dCBg3Flg9lQVFBlUUIMcfHy8gIJcfHy8gIFsiEXQHJQUIZyZFazoIQS03CUwHThkwtd8YFhAIHAIWHy8gIC8fHy8gIC8fAAQAJv/4AaYCxQAIACIALgA2AAA2FjI/AQYHBhUXBiImNDY/ATYmIg8CJz4BMzIVBxcPAS8BAxQzMjc2NTQjIgcOASY0NjIWFAZzLj0zAoAfAZ9BbD9phAEBLU4dCBg3Flg9lQVFBlUUIHgrDQcPKw0HDwYzN1U0OFsiEXQHJQUIZyZFazoIQS03CUwHThkwtd8YFhAIHAJWNQULHzUFC3guTy8vTi8AAAMAJv/4AoABygAkAC0ANgAAATYyFh0BBwUeATI3Fw4BIyInBiMiJjQ2PwE2JiIPAic+ATMyFiYiBw4CBzcFFDMyPwEGBwYBVjegUw/+/AJLcj0OFFAxVDdXWEBCbIkBAS5VHQgYNxZbPl3+ME4cCwwQAcL+RFgqIwKGIAEBiUFmViUPEEpJGxoWKjw8RWw8DDosOAlMB04ZMINFDg0SPCsQglQWewomBQAAAQAm/xIBmQHKAC0AABcWMjc2NTQjIiMnNy4BNDYzMh4BFwcvASYiBwYUFjI3Fw4CKwEHHgEUBiIvAaMXNxUJPgUGCxdOXn9bLUYYBzoYCBZgIiZUhDkODCJLKQEDJTJBWRAHuwkHDhU3DVELeNF7IhoNTgdMBhEwsmEaGgwZGzwCKkk1CAoAAAMAJv/4AaICsAASABoAHwAAEjYyFh0BByEeATI3Fw4CIyImEyIHDgEHNzQvAT8BFyZ+qFYP/ugCUoE7DgwiSylddMcvHgwXAdYB0ysUoQFPe2NWIQ9NXBoaDBkbewEXDw9CHgZ4nk03BHQAAAMAJv/4AaICtwASABoAHwAAEjYyFh0BByEeATI3Fw4CIyImEyIHDgEHNzQnNxcPASZ+qFYP/ugCUoE7DgwiSylddMcvHgwXAdbOrCkExAFPe2NWIQ9NXBoaDBkbewEXDw9CHgZ4sns0FEcAAAMAJv/4AaICsAASABoAIQAAEjYyFh0BByEeATI3Fw4CIyImEyIHDgEHNzQnNzMXBycHJn6oVg/+6AJSgTsODCJLKV10xy8eDBcB1vB4KHgTeXkBT3tjViEPTVwaGgwZG3sBFw8PQh4GeLdvbxM7OwAEACb/+AGiAqAAEgAaACIAKgAAEjYyFh0BByEeATI3Fw4CIyImEyIHDgEHNzQuATQ2MhYUBjImNDYyFhQGJn6oVg/+6AJSgTsODCJLKV10xy8eDBcB1t8fHy8gIJcfHy8gIAFPe2NWIQ9NXBoaDBkbewEXDw9CHgZ4qB8vICAvHx8vICAvHwAAAv/2AAABBAKwAA0AEgAANxEvATcXERcHIyc3PgETJz8BF2RGBokUTwbgBi0SDWXTKxShTwErCxYvCP50IBYWEwcQAehNNwR0AAACABAAAAEEArcADQASAAA3ES8BNxcRFwcjJzc+AQM3Fw8BZEYGiRRPBuAGLRINVKwpBMRPASsLFi8I/nQgFhYTBxAB/Hs0FEcAAAIABwAAAR8CsAANABQAADcRLwE3FxEXByMnNz4BAzczFwcnB2RGBokUTwbgBi0SDV14KHgTeXlPASsLFi8I/nQgFhYTBxACAW9vEzs7AAP/9AAAAR4CoAANABUAHQAANxEvATcXERcHIyc3PgECJjQ2MhYUBjImNDYyFhQGZEYGiRRPBuAGLRINUR8fLyAgjR8fLyAgTwErCxYvCP50IBYWEwcQAfIfLyAgLx8fLyAgLx8AAAIAJv/4AdUCwgAfAC0AAAEUBiImNDYzMhcmJw4BDwInNy4BJzcWFz8BFwYHHgEHNjQnJiIHBhQWMzI3NgHVfMJxg1c2KyFGBxQGCRAfKw82AhItJicRJhQWU2RWAQo4eyMlQz8wJCkBDJCEf912G1I8ChkIDAIePgsjASERFDUCIhkcNrqbEUcuJhg0pWMPNAAAAgAYAAACIAKrACEAMwAAATQmIgcRFwcjJzc+ATURLwE3HwI2MzIdARcHIyc3PgE1AzAzNxcPASImIzAjByc/ATIWAYAvaDRPBuAGLRINRgaBFAIERUmQTwbgBi0SDRUBNxE0FBqEEQE3ETQUGoQBJTMtDf6+IBYWEwcQDwErCxYvCBwCJpn7IBYWEwcQDwIoLwtjBTQvC2MFNAAAAwAm//gB1AKwAAsAEwAYAAA3FDMyNzY1NCMiBwYSJjQ2MhYUBhMnPwEXe4kyJCWJMiQlH3SAunSAAtMrFKHstA8wX7QPMP6tet95et95AjBNNwR0AAADACb/+AHUArcACwATABgAADcUMzI3NjU0IyIHBhImNDYyFhQGAzcXDwF7iTIkJYkyJCUfdIC6dIDBrCkExOy0DzBftA8w/q1633l633kCRHs0FEcAAAMAJv/4AdQCsAALABMAGgAANxQzMjc2NTQjIgcGEiY0NjIWFAYDNzMXBycHe4kyJCWJMiQlH3SAunSA6HgoeBN5eey0DzBftA8w/q1633l633kCSW9vEzs7AAMAJv/4AdQCqwALABMAJQAANxQzMjc2NTQjIgcGEiY0NjIWFAYDMDM3Fw8BIiYjMCMHJz8BMhZ7iTIkJYkyJCUfdIC6dIAFATcRNBQahBEBNxE0FBqE7LQPMF+0DzD+rXrfeXrfeQJ/LwtjBTQvC2MFNAAABAAm//gB1AKgAAsAEwAbACMAADcUMzI3NjU0IyIHBhImNDYyFhQGAiY0NjIWFAYyJjQ2MhYUBnuJMiQliTIkJR90gLp0gNcfHy8gIJcfHy8gIOy0DzBftA8w/q1633l633kCOh8vICAvHx8vICAvHwAAAwAvAHgB2wITAAYADgAWAAATNyUXByQjNiY0NjIWFAYCNDYyFhQGIi8MAZULC/6JH7QdHiweHkoeLB4eLQE1LQIMMQKCHS0eHiwe/ussHh4sHgAAAwAm/7AB1AIIABMAGwAjAAAXNyY0NjMyFz8BFwcWFAYjIicPARMGFBc2NyYiExYyNzY0JwY5PE9/XTAoJDcMOUyAXS0mKDdbJSJaQRxYAhpWJCUfeEVmP/F5EUMMC2A973kPSwwByzC2Lp13D/66DA8wsyzTAAIAB//4AgUCsAAZAB4AABciPQEvATcXERQWMjcRLwE3FxEXDwEvAgYTJz8BF+OQRgaJFC9oNEYGiRRFBlUUIAVFItMrFKEImekLFi8I/tszLQ0BMAsWLwj+dBgWEAgcAiYCME03BHQAAgAH//gCBQK3ABkAHgAAFyI9AS8BNxcRFBYyNxEvATcXERcPAS8CBgM3Fw8B45BGBokUL2g0RgaJFEUGVRQgBUWDrCkExAiZ6QsWLwj+2zMtDQEwCxYvCP50GBYQCBwCJgJEezQURwACAAf/+AIFArAAGQAgAAAXIj0BLwE3FxEUFjI3ES8BNxcRFw8BLwIGAzczFwcnB+OQRgaJFC9oNEYGiRRFBlUUIAVFuXgoeBN5eQiZ6QsWLwj+2zMtDQEwCxYvCP50GBYQCBwCJgJJb28TOzsAAAMAB//4AgUCoAAZACEAKQAAFyI9AS8BNxcRFBYyNxEvATcXERcPAS8CBgImNDYyFhQGMiY0NjIWFAbjkEYGiRQvaDRGBokURQZVFCAFRagfHy8gIJcfHy8gIAiZ6QsWLwj+2zMtDQEwCxYvCP50GBYQCBwCJgI6Hy8gIC8fHy8gIC8fAAL/+v8SAgsCtwAaAB8AABMGFBcbASc3MxcHBgcGBwMGBy8BNjcDJzczFyc3Fw8BtRMFbXBHBsIGMRMJAgWORTVLCGkkqEcG3AY2rCkExAGZCBsL/v8BIiAWFhUIEQYN/qGqUBgUcVABjSAWFpB7NBRHAAL/+f8cAdQCsAAZACMAAAEyFhQGIyInFRcHIyc3PgE1ES8BNxcVFxU2AxYyNzY1NCMiBwEfWF1/Xy4yTwbgBi0SDUYGhxQCQ0ModSclhDE0AcqG03kJryAWFhMHEA8C9QsWLwj/AwEl/nwODzFerw0AAAP/+v8SAgsCoAAaACIAKgAAEwYUFxsBJzczFwcGBwYHAwYHLwE2NwMnNzMXLgE0NjIWFAYyJjQ2MhYUBrUTBW1wRwbCBjETCQIFjkU1SwhpJKhHBtwGUR8fLyAglx8fLyAgAZkIGwv+/wEiIBYWFQgRBg3+oapQGBRxUAGNIBYWhh8vICAvHx8vICAvHwABABgAAAEEAcoADQAANxEvATcXERcHIyc3PgFkRgaJFE8G4AYtEg1PASsLFi8I/nQgFhYTBxAAAAEAEQAAAf4CigAfAAATNjcRJzczFwcOAR0BNx8BBgcRPwEXFSEnNz4BPQEHJxEmRlYG9QY3Eg1WDhM4P94wHv4vBjcSDVMQAQUWKgEMIxYWFwcQD743BDQfI/7+BFgHiRYXBxAPsy0FAAABAAUAAAEZArAAGQAANzUGBy8BNzUvATcXETcfAQYHERcHIyc3PgFkGiwQCV9GBokURA8RLzVPBuAGLRINT9UOGQUoOP4LFi8I/uwsBTMZHv7lIBYWEwcQAAACAC7/+AOyApEAIgAzAAATNDc2MzIXNTchFQcvASIdATI/ARcHJiMVPwEXFSEnNQYgJhMGEBYzMjc+AT8BNDU0JiMiLi5WtoJMCgFtHjC5G19iIAsLd2rZMB7+jgpS/u+lmz5xa1k4IRgEAXFrVwFAb06UWEcKiQdYBB7YCQMMOAf7BFgHiQpNX68BhlX+9JYlLExPEQoKc5gAAwAm//gC+wHKAB0AKgAyAAAWJjQ2MzIWFz4BMzIWHQEHIR4BMjcXDgEiJicOASMnFDMyNzY9ASYjIgcGJSIHDgEHNzSadH9ZOl4WGGE2S1UP/ugCUoE7DhtcYF8VF2M6eIkyJCUDhjIkJQHLLx4MFwHWCHvdejMrKzNkVSEPTVwaGh4iMyoqM/S0Dy9dC6wPMD8PD0IeBngAAAIAI//4AdsDWgAjACoAAAEmIgcGFRQfARYVFAYjIic3HwEWMzI1NCYvASY1NDYzMhcHLwI3FzcXBwFrIYssDFKCgHphhldAGA8lRpU0N3N1fGB1R0cYhXgTeXkTeAJCEiUTJE0fMjGAV1pSbQdgGmUpNBUsLXVYX1JjB/RvEzs7E28AAAIAIP/4AWwCsAAnAC4AAAEmIgcGFRQfAR4BFRQGIiYnNx8BFjMyNTQmLwEuATU0NjMyFxYXBy8CNxc3FwcBCxdfGAkzZis0YIFXFDMZBCM2WyAkXCksZEIoIzERNxhheBN5eRN4AYoKGA4TKhMkD0MtP0QrGFMHQxQ+GR4MHg5AKD9GEBUaTgfqbxM7OxNvAAP/9gAAAmUDSgAeACYALgAAJTUDJzczFwcGFRQfATcnNzMXBw4BBwMVFwcjJzc+AQImNDYyFhQGMiY0NjIWFAYBAsZGBvEGLxYFiJRWBuAGNxMRB6xWBvUGNxINWh8fLyAgqx8fLyAgU9cBKiAWFhcKDgcHyuQjFhYXCBML/vb0IxYWFwcQApgfLyAgLx8fLyAgLx8AAAIAGQAAAgIDWgANABQAACkBJwEFByc1IRcBJTcXAyc3FzcXBwH8/iMGAXb++DEeAcQG/o8BHDEe+XgTeXkTeB0COQJaB4kh/csCWgcCT28TOzsTbwAAAgAcAAABhQKwAA4AFQAAKQEnAQ8BJzU3IRcBPwEXAyc3FzcXBwGF/p0GAQOnMBgKAUUG/wC4MBjEeBN5eRN4HQF3BFQHdQoh/o0EVAcBr28TOzsTbwABACD/pQH+ArAAGgAAATIXBy8BIgcGBzMXBycjAw4BByc2NxMHJzc2AY1OIzwYA0QkEh5tCwluCTUMWEQKTBYyQQdTLAKwMVIHSBQYowwmBP7iQ2UUFTt1ARQBFiX4AAABAA3/EgCqAcoACwAAMxQGByc2NREvATcXqk1CDkxGBokUUHklEll7AYILFi8IAAABACgCLgFAArAABgAAEzczFwcnByh4KHgTeXkCQW9vEzs7AAABACgCLgFAArAABgAAEyc3FzcXB6B4E3l5E3gCLm8TOzsTbwABACICOACQAqYABwAAEiY0NjIWFAZBHx8vICACOB8vICAvHwACAFoCGQEaAsUACwATAAATFDMyNzY1NCMiBw4BJjQ2MhYUBpMrDQcPKw0HDwYzN1U0OAJyNQULHzUFC3guTy8vTi8AAAEAJQIzAWUCqwARAAABMDM3Fw8BIiYjMCMHJz8BMhYBHAE3ETQUGoQRATcRNBQahAJ3LwtjBTQvC2MFNAAAAQA/AMUCHgEJAAgAAD8BMj8BFwckIz8M3KtBCwv+dD3ZJwYDDDgIAAEAPgDCAzoBCgAIAAA/ASAlNxcHJCM+DAEtAUpuCwv9dFrZJwgCDDwLAAEALwHKAKUCsAALAAASJjQ2NxcGFB8BByNEFTsrEDkuAzgUAdczRUoXEi1aHxQaAAEALwHKAKUCsAALAAASFhQGByc2NC8BNzOQFTsrEDkuAzgUAqMzRUoXEi1aHxQaAAEAK/+BAKEAZwALAAA2FhQGByc2NC8BNzOMFTsrEDkuAzgUWjNFShcSLVofFBoAAAIALwHKAUUCsAALABcAABImNDY3FwYUHwEHIzYmNDY3FwYUHwEHI0QVOysQOS4DOBSTFTsrEDkuAzgUAdczRUoXEi1aHxQaDTNFShcSLVofFBoAAAIALwHKAUUCsAALABcAABIWFAYHJzY0LwE3Mx4BFAYHJzY0LwE3M5AVOysQOS4DOBStFTsrEDkuAzgUAqMzRUoXEi1aHxQaDTNFShcSLVofFBoAAAIAK/+BAUEAZwALABcAADYWFAYHJzY0LwE3Mx4BFAYHJzY0LwE3M4wVOysQOS4DOBStFTsrEDkuAzgUWjNFShcSLVofFBoNM0VKFxItWh8UGgABABr/NwHAAnUAHAAAAQcmJyYnFhcGByMmJzY3BgcnNxYXNCc3FwYHNjcBwAsOIVYlBAsPDCkMEAwHOWwOC3gwFlwOFAJDZAGkSAEECwFPYp7n8ZVQYAMMDkgPAgXDCg2dKAMOAAABACb/PAHMAnUALwAAAQcmJyYnFhcGBzY3FwcmJyYnFhcHJzY3BgcnNxYXJic2NwYHJzcWFzQnNxcGBzY3AcwLDiFWJQUNDQVDZA4LDiFWJQYSXA4OBjlsDgt4MAQMDAQ5bA4LeDAWXA4UAkNkAaRIAQQLAT9OVjcDDhBIAQQLAWVyCg1wZAMMDkgPAkdHRUcDDA5IDwIFwwoNnSgDDgAAAQBMAOMBAwGaAAcAADYmNDYyFhQGfzM0TjU14zNPNTVONAAAAwA0//gCRgBmAAcADwAXAAAWJjQ2MhYUBjImNDYyFhQGMiY0NjIWFAZTHx8vICCjHx8vICCjHx8vICAIHy8gIC8fHy8gIC8fHy8gIC8fAAAGACUAAAODAooAFAAcACgANABAAEgAACAmNDYzMhYXPgEzMhYUBiMiJicOAQAmNDYyFhQGFxQzMjc2NTQjIgcGARQzMjc2NTQjIgcGARQzMjc2NTQjIgcGAxcCAwcnEhMB2EtXOiQ7DxI/JDVNVjsmOw4RPv48S1d2TVbiVSAWElQgFhP+mFUgFhJUIBYTAkRVIBYSVCAWE0QM8thADPLYRp1aJB0cJU+dUSEZGSEBTUadWk+dUal1Cyc3dgsoARZ1Cyc3dgso/nt0Cyc3dgsoAaML/s3+2w8LATMBJQABAB4ACQERAbkABgAANyc1NxcHF+3PzySNjQnJHskguLgAAQAkAAkBFwG5AAYAACUHJzcnNxcBF88kjY0kz9LJILi4IMkAAf/7AAwCEQJ+AAcAAAEXAgMHJxITAgUM8thADPLYAn4L/s3+2w8LATMBJQACAB8ADAI1An4AFQAqAAABMh4BFwcvASYiBwYHJRcHISc3Mz4BEzI2NxcOASMiJicjJzchFwcmJx4BAYUwUyEDMxYFI3gwQhABGAoK/lkKCzwVn3YmVxEOFGs8X44ZSgsMAZsLC355GW0CfiMfB1cGUgwVOW8EDCsLKHiB/cgWCRwUKXFmDCcMKwIBTk4AAgBEAawCRgKKABwALQAAASMPAS8BIxUXByMnNy8BNTMfATczFwcVFwcjJzcnFQcnIxUXByMnNzUjBgcnNQH6Az8XDkQCGAJTAx0BHFgJPkNVAh4dAWACGPwVESAdA2QCHiMLBRMCQ5AHBJyEBhYVB6YGFgaVmxYGpgcVFgfBOwMfowcVFQejFAsDOwABAD8BJwHXAWQABgAAEzclFwckIz8MAYELC/6dHwE1LQIMMQIAAAIAFwAAAm0CsAAtADYAAAEmIgcGHQEzFwcnERcHIyc3PgE1EScRFwcjJzc+ATURByc3NDc2MzIXNjMyHwEFMzQ3JiMiBwYCXydMGA5tCwpuXgbvBi0SDcFFBtYGLRINRgZMPEFqQE8sNx0NB/5HwSgjPlAlEwJiBwweXx4MJgT+qScWFhMHEA8BQgP+nhwWFhMHEA8BRAEWImI/RRkXBhXRYjwPGx4AAAEAFwAAAh8CsAAmAAA3EQcnNz4BMhcHJyYnJiIHBhUlFxEXByMnNz4BNREnERcHIyc3PgFjRgZMAnDIPDwSDR0fYRoTAQgUTwbgBi0SDctPBuAGLRINTwFEARYiY4NINQUUERIVHnoICP50IBYWEwcQDwFCA/6iIBYWEwcQAAEAFwAAAh8CsAAoAAABJiIGBwYVMxcHJxEXByMnNz4BNREHJzc0Njc2Mhc3FxEXByMnNz4BNQF/Lj87EBNtCwpuTwbgBi0SDUYGTHlNCjksJBRPBuAGLRINAl4MBw8edAwmBP6iIBYWEwcQDwFEARYiYIEEAQwMCP2OIBYWEwcQDwACABcAAAMxArAANwBAAAA3EQcnNzQ3NjMyFzYzMhcHJyYnJiIHBhUlFxEXByMnNz4BNREnERcHIyc3PgE1EScRFwcjJzc+ARIVMzQ3JiMiB2NGBkw8QWpATzA+aDw8Eg0dH2EaEwEIFE8G4AYtEg3LTwbgBi0SDcFFBtYGLRINUcEoJD1QJU8BRAEWImI/RRkZSDUFFBESFR56CAj+dCAWFhMHEA8BQgP+oiAWFhMHEA8BQgP+nhwWFhMHEAH2dGI8DxsAAgAXAAADMQKwADYAPgAAASYiBgcGFTMXBycRFwcjJzc+ATURJxEXByMnNz4BNREHJzc0NzYzMhc2Mhc3FxEXByMnNz4BNQEzNDcmIgcGApEuPzsQE20LCm5PBuAGLRINwUUG1gYtEg1GBkw8QWlEVTRyIiQUTwbgBi0SDf4jwS8uiyQTAl4MBw8edAwmBP6iIBYWEwcQDwFCA/6eHBYWEwcQDwFEARYiYj9FHBsLDAj9jiAWFhMHEA8Bc10+ERoeAAABABf/EgHZArAAJAAANxEHJzc+ATIXBycmJyYiBwYVNxcRFAYHJzY1EScRFwcjJzc+AWNGBkwCcMg8PBINHR9hGhP+FE1CDkzBTwbgBi0SDU8BRAEWImODSDUFFBESFR56CAj+PlB5JRJZewGZA/6iIBYWEwcQAAACABf/EgLrArAANQA+AAA3EQcnNzQ3NjMyFzYzMhcHJyYnJiIHBhU3FxEUBgcnNjURJxEXByMnNz4BNREnERcHIyc3PgESFTM0NyYjIgdjRgZMPEFqQE8wPmg8PBINHR9hGhP+FE1CDkzBTwbgBi0SDcFFBtYGLRINUcEoJD1QJU8BRAEWImI/RRkZSDUFFBESFR56CAj+PlB5JRJZewGZA/6iIBYWEwcQDwFCA/6eHBYWEwcQAfZ0YjwPGwAAAQAAAOsDiAATAAAAAAACAAAAAQABAAAAQAAAAAAAAAAAACEAIQAhACEAPgBWAKIA7gE8AagBtwHVAfECDwIyAkoCXgJwAoYCqgLIAvQDMwNeA5IDywPpBCkEXwR9BKAEuATXBPAFHQV8Ba0F8AYbBksGegaqBuAHHwdAB14HnAfAB/8IMQheCJEI1wkbCVIJeQmqCdUKDgpVCokKqArECtwK9wsJCxsLKgtiC4wLtQvoDBUMSAypDN4NBg0pDVsNdw3FDfsOHQ5VDoYOtg7zDxYPQQ9sD6sP2xAMECsQfRCUEOYRFBEUETARZRGwEeoSPBJfEqMSwBMDE0ATXRN1E9YT+BQmFEwUghSRFMQU8xUFFScVQRVuFYwV5hYwFncWoxbdFxcXUxecF+QYMBh1GLsY8xkrGWUZqxnVGf8aKxpjGqIa6xshG1cbjxvUHBgcOBx/HLkc8x0wHXgdtR3vHkUehh7HHwsfWx+qH/4gUyCXIM0hAyE7IX8hpCHJIfAiIyJsIroi5SMQIz0jdyOwI9okFSRJJH0ktCT2JS8laCWvJcsmACYtJnomxycJJ1EnnCfHJ/IoIig6KEwoXihwKJIosSjFKNoo8ikKKSIpTCl2KZ8p0ioiKjQqXCrLKtwq7isEK0srkSukK/gsNyx4LNotOy13LdYAAQAAAAEAAOVMS8VfDzz1AAsD6AAAAADMj2sqAAAAAMyPayr/8P8SA/YDbwAAAAgAAgAAAAAAAAI4ADIAAAAAAU0AAADcAAAA9QBFAUEALQJXAB4BzQAeAsUAIgKnACoAsAAtAR0AJQEdAAoBuwAlAf0AHgDTACsBjgA8ANYANAGgABYCTgAxAV4AHgICACEB6gAcAfoACwHSACcB/wAuAcoAGwILADEB/QAfAOQAOwDrADkBvwAeAhgAQQG/ADkBiAAeA84AKAJ8//MCaQAiAk8ALgLCACICIQAiAg8AIgKXAC0C3QAiAUUAIgE0ABkCggAiAggAIgNtABgC5AAiAsEALgIgACICwgAuAlgAIgIFACMCHwATArsAFwJ+//QD0P/3AoYABAJW//YCKQAZASAATwGXABcBIAASAcEAKAJUADkBJQAdAa8AJgH2//UBsgAmAgoAJgHHACYBOQAXAb4AEwIVAAoBDwAYAO8ADQIBAAoBBQAOAz8AGAIjABgB+gAmAg4ADQH6ACYBgwAYAZEAIAExAAoCFgAHAgD//QLy//sB+AAIAgn/+gGtABwBMQAWAOMAUAExABICMAA8ANwAAADjADoBpAApAeIAJwKSADACoQAZAOAATQGkAB8BeAAiAyoAKwFXADgCGAAYAkIAPQM+ACsBUAArAdIAOwFGADMBLQAyASUAKAI2AB8B8QAmAOQAOwFlAFoA/gAzAWYAQAIYACYCfgAoAn8AKAJdACoBggAcAnz/8wJ8//MCfP/zAnz/8wJ8//MCfP/zA1z/8AJPAC4CIQAiAiEAIgIhACICIQAiAUUAIgFFACIBRQAWAUUACALDACMC5AAiAsEALgLBAC4CwQAuAsEALgLBAC4B7AA9AsAALgK7ABcCuwAXArsAFwK7ABcCVv/2AhEAIgIfABcBrwAmAa8AJgGvACYBrwAmAa8AJgGvACYCpgAmAbIAJgHHACYBxwAmAccAJgHHACYBD//2AQ8AEAEPAAcBD//0AgQAJgIjABgB+gAmAfoAJgH6ACYB+gAmAfoAJgILAC8B+gAmAhYABwIWAAcCFgAHAhYABwIJ//oB+v/5Agn/+gEPABgCDQARARkABQPfAC4DIAAmAgUAIwGRACACVv/2AikAGQGtABwCDAAgAO8ADQFoACgBaAAoALIAIgF0AFoBjQAlAlkAPwNzAD4AyQAvAMwALwDTACsBaQAvAWwALwFzACsB2QAaAfIAJgFPAEwCegA0A6AAJQE1AB4BNQAkAgv/+wJhAB8ChABEAhYAPwJLABcCKAAXAioAFwM6ABcDPAAXAgkAFwMbABcAAQAAA2//EgAABEv/8P9wA/YAAQAAAAAAAAAAAAAAAAAAAOsAAgGYAZAABQAAArwCigAAAIwCvAKKAAAB3QA6AOEAAAIABQMAAAACAAOAAACvQAAASgAAAAAAAAAAUFlSUwBAACD7BANv/xIAAANvAO4AAAABAAAAAAHCAooAAAAgAAMAAAACAAAAAwAAABQAAwABAAAAFAAEAPgAAAA6ACAABAAaAH4ArACuAP8BMQFCAVMBYQF4AX4BkgI3AscC2gLcA7wgFCAaIB4gIiAmIDAgOiBEIKwhIiIS+wT//wAAACAAoACuALABMQFBAVIBYAF4AX0BkgI3AsYC2QLcA7wgEyAYIBwgICAmIDAgOSBEIKwhIiIS+wD////j/8L/wf/A/4//gP9x/2X/T/9L/zj+lP4G/fX99Py54L7gu+C64LngtuCt4KXgnOA138De0QXkAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAQAMYAAwABBAkAAACwAAAAAwABBAkAAQAKALAAAwABBAkAAgAOALoAAwABBAkAAwAyAMgAAwABBAkABAAKALAAAwABBAkABQAOAPoAAwABBAkABgAKALAAAwABBAkABwBMAQgAAwABBAkACAAaAVQAAwABBAkACQAaAVQAAwABBAkACwAuAW4AAwABBAkADAAuAZwAAwABBAkADQEgAcoAAwABBAkADgA0AuoAAwABBAkAEAAKALAAAwABBAkAEQAOALoAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADIAIABiAHkAIABGAGUAcgBuAGEAbgBkAG8AIABEAGkAYQB6ACAAKABmAGUAcgBAAGYAZQByAGYAbwBsAGkAbwAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACcARgBlAG4AaQB4ACcALgBGAGUAbgBpAHgAUgBlAGcAdQBsAGEAcgBGAGUAcgBuAGEAbgBkAG8ARABpAGEAegA6ACAARgBlAG4AaQB4ADoAIAAyADAAMQAyADAAMAA0AC4AMwAwADEARgBlAG4AaQB4ACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAARgBlAHIAbgBhAG4AZABvACAARABpAGEAegAuAEYAZQByAG4AYQBuAGQAbwAgAEQAaQBhAHoAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8AdAB5AHAAZQAuAGMAbwBtAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBmAGUAcgBmAG8AbABpAG8ALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAP+RADoAAAAAAAAAAAAAAAAAAAAAAAAAAADrAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcApgEDANgA4QDcAN0A2QCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQQAjADvAQUAwADBAQYBBwEIAQkHdW5pMDBBMAhkb3RsZXNzagRFdXJvAmZmA2ZmaQNmZmwCZmoDZmZqAAEAAf//AA8AAQAAAAwAAAAAAAAAAgACAAMA4wABAOQA6gACAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAACAAoKvgABAIoABAAAAEABDgE0AUIBgAGOAaABsgHYAf4COAJOAmACfgKQAqYC7AL6AxgDKgMwA3IDqAPiBBAERgRkBHYEoATKBRAFagV4BeIGRAZ2BrAHDgcoCqoHVgdwB6oHzAgCCCAIVgiMCLoJDAkaCSgJLglMCWoJcAmyCfwKAgogCmIKdAqKCpgKqgABAEAAAwAJAAsADAANAA4AEgATABQAFQAWABcAGAAZABoAGwAcACMAJAAlACkAKgAtAC4AMAAxADMANAA1ADcAOAA5ADoAOwA8AD4APwBHAEkASgBOAFQAVQBXAFkAWgBbAF4AYABjAHAAdwB/AJEAngCfAK4ArwCwALcAwgDgAOMA5AAJADf/6AA5/+AAOv/hADv/8QBZ/+kAWv/qAFv/9gCG/90Awv/yAAMAN//nADn/6QA6/+wADwAL/+wAE//mABT/9gAX/+MAGP/2ABn/5AAb/+sAHP/uAFP/9QBX/+MAWf/kAFr/5ABb//AAXv/yAIb/9gADAAz/7ABA/+4AYP/vAAQANwAFAEr/8wCG/7IArwAIAAQAFP/vABX/5wAW/+0AGv/xAAkAEv/TABP/9gAX/+AAGf/qAEr/4wBT/+8AV//xAFv/8QCG/8AACQAM/+UAOf/0ADr/9QA7//MAP//1AED/6gBg/+oAhv/rAOD/9QAOAAz/9QAO//UAOwAFAD//8wBA/+0AYP/tAGT/9gBw//MAd//wAIYAGQCX//YAt//wAOAADgDj/+4ABQAM//AAP//2AED/7QBg/+0At//2AAQADP/qAED/6wBg/+wAhv/yAAcADP/pADf/9QA///EAQP/sAGD/7QBw/+8Ahv/zAAQADP/zAED/8ABg//QAhv/0AAUADP/tADf/9QBA/+8AYP/wAHD/7wARAAb/8wAO/+4AEv/aABf/5QAZ//AANwAJADkAIwA6ACAAOwAOAED/7wBg//EAZP/yAHf/1ACG/8YAt//qAOD/zADj/+oAAwAM/+oAQP/rAGD/7AAHAAz/5gAS/+8AO//yAED/6QBg/+oAhv/bAOD/5gAEADn/8QA6//MAO//yAIb/7QABAMIADAAQAAz/6gAt//oAMP/7ADf/+wA5//AAOv/yADv/7QBA/+oASv/6AFP/+gBX//oAWf/1AFr/9gBb//AAYP/qAIb/8AANAAP/6QAS/+MAF//zACP/8ABA//AASv/jAFP/+gBb//kAYP/yAIb/rgCsAAsArwAOAMD/9AAOAAP/7wAM/+oALf/7ADf/+QA5//MAOv/3ADv/8gBA/+wAWf/yAFr/8wBb//UAYP/rAIb/9gDi//gACwBA//UASv/sAFP/6wBX/+sAWf/pAFr/6wBb//EAhv/1AKwABgCvAAkAwP/qAA0AA//yABP/9QAX/+0AGf/1AEr/8QBT//gAV//2AFn/uwBa/70Aa//vAG//7wCsABMArwAUAAcAQP/yAEr/8ABT//AAV//tAFn/4wBa/+MAYP/2AAQARQAHAKwABgCvAAkAwP/pAAoAA//pAAz/7QAS/+QAF//1ADD/+AA7/+QAQP/tAEr/9wBg/+0Ahv+xAAoADACSAA8AbwAeAGEAIwAfAEAAmgBKAJIATQBlAGAAlQDVAG8A2ABvABEAA//tAAz/9QAN//YAF//xAC3/+gA3//sAOf/oADr/7AA///EAQP/tAEr/+QBZ//QAWv/2AGD/6wBs//UAev/2AOL/9gAWAAP/6AANAAUAEv/lABf/4AAZ//IAI//oAED/8QBK/78AU//EAFf/4QBZ/9MAWv/VAFv/3QBg//QAhv+8AKL/xQCj/9kApP/UAKwADgCu//wArwARAMD/wwADAKwACACvAAoAwP/pABoAA//hABL/1gAX/+EAGf/pABoACAAiAAwAI//fAED/9gBK/8QAU//UAFf/3gBZ/90AWv/gAFv/4wBr//MAb//yAIb/tQCg/8wAo//gAKT/8QCr/84ArAAsAK8ALgDA/80AwgALAMb/zgAYAAP/4QAS/9sAF//lABn/7AAaAAcAIgALACP/4wBA//YASv/NAFP/3gBX/+YAWf/kAFr/5wBb/+sAa//1AG//9ACG/7sAo//eAKT/7wCsACsArwAtAMD/1wDCAAoAxv/NAAwAA//xABP/9gAX/+8ASv/0AFP/+ABX//YAWf/KAFr/zgBr//EAb//wAKwAEwCvABQADgCg/84Ao//iAKT/8wCl/78AqP+nAKv/0QCsAC8ArwAxALX/tQC2/8YAwP+8AMIADQDG/9EAyf/BABcAC//uABP/6gAU/+4AFf/uABb/7gAX/+oAGP/wABn/6AAa/+8AG//rABz/7QAw//EAN//xADn/9QA6//QAO//0AFP/9gBX/+cAWf/rAFr/6wBb/+sAXv/0AIb/7QAGADf/5gA5/9cAOv/bAFn/6ABa/+kAhgASAAsADP/0AA3/+AAt/+8AN//2ADn/+QA6//oAQP/wAGD/8QBs//gAev/4AOL/+AAGAC3/5QAw//sAN//lADn/3wA6/+QAP//1AA4AA//0AAz/8wAN/+0ALf/wADf/0AA5/88AOv/XAD//6wBA/+0ASv/5AGD/6wBs//UAev/1AOL/8QAIAA3/9gAt//gAMP/3ADf/zgA5/88AOv/ZAD//6wDi//cADQAD/+wADP/iABL/8gAt/+YAMP/mADf/ugA5/9oAOv/fADv/1QA///IAQP/pAGD/6wCG/9IABwAM//MALf/3ADf/2gA5/+QAOv/nAED/8ABg//AADQAD/+kADP/kABL/5wAt/+oAMP/kADf/0wA5/90AOv/kADv/zABA/+sASv/1AGD/7QCG/7sADQAD/+oADP/jABL/6AAt/+cAMP/iADf/1QA5/94AOv/jADv/zQBA/+kASv/2AGD/7ACG/78ACwAD//YADP/wAA3/+AAt//EAN//aADn/3wA6/+cAP//wAED/7ABK//kAYP/qABQAC//vABP/6wAU/+4AFf/uABb/7wAX/+wAGP/yABn/6QAa//QAG//sABz/7gAw//QAN//zAFP/9gBX/+kAWf/tAFr/7ABb/+sAXv/zAIb/6gADAAz/8gBA//QAYP/zAAMAN//pADn/5AA6/+gAAQAX/9wABwAU/+sAFf/vABb/6gAY//IAGv/kABz/7wAv/+oABwAw/+8AN//UADn/1wA6/9oAO//oAFv/8wCG/+0AAQBFAAcAEAAM/+IAEv/0ABX/8QAW//UALf/1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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/98AAAAAAAAAAAAA/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/mAAAAAP/qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/tAAD/z//p/+0AAAAA//H/1wAA//X/9v/2//UAAAAAAAD/7f/v/+gAAP/1/9sAAAAA/+D/8gAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+gAD//e/87/0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+H/6f/pAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//D/zQAAAAAAAP/uAAAAAP/0//T/6f/p//QAAAAAAAAAAAAAAAD/8v/pAAAAAP/0AAAAAAAAAAAAAAAAAAAAAAAAAAD/9P/2AAAAAAAAAAAAAP/xAAD/8f/xAAAAAAAAAAAAAP/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFQAA//MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAAAAD/7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9kAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9X/xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1/+8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+wAAAAAAAAAAAAAAAAAAAAA/+b/8AAAAAD/7AAAAAD/4QAAAAAAAP/tAAAAAAAAAAAAAAAAAAAAAP/uAAAAAAAAAAAAAP/z/+MAAAAAAAAAAAAA/+AAAP/f/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7//y//QAAAAAAAD/8QAAAAD/5//s//P/8//pAAAAAP/oAAAAAAAA/+n/7QAAAAD/8gAAAAAAAAAA/+0AAAAA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/+wAAP/rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9f/0/+sAAAAAAAD/+gAAAAAAAP/7//r/9v/7AAAAAAAAAAAAAAAA//r/+gAAAAAAAAAAAAD/+gAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9sAAAAAAAAAAP/7AAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+L/vf/sAAD/7f/2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//QAAP/nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAD/4gAA//AAAP/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6f/4AAAAAAAAAAAAAAAAAAAAAP/6AAAAAP/7//b/9P/5/+n/6//0//gAAP/6//sAAP/6AAD/+QAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAP/5AAD/+gAAAAAAAAAAAAAAAP/tAAAAAAAA/+4AAAAAAAD/7gAAAAAAAAAAAAAAAAAA/+T/4f/0AAAAAP/zAAAAAAAAAAD/+v/2AAAAAAAAAAAAAAAAAAAAAP/5AAAAAP/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8wAAAAD/2QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//QAAP+x/+D/4wAAAAD/8P/IAAAAAAAAAAAAAAAAAAAAAP/0//UAAAAA/+v/sgAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAA//kAAP/eAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5gAA/+X/1v/j/+D/8//2/+sAAAAAAAAAAAAAAAD/9f/z/6D/3f/gAAD/6//s/7QAAAAAAAD//AAAAAAAAAAA//T/9v/uAAD/5v/B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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//wAAP+6//D/8gAAAAD/7P/EAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAA/+j/vwAAAAD/yQAAAAAAAAAAAAAAAAAAAAAAAAAA//UAAP/wAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5QAA/+r/3v/k/+v/9//4/+sAAAAAAAAAAAAAAAAAAP/P/8sAAAAAAAD/5gAAAAD//AAAAAD/+gAAAAAAAAAAAAAAAAAAAAD/8gAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/j/9L/8AAA//D/9gAAAAAAAAAA/+0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9P/xQAAAAAAAP/jAAAAAP/7AAAAAP/5AAAAAAAAAAAAAAAAAAAAAP/wAAAAAP/rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+X/2P/wAAD/8P/2AAAAAAAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//EAAAAAAAD/0QAA/+wAAP/tAAAAAAAAAAAAAP/nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/N/8kAAAAAAAD/5P/o/9L/+wAA//z/+AAAAAAAAAAAAAAAAAAAAAD/8f/c/7n/7f/i/8kAAP/jAAAAAAAAAAAAAAAAAAAAAAAAAAD/6f/i/9D/7//1/+//9gAAAAD/5wAA/+wAAP/sAAAAAAAA/+0AAAAAAAD/5QAAAAAAAAAAAAAAAAAAAAD/swAAAAAAAP/7/+X/xgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/k/8kAAAAA/9IAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+kAAP/3/+3/6QAAAAAAAP/sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sAAAAA//oAAAAAAAD/+wAAAAAAAAAA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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
