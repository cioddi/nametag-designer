(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.girassol_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAOAIAAAwBgR1BPU+Q47pUAAIIYAAAD0kdTVUKmm62fAACF7AAABEpPUy8yUtR+0wAAcUQAAABgY21hcDhB7U8AAHGkAAAEbmdhc3AAAAAQAACCEAAAAAhnbHlmQp6CiwAAAOwAAGZsaGVhZBdXboYAAGqgAAAANmhoZWEH1gTNAABxIAAAACRobXR49mg0bQAAatgAAAZIbG9jYZ/Zh0QAAGd4AAADJm1heHABrwGEAABnWAAAACBuYW1lULBxDgAAdhwAAANycG9zdB2dSeQAAHmQAAAIfXByZXBoBoyFAAB2FAAAAAcAFAAwACgCDALGAAMABwAhAFQAZAB0AIMAkQCfAK0AyADXAOYA7gD+AQ4BGwEnATUBOQAAAREhEQERIRETMxEhETM1Jyc0MzYzFzM1MxUzNzIXMhUHBxUVFAc3NhYHBwYnJyY2FxcmNTUjBiMiFCMVBxEwMhUUFzMUMjEhMDI1MzA2NTA0MxE0IwUnJjYXFxYUIyMiBhUVFCI3IiY3NzYWBwcUIjU1NCYjBxY3NzIUIwcGIicnIjYzFyY2FxcWNzc2FgcHBicXBwYXFxYiJycmNzc2FgU3NicnNDYXFxYHBwYiNyI1NDYzMhYVFAYGFSM0NjY1NCYjIgcWFRQGNzYWFQcGFxcUBicnJiY3BTYnJzQ2FxcWBgcHBiY1FzQzMhUUIyI3FxYGJyciNjMzMjY1NTQ2BzIUIwcGJjc3NBYVFRQWMzciJjc3NhcXFiMnJgc3FxYjJyYHByI3NzYHFgYjJyYHByImNzc2FxchESECDP4kAdP+Nvyp/oCpBQEDBgIDCQwJAwIGAwEFAkoCAQJNEhNNAgIBSQKgAQEBAQEBAQECAW4CAQEBBf6kDAUZEzECAiYOFAT/AQECMRMYBQwEEw7qCQkTAgEKCBYICwEBAcMBAQEUCQgUAQEBChMUSAkBAQkBBAEXBQUXAQT+0QoCAgoEARcFBRcBBH8QFhAUGBQUCw8ODQsLBw0JwQEDCAMDCAMBCggBCf6xAwMIAgEKCgEICwECpAsKCguzDAUYEzECAQEmDhME/gICMRMZBQwEFA4BAQEBChQTCgMEFAgJ3wsCAxQJCRMCAQoTAgIBAlgHCFYBAgJMExLT/jYBygLG/WICnv6NAWr+lgFF/t4BIgMOBAQCBwkJBwIEBA4HBwMGCAEEARYGBhYBBAEIBgMHAQEBAv7vAQEBAQEBAQEBEQVdKRIbAwkBBBQOIgJGBAEJAxsSKQECIg4UDQMDBQIGBwYHAgMBAgEFAgMEAQIBBg0NBlcHCFYCAksSFE0CAr5XCAdWAgICTRITTAKEEQ4SFRETERIVGxMMEQwQCgMMBgkLAgECIA4NIAEBAQ8OIg4sDg4fAgECDw4iDhABAQELDQ0MFSkSHAQKBBQOIgIBRwQKBBwSKQIBAiIOFAgCAQYNDQYDBQMDBAYDBQICBQMGDiwBBAoCAgoEARYGBlH+5gAAAgAAAAAB2wL8ABcAGgAANwYWMxUjNTI2NxMzExYWMxUjNTI2JycjNzMDawQfIacdHAWWMJsFGR7oJB0FFZoJiEJRFRclJRQYAqv9UxkRJSUTFmUoAT8AAAIAGgAAAdYC7gAWACoAADcyNjURNCYjNTMyFhUUBgcWFhUUBiMhEyMRMzI2NTU0JiMjNTMyNjU1NCYaIBwcIOxaXyQsNjFcYP8A7EBUISgoISsXISgnJRQXAk4XFCVgWz9KGhxZRm1oAsb9YjUrjSw2KDYsZSw0AAEAK//2AY0DFAAgAAATMjY3MxcHLgIjIgYVERQWMzI2NTUzFRQGIyImNRE0NvEmIAgiLCITICMbKDczJy86K1FUV2JlAvgMELUJMjQUPS3+Iis4U0UQAW1pcmQBVmltAAIAGAAAAb8C7gAPABkAADcyNjURNCYjNTMyFREUIyMTIxEzMjY1ETQmGCAcHCDuubnu7kJCIikpJRQXAk4XFCXW/r7WAsb9YjUrAd4sNAAAAQAe/+EB1QMUACwAADcyNjURNCYjNSEyNjczFwcuAiMjETMyNTMVIzQmIyMRMzI2NjczFSMmJiMhHiAcHCABJxcUAyIsIhEhMy1DGkUlJSEkGmwtMRgGIyUEHyL+syUUFwJOFxQlERW1CTAwEP7ZSLgmIv6xFDg3yhEOAAEAHgAAAcEDFAAlAAA3MjY1ETQmIzUhMjY3MxcHLgIjIxEzMjUzFSM0JiMjERQWMxUjHiAcGSMBJxcUAyIsIhEhMy1DGkUlJSEkGhwg6CUUFwJOGhElERW1CTAwEP7FSLgmIv7tFxQlAAABAC3/9gG7AxQAJgAAEyIGFREUFjMyNjU1NCM1MxUiFREjJwYjIjURNDYzMjY3MxcHLgL9JzknIiMpR9AeFxwtWLhmYSYgCCIsIhMgIwLQPiz+GCw0NSvFNSUlI/6rJS/WAVZobgwQtQkyNBQAAAEAGgAAAhMC7gArAAA3ETQmIzUzFSIGFRUzNTQmIzUzFSIGFREUFjMVIzUyNjURIxEUFjMVIzUyNlYcIOggHKMcIOYgHBwg5iAcoxoi6CIaUAJOFxQlJRQX//8XFCUlFBf9shcUJSUUFwEk/twYEyUlEwAAAQAeAAABBgLuABMAADcyNjURNCYjNTMVIgYVERQWMxUjHiAcHCDoIBwcIOglFBcCThcUJSUUF/2yFxQlAAABAAz/9gG2Au4AIwAAEzUzFSIGFREUBiMiJiY1NDY3NhYVFA4CMTAWFjMyNjURNCbO6CAcZWEvTSwuIiAuFx8XDSAeLjQcAsklJRQX/kJzdydCKSUzAQEvIRodDgQVFk5EAe4XFAAB/9//iAEGAu4AEwAAFyM1MzI2NRE0JiM1MxUiBhURFAYEJRkvMxwg6CAcZXgoTEYCXBcUJSUUF/3Uc3cAAAIAHgAAAiUC7gAeADIAAAEyFhYVFRQWMzMVIyImNTU0JiMjNRM2JiM1MxUiBgcBMjY1ETQmIzUzFSIGFREUFjMVIwEmME4tKCELC2FbLiMbgQccGqceIAv+fCAcHCDoIBwcIOgBizphPS4rNSVeZTwrOSgBGg4WJSUTGf2IFBcCThcUJSUUF/2yFxQlAAACAB4AAQIsAu4AFAAoAAAlFjMVIzUyJwMTNiYjNTMVIgYHAzMBMjY1ETQmIzUzFSIGFREUFjMVIwHsEi7mSBKKgQccGqcdIQt8Pv66IBwcIOggHBwg6FErJSUrAToBGg8VJSUUGP7u/psUFwJNFxQlJRQX/bMXFCUAAAEAHv/hAbUC7gAaAAA3MjY1ETQmIzUzFSIGFREzMjY2NzMVIyYmIyEeIBwcIOggHEwtMRgGIyUEHyL+0yUUFwJOFxQlJRQX/YoUODfKEQ4AAQAeAAACwgLuACQAADcyNjURNCYjNTMTEzMVIgYVERQWMxUjNTI2NREDIwMRFBYzFSMeIBwcIMWTjMAiGhwg5iAcqC65HCCnJRQXAk4XFCX92QInJRMY/bIXFCUlFBcCPv1yAoH9zxcUJQAAAQAJAAAB9wLuAB0AADcyNjURNCYjNTMTETQmIzUzFSIGFREjAREUFjMVIwkgHBwgsNMcIKcgHDH+6hwgpyUUFwJOFxQl/iYBihcUJSUUF/1iAnb92hcUJQAAAgAr//YBsQL4AA0AGwAAEzIWFREUBiMiJjURNDYTMjY1ETQmIyIGFREUFvBbZmNeX2ZlYCQvLyQjMC4C+HFl/qppbW9nAVZobv0mNioB8io2Nyn+Dis1AAEAHgAAAdoC7gAfAAA3MjY1ETQmIzUhMhUVFCMjNTMyNjU1NCYjIxEUFjMVIx4gHBwgAQC8vCwsISgpIFQcIOglFBcCThcUJdU/1Cg2LNYrNf2KFxQlAAADACsAAAGxAvgAFQAhAC4AABMyFhURFAcWMzMVIyInBiMiJjURNDYXERYXNjURNCYjIgYRFBYzMDIzJjU1NCYj8FtmXhUlFQFrKw0OXmdmDJUQAS8kIzAuJQEDDyggAvhxZf7mki8gJzMBb2cBGmhuiP7oCqMHCAG2KjY3/iErNSlADiw1AAIAK/7bAgkC+AAdACsAADciJjURNDYzMhYVERQGBxYWFRQWMzMVIyImNTU0JicyNjURNCYjIgYVERQW+WNrZl9bZjM8OTApIBUBZFgtLyQvLyQjMC4Nb2cBP2hucWX+wUNgICNdQioyJ1lqDi8yKDYqAdsqNjcp/iUrNQABABoAAAIeAu4AMAAANzI2NRE0JiM1MzIVFAYHFhYVFRQWMzMVIyImNTU0JiMjNTMyNjU1NCYjIxEUFjMVIxogHBwg+rwrNTAqKCELC2FbKSAYHiIpKCNOHCDoJRQXAk4XFCXXSVofH1tGDSw3JV9kHCw4KDYsmSw0/YoXFCUAAAEAF//2AYkDFAAzAAATIgYVFBYXFx4CFRQGBiMiJiYjIgYHIzUzFhYzMjY1NCYnJyYmNTQ2NjMyNjczFwcuAtIiMxsfZSsvEzJUMyUuGwoKEgIjIg5IMCoxJipUNCoyUS4mIAgiLCITICMC0DMjHDcjdjJJQykxUDAODgsH1FBbODAnTzBhPVUwKkgsDBC1CTI0FAABAAgAAAIAAxMAIQAANzI2NREjIgYGByc3MxYWMyEyNjczFwcuAiMjERQWMxUjjSAcDSgzIxElLCIEExcBABcUAyIsJREjMikTHCDoJRQXAnkYPzsJ0xYPEBXTCTs/GP2HFxQlAAABAAr/9gHxAu4AIAAAEzUzFSIGFREUFjMyNjURNCYjNTMVIgYVERQjIiY1ETQmCuggHDgvLzocIKcgHKlfZxwCySUlFBf9/jdAU0UB4RcUJSUUF/4u1m9nAdIXFAAAAf/+//IB3ALuABYAAAE2JiM1MxUiBgcDIwMmJiM1MxUiBhcTAXEFICGnHB0FljCeBRwb6x8gA1UCnRUXJSUUGP1VAq0XEyUlFRT+AgAAAf/+//QDIgLuACIAAAETEzYjNTMVIgYHAyMDAyMDJiYjNTMVIgYXExM2IzUzFSIGAehfbgpGqRwdBZgtj4AsqgYcGusfIQRcZQ1B5CUYAo/+IgHtLCQkFRf9VgJq/ZYCqhcUJSMWFP4bAdM6JSUaAAH//AAAAeAC7gAoAAADNTMVIhcXNzYmIzUzFSIGBwMTFhYzFSM1MicnBwYzFSM1MjY3EwMmJgToRBFRWwgWIacgHgtsggccG+hFEFVZET2nIh0LbH8HHALJJSUt1d0UESUlExr++v6wEg8lJSjd3CklJRMcAQkBSRQPAAAB//4AAAHmAu4AIAAANzI3NQMmJiM1MxUiBhcTEzYmIzUzFSIGBwMVMxQWMxUjiDUGiQoZGesiIQdpYgcgI6obGgl1ARwg6CUf8AFqGRIlJRcT/tgBJhQYJSUSGv6n9BcUJQAAAQAY/+EBnQMUABsAADcyNjY3MxUjJiYjITUTIyIGBgcnNzMWFjMzFQP+LTEYBiMlBB8i/uX3Py0zIREiLCIDFRbx9SgUODfKEQ4oAp4QMDAJtRURKP1iAAIAAP/hAp4DFAAzADYAACUyNjY3MxUjJiYjITUyNjU1IwcGFjMVIzUyNjcTMzI2NzMXBy4CIyMRMzI1MxUjNCMjESUzEQIBLTEYBiEjBxwi/r0jGaEiBh8jqBsbCN70FxMEIiwiEiEyLTkaRSAgRRr+/pInFDk3yhINIhIZZmUTGSIiExkCoBAWtQkxMBD+3Ei4SP6svAG3AAACACr/4QK1AxQALQA7AAATMhczMjY3MxcHLgIjIxEzMjUzFSM0IyMRMzI2NjczFSMmJiMhBiMiJjURNDYTMjY1ETQmIyIGFREUFvAhH/cXEwQiLCISITItORpFICBFGmItMRgGISMHHCL+4iAfYGZoXiMwMCMjLi8C+AoQFrUJMTAQ/txIuEj+rBQ5N8oSDQptaQFWaW39JjcpAfIqNjYq/g4pNwD//wAAAAAB2wOwAiYABAAAAAYBGwAw//8AAP9VAdsC/AImAAQAAAAHAR8AsgAb//8AHv83AdUDFAImAAgAAAAHAR8Ah//9//8AHv9VAQYC7gImAAwAAAAGAR/dG///AAr/VAHxAu4CJgAbAAAABgEfHhoAAgAYAAABvwLuABMAIQAANzI2NREjNTMRNCYjNTMyFREUIyMBFSMRMzI2NRE0JiMjERggHDk5HCDuubnuARBkQiIpKSJCJRQXARgnAQ8XFCXW/r7WAY8n/sA1KwHeLDT+yQACABgAAAG/Au4AEwAhAAA3MjY1ESM1MxE0JiM1MzIVERQjIwEVIxEzMjY1ETQmIyMRGCAcOTkcIO65ue4BEGRCIikpIkIlFBcBGCcBDxcUJdb+vtYBjyf+wDUrAd4sNP7JAAIAGgAAAhMC7gAzADcAADcRIzUzNTQmIzUzFSIGFRUzNTQmIzUzFSIGFRUzFSMRFBYzFSM1MjY1ESMRFBYzFSM1MjYTMzUjVjg4HCDoIByjHCDmIBw5ORwg5iAcoxoi6CIacKOjUAHOJ1kXFCUlFBdZWRcUJSUUF1kn/jIXFCUlFBcBJP7cGBMlJRMBZ38AAAEAG//hAbUC7gAiAAA3MjY1EQc1NxE0JiM1MxUiBhUVNxUHETMyNjY3MxUjJiYjIR4gHD8/HCDoIByZmUwtMRgGIyUEHyL+0yUUFwEPFzMXAQwXFCUlFBfiODM4/p8UODfKEQ4AAAMAAf/2Ad4C+AAVAB4AJwAAARcHERQGIyImNTUHJzc1NDYzMhYVFSURNzU0JiMiBhMyNjURBxUUFgHdAS1jXl9mKQEqZWBbZv7spi8kIzBTJC+mLgIqNhr+8mltb2cpGDYZ9mhucWUSYP7+YqAqNjf9hTYqARthuis1AAABABT/KwIAAu4AJwAANxE0JiM1MxMnETQmIzUzFSIGFREUBiMjNTMyNicDFxEUFjMVIzUyNlAZI7fMAxkjqCMZWmIUFDsmHNEEGSOoIxlNAlEaESX9cUECARoRIiIRGv1fbWglXlICdEL+GxkSIiISAAACAB4AAAHKAu4AGwAlAAA3ETQmIzUzFSIGFRUzMhUVFCMjFRQWMxUjNTI2EyMRMzI2NTU0JloZI+gjGUS8vEQZI+gjGbRERCEoKFACThoRJSURGjPVPdQ1GRIlJRICDf5lNizZLDQAAAEACAAAAgADEwApAAA3MjY1ESM1MxEjIgYGByc3MxYWMyEyNjczFwcuAiMjETMVIxEUFjMVI40gHGJiDSgzIxElLCIEExcBABcUAyIsJREjMikTY2McIOglFBcBGCcBOhg/OwnTFg8QFdMJOz8Y/sYn/ugXFCUA//8AAAAAAdsELgImAAQAAAAmARsAJgAHARQAjgCg//8AAAAAAdsDjgImAAQAAAAHARQAjgAA//8AAAAAAdsDjgImAAQAAAAGARMaAP//AAAAAAHbA48CJgAEAAAABgEWMB7//wAA//8B2wOFACYABAD/AAYBFTsA//8AAP//AdsDdAAmAAQA/wAGARfvAP//AAD//wHbA28AJgAEAP8ABgEYJwD//wAA//8B2wNBACYABAD/AAYBGWUD//8AAP//AdsDZQAmAAQA/wAGARo9Fv//AAAAAAHbA0oCJgAEAAAABgEiLgD//wAA/+ECngOOAiYAIQAAAAcBFADnAAD//wAr//YBjQOOAiYABgAAAAYBFHAA//8AK//2AY0DjwImAAYAAAAGARYeHv//ACv/9gGNA5cAJgAGAAAABgEddgD//wAr/0QBjQMUAiYABgAAAAYBHgAA//8AGAAAAb8DjwImAAcAAAAGARYqHv//AB7/4QHVA44CJgAIAAAABgETKAD//wAe/+EB1QOOAiYACAAAAAYBFGsA//8AHv/hAdUDawImAAgAAAAGARfk9///AB7/4QHVA4UCJgAIAAAABgEVMQD//wAe/+EB1QOPAiYACAAAAAYBFjMe//8AHv/hAdUDbwAmAAgAAAAGARgeAP//AB7/4QHVA0ECJgAIAAAABgEZSQP//wAe/+EB1QNlAiYACAAAAAYBGj8W//8AHv/hAdUDlgAmAAgAAAAGAR17////AC3/9gG7A2UCJgAKAAAABgEaMxb//wAt//YBuwOXACYACgAAAAYBHWwA//8ALf/2AbsDmgImAAoAAAAGARUpFf//AB4AAAEGA44AJgAMAAAABgET4QD//wAeAAABBgOOACYADAAAAAYBFB4A//8AHgAAAQYDhQAmAAwAAAAGARXbAP//AB4AAAELA3QAJgAMAAAABgEXkgD//wASAAABCgNvACYADAAAAAYBGMoAAAIABgAAARIDPgADABcAABM1IRUDMjY1ETQmIzUzFSIGFREUFjMVIwYBDPogHBwg6CAcHCDoAxYoKP0PFBcCThcUJSUUF/2yFxQlAP//ABgAAAEAA2YAJgAM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AAcBHQCy/az//wAYAAAB/wLHAiYAnQAAAAcBFAB5/zn//wAYAAAB/wK+AiYAnQAAAAcBFgBQ/03//wAYAAAB/wKiAiYAnQAAAAcBFwAA/y7//wAo//EBqgLHAiYAngAAAAcBEwAf/zn//wAo//EBqgLHAiYAngAAAAcBFAB9/zn//wAo//EBqgLKAiYAngAAAAcBFQAy/0X//wAo//EBqgKiAiYAngAAAAcBF//r/y7//wAo//EBqgK+AiYAngAAAAcBFgAr/03//wAo//EBqgKlAiYAngAAAAcBGAAl/zb//wAo//EBqgJ6AiYAngAAAAcBGQBg/zz//wAo//EBqgK0AiYAngAAAAcBGgA6/2X//wAo//EBqgLHAiYAngAAAAcBHAA+/zn////8//EB2QLHAiYAuAAAAAcBFAB9/zn//wAYAAAB3wLHAiYAogAAAAcBFAB8/zn//wAYAAAB3wK+AiYAogAAAAcBFgA2/03//wAo//YBkALHAiYAowAAAAcBFABa/zn//wAo//YBkAK+AiYAowAAAAcBFgAN/03//wAo/0QBkAIuAiYAowAAAAYBHvsA//8AKP/2AZACygImAKMAAAAHARUAFP9F//8AKP85AZACLgImAKMAAAAHASAAev9p//8AAAAAAbgCxwImAKQAAAAHARYAIv9W//8AAP86AbgCNgImAKQAAAAHASAAgf9q//8ACP/2AeACxwImAKUAAAAHARMAOv85//8ACP/2AeACxwImAKUAAAAHARQAe/85//8ACP/2AeACvgImAKUAAAAHARYAUP9N//8ACP/2AeACywImAKUAAAAHARUAU/9G//8ACP/2AeACkAImAKUAAAAHARgARv8h//8ACP/2AeACegImAKUAAAAHARkAdv88//8ACP/2AeACswImAKUAAAAHARoAX/9k//8ACP/2AeAC5AImAKUAAAAHARsAH/9k//8ACP/2AeACxwImAKUAAAAHARwAWv85/////v/yAsoCyAImAKcAAAAHARMAvv86/////v/yAsoCxwImAKcAAAAHARQBLP85/////v/yAsoCywImAKcAAAAHARUA0f9G/////v/yAsoCkAImAKcAAAAHARgAu/8h/////AAAAcoCxwImAKkAAAAHARMAMv85/////AAAAcoCxwImAKkAAAAHARQAlP85/////AAAAcoCygImAKkAAAAHARUARv9F/////AAAAcoCkAImAKkAAAAHARgANP8h//8AEP/rAYQCxwImAKoAAAAHARQAXf85//8AEP/rAYQCvgImAKoAAAAHARYAFP9N//8AEP/rAYQCygImAKoAAAAHARUAMv9F//8AEP/rAYQCuQImAKoAAAAHAR0AXP8iAAIAGAAAAdMCHAAQACQAADcyNjURNCYjNSEyFhUVFCMhASMVMzI1MxUjNCMjFTMyNjURNCYYIBwcIAECX1q5/v4BAlYlJyAgJyVWIikpJRQXAXwXFCVobnDWAfXXNJg90DUsAQwsNQAAAgAY/+sDVAIvADgAOwAANzI2NRE0JiM1ITI2NzMXBy4CIyMVMzI1MxUjNCMjFTMyPgI3EzMTFhYzFSM1MicnIwcjJiYjISUzJxggHBwgASgaFgEhKSESITMsR0gnICAnSHckLh8ZD3kwnAkWH+ZKDRWgNiIEHiP+vwHrh0IlFBcBfBcUJQkKogkwMRDXNJg90AcZNy8Bc/4vGhAlJSlDpgwJt9IAAAIAGP/rAwkCIAAnACoAADcyNjURNCYjNTMVIgYVETMyPgI3EzMTFhYzFSM1MicnIwcjJiYjIyUzJxggHBwg5iAcKyQuHxkPeTCcCRYf5koNFaA2IgQeI/YBoIdCJRQXAXwXFCUlFBf+WwcZNy8Bc/4vGhAlJSlDpgwJt9IAAAIAGAAAA7QCHAAuAFkAADcyNjURNCYjNTMyFhUUBgcWFRQWMzMVIyImNTQmIyM1MzI2NTU0JiMjERQWMxUjIRE0JiM1MzIWFRQGBxYVFBYzMxUjIiY1NCYjIzUzMjY1NTQmIyMRFBYzFRggHBwg7FxWLDBUGRIkJ0lFLB0VGiEoKCFCHCDmAhEcIOxcViwwVBkSBglJRSwdFRohKCghQhwgJRQXAXwXFCVUWSs/GCNaHywlNjorPyU2LDMsNf5bFxQlAcwXFCVUWSs/GCNaHywlNjorPyU2LDMsNf5bFxQlAAABAAD/6wNgAjYARwAANzI2NREjIgYGByc3MxYzMzI2NzMWMyEyNjczFwcuAiMjFTMyNTMVIzQjIxUzMjY2NzMVIyYmIyE1MjY1ETQmIyMRFBYzFSNoIBwRICYbECIiHwMr1RcOAR8DKwEkGhYBISkhEiEzLEdIJyAgJ0hoLTEXBiEiBB4j/rkgHBwgoBwg5iUUFwGlFDo6CcAaDQ0aCQqiCTAxENc0mD3QFDk3wAwJJRQXAXoXFP5bFxQlAAEAAAAAAu4CNgA4AAA3MjY1ESMiBgYHJzczFjMzMjY3MxYzMzI3MxcHLgIjIxEUFjMVIzUyNjURIyIHIyYjIxEUFjMVI2ggHBEgJhsQIiIfAyvaFw4BHwMrwysDHyIiEBsmIBMcIOYgHB4rAx8DKy8cIOYlFBcBpRQ6OgnAGg0NGhrACTo6FP5bFxQlJRQXAaUaGv5bFxQlAAABAEgDGQDlA44AAwAAExcjJ5lMLm8DjnV1AAEASAMZAOUDjgADAAATMwcjlFFvLgOOdQAAAQBIAw4BJgOFAAYAABMjNzMXIyd0LF8Uazs/Aw53d0UAAAEASAL6ASYDcQAGAAATMwcjJzMX+ixfFGs7PwNxd3dFAAABAI4DIQF5A3QAFAAAEzQ2MzIWFjMyNxcGIyImJiMiBgcmjiUZFyYgDhgRGRgvFx4aEQ0TAyEDRxIbDxAVDjgNDRANCgD//wBIAwgBQANvAC8BJwAUAw4uiAAPAScAqwMOLogAAQAGAxYBEgM+AAMAABM1IRUGAQwDFigoAAABAEAC7gEcA08ACgAAEzMGIyInMxYWMzLyKgtkYQwqBiQaOQNPYWEZHgACAJwC7gE7A4AACAAUAAABFCMiNTQzMhYHFBYzMjY1NCYjIgYBO09QUCYpeRgSEhgXExIYAzdJSUkmIxUbGxUWHB0A//8ASAMZAVoDjgAmARQAAAAGARR1AP//AEgDMACpA5cADwEnABQDNi6IAAEArP9EATn/+QASAAAFNCYjIzU3FwcyFhUUBiMjNTMyAQgeGSUULRMsMywmJxE3axMXIxcBFSgmJC0mAAEAov86ASkACgARAAAlFQcGBhUUFjMzFSMiJjU0NjcBKSkWFyUcEhQyPi80CiYLBiISGB8uOismNwgAAAEAIP/QAI4AbQAQAAAXJzY2MTAmJjU0NhcWFhUUBkcNEAwbGyEWFyAnMBkGEwYWFxchAQEjGiAyAAABABgCTgCdAwwAEQAAExcGBjEwHgIVFAYnJiY1NDZuEBMPFBkUJxscJzADDB4HGAMMGRYcJwEBKx8nPQABACQCiwCUA0oAAwAAEyM3N2lFK0UCi74BAAMAOQMZAVAD2AADAAsAEwAAEyM3Nwc0MzIVFCMiNzQzMhUUIyLWRStFyC4rKy6+LisrLgMZvgF2MzMxMTMzMQABABj/vACdAHoAEQAAFyc2NjEwLgI1NDYXFhYVFAZHEBQOFBkUJxsdJjBEHggXAwwZFhwnAQEqICc9AP//ABgAAgDNAe8AJwEnAAABagIGASQARv//AEgAMgDNAe8AJgEnADoABwEnAAABagABAEj/+ADNAIUACwAANxQGJyYmNTQ2FxYWzScbHCcnGx0mORwlAQEpHxwnAQEqAP//AEj/+AIXAIUAJgEnAAAAJwEnAKUAAAAHAScBSgAAAAIAcP/4APUC+AARAB0AABM0MzIWFRQOAwcjLgQTFAYnJiY1NDYXFhZ6ORocAwYHCwYsBwoJBQN7JxscJycbHSYCsUclIilqc29dHx9db3Nq/bEcJQEBKR8cJwEBKgACAHD/KQD1AicACwAdAAATFAYnJiY1NDYXFhYDFCMiJjU0PgM3Mx4E9ScbHCcnGx0mCDkZHQMGCAoGLAcKCQUDAdscJQEBKR8cJwEBKv11RyUiKWpzb10fH11vc2oAAgBw//gCDQL4ACQAMAAAJTQ+BDU0JiMiBxYWFRQGJyYmNTQ2NjMyFhYVFA4EFRcUBicmJjU0NhcWFgEKFSEmIRZBND0fHyMuICIuMlc4QGM5HS8zLx0mJxscJycbHSbDRVY2JSU1KzxMMAkoGR4sAQEzJS1HKDBVNzBAMCozRzWKHCUBASkfHCcBASoAAAIAcP8qAg0CJwALADAAAAEUBicmJjU0NhcWFgcUDgQVFBYzMjcmJjU0NhcWFhUUBgYjIiYmNTQ+BDUBmScbHCcnGx0mJhUhJiEWQTQ9Hx8jLx8iLjJXOEBjOR0vMy8dAdscJQEBKR8cJwEBKpxEVzYlJTUrPEwwCSgZHiwBATMlLUYpMFU3MEAwKjNHNQABAEgCVADNAxIAEQAAEyc2NjEwLgI1NDYXFhYVFAZ3EBQOFBkUJxsdJjACVB4IFwMMGRYcJwEBKiAnPQABAEgCTgDNAwwAEQAAExcGBjEwHgIVFAYnJiY1NDaeEBMPFBkUJxscJzADDB4HGAMMGRYcJwEBKx8nPf//AEgCVADNAxICBgEtAAD//wBIAk4BcgMMACYBLgAAAAcBLgClAAD//wBIAlUBcgMTACYBLQABAAcBLQClAAEAAQBI/8MAzQCBABEAABcnNjYxMC4CNTQ2FxYWFRQGdxAUDhQZFCcbHSYwPR4IFwMMGRYcJwEBKiAnPQD//wBI/8MBcgCBACcBLQAA/W8ABwEtAKX9bwABAEgAAAGPAhwABQAAAQMTIwMTAY/c3Gbh4QIc/vf+7QEQAQwAAAH/8AAAATcCHAAFAAABAyMTAzMBN+Fm3NxmARD+8AETAQkAAAEAjP/YAbQDFgADAAAFAzMTAWfbTdsoAz78wgABAIL/2AGqAxYAAwAAFyMTM89N200oAz4AAAEBeP+LAcMC7gADAAAFIxEzAcNLS3UDYwD//wBIAnoBJgLxAgcBFQAA/2z//wCOAVYBeQGpAgcBFwAA/jUAAQAAAAACQgBDAAMAADE1IRUCQkNDAAEARgEuAdQBegADAAATNSEVRgGOAS5MTAAAAQAAAUICQgGOAAMAABE1IRUCQgFCTEwAAQAAAWADPAGsAAMAABE1IRUDPAFgTEz//wBIAUMAzQHQAgcBJwAAAUv//wBIANQAzQFhAgcBJwAAANwAAQAA/wYA/AMgABUAADcUFhYXFS4DNRE0PgI3FQ4CFWIZQz5KYjgYGDhiSj5DGS1HWDocMhI1UntYAUJYe1E1EzIYNlVHAAEAGP8GARQDIAAVAAA3ETQmJic1HgMVERQOAgc1PgKyGUI/SmI4GBg4Yko/QhktAddHVTYYMhM1UXtY/r5Ye1I1EjIcOlgAAAEAAP8kAP8DAgAHAAAVETMVIxEzFf+lpdwD3jL8hjIAAQAY/yQBFwMCAAcAAAUjNTMRIzUzARf/paX/3DIDejIAAAEAAP8GARkDFQAkAAAXFBYzMxUjIiY1NTQmIyM1MzI2NTU0NjMzFSMiBhUVFAYHFhYVuykgFQFkWCghExMhKFhkARUgKSs1NSt3KjInWWrfLDUnNSzBalknMiq1Ql4hIF5CAAABABj/BgExAxUAJAAAFzU0NjcmJjU1NCYjIzUzMhYVFRQWMzMVIyIGFRUUBiMjNTMyNnYrNTUrKSAVAWVXKCETEyEoV2UBFSApd9NCXiAhXkK1KjInWWrBLDUnNSzfalknMgAAAQBIASABKgMPADgAABMyFhUUBgYHNjYzMhYVFAYjIiYnHgIVFA4CByMuAzU0NjY3BgYjIiY1NDYzMhYXLgI1NDa5CxQJCgIfGQ4SDw4SDhkgAgwLCAsJAgsCCQsICwwCHxkOEg4PEg4YHwIKCRQDDw4SCxMaGAITFAsMFBICGhUKCgcgP2xUVGw/IAcKChUaAhIUDAsUEwIYGhMLEg4AAAEASP/HAbwC+QBAAAABMhYVFAYGBz4CMzIWFRQGIyImJiceAxUUDgIHByMnLgM1ND4CNw4CIyImNTQ2MzIWFhcuAjU0NgECEiIPEQMiJxsQHRgWHRAcJyMCEBMOCxAPBQwSDAUQEAsOEhADISgaEB4XGB8PGichAxEPIgL5Fx4SHywnAxAPIhETIg8QAiAiEg8MCyxXknBVVXCSVywLDA8SIiACEA8iExEiDxADJywfEh4XAAMASAEgASoDDwA2AFMAWAAAEyMuAjU0NjY3BgYjIiY1NDYzMhYXLgI1NDYzMhYVFAYGBzY2MzIWFRQGIyImJx4CFRQGBgczNSM3MDYzMhYXFA4CMTAuAjU0NjMyFjEXIxcXNwcjxhsECwcLDAIfGQ4SDg8SDhgfAgoJFAwLFAkKAh8ZDhIPDhIOGSACDAsHCj1VEwgCBRQfARwjGxslGx8VBQIIEyEKCgULAbkyOBwHCgoVGgISFAwLFBMCGBoTCxIODhILExoYAhMUCwwUEgIaFQoKBxw4PApEAR8XEiciFRUiJxIXHwJDZwcHMgADAEj/xwG8AvkAPABVAFoAABMOAiMiJjU0NjMyFhYXLgI1NDYzMhYVFAYGBz4CMzIWFRQGIyImJiceAxUUBgYHIy4CNTQ+AhcyFhUOBDEwLgM1NDYzFyMVMzUjBxc3ByPwISgaEB4XGB8PGichAxEPIhMSIg8RAyInGxAdGBYdEBwoIwIQFA4MEQg/CBEMDhIQTyU2AR4sLB4fLC0fOCUNGowZQRUVDRECGwIQDyITESIPEAMnLB8SHhcXHhIfLCcDEA8iERMiDxACICISDgwLL11SUl0vCwwOEiLGNCUYMzAnFxcnMDMYJTRxDQ2oDg5VAAEASAIbATwDDwAvAAATFAYjIiY1NDY3BgYjIiY1NDYzMhYXJiY1NDYzMhYVFAYHNjYzMhYVFAYjIiYnFhbkFwsNFRAGHxsRExAPExAdHwYQFQ0LFxIEHxwQFA8PFBAcHwQSAj4UDw8UERsfBBIWDQsWEQUgGxAUDw8UEBsgBREWCw0WEgQfGwABAEgCgQCLA0oAAwAAEyM1N4tDQwKByAEAAAIASAKBAPkDSgADAAcAABMjNTcXIzU3i0NDbkNDAoHIAcnIAQAAAQBIAosA0wNKAAMAABMjNzeNRUZFAou+AQACAEgCiwFDA0oAAwAHAAATIzc3FyM3N41FRkUqRUZFAou+Ab++AQAAAQBI//sCKAMUAEIAABMVFBYzMxUjIgYVFRQWMzI2NTU0NjMyNjYxIiY1NDYzMhYVFAYHFRQGIyImNTU0NjcmJjU0NjMyNjczFwcuAiMiBr0kIBkZJR8jISAlGSMhIw4fLC8gHTNDNFRcX1ohMC8iZ2MULQ0iLCITICMbJjgCZlkwMCwsOJosNDEvchoeEhInHyExLiMxVA8zbGpsahk+UhwcTDhZaAQZtQkyNBM9AAABAEj/9gHYAi4APQAAEyIGFRUUMzMVIyIGFRUUFjMyNTU0MzI2NjEiJjU0NjMyFhUUBgcVFAYjIjU0NjcmJjU0NjMyFjY3MxcHJib0Gyc0FxccGBsZPywbHAocKCgcHSkvI05SniAoKCBWThodDwUfHiAVKAICLSA3RSYnLFgkKlhKJhAQJBkdKyodK0sMAWVipDY+Fxg0KERJBwINcgksIwACAEj/+gL+Au4AOQBGAAABFAYjIiYnBiMiJjU0NjMyFzU0JiMiBgcnNzMWNjMyFRUUFjMyNjU0JiMiBhUUFjMXIiY1NDYzMhYWBRQWMzI2NzUmIyIGFQL+R0EsORAqRFNZXU80JjcpJi4XJCEiByAkxhUPJiWRhI6Wlo4Bqby7qWiYUv5MJyElMQUgOx8pAW12fyMSL1RQQU8XMS09KDkJihAG1qsSG1pkm6yon5emN8GzvcNarOQrNCwkbSk3KQADAEj/+wL9Au4ADAAYAEcAABM0NjMyFhYVFAYjIiY3FBYzMjY1NCYjIgYTMjY1ETQmIzUzMhYVFAYHFhUUFjMzFSMiJjU0JiMjNTMyNjU1NCYjIxEUFjMVI0i7qWiXUrChqbtAlo6JjJGEjpZZHBgYHM5QTCcpSRUQBQdBOycZExcdIyMdOhkcyQFuvcNZrHuzwMCzl6aml5usqP6ZEhQBTBQRIUpNJjcVHk8cJiAvMyU3IS8mLScu/pAUEiAAAwBI//sC/QLuAAwAGAA3AAATNDYzMhYWFRQGIyImNxQWMzI2NTQmIyIGJTIWNzMXByYmIyIGFRUUFjMyNjU1MxUUBiMiJjU1NEi7qWiXUrChqbtAlo6JjJGEjpYBLCAcBh0kHhcqJSAsLiYoMiRHSUxWAW69w1mse7PAwLOXpqaXm6yoWQYPjQg+KzYn7ikyTTwOAV9cY1h4uwAAAgA2AlIBaQL2ABwAQAAAEzUjIgYHJzczFjMzMjczFwcmJiMjFRQWMxUjNTI3NTQjNTMXNzMVIhUVFDMVIzUyNjU1NwcjJxcVFBYzFSM1MjZmBg0MCAkJCQMLPwwBCQoKBwsOBwgKQRFqEjMkHjYREUILBwInDC0CBwowCwcCaHwOGQI3Bwc3AhkOfAcFCgoMcA0KbGwKDXAMCgoFB1AkiokkTwcFCgoFAAACADYCTwFeAv8AKABOAAATMhY3MxcHJiYjIgYVFBcXFhUUBiMiJiMiByM1MxYzMjY1NCcnJjU0Nhc1NCM1Mxc3MxUiBhUVFBYzFSM1MjY1NTcHIycXFRQWMxUjNTI2aQ4LAgoNCwcQDQoOFCIcIBcRDwUHAgsLCCELEhYbHx9jEjYmIToLCAgLRwsIAikNMQIICzMLBwL9BAYyAhUQDQoPCxMPIBMbCQY+MxEKEAwPERsSHJN4DQt1dQsFCHgIBQsLBQhVI5CSJlQIBQsLBQAAAgAIAlIAkALtABMAFgAAEwYzFSM1Mjc3MxcWMxUjNTInJyM3MycnBRYwDgQqDi0EDUEVBAYtBCUSAmgMCgoMhYUMCgoLFQs7AAACAAgCUgB0Au4ACQAWAAATMhUVFCMiNTU0FzI2NTU0JiMiBhUVFD42NjY2Cg4OCgoNAu47JTw8JTuRDwxQDA8PDFAbAAEAYgAAAcoC7gA0AAAzNSYmIyIHIzUzFhYzMjY2NTQnJyY1NDY2NzUzFRYWNzMXByYmIyIGFRQWFxcWFhUUBgYjFfMiIwsXByMiDkczFykaRlhjJ0EmKCAaByIpIhkzKR8tHCRsKy8vTzFcBhMSxk9WGigWNScxNlYkPysFZmYCBxKhCUU0Kx8cJRQ7F08yKUQoWQABAF8AAAG9Au4AJAAAITUmJjU1NDc1MxUWFjczFwcuAiMiBhURFBYzMjY1NTMVFAcVAQlQWqooHRwGIikiEiAnHCUyNSsuOSmMWgZwYInGD2BfAQQPoQkvNBU9Lf7vLjpYRRABxg9bAAEAIwBpAfEChQAuAAA3MjY1NSM1MzUjNTMnJiYjNTMVIgYXFzc2JiM1MxUiBgcHMxUjFTMVIxUUFjMVI6AgHD8/U0VvDBcZ5h8kB19XCB8lqhkaC2NOVEBAHCDmjhQXFCcoJ/UaESIiGRHW1BUXIiISGvQnKCcUFxQlAAABAC8ARAHsApkAKQAANzI2NTUjNTM1NDYzMhY3MxcHLgIjBgYVFTMVIxUzMjY2NxcHIyYmIyEvIBw8PF1XJCAHIikiEiAnHB8kaWlgKjEiEiIsIgUVFP6/jxQXnCdXWmEGEKEJLzQVASwjmifEEDEvCbUVEQAAAQAvAEQB7AKZADEAADcyNjU1IzUzNSM1MzU0NjMyFjczFwcuAiMGBhUVMxUjFTMVIxUzMjY2NxcHIyYmIyEvIBw8PDw8XVckIAciKSISICccHyRpaUtLYCoxIhIiLCIFFRT+v48UF20nKCc3WmEGEKEJLzQVASwjeicoJ5UQMS8JtRURAAABAD8AWgHdApkALwAAARUjFRQWMzI2NTUzFRQGIyImNTUjNTM1IzUzNTQzMhY3MxcHLgIjIgYVFTMVIxUBNkk1Ky45KVFUVmNAQEBAxiQgByIpIhIgJxwlMmdnAWYnUy46WEUQAW1pcmQPJygnBNYGEKEJLzQVPS1IJygAAQBIAEwBrQKCACMAACUWFjMVIyc1MzI2NTU0JyM3MyYjIzchByMWFzMHIxYVFAYGBwFIECEciYs7JCUCux6SEyl0HgFHHkYTCkceHgMgPiugGxQl6i8uNCkODCcqJycRGScTFiZFLwYAAAIAUP/bAcwDHAA7AEYAACUUBgYjIiYmIyIHIzUzFhYzMjY2NTQnJyYmNTQ3JiY1NDY2MzIWNjczFwcmJiMiBhUUFhcXFhYVFAcWFicXNjU0JycGFRQWAbgvTzElLhsKFwcjIg5HMhcqGkZYLzRnKyguSioeIREFIikiGjIpICwdI2wqMFgkIMZEMkYxPx5wKUQoDg4Sxk9UGicVNScxGkgqVTMfPyMnRCkHAg2hCUQ0Kh8cJRQ7FlAyTjMeQqslIyY1JxwVMhwmAAACADAAAAHsAu4ABwATAAABESMiNTU0MxMRMxUiBhURFBYzFQEYLLy8VKwgHBwgAu7+GNQ/1f0SAu4lFBf9shcUJQACADACXwDPAvEACAAUAAATFCMiNTQzMhYHFBYzMjY1NCYjIgbPT1BQJil5GBISGBcTEhgCqElJSSYjFRsbFRYcHQABADgBkgDMAu4AEAAAEzI2NTUjNTY2NzMRFBYzFSM4FRInHC8MFxIUlAGqDxPEFwgmGf7eEw8YAAEAOAGFARAC8gAoAAATNCYjIgcWFRQGJyYmNTQ2MzIWFRQOAgczMjY3FwcjJiMjNTQ+A8cgFhoOHxYPEhk0KDNBIS8tDDkcGg4UFBIBF5UcKSkcAn8jMRkKGQ8WAQEYEyMwPy8eMCoqGBoiBH0JHBgqJygrAAABADgBhwEIAvgALwAAEyIHFhUUBiMmJjU0NjMyFhUUBgcWFhUUBiMiJjU0NjcyFhUUBxYzMjU0Iyc2NjU0kxwOIRcPEBg1KC03HhodJjw3KDUXEA8XHA4ZOC8OGh0C3BMKGg0WAhgRIiktKBssDAwxHDg4KiERGQEXDhgLEExIGQsrGDwAAAIAKgGPAQcDAgAWABkAABMyNTUjNTczFTMyNTMVIzQjIxUUMxUjJzM1gCF3lhsHFBERFAcifS9QAaEZRBft6BtSG0QZEouCAAIALf/2Ae8C+AAPABsAABM0NjYzMhYWFRQGBiMiJiYlNCYjIgYVFBYzMjYtLGNUVGEqMGJNVGMsAVQ2Ozs2Njs6NwF3kKlIRqiTk6hGSaiOs6WguLSeowABAIYAAAGWAwIAEAAANzI2NREjNTY2NzMRFBYzFSGGKyVQMlMWJSUr/vAlGRwCAiQPRi39WBwZJQAAAQA4/+4B5AL4ADEAAAE0JiYjIgcWFhUUBicmJjU0NjYzMhYWFRQOBAczMjY2NxcHIyYmIyE1ND4EAV8eMh89Hx8jLiAiLjJXOD5hNylCTUs7Da0sMSEUISkhARYa/tAqQ0xDKgItK0UpMAkoGR4sAQEzJS1HKDVdOzBTSUVESCkPMTEJ3wsIPS5STUxPVgAAAQA8//YB4AL4ADUAABMiBgcWFhUUBicmJjU0NjYzMhYHFAYHFhYVFAYjIiYmNTQ2NzYWFRQGBxYzMjU0Iyc2NjU0JvkcLw4gJC4gIi4yVzhcaQE1MDdDdG84VzIuIiAuJB4ePXpmHjdANQLIGxYKJxoeLAEBMyUtRyhhUzZYGhhlPnR3KUYtJTMBASweGSgJMa6dKBdbNkFFAAIAKgAAAfIDAgAaAB0AADcyNjU1IzUBMxEzMjY1MxUjNCYjIxUUFjMVIQMzEdgrJf4BPjAKFxQlJRQXCiUr/vBouCUZHIwwAez+FhwgqiAcjBwZJQEYASQAAAEAM//2AekDAQAwAAATJxMzMjY3MxcHLgIjIwc2MzIWFhUUBiMiJiY1NDY3NhYVFAcWMzI2NTQmJiMiBgaPJyO2GhYBISkhFCc2K0MVNyg9Zz+DcjhXMi4iICk9JzQ+TiA3IxIrJgFnJwFgCQrfCTI1FdwVPmc+cIUpRi0lMwEBJyAwGzNlUzVVMQ4XAAACAC3/+AHtAvsAIwAuAAABIgYGBzY2MzIWFwYGIyImJyY2NjMyFhYVFAYHBiY1NDY3JiYDFBY3MjU0JiMiBgEbLjkaASM2J2BzAQFyaHFwAgIvaFU4VzIuIh8vJB8PNqFANno/Ozc/Asw+h24WEHlnbnmcoKLIXShHLSUzAQEsHhonCRcc/hRWZgG7UllbAAABAEYAAAH6AwEAHgAAEzUzNjY3IyIGBgcnNzMWFjMhBwYGBzMVIwYXIzY2N5N0GUEokCwxIRQhKSEBFhoBOQQ1URtPXjIHdQsmHgFzLj1zOQ8wMgnfCgkpRZFOLqnKa7dRAAMAP//2Ad0C+AAXACMALwAAATIWBxQGBxYWFRQGIyImNTQ2NyYmNSY2EzI2NTQmIyIGFRQWEzI2NTQmIyIGFRQWAQ5YZAEsMjw2amVkazY8MiwBZFgqJiYqKiYmKjEsLTAwLSwC+GFTNUwfIWJKbXR0bUpiIR9MNVNh/sBBSUtCQktJQf5nVWFgWlpgYVUAAAIAL//4Ae8C+wAjAC4AACUyNjY3BgYjIiYnNjYzMhYXFgYGByImJjU0Njc2FhUUBgcWFhM0JgciFRQWMzI2AQEuORoBIzYnYHMBAXNncXACAi9oVThXMi4iIC4kHw82oUA2ekA6OD4nPoduFhB5Z255m6GiyFwBKUYtJTMBASweGicJFxwB7FZmAbtSWVsAAAIANAAAAdYCGwAbAB8AADM3BzUXNwc1FzczBzM3Mwc3FScHNwcnByM3Iwc3MzcjcxFQWBBKUA1AEm0NQBJRWBBBAUcMQBJtDRNuEG6HA0ADlgNAA4qLi4oDQAOWA0ADh4iIwJgAAAEAHgAVAfwCBwALAAA3Nwc1FyczBzcVJxfbA8DAA2QDwMADFcwDYAPMzANgA8wAAAEAKAEjAfIBcQADAAATNSEVKAHKASNOTgAAAgBCAEgB0AI0AAsADwAANzcHNRcnMwc3FScXBzUhFeUDjo4DUAOOjgPzAY66mQNOA5mZA04DmXJDQwAAAQBFADgB7AHfAAsAACUnByc3JzcXNxcHFwGljoZEipJHjoVEiZI4kopEho5HkolEho4AAAMAHgAWAfwCEAALAA8AGwAAARQGJyYmNTQ2FxYWATUhFQcUBicmJjU0NhcWFgF+JxscJycbHSb+oAHefycbHCcnGx0mAcQcJQEBKR8cJwEBKv76YWGHHCUBASkfHCcBASoAAgAeAH0B/AGgAAMABwAAEzUhFQU1IRUeAd7+IgHeAT9hYcJhYQACABgANwIRAekADwAfAAATMzIWFSM0JiMjIiY1MxQWFzMyFhUjNCYjIyImNTMUFqmRZHIuNyyRZHIuOCyRZHIuNyyRZHIuOAGjWlIeKFpSHijAWlIeKFpSHigAAAEAHgAlAfwB+AATAAA3NTM3IzUhNxcHMxUjBzMVIQcnNx6iMdMBBC1SGHOlMdb++S1SGH1hYWFYKDBhYWFYKDAA//8Agv/YAaoDFgIGATcAAAABAFcAMgFgAeoABQAAJRUlJRUHAWD+9wEJjpVj3tpgeAAAAQCAADIBiQHqAAUAADc3JzUFBYCOjgEJ/veVfXhg2t4AAAIAOABIAZ4COgAFAAkAAAEVJSUVBwM1IRUBYP73AQmCpgFmASFjwLxgW/7JQ0MAAAIAOABIAZ4COgAFAAkAABM3JzUNAiE1IXaCggEJ/vcBKP6aAWYBIV5bYLzAdkMAAAUAJv/YA0YDFgADAA8AGgAmADEAAAUjEzMDFAYjIiY1NDYzMhYHFDMyNjU0JiMiBgEUBiMiJjU0NjMyFgcUMzI2NTQmIyIGAWtN203NWk9OXFtPTF39VCkrKyooKwLKWk9OXFtPTF39VCkrKyooKygDPv7qUlhZUVJYWk6KREZHQkL+mFJYWVFSWFpOikRGR0JCAAAGACb/2AREAxYAAwAPABoAMgA9AEgAAAUjEzMDFAYjIiY1NDYzMhYHFDMyNjU0JiMiBgEUBiMiJicGBiMiJjU0NjMyFhc2NjMyFgcUMzI2NTQmIyIGBxQzMjY1NCYjIgYBa03bTc1aT05cW09MXf1UKSsrKigrA8haTyM8ICA8I05cW08iOyEgPCRMXf5UKSsrKigr/VQpKysqKCsoAz7+6lJYWVFSWFpOikRGR0JC/phSWBkdHhhZUVJYGR8fGVpOikRGR0JCR4pERkdCQgAAAQAoAKsB8gFxAAUAABM1IRUjNSgByk4BI07GeAAAAQAY/3QCGAOCACAAAAERFAYjIiY1NTMVFBYzMjY1ETQ2MzI2NzMXBy4CIyIGAU5YTUlIKy8mHihaWBwXByIsIhMZGxYgKwLU/XZkcmltARBFUzgrAoppbQwQtQkxNBU9AAACAAIAAQHVAakAAgALAAAlIRMPAjc3Fy8CAdX+LegbKRo0WC4aKhoBAajiUioDAQMqUT0AAgARAGYBxgKyAAMABwAAExMDAzcXNyfq3NzZYHd8fAKy/tn+2wElAaOjowABABj/2AINAxYACgAAFwMzFxc3EzMVIwN1XVAbGhqavIPGKAFZZHd3AklM/Q4AAQAD//oBsgLuAAwAABMDNSEVIRMHAyEVITXEwQGX/se9Ab4BU/5RAXoBJk5O/u8p/uJOTgAABAAe/6UDUgNJAAMANgBJAEwAAAUTFwMDIgcWFhUUBiMmJjU0NjMyFhUUBgcWFhUUBiMiJjU0Njc2FhUUBgcWMzI1NCMnNjY1NCYBMjY1NSM1EzMRMxUjFRQWMxUjJzM1ASD+Ov6zKRUWGyMXGCRQPURSLSYsOFtTPU8jGBcjGRMVJ1VHFicsJAGmIBy6+ioyMhwg4kSASwOUEPxsAykdBhwUFCICJhoyP0Q9KEISE0krVVQ/MRslAQEiFhIbCBlzbiURQCUvLP1YGRwzLAFi/p4sMxwZJbm6AAAEAET/pQMsA0kAAwAUACcAKgAABRMXAwEyNjURIzU2NjczERQWMxUjBTI2NTUjNRMzETMVIxUUFjMVIyczNQEK/jr+/wAgHDwsSBMjHCDmAgYgHLr6KjIyHCDiRIBLA5QQ/GwBUhkcATAkDTon/j4cGSWsGRwzLAFi/p4sMxwZJbm6AAADACj/pQNIA0kAAwAUAEAAABcTFwMDMjY1ESM1NjY3MxEUFjMVIyU0JiMiBxYVFAYnJiY1NDYzMhYWFRQOAwczMjY2NxcHIyYjIzU0PgPs/jr+/iAcPCxIEyMcIOYCsDIjKBUwIhccJ1E+NVAuIjU7Mw9YHSMbDx4eHQEj5ytAQCtLA5QQ/GwBUhkcATAkDTon/j4cGSWjN0snDycXIgEBJxw3SS1MMSU+NzM1HhEqIwfBDiwlQD09QwACAXj/iwHDAu4AAwAHAAABIxEzESMRMwHDS0tLSwF7AXP8nQFnAAIAJAAAAikCHAAFAAsAAAEDEyMDEyEDEyMDEwFr3Nxm4eEBJNzcZuHhAhz+9/7tARABDP73/u0BEAEMAAIAGAAAAh0CHAAFAAsAAAEDIxMDMxMDIxMDMwId4Wbc3GYj4Wbc3GYBEP7wARMBCf70/vABEwEJAAABAEYA9wHUAToAAwAANzUhFUYBjvdDQwACACAAfQIhAn4AGwAnAAA3JzcmNTQ3JzcXNjMyFzcXBxYVFAcXBycGIyInNxQWMzI2NTQmIyIGTy9OIyNOL041T0w1UC9QJCJOL040T081GjU0NDY2NTI2fS9ONU5PNU4vTiMlUC9QNU1PNE4vTiQktFhVVVhZVFQA//8Agv/YAaoDFgIGATcAAAABAAf/BgHgAhwAKQAAFzI2NTMRNCYjNTMVIgYVERQWMzI2NRE0JiM1MxUiBhURFCMiJxUWMxUjByAcARwg5iAcNSsuORoioyIapykiBjXm1RQXAnYXFCUlFBf+vC46WEUBDxgTJSUTGP8A1g66HyUAAQAAAZIBOgAUAEcABQABAAAAAAAAAAAAAAAAAAMAAgAAAbkBuQG5AbkB5QIhAlECeQK3AuwDIwNdA3wDrwPOBBUEUgR6BLAE3QUJBTUFeAW2BfYGQAZzBqIGyQcBBz8HcQedB+oIPQhICFQIYAhrCHYIpwjYCSAJUwmRCcoJ/go6CkkKVQpgCmsKdgqBCowKlwqiCq0KuQrECs8K2grlCvAK+wsGCxELHAsnCzILPQtIC1MLXgtpC3QLfwuKC5ULoAurC9EL3AvnC/IL/QwJDBUMIAwrDDYMQQxNDFgMYwxuDHkMhAyPDJsMpgyxDLwNEw0eDSkNNA1ADUsNVg1iDW0NeQ2EDY8Nmg2mDbENvA3HDdIN3g3qDfYOAg4NDhkOJA4vDjoORQ5QDlsOkA7lDzkPeQ+2ECkQjRDiEQwRSBF2EZ8R2xINEkMSfBKbErsS7hMLE04TjBO0E+oUFxRBFG4UrhTuFSwVcxWiFdAV9RYtFmoWmxbIFxQXbBd4F4MXshe9F8gX9RgiGGkYmhjUGRMZTxl9GbMZvxnLGdcZ4xnvGfsaBxoTGiMaLxpfGmsadxqDGo8amhqmGrIavhrKGtYa4hruGvobBhsSGx4bKhs2G0IbThtaG2Ybcht+G4oblhuiG64buhvGG9Ib3hvqG/YcAhwOHBocJhwyHD4cShxWHGIcbhx6HIUckRydHKkctRzBHM0c2RzlHPEc/R0JHRUdIR0tHTkdRR1RHV0daR11HYEdjR2ZHaUdsR3lHjgedx7oH0Yfkx+gH60fvh/PH/IgASAOICMgRSBQIFogeCCWILMg0SDeIP4hHCEoITQhTCFcIYshuiIBIkgiZiKEIowimCKkIsIizyLiIvQjAiMPIxwjJSMuIzkjRiNSI14jZyNwI5MjtyPHI9gkCiQ8JIwk5iVdJdYmGiYnJjomRyZbJrMnBCdkJ8MoEShmKM4o8ykVKV8pkynRKgwqTyqNKsIrJytIK2krhSvALAMsJyxTLHAsuC0FLTIteS3BLfIuOi6CLrUuzS7aLvgvEi9DL1YvhC+lL60vvi/PL+cv/zBJMLEwwDDxMQsxITE4MVMxwDICMl8ycjKQMq0yuTL2Mv4zNjM2AAAAAQAAAAEBBnMet0pfDzz1AAMD6AAAAADaDpTaAAAAANoOlNv/3/66BEQELgAAAAYAAgAAAAAAAAI8ADAAwAAAAMAAAAIcAAAB3gAAAe4AGgGqACsB7gAYAeMAHgHbAB4BywAtAiQAGgEkAB4BxgAMAST/3wIQAB4CHgAeAcEAHgLgAB4CAAAJAeAAKwHyAB4B4AArAeAAKwIWABoBoQAXAggACAH7AAoB2v/+AyD//gHc//wB5P/+AbMAGAKuAAACxQAqAd4AAAHeAAAB4wAeASQAHgH7AAoB7gAYAe4AGAItABoB3wAbAeAAAQIIABQB4gAeAggACAHeAAAB3gAAAd4AAAHeAAAB6wAAAesAAAHrAAAB6wAAAesAAAHeAAACrgAAAaoAKwGqACsBrAArAaoAKwHuABgB4wAeAeMAHgHjAB4B4wAeAeMAHgHvAB4B4wAeAeMAHgHvAB4BywAtAbcALQHLAC0BGAAeARgAHgEYAB4BGAAeARgAEgEYAAYBGAAYASQAHgEYAB4BwQAeAdMAHgHBAB4CAAAJAgAACQIAAAkB4AArAeAAKwHgACsB4AArAeAAKwHgACsB4AArAeAAKwHgAAEB4AArAhYAGgIWABoCGgAeAaEAFwGhABcBoQAXAaEAFwGhABcCCAAIAggACAH7AAoB+wAKAfsACgH7AAoB+wAKAfsACgH7AAoB+wAKAfsACgH7AAoDIP/+AyD//gMg//4DIP/+AeT//gHk//4B5P/+AeT//gGzABgBswAYAa8AGAGzABgCFgAYA1UAHgNVAB4DQQAeA0MAHgQpAB4DtAAIA5AACAHO//gB2AAYAZ4AKAHfABgB1QAYAckAGAHAACgCGwAYARYAGAEVABgBtQAQAR3/4AHiABgB7wAYAa0AGAJ3ABgCEwAYAdIAKAHIABgB1AAoAdQAKAHkABgBsAAoAbgAAAHoAAgB2v/+Asj//gHK//gBxv/8AYwAEAKc//gC0QAoAc7/+AHVABgBrgAoARYAGAHoAAgB6QAaAekAGgIyABgBzQAYAggAFQIoACAB1f/8AdIAJAG8AAABzv/4Ac7/+AHO//gBzv/4Ac7/+AHO//gBzv/4Ac7/+AHO//gBzv/4Ac7/+AKc//gBmgAoAZoAKAGaACgBngAoAkcAGAHVABgB1QAYAdUAGAHVABgB1QAYAdUAGAHVABgB1QAYAdUAGAHAACgBwAAoAcAAKAEWABgBFgAYARYAGAEXAA8BKAAOARYAGAEWABgBrQAYAa0AGAGtABgCEwAYAhMAGAITABgB0gAoAdIAKAHSACgB0gAoAdIAKAHSACgB0gAoAdIAKAHSACgB1f/8AeQAGAHkABgBsAAoAbAAKAGwACgBsAAoAbAAKAG4AAABuAAAAegACAHoAAgB6AAIAegACAHoAAgB6AAIAegACAHoAAgB6AAIAsj//gLI//4CyP/+Asj//gHG//wBxv/8Acb//AHG//wBjAAQAYwAEAGMABABjAAQAfMAGANMABgDAQAYA7kAGANwAAAC7gAAAS0ASAEtAEgBbgBIAW4ASAHyAI4BiABIARgABgFuAEAB3gCcAaIASADxAEgBngCsAZ4AogCuACAAtQAYALgAJAGKADkAtQAYALUAGAC1AEgBFQBIAf8ASAE9AHABZQBwAkMAcAJDAHABFQBIARUASAEVAEgBugBIAboASAEVAEgBugBIAX8ASAF///ACGwCMAhsAggM8AXgBbgBIAfIAjgJCAAACHABGAkIAAAM8AAABFQBIARUASAEUAAABFAAYARcAAAEXABgBMQAAATEAGAFyAEgCBABIAXIASAIEAEgBhABIANMASAFBAEgBGwBIAYsASAJwAEgCIABIA0YASANFAEgDRQBIAZ8ANgGUADYAmAAIAHwACAIcAGICHABfAhwAIwIcAC8CHAAvAhwAPwH1AEgCHABQAhwAMAD/ADABBAA4AUgAOAFAADgCHAAqAhwALQIcAIYCHAA4AhwAPAIcACoCHAAzAhwALQIcAEYCHAA/AhwALwIcADQCGgAeAhoAKAIaAEICGgBFAhoAHgIaAB4CMAAYAhoAHgIbAIIB4ABXAeAAgAHgADgB4AA4A3AAJgRuACYCGgAoAjAAGAHgAAIB4AARAfUAGAGyAAMDcAAeA3AARANwACgDPAF4AkEAJAJBABgCHABGAkEAIAIbAIIB6AAHAfQAAAABAAADsP8GAAAEbv/f/8YERAABAAAAAAAAAAAAAAAAAAABkgAEAeABkAADAAACigJYAAAASwKKAlgAAAFeADIBRAAAAAAAAAAAAAAAAAAAAEMAAAAAAAAAAAAAAABMSUFNAEAADSXKA7D/BgAABC4BRgAAAAEAAAAAAhwC7gAAACAABwAAAAIAAAADAAAAFAADAAEAAAAUAAQEWgAAAH4AQAAFAD4ADQAvADkAQABKAFEAWgBgAGkAcQB6AH4BBwEhASgBMQE6AUQBSAFVAWEBaAF+AdQB/wIbAlkCxwLdAxIDhgOUA6wDvB6FHpEevR7zIAcgFCAaIB4gIiAmIDAgMyA6IEQgdCCkIKggrCEgISIiEiIVIhoiKyJIImAiZSXK//8AAAANACAAMAA6AEEASwBSAFsAYQBqAHIAewCgAQoBJgEqATkBPQFHAUoBWAFkAWoBzQH6AhgCWQLGAtgDEgOEA5QDrAO8HoAekB68HvIgByATIBggHCAgICYgMCAyIDkgRCB0IKQgqCCsISAhIiIRIhUiGiIrIkgiYCJkJcr//wGEAAABNwAA/8MAAP/GAAAALAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+Vv5PAAD+DwAA/e/9Gfz7AAAAAAAAAADf/OEqAAAAAAAA4QLhUOEc4PvhNuDy4Lngt+Cy4DbgMwAA33rfa99X3zDfGd8Z27oAAQAAAHwAAACYAAAAogAAAKwAAAC0AAAAwADGAZQBwgHGAdQB1gHkAeYB/AIOAhYCPgJMAlYAAAAAAlgAAAJgAAAAAAAAAl4CaAJqAmwAAAAAAmoCbgJyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJgAAAAAAAAAAAAAAAAAAAAAAABASkBTQFxAVkBfwFQAUwBQQFCAUsBcgEkATwBJwE3ASYBJQF7AXcBfAErAVIADwARABIAEwAUABUAFgFDATYBRAE5ATsBEwCXAJkAmwCcAJ0AngCfAKABRQE4AUYBOgACASoBWgFcAY4BWwGKAWABGAFUAVcBiwGBAY0BUwEZAWIBdAFkAWUBFAGQAWEBQAEeAWMBWAGMAYgBiQGHASwAMgAxADQANQA2ACMAIQA+AEAAQQBDAEUATABNAE4AUAApAFoAWwBcAF0AXgBfAXUALABvAHAAcQBzAH4ALgBnALsAvAC9AL4AvwDCAKsAygDMAM0AzgDQANgA2QDaANsAswDkAOUA5gDnAOgA6gF2ALgA+AD5APsA/AEGALkBCAA3AMAAOADBACQArQA7AMcAPQDJADwAyAA/AMsAKACyAEYA0QBHANIASADTACUArgBEAM8ASwDXAEkA1QBKANYAKgC0AE8AUQDcAFIA3QAmALAAVACWAFUA3wBXAOAAVgDhACsAtQBYAOIAWQDjAC0AtgBgAOsAYQDsAGIA7QAiAKwAZQDvAGYA8ABoAPEAbAD0AGoA8wBpAPIAbQD2AC8AugByAHQA/QB1AP4AdgD/AHcBAAAnALEAewEDAH8BBwCAAIEBCQCDAQwAggEKADMAxABTAN4AZADpAHgA+gAwAMMAOgDGAGMA7gBrAPUAbgD3ARoBHQEbAR8BFwEcASIBIwA5AHkBAQB6AQIAfAEEAIQBCwBCANQAfQEFAS4BLwEyATABMQEzAUcBSQE/AYYBcwAAuAH/hbAEjQAAAAALAIoAAwABBAkAAAC8AAAAAwABBAkAAQAQALwAAwABBAkAAgAOAMwAAwABBAkAAwA2ANoAAwABBAkABAAgARAAAwABBAkABQAaATAAAwABBAkABgAgAUoAAwABBAkACQAaAWoAAwABBAkADAAQAYQAAwABBAkADQEgAZQAAwABBAkADgA0ArQAQwBvAHAAeQByAGkAZwBoAHQAIAAyADAAMQA5ACAAVABoAGUAIABHAGkAcgBhAHMAcwBvAGwAIABQAHIAbwBqAGUAYwB0ACAAQQB1AHQAaABvAHIAcwAgACgAaAB0AHQAcABzADoALwAvAGcAaQB0AGgAdQBiAC4AYwBvAG0ALwBsAGkAYQBtAHMAcAByAGEAZABsAGkAbgAvAEcAaQByAGEAcwBzAG8AbAAtAEQAaQBzAHAAbABhAHkAKQBHAGkAcgBhAHMAcwBvAGwAUgBlAGcAdQBsAGEAcgAxAC4AMAAwADQAOwBMAEkAQQBNADsARwBpAHIAYQBzAHMAbwBsAC0AUgBlAGcAdQBsAGEAcgBHAGkAcgBhAHMAcwBvAGwAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADQARwBpAHIAYQBzAHMAbwBsAC0AUgBlAGcAdQBsAGEAcgBMAGkAYQBtACAAUwBwAHIAYQBkAGwAaQBuAGkAYQBtAGwAaQAuAGEAbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAZIAAAADAQIBAwAkACUAJgAnACgAKQAqACsALAAtAQQALgEFAC8AMAAxADIAMwA0AQYANQA2ADcAOAA5ADoAOwA8AD0AkACwAGMBBwEIAQkBCgELAOkBDADiAJEBDQDtAQ4BDwDJAK0BEADHAK4AYgERARIBEwEUAP0A/wEVAGQBFgDLAGUBFwDIARgAygEZARoBGwD4ARwBHQDPAMwAzQEeAM4BHwEgASEA+gEiASMBJAElASYAZgDTANAA0QCvAGcBJwEoASkBKgErASwBLQCJAS4A5AD7AS8BMAExATIA1gDUANUBMwBoATQBNQE2ATcBOAE5AToBOwE8AT0A6wE+ALsBPwDmAUABQQFCAUMBRAFFAUYBRwFIAUkARABFAEYARwBIAEkASgBLAEwA1wBNAUoATgFLAE8AUABRAFIAUwBUAUwAVQBWAFcAWABZAFoAWwBcAF0AoACxAU0BTgFPAVABUQEBAOoBUgDjAVMAlwChAO4BVABqAGkAawBtAGwBVQFWAG4BVwFYAVkBWgD+AQABWwBvAVwAcQBwAHIBXQBzAV4BXwFgAWEA+QFiAWMAdQB0AHYAdwFkAWUBZgFnAWgBaQFqAWsAeAB6AHkAewB9AWwAfAFtAW4BbwFwAXEBcgFzAOUA/AF0AXUBdgF3AH8AfgF4AIAAgQF5AXoBewF8AX0BfgF/AYABgQDsAYIAugGDAOcBhAGFAYYBhwGIAYkBigGLAEMAjQDYAOEA2QCOANoA2wDdAN8A3ADeAOABjAGNAY4BjwAPAB4AHQARAKsABACjACIAogGQALYAtwC0ALUAxADFAL4AvwA/ABIAXwBBAGEAQgAQALIAswCHAMMACwAMAD4AQABeAGAAggGRAMIBkgANAAoABQGTAZQACQGVACMAigCLAIwBlgCdAJ4ABwCEAJYAhQGXAZgBmQCGAIgAgwDxAPIA8wGaABMAFAAVABYAFwAYABkAGgAbABwABgAOAO8AkwDwALgAIACnAI8AvAAfACEAlACVAAgAxgCkAJwAqAC5AKUAmQD2APUA9ADoAZsBnAGdAL0BngGfAaAHbmJzcGFjZQtmaWd1cmVzcGFjZQdKLmFsdF8xB0suYWx0XzEHUS5hbHRfMQdBb2dvbmVrB0VvZ29uZWsHSW9nb25lawdVb2dvbmVrBkRjcm9hdARIYmFyA0VuZwRUYmFyCkFyaW5nYWN1dGUGQWNhcm9uB0FtYWNyb24GQWJyZXZlCkFscGhhdG9ub3MHQUVhY3V0ZQpDZG90YWNjZW50BkRjYXJvbgZFdGlsZGUGRWNhcm9uB0VtYWNyb24GRWJyZXZlCkVkb3RhY2NlbnQKR2RvdGFjY2VudAtHY2lyY3VtZmxleAZJdGlsZGUHSW1hY3JvbgZJYnJldmUGSWNhcm9uBkxhY3V0ZQRMZG90BkxjYXJvbgZOYWN1dGUGTmNhcm9uB09tYWNyb24GT2JyZXZlDU9odW5nYXJ1bWxhdXQLT3NsYXNoYWN1dGUGT2Nhcm9uBlJhY3V0ZQZSY2Fyb24GU2FjdXRlDFNjb21tYWFjY2VudAtTY2lyY3VtZmxleAZUY2Fyb24MVGNvbW1hYWNjZW50BlV0aWxkZQdVbWFjcm9uBlVicmV2ZQVVcmluZw1VaHVuZ2FydW1sYXV0BlVjYXJvbgZXZ3JhdmUGV2FjdXRlC1djaXJjdW1mbGV4CVdkaWVyZXNpcwZZZ3JhdmULWWNpcmN1bWZsZXgGWmFjdXRlClpkb3RhY2NlbnQLWmNpcmN1bWZsZXgDRF9FA0VfQQNFX2EDTF9BA0xfYQNSX1IDVF9FA1RfVAdqLmFsdF8xB2suYWx0XzEHcS5hbHRfMQdhb2dvbmVrB2VvZ29uZWsFc2Nod2EHaW9nb25lawd1b2dvbmVrBGhiYXIDZW5nBHRiYXIHYW1hY3JvbgZhYnJldmUKYXJpbmdhY3V0ZQZhY2Fyb24KYWxwaGF0b25vcwdhZWFjdXRlCmNkb3RhY2NlbnQGZGNhcm9uBmVjYXJvbgdlbWFjcm9uBmVicmV2ZQplZG90YWNjZW50BmV0aWxkZQpnZG90YWNjZW50C2djaXJjdW1mbGV4B2ltYWNyb24GaWJyZXZlBmljYXJvbgZsYWN1dGUGbGNhcm9uBGxkb3QGbmFjdXRlBm5jYXJvbgZvY2Fyb24Hb21hY3JvbgZvYnJldmUNb2h1bmdhcnVtbGF1dAtvc2xhc2hhY3V0ZQZyYWN1dGUGcmNhcm9uBnNhY3V0ZQtzY2lyY3VtZmxleAxzY29tbWFhY2NlbnQGdGNhcm9uDHRjb21tYWFjY2VudAZ1Y2Fyb24HdW1hY3JvbgZ1YnJldmUFdXJpbmcNdWh1bmdhcnVtbGF1dAZ3Z3JhdmUGd2FjdXRlC3djaXJjdW1mbGV4CXdkaWVyZXNpcwZ5Z3JhdmULeWNpcmN1bWZsZXgGemFjdXRlC3pjaXJjdW1mbGV4Cnpkb3RhY2NlbnQDZF9lA2VfYQNsX2EDcl9yA3RfZQN0X3QLY29tbWFhY2NlbnQTY29tbWF0dXJuZWRhYm92ZWNtYgV0b25vcw1kaWVyZXNpc3Rvbm9zCmFwb3N0cm9waGUMZGFnZ2VyLmFsdF8xD2RhZ2dlcmRibC5hbHRfMQZtaW51dGUGc2Vjb25kD2FtcGVyc2FuZC5hbHRfMQtzZXJ2aWNlbWFyawRsaXJhBEV1cm8FcnVwZWUNZm91ci5zdXBlcmlvcg1ndWlsbGVtZXRsZWZ0Dmd1aWxsZW1ldHJpZ2h0Cmh5cGhlbnNvZnQNZGl2aXNpb25zbGFzaAdtdS5tYXRoB3VuaTAwMEQAAAAAAQAB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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
