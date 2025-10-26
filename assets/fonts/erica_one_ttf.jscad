(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.erica_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AZIAHQKZAB0CqQAdAsUAHQKcAB0CnQAdAmMAJALCAB0CnQAdAdYAJAHZACQB7wAdAkYAJAHvAB0B2wARAs4ADgLsAA4C8AAdAr0AHQL6AB0CcgAdAk0ADgLLAB0DBAAdAZIAHQH3AB0DIgAdAfcAHQNeAB0C3wAdAyEADgLyAB0DCgAdAwYAHQKzAB0CogAdAwQAHQLtAA4D1QAOAu0ADgMbAA4CkgAdAhoAJAGTAAkCGgBHAh4AJAFjAA0BhgAvApIAHQKpAB0CUQAdAqkAHQJ8AB0BygAVAoMADgKpAB0BZAAdAWH/8gLCAB0BbQAdA9EADgKpAB0CqQAdAqkAHQKpAB0B3gAdAk8AHQH5ABUCqQAdAo8ADgO2AA4CrAAJAo8ADgI4AB0B7AAkAWQAHQHsADkCBwAAAZAAFQJRAB0CnwArAtIAHQM4AB0BiQAvAoYAHQK+AHICtwALAhoADgM2ABcCUQAXArcACwGGAC8BGgAOAcIAFwHWAA4B5gAOAYYALwKpAB0CtAAOAbcAFAF0AC4BKQAOAgkADgM2AB0EfwAOBG4ADgUIAA4B2wAHAuwADgLsAA4C7AAOAuwADgLsAA4C7AAOA8EADgK9AB0CcgAdAnIAHQJyAB0CcgAdAZIAHQGSAB0BkgAMAZL/3QL6AAAC3wAdAyEADgMhAA4DIQAOAyEADgMhAA4CIgAOAyEADgMEAB0DBAAdAwQAHQMEAB0DGwAOAvIAHQKJAB0CkgAdApIAHQKSAB0CkgAdApIAHQKSAB0DnwAdAlEAHQJ8AB0CfAAdAnwAHQJ8AB0BZAAOAWQAHAFk//YBR/+1Ap0AEQKpAB0CqQAdAqkAHQKpAB0CqQAdAqkAHQJPAA4CqQAdAqkAHQKpAB0CqQAdAqkAHQKPAA4CqQAdAo8ADgFkAB0B2wAAAW0ABwQeAB0DwgAdArMAHQJPAB0ChQAPAxsADgKSAB0COAAdAcoAFQHRACsB0QArAgcALgIkAI8CJABkAVYAVgKFAD8CggAvAwMAKQIKABcCmQAXAXUAFAF1ABQBtwAUAtYAFALWABQDYwAUAekAHQHpAB0B6gAXBP0AFAcQAB0B4AAXAeAAHQGTAAkC0gAdAuwAFQQvAEACfwA/A00AHwQv/7gDXQAYAcIAFwMnAFQE9gAOAwoAWgJAAB0CVwAkAc4AHQHOAB0CGwAXCRcBHgMvABUDNgAVAAEAAASB/q0AAAkX/7X/fQf5AAEAAAAAAAAAAAAAAAAAAAD4AAICKAGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAAAAAAAAAAAAAAAIwAAAAAAAAAAAAAAAGx0dAAAQAAg+wIEgf6tAAAEgQFTIAAAAQAAAAACTwKzAAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABAFIAAAATgBAAAUADgB+AKwA/wExAUIBUwFhAWQBeAF+AZICxwLdA8AgFCAaIB4gIiAmIDAgOiBEIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvj/+wL//wAAACAAoQCuATEBQQFSAWABZAF4AX0BkgLGAtgDwCATIBggHCAgICYgMCA5IEQgrCEiISYiAiIGIg8iESIaIh4iKyJIImAiZCXK+P/7Af///+P/wf/A/4//gP9x/2X/Y/9Q/0z/Of4G/fb9FODC4L/gvuC94LrgseCp4KDgOd/E38He5t7j3tve2t7T3tDexN6o3pHejtsqB/YF9QABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAADcAAAAAwABBAkAAQASANwAAwABBAkAAgAOAO4AAwABBAkAAwBAAPwAAwABBAkABAASANwAAwABBAkABQAaATwAAwABBAkABgAgAVYAAwABBAkABwBWAXYAAwABBAkACAAgAcwAAwABBAkACQAgAcwAAwABBAkACwAkAewAAwABBAkADAAkAewAAwABBAkADQEgAhAAAwABBAkADgA0AzAAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABiAHkAIABMAGEAdABpAG4AbwBUAHkAcABlACAATABpAG0AaQB0AGEAZABhACAAKABpAG4AZgBvAEAAbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtACkALAAgACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlAHMAIAAiAEUAcgBpAGMAYQAiACAAIgBFAHIAaQBjAGEAIABPAG4AZQAiAEUAcgBpAGMAYQAgAE8AbgBlAFIAZQBnAHUAbABhAHIATQBpAGcAdQBlAGwASABlAHIAbgBhAG4AZABlAHoAOgAgAEUAcgBpAGMAYQAgAE8AbgBlADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMARQByAGkAYwBhAE8AbgBlAC0AUgBlAGcAdQBsAGEAcgBFAHIAaQBjAGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABMAGEAdABpAG4AbwBUAHkAcABlACAATABpAG0AaQB0AGEAZABhAE0AaQBnAHUAZQBsACAASABlAHIAbgBhAG4AZABlAHoAdwB3AHcALgBsAGEAdABpAG4AbwB0AHkAcABlAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUBAgC7AOYA5wCmANgA4QDbANwA3QDgANkA3wCbALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBAwCMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDSAMAAwQZUY2Fyb24ERXVybwAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA9wABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABAGIABAAAACwAvgDEAM4AzgDUAN4A6ADuATgBQgFcAWIBpAHKAeAB6gH8AgoEAgIoAloCfAKKA0YCuALKAtQC2gM0AvQDJgM0A0YDVANmA4QDigOoA8YD6AQCBAgEDgQOAAEALAASABMAFgAZABoAGwAcACQAJQAnACkALgAvADIAMwA0ADUANwA4ADkAOgA7ADwARABFAEYARwBIAEsATgBPAFAAUQBSAFMAVgBZAFoAWwBcAH8ApgDXANoAAQAS/6oAAgAW//IAGP/yAAEAHP/5AAIAF//yABj/8gACABj/+QAZ//kAAQAW//kAEgAF/9wACv/cACL/4wAm/+MAKv/rADL/6wA0//UAN//VADj/8gA5/9UAOv/cADz/zgBG/+sAWf/VAFr/1QBc/9UA2P/VANv/1QACADz/6wBc//IABgAk/+MAOf/VADr/4wA7/+MAPP/jAD3/8gABACT/6wAQABD/1QAm/9UAKv/VADL/1QA0/9UANv/yADn/4wA6/+MAPP/jAEj/4wBS/+MAWf/rAFr/6wBc/+sA1f/VANb/1QAJACr/8gA3/9wAOf/VADr/1QA8/8cAV//jAFr/4wBc/+MA9f/SAAUAJP/rADn/4wA6/+sAO//rADz/8gACACT/3AAt/+MABAA5/+MAOv/jADv/6wA8//IAAwA3//IAOf/mADz/6AAHABH/xwAk/9UALf/VAEb/6wBH/+sASP/rAFL/6wAMACT/1QAq/98ALf/VADL/4wA0/+MARP/cAEb/1QBI/9UAUv/jAFb/6wBY//IAXP/yAAgAJP/cACr/4wAt/9UAMv/rADb/8gBE/+sASP/jAFL/4wADACr/4wAy/+sANP/rAAsAJP/OACb/4wAq/+MALf/VADL/8gA0//IARP/yAEf/4wBI/+MAUv/rAFb/6wAEAFn/5gBa/+UAW//jAFz/4wACAEb/+QBc//kAAQBZ//UABgBE//IAWf/rAFr/7wBb/+sAXP/yAKb/8gAMAET/+QBG/+MAR//jAEj/6wBK/+8AUv/jAFT/4wBW//IAV//2AFn/6wBa/+sAXP/jAAMAWf/rAFr/8gBc//oABABZ//IAWv/yAFv/8gBc//IAAwBZ/+sAWv/yAFz/7wAEAFn/5gBa/+sAW//cAFz/5gAHAET/+QBH//IASv/5AFn/6wBa/+sAW//jAFz/4wABAFz/8gAHAET/8gBG/+MAR//rAEj/6wBS/+sAVP/rAFb/8gAHAEb/4wBH/+MASP/rAEr/6wBS/+YAVP/jAFb/6wAIAEb/3ABH/+MASP/jAEr/6wBS/9wAVP/jAFb/8gBc/+MABgBG/+kAR//jAEj/5gBS/+8AVP/rAFb/8gABACT/8gABAET/6wACACT/1QAt/6oAAAABAAAACgAmACgAAkRGTFQADmxhdG4AGAAEAAAAAP//AAAAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
