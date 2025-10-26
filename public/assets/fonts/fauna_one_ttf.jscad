(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fauna_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHMAIAB0AGgAYQB0ACAAZgBvAHIAbQAgAHQAcgBhAGQAaQB0AGkAbwBuAGEAbAAgAHMAZQByAGkAZgBzAC4AIABJAHQAcwAgAHMAdAByAHUAYwB0AHUAcgBlACAAaQBzACAAcwBvAGYAdAAgAGEAbgBkACAAcwBsAGkAZwBoAHQAbAB5ACAAYwBvAG4AZABlAG4AcwBlAGQALgAgAEkAdAAgAHIAZQBhAGQAcwAgAGMAbABlAGEAcgBsAHkAIABpAG4AIABwAGEAcgBhAGcAcgBhAHAAaAAgAGMAbwBtAHAAbwBzAGkAdABpAG8AbgAgAGEAbgBkACAAbABvAG8AawBzACAAYgBlAGEAdQB0AGkAZgB1AGwAIABpAG4AIABoAGUAYQBkAGwAaQBuAGUAcwAuAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBW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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
