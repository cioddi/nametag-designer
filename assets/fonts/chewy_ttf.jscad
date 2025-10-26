(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.chewy_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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YC2wAiywASohLbADLCBGsAMlRlJYI1kgiiCKSWSKIEYgaGFksAQlRiBoYWRSWCNlilkvILAAU1hpILAAVFghsEBZG2kgsABUWCGwQGVZWTotsAQsIEawBCVGUlgjilkgRiBqYWSwBCVGIGphZFJYI4pZL/0tsAUsSyCwAyZQWFFYsIBEG7BARFkbISEgRbDAUFiwwEQbIVlZLbAGLCAgRWlEsAFgICBFfWkYRLABYC2wByywBiotsAgsSyCwAyZTWLBAG7AAWYqKILADJlNYIyGwgIqKG4ojWSCwAyZTWCMhsMCKihuKI1kgsAMmU1gjIbgBAIqKG4ojWSCwAyZTWCMhuAFAioobiiNZILADJlNYsAMlRbgBgFBYIyG4AYAjIRuwAyVFIyEjIVkbIVlELbAJLEtTWEVEGyEhWS0AAAC4Af+FsASNAAAVAAAAAAABAAAJaAABAY8GAAAIA1oANgA/ABQANgBE//YANgBI//YANgBJ//YANgBK//YANgBO/+EANgBP//YANgB5//YANgCx//YANgCy//YANgC8/+EANgDQ//YANgDR//YANgDS//YANgDT//YANgDU//YANgDV//YAOQA+//YAOQBP/+wAOQDM//YAOQDN//YAOQDO//YAOQDP//YAOgBE//YAOgBI//YAOgBK/+wAOgB5//YAOgCx//YAOgCy//YAOgDQ//YAOgDR//YAOgDS//YAOgDT/+wAOgDU/+wAOgDV/+wAOwAh/8MAOwAj/8MAOwA2//YAOwB0//YAOwB1//YAOwCg//YAOwCv//YAOwCw//YAOwDH//YAOwDJ//YAPAA+//YAPABI//YAPABJ//YAPABP/+wAPADM//YAPADN//YAPADO//YAPADP//YAPQA2//YAPQB0//YAPQB1//YAPQCg//YAPQCv//YAPQCw//YAPQDH//YAPQDJ//YAPwBP//YAQABE//YAQABG//YAQABK/+wAQAB5//YAQACx//YAQACy//YAQADQ//YAQADR//YAQADS//YAQADT/+wAQADU/+wAQADV/+wAQQBJ/7gAQQBK/9cAQQBL/80AQQBM/+wAQQBO/9cAQQBp/+wAQQBr/+EAQQBs//YAQQBu//YAQQC7//YAQQC8/9cAQQDT/9cAQQDU/9cAQQDV/9cARAA2//YARABO//YARAB0//YARAB1//YARACg//YARACv//YARACw//YARAC8//YARADH//YARADJ//YARQAh/6QARQAj/6QARQA2/+wARQA///YARQB0/+wARQB1/+wARQCg/+wARQCv/+wARQCw/+wARQDH/+wARQDJ/+wARwBc/+wARwBm/+wASAA2//YASAB0//YASAB1//YASACg//YASACv//YASACw//YASADH//YASADJ//YASQA2//YASQBY/+wASQBa/+wASQBc/9cASQBk/+wASQBl/+wASQBm/+EASQBq/+wASQBu//YASQB0//YASQB1//YASQCB/+wASQCC/+wASQCD/+wASQCE/+wASQCF/+wASQCL/+wASQCM/+wASQCN/+wASQCO/+wASQCP/+wASQCQ/+wASQCR/+wASQCS/+wASQCT/+wASQCg//YASQCv//YASQCw//YASQCz/+wASQC7//YASQDH//YASQDJ//YASgA2//EASgA+//YASgB0//EASgB1//EASgCg//EASgCv//EASgCw//EASgDH//EASgDJ//EASgDM//YASgDN//YASgDO//YASgDP//YASwAh/64ASwAj/64ASwAv/+wASwAw/+wASwBc/+wASwBk//YASwBm//YASwCL//YASwCM//YASwCN//YASwCO//YASwCP//YASwCz//YATAAh/+EATAAj/+EATAA2//YATABc//YATAB0//YATAB1//YATACg//YATACv//YATACw//YATADH//YATADJ//YATQBc//YATQBk//YATQBm//YATQBq//YATQBr//YATQBu//YATQCL//YATQCM//YATQCN//YATQCO//YATQCP//YATQCQ//YATQCR//YATQCS//YATQCT//YATQCz//YATQC7//YATgAh/64ATgAj/64ATgA2//YATgBY//YATgBc/+EATgBk//YATgBm//YATgB0//YATgB1//YATgCB//YATgCL//YATgCM//YATgCN//YATgCO//YATgCP//YATgCg//YATgCv//YATgCw//YATgCz//YATgDH//YATgDJ//YATwBa//YATwBc//YATwCC//YATwCD//YATwCE//YATwCF//YAYABY//sAYABa//sAYABc//sAYABk//YAYABm//YAYABq//sAYACB//sAYACC//sAYACD//sAYACE//sAYACF//sAYACL//YAYACM//YAYACN//YAYACO//YAYACP//YAYACQ//sAYACR//sAYACS//sAYACT//sAYACz//YAZABt//YAZQBt//YAagBs//YAagBt//YAawAh/7gAawAj/7gAbAAh/8MAbAAj/8MAbABa//sAbABe//sAbABk//YAbABm//YAbABq//YAbABt//YAbACC//sAbACD//sAbACE//sAbACF//sAbACG//sAbACH//sAbACI//sAbACJ//sAbACL//YAbACM//YAbACN//YAbACO//YAbACP//YAbACQ//YAbACR//YAbACS//YAbACT//YAbACz//YAbADW//sAbQBa//YAbQBc//EAbQBk//YAbQBm//YAbQBq//YAbQCC//YAbQCD//YAbQCE//YAbQCF//YAbQCL//YAbQCM//YAbQCN//YAbQCO//YAbQCP//YAbQCQ//YAbQCR//YAbQCS//YAbQCT//YAbQCz//YAdAA/ABQAdABE//YAdABI//YAdABJ//YAdABK//YAdABO/+EAdABP//YAdQA/ABQAdQBE//YAdQBI//YAdQBJ//YAdQBK//YAdQBO/+EAdQBP//YAdwBE//YAdwBI//YAdwBK/+wAeQA2//YAeQBO//YAiwBt//YAjABt//YAjQBt//YAjgBt//YAjwBt//YAkABs//YAkABt//YAkQBs//YAkQBt//YAkgBs//YAkgBt//YAkwBs//YAkwBt//YAoABE//YAoABI//YAoABK/+wArwA/ABQArwBE//YArwBI//YArwBJ//YArwBK//YArwBO/+EArwBP//YAsAA/ABQAsABE//YAsABI//YAsABJ//YAsABK//YAsABO/+EAsABP//YAsQA2//YAsQBO//YAsgBE//YAsgBI//YAsgBK/+wAvAA2//YAvABY//YAvABc/+EAvABk//YAvABm//YAxwA/ABQAxwBE//YAxwBI//YAxwBJ//YAxwBK//YAxwBO/+EAxwBP//YAyABE//YAyABI//YAyABK/+wAyQA/ABQAyQBE//YAyQBI//YAyQBJ//YAyQBK//YAyQBO/+EAyQBP//YAygBE//YAygBI//YAygBK/+wAywBE//YAywBI//YAywBK/+wA0AA2//YA0ABO//YA0QA2//YA0QBO//YA0gA2//YA0gBO//YA0wA2//EA0wA+//YA1AA2//EA1AA+//YA1QA2//EA1QA+//YAAAAOAK4AAwABBAkAAACQAAAAAwABBAkAAQAKAJAAAwABBAkAAgAOAJoAAwABBAkAAwAwAKgAAwABBAkABAAaANgAAwABBAkABQAaAPIAAwABBAkABgAaAQwAAwABBAkABwBqASYAAwABBAkACAA4AZAAAwABBAkACQAKAcgAAwABBAkACwBIAdIAAwABBAkADAAuAhoAAwABBAkADQBcAkgAAwABBAkADgBUAqQAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAAIABiAHkAIABGAG8AbgB0ACAARABpAG4AZQByACwAIABJAG4AYwAgAEQAQgBBACAAUwBpAGQAZQBzAGgAbwB3AC4AIABBAGwAbAAgAHIAaQBnAGgAdABzACAAcgBlAHMAZQByAHYAZQBkAC4AQwBoAGUAdwB5AFIAZQBnAHUAbABhAHIAMQAuADAAMAAxADsARABJAE4AUgA7AEMAaABlAHcAeQAtAFIAZQBnAHUAbABhAHIAQwBoAGUAdwB5ACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAEMAaABlAHcAeQAtAFIAZQBnAHUAbABhAHIAQwBoAGUAdwB5ACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAARgBvAG4AdAAgAEQAaQBuAGUAcgAsACAASQBuAGMAIABEAEIAQQAgAFMAaQBkAGUAcwBoAG8AdwAuAEYAbwBuAHQAIABEAGkAbgBlAHIALAAgAEkAbgBjACAARABCAEEAIABTAGkAZABlAHMAaABvAHcAUwBxAHUAaQBkAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBmAG8AbgB0AGIAcgBvAHMALgBjAG8AbQAvAHMAaQBkAGUAcwBoAG8AdwAuAHAAaABwAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBzAHEAdQBpAGQAYQByAHQALgBjAG8AbQBMAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAEEAcABhAGMAaABlACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADIALgAwAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBhAHAAYQBjAGgAZQAuAG8AcgBnAC8AbABpAGMAZQBuAHMAZQBzAC8ATABJAEMARQBOAFMARQAtADIALgAwAAAAAgAAAAAAAP+zADMAAAAAAAAAAAAAAAAAAAAAAAAAAADlAAAA6gDiAOMA5ADlAOsA7ADtAO4A5gDnAPQA9QDxAPYA8wDyAOgA7wDwAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQBiAGMAZABlAGYAZwBoAGkAagBrAGwAbQBuAG8AcABxAHIAcwB0AHUAdgB3AHgAeQB6AHsAfAB9AH4AfwCAAIEAgwCEAIUAhgCHAIgAiQCKAIsAjACNAI4AkACRAJYAlwCdAJ4AoAChAKIAowCkAKkAqgCrAQIArQCuAK8AsACxALIAswC0ALUAtgC3ALgAugC7ALwBAwC+AL8AwADBAMMAxADFAMYAxwDIAMkAygDLAMwAzQDOAM8A0ADRANMA1ADVANYA1wDYANkA2gDbANwA3QDeAN8A4QEEAL0A6QCTAOAHdW5pMDBBMARFdXJvCXNmdGh5cGhlbgAAAAADAAgAAgAQAAH//wAD","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
