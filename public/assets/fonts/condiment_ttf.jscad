(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.condiment_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AVAAAwABBAkABAASATAAAwABBAkABQAaAaYAAwABBAkABgAiAcAAAwABBAkABwB6AeIAAwABBAkACAA6AlwAAwABBAkACQA6AlwAAwABBAkACwAgApYAAwABBAkADAAgApYAAwABBAkADQEgArYAAwABBAkADgA0A9YAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAAIABBAG4AZwBlAGwAIABLAG8AegBpAHUAcABhACAAKABzAHUAZAB0AGkAcABvAHMAQABzAHUAZAB0AGkAcABvAHMALgBjAG8AbQApACwADQBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMAAgAEEAbABlAGoAYQBuAGQAcgBvACAAUABhAHUAbAAgACgAcwB1AGQAdABpAHAAbwBzAEAAcwB1AGQAdABpAHAAbwBzAC4AYwBvAG0AKQAsAA0AdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBDAG8AbgBkAGkAbQBlAG4AdAAiAEMAbwBuAGQAaQBtAGUAbgB0AFIAZQBnAHUAbABhAHIAQQBuAGcAZQBsAEsAbwB6AGkAdQBwAGEALABBAGwAZQBqAGEAbgBkAHIAbwBQAGEAdQBsADoAIABDAG8AbgBkAGkAbQBlAG4AdAA6ACAAMgAwADEAMABWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAEMAbwBuAGQAaQBtAGUAbgB0AC0AUgBlAGcAdQBsAGEAcgBDAG8AbgBkAGkAbQBlAG4AdAAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEEAbgBnAGUAbAAgAEsAbwB6AGkAdQBwAGEAIABhAG4AZAAgAEEAbABlAGoAYQBuAGQAcgBvACAAUABhAHUAbAAuAEEAbgBnAGUAbAAgAEsAbwB6AGkAdQBwAGEALAAgAEEAbABlAGoAYQBuAGQAcgBvACAAUABhAHUAbAB3AHcAdwAuAHMAdQBkAHQAaQBwAG8AcwAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABT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ABf/1QAY/+YAGf/rABoAEgAb/+IAHP/oAGT/2QBl/+8AZ//vANX/0QAVAAT/wAAH/9EAEf/RABL/lQAT/8wAFP/AABX/pgAW/64AF//EABj/twAZ/9EAGv/IABv/xAAc/7wAIv/iAGP/5wBk/80AZf/RAGf/6wDV/4MA4f/DAB8AEf/hACT/1gAl//EAJv/6ACv/4gAs/+oALf/iADH/9AA2/+oANwAbADj/7wA5ABMAO//tADwAMgA9/+IAPwBrAET/5wBF//IARv/2AEf/8gBL//IATP/nAE3/5wBP/+wAUP/kAFL/4ABW//kAWf/xAFr/8QBc/+0AXf/qAB4ABP/pABH/1gAd/94AJP/eACX/4QAm/+8AKv/0ACv/5QAs/+0ALf/qADH/5gAy/+YANv/pADcAHgA4/+sAO//SAD3/7QA/ADwARP/yAEX/7gBJ/+MAS//rAEz/2gBP/+cAUP/qAFL/7gBW/+oAWf/vAFv/3QBd/+oAIQAR/+kAJP/eACX/6QAm/+wAKv/qACv/2AAs/90ALf/pADH/4gA2//EANwA4ADj/9QA5ADkAO//VADwAVgA9//EAPwCbAET/8QBF/+sASf/nAEv/6QBM/+AATf/kAE//5ABQ/+cAUv/yAFb/2QBY/+8AWf/qAFr/6wBb/+cAXP/xAF3/8QASABH/3gAl//EAKgAPACv/9QAs/+0ALf/eADH/9QAyABYANv/1ADcAHgA5AAcAO//AAD3/8QA/AB4ARf/yAEv/+QBb//UA1f+6ABwAJP/eACX/6AAm/+kAKv/sACv/6wAs/+8AMf/tADL/4gA2//MANwAUADj/5QA5AA0AO//zADwAMwA9//MAPwBrAET/8QBF//IARv/1AEn/5ABL/+4ATP/jAE3/5wBP/+QAUv/dAFb/0ABZ/+sAWv/uABoABP/rABH/lAAd/+oAIgBbACT/5gAlAB4AJgA1ACoAJgArAB8ALAAVAC3/pgAxACIAMgA9ADYAHgA3AIoAOAAnADkAgQA8AKkARP/dAEb/8QBH/+sASwAOAFL/0QBXAGAAW//yAFz/8QARABH/7wAd/+4AJf/wACYADAAqAA0ALP/zAC3/8wA3ACIAOQAnADv/5gA8AE0APf/vAD8AiQBF//YAS//vAE//7ABd//UAHAAE/9oAEf/vAB3/4gAiACIAJP/rACYACgAt/9kAMgAeADcATQA5AEoAO//VADwAZwA9/+8APwCgAET/7gBG//YAR//yAEv/+QBM/+4ATf/2AE//9QBQ/+cAUv/mAFb/9gBXAB0AWP/5AFn/+wBd/+4AHQAE/+sAEf/mAB3/6wAiACsAJP/tACX/6gAt/+IANwA4ADkAQQA7/+8APABbAD3/7wA/AKAARP/cAEX/6wBG/+sAR//kAEn/4wBL/+cATP/gAE3/4ABP/+8AUP/nAFL/4ABW/+QAVwARAFn/8QBc//IAXf/uACEAEf/QABL/0AAd/9EAJP/iACX/5gAr/+oALP/rAC3/0QA2/+8ANwBJADkAQQA7/8wAPABfAD3/7wA/AJUARP/gAEX/4ABG/+QAR//jAEn/6wBL/90ATP/gAE3/4ABP//IAUP/qAFL/3QBW/+4AVwAPAFj/9QBZ//YAW//rAFz/8gBd/+sAGAAk/90AJf/zACb/6gAt/+sANwBWADgADQA5AGwAO//rADwAWgA/ANEARP/kAEb/9gBH/+8AS//yAEz/4ABN/+MAT//uAFL/6gBW/+AAVwAgAFj/8gBZ/+4AWv/0AFz/8gAYACT/3QAm/+MAKv/uACv/4gAy/9kAN//XADj/8wA5/+kAO//zADz/4ABE/+4ARf/vAEb/9QBH//UAS//qAEz/1QBN/9UAT//YAFD/8gBS//IAVv/cAFj/9gBZ/+oAWv/rABgAEv/oACT/5QAl/+0ALP/vAC3/3QA3AEAAOQBJADv/4gA8AF8APf/zAET/7gBF/+QARv/nAEf/6wBJ/+4AS//uAEz/4ABN//IAUP/xAFL/5gBW//UAW//yAFz/8gBd//EAHAAR/+oAEv/iAB3/6gAk/+0ALP/qAC3/6gAx/+8AMgAEADcAUgA5AFIAO//vADwAeQA9//MAPwCyAET/7gBF/+cARv/xAEf/8gBJ/+QAS//uAEz/4ABQ//UAUv/dAFcAHABZ//UAW//yAFz/9gBd//IAFQAR/9kAHf/rACT/7wAl/+IALP/eAC3/6gA2/+oANwAeADkACAA7/6YAPf/hAD8AHgBF//IAS//1AEz/9gBP//IAUP/2AFf/8gBb//IAYP/lANX/uwAcABH/qgAk/+UAJQAPACYAOgAqADgAKwArAC3/twAyAEEANwBwADgAIwA5AE0AO/+vADwATQA/AHcARP/VAEb/7gBH/9UASwAVAEwADgBNABgATwASAFL/5gBWAA4AVwAnAFgACwBZAA4AWgAgAFsACgAaABH/4gAiACcAJP/2ACv/7gAt/+sAMgAKADcAQAA4/+8AOQAnADv/pgA8ADAAPwBNAET/6wBF//IARv/qAEf/8gBL//UATP/yAE3/9QBP/+4AUv/VAFb/8gBY/+8AWf/uAFr/8gBc//IAGgAE/+8AEf/qAB3/6wAiAAgAJP/xACX/7AAm//EAK//qACz/6gAt//MAMf/vADL/7wA3ACcAOQArADv/5gA8AEAAPf/zAD8AfQBF//YASf/yAEv/7gBM/+cATf/rAE//7gBQ//8AVv/yACIADAA9ABH/wwAd/+YAIgBjACT/sAAlACIAJgApACoAHwArAA0ALf+uADEAHwAyADgANgAaADcAhgA4ACYAOQCBADv/9wA8AKQAPQAVAD8A3ABE/5sARv+bAEf/sQBLAA4AUP+cAFL/kQBW/6sAVwAuAFj/vgBZ/9UAWv/cAFv/tgBc/7MAXf+qAA8AEf/mABL/4gAk/+IALf/dADIAGgA3AF8AOQBsADv/4gA8AIUAPf/zAD8A0ABE//IARf/yAEf/9QBd//UAIQAMAGYAEv+VACT/uwAlAEIAJgAeACoAEQArAB4ALAAvAC3/pQAxADgAMgBAADYAKwA3AJsAOABJADkASQA8AKwAPQAjAD8BHgBE/8cARQAdAEb/4ABH/98ASwAWAE8ACgBQ/+QAUv/IAFb/8gBXAGEAWP/yAFn/8gBc/+4AXf/fANUAHQAfAAwAbAAR/9kAEv+zACT/1QAlAE0AJgAtACoAOAArADgALAA8AC3/zQAxAEwAMgBCADYAOAA3AKwAOABWADkAXwA8AJcAPQBBAET/5ABFACAARv/uAEf/8gBLACsATwAZAFL/4wBW//EAVwByAFv/8gBd//IAYAAiANUAJwAaAAwAKQAk/+8AJQAWACb/4gAq/+IALf/qADEAGgA3AGwAOAAVADkASQA8AEkAPwDiAET/1gBG/9IAR//gAEn/4ABL//UATP/WAE3/4ABQ/+4AVv/VAFcAJABY/+AAWf/cAFr/0QBd/+4AJwAMAJ0AEf+yABL/3AAiAIoAJP+sACUAawAmADQAKgAiACsAXwAsAFoALf/MADEAZwAyAEoANgBFADcAxwA4ADwAOQBjADwAkgA9AEkAPwFIAET/vABFAD0ARv/HAEf/ywBJABUASwBDAE8ANgBQ/78AUv+nAFb/2QBXAIgAWP/cAFn/0gBa/+QAW//VAFz/1gBd/9wAYAAvANUAZAAZACT/7QAl//MAJv/xAC3/5gAy/+8ANv/vADcAHgA4//MAOQAeADv/3QA8ADAAPf/vAET/7gBF/+sASf/jAEv/6wBM/+QAT//nAFD/7gBS//kAVv/uAFj/8gBZ/+oAWv/uAFv/9QAEADEAGAAy/78AOP/oADn/3QAQABH/4gAd/+IARP/2AEX/9gBG//0AR//2AEv/6gBM/+8ATf/wAE//6QBQ/+wAUv/6AFf/9gBa//wAXf/sANX/wQARABH/4AAd/+0ARP/sAEX/7QBH//YASf/qAEv/6gBM/+cATf/nAE//5ABQ/+wAUv/2AFb/8wBb/+0AXP/2AF3/4ADV/6oADgA//+IARP/sAEX/7ABG//YAR//2AEv/9gBM/+sAT//lAFD/6QBS//YAV//2AFj/+wBZ//8A1f/mABcADAApABH/5wAd//AAIgA3AD8A6ABE/+wARf/wAEb/+gBH//YASf/4AEv/6ABM/+wATf/wAE//6wBQ/+wAUv/vAFb//ABXAAwAWP/0AFv/9ABc//QAXf/0ANX/zAAYAAT/6gAd/+YAIv/vAD//vwBE/+UARf/gAEb/7ABH/+IASf/nAEv/3gBM/9gATf/nAE//2gBQ/94AUv/yAFb/9gBX/+gAWP/sAFn/7ABa/+wAW//YAFz/7ABd/84A1f+yAAwAIgAWAET/9gBG//QASf/rAEv/7wBM/+MAT//qAFD/6QBS/+AAVv/1AFj/6QDV/9kACgBE//cARf/sAEn/9ABL/+wATP/sAE//7ABQ//wAUv/+AF3/9gDV/9EAFAA/AFoARP/vAEX/7ABG/+wAR//2AEn/3wBL/+8ATP/aAE3/3wBP/98AUP/iAFL/9gBW/+oAV//aAFj/8ABZ//AAWv/1AFv/7wBg/+UA1f+sABEAIgAjAD8AMABE//MARf/sAEb/+gBH//oAS//yAEz/9gBN//UAT//zAFD/8wBS/+sAVgABAFf/9gBb//0AXf/xANX/0QAVABH/5wBE/9gARf/fAEb/4gBH/+IASf/sAEv/2QBM/+QATf/xAE//3ABQ/90AUv/YAFb/8gBX//YAWP/sAFn/6wBa/+4AW//kAFz/8QBd/9QA1f+/AA0AEf/vAB3/7gA/AHcARP/zAEX/5gBM//IAT//oAFD/5wBX/+MAWgAKAFv/8gBd/+4A1f/OABYADAApABH/5wAd//AAIgA3AD8A6ABE/+wARf/wAEb/+gBJ//gAS//6AEz/7ABN//AAT//rAFD/7ABS/+wAVv/8AFcADABY//QAW//0AFz/9ABd//QA1f/MABMARP/iAEX/4wBG//YAR//2AEn/3wBL/+QATP/VAE3/4ABP/8kAUP/iAFL/5gBW/+cAV//xAFj/7ABZ/+sAW//vAFz/9gBd/90A1f+/ABgABP/nABH/6AAd/+sARP/iAEX/4wBG//YAR//sAEn/6gBL/+IATP/fAE3/1wBP/9cAUP/mAFL/7ABW/+4AV//eAFj/6wBZ/+8AWv/xAFv/7gBc//YAXf/nAGD/5QDV/74AEgBEAAYARf/2AEYACABHAAwASf/sAEv//ABM//YATf/+AFD/+QBSAAMAVv/9AFgACgBZAAMAWgAKAFv/7ABcAAUAXf/yANX/1gAQAAT/6wBE//kARf/qAEn/7wBL/+gATP/jAE3/8gBP/+MAUP/xAFL/+gBW//YAWf/yAFr/9gBb/+4AXf/uANX/xAALABH/6wBE/+wARf/qAEf/9gBL//IATP/1AE//6wBQ/+sAUv/5AFj/9gBb//UAEgAE/+sAEf/ZAB3/5wBE/+sARf/gAEb/9ABH//YAS//lAEz/5wBN/+sAT//rAFD/5gBS/+kAVv/2AFf/2wBY/+sAXP/6AF3/3AASAB3/7QBE/+UARf/sAEb/8QBH//YASf/vAEv/7ABM/+4ATf/1AE//5wBQ/9wAUv/iAFb/7gBX/+QAWP/2AFv/8gBd/+sA1f/eAA0ABAA5AAwAXwAiAKoARP/lAEb/+ABM/94AT//9AFD/4QBS/+0AVv/qAFf/7gBd//IA1QA/ABMAEf/nAD//1gBE/+wARf/sAEb/9gBH//YASf/2AEv/4ABM/+EATf/uAE//4QBQ/+gAUv/uAFb/8wBX/+wAWP/xAFz/9gBd//IA1f/MAA4AEf/WAB3/5wBE/+wARf/tAEv/8QBM/+8ATf/yAE//6wBQ/+cAUv/3AFf/8gBb//IAXf/nANX/xAANABH/2QAd//IARP/OAEX/5wBG/9YAR//iAEz/9gBP/+IAUP/gAFL/wwBc//YAXf/nANX/4wAKAD//3ABE/+wARf/2AEf/9gBM/+cAT//xAFD/6ABS//YAVv/2ANX/0QAJABH/5ABE//QARf/2AE0ADwBP/+sAUP/wAFv/9gBd//IA1f/PAAUANwA9ADkASwA7/+UAPAB7AD3/6wACABX/6wAW//QAAQAX/9UACAAUABUAFf/eABb/5gAX/8gAGP/vABn/6gAaADgAG//mAAQAFf/AABb/1QAb/+8AHP/rAAcAJgASACoAEgArABYAMgASADb/6gA5ABsAO//qAAEA1f+lAAEA1QBSAAMANwAgADkAGAA8AEwAAQBW/78ACAAT//AAFf/QABb/vgAX/4wAGP/bABn/6AAaAD8AG//DAAAAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
