(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rammetto_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AFIAlgNq//8AewAABR0JLxImADcAABAHAIUCewNq//8AewAABR0JURImADcAABAHATwBJwNq//8AewAABR0IbhImADcAABAHAHkAOQNq////sQAAAukJLhImADsAABAHAFL/kANq//8AewAAA8UJLxImADsAABAHAIUBdQNq//8AUAAAAyUJURImADsAABAHATwAIQNq////mgAAA9gIbhImADsAABAHAHn/NANqAAIAMQAABscGagAQAB0AABMkIBYXFhIQAgcGJSERIzUzJRUzFSMRNjc2NTQmInsCXwFz11WlqYFy6f6O/QJKSgJusbE1Pu5srQY9LUU9df58/nL+12bTAQLs62tr6/71LSyru1ub//8AewAABrgIdBImAEAAABAHAUIBZgNq//8ASv/ZB0oJLhImAEEAABAHAFIBlgNq//8ASv/ZB0oJLxImAEEAABAHAIUDewNq//8ASv/ZB0oJURImAEEAABAHATwCJwNq//8ASv/ZB0oIdBImAEEAABAHAUIBZgNq//8ASv/ZB0oIbhImAEEAABAHAHkBOQNqAAEAQgCBBFQEkwALAAAJCwFG/vwBBAEGAQIBBv78AQT++v7+/vr+/AKLAQQBBP78AQT++v7+/vz+/AEC/vwBBAACAD//Hwc/BwwAFgAmAAABMhc3FwcWAAMCBQYHBicHJzcmABoBJAE0IyIHBgcGFRQzFjc2NzYDun54Po8+7QEUAQH+8Kbo28tEj0H2/swC7gGWAgeiRlaBMxCoQ1Z9NBAGahy+KcBe/m/+6f6M7pE2MizPKcxgAZ0CCQF81P10qViFuDoxpgFahLw6//8Aav/ZBmYJLhImAEcAABAHAFIBZANq//8Aav/ZBmYJLxImAEcAABAHAIUDSgNq//8Aav/ZBmYJURImAEcAABAHATwB9gNq//8Aav/ZBmYIbhImAEcAABAHAHkBCANq//8AKwAABosJLxImAEsAABAHAIUDTgNqAAIAPQAABlwGPwANABgAAAE2MyAXFhUQAAUVIREhEyIHETc2NzY1NCYCy9ecARaNe/4n/kj9cgKO6U+ebm0sUTgFvESah+P+kf5MCs8GP/4dbv6bNTQzXmQyQwAAAQA3/8UG4QY7ACwAAAE2NS4BIyIGFREhERAlNiEgBBUUBwYHFhceARIGBwYhIyInETY3NjU0IyIGBwMxngE0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/rT9kgJuAUz+tAFMBZKr+cMCTh39zwY9/pTVGwAB//YAAAZIBpMAGwAAATYhMhYXFhURIRE0JiMiFREhESM1MzUhFTMVIwLkhgEST7BBjP2qaEZg/a6cnAJSo6MEVrRIRJHv/QICG6HPg/z4BTjLkJDL////8gAAA5gIdBImADsAABAHAUL/YQNq////mgAAA0AHPRImAOYAABAHAUL/CQIz//8Adf2LAukGPRAmADsAABAGAUFCAP//AFz9iwLOBxsQJgBbAAAQBgFBKQD//wB7AAADCglWEiYAOwAAEAcBPwB/A2oAAQA9AAACfwTbAAMAACkBESECf/2+AkIE2///AHv/2QkmBj0QJgA7AAAQBwA8A10AAAAEAGr+bgZUBxsADgAaACYAKgAAASInNxYyNjc2NREhERQEEhYUBiMiJyY0Njc2IBYOASMiJyY0Njc2ASERIQSE8bMCKFw+GjwCVv73f461ltQ0DyoqXf2djgG1l9Q0DyoqXQGh/b0CQ/5ukLwRMyZZVgQq+07L8Aite76ggCRYYCZXe76ggCRYYCZX+OUE2///AGD/2QYbCVEQJgA8UgAQBwE8AwoDav//AB3+tAPFCBoSJgE7AAAQBwE8AMECM///AHv8AgX4BpMQJgBdAAAQBwFHAW0AAAABAHsAAAX4BNsACgAAARETIQkBIQERIRECgewCTf51Acn9nv71/fAE2/55AYf9wf1kAaD+YATb//8AewAABQIJMBImAD4AABAHAIUBdwNr//8AewAAA6YJaRImAF4AABAHAIUBVgOk//8AewAABcsGPxAmAD4AABAHAVcDNQbG//8AMgAAAwcJhRImAF4AABAHAT0AEwOk//8AewAABfIGPRImAD4AABAHAIgDRgAd//8AewAABbgGkxAmAF4AABAHAIgDDAAAAAEAAAAABQIGPQANAAARNxEhETcRBxEhESERB3sCbre3Ahn7eXsDjysCg/5bQf6NQf68/h8CSCsAAf/JAAADaAbuAAsAAAE3EQcRIREHETcRIQKytrb9ybKyAjcEmEH+jUH82wJcPwFyPgMh//8AewAABrgJLxImAEAAABAHAIUDewNq//8AeQAABiEH+BImAGAAABAHAIUC/gIz//8AewAABrgJSxImAEAAABAHAT0COANq//8AeQAABiEIFBImAGAAABAHAT0BuwIz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AEEAZABhAG0AcwAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAG4AZQB3AHQAeQBwAG8AZwByAGEAcABoAHkALgBjAG8ALgB1AGsAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAKAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYwBvAHAAaQBlAGQAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAUgBhAG0AbQBlAHQAdABvAAAAAgAAAAAAAP9mAGYAAAAAAAAAAAAAAAAAAAAAAAAAAAFdAAAAAQACAQIBAwEEAQUBBgEHAQgBCQEKAQsBDAENAQ4BDwEQAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCsAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAREAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugD9AP4BEgETAP8BAAEUARUBFgEBARcBGAD4APkBGQEaARsBHAEdAR4A+gDXAR8BIAEhASIBIwEkASUBJgEnASgBKQEqAOIA4wErASwBLQEuAS8BMACwALEBMQEyATMBNAE1ATYA+wD8AOQA5QE3ATgBOQE6ATsBPAE9AT4BPwFAAUEAuwDmAOcBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgA2ADhANsA3ADdAOAA2QDfAWkBagFrAWwAsgCzALYAtwDEALQAtQDFAIcAvgC/ALwBbQFuAIwBbwFwAMAAwQFxAXIETlVMTAd1bmkwMDAxB3VuaTAwMDIHdW5pMDAwMwd1bmkwMDA0B3VuaTAwMDUHdW5pMDAwNgd1bmkwMDA3B3VuaTAwMDgHdW5pMDAwOQd1bmkwMDEwB3VuaTAwMTEHdW5pMDAxMgd1bmkwMDEzB3VuaTAwMTQHdW5pMDBBRAtDY2lyY3VtZmxleAtjY2lyY3VtZmxleAZEY2Fyb24GZGNhcm9uBkRjcm9hdAZFY2Fyb24GZWNhcm9uBEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlB0lvZ29uZWsHaW9nb25lawJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljBkxhY3V0ZQZsYWN1dGUGTGNhcm9uBmxjYXJvbgpMZG90YWNjZW50BGxkb3QGTmFjdXRlBm5hY3V0ZQZOY2Fyb24GbmNhcm9uDU9odW5nYXJ1bWxhdXQNb2h1bmdhcnVtbGF1dAZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgx0Y29tbWFhY2NlbnQGVGNhcm9uBnRjYXJvbgdVbWFjcm9uB3VtYWNyb24FVXJpbmcFdXJpbmcNVWh1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0B1VvZ29uZWsHdW9nb25lawdEWmNhcm9uB0R6Y2Fyb24HZHpjYXJvbgJMSgJMagJsagJOSgJOagJuagJEWgJEegJkegZHYWN1dGUGZ2FjdXRlB3VuaTAyMDAHdW5pMDIwMQd1bmkwMjAyDmFpbnZlcnRlZGJyZXZlDEVkb3VibGVncmF2ZQd1bmkwMjA1DkVpbnZlcnRlZGJyZXZlDmVpbnZlcnRlZGJyZXZlB3VuaTAyMDgHdW5pMDIwOQ5JaW52ZXJ0ZWRicmV2ZQd1bmkwMjBCB3VuaTAyMEMHdW5pMDIwRAd1bmkwMjBFB3VuaTAyMEYHdW5pMDIxMAd1bmkwMjExB3VuaTAyMTIHdW5pMDIxMwd1bmkwMjE0B3VuaTAyMTUHdW5pMDIxNgd1bmkwMjE3CGRvdGxlc3NqDGRvdGFjY2VudGNtYgd1bmkwMzBGB3VuaTAzMTEHdW5pMDMyNgxmb3Vyc3VwZXJpb3IERXVybwtjb21tYWFjY2VudAJmZgNmZmkDZmZsAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAIAAQFXAAEBWAFcAAIAAQAAAAoAHgAsAAFERkxUAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAQADgRiDewO1gABAFQABAAAACUEOgREBEQAogFYAV4ESgIQAhYESgRKAhwCzgOABDoEOgQ6BDoEOgQ6BEQERAREBEQERAREBEQESgRKBEoESgRKBEoERAREBEQESgABACUAMwA2AEEARABIAEkAVABdAGAAYQBiAGgAaQBrAJEAkgCTAJQAlQCWAKEAowCkAKUApgCnAKkAwwDEAMUAxgDHAMkA1wDZAPkA+gAtAEf/wwBT/6YAVf+qAFb/qgBX/6oAWf+qAGH/qgBj/6oAmP+qALH/qgCy/6oAs/+qALT/qgC1/6oAtv+qALf/qgC4/6oAuf+qALr/qgC7/6oAvP+qAMP/qgDE/6oAxf+qAMb/qgDH/6oAyf+qANL/qgDT/6oA1P+qANb/qgDY/6oA2v+qANz/qgDe/6oA+v+qAPz/qgEg/6oBIv+qAST/qgEm/6oBKP+qASr/qgEw/6oBMv+qAAEAav+mACwAU/9MAFX/XABW/1wAV/9QAFn/XABh/1wAY/9cAJj/XACx/1wAsv9cALP/XAC0/1wAtf9cALb/XAC3/1wAuP9cALn/XAC6/1wAu/9cALz/XADD/1wAxP9cAMX/XADG/1wAx/9cAMn/XADS/1wA0/9cANT/XADW/1wA2P9cANr/XADc/1wA3v9cAPr/XAD8/1wBIP9cASL/XAEk/1wBJv9cASj/XAEq/1wBMP9cATL/XAABAFf/ugABAGv/xwAsAFP/sgBV/7IAVv+yAFf/pgBZ/7IAYf+yAGP/sgCY/7IAsf+yALL/sgCz/7IAtP+yALX/sgC2/7IAt/+yALj/sgC5/7IAuv+yALv/sgC8/7IAw/+yAMT/sgDF/7IAxv+yAMf/sgDJ/7IA0v+yANP/sgDU/7IA1v+yANj/sgDa/7IA3P+yAN7/sgD6/7IA/P+yASD/sgEi/7IBJP+yASb/sgEo/7IBKv+yATD/sgEy/7IALABT/6YAVf+2AFb/tgBX/7YAWf+2AGH/tgBj/7YAmP+2ALH/tgCy/7YAs/+2ALT/tgC1/7YAtv+2ALf/tgC4/7YAuf+2ALr/tgC7/7YAvP+2AMP/tgDE/7YAxf+2AMb/tgDH/7YAyf+2ANL/tgDT/7YA1P+2ANb/tgDY/7YA2v+2ANz/tgDe/7YA+v+2APz/tgEg/7YBIv+2AST/tgEm/7YBKP+2ASr/tgEw/7YBMv+2AC4AHv8rAB//ywBT/7YAVf/LAFb/ywBX/74AWf/LAGH/ywBj/8sAmP/LALH/ywCy/8sAs//LALT/ywC1/8sAtv/LALf/ywC4/8sAuf/LALr/ywC7/8sAvP/LAMP/ywDE/8sAxf/LAMb/ywDH/8sAyf/LANL/ywDT/8sA1P/LANb/ywDY/8sA2v/LANz/ywDe/8sA+v/LAPz/ywEg/8sBIv/LAST/ywEm/8sBKP/LASr/ywEw/8sBMv/LAAIAOf9tAEb/DgABAEn/iQACAGj/sgBp/7YAAQAiAAQAAAAMAD4AXAB6AJgCAgIgAu4EUASiBVQGtggYAAEADAAUADQAQgBEAEUARgBJAEoAVwBoAGkAawAHADP+xQCR/sUAkv7FAJP+xQCU/sUAlf7FAJb+xQAHADP/zwCR/88Akv/PAJP/zwCU/88Alf/PAJb/zwAHADP/MwCR/zMAkv8zAJP/MwCU/zMAlf8zAJb/MwBaAEf/wwBH/8MAU/+mAFP/pgBV/6oAVf+qAFb/qgBW/6oAV/+qAFf/qgBZ/6oAWf+qAGH/qgBh/6oAY/+qAGP/qgCY/6oAmP+qALH/qgCx/6oAsv+qALL/qgCz/6oAs/+qALT/qgC0/6oAtf+qALX/qgC2/6oAtv+qALf/qgC3/6oAuP+qALj/qgC5/6oAuf+qALr/qgC6/6oAu/+qALv/qgC8/6oAvP+qAMP/qgDD/6oAxP+qAMT/qgDF/6oAxf+qAMb/qgDG/6oAx/+qAMf/qgDJ/6oAyf+qANL/qgDS/6oA0/+qANP/qgDU/6oA1P+qANb/qgDW/6oA2P+qANj/qgDa/6oA2v+qANz/qgDc/6oA3v+qAN7/qgD6/6oA+v+qAPz/qgD8/6oBIP+qASD/qgEi/6oBIv+qAST/qgEk/6oBJv+qASb/qgEo/6oBKP+qASr/qgEq/6oBMP+qATD/qgEy/6oBMv+qAAcAM//DAJH/wwCS/8MAk//DAJT/wwCV/8MAlv/DADMAM/8SAFP/ugBV/7oAVv+6AFf/ugBZ/7oAYf+6AGP/ugCR/xIAkv8SAJP/EgCU/xIAlf8SAJb/EgCY/7oAsf+6ALL/ugCz/7oAtP+6ALX/ugC2/7oAt/+6ALj/ugC5/7oAuv+6ALv/ugC8/7oAw/+6AMT/ugDF/7oAxv+6AMf/ugDJ/7oA0v+6ANP/ugDU/7oA1v+6ANj/ugDa/7oA3P+6AN7/ugD6/7oA/P+6ASD/ugEi/7oBJP+6ASb/ugEo/7oBKv+6ATD/ugEy/7oAWABT/0wAU/9MAFX/XABV/1wAVv9cAFb/XABX/1AAV/9QAFn/XABZ/1wAYf9cAGH/XABj/1wAY/9cAJj/XACY/1wAsf9cALH/XACy/1wAsv9cALP/XACz/1wAtP9cALT/XAC1/1wAtf9cALb/XAC2/1wAt/9cALf/XAC4/1wAuP9cALn/XAC5/1wAuv9cALr/XAC7/1wAu/9cALz/XAC8/1wAw/9cAMP/XADE/1wAxP9cAMX/XADF/1wAxv9cAMb/XADH/1wAx/9cAMn/XADJ/1wA0v9cANL/XADT/1wA0/9cANT/XADU/1wA1v9cANb/XADY/1wA2P9cANr/XADa/1wA3P9cANz/XADe/1wA3v9cAPr/XAD6/1wA/P9cAPz/XAEg/1wBIP9cASL/XAEi/1wBJP9cAST/XAEm/1wBJv9cASj/XAEo/1wBKv9cASr/XAEw/1wBMP9cATL/XAEy/1wAFAA1/88AOf/PAEH/zwBD/88AmP/PAKP/zwCk/88Apf/PAKb/zwCn/88Aqf/PANH/zwDT/88A1f/PAN3/zwD5/88A+//PASH/zwEv/88BMf/PACwAU//UAFX/1ABW/9QAV//UAFn/1ABh/9QAY//UAJj/1ACx/9QAsv/UALP/1AC0/9QAtf/UALb/1AC3/9QAuP/UALn/1AC6/9QAu//UALz/1ADD/9QAxP/UAMX/1ADG/9QAx//UAMn/1ADS/9QA0//UANT/1ADW/9QA2P/UANr/1ADc/9QA3v/UAPr/1AD8/9QBIP/UASL/1AEk/9QBJv/UASj/1AEq/9QBMP/UATL/1ABYAFP/sgBT/7IAVf+yAFX/sgBW/7IAVv+yAFf/pgBX/6YAWf+yAFn/sgBh/7IAYf+yAGP/sgBj/7IAmP+yAJj/sgCx/7IAsf+yALL/sgCy/7IAs/+yALP/sgC0/7IAtP+yALX/sgC1/7IAtv+yALb/sgC3/7IAt/+yALj/sgC4/7IAuf+yALn/sgC6/7IAuv+yALv/sgC7/7IAvP+yALz/sgDD/7IAw/+yAMT/sgDE/7IAxf+yAMX/sgDG/7IAxv+yAMf/sgDH/7IAyf+yAMn/sgDS/7IA0v+yANP/sgDT/7IA1P+yANT/sgDW/7IA1v+yANj/sgDY/7IA2v+yANr/sgDc/7IA3P+yAN7/sgDe/7IA+v+yAPr/sgD8/7IA/P+yASD/sgEg/7IBIv+yASL/sgEk/7IBJP+yASb/sgEm/7IBKP+yASj/sgEq/7IBKv+yATD/sgEw/7IBMv+yATL/sgBYAFP/pgBT/6YAVf+2AFX/tgBW/7YAVv+2AFf/tgBX/7YAWf+2AFn/tgBh/7YAYf+2AGP/tgBj/7YAmP+2AJj/tgCx/7YAsf+2ALL/tgCy/7YAs/+2ALP/tgC0/7YAtP+2ALX/tgC1/7YAtv+2ALb/tgC3/7YAt/+2ALj/tgC4/7YAuf+2ALn/tgC6/7YAuv+2ALv/tgC7/7YAvP+2ALz/tgDD/7YAw/+2AMT/tgDE/7YAxf+2AMX/tgDG/7YAxv+2AMf/tgDH/7YAyf+2AMn/tgDS/7YA0v+2ANP/tgDT/7YA1P+2ANT/tgDW/7YA1v+2ANj/tgDY/7YA2v+2ANr/tgDc/7YA3P+2AN7/tgDe/7YA+v+2APr/tgD8/7YA/P+2ASD/tgEg/7YBIv+2ASL/tgEk/7YBJP+2ASb/tgEm/7YBKP+2ASj/tgEq/7YBKv+2ATD/tgEw/7YBMv+2ATL/tgBcAB7/KwAe/ysAH//LAB//ywBT/7YAU/+2AFX/ywBV/8sAVv/LAFb/ywBX/74AV/++AFn/ywBZ/8sAYf/LAGH/ywBj/8sAY//LAJj/ywCY/8sAsf/LALH/ywCy/8sAsv/LALP/ywCz/8sAtP/LALT/ywC1/8sAtf/LALb/ywC2/8sAt//LALf/ywC4/8sAuP/LALn/ywC5/8sAuv/LALr/ywC7/8sAu//LALz/ywC8/8sAw//LAMP/ywDE/8sAxP/LAMX/ywDF/8sAxv/LAMb/ywDH/8sAx//LAMn/ywDJ/8sA0v/LANL/ywDT/8sA0//LANT/ywDU/8sA1v/LANb/ywDY/8sA2P/LANr/ywDa/8sA3P/LANz/ywDe/8sA3v/LAPr/ywD6/8sA/P/LAPz/ywEg/8sBIP/LASL/ywEi/8sBJP/LAST/ywEm/8sBJv/LASj/ywEo/8sBKv/LASr/ywEw/8sBMP/LATL/ywEy/8sAAgAcAAQAAABGAHoAAgADAAD/dQAAAAAAAP95AAEAEwAzADYAQQCRAJIAkwCUAJUAlgChAKMApAClAKYApwCpANcA2QD5AAIACAA2ADYAAQBBAEEAAQChAKEAAQCjAKcAAQCpAKkAAQDXANcAAQDZANkAAQD5APkAAQACABIAMwAzAAIANQA1AAEAOQA5AAEAQQBBAAEAQwBDAAEAkQCWAAIAmACYAAEAowCnAAEAqQCpAAEA0QDRAAEA0wDTAAEA1QDVAAEA3QDdAAEA+QD5AAEA+wD7AAEBIQEhAAEBLwEvAAEBMQExAAEAAgAUAAQAAAAcACAAAQACAAD/JAABAAIASwESAAIAAAACABkAUwBTAAEAVQBXAAEAWQBZAAEAYQBhAAEAYwBjAAEAmACYAAEAsQC8AAEAwwDHAAEAyQDJAAEA0gDUAAEA1gDWAAEA2ADYAAEA2gDaAAEA3ADcAAEA3gDeAAEA+gD6AAEA/AD8AAEBIAEgAAEBIgEiAAEBJAEkAAEBJgEmAAEBKAEoAAEBKgEqAAEBMAEwAAEBMgEyAAEAAQAAAAoAHgAsAAFERkxUAAgABAAAAAD//wABAAAAAWxpZ2EACAAAAAEAAAABAAQABAAAAAEACAABADYAAQAIAAUADAAUABwAIgAoAVwAAwBYAF4BWwADAFgAWwFaAAIAXgFZAAIAWwFYAAIAWAABAAEAWA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
