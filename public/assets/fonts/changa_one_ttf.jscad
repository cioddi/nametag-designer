(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.changa_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEECQAGABIBQgADAAEECQAHAGIBVAADAAEECQAIAC4BtgADAAEECQAJAC4BtgADAAEECQALACwB5AADAAEECQAMACwB5AADAAEECQANASACEAADAAEECQAOADQDMABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAARQBkAHUAYQByAGQAbwAgAFQAdQBuAG4AaQAgACgAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEMAaABhAG4AZwBhACIAQwBoAGEAbgBnAGEAIABPAG4AZQBSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAAQwBoAGEAbgBnAGEAIABPAG4AZQAgADoAIAAyADEALQAxADEALQAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADMAQwBoAGEAbgBnAGEATwBuAGUAQwBoAGEAbgBnAGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwBy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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
