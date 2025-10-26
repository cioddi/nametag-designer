(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lancelot_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ACD/8gAqACH/8gArACL/8QAsACP/8QAtACT/8QAuACT/8AAvACX/8AAwACb/8AAxACf/8AAyACf/7wAzACj/7wA0ACn/7wA1ACr/7gA2ACv/7gA3ACv/7gA4ACz/7QA5AC3/7QA6AC7/7QA7AC7/7AA8AC//7AA9ADD/7AA+ADH/6wA/ADL/6wBAADL/6wBBADP/6gBCADT/6gBDADX/6gBEADX/6QBFADb/6QBGADf/6QBHADj/6ABIADn/6ABJADn/6ABKADr/5wBLADv/5wBMADz/5wBNADz/5gBOAD3/5gBPAD7/5gBQAD//5QBRAED/5QBSAED/5QBTAEH/5ABUAEL/5ABVAEP/5ABWAEP/4wBXAET/4wBYAEX/4wBZAEb/4gBaAEf/4gBbAEf/4gBcAEj/4QBdAEn/4QBeAEr/4QBfAEr/4QBgAEv/4ABhAEz/4ABiAE3/4ABjAE7/3wBkAE7/3wBlAE//3wBmAFD/3gBnAFH/3gBoAFH/3gBpAFL/3QBqAFP/3QBrAFT/3QBsAFX/3ABtAFX/3ABuAFb/3ABvAFf/2wBwAFj/2wBxAFn/2wByAFn/2gBzAFr/2gB0AFv/2gB1AFz/2QB2AF3/2QB3AF3/2QB4AF7/2AB5AF//2AB6AGD/2AB7AGD/1wB8AGH/1wB9AGL/1wB+AGP/1gB/AGP/1gCAAGT/1gCBAGX/1QCCAGb/1QCDAGf/1QCEAGf/1ACFAGj/1ACGAGn/1ACHAGr/0wCIAGr/0wCJAGv/0wCKAGz/0gCLAG3/0gCMAG7/0gCNAG7/0gCOAG//0QCPAHD/0QCQAHH/0QCRAHH/0ACSAHL/0ACTAHP/0ACUAHT/zwCVAHX/zwCWAHX/zwCXAHb/zgCYAHf/zgCZAHj/zgCaAHj/zQCbAHn/zQCcAHr/zQCdAHv/zACeAHz/zACfAHz/zACgAH3/ywChAH7/ywCiAH//ywCjAH//ygCkAID/ygClAIH/ygCmAIL/yQCnAIP/yQCoAIP/yQCpAIT/yACqAIX/yACrAIb/yACsAIb/xwCtAIf/xwCuAIj/xwCvAIn/xgCwAIr/xgCxAIr/xgCyAIv/xQCzAIz/xQC0AI3/xQC1AI3/xAC2AI7/xAC3AI//xAC4AJD/wwC5AJH/wwC6AJH/wwC7AJL/wwC8AJP/wgC9AJT/wgC+AJT/wgC/AJX/wQDAAJb/wQDBAJf/wQDCAJj/wADDAJj/wADEAJn/wADFAJr/vwDGAJv/vwDHAJv/vwDIAJz/vgDJAJ3/vgDKAJ7/vgDLAJ//vQDMAJ//vQDNAKD/vQDOAKH/vADPAKL/vADQAKL/vADRAKP/uwDSAKT/uwDTAKX/uwDUAKb/ugDVAKb/ugDWAKf/ugDXAKj/uQDYAKn/uQDZAKr/uQDaAKr/uADbAKv/uADcAKz/uADdAK3/twDeAK7/twDfAK7/twDgAK//tgDhALD/tgDiALH/tgDjALH/tQDkALL/tQDlALP/tQDmALT/tADnALT/tADoALX/tADpALb/tADqALf/swDrALj/swDsALj/swDtALn/sgDuALr/sgDvALv/sgDwALv/sQDxALz/sQDyAL3/sQDzAL7/sAD0AL//sAD1AL//sAD2AMD/rwD3AMH/rwD4AML/rwD5AML/rgD6AMP/rgD7AMT/rgD8AMX/rQD9AMb/rQD+AMb/rQD/AMf/rAAAABcAAAD4CQkCBQUFBgUFBgQHBAQFBQUDBgUHBAQEBAQEBAQGBggGAwIDAwIDAwIGBQQEBwYGBgYFBQUFBQUFBQUEBgYGBQQEBAYFBQUFBQUFBQUICAYGBQUDBQUFBgIDBAQEBAQEBAQDAwMEAwMDAwMCBAQCAgICAgIEAgcFBQQEBAQEBAQEBAMDAwIEAwMEBAMGBAQEBAMEBQUEAgIEBgIDBAIEBAQFBAUEBAQEAwQDAwICAwYDBAMHBAcGAwMEBAMFBQYEBgYGBQQCAwMCAwcHBwYGBgQDBQYEAwQDAgMFBAMFAwEDAgIEBAICAgMEAgQEAgMEAwMDCQYGBgQKCgIFBQYGBQUGBAgFBQYGBgQHBggEBAQEBAQEBAYGCQYDAgMDAgMEAgcGBAQIBwYHBwYGBgYGBgYGBQQGBgcGBAQEBwYGBgYGBgYGBgkJBwYGBgQGBgUHAgQEBAQEBAQEBQQEBAUEBAQEBAMEBQMDAwMDAgQCCAUFBAQEBAQEBAQFAwMDAwUDAwUFBAYEBAQEBAUGBgUCAgQHAgMFAwQEBQUFBQQEBQUDBAQEAwMDBwMFBAcEBwcDAwUEBAUGBwUHBwcGBQIDAwIDBwcIBwcHBAQGBwQDBAMDBAUEAwYDAgQCAgQEAgICBAQCBQQCAwUEAwMKBwcHBAsLAgYGBgcGBgcECQUFBgYGBAcGCQUFBQUFBQQEBwcJBwQDBAQDBAQDCAYFBQkIBwcHBwcHBwcHBwcGBQcHCAYFBQUIBgYGBgYGBgYGCgoIBwYGBAYGBgcCBAQEBAQEBAQFBAQEBQQEBAQEAwUFAwMDAwMCBQMIBgYFBQUFBQUFBQUDBAQDBQMDBQUEBwUFBQUEBQYGBQMDBAcDBAUDBAUFBgUGBQUFBQMFBAQDAwQHAwUECAUIBwQEBQUEBgYHBQcHBwYFAgMDAwQICAgHBwcFBAYHBAQEAwMEBgQDBgMCBAICBQQCAgIEBQIFBQIDBQQEAwsHBwcEDA0CBgYHCAYGCAUKBgYHBwcECAcKBQUFBQUFBQUHBwoHBAMEBAMEBAMIBwUFCQgICAgHBwcHBwcHBwcFBwcIBwUFBQgHBwcHBwcHBwcLCwgIBwcEBwcGCAIEBQUFBQUFBQYEBAQGBAQEBAQDBQYDAwMDAwMFAwkGBgUFBQUFBQUFBgQEBAMGBAQGBgUIBQUFBQQGBwcGAwMFCAMEBgMFBQYGBQYFBQUFAwUFBAMDBAgEBQUJBQkIBAQGBQQGBwgGCAgIBwUDBAMDBAkJCQgICAUFBwgFBAUEAwQHBQQHAwIEAgIFBQICAgQFAwYFAgQGBQQDDQgICAUNDgIHBwcIBwcIBQsGBgcHBwUJBwoGBgYGBgYFBQgICwgEAwQEAwQFAwkHBgYKCQgJCQgICAgICAgIBwUICAkIBgUGCQcIBwgICAgICAwMCQgHBwUHBwcJAgUFBQUFBQUFBgUFBQYFBQUFBQMGBgMDAwMDAwYDCgcHBQUFBQUFBQYGBAQEAwYEBAYGBQgGBQUFBQYHCAYDAwUJAwQGAwUFBgcGBwUGBgYEBgUFBAMECQQGBQoGCQkEBAYGBQcHCQYJCQkHBgMEBAMECQkKCQkJBgUICQUEBQQDBQcFBAgEAgUCAwUFAgIDBQYDBgUDBAYFBQQOCQkJBQ8QAwgICQoICAoGDAcHCAgIBQoJDAcHBwcHBwYGCQkNCQUEBQUDBQUECggGBgwKCgoKCQkJCQkJCQkIBgkJCgkGBgYKCAkJCQkJCQkJDQ0KCggIBggJCAoDBQYGBgYGBgYHBgYGBwYGBgYGBAcHBAQEBAQDBgQLCAgGBgYGBgYGBwcFBQUEBwQEBwcGCgYGBgYGBwgJBwMEBgoEBQcEBgYHCAcIBgYHBwQHBgYEBAUKBQcGCwcLCgUFBwcGCAgKBwoKCggHAwQEBAULCwsKCgoGBgkKBgUGBAQFCAYFCQQCBQMDBgYDAwMGBwMHBgMEBwYFBBAKCgoGEBEDCAgJCggICgYNCAgJCQkGCwkNBwcHBwcHBgYKCg4KBgQGBgQGBgQLCQcHDQsKCgoKCgoKCgoKCgkHCgoLCQcHBwsJCQkJCQkJCQkODgsKCQkGCQkICwMGBgYGBgYGBgcGBgYIBgYGBgYEBwgEBAQEBAQHBAwICAcHBwcHBwcHCAUFBQQIBQUICAYKBwcHBwYHCQkIBAQGCwQFCAQGBwcIBwgHBwcHBQcGBgQEBQsFBwYMBwwLBgUIBwYJCQsICwsLCQcEBQQEBQwMDAsLCwcGCQsGBgYFBAYJBwUJBQMGAwMHBgMDAwYHAwgHAwUHBgYFEQsLCwYREgMJCQoLCQkLBw4ICAoKCgYMCg0ICAgICAgHBwoKDwsGBAYGBAYGBAwKBwcNDAsLCwoKCgoKCgoKCQcKCgwKBwcHDAoKCgoKCgoKCg8PDAsJCQYJCgkLAwYHBwcHBwcHCAYGBggGBgYGBgUICAQEBAQEBAcEDQkJBwcHBwcHBwgIBQUFBAgFBQgIBwsHBwcHBggJCggEBAcLBAYIBAcHCAkICQcHCAgFBwYGBQQFCwUIBw0HDAsGBggHBgkKCwgLCwsJCAQFBQQGDAwNCwsLBwYKCwcGBwUEBgkHBQoFAwYDAwcHAwMDBggECAcDBQgHBgUSCwsLBxMUBAoKCwwKCgwIEAkJCwsLBw0LDwgICAgICAcHDAwQDAcFBwcEBwcFDQsICA8NDAwMCwsLCwsLCwwKCAwMDQsICAgNCwsLCwsLCwsLERENDAsLBwsLCg0EBwgICAgICAgJBwcHCQcHBwcHBQgJBQUFBQUECAQOCgoICAgICAgICAkGBgYFCQYGCQkHDAgICAgHCQoLCQQFBw0FBgkFCAgJCgkKCAgJCQUIBwcFBQYNBgkHDggODQcGCQgHCgsNCQ0NDQoJBAYFBAYODg4NDQ0IBwsNCAcIBgUHCggGCwYDBwQECAgDBAQHCAQJCAQGCQcHBhQNDQ0HFRYECwsMDgsLDggRCgoMDAwIDgwRCQkJCQkJCAgNDRINBwUHBwUHCAUODAkJEA4NDg4MDAwMDAwMDQsJDQ0PDAkJCQ8MDAwMDAwMDAwTEw4ODAwIDAwLDgQICAgICAgICAoICAgKCAgICAgGCQoFBQUFBQUJBRALCwkJCQkJCQkJCgYHBwYKBgYKCggNCQkJCQgKDAwKBQUIDgUHCgUICQoLCgsJCQkKBgkICAYFBw4HCggQCQ8OBwcKCQgLDA4KDg4ODAoFBgYFBw8PEA4ODgkIDA4IBwgGBQgLCQYMBgMIBAQJCAQEBAgJBAoJBAYKCAcGFg4ODggYGQUMDA4PDAwPCRQLCw0NDQkQDhMLCwsLCwsJCQ8PFQ8IBggIBQgJBhENCgoTEA8QEA4ODg4ODg4PDQoPDxEOCgoKEQ0ODg4ODg4ODhYWERANDQkNDg0QBQkKCgoKCgoKCwkJCQsJCQkJCQYLDAYGBgYGBQoGEgwMCgoKCgoKCgsLBwgIBgwHBwwMCQ8KCgoKCQsNDgwGBgkQBggMBgoKCwwLDQoKCwsHCwkJBwYIEAgLCRIKERAICAwKCQ0OEAwQEBANCwUHBwYIERESEBAQCgkOEAoICgcGCQ0KBw4HBAkEBQoKBAUFCQsFDAoFBwsJCAcZEBAQCRscBQ4ODxEODhELFg0NDw8PChIQFQwMDAwMDAsLEREXEQkGCQkGCQoHEw8MDBUSERISEBAQEBAQEBAPCxAQExALCwsTDxAPEBAQEBAQGBgTEQ8PCg8QDhIFCgsLCwsLCwsNCgoKDQoKCgoKBwwNBwcHBwcGCwYUDg4LCwsLCwsLDA0ICQkHDQgIDQ0KEQsLCwsKDQ8QDQYHCxIHCQ0HCwsMDgwOCwsMDAgMCgoHBwkSCAwKFAwUEgkJDQwKDg8SDRISEg8MBggIBgkUFBQSEhILChASCwkLCAcKDwsIEAgECgUFCwsFBQUKDAYNCwUIDQoJCBwSEhILHR4GDw8REw8PEwsYDg4QEBAKFBEXDQ0NDQ0NCwsSEhkSCgcKCgcKCwcUEAwMFxQTExMREREREREREhAMEhIUEQwMDBQQEREREREREREaGhQTEBALEBEPEwYKDAwMDAwMDA4LCwsOCwsLCwsIDQ4HBwcHBwYMBxYPDwwMDAwMDAwNDgkJCQgOCQkODgsTDAwMDAsOEBEOBwcLEwcKDgcMDA0PDQ8MDA0NCA0LCwgICRMJDQsWDRUTCgoODQsPEBMOExMTEA0HCQgHChUVFhMTEwwLERMMCgwICAsQDAkRCAUKBQYMCwUGBgsNBg4MBgkNCwoIHhMTEwsgIQYQERIVEBAVDRsPDxISEgwWEhkODg4ODg4MDBQUGxQLCAsLBwsMCBYSDg4ZFhQVFRMTExMTExMTEQ0UFBYTDg0OFhISEhITEhITEx0dFhUSEgwSEhEVBgsNDQ0NDQ0NDwwMDA8MDAwMDAgOEAgICAgIBw4IGBAQDQ0NDQ0NDQ4PCgoKCA8JCQ8PDBQODQ0NDA8SEw8HCAwVCAsQCA0NDxAPEQ0ODg8JDgwMCQgKFQoPDBgOFxULCxAODBESFQ8VFRUSDgcJCQcLFxcYFRUVDgwTFQ0LDQkIDBENChMJBQsGBg0NBgYGDA4HEA0GCQ8MCwkhFRUVDSEiBhERExURERUNGxAQExMTDBYTGg8PDw8PDw0NFBQcFAsICwsICwwIFxMODhoXFRYWFBQUFBQUFBQSDhQUFxMODg4XEhMTExMTExMTHh4XFRISDBITERYGDA0NDQ0NDQ0PDAwMEAwMDAwMCQ8QCAgICAgHDggZEREODg4ODg4ODxAKCwsJEAoKEBANFQ4ODg4MDxITEAgIDRYICxAIDQ4PEQ8RDg4PDwkPDQwJCQsWCg8NGQ4YFgsLEA4MEhMWEBYWFhIPBwoJCAsYGBkWFhYODBMWDQsNCgkMEg0KEwoFDAYGDg0GBgYMDwcQDgcKDw0LCiIWFhYNJScHExMVGBMTGA8fEREVFRUNGRUdERERERERDg4XFyAXDQkNDQgNDQkZFRAQHRkYGBgWFhYWFhYWFhQQFxcaFhAPEBoVFRUVFhUVFhYhIRoYFBUOFBUUGQcNDw8PDw8PDxEODg4SDg4ODg4KEBIJCQkJCQgQCRwTEw8PDw8PDw8QEQsMDAoSCwsSEg4YEA8PDw4RFBYSCAkOGQkNEgkPDxETERQPEBERChAODgoKDBkMEQ4cEBsZDQwSEA4UFRkSGRkZFBEICwoJDBsbHBkZGRAOFhkPDQ8LCg4UDwsWCwYNBwcQDwYHBw4QCBIQBwsRDg0LJxkZGQ4qLAgWFhgbFhYbESMUFBgYGA8dGCETExMTExMQEBoaJBoOCg4OCg4PCh0YEhIhHRsbGxkZGRkZGRkZFxIaGh0YEhESHRcYGBgZGBgZGSYmHRsXFw8XGBYcCA8RERERERERFBAQEBQPDw8PDwsTFQsLCwsLCRIKIBUVERERERERERMUDQ0NCxQMDBQUEBsSERERDxQXGRQKChAcCg4VCxERExYTFhISExMMExAPCwsNHA0TEB8SHhwODhUSEBYYHBQcHBwXEwkMDAoOHh8gHBwcEhAZHBEOEQwLDxcRDRgMBw8ICBIRBwgIDxMJFRIIDBQQDwwsHBwcEC4wCRgYGh4YGB4SJhYWGhoaER8aJBUVFRUVFRISHBwnHBALEBAKEBELIBoUFCQfHR4eGxsbGxsbGxwZExwcIBsTExMgGhsaGxsbGxsbKSkgHhkaERkaGB8JERISEhISEhIVERERFhERERERDBQXDAwMDAwKEwsjFxcTExMTExMTFBYODw8MFg4OFhYSHRMTExMRFRkbFgsLEh8LEBcMEhMVGBUYExMVFQ0UERENDA8fDhUSIhQhHxAPFxQRGBofFh8fHxkVCg4NCw8hISMfHx8TERsfEhASDQwRGRMOGw0HEAgJExIICQkRFAoXEwkOFRIQDTAfHx8SMjQJGhodIBoaIBQpGBgcHBwSIh0oFhYWFhYWFBQfHysfEQwREQsREgwiHBUVJyIgISEeHh4eHh4eHhsVHx8jHRUVFSMcHR0dHR0dHR0tLSMgHBwSHB0aIQkSFBQUFBQUFBcTExMYEhISEhINFhkNDQ0NDQsVDCYZGRUVFRUVFRUWGA8QEA0YDw8YGBMgFRUVFRIXHB4YCwwUIQwRGQ0UFRcaFxoVFRYXDhYTEg4NECEQFxMlFiQhEREZFhMbHCEYISEhHBcLDw4MESQkJiEhIRUTHSEUERQPDRIbFA8dDggSCQoVFAkKChIWCxkVCg8XExEPNCEhIRQ2OAocHB8jHBwjFS0ZGR4eHhMlHysYGBgYGBgVFSEhLiETDRMTDBMUDSUeFxcqJSMjIyAgICAgICAhHRchISYfFxYXJh4fHx8gHx8gIDAwJSMeHhQeHx0kChMVFRUVFRUVGRQUFBoUFBQUFA4YGw4ODg4ODBcNKRsbFhYWFhYWFhgZEBERDhoQEBoaFSIXFhYWFBkeIBoMDRUkDRIbDhUWGRwZHRcXGBkPGBQUDw4RJBEZFSgYJyQTEhsXFB0eJBokJCQeGAwQDw0SJycpJCQkFxQgJBYTFhAOFB0WER8QCRMKChcVCQoKFBgLGhcLEBkVExA4JCQkFTo8Cx4eISUeHiUXMBsbISEhFSchLhoaGhoaGhcXJCQyJBQOFBQNFBUOKCEZ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ADAAMQAxACAAYgB5ACAATQBhAHIAaQBvAG4AIABLAGEAZABpAC4AIABBAGwAbAAgAHIAaQBnAGgAdABzACAAcgBlAHMAZQByAHYAZQBkAC4AIABMAGkAYwBlAG4AYwBlAGQAIAB1AG4AZABlAHIAIABTAEkATAAgAE8ARgBMACAAdgAxAC4AMQBMAGEAbgBjAGUAbABvAHQAUgBlAGcAdQBsAGEAcgBMAGEAbgBjAGUAbABvAHQAIABiAGUAdABhADoAIAAxAC4AMAAwADQAOwAgADIAMAAxADEAMQAuADAAMAA0AEwAYQBuAGMAZQBsAG8AdAAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAE0AYQByAGkAbwBuACAASwBhAGQAaQAsACAAMgAwADEAMQAuAE0AYQByAGkAbwBuACAASwBhAGQAaQAsACAAQQBuAHQAbwBuACAASwBvAG8AdgBpAHQATQBhAHIAaQBvAG4AIABLAGEAZABpAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACAAYgB5ACAATQBhAHIAaQBvAG4AIABLAGEAZABpAC4AIABBAGwAbAAgAHIAaQBnAGgAdABzACAAcgBlAHMAZQByAHYAZQBkACAAdQBuAGQAZQByACAAUwBJAEwAIABvAHAAZQBuAGYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACAAMQAuADEAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/5wAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA9gAAACQBAgDJAMcAYgCtAGMArgCQACUBAwAmAQQA/wBkACcBBQDpACgBBgBlAMgAygDLACkBBwAqAQgAKwEJACwBCgDMAM0AzgDPAC0BCwAuAQwALwENADABDgAxAQ8AZgAyARAA0ADRAGcA0wCvAJEAMwERADQBEgA1ARMANgEUAOQANwEVADgBFgDUANUAaADWADkBFwA6ARgAOwEZADwBGgDrALsAPQEbAO0AAwANAEQAagBpAGsAbQBsAG4ARQBGAQAAbwBHAEgAcAByAHMAcQBJAEoASwBMAHQAdgB3AHUATQBOAE8AUABRAHgAUgB6AHkAewB8AKEAfQBTAFQAVQBWAOUAVwBYAH4AgACBAH8AWQBaAFsAXADsALoAXQDuAIkAoADqAF8A6ABeAGAAPgBAABMA1wAVABYAFwAYABkAGgAbABwAQQBhANoA2QDbAEMAjQDhANgA3QDcAN4A4AAjAL0AigCLAIMAjgDfAAcAhACWAIUACQCXAAYAiACGAKsAIADxARwA8gDzAR0A9AD1APYAHwAhAKQA7wC4AAgA8AAUAJ0AngALAAwADgCTAEIAEACyAAQAowCiABEADwDDAIcAHQAeAMQAxQC2ALcAtAC1AAoABQCpAKoAvgC/ALMAvAASAD8AIgZBLmFsdDEGQi5hbHQxBkMuYWx0MQZELmFsdDEGRS5hbHQxBkYuYWx0MQZHLmFsdDEGSC5hbHQxBkkuYWx0MQZKLmFsdDEGSy5hbHQxBkwuYWx0MQZNLmFsdDEGTi5hbHQxBk8uYWx0MQZQLmFsdDEGUS5hbHQxBlIuYWx0MQZTLmFsdDEGVC5hbHQxBlUuYWx0MQZWLmFsdDEGVy5hbHQxBlguYWx0MQZZLmFsdDEGWi5hbHQxC3R3b2luZmVyaW9yDGZvdXJpbmZlcmlvcgAAAAABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAwAMAlwDUgABAFAABAAAACMAmgCaATABMACwANoA5AEWARYBMAEwAUoBSgFoAbIBsgHQAdAB0AHQAhACMgIKAhACEAIWAiQCJAIyAjwCPAJKAkoCSgJKAAEAIwABAAUAEAARABkAGwAnACkAKgAwADEAOAA5AEEASQBLAE8AUABRAFIAawByAHMAdAB1AIAAiQCKAIsAjACOAN8A4ADlAOYABQBL/5MAUP+zAFH/swBS/7MAjP/UAAoAAf9tAGT/rgB1/78Ad/+uAH7/vwCA/78AhP+/AN/+8wDl/vMA5v7zAAIAiv/PAIz/xwAMABv/zwAw/88AOv/PAGP/3wBk/8cAdf/PAHf/xwB+/88AgP/PAIT/zwCK/78AjP+/AAYAQf8RAEv/cwBQ/1IAUf9SAFL/UgCM/7QABgBQ/+gAUf/oAFL/6ADf/88A5f/PAOb/zwAHAAH/xwBBABgAZP/fAHf/3wDf/wwA5f8MAOb/DAASAAH/cwAb/8kAMP/JADr/yQBa/xAAZP9HAHX/JgB3/0cAfv8mAID/JgCE/30Aiv8xAIz/UQCS/xAA3/8mAOT/fQDl/yYA5v8mAAcAWv+eAGT/qQB3/6kAkv+eAN//MQDl/zEA5v8xAA4AAf/JAFr/iABk/5YAav+mAGz/vwB1/64Ad/+WAH7/rgCA/64Agf+OAJL/iADf/ywA5f8sAOb/LAABAIT/+AABAIT/7QADAN//hgDl/4YA5v+GAAMA3/9tAOX/bQDm/20AAgBk//gAd//4AAMA3/9lAOX/ZQDm/2UAAQDn/34AAQAuAAQAAAASAFYAkABgAG4AdACGAJAAkACaAKQAvgDMAMwAzADeAOQA6gDwAAEAEgAFABEAGQAbACcAKgAwADEAOQBBAEsAUABRAFIAgACKAIsAjgACAEn/kwBP/7MAAwBg/64AdP+/AOD+8wABAIn/zwAEAAz/zwBg/8cAdP/PAIn/vwACAEn/cwBP/1IAAgBP/+gA4P/PAAIAYP/fAOD/DAAGAAz/yQBY/xAAYP9HAHT/JgCJ/zEA4P8mAAMAWP+eAGD/qQDg/zEABABY/4gAYP+WAHT/rgDg/ywAAQDg/4YAAQDg/20AAQBg//gAAQDg/2UAAgCOAAQAAAC+AQoACQAHAAD/k/+zAAAAAAAAAAAAAAAAAAD/nv+p/zEAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAP9tAAAAAAAAAAAAAAAA/2UAAAAAAAD/6AAAAAD/zwAAAAAAAAAA/4j/lv8s/64AAP9z/1IAAAAAAAAAAAAAAAAAAAAA/9//DAAAAAEAFgABAAUAEAARACkAKgAwADEAOAA5AEkASwBPAFAAUQBSAHIAiQCKAIsAjACOAAIADAAQABEABQApACoABwAwADEABQA4ADkACABJAEkAAQBLAEsAAQBPAFIABgByAHIAAgCJAIoAAwCLAIsAAgCMAIwABACOAI4ABAACAA4ASQBJAAEASwBLAAEATwBSAAIAWABYAAMAWgBaAAMAYABgAAQAZABkAAQAdAB1AAYAdwB3AAQAfgB+AAYAgACAAAYAkgCSAAMA3wDgAAUA5QDmAAUAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAXRpdGwACAAAAAEAAAABAAQAAQAAAAEACAABAAYAAQABABoAAQAKAAwAEAATABkAGwAdAB8AJQAnACkAKwAtADAAOAA6ADwAPgBBAEMASQBLAE0ATwBT","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
