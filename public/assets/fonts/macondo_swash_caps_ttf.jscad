(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.macondo_swash_caps_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEECQAFABoBmAADAAEECQAGADABsgADAAEECQAHAFwB4gADAAEECQAIACYCPgADAAEECQAJACYCPgADAAEECQAMADICZAADAAEECQANASAClgADAAEECQAOADQDtgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMQA5ADkANwAgAC0AIAAyADAAMQAxACwAIABKAG8AaABuACAAVgBhAHIAZwBhAHMAIABCAGUAbAB0AHIAYQBuAC4AIAAoAHcAdwB3AC4AagBvAGgAbgB2AGEAcgBnAGEAcwBiAGUAbAB0AHIAYQBuAC4AYwBvAG0AfABqAG8AaABuAC4AdgBhAHIAZwBhAHMAYgBlAGwAdAByAGEAbgBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIATQBhAGMAbwBuAGQAbwAiAE0AYQBjAG8AbgBkAG8AIABTAHcAYQBzAGgAIABDAGEAcABzAFIAZQBnAHUAbABhAHIASgBvAGgAbgBWAGEAcgBnAGEAcwBCAGUAbAB0AHIAYQBuADoAIABNAGEAYwBvAG4AZABvACAAUgBlAGcAdQBsAGEAcgA6ACAAMQA5ADkANwBWAGUAcgBzAGkAbwBuACAAMgAuADAAMAAxAE0AYQBjAG8AbgBkAG8AUwB3AGEAcwBoAEMAYQBwAHMALQBSAGUAZwB1AGwAYQByAE0AYQBjAG8AbgBkAG8AIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABKAG8AaABuACAAVgBhAHIAZwBhAHMAIABCAGUAbAB0AHIAYQBuAC4ASgBvAGgAbgAgAFYAYQByAGcAYQBzACAAQgBlAGwAdAByAGEAbgB3AHcAdwAuAGoAbwBoAG4AdgBhAHIAZwBhAHMAYgBlAGwAdAByAGEAbgAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAg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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
