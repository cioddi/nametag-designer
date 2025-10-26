(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.strait_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAYAHAEyAAMAAQQJAAcAYgFOAAMAAQQJAAgALgGwAAMAAQQJAAkALgGwAAMAAQQJAAsALAHeAAMAAQQJAAwALAHeAAMAAQQJAA0BIAIKAAMAAQQJAA4ANAMqAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAyACwAIABFAGQAdQBhAHIAZABvACAAVAB1AG4AbgBpACAAKABoAHQAdABwADoALwAvAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AC4AYQByACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACcAUwB0AHIAYQBpAHQAJwBTAHQAcgBhAGkAdABSAGUAZwB1AGwAYQByAEUAZAB1AGEAcgBkAG8AUgBvAGQAcgBpAGcAdQBlAHoAVAB1AG4AbgBpADoAIABTAHQAcgBhAGkAdAA6ACAAMgAwADEAMgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAFMAdAByAGEAaQB0AC0AUgBlAGcAdQBsAGEAcgBTAHQAcgBhAGkAdAAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEUAZAB1AGEAcgBkAG8AIABSAG8AZAByAGkAZwB1AGUAegAgAFQAdQBuAG4AaQAuAEUAZAB1AGEAcgBkAG8AIABSAG8AZAByAGkAZwB1AGUAegAgAFQAdQBuAG4AaQBoAHQAdABwADoALwAvAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AC4AYQByAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAQMAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAQIAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXAOIA4wCwALEA5ADlALsA5gDnAKYA2ADhAQMA2wDcAN0A4ADZAN8AmwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgCMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDSAMAAwQduYnNwYWNlB3VuaTAyQzkMemVyb2luZmVyaW9yC29uZWluZmVyaW9yC3R3b2luZmVyaW9yDXRocmVlaW5mZXJpb3IMZm91cmluZmVyaW9yDGZpdmVpbmZlcmlvcgtzaXhpbmZlcmlvcg1zZXZlbmluZmVyaW9yDWVpZ2h0aW5mZXJpb3IMbmluZWluZmVyaW9yBEV1cm8AAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMBAgABAAAAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAMADAH6BcgAAQA4AAQAAAAXAGoFmgCIAkAAugDQAkAA7gJiAzwDvgEEBEAEQARABEAEQARABKgEfgSoBZoFmgABABcABQAKACQAKQAuAC8AMwA1ADcAOQA6ADwAgQCCAIMAhACFAIYAngDCAMgA2ADbAAcAgf+6AIL/ugCD/7oAhP+6AIX/ugCG/7oAh/+mAAwACv+6ADf/2AA5/+IAOv/sAFn/9gBa//YAXP/2AJ7/zgC+//YAwP/2AMj/zgDZ/7oABQBZ/+IAWv/iAFz/4gC+/+IAwP/iAAcACv+cADf/xAA5/84AOv/YAJ7/ugDI/7oA2f+cAAUAWf/sAFr/7ABc/+wAvv/sAMD/7AA6AA//zgAR/84ARP/EAEb/xABH/8QASP/EAEz/9gBN//YAUP/sAFH/7ABT/+wAVP/EAFX/7ABW/8QAV//sAFj/7ABd/+wAdv/sAIH/zgCC/84Ag//OAIT/zgCF/84Ahv/OAIf/xACh/8QAov/EAKP/xACk/8QApf/EAKb/xACn/8QAqP/EAKn/xACq/8QAq//EAKz/xACt//YArv/2AK//9gCw//YAsv/sALP/xAC0/8QAtf/EALb/xAC3/8QAuf/EALr/7AC7/+wAvP/sAL3/7ADB/+wAxf/EAMf/xADa/84A3f/OAOH/zgABACwABAAAABEDrABSAFIAdAFOAdACUgJSAlICUgJSAlICugKQAroDrAOsAAEAEQAKACkAMwA3ADkAOgCBAIIAgwCEAIUAhgCeAMIAyADYANsACAAk/+IAgf/iAIL/4gCD/+IAhP/iAIX/4gCG/+IAh//TADYAD//EABH/xAAk/9gARP/YAEb/2ABH/9gASP/YAFD/4gBR/+IAUv/YAFP/4gBU/9gAVf/iAFb/2ABX/+IAWP/iAF3/4gB2/+IAgf/YAIL/2ACD/9gAhP/YAIX/2ACG/9gAh//OAKH/2ACi/9gAo//YAKT/2ACl/9gApv/YAKf/2ACo/9gAqf/YAKr/2ACr/9gArP/YALL/4gCz/9gAtP/YALX/2AC2/9gAt//YALn/2AC6/+IAu//iALz/4gC9/+IAwf/iAMX/2ADH/9gA2v/EAN3/xADh/8QAIAAP/84AEf/OACT/4gBG/+IAR//iAEj/4gBS/+IAVP/iAFb/4gCB/+IAgv/iAIP/4gCE/+IAhf/iAIb/4gCH/9gAqP/iAKn/4gCq/+IAq//iAKz/4gCz/+IAtP/iALX/4gC2/+IAt//iALn/4gDF/+IAx//iANr/zgDd/84A4f/OACAAD//YABH/2AAk/+wARv/sAEf/7ABI/+wAUv/sAFT/7ABW/+wAgf/sAIL/7ACD/+wAhP/sAIX/7ACG/+wAh//iAKj/7ACp/+wAqv/sAKv/7ACs/+wAs//sALT/7AC1/+wAtv/sALf/7AC5/+wAxf/sAMf/7ADa/9gA3f/YAOH/2AAPAAX/ugAK/7oAN//YADn/4gA6/+wAPP/OAFn/9gBa//YAXP/2AJ7/zgC+//YAwP/2AMj/zgDZ/7oA3P+6AAoABf+cAAr/nAA3/8QAOf/OADr/2AA8/7oAnv+6AMj/ugDZ/5wA3P+cADwAD//OABH/zgAk/84ARP/EAEb/xABH/8QASP/EAEz/9gBN//YAUP/sAFH/7ABS/8QAU//sAFT/xABV/+wAVv/EAFf/7ABY/+wAXf/sAHb/7ACB/84Agv/OAIP/zgCE/84Ahf/OAIb/zgCH/8QAof/EAKL/xACj/8QApP/EAKX/xACm/8QAp//EAKj/xACp/8QAqv/EAKv/xACs/8QArf/2AK7/9gCv//YAsP/2ALL/7ACz/8QAtP/EALX/xAC2/8QAt//EALn/xAC6/+wAu//sALz/7AC9/+wAwf/sAMX/xADH/8QA2v/OAN3/zgDh/84ACAAk/7oAgf+6AIL/ugCD/7oAhP+6AIX/ugCG/7oAh/+mAAIAQAAEAAAAYACOAAQABgAA/87/uv+6AAAAAAAA/7r/nP+cAAAAAAAAAAAAAAAA/87/xAAAAAAAAAAA/7oAAAABAA4ABQAKACQALwA8AIEAggCDAIQAhQCGAJ4AwgDIAAIABwAFAAUAAwAKAAoAAwAvAC8AAQA8ADwAAgCeAJ4AAgDCAMIAAQDIAMgAAgACABIABQAFAAMACgAKAAMAJAAkAAQAPAA8AAEARgBIAAUAUgBSAAUAVABUAAUAVgBWAAUAgQCGAAQAngCeAAEAqACsAAUAswC3AAUAuQC5AAUAxQDFAAUAxwDHAAUAyADIAAEA2QDZAAIA3ADcAAIAAAABAAAACgAWABgAAWxhdG4ACAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
