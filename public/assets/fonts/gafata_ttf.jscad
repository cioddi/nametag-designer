(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gafata_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAYAHAEyAAMAAQQJAAcAVAFOAAMAAQQJAAgAIAGiAAMAAQQJAAkAIAGiAAMAAQQJAA0BIAHCAAMAAQQJAA4ANALiAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAwAC0AMgAwADEAMgAsACAATABhAHUAdABhAHIAbwAgAEgAbwB1AHIAYwBhAGQAZQAgACgAbABhAHUAdABhAHIAbwAuAHUAeQBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACcARwBhAGYAYQB0AGEAJwBHAGEAZgBhAHQAYQBSAGUAZwB1AGwAYQByAEwAYQB1AHQAYQByAG8ASABvAHUAcgBjAGEAZABlADoAIABHAGEAZgBhAHQAYQA6ACAAMgAwADEAMABWAGUAcgBzAGkAbwBuACAANAAuADAAMAAyAEcAYQBmAGEAdABhAC0AUgBlAGcAdQBsAGEAcgBHAGEAZgBhAHQAYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEwAYQB1AHQAYQByAG8AIABIAG8AdQByAGMAYQBkAGUALgBMAGEAdQB0AGEAcgBvACAASABvAHUAcgBjAGEAZABlAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOoAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAQIAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXAOIA4wCwALEA5ADlALsA5gDnAKYA2ADhANsA3ADdAOAA2QDfALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBAwCMAO8AwADBAQQHbmJzcGFjZQRFdXJvBWkuYWx0AAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgADAAEA5gABAOcA6AACAOkA6QABAAAAAQAAAAoAHgAsAAFERkxUAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAIACgdMAAEAiAAEAAAAPwEKASQBLgFAAWYBdAGGAbwBzgHgAe4CDAI+AkwCXgJkBjgCdgKkAs4C4ALuAxQDJgNEA2YDpAPuBAwEMgQ4BD4ERAc4BFoEgASeBOAFAgUwBVIFhAWyBdQF2gXkBeoF8AYCBjgGOAY4BjgGOAY4Bj4GkAbOBvgHDgcgByYHOAABAD8AAwAGAAkACwANAA4AEgATABUAFgAXABoAGwAcACAAIwAkACUAKQAqAC0ALgAwADMANQA3ADkAOgA7ADwAPQA+AD8ARwBJAEoATgBUAFUAVwBZAFoAWwBeAGMAZQBxAHgAgACBAIIAgwCEAIUAhgCfAKAAsQC4AOMA5ADmAOkABgA3/+gAOf/oADv/9QBZ/+0AWv/vAIf/4wACABT/9QAW//QABAA3/9kAOf/wADv/6gCH/+wACQAT//MAF//xABn/8wAb//QATQASAFf/8gBZ//IAWv/1ALH/8wADAEr/8gCH/8gAsf/qAAQAFP/zABX/8wAW/+kAGv/0AA0AEv8yABP/7gAX/9wAGf/tABv/8AAc//UASv/bAFf/8QBZ//IAWv/zAFv/8ACH/8AAsf/2AAQADP/zADn/9gA///QAh//1AAQAOf/1AD//9AB4//EAuP/vAAMADP/zADn/9AA///MABwAM//QAFP/pABr/8AA3//EAOf/qAD//6gBx/+wADAAG/+QADv/rABL/0gAX/+cAIP/0AGT/9AB4/94Ah//OAJj/9QC4/+IA4//aAOb/6QADAAz/9AA5//UAP//0AAQADP/0ADn/9gA///YAh//1AAEAFv/2AAQAN//XADn/4gBZ/+4AWv/zAAsADP/zAC3/+gA3/+8AOf/uADv/8gA///EASv/7AFf/+gBZ//kAW//zAOX/9AAKAAP/8AAS/+IASv/tAFf/9gBZ//gAWv/6AFv/6wCH/7MAsf/tAMH/7gAEADn/+gBX//YAWf/yAFr/9gADAEr/9wBX//gAsf/5AAkAA//yABf/7QBK//oAV//qAFn/1gBa/94Aa//pAG//6QCx/+kABABK//kAV//4AFn/+wCx//oABwAD/+4AEv/fADn/+gA7/+cASv/4AIf/sQCx//AACAA3//cAOf/yAD//9ABK//oAV//7ALH/7gDl//YA6f/6AA8AA//oABL/3AAX/+AAI//UAEr/sQBX/+MAWf/LAFr/ygBb/8YAa//jAG//4wCH/8gArwASALH/zADB/8IAEgAD/+kACf/1ABL/1wAT//QAF//oABn/9AAb//UAI//iAC3/+gBK/9IAV//0AFv/9wBr/+wAb//sAIf/xgCx/84Awf/iAMP/+gAHAEX/+gBK/+8AV//3AFv/+wCH/+0Asf/xAOn/+gAJAAP/9QAX//EASv/5AFf/7QBZ/+MAWv/lAGv/7QBv/+0Asf/oAAEAwf/LAAEAwf/4AAEATQAHAAUAFP/hADf/3QA5/9YAWf/lAFr/6wAJAAP/7QAS//AAI//wAC3/9wA3/9sAO//rAEr/9QCH/98Asf/nAAcALQAHADf/vwA5/+sAOv/1AD//8QCx//gA5f/tABAAA//yAA3/7QA3/70AOf/RADr/7AA//+EASv/3AFf/8wBZ/+0AWv/vAGv/8ABs//IAb//wAHv/8QCx/9cA5f/aAAgADf/3AC3/+AA3/7MAOf/eADr/9wA//+kATQAIAOX/7QALAAP/7AAM//YAEv/gACP/6QAt//UAMP/7ADf/0gA7/+EASv/xAIf/zQCx/9wACAAD//UAI//0AC3/9wA3/9sAO//3AEr/9wCH//YAsf/qAAwAA//tAAz/8gAS/+UAI//xAC3/9AAw//sAN//KADv/4wBK//QAh//VALH/6wDl//YACwAD/+4ADP/1ABL/7QAj//YALf/3ADf/ywA7/+UASv/4AIf/3QCx//EA5f/4AAgALf/6ADf/xgA5//YAOv/7AD//9ABK//cAsf/qAOX/8QABAE0AGQACADf/3QA5//IAAQAX//AAAQAX/+QABAAU/+UAFf/xABb/6wAa/+YADQAw//MAN//TADn/6AA6//MAO//oAEX/8wBNACsAV//1AFn/9gBb//MAh//iALH/7wDp//MAAQDC//oAFAAD/+8ADP/wAA3/7gAU/+MAGv/pACL/9QAt//oAN//HADn/4gA6//oAO//eAD//5ABX//kAWf/0AFr/+QBb/+sAbP/sAHv/6wCH//YA5f/uAA8AA//xAAz/8wAN/+cALf/yADf/1QA5/9kAOv/oAD//5gBX//oAWf/eAFr/6wBb//cAbP/jAHv/5gDl/+oACgAM//QALf/4ADf/6AA5/+cAOv/2ADv/5wA///UAW//7AIf/8gDl//YABQAU/+cAFf/pABb/4AAY//UAGv/oAAQAE//yABf/5AAZ//EAG//yAAEAF//vAAQAFP/vABX/7QAW/+cAGv/vAAIALf/5ADr/9wACJ0AABAAAJ7wpjABMAEIAAP/s/+r/5v/z//MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/YAAD/xv+Y/5j/+P/Z/+L/9//4/8v/8//T//H/2v+YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/tAAD/0f/m/+YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+//7//2/+0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/3QAAAAAAAAAAAAAAAAAA/+0AAP/ZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+7/3f/d/90AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9f/qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/z/8oAAAAAAAAAAAAAAAD/6wAAAAAAAAAAAAAAAAAA/9j/2P/i/9f/9gAA/+v/6f/s/+EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+7/1gAAAAAAAAAAAAAAAAAA/+sAAP/W/+3/7QAAAAAAAP/4AAD/9f/pAAAAAP/vAAD/8f/s/+b/4f/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+L/2P/2/9sAAAAAAAAAAAAA//AAAAAAAAAAAP/C//H/6f/G/9//5P/K/9X/2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/mAAD/z//Y/9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+D/3QAAAAAAAAAAAAD/9P/0AAAAAAAAAAAAAAAA//H/8f/u//D/8//r//P/8//v//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/z//L/9P/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4AAAAAAAAAAAAAAAAAAA//AAAP/WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1//T/1f/1//UAAP/1AAAAAAAA/+cAAP/VAAAAAAAAAAAAAAAAAAAAAP/2AAAAAP/sAAD/6QAAAAD/8v/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+r/6v/3/+YAAAAAAAAAAAAA//UAAAAAAAAAAP/DAAD/7/+XAAAAAAAAAAD/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+X/5f/2/+EAAAAAAAAAAAAA//MAAAAAAAAAAP/C//H/6f+Y/98AAP/J/+n/4gAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//UAAAAAAAAAAAAAAAD/8gAAAAAAAAAAAAAAAAAA/+7/7v/z/+4AAAAA//T/8gAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//L/7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAAAAAAAAAD/9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/JAAAAAAAAAAAAAAAAAAAAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5f/rAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//L/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/gAAD/xf/X/9f/6//g/+n/8P/z/9P/6//T//D/3P/W//P/9v/7//YAAAAAAAD/+AAAAAAAAAAAAAAAAAAA/+r/+gAAAAD/9gAA//T/9QAAAAD/+QAA/+7/9//4/9X/9f/1//b/0P/0/9X/1P/w//D/0QAAAAAAAAAAAAAAAAAAAAAAAAAA/+v/4gAAAAAAAAAAAAAAAAAA/+8AAP/qAAAAAAAAAAAAAP/7AAAAAP/yAAAAAP/6AAD/8gAA//T/5v/oAAD/+v/xAAAAAP/2AAAAAAAAAAAAAAAAAAAAAAAAAAD/8gAAAAD/8f/2AAAAAAAAAAD/9f/4AAAAAAAAAAAAAAAAAAAAAP/yAAAAAAAAAAD/9//x//L/8gAAAAAAAAAAAAAAAAAA//L/9gAA//YAAAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8gAA//T/9AAAAAAAAAAA/+YAAAAAAAAAAAAAAAAAAAAAAAAAAP/u/+4AAAAAAAAAAAAAAAAAAAAAAAAAAP/y//r/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//v/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+z/5wAAAAAAAAAAAAAAAAAA//IAAP/zAAAAAAAAAAAAAP/7AAAAAP/1AAAAAP/6AAD/9AAAAAD/6f/pAAD/+v/wAAAAAP/2AAAAAAAAAAAAAAAAAAAAAAAAAAD/8wAAAAD/9AAAAAAAAAAAAAD/+P/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAA//n/+f/7//kAAAAAAAD/+wAA//sAAAAAAAAAAAAAAAD/+AAAAAAAAAAAAAD/+QAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/uAAAAAAAAAAD/8v/t/+//9QAAAAAAAAAAAAAAAAAA//X/+AAA//cAAAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAA//j/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+yAAD/tP+7/7v/7/+y/8f/7//x/73/7/+4AAD/4/+6//L/+wAA//oAAAAAAAD/+wAAAAAAAAAAAAAAAAAA/+gAAAAAAAD/6gAA/+z/9QAAAAAAAAAA/74AAP/7/7oAAAAAAAD/zAAA/7r/uv/s/+z/uQAA/2sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//n/+f/7//kAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAA//n/+f/6//kAAAAAAAD/+v/4//j/+wAAAAAAAP/xAAD/9P/3AAAAAAAAAAD/9wAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAAAAAAAAAD/7AAAAAAAAAAAAAAAAAAA/9D/0v/Z/9L/9wAA/+T/4f/r/9sAAAAAAAAAAAAAAAAAAP/LAAAAAAAA/+cAAAAAAAAAAAAA/+v/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7f/vAAAAAAAAAAAAAP/5/9kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//P/8//e//L/+wAA/+7/8f/n//MAAAAAAAAAAAAAAAAAAP+9AAAAAAAAAAAAAAAAAAAAAAAAAAD/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//D/8v/x//IAAAAA//j/+P/1//IAAAAAAAAAAAAAAAAAAP/zAAAAAAAAAAAAAP/5//r/+gAAAAD/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//r/+gAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/XAAAAAAAAAAAAAAAAAAD/3v/7AAAAAAAAAAAAAAAA/+P/7AAA/+wAAAAAAAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//UAAAAAAAD/+wAA/9kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/o//r/9v/3//f/+P/m/+0AAAAA//YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+AAAAAAAAAAAAAAAAAAA//YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9n/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//j/9//6//cAAP/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//H/9AAA//QAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//YAAAAAAAD/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5//f/4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/N/9MAAAAAAAAAAAAAAAD/4QAAAAAAAAAAAAAAAAAA/7P/s/+5/7MAAAAA/8f/xP+5/7gAAAAAAAAAAAAAAAAAAP/TAAAAAAAA/9UAAAAAAAAAAAAA/9X/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/2P/VAAAAAAAAAAAAAP/yAAAAAAAAAAD/9v/y//P/9AAAAAAAAAAAAAAAAAAA//D/9AAA//QAAAAA//j/9AAAAAAAAAAAAAAAAAAAAAD/+wAAAAD/8QAAAAD/8QAAAAAAAAAA/+n/+gAAAAAAAAAAAAAAAAAAAAAAAP/w//AAAAAAAAAAAAAAAAAAAAAAAAAAAP/jAAAAAAAAAAAAAAAAAAD/6AAAAAAAAAAAAAAAAAAA/+T/7AAA/+sAAAAAAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAA/+H/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/p/8QAAAAAAAD/4v/n/+b/2wAAAAAAAAAAAAAAAAAA/7f/tv/C/7b/8wAA/9L/z//P/7z/4AAAAAAAAP+3/+b/vP/F/9L/1//Q/9X/uQAAAAAAAAAA/9b/8gAAAAAAAP/s/+sAAAAAAAAAAP/e/94AAP/5AAD/3f/h/+7/8//uAAAAAP/0//T/uf/r/+sAAAAAAAAAAAAAAAAAAAAAAAAAAP/sAAAAAAAAAAD/9f/uAAAAAP/5AAAAAAAAAAAAAAAAAAAAAP/yAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5//r/twAAAAAAAP/6//wAAP/6/9b/8/+2AAAAAAAAAAAAAAAAAAD/+//6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAA//b/8gAAAAD/5//1AAD/+AAAAAD/7f/yAAAAAAAAAAAAAAAAAAAAAAAA/+D/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+z/6wAA/+wAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/pAAAAAAAA/+0AAAAAAAAAAAAA/+0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0gAAAAAAAAAAAAD/+v/3AAAAAAAAAAAAAAAA//n/+wAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+//6AAD/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5/8QAAAAAAAAAAAAAAAAAAP/6AAD/wwAAAAD//P/5AAAAAP/7/9n/+P+yAAAAAAAAAAAAAAAAAAAAAP/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAD//AAA//X/8wAAAAD/5f/2//f/9gAAAAD/6//5AAAAAAAAAAAAAAAAAAAAAP/3//L/v//4//j/+//3//oAAP/6/9j/8/+1AAAAAP/4AAAAAAAAAAD/9//uAAAAAP/4AAD/7gAAAAD/4//0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5AAD/+wAA//P/7gAAAAD/5P/z//X/9AAAAAD/7P/zAAAAAAAAAAAAAAAA//oAAAAAAAD/xAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9b/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+f/6AAA/+gAAP/3AAAAAAAA//sAAAAAAAAAAAAAAAAAAP/VAAAAAAAA/+MAAAAAAAAAAAAA/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//D/7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//D/8AAA//EAAP/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/2AAAAAAAA//IAAAAAAAAAAAAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/yAAAAAAAAAAAAAAAAP/7/+H/+f/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAD/7AAAAAAAAAAAAAD/7f/6AAAAAAAAAAAAAAAAAAAAAAAA/9//5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//P/8v/5//IAAP/xAAAAAAAA//oAAAAAAAAAAAAAAAAAAP/ZAAAAAAAA//UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+n/5wAAAAAAAAAAAAAAAAAAAAAAAAAA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AOEA4gCgAOcA6QCiAAEABQDlAAkAAAAAAAAABgAJABEAAAAEAAAAAQAIAAEABwASAAAAFAAXABUAFgAAABMAGAAZAAUABQAAAAAAAAAAAAIAGwAtAB0AHAAhACYAHgAgACAAIwApACIAKAAgAB8AKwAfACwAKgAuACQAJQAnADAAMQAvAAAACgAAAAAAAAAAAEMARABFAEYAMwA0ADUAOAA2ADYARwA3ADgAOAA5AEQAOgA7AEgAPAA9AD4APwBAAEEAQgAaAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAANAAAAAAAAAAsAGwAbABsAGwAbABsAIQAdACEAIQAhACEAIAAgACAAIAAcACAAHwAfAB8AHwAfAAAAHwAkACQAJAAkADEAMgBLAEMAQwBDAEMAQwBDADMARQAzADMAMwAzADYANgA2ADYASgA4ADkAOQA5ADkAOQAAADkAPQA9AD0APQBBAEQAQQA2ACIANwAhADMAKgBIADEALwBCAAAAAAAAAAAAAAAAAAAAAAAAAAgACAAOAA8AAQAOAA8AAQAAAAAAAAAAAAAADAANAAAAAAAAAAAANgA3AEkAAQADAOcAIAAAAAQAAAAAAAAAQAAEAAAAMAAvAAAAIgAsACIAJQAxAA8AHAAdACQAAAAyAA4APgA/ADwAPAAAAAAAAAA0ACMAAgArAAkAKwArACsACQArACsAOgArACsAQQArAAkAKwAJACsAFQANAAoACwAMAB4AAwAWAAAAMwAAAAAAAAAAABMAAAARABQAEQAtACEAKAApACkAKAAqABcAFwASABcAFAAXABoABgAYAAcACAAbAAEAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcANQAmAAAAOAAAAAAAAAAAAAAAAAAAAAAAOwAAAAAANgA9AAAAAAAAAAAAAgACAAIAAgACAAIAHwAJACsAKwArACsAKwArACsAKwArACsACQAJAAkACQAJAAAACQAKAAoACgAKAAMAKwAtABMAEwATABMAEwATABMAEQARABEAEQARACkAKQApACkAJwAXABIAEgASABIAEgAAABIAGAAYABgAGAABACgAAQApACsAKgAJABIAFQAaAAMAFgAZAAAAAAAAAAAAAAAAAAAAAAAAACwALAAQAAUAIgAQAAUAIgAAAAAAAAAiAAAAJgA9AAAAAAA5AAAALQAtAC4AAQAAAAoAIgBIAAFERkxUAAgABAAAAAD//wADAAAAAQACAANhYWx0ABRsaWdhABpzczAxACAAAAABAAAAAAABAAIAAAABAAEAAwAIAAgAHAABAAAAAQAIAAEABgCdAAEAAQBMAAQAAAABAAgAAQAaAAEACAACAAYADADoAAIATwDnAAIATAABAAEASQ==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
