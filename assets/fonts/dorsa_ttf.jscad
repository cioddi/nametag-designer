(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dorsa_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AEz/6gBM/+IAyAAEAMcAFADAABQAwAAUAMAAFADEABQAwAAUAPUAFADAAA0AwAAUAMAAFQDAABQAwAAUAMUAFQDAABQBQv/8AMAAFQDAABUAwAAVAMQAFQDAABUAwQAVATUAFQDCABYAwAAUAMAAFADAABQAwAAUAEz/9gBMABQAegABAIwAAgDFABQAxQAUAMAAFADAABQAwAAUAMQAFADAABQBLQAUAMsADADAABQAwAAUAMAAFADAABQA0wAOAMEAFADTAA4BOQAUATQAFADFABUAwAAkAMAAIQC+ABQBDwAUAUEAFABrABcAawAXAGsAFwDGABcAxgAXAMYAFwEdABQA7AAUAMYAFADHABQAyAAEAQ0AFAABAAADWf84AAABuP/d/+IBoAABAAAAAAAAAAAAAAAAAAAA0wADAMABkAAFAAACvAKKAAAAjAK8AooAAAHdADIA+gAAAAAAAAAAAAAAAIAAAKcAAAAKAAAAAAAAAABweXJzAEAAICEiA1n/OAAAA1kAyCAAAREAAAAAAfQCvAAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQAsAAAACgAIAAEAAgAfgCgAKwArgD/AVMBeALGAtoC3AO8IBQgGiAeICIgJiA6IKwhIv//AAAAIACgAKEArgCwAVIBeALGAtoC3AO8IBMgGCAcICIgJiA5IKwhIv///+P/Y//B/8D/v/9t/0n9/P3p/ej8uOCy4K/gruCr4KjgluAl37AAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAKoAAAADAAEECQABAAoAqgADAAEECQACAA4AtAADAAEECQADAEAAwgADAAEECQAEAAoAqgADAAEECQAFABwBAgADAAEECQAGABoBHgADAAEECQAHAEIBOAADAAEECQAIABABegADAAEECQAJAB4BigADAAEECQAMACQBqAADAAEECQANASABzAADAAEECQAOADQC7AADAAEECQASAAoAqgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAAUwBhAG4AdABpAGEAZwBvACAATwByAG8AegBjAG8AIAAoAGgAaQBAAHQAeQBwAGUAbQBhAGQAZQAuAG0AeAApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEQAbwByAHMAYQAiAEQAbwByAHMAYQBSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAARABvAHIAcwBhACAAOgAgADQALQA5AC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyACAARABvAHIAcwBhAC0AUgBlAGcAdQBsAGEAcgBEAG8AcgBzAGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABUAHkAcABlAG0AYQBkAGUALgBUAHkAcABlAG0AYQBkAGUAUwBhAG4AdABpAGEAZwBvACAATwByAG8AegBjAG8AaAB0AHQAcAA6AC8ALwB0AHkAcABlAG0AYQBkAGUALgBtAHgAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADTAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugCwALEAuwDYAN0A2QCyALMAtgC3AMQAtAC1AMUAhwCrAL4AvwECAIwERXVybwAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABANIAAQAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAADAAwB5ASQAAEAMAAEAAAAEwHEAFoAZAB+AaABoAGuAdIBtAG+Ab4BxAHEAcQBxAHEAcQB0gHSAAEAEwAkAC4ALwA3ADkAOgA7ADwATgBXAFsAfwCAAIEAggCDAIQAnADBAAIAN//iADr//AAGADf/zgA5/84AOv/OADz/2ACc/9gAwf/YAEgACf/2AAv/9gAM//YAE//2ABT/9gAZ//YAI//2ACT/zgAt/9IAPv/2AED/9gBE/9gARf/2AEb/2ABH/9gASP/YAEn/+gBK/9gAS//2AEz/9gBN//YATv/2AE//9gBQ/9gAUf/YAFL/2ABT/9gAVP/YAFX/2ABW/84AV//YAFj/2ABZ/84AWv/OAFv/zgBc/84AXf/YAF//9gBg//YAY//YAHT/9gCF/84Anv/6AJ//2ACg/9gAof/YAKL/2ACj/9gApP/YAKX/2ACm/9gAp//YAKj/2ACp/9gAqv/YAKv/9gCs//YArf/2AK7/9gCv//YAsP/2ALH/9gCy//YAs//2ALT/9gC1//YAuP/2ALn/9gC6//YAu//2AL3/9gDA//YAAwAk/84ALf/YAIX/zgABAC3/9gACAFf/7ABa//4AAQBc//wAAwA3/84AOf/OADr/zgABAC3/2AABABIABAAAAAQAHgBQApICkgABAAQALwA3ADkAOgAMADf/zgA3/84AOf/OADn/zgA6/84AOv/OADz/2AA8/9gAnP/YAJz/2ADB/9gAwf/YAJAACf/2AAn/9gAL//YAC//2AAz/9gAM//YAE//2ABP/9gAU//YAFP/2ABn/9gAZ//YAI//2ACP/9gAk/84AJP/OAC3/0gAt/9IAPv/2AD7/9gBA//YAQP/2AET/2ABE/9gARf/2AEX/9gBG/9gARv/YAEf/2ABH/9gASP/YAEj/2ABJ//oASf/6AEr/2ABK/9gAS//2AEv/9gBM//YATP/2AE3/9gBN//YATv/2AE7/9gBP//YAT//2AFD/2ABQ/9gAUf/YAFH/2ABS/9gAUv/YAFP/2ABT/9gAVP/YAFT/2ABV/9gAVf/YAFb/zgBW/84AV//YAFf/2ABY/9gAWP/YAFn/zgBZ/84AWv/OAFr/zgBb/84AW//OAFz/zgBc/84AXf/YAF3/2ABf//YAX//2AGD/9gBg//YAY//YAGP/2AB0//YAdP/2AIX/zgCF/84Anv/6AJ7/+gCf/9gAn//YAKD/2ACg/9gAof/YAKH/2ACi/9gAov/YAKP/2ACj/9gApP/YAKT/2ACl/9gApf/YAKb/2ACm/9gAp//YAKf/2ACo/9gAqP/YAKn/2ACp/9gAqv/YAKr/2ACr//YAq//2AKz/9gCs//YArf/2AK3/9gCu//YArv/2AK//9gCv//YAsP/2ALD/9gCx//YAsf/2ALL/9gCy//YAs//2ALP/9gC0//YAtP/2ALX/9gC1//YAuP/2ALj/9gC5//YAuf/2ALr/9gC6//YAu//2ALv/9gC9//YAvf/2AMD/9gDA//YABgAk/84AJP/OAC3/2AAt/9gAhf/OAIX/zgACABwABAAAADQASgACAAMAAP/aAAAAAAAA/9oAAQAKACQAPAB/AIAAgQCCAIMAhACcAMEAAgADADwAPAABAJwAnAABAMEAwQABAAIABQAkACQAAgA8ADwAAQCFAIUAAgCcAJwAAQDBAMEAAQABAAAACgAWABgAAWxhdG4ACAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
