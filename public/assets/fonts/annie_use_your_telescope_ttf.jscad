(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.annie_use_your_telescope_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AhUADQG6ABIBugASAboAEgG6ABIBugASARkANgG6ABICBgAWAgYAFgIGABYCBgAWAcYABAFXABMBwgAoAVoAEwFaABMBWgATAVoAEwFaABMBWgATAkQAEwF3ABMBUQAXAVEAFwFRABcBUQAXAJEAEwCRAAMAkf/SAJH/0AFLABMBlQAOAXMAGAFzABgBcwAYAXMAGAFzABgBHAAOAXMAGAHKABMBygATAcoAEwHKABMBgAAKAZMAGgGAAAoBjgARAVoABwGOABUBWgATAY4AEwFaAA0BtAANAXcAEwG0AA0BdwATAbQADQF3ABMBtAANAXcAEwIaABMBqQADAhr/4wFOAAMB+AAOAVEAFwH4AA4BUQAXAfgADgFRABcB+AAKAVEAFwH4AA4BUQAXAjIAEwFj/4YCMgATAWP/hgIyABMBY/+GAjIAEwFj/4YBggAWAVkAGwFZ/8kAZP/CAJH/1wCR/5AAZAAEAJH/vwBkAAAAkQBDAcMAEwDT/yAB2wAgAYMADQHqABgAkQAOAeoAGACRACAB6gAYAOwAKQHqABgA7QApAikABgCR/5oCFQANAZUADgIVAA0BlQAOAhUADQGVAA4BlQALAGoABQG6ABIBcwACAboAEgFzABgBugASAXMAGAMxABICXgAYAgb/7wEyAA0CBv/vATIADQIG/+8BMgANAeoADQGKABEB6gANAYoAEQHqAA0BigARAeoADQGKABEBgAADAXwADQGAAAMBdwANAgYAFgHKABMCBgAWAcoAEwIGABYBygATAgYAFgHKABMCBgAWAcoAEwIGABYBygATAmYADgI3AA4BxgAEAYAACgHGAAQCkgAOAeAADgKSAA4B4AAOApIADgHgAA4BdQAKAxoAFQJEABMBugASAXMAGAHqAA0BigARASoAFwEqABIA8QA0AJkALADxADQBGwA0ATcAKwD8AAsCZgAOAjcADgJmAA4CNwAOAmYADgI3AA4BxgAEAYAACgE1AA4BtwAFAFsADgBbAA4AewAcANgAEwD6ABMA2AAWAYAAEwGAADoAwAA8AboAIAFoACABRgAdANgABAHwAAsDYAADARwADgCcACAB2AAKAb4ACgABAAAEGf5dAAAELv8g/4cEHQABAAAAAAAAAAAAAAAAAAABYwADAYkBkAAFAAACzQKaAAAAjwLNApoAAAHoADMBAAAAAgAAAAAAAAAAAKAAAC9QAABKAAAAAAAAAAAgICAgAEAAIPsCBBn+XQAABBkBowAAAJMAAAAAAasC2gAAACAAAQAAAAIAAAADAAAAFAADAAEAAAAUAAQA+AAAADoAIAAEABoAfgElASkBLAExATcBSQFlAX4BkgH/AhkCxwLdHoUe8yAUIBogHiAiICYgOiBEIKwhIiIS9sP7Av//AAAAIACgAScBKwEvATQBOQFLAWgBkgH8AhgCxgLYHoAe8iATIBggHCAgICYgOSBEIKwhIiIS9sP7Af///+P/wv/B/8D/vv+8/7v/uv+4/6X/PP8k/nj+aOLG4lrhO+E44TfhNuEz4SHhGOCx4DzfTQqdBmAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4AAAsS7gACVBYsQEBjlm4Af+FuABEHbkACQADX14tuAABLCAgRWlEsAFgLbgAAiy4AAEqIS24AAMsIEawAyVGUlgjWSCKIIpJZIogRiBoYWSwBCVGIGhhZFJYI2WKWS8gsABTWGkgsABUWCGwQFkbaSCwAFRYIbBAZVlZOi24AAQsIEawBCVGUlgjilkgRiBqYWSwBCVGIGphZFJYI4pZL/0tuAAFLEsgsAMmUFhRWLCARBuwQERZGyEhIEWwwFBYsMBEGyFZWS24AAYsICBFaUSwAWAgIEV9aRhEsAFgLbgAByy4AAYqLbgACCxLILADJlNYsEAbsABZioogsAMmU1gjIbCAioobiiNZILADJlNYIyG4AMCKihuKI1kgsAMmU1gjIbgBAIqKG4ojWSCwAyZTWCMhuAFAioobiiNZILgAAyZTWLADJUW4AYBQWCMhuAGAIyEbsAMlRSMhIyFZGyFZRC24AAksS1NYRUQbISFZLQC4Af+FsASNAAAVAAAAAAAMAJYAAwABBAkAAAB0AAAAAwABBAkAAQAwAHQAAwABBAkAAgAOAKQAAwABBAkAAwBQALIAAwABBAkABABAAQIAAwABBAkABQAkAUIAAwABBAkABgA6AWYAAwABBAkACAAgAaAAAwABBAkACQAgAaAAAwABBAkADAA0AcAAAwABBAkADSJwAfQAAwABBAkADgA0JGQAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAALAAgAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AIAAoAGsAaQBtAGIAZQByAGwAeQBnAGUAcwB3AGUAaQBuAC4AYwBvAG0AKQBBAG4AbgBpAGUAIABVAHMAZQAgAFkAbwB1AHIAIABUAGUAbABlAHMAYwBvAHAAZQBSAGUAZwB1AGwAYQByADEALgAwADAAMwA7AFUASwBXAE4AOwBBAG4AbgBpAGUAVQBzAGUAWQBvAHUAcgBUAGUAbABlAHMAYwBvAHAAZQAtAFIAZQBnAHUAbABhAHIAQQBuAG4AaQBlACAAVQBzAGUAIABZAG8AdQByACAAVABlAGwAZQBzAGMAbwBwAGUAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMAIAAyADAAMAAxAEEAbgBuAGkAZQBVAHMAZQBZAG8AdQByAFQAZQBsAGUAcwBjAG8AcABlAC0AUgBlAGcAdQBsAGEAcgBLAGkAbQBiAGUAcgBsAHkAIABHAGUAcwB3AGUAaQBuAGgAdAB0AHAAOgAvAC8AawBpAG0AYgBlAHIAbAB5AGcAZQBzAHcAZQBpAG4ALgBjAG8AbQBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMAAsACAASwBpAG0AYgBlAHIAbAB5ACAARwBlAHMAdwBlAGkAbgAgACgAawBpAG0AYgBlAHIAbAB5AGcAZQBzAHcAZQBpAG4ALgBjAG8AbQApAA0ACgANAAoAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABjAG8AcABpAGUAZAAgAGIAZQBsAG8AdwAsACAAYQBuAGQAIABpAHMAIABhAGwAcwBvACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIAAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAANAAoADQAKAA0ACgAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ADQAKAFMASQBMACAATwBQAEUATgAgAEYATwBOAFQAIABMAEkAQwBFAE4AUwBFACAAVgBlAHIAcwBpAG8AbgAgADEALgAxACAALQAgADIANgAgAEYAZQBiAHIAdQBhAHIAeQAgADIAMAAwADcADQAKAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQANAAoADQAKAFAAUgBFAEEATQBCAEwARQANAAoAVABoAGUAIABnAG8AYQBsAHMAIABvAGYAIAB0AGgAZQAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAgACgATwBGAEwAKQAgAGEAcgBlACAAdABvACAAcwB0AGkAbQB1AGwAYQB0AGUAIAB3AG8AcgBsAGQAdwBpAGQAZQAgAGQAZQB2AGUAbABvAHAAbQBlAG4AdAAgAG8AZgAgAGMAbwBsAGwAYQBiAG8AcgBhAHQAaQB2AGUAIABmAG8AbgB0ACAAcAByAG8AagBlAGMAdABzACwAIAB0AG8AIABzAHUAcABwAG8AcgB0ACAAdABoAGUAIABmAG8AbgB0ACAAYwByAGUAYQB0AGkAbwBuACAAZQBmAGYAbwByAHQAcwAgAG8AZgAgAGEAYwBhAGQAZQBtAGkAYwAgAGEAbgBkACAAbABpAG4AZwB1AGkAcwB0AGkAYwAgAGMAbwBtAG0AdQBuAGkAdABpAGUAcwAsACAAYQBuAGQAIAB0AG8AIABwAHIAbwB2AGkAZABlACAAYQAgAGYAcgBlAGUAIABhAG4AZAAgAG8AcABlAG4AIABmAHIAYQBtAGUAdwBvAHIAawAgAGkAbgAgAHcAaABpAGMAaAAgAGYAbwBuAHQAcwAgAG0AYQB5ACAAYgBlACAAcwBoAGEAcgBlAGQAIABhAG4AZAAgAGkAbQBwAHIAbwB2AGUAZAAgAGkAbgAgAHAAYQByAHQAbgBlAHIAcwBoAGkAcAANAAoAdwBpAHQAaAAgAG8AdABoAGUAcgBzAC4ADQAKAA0ACgBUAGgAZQAgAE8ARgBMACAAYQBsAGwAbwB3AHMAIAB0AGgAZQAgAGwAaQBjAGUAbgBzAGUAZAAgAGYAbwBuAHQAcwAgAHQAbwAgAGIAZQAgAHUAcwBlAGQALAAgAHMAdAB1AGQAaQBlAGQALAAgAG0AbwBkAGkAZgBpAGUAZAAgAGEAbgBkACAAcgBlAGQAaQBzAHQAcgBpAGIAdQB0AGUAZAAgAGYAcgBlAGUAbAB5ACAAYQBzACAAbABvAG4AZwAgAGEAcwAgAHQAaABlAHkAIABhAHIAZQAgAG4AbwB0ACAAcwBvAGwAZAAgAGIAeQAgAHQAaABlAG0AcwBlAGwAdgBlAHMALgAgAFQAaABlACAAZgBvAG4AdABzACwAIABpAG4AYwBsAHUAZABpAG4AZwAgAGEAbgB5ACAAZABlAHIAaQB2AGEAdABpAHYAZQAgAHcAbwByAGsAcwAsACAAYwBhAG4AIABiAGUAIABiAHUAbgBkAGwAZQBkACwAIABlAG0AYgBlAGQAZABlAGQALAAgAHIAZQBkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABhAG4AZAAvAG8AcgAgAHMAbwBsAGQAIAB3AGkAdABoACAAYQBuAHkAIABzAG8AZgB0AHcAYQByAGUAIABwAHIAbwB2AGkAZABlAGQAIAB0AGgAYQB0ACAAYQBuAHkAIAByAGUAcwBlAHIAdgBlAGQAIABuAGEAbQBlAHMAIABhAHIAZQAgAG4AbwB0ACAAdQBzAGUAZAAgAGIAeQAgAGQAZQByAGkAdgBhAHQAaQB2AGUAIAB3AG8AcgBrAHMALgAgAFQAaABlACAAZgBvAG4AdABzACAAYQBuAGQAIABkAGUAcgBpAHYAYQB0AGkAdgBlAHMALAAgAGgAbwB3AGUAdgBlAHIALAAgAGMAYQBuAG4AbwB0ACAAYgBlACAAcgBlAGwAZQBhAHMAZQBkACAAdQBuAGQAZQByACAAYQBuAHkAIABvAHQAaABlAHIAIAB0AHkAcABlACAAbwBmACAAbABpAGMAZQBuAHMAZQAuACAAVABoAGUAIAByAGUAcQB1AGkAcgBlAG0AZQBuAHQAIABmAG8AcgAgAGYAbwBuAHQAcwAgAHQAbwAgAHIAZQBtAGEAaQBuACAAdQBuAGQAZQByACAAdABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABkAG8AZQBzACAAbgBvAHQAIABhAHAAcABsAHkAIAB0AG8AIABhAG4AeQAgAGQAbwBjAHUAbQBlAG4AdAAgAGMAcgBlAGEAdABlAGQAIAB1AHMAaQBuAGcAIAB0AGgAZQAgAGYAbwBuAHQAcwAgAG8AcgAgAHQAaABlAGkAcgAgAGQAZQByAGkAdgBhAHQAaQB2AGUAcwAuAA0ACgANAAoARABFAEYASQBOAEkAVABJAE8ATgBTAA0ACgAiAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIgAgAHIAZQBmAGUAcgBzACAAdABvACAAdABoAGUAIABzAGUAdAAgAG8AZgAgAGYAaQBsAGUAcwAgAHIAZQBsAGUAYQBzAGUAZAAgAGIAeQAgAHQAaABlACAAQwBvAHAAeQByAGkAZwBoAHQAIABIAG8AbABkAGUAcgAoAHMAKQAgAHUAbgBkAGUAcgAgAHQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAYQBuAGQAIABjAGwAZQBhAHIAbAB5ACAAbQBhAHIAawBlAGQAIABhAHMAIABzAHUAYwBoAC4AIABUAGgAaQBzACAAbQBhAHkAIABpAG4AYwBsAHUAZABlACAAcwBvAHUAcgBjAGUAIABmAGkAbABlAHMALAAgAGIAdQBpAGwAZAAgAHMAYwByAGkAcAB0AHMAIABhAG4AZAAgAGQAbwBjAHUAbQBlAG4AdABhAHQAaQBvAG4ALgANAAoADQAKACIAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIgAgAHIAZQBmAGUAcgBzACAAdABvACAAYQBuAHkAIABuAGEAbQBlAHMAIABzAHAAZQBjAGkAZgBpAGUAZAAgAGEAcwAgAHMAdQBjAGgAIABhAGYAdABlAHIAIAB0AGgAZQAgAGMAbwBwAHkAcgBpAGcAaAB0ACAAcwB0AGEAdABlAG0AZQBuAHQAKABzACkALgANAAoADQAKACIATwByAGkAZwBpAG4AYQBsACAAVgBlAHIAcwBpAG8AbgAiACAAcgBlAGYAZQByAHMAIAB0AG8AIAB0AGgAZQAgAGMAbwBsAGwAZQBjAHQAaQBvAG4AIABvAGYAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAYwBvAG0AcABvAG4AZQBuAHQAcwAgAGEAcwAgAGQAaQBzAHQAcgBpAGIAdQB0AGUAZAAgAGIAeQAgAHQAaABlACAAQwBvAHAAeQByAGkAZwBoAHQAIABIAG8AbABkAGUAcgAoAHMAKQAuAA0ACgANAAoAIgBNAG8AZABpAGYAaQBlAGQAIABWAGUAcgBzAGkAbwBuACIAIAByAGUAZgBlAHIAcwAgAHQAbwAgAGEAbgB5ACAAZABlAHIAaQB2AGEAdABpAHYAZQAgAG0AYQBkAGUAIABiAHkAIABhAGQAZABpAG4AZwAgAHQAbwAsACAAZABlAGwAZQB0AGkAbgBnACwAIABvAHIAIABzAHUAYgBzAHQAaQB0AHUAdABpAG4AZwAgAC0ALQAgAGkAbgAgAHAAYQByAHQAIABvAHIAIABpAG4AIAB3AGgAbwBsAGUAIAAtAC0AIABhAG4AeQAgAG8AZgAgAHQAaABlACAAYwBvAG0AcABvAG4AZQBuAHQAcwAgAG8AZgAgAHQAaABlACAATwByAGkAZwBpAG4AYQBsACAAVgBlAHIAcwBpAG8AbgAsACAAYgB5ACAAYwBoAGEAbgBnAGkAbgBnACAAZgBvAHIAbQBhAHQAcwAgAG8AcgAgAGIAeQAgAHAAbwByAHQAaQBuAGcAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIAB0AG8AIABhACAAbgBlAHcAIABlAG4AdgBpAHIAbwBuAG0AZQBuAHQALgANAAoADQAKACIAQQB1AHQAaABvAHIAIgAgAHIAZQBmAGUAcgBzACAAdABvACAAYQBuAHkAIABkAGUAcwBpAGcAbgBlAHIALAAgAGUAbgBnAGkAbgBlAGUAcgAsACAAcAByAG8AZwByAGEAbQBtAGUAcgAsACAAdABlAGMAaABuAGkAYwBhAGwAIAB3AHIAaQB0AGUAcgAgAG8AcgAgAG8AdABoAGUAcgAgAHAAZQByAHMAbwBuACAAdwBoAG8AIABjAG8AbgB0AHIAaQBiAHUAdABlAGQAIAB0AG8AIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALgANAAoADQAKAFAARQBSAE0ASQBTAFMASQBPAE4AIAAmACAAQwBPAE4ARABJAFQASQBPAE4AUwANAAoAUABlAHIAbQBpAHMAcwBpAG8AbgAgAGkAcwAgAGgAZQByAGUAYgB5ACAAZwByAGEAbgB0AGUAZAAsACAAZgByAGUAZQAgAG8AZgAgAGMAaABhAHIAZwBlACwAIAB0AG8AIABhAG4AeQAgAHAAZQByAHMAbwBuACAAbwBiAHQAYQBpAG4AaQBuAGcAIABhACAAYwBvAHAAeQAgAG8AZgAgAHQAaABlACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAsACAAdABvACAAdQBzAGUALAAgAHMAdAB1AGQAeQAsACAAYwBvAHAAeQAsACAAbQBlAHIAZwBlACwAIABlAG0AYgBlAGQALAAgAG0AbwBkAGkAZgB5ACwAIAByAGUAZABpAHMAdAByAGkAYgB1AHQAZQAsACAAYQBuAGQAIABzAGUAbABsACAAbQBvAGQAaQBmAGkAZQBkACAAYQBuAGQAIAB1AG4AbQBvAGQAaQBmAGkAZQBkACAAYwBvAHAAaQBlAHMAIABvAGYAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALAAgAHMAdQBiAGoAZQBjAHQAIAB0AG8AIAB0AGgAZQAgAGYAbwBsAGwAbwB3AGkAbgBnACAAYwBvAG4AZABpAHQAaQBvAG4AcwA6AA0ACgANAAoAMQApACAATgBlAGkAdABoAGUAcgAgAHQAaABlACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAG4AbwByACAAYQBuAHkAIABvAGYAIABpAHQAcwAgAGkAbgBkAGkAdgBpAGQAdQBhAGwAIABjAG8AbQBwAG8AbgBlAG4AdABzACwAIABpAG4AIABPAHIAaQBnAGkAbgBhAGwAIABvAHIAIABNAG8AZABpAGYAaQBlAGQAIABWAGUAcgBzAGkAbwBuAHMALAAgAG0AYQB5ACAAYgBlACAAcwBvAGwAZAAgAGIAeQAgAGkAdABzAGUAbABmAC4ADQAKAA0ACgAyACkAIABPAHIAaQBnAGkAbgBhAGwAIABvAHIAIABNAG8AZABpAGYAaQBlAGQAIABWAGUAcgBzAGkAbwBuAHMAIABvAGYAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABtAGEAeQAgAGIAZQAgAGIAdQBuAGQAbABlAGQALAAgAHIAZQBkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABhAG4AZAAvAG8AcgAgAHMAbwBsAGQAIAB3AGkAdABoACAAYQBuAHkAIABzAG8AZgB0AHcAYQByAGUALAAgAHAAcgBvAHYAaQBkAGUAZAAgAHQAaABhAHQAIABlAGEAYwBoACAAYwBvAHAAeQAgAGMAbwBuAHQAYQBpAG4AcwAgAHQAaABlACAAYQBiAG8AdgBlACAAYwBvAHAAeQByAGkAZwBoAHQAIABuAG8AdABpAGMAZQAgAGEAbgBkACAAdABoAGkAcwAgAGwAaQBjAGUAbgBzAGUALgAgAFQAaABlAHMAZQAgAGMAYQBuACAAYgBlACAAaQBuAGMAbAB1AGQAZQBkACAAZQBpAHQAaABlAHIAIABhAHMAIABzAHQAYQBuAGQALQBhAGwAbwBuAGUAIAB0AGUAeAB0ACAAZgBpAGwAZQBzACwAIABoAHUAbQBhAG4ALQByAGUAYQBkAGEAYgBsAGUAIABoAGUAYQBkAGUAcgBzACAAbwByACAAaQBuACAAdABoAGUAIABhAHAAcAByAG8AcAByAGkAYQB0AGUAIABtAGEAYwBoAGkAbgBlAC0AcgBlAGEAZABhAGIAbABlACAAbQBlAHQAYQBkAGEAdABhACAAZgBpAGUAbABkAHMAIAB3AGkAdABoAGkAbgAgAHQAZQB4AHQAIABvAHIAIABiAGkAbgBhAHIAeQAgAGYAaQBsAGUAcwAgAGEAcwAgAGwAbwBuAGcAIABhAHMAIAB0AGgAbwBzAGUAIABmAGkAZQBsAGQAcwAgAGMAYQBuACAAYgBlACAAZQBhAHMAaQBsAHkAIAB2AGkAZQB3AGUAZAAgAGIAeQAgAHQAaABlACAAdQBzAGUAcgAuAA0ACgANAAoAMwApACAATgBvACAATQBvAGQAaQBmAGkAZQBkACAAVgBlAHIAcwBpAG8AbgAgAG8AZgAgAHQAaABlACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAG0AYQB5ACAAdQBzAGUAIAB0AGgAZQAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACgAcwApACAAdQBuAGwAZQBzAHMAIABlAHgAcABsAGkAYwBpAHQAIAB3AHIAaQB0AHQAZQBuACAAcABlAHIAbQBpAHMAcwBpAG8AbgAgAGkAcwAgAGcAcgBhAG4AdABlAGQAIABiAHkAIAB0AGgAZQAgAGMAbwByAHIAZQBzAHAAbwBuAGQAaQBuAGcAIABDAG8AcAB5AHIAaQBnAGgAdAAgAEgAbwBsAGQAZQByAC4AIABUAGgAaQBzACAAcgBlAHMAdAByAGkAYwB0AGkAbwBuACAAbwBuAGwAeQAgAGEAcABwAGwAaQBlAHMAIAB0AG8AIAB0AGgAZQAgAHAAcgBpAG0AYQByAHkAIABmAG8AbgB0ACAAbgBhAG0AZQAgAGEAcwANAAoAcAByAGUAcwBlAG4AdABlAGQAIAB0AG8AIAB0AGgAZQAgAHUAcwBlAHIAcwAuAA0ACgANAAoANAApACAAVABoAGUAIABuAGEAbQBlACgAcwApACAAbwBmACAAdABoAGUAIABDAG8AcAB5AHIAaQBnAGgAdAAgAEgAbwBsAGQAZQByACgAcwApACAAbwByACAAdABoAGUAIABBAHUAdABoAG8AcgAoAHMAKQAgAG8AZgAgAHQAaABlACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAHMAaABhAGwAbAAgAG4AbwB0ACAAYgBlACAAdQBzAGUAZAAgAHQAbwAgAHAAcgBvAG0AbwB0AGUALAAgAGUAbgBkAG8AcgBzAGUAIABvAHIAIABhAGQAdgBlAHIAdABpAHMAZQAgAGEAbgB5ACAATQBvAGQAaQBmAGkAZQBkACAAVgBlAHIAcwBpAG8AbgAsACAAZQB4AGMAZQBwAHQAIAB0AG8AIABhAGMAawBuAG8AdwBsAGUAZABnAGUAIAB0AGgAZQAgAGMAbwBuAHQAcgBpAGIAdQB0AGkAbwBuACgAcwApACAAbwBmACAAdABoAGUAIABDAG8AcAB5AHIAaQBnAGgAdAAgAEgAbwBsAGQAZQByACgAcwApACAAYQBuAGQAIAB0AGgAZQAgAEEAdQB0AGgAbwByACgAcwApACAAbwByACAAdwBpAHQAaAAgAHQAaABlAGkAcgAgAGUAeABwAGwAaQBjAGkAdAAgAHcAcgBpAHQAdABlAG4ADQAKAHAAZQByAG0AaQBzAHMAaQBvAG4ALgANAAoADQAKADUAKQAgAFQAaABlACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAsACAAbQBvAGQAaQBmAGkAZQBkACAAbwByACAAdQBuAG0AbwBkAGkAZgBpAGUAZAAsACAAaQBuACAAcABhAHIAdAAgAG8AcgAgAGkAbgAgAHcAaABvAGwAZQAsACAAbQB1AHMAdAAgAGIAZQAgAGQAaQBzAHQAcgBpAGIAdQB0AGUAZAAgAGUAbgB0AGkAcgBlAGwAeQAgAHUAbgBkAGUAcgAgAHQAaABpAHMAIABsAGkAYwBlAG4AcwBlACwAIABhAG4AZAAgAG0AdQBzAHQAIABuAG8AdAAgAGIAZQAgAGQAaQBzAHQAcgBpAGIAdQB0AGUAZAAgAHUAbgBkAGUAcgAgAGEAbgB5ACAAbwB0AGgAZQByACAAbABpAGMAZQBuAHMAZQAuACAAVABoAGUAIAByAGUAcQB1AGkAcgBlAG0AZQBuAHQAIABmAG8AcgAgAGYAbwBuAHQAcwAgAHQAbwAgAHIAZQBtAGEAaQBuACAAdQBuAGQAZQByACAAdABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABkAG8AZQBzACAAbgBvAHQAIABhAHAAcABsAHkAIAB0AG8AIABhAG4AeQAgAGQAbwBjAHUAbQBlAG4AdAAgAGMAcgBlAGEAdABlAGQAIAB1AHMAaQBuAGcAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALgANAAoADQAKAFQARQBSAE0ASQBOAEEAVABJAE8ATgANAAoAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABiAGUAYwBvAG0AZQBzACAAbgB1AGwAbAAgAGEAbgBkACAAdgBvAGkAZAAgAGkAZgAgAGEAbgB5ACAAbwBmACAAdABoAGUAIABhAGIAbwB2AGUAIABjAG8AbgBkAGkAdABpAG8AbgBzACAAYQByAGUAIABuAG8AdAAgAG0AZQB0AC4ADQAKAA0ACgBEAEkAUwBDAEwAQQBJAE0ARQBSAA0ACgBUAEgARQAgAEYATwBOAFQAIABTAE8ARgBUAFcAQQBSAEUAIABJAFMAIABQAFIATwBWAEkARABFAEQAIAAiAEEAUwAgAEkAUwAiACwAIABXAEkAVABIAE8AVQBUACAAVwBBAFIAUgBBAE4AVABZACAATwBGACAAQQBOAFkAIABLAEkATgBEACwAIABFAFgAUABSAEUAUwBTACAATwBSACAASQBNAFAATABJAEUARAAsACAASQBOAEMATABVAEQASQBOAEcAIABCAFUAVAAgAE4ATwBUACAATABJAE0ASQBUAEUARAAgAFQATwAgAEEATgBZACAAVwBBAFIAUgBBAE4AVABJAEUAUwAgAE8ARgAgAE0ARQBSAEMASABBAE4AVABBAEIASQBMAEkAVABZACwAIABGAEkAVABOAEUAUwBTACAARgBPAFIAIABBACAAUABBAFIAVABJAEMAVQBMAEEAUgAgAFAAVQBSAFAATwBTAEUAIABBAE4ARAAgAE4ATwBOAEkATgBGAFIASQBOAEcARQBNAEUATgBUACAATwBGACAAQwBPAFAAWQBSAEkARwBIAFQALAAgAFAAQQBUAEUATgBUACwAIABUAFIAQQBEAEUATQBBAFIASwAsACAATwBSACAATwBUAEgARQBSACAAUgBJAEcASABUAC4AIABJAE4AIABOAE8AIABFAFYARQBOAFQAIABTAEgAQQBMAEwAIABUAEgARQANAAoAQwBPAFAAWQBSAEkARwBIAFQAIABIAE8ATABEAEUAUgAgAEIARQAgAEwASQBBAEIATABFACAARgBPAFIAIABBAE4AWQAgAEMATABBAEkATQAsACAARABBAE0AQQBHAEUAUwAgAE8AUgAgAE8AVABIAEUAUgAgAEwASQBBAEIASQBMAEkAVABZACwAIABJAE4AQwBMAFUARABJAE4ARwAgAEEATgBZACAARwBFAE4ARQBSAEEATAAsACAAUwBQAEUAQwBJAEEATAAsACAASQBOAEQASQBSAEUAQwBUACwAIABJAE4AQwBJAEQARQBOAFQAQQBMACwAIABPAFIAIABDAE8ATgBTAEUAUQBVAEUATgBUAEkAQQBMACAARABBAE0AQQBHAEUAUwAsACAAVwBIAEUAVABIAEUAUgAgAEkATgAgAEEATgAgAEEAQwBUAEkATwBOACAATwBGACAAQwBPAE4AVABSAEEAQwBUACwAIABUAE8AUgBUACAATwBSACAATwBUAEgARQBSAFcASQBTAEUALAAgAEEAUgBJAFMASQBOAEcAIABGAFIATwBNACwAIABPAFUAVAAgAE8ARgAgAFQASABFACAAVQBTAEUAIABPAFIAIABJAE4AQQBCAEkATABJAFQAWQAgAFQATwAgAFUAUwBFACAAVABIAEUAIABGAE8ATgBUACAAUwBPAEYAVABXAEEAUgBFACAATwBSACAARgBSAE8ATQAgAE8AVABIAEUAUgAgAEQARQBBAEwASQBOAEcAUwAgAEkATgAgAFQASABFACAARgBPAE4AVAAgAFMATwBGAFQAVwBBAFIARQAuAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/swAzAAAAAAAAAAAAAAAAAAAAAAAAAAABYwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAECAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAwEEAQUBBgEHAQgA/QD+AQkBCgELAQwA/wEAAQ0BDgEPAQEBEAERARIBEwEUARUBFgEXARgBGQEaARsA+AD5ARwBHQEeAR8BIAEhASIBIwEkASUBJgEnAPoA1wEoASkBKgErASwBLQEuAS8BMAExATIBMwDiAOMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+AT8BQAFBALAAsQFCAUMBRAFFAUYBRwFIAUkBSgFLAPsA/ADkAOUBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfALsBYAFhAWIBYwDmAOcApgFkAWUBZgFnAWgBaQDYAOEA2wDcAN0A4ADZAN8BagFrAWwBbQFuAW8BcAFxALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAL4AvwC8AXIAjADvAXMAwADBB2h5cGhlbl8HQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24GZGNhcm9uBkRjcm9hdAdFbWFjcm9uB2VtYWNyb24GRWJyZXZlBmVicmV2ZQpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24LR2NpcmN1bWZsZXgLZ2NpcmN1bWZsZXgKR2RvdGFjY2VudApnZG90YWNjZW50DEdjb21tYWFjY2VudAxnY29tbWFhY2NlbnQLSGNpcmN1bWZsZXgLaGNpcmN1bWZsZXgEaGJhcgZJdGlsZGUGaXRpbGRlB2ltYWNyb24GSWJyZXZlB2lvZ29uZWsLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMS2NvbW1hYWNjZW50DGtjb21tYWFjY2VudAZMYWN1dGUGbGFjdXRlDExjb21tYWFjY2VudAxsY29tbWFhY2NlbnQGTGNhcm9uBmxjYXJvbgRMZG90BGxkb3QGTmFjdXRlBm5hY3V0ZQxOY29tbWFhY2NlbnQMbmNvbW1hYWNjZW50Bk5jYXJvbgZuY2Fyb24LbmFwb3N0cm9waGUDZW5nB09tYWNyb24Hb21hY3JvbgZPYnJldmUGb2JyZXZlDU9odW5nYXJ1bWxhdXQNb2h1bmdhcnVtbGF1dAZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4DFRjb21tYWFjY2VudAx0Y29tbWFhY2NlbnQGVGNhcm9uBnRjYXJvbgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHQUVhY3V0ZQdhZWFjdXRlC09zbGFzaGFjdXRlC29zbGFzaGFjdXRlDFNjb21tYWFjY2VudAxzY29tbWFhY2NlbnQGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMGWWdyYXZlBnlncmF2ZQRFdXJvC2NvbW1hYWNjZW50AAEAAf//AA8=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
