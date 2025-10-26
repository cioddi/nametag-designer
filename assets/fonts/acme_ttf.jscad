(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acme_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMgBBAGMAbQBlAC0AUgBlAGcAdQBsAGEAcgBBAGMAbQBlACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAASgB1AGEAbgAgAFAAYQBiAGwAbwAgAGQAZQBsACAAUABlAHIAYQBsAEoAdQBhAG4AIABQAGEAYgBsAG8AIABkAGUAbAAgAFAAZQByAGEAbABoAHUAZQByAHQAYQB0AGkAcABvAGcAcgBhAGYAaQBjAGEALgBjAG8AbQAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAP+WACEAAAAAAAAAAAAAAAAAAAAAAAAAAADmAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAwEEAQUA1wEGAQcBCAEJAQoBCwDiAOMBDAENALAAsQEOAQ8BEAERARIA2ADZALIAswC2ALcAxAC0ALUAxQCHAL4AvwETAMAAwQduYnNwYWNlBGhiYXIGSXRpbGRlBml0aWxkZQJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAhrY2VkaWxsYQxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24ERXVybwAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQADAOUAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
