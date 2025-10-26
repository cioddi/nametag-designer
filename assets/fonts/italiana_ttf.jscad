(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.italiana_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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EaoR9hInEkgSaRKNEs4S/hMvE1ETmhO5E9kT/BQrFEcUYxSCFK0U6RUlFVEVfRWsFfgWNBZOFnsWpxbSFwEXPBdhF4gXyBghGHoY1xlNGbYaIBqHGr8a8BshG1Yblxu3G9cb+xwrHGEcuRzeHQQdLR1yHacdyx3yHikeYB6bHuIfFR89H4AfmR/MIAIgEyAxIEkgdiCDIJAgpiC8INEg9SEZIT0hTyF3Ic4h3iHtIfkiGwAAAAEAAAABAABjISOvXw889QALA+gAAAAAy4LELAAAAADLgsQs/6//BgPSA6AAAAAIAAIAAAAAAAAAyAAAAAAAAAFNAAABKwAAARoAZQFEAFgCWAAcAkcASwKNAEYDhAAXAGQAHAEsAEUBLAAmAiwAZwKOAGoAXAAMAZAALgBuABwB6wBkAoYAMgGPAGQBtwAoAXcAJwG8AB4BXAAVAfQAKAGeADICHAA7AfQAKAD6AFMA+gBIAjkAZALjAJICOQBkAa8AJAQuAFACbgAeAjoARgJpADICbgBGAg0ARgH3AEYCiQAyAk8AMgE+AEYBJf/sAlkARgHgAEYDGgBBAlEAQQLQADICPABGAtAAMgJZAEYCAwAjAeoAHgJ1AEYCTgAeA04AHgInAB4CFQAeAiEAIwGuAFcCWACJAa4AiQIwAJIBtQBPASsAZgIHACMCCAAoAeEAKAJWACgB8wAoAP8AIwH/ACMCLAAyAPMAMgDn/8QBtQAyAOkAMwMgACgCDgAoAjAAKAISADICCQAoAWcAKAGmACMBTgAjAg4AKAHWACMDFgAjAfwAIwHmACMB1AAjAZAAZAEcAFcBjwBkAkwAkAEaAGUB4QAoAfYAKgH0AGECqABxAPoAVwH0ACMB9ABvA0EAMgGRACYCtgBkAlgAZAJXADIB9ABkAXoARgKkAIgBTABpASwANQEsAGYB8AAKAj0AMwB2ABwBBAAVAPEASQF3AD4CtgBkArwAVALvAFQDAgAVAfQAdAJuAB4CbgAeAm4AHgJuAB4CbgAeAm4AHgK2AB4CaQAyAeAAHgHgAB4B4AAeAeAAHgE+ADQBPgBGAT4AGgE+AAkCjgBGAlEAQQLQADIC0AAyAtAAMgLQADIC0AAyAngAiALQADICKgAeAioAHgIqAB4CKgAeAhUAHgI8AEYCSAAeAgcAIwIHACMCBwAjAh8AIwIHACMCBwAjAuoAIwHhACgB8wAoAfMAKAHzACgB8wAoANcAAADXADMBCQAAAVoAFAItACYCDgAoAjAAKAIwACgCMAAoAjAAKAIwACgDAACSAjAAKAIOACgCDgAoAg4AKAIOACgB5gAjAggAKAHmACMA9wBgAv8AMgIdAB4BkQBCAY4AUQAAAGECWACAAlkAUAK9AFABBABSAQQAUgEEAF0BYQBSAWEAUgGQAFIB2gBkAUoAHAOwAEYBtABkAbQAZABk/68B8wBGAAEAAAOg/wYAAAQu/6//DAPSAAEAAAAAAAAAAAAAAAAAAADWAAIBswGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAAAAAAAAAAAAAAAgAAAJwAAAAgAAAAAAAAAAHB5cnMAQAAgISIDoP8GAAADoAD6AAAAAQAAAAAB9AK8AAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABACgAAAAJAAgAAQABAB+AKwA/wExAVIBeALGAtwgFCAaIB4gIiAmIDAgOiBEISL//wAAACAAoQCuATEBUgF4AsYC2iATIBggHCAiICYgMCA5IEQhIv///+P/wf/A/4//b/9K/f396uC04LHgsOCt4KrgoeCZ4JDfswABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAANAKIAAwABBAkAAACkAAAAAwABBAkAAQAQAKQAAwABBAkAAgAOALQAAwABBAkAAwAiAMIAAwABBAkABAAQAKQAAwABBAkABQAgAOQAAwABBAkABgAgAQQAAwABBAkABwBWASQAAwABBAkACAAeAXoAAwABBAkACQAeAXoAAwABBAkADAAkAZgAAwABBAkADQEgAbwAAwABBAkADgA0AtwAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABiAHkAIABTAGEAbgB0AGkAYQBnAG8AIABPAHIAbwB6AGMAbwAgACgAaABpAEAAdAB5AHAAZQBtAGEAZABlAC4AbQB4ACkAIAB3AGkAdABoACAAcgBlAHMAZQByAHYAZQBkACAAbgBhAG0AZQAgAEkAdABhAGwAaQBhAG4AYQBJAHQAYQBsAGkAYQBuAGEAUgBlAGcAdQBsAGEAcgBGAE8ATgBUAEwAQQBCADoATwBUAEYARQBYAFAATwBSAFQAVgBlAHIAcwBpAG8AbgAgADAAMAAxAC4AMAAwADEAIABJAHQAYQBsAGkAYQBuAGEALQBSAGUAZwB1AGwAYQByAEkAdABhAGwAaQBhAG4AYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFMAYQBuAHQAaQBhAGcAbwAgAE8AcgBvAHoAYwBvAC4AUwBhAG4AdABpAGEAZwBvACAATwByAG8AegBjAG8AaAB0AHQAcAA6AC8ALwB0AHkAcABlAG0AYQBkAGUALgBtAHgAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADWAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACR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//YAwP/2AML/2AAIACT/7ACA/+wAgf/sAIL/7ACD/+wAhP/sAIX/7ACG/+wAOQAl//YAJv/iACf/9gAo//YAKf/2ACr/4gAr//YALv/2AC//9gAx//YAMv/OADP/9gA0/84ANf/2ADj/zgA6/+IARv/sAEj/7ABP//YAUv/sAFf/9gBZ/7AAWv+wAFz/sABj/+wAh//iAIj/9gCJ//YAiv/2AIv/9gCR//YAkv/OAJP/zgCU/84Alf/OAJb/zgCZ/84Amv/OAJv/zgCc/84Anv/2AKf/7ACo/+wAqf/sAKr/7ACr/+wAsP/sALL/7ACz/+wAtP/sALX/7AC2/+wAuf/2ALr/9gC7//YAvP/2AMH/zgBGAAv/9gAM//YAJv/YACr/2AAy/84ANP/OADf/sAA4/+IAOf+mADr/nAA8/7oAPv/2AED/9gBE//YARf/2AEb/7ABI/+wASf/2AEv/9gBM//YATf/2AE7/9gBQ//YAUf/2AFL/7ABT//YAVf/2AFj/7ABZ/9gAWv/YAFz/2ABf//YAY//sAIf/2ACS/84Ak//OAJT/zgCV/84Alv/OAJn/4gCa/+IAm//iAJz/4gCd/7oAoP/2AKH/9gCi//YAo//2AKT/9gCl//YAp//sAKj/7ACp/+wAqv/sAKv/7ACs//YArf/2AK7/9gCv//YAsP/sALH/9gCy/+wAs//sALT/7AC1/+wAtv/sAL7/9gDA//YAwf/OAML/ugAjACb/7AAq/+wALP/2ADL/7AA0/+wARv/2AEj/9gBS/+wAWf/iAFr/4gBc/+IAY//2AIf/7ACM//YAjf/2AI7/9gCP//YAkv/sAJP/7ACU/+wAlf/sAJb/7ACY/+wAp//2AKj/9gCp//YAqv/2AKv/9gCw/+wAsv/sALP/7AC0/+wAtf/sALb/7ADB/+wAXgAL//YADP/2ACT/fgAl/+wAJ//sACj/7AAp/+wAK//sACz/4gAu/+wAL//sADH/7AAy/+wAM//sADT/7AA1/+wAN//iAD7/9gBA//YARP/sAEX/9gBG/+wAR//sAEj/7ABJ//YASv/sAEv/9gBM//YATf/2AE7/9gBP//YAUP/2AFH/9gBS/+wAU//2AFT/7ABV//YAV//2AFn/9gBa//YAXP/2AF//9gBj/+wAgP9+AIH/fgCC/34Ag/9+AIT/fgCF/34Ahv9+AIj/7ACJ/+wAiv/sAIv/7ACM/+IAjf/iAI7/4gCP/+IAkf/sAJL/7ACT/+wAlP/sAJX/7ACW/+wAnv/sAKD/7ACh/+wAov/sAKP/7ACk/+wApf/sAKf/7ACo/+wAqf/sAKr/7ACr/+wArP/2AK3/9gCu//YAr//2ALD/7ACx//YAsv/sALP/7AC0/+wAtf/sALb/7AC5//YAuv/2ALv/9gC8//YAvv/2AMD/9gDB/+wAJwAm/+IAKv/iACz/7AAy/+IANP/iADf/7AA4/+wAOf/iADr/2AA8/+wAUv/2AFb/9gBZ//YAWv/2AFz/9gCH/+IAjP/sAI3/7ACO/+wAj//sAJL/4gCT/+IAlP/iAJX/4gCW/+IAmP/iAJn/7ACa/+wAm//sAJz/7ACd/+wAsP/2ALL/9gCz//YAtP/2ALX/9gC2//YAwf/iAML/7AAFADf/9gA5//YAWf/sAFr/7ABc/+wAQQAL/+wADP/sABH/ugAk/7AAMP/YADL/xAA0/8QAPv/sAED/7ABF/+wARv/OAEf/zgBI/84ASf/sAEr/zgBL/+wATP/sAE3/7ABO/+wAUP/sAFH/7ABS/84AU//sAFT/zgBV/+wAWP/OAFn/zgBa/84AW//YAFz/zgBd/84AX//sAGP/zgCA/7AAgf+wAIL/sACD/7AAhP+wAIX/sACG/7AAkv/EAJP/xACU/8QAlf/EAJb/xACn/84AqP/OAKn/zgCq/84Aq//OAKz/7ACt/+wArv/sAK//7ACw/84Asf/sALL/zgCz/84AtP/OALX/zgC2/84Avv/sAMD/7ADB/8QA0P+6ACcAJP+mADL/7AA0/+wARP/iAEb/zgBI/84AUv/OAFb/4gBj/84AgP+mAIH/pgCC/6YAg/+mAIT/pgCF/6YAhv+mAJL/7ACT/+wAlP/sAJX/7ACW/+wAoP/iAKH/4gCi/+IAo//iAKT/4gCl/+IAp//OAKj/zgCp/84Aqv/OAKv/zgCw/84Asv/OALP/zgC0/84Atf/OALb/zgDB/+wALQAk/6YAJv/YACr/2AAy/+IANP/iAET/4gBG/9gASP/YAFL/zgBY/+wAWf/iAFr/4gBc/+IAY//YAID/pgCB/6YAgv+mAIP/pgCE/6YAhf+mAIb/pgCH/9gAkv/iAJP/4gCU/+IAlf/iAJb/4gCg/+IAof/iAKL/4gCj/+IApP/iAKX/4gCn/9gAqP/YAKn/2ACq/9gAq//YALD/zgCy/84As//OALT/zgC1/84Atv/OAMH/4gARADf/7AA4/+IARv/iAEj/4gBZ/84AWv/OAFz/zgBj/+IAmf/iAJr/4gCb/+IAnP/iAKf/4gCo/+IAqf/iAKr/4gCr/+IAHgAy/+wANP/sAET/9gBG/+IASP/iAFL/4gBj/+IAkv/sAJP/7ACU/+wAlf/sAJb/7ACg//YAof/2AKL/9gCj//YApP/2AKX/9gCn/+IAqP/iAKn/4gCq/+IAq//iALD/4gCy/+IAs//iALT/4gC1/+IAtv/iAMH/7AAdAAsAMgAMADIAPgAyAEAAMgBFADIASQAyAEsAMgBMADIATQAyAE4AMgBPABQAUAAyAFEAMgBTADIAVQAyAFcAFABYABQAXwAyAKwAMgCtADIArgAyAK8AMgCxADIAuQAUALoAFAC7ABQAvAAUAL4AMgDAADIAGgBE//YARv/YAEj/2ABS/+wAVv/2AFn/4gBa/+IAXP/iAGP/2ACg//YAof/2AKL/9gCj//YApP/2AKX/9gCn/9gAqP/YAKn/2ACq/9gAq//YALD/7ACy/+wAs//sALT/7AC1/+wAtv/sAB8AEf+cAET/4gBG/+IAR//iAEj/4gBK/+IAUv/YAFT/4gBW//YAW//sAF3/7ABj/+IAoP/iAKH/4gCi/+IAo//iAKT/4gCl/+IApv/sAKf/4gCo/+IAqf/iAKr/4gCr/+IAsP/YALL/2ACz/9gAtP/YALX/2AC2/9gA0P+cACMAC//sAAz/7AA+/+wAQP/sAEX/7ABJ/+wAS//sAEz/7ABN/+wATv/sAFD/7ABR/+wAUv/2AFP/7ABV/+wAVv/2AFn/7ABa/+wAW//sAFz/7ABd//YAX//sAKz/7ACt/+wArv/sAK//7ACw//YAsf/sALL/9gCz//YAtP/2ALX/9gC2//YAvv/sAMD/7AAwAAv/4gAM/+IAPv/iAED/4gBE/+wARf/iAEb/4gBI/+IASf/iAEv/4gBM/+IATf/iAE7/4gBQ/+IAUf/iAFL/zgBT/+IAVf/iAFb/9gBZ/+wAWv/sAFz/7ABf/+IAY//iAKD/7ACh/+wAov/sAKP/7ACk/+wApf/sAKf/4gCo/+IAqf/iAKr/4gCr/+IArP/iAK3/4gCu/+IAr//i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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
