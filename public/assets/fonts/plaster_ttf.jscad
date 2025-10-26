(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.plaster_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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UflSavxkHHBEFv62TVQFK91ncfqvAAACAIL90AV8A/wAGQAlAAAhIicVFBYWMzMRIyInJjU0NzY3IyYmNREhEQE0Njc2MzMRIyInJgU9c00sMSR+2I1han0nMARoYAIo+wY6PYT2TTT8ioQPK3BEFv62TVSItVcbDC6qhwJx/AQB8m69R5j8BIqE//8AgwAABXsH0BImADkAABAHAaYBqwAA//8AgwAABYcGtRImAFkAABAHAIkCI/9X//8AgwAABXsH0BImADkAABAHAZ0BAQAA//8AgwAABYYGsxImAFkAABAHAVkAz/9X//8AgwAABXsH0BImADkAABAHAaMBAQAA//8AgwAABXsF+xImAFkAABAHAVwBef9X//8AgwAABXsH0BImADkAABAHAZ4BAQAA//8AgwAABYYGdxImAFkAABAHAVoAz/9X//8AbAAABZEH0BImADoAABAHAZ4BAAAAAAMAggAAB5oGMgAIAAwAGAAAASERFA4CIyMBIREhATQ2NzYzMxEjIicmBhIBiBVFgm0//VUCFf3r/Rs6PYT2TTT8ioQGMv7/cZZbJgJS+gUB8m69R5j8BIqEAAIAfgAABlQFUQAKABIAAAEzIBMWEAIHBiEjASM1MxEhESED71QBqFEYP0GH/vZU/UCxsQIa/eYFUf6Lcf7S/u5hygKEpwIm+rEAAgCCAAAGDgX7AAsAFwAAASE1ITUhFTMVIxEhATQ2NzYzMxEjIicmA2f+0wEtAhWSkv3r/Rs6PYT2TTT8ioQEp6qqqqr7WQHybr1HmPwEioQA//8AhgAABXgHThImADsAABAHAaIA9wAA//8AgQAABX0GMxImAFsAABAHAIQBCACq//8AhgAABXgH0BImADsAABAHAaAA9wAA//8AgQAABX0GoxImAFsAABAGAVteAP//AIYAAAV4B9ASJgA7AAAQBwGjAPcAAP//AIEAAAV9BqQSJgBbAAAQBwFcAQgAAAADAIb90AV4BVEABwAPACYAAAEhESMgJyY1JSERIREhESEBNDcjNTQ3NjMzESMVFBYWMzMRIyInJgNNAito/vFjUf05AhoBkf5v/eYCwnNv8FyRT/8sMSR+2I1hagVR/oZVRpxD/dz++/3a/veqXWHPShz+ahxwRBb+tk1UAAADAIH90AV9A/wABwATACoAAAEzIBMWFRUhJTQ2NzYz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IhIPAgkLLfwEJxcGAgsUJwHybr1HmPwEioQJHF1ATAD//wB1AAAFiQfQEiYASAAAEAcBpgGQAAD//wC+AAAFdQdeEiYAaAAAEAcAiQHlAAD//wB1/dAFiQVTEiYASAAAEAcBnADmAAD//wC+/dAFdQP8EiYAaAAAEAYBnMQA//8AdQAABYkH0BImAEgAABAHAZ4A5gAA//8AvgAABXUHIBImAGgAABAHAVoAkQAA//8AgQAABX0H0BImAEkAABAHAaYBqwAA//8Aqv/2BVMHXhImAGkAABAHAIkBqQAA//8AgQAABX0H0BImAEkAABAHAZ0BAQAA//8Aqv/2BVMHXBImAGkAABAGAVlVAP//AIH91AV9BVESJgBJAAAQBgCNWQD//wCq/dQFUwQGEiYAaQAAEAYAjVUA//8AgQAABX0H0BImAEkAABAHAZ4BAQAA//8Aqv/2BVMHIBImAGkAABAGAVpVAP//AG390AbkBVESJgBKAAAQBwGcAawAAP//AIL90AV8BQsSJgBqAAAQBwGcAQIAAP//AG0AAAbkB9ASJgBKAAAQBwGeAaoAAAAEAIIAAAbdBjIACAAPABMAGwAAASERFA4CIyMBIBERATMREyERIRMhFRQHBiMjBVUBiBVFgm0//Rz+EQGnlpEBb/6RAQIraHH8VgYy/v9xllsm/FcBxAIyARX69QP8/rH+/liqUVgAAAMAbQAABuQFUQAJABUAHQAAASERIyImJicmNQEhESERIRUhESERIQMhFRAHBiMjBSQBwHBuaDsVKvwVAWQCGgFa/qb95v6czAHAXUyncAVR/csvOzBirv3gAqv9Var+BAH8A1WL/v9dTAAEAJEAAAYwBQsADQARABUAHQAAISARNSM1MzUjNTcBMxETIRUhFSEVIRchFRQHBiMjAyX+EaWlpbABnJaRAd/+IQHf/iEBAitocfxWAcQ4qqyqAQEO+vUD/KqsqpcSqlFY//8AggAABXwH0BImAEsAABAHAZ8BBAAA//8AggAABXwHThImAGsAABAHAV8AVwFU//8AggAABXwHThImAEsAABAHAaIBBAAA//8AggAABXwGMxImAGsAABAHAIQBAQCq//8AggAABXwH0BImAEsAABAHAaABBAAA//8AggAABXwGoxImAGsAABAGAVtXAP//AIIAAAV8B9ASJgBLAAAQBwGb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A1j/jwNY/4UF/gCHBf4AggX+AHAF/gBwBf4AcAX+AHAF/gBwBgIBJQX+/+4F/gCCBf4AggX+AIIF/gCCBf4AggX+AIUF/gCCBf4AeQX+AIIF/gB5Bf4AggX+AHkF/gCCBf4AgwX+AIMF/gCDBf4AgwX+AIMF/gCDBf4AgwX+AIMF/gBsB/gAggaoAH4F/gCCBf4AhgX+AIEF/gCGBf4AgQX+AIYF/gCBBf4AhgX+AIEF/gCGBf4AgQX+AIMF/gCCBf4AgwX+AIIF/gCDBf4AggX+AIMF/gCCBf4AgwX+AIEHUgCRBf7/5wNY/3oDWP9nA1gAQwNY//sDWP+cA1j/igNYAIkDWABuA1gAbgNYAJ8JVgCfBrAAbgX+AGkErABHBf4AbQX+AH0F/gCLBf4AhgNQAEQF/gCGA1AAmwX+AS8EqACbBf4AhgX4APAF/v/nA/r/7wX+AH8F/gCCBf4AfwX+AIIF/gB/Bf4AggX+AIUF/gCMBf4ARQX+AHAF/gBFBf4AcAX+AEUF/gBwCKoARginAHAF/gB1BgEAvgX+AHUGAQC+Bf4AdQYBAL4F/gCBBf4AqgX+AIEF/gCqBf4AgQX+AKoF/gCBBf4AqgdSAG0F/gCCB1IAbQdWAIIHUgBtBqgAkQX+AIIF/gCCBf4AggX+AIIF/gCCBf4AggX+AIIF/gCCBf4AggX+AIIF/gCCBf4AgglVALAJVQCwBf4AggX+AIIF/gCCBf4AZgVWAG0F/gBmBVYAbQX+AGYFVgBtBrAAkgiqAHkIpwCCBf4AgQX+AKoErAFQBVAAmATNAJkFTwCTA/0AvAP7AIsEzQCRBU8AcAAAAA0GogBjCKMA4QdSAOgF/gBtBf4AgQX+AGwF/gBjBf4AhgX//64JTACqCUoAqQX+AFEF/gCCBf4AgQX+AKoHUgBtBf4AgglVALAJVQCwCVUAsAlVALAJVQCwCVUAsAX+AIIF/gCCBVgArQf+AKoD+gDDA/oAuAP6ALgHUgDLB1IA4AdSAOoFVgBZBVYAWQP6AHsKAgBtDpwBCQVYAPkFWAFZBVQA6gdSAJQRSACFB1IBMQdSAOgHUAExBgIBJQX5AKoGqwChCKMAzAX5AIkD+gAhBgIBAgYCAQIGAACHC/4AtwlXALcJTwC3BAEAgAEZ/+3/7//I/+oAFwCRALz/5wCYAJkAAAABAAAH0P3Q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ACAATQBhAG4AeQAgAG8AZgAgAHQAaABlACAAcwBvAGwAdQB0AGkAbwBuAHMAIAB0AG8AIAB0AGgAZQAgAGcAbAB5AHAAaAAgAGQAZQBzAGkAZwBuACAAdgBhAHIAeQAgAGYAcgBvAG0AIABBAGwAYgBlAHIAJwBzACAAYwBoAG8AaQBjAGUAcwAuACAAUABsAGEAcwB0AGUAcgAgAGkAcwAgAHMAdQBpAHQAYQBiAGwAZQAgAGYAbwByACAAdQBzAGUAIABpAG4AIABtAGUAZABpAHUAbQAgAHQAbwAgAGwAYQByAGcAZQAgAHMAaQB6AGUAcwAgAGkAbgBjAGwAdQBkAGkAbgBnACAAaABlAGEAZABsAGkAbgBlAHMALgB3AHcAdwAuAHMAbwByAGsAaQBuAHQAeQBwAGUALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/1MApAAAAAAAAAAAAAAAAAAAAAAAAAAAAacAAAABAAIBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEVAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBFgEXARgBGQEaARsA/QD+ARwBHQEeAR8A/wEAASABIQEiAQEBIwEkASUBJgEnASgBKQEqASsBLAEtAS4A+AD5AS8BMAExATIBMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4A+gDXAT8BQAFBAUIBQwFEAUUBRgFHAUgBSQFKAUsBTAFNAOIA4wFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsAsACxAVwBXQFeAV8BYAFhAWIBYwFkAWUA+wD8AOQA5QFmAWcBaAFpAWoBawFsAW0BbgFvAXABcQFyAXMBdAF1AXYBdwF4AXkBegF7ALsBfAF9AX4BfwDmAOcApgGAAYEBggGDAYQA2ADhANsA3ADdAOAA2QDfAKgAnwCbAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAGbAIwAmACaAJkA7wClAJIAnACnAI8AlACVALkBnADAAMEBnQGeAZ8BoAGhAaIBowGkAaUBpgGnAagHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAxMAd1bmkwMDExB3VuaTAwMTIHdW5pMDAxMwd1bmkwMDE0B3VuaTAwMTUHdW5pMDAxNgd1bmkwMDE3B3VuaTAwMTgHdW5pMDAxOQd1bmkwMEFEB0FtYWNyb24HYW1hY3JvbgZBYnJldmUGYWJyZXZlB0FvZ29uZWsHYW9nb25lawtDY2lyY3VtZmxleAtjY2lyY3VtZmxleApDZG90YWNjZW50CmNkb3RhY2NlbnQGRGNhcm9uBmRjYXJvbgZEY3JvYXQHRW1hY3JvbgdlbWFjcm9uBkVicmV2ZQZlYnJldmUKRWRvdGFjY2VudAplZG90YWNjZW50B0VvZ29uZWsHZW9nb25lawZFY2Fyb24GZWNhcm9uC0djaXJjdW1mbGV4C2djaXJjdW1mbGV4Ckdkb3RhY2NlbnQKZ2RvdGFjY2VudAxHY29tbWFhY2NlbnQMZ2NvbW1hYWNjZW50C0hjaXJjdW1mbGV4C2hjaXJjdW1mbGV4BEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlB0ltYWNyb24HaW1hY3JvbgZJYnJldmUGaWJyZXZlB0lvZ29uZWsHaW9nb25lawJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlDExjb21tYWFjY2VudAxsY29tbWFhY2NlbnQGTGNhcm9uBmxjYXJvbgRMZG90BGxkb3QGTmFjdXRlBm5hY3V0ZQxOY29tbWFhY2NlbnQMbmNvbW1hYWNjZW50Bk5jYXJvbgZuY2Fyb24DRW5nA2VuZwdPbWFjcm9uB29tYWNyb24GT2JyZXZlBm9icmV2ZQ1PaHVuZ2FydW1sYXV0DW9odW5nYXJ1bWxhdXQGUmFjdXRlBnJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQtTY2lyY3VtZmxleAtzY2lyY3VtZmxleAxUY29tbWFhY2NlbnQMdGNvbW1hYWNjZW50BlRjYXJvbgZ0Y2Fyb24EVGJhcgR0YmFyBlV0aWxkZQZ1dGlsZGUHVW1hY3Jvbgd1bWFjcm9uBlVicmV2ZQZ1YnJldmUFVXJpbmcFdXJpbmcNVWh1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0B1VvZ29uZWsHdW9nb25lawtXY2lyY3VtZmxleAt3Y2lyY3VtZmxleAtZY2lyY3VtZmxleAt5Y2lyY3VtZmxleAZaYWN1dGUGemFjdXRlClpkb3RhY2NlbnQKemRvdGFjY2VudAdBRWFjdXRlB2FlYWN1dGUMU2NvbW1hYWNjZW50DHNjb21tYWFjY2VudAhkb3RsZXNzagd1bmkxRTAyB3VuaTFFMDMHdW5pMUUwQQd1bmkxRTBCB3VuaTFFMUUHdW5pMUUxRgd1bmkxRTQwB3VuaTFFNDEHdW5pMUU1Ngd1bmkxRTU3B3VuaTFFNjAHdW5pMUU2MQd1bmkxRTZBB3VuaTFFNkIGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMGWWdyYXZlBnlncmF2ZQRFdXJvAmZmCHJpbmcuY2FwC2NvbW1hYWNjZW50DmNpcmN1bWZsZXguY2FwCWNhcm9uLmNhcAl0aWxkZS5jYXAJYnJldmUuY2FwEGh1bmdhcnVtbGF1dC5jYXAKbWFjcm9uLmNhcA1kb3RhY2NlbnQuY2FwDGRpZXJlc2lzLmNhcAlncmF2ZS5jYXAJYWN1dGUuY2FwAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQGaAAEAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
