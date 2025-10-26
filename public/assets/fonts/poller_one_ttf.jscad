(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.poller_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEECQADAEwA+AADAAEECQAEABQA1gADAAEECQAFABoBRAADAAEECQAGACIBXgADAAEECQAHAFABgAADAAEECQAIACAB0AADAAEECQAJACAB0AADAAEECQAKAi4B8AADAAEECQALACQEHgADAAEECQAMABYEQgADAAEECQANAJgEWAADAAEECQAOADQE8AADAAEECQASAAwFJABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAAUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvACAAKAB3AHcAdwAuAHMAbwByAGsAaQBuAHQAeQBwAGUALgBjAG8AbQApAAoAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlAHMAIAAiAFAAbwBsAGwAZQByACIAIABhAG4AZAAgACIAUABvAGwAbABlAHIAIABPAG4AZQAiAC4AUABvAGwAbABlAHIAIABPAG4AZQBSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAAUABvAGwAbABlAHIAIABPAG4AZQAgADoAIAAyADMALQA5AC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyAFAAbwBsAGwAZQByAE8AbgBlAC0AUgBlAGcAdQBsAGEAcgBQAG8AbABsAGUAcgAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAuAFkAdgBvAG4AbgBlACAAUwBjAGgAnwB0AHQAbABlAHIAUABvAGwAbABlAHIAIABpAHMAIABhACAAaABpAGcAaAAgAGMAbwBuAHQAcgBhAHMAdAAgAHMAZQBtAGkALQBlAHgAdABlAG4AZABlAGQAIABzAHQAeQBsAGUAIABzAGEAbgBzACAAcwBlAHIAaQBmAC4AIABQAG8AbABsAGUAcgAnAHMAIABpAHMAIABiAG8AdABoACAAcgBlAGEAZABhAGIAbABlACAAYQBuAGQAIABmAHUAbABsACAAbwBmACAAcABlAHIAcwBvAG4AYQBsAGkAdAB5AC4AIABCAGUAYwBhAHUAcwBlACAAbwBmACAAdABoAGUAIABoAGkAZwBoAGUAcgAgAGMAbwBuAHQAcgBhAHMAdAAgAGkAdAAgAGkAcwAgAGIAZQBzAHQAIAB1AHMAZQBkACAAZgByAG8AbQAgAG0AZQBkAGkAdQBtACAAcwBpAHoAZQBzACAAdABvACAAbABhAHIAZwBlAHIAIABkAGkAcwBwAGwAYQB5ACAAcwBlAHQAdABpAG4AZwBzAC4AIABWAG8AbAB0AGEAaQByAGUAIAB3AGEAcwAgAGkAbgBzAHAAaQByAGUAZAAgAGIAeQAgAGgAYQBuAGQAIABsAGUAdAB0AGUAcgBpAG4AZwAgAG8AbgAgAGUAYQByAGwAeQAgADIAMAB0AGgAIABjAGUAbgB0AHUAcgB5ACAARwBlAHIAbQBhAG4AIABwAG8AcwB0AGUAcgBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgB5AHMAYwBoAC4AZABlAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAFAAbwBsAGwAZQByAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADoAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQIBAwEEANcBBQEGAQcBCAEJAQoBCwDiAOMBDAENALAAsQEOAQ8BEAERARIBEwDYAOEA3QDZARQAsgCzALYAtwDEALQAtQDFAIcAvgC/ARUEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24IZG90bGVzc2oMZG90YWNjZW50Y21iBEV1cm8AAAAAAAH//wADAAEAAAAMAAAAAAAAAAIAAQABAOcAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
