(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cookie_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ANIAAAIHAAYB9QAdAUQAAAH1AB0BVAAAAVYAPAFWADwBmQCTAbcAmQFIACoBdP/yAlMACwDHAC4AjAAiAIH//wExAC4BGQAjAP8AJwFvAA8A1wAQAbsAEQE6ACoBLAA8ARL/6gHJACEBzAAYAaEAHgHFADcByQAnAc0AKwDs/+4BqP/bAVEAAAABAAADFf7AAAADgP9d/x8DswABAAAAAAAAAAAAAAAAAAABAAACAR8BkAAFAAACvAKKAAAAjAK8AooAAAHdADIA+gAAAgAAAAAAAAAAAIAAAKcAAABKAAAAAAAAAABweXJzAEAAICJlAxX+wAAAAxUBQCAAAREAAAAAAHMBOAAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQA+AAAADoAIAAEABoAfgCsALcA/wEHARkBKQE1ATgBRAFbAXwCxwLcA7wgFCAaIB4gICAiICYgOiBEIKwhIiISImAiZf//AAAAIAChAK4AuQEEARgBJwExATcBPwFSAXgCxgLaA7wgEyAYIBwgICAiICYgOSBEIKwhIiISImAiZP///+P/wf/A/7//u/+r/57/l/+W/5D/g/9n/h7+DPy54Nbg0+DS4NHg0ODN4LvgsuBL39be596a3pcAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAKoAAAADAAEECQABAAwAqgADAAEECQACAA4AtgADAAEECQADADwAxAADAAEECQAEABwBAAADAAEECQAFABoBHAADAAEECQAGABwBAAADAAEECQAHAFYBNgADAAEECQAIABIBjAADAAEECQAJABIBjAADAAEECQALAC4BngADAAEECQAMAC4BngADAAEECQANASABzAADAAEECQAOADQC7ABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEEAbgBpAGEAIABLAHIAdQBrACAAKABoAGUAbABsAG8AQABhAG4AaQBhAGsAcgB1AGsALgBjAG8AbQApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIABDAG8AbwBrAGkAZQAuAEMAbwBvAGsAaQBlAFIAZQBnAHUAbABhAHIAQQBuAGkAYQBLAHIAdQBrADoAIABDAG8AbwBrAGkAZQAgAFIAZQBnAHUAbABhAHIAOgAgADIAMAAxADEAQwBvAG8AawBpAGUALQBSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADQAQwBvAG8AawBpAGUAIABSAGUAZwB1AGwAYQByACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAQQBuAGkAYQAgAEsAcgB1AGsALgBBAG4AaQBhACAASwByAHUAawBoAHQAdABwADoALwAvAHcAdwB3AC4AYQBuAGkAYQBrAHIAdQBrAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMA/QD+AQQBBQEGAQcBCADXAQkBCgELAQwBDQEOAQ8BEADiAOMBEQESALAAsQETARQBFQEWARcBGAEZARoAuwEbARwBHQEeANgA4QDdAOAA2QCyALMAtgC3AMQAtAC1AMUAggCHAKsAvgC/ALwBHwCMAO8AjwCUAJUBIAEhASIHQW9nb25lawdhb2dvbmVrB0VvZ29uZWsHZW9nb25lawRoYmFyBkl0aWxkZQZpdGlsZGUCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwpMZG90YWNjZW50BGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlBlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50BEV1cm8Dci4yA2ZfZgN6LjIAAQAB//8ADwABAAAADAAAAAAAAAACAAMAAQD9AAEA/gD+AAIA/wD/AAEAAAABAAAACgAMAA4AAAAAAAAAAQAAAAoAIgBIAAFsYXRuAAgABAAAAAD//wADAAAAAQACAANmaW5hABRpbml0ABpsaWdhACAAAAABAAIAAAABAAEAAAABAAAAAwAIACgAPAAEAAAAAQAIAAEAEgABAAgAAQAEAP4AAgBJAAEAAQBJAAEAAAABAAgAAQAGAKgAAQABAFUAAQAAAAEACAABAAYAogABAAEAXQ==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
