(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gochi_hand_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGEAZgBpAGMAYQAgACgAdwB3AHcALgBoAHUAZQByAHQAYQB0AGkAcABvAGcAcgBhAGYAaQBjAGEALgBjAG8AbQAuAGEAcgApACwAIAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQBzACAAIgBHAG8AYwBoAGkAIgAgAGEAbgBkACAAIgBHAG8AYwBoAGkAIABIAGEAbgBkACIARwBvAGMAaABpACAASABhAG4AZABSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAARwBvAGMAaABpACAASABhAG4AZAAgADoAIAAzADAALQA5AC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAEcAbwBjAGgAaQBIAGEAbgBkAC0AUgBlAGcAdQBsAGEAcgBHAG8AYwBoAGkAIABIAGEAbgBkACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAASgB1AGEAbgAgAFAAYQBiAGwAbwAgAGQAZQBsACAAUABlAHIAYQBsAC4ASgB1AGEAbgAgAFAAYQBiAGwAbwAgAGQAZQBsACAAUABlAHIAYQBsAHcAdwB3AC4AaAB1AGUAcgB0AGEAdABpAHAAbwBnAHIAYQBmAGkAYwBhAC4AYwBvAG0ALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAKAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP9mAGYAAAAAAAAAAAAAAAAAAAAAAAAAAADzAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCsAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAgEDAQQA1wEFAQYBBwEIAQkBCgDiAOMBCwEMALAAsQENAQ4BDwEQAREA5ADlALsA5gDnANgA4QDbANwA3QDZARIAsgCzALYAtwDEALQAtQDFAIcAqwC+AL8AvAETARQAwADBBGhiYXIGSXRpbGRlBml0aWxkZQJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAhrY2VkaWxsYQxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24LY29tbWFhY2NlbnQMZm91cnN1cGVyaW9yBEV1cm8AAQAB//8ADwABAAAADAAAAAAAAAACAAIAAQDwAAEA8QDyAAIAAQAAAAoADAAOAAAAAAAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFsaWdhAAgAAAABAAAAAQAEAAQAAAABAAgAAQAaAAEACAACAAYADADyAAIATwDxAAIATAABAAEASQ==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
