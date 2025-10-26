(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.spinnaker_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEAEgC4AAMAAQQJAAIADgDKAAMAAQQJAAMAPgDYAAMAAQQJAAQAEgC4AAMAAQQJAAUAGgEWAAMAAQQJAAYAIgEwAAMAAQQJAAcAVgFSAAMAAQQJAAgAHgGoAAMAAQQJAAkAHgGoAAMAAQQJAAoCdgHGAAMAAQQJAAsAMgQ8AAMAAQQJAAwALARuAAMAAQQJAA0BIASaAAMAAQQJAA4ANAW6AAMAAQQJABIAEgC4AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABTAG8AcgBrAGkAbgAgAFQAeQBwAGUAIABDAG8AIAAoAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtACkAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAFMAcABpAG4AbgBhAGsAZQByACIALgBTAHAAaQBuAG4AYQBrAGUAcgBSAGUAZwB1AGwAYQByAEUAbABlAG4AYQBBAGwAYgBlAHIAdABvAG4AaQA6ACAAUwBwAGkAbgBuAGEAawBlAHIAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMQBTAHAAaQBuAG4AYQBrAGUAcgAtAFIAZQBnAHUAbABhAHIAUwBwAGkAbgBuAGEAawBlAHIAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABTAG8AcgBrAGkAbgAgAFQAeQBwAGUAIABDAG8ALgBFAGwAZQBuAGEAIABBAGwAYgBlAHIAdABvAG4AaQBTAHAAaQBuAGEAawBlAHIAIABpAHMAIABiAGEAcwBlAGQAIABvAG4AIABGAHIAZQBuAGMAaAAgAGEAbgBkACAAVQBLACAAbABlAHQAdABlAHIAaQBuAGcAIABmAG8AdQBuAGQAIABvAG4AIABwAG8AcwB0AGUAcgBzACAAZgBvAHIAIAB0AHIAYQB2AGUAbAAgAGIAeQAgAHMAaABpAHAALgAgAFMAcABpAG4AYQBrAGUAcgAgAGkAcwAgAGEAIABsAG8AdwAgAGMAbwBuAHQAcgBhAHMAdAAgAHMAbABpAGcAaAB0AGwAeQAgAHcAaQBkAGUAIABzAGEAbgBzACAAcwBlAHIAaQBmACAAZABlAHMAaQBnAG4ALgAgAFMAcABpAG4AYQBrAGUAcgAgAGgAYQBzACAAYQAgAHcAaABpAG0AcwB5ACAAeQBvAHUAdABoAGYAdQBsACAAcwBlAG4AcwBlACAAbwBmACAAcABsAGEAeQAgAHQAbwAgAG8AZgBmAGUAcgAgAGkAbgAgAGEAZABkAGkAdABpAG8AbgAgAHQAbwAgAHQAaABlACAAZQB4AHAAZQBjAHQAZQBkACAAdQB0AGkAbABpAHQAeQAgAHQAaABhAHQAIABhACAAcwBhAG4AcwAgAGQAZQBzAGkAZwBuACAAYwBvAG0AbQBvAG4AbAB5ACAAbwBmAGYAZQByAHMALgAgAFMAcABpAG4AYQBrAGUAcgAgAGkAcwAgAHMAdQBpAHQAYQBiAGwAZQAgAGYAbwByACAAbQBlAGQAaQB1AG0AIAB0AG8AIABsAGEAcgBnAGUAIABzAGkAegBlAHMALgBoAHQAdABwADoALwAvAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtAGgAdAB0AHAAOgAvAC8AYQBuAGEAdABvAGwAZQB0AHkAcABlAC4AbgBlAHQAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/ZgBmAAAAAAAAAAAAAAAAAAAAAAAAAAABBAAAAAEAAgECAQMBBAEFAQYBBwEIAQkBCgELAQwBDQEOAQ8BEAERARIBEwEUAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCsAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkARUAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEWARcBGADXARkBGgEbARwBHQEeAR8A4gDjASABIQCwALEBIgEjASQBJQEmAScA2ADhAN0A2QCyALMAtgC3AMQAtAC1AMUAhwC+AL8BKAEpASoBKwEsAS0BLgEvATAHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAxMAd1bmkwMDExB3VuaTAwMTIHdW5pMDAxMwd1bmkwMDE0B3VuaTAwMTUHdW5pMDAxNgd1bmkwMDE3B3VuaTAwMTgHdW5pMDAxOQd1bmkwMEFEBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljBGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uCGRvdGxlc3NqBEV1cm8LY29tbWFhY2NlbnQJZ3JhdmUuY2FwCWFjdXRlLmNhcA5jaXJjdW1mbGV4LmNhcAxkaWVyZXNpcy5jYXAJdGlsZGUuY2FwCWNhcm9uLmNhcAhyaW5nLmNhcAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA+wABAAAAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWNwc3AACAAAAAEAAAABAAQAAQAAAAEACAABAAoABQAQACAAAgANAAAAAAAAABwAHAABADcAUAACAJUAqwAcAK0AswAzANYA1gA6ANkA2QA7ANsA2wA8AOAA4AA9AOIA4gA+AOQA5AA/AOYA5wBAAOkA6QBC","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
