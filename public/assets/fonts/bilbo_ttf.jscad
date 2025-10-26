(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bilbo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AG8AbgAgADEALgAwADAAMgBCAGkAbABiAG8ALQBSAGUAZwB1AGwAYQByAEIAaQBsAGIAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFIAbwBiAGUAcgB0ACAARQAuACAATABlAHUAcwBjAGgAawBlAC4AVAB5AHAAZQBTAEUAVABpAHQALAAgAEwATABDAFIAbwBiAGUAcgB0ACAARQAuACAATABlAHUAcwBjAGgAawBlAHcAdwB3AC4AdAB5AHAAZQBzAGUAdABpAHQALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAABAAIBAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBAwCKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA2wDcAN0A4ADZAN8AmwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQQAjACfAJgAqACaAJkApQCSAJwApwCPAJQAlQC5ANIAwADBAkNSB3VuaTAwQUQERXVybwAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA9wABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABAHAABAAAADMAkgCgANIA5AD6AQgBPgG4Ah4CnAMGA3QDzgQQBB4EOATGBTwFTgWgBiIGNAaiBxQHGgeYB7IHzAfmCAwILghsCIoIrAjOCPAJFglECVYJbAmGCZgJsgnQCeoKDAoWCiAKLgpACkYAAgAFAAQABAAAACUANAABADYAPQARAEUAXQAZAGkAaQAyAAMAKgAoAC0AFwAzACgADAAn/9gAKP/YACv/4AAs/+AALf/hADD/4AAy/9EAM//oADf/8AA4/6kAPP/wAD0AEAAEACX/uQAn/+gAM//YADT/yAAFACX/0AAo/9gAKf/gAC//2QAz/+AAAwAl/6EAKf/YADP/uAANACX/yQAq/9gANP/YAE//6ABT//AAVP/xAFX/4QBW/+kAV//wAFj/yABa/8EAW//AAF3/qQAeACX/aQAp/+EAK//QADP/uABF/4EARv9xAEf/iQBI/3EASf9xAEr/kABL/2kATP95AE3/eQBO/3kAT/+JAFD/iQBR/3EAUv9ZAFP/eQBU/3kAVf9xAFb/gQBX/4kAWP+pAFn/aQBa/5EAW/+wAFz/qQBd/7EAXv+ZABkAJf/AACz/2ABF/9AARv/QAEf/yQBI/8EASf/ZAEr/4QBL/9kATP/IAE3/2QBO/8AAT//YAFD/0QBR/9AAUv/QAFP/0ABU/8EAVf/AAFb/2ABY/8EAWf+5AFr/wQBc/+gAXv/YAB8AJf9yACn/0QAs/+EALf+xADP/wQBF/6EARv+pAEf/uQBI/5kASf+pAEr/mQBL/2EATP+hAE3/oQBO/5kAT/+pAFD/wQBR/6EAUv+hAFP/iQBU/6EAVf+RAFb/qQBX/7AAWP+ZAFn/oABa/4EAW/+hAFz/uABd/6kAXv+xABoAJf/IACf/0QAs/+EAMv/RADP/4AA3/+EARf/ZAEb/2QBH/9AASP/ZAEn/0QBL/9AATf/YAE7/2QBR/+AAUv/YAFP/2QBU/+AAVf/ZAFb/4QBX/8EAWP+wAFn/0QBa/7EAW/+5AF3/yAAbACX/aQA5/9kARf+BAEb/kQBH/3EASP9xAEn/eQBK/4kAS/9ZAEz/cgBN/3kATv+JAFD/oQBR/2EAUv9xAFP/cQBU/2EAVf9hAFb/SQBX/4kAWP9xAFn/cQBa/2IAW/+JAFz/eQBd/3kAXv+JABYAMP/JAEX/6ABI/+AASf/oAEr/2ABL/9EATP/wAE7/yABP/+gAUP/YAFH/2ABS/9gAU//hAFT/4ABV/+AAVv/gAFf/2ABY/8gAWf/oAFr/0QBb/9EAXf/IABAAJf/BACj/wAAt/8AARf/pAEn/4QBK/9gAS//hAE7/2QBR//AAUv/gAFf/6ABY/9AAWf/oAFr/oQBb/7gAXf+5AAMAJf+4ADH/4ABR/+AABgAl/7gAJ//RAC3/yQAz/+gAN//YAFL/yQAjACX/uQAr/9AAMP/AADH/yQAy/8EAM//gADf/yAA6/+kAPP+4AEX/0ABG/8gAR//YAEj/yABJ/8gASv/ZAEv/0QBM/8AATf/IAE7/sQBP/8gAUP/ZAFH/yABS/9EAU//QAFT/wQBV/8EAVv/IAFf/2ABY/8kAWf+hAFr/uQBb/+AAXP/JAF3/0ABe/9AAHQAl/3EAN//hADj/2ABF/4kARv+BAEf/iQBI/4EASf9pAEr/sQBL/2IATP+RAE3/iQBO/4EAT/+RAFD/iQBR/4EAUv9xAFP/iQBU/4kAVf9pAFb/qQBX/6AAWP+pAFn/mQBa/6EAW//IAFz/qQBd/7kAXv+RAAQAJf/hADP/2AA3/+gAU//wABQAJf/JADj/6QBF/9gARv/IAEf/4QBI/9EASf/hAEr/yQBL/8kATP/AAE3/0ABP/8gAUP/BAFH/uABS/8AAU//IAFT/uQBV/8AAVv/RAFf/2QAgACX/IgAs/7EALf+JADP/cQA4/+gAOf/RAEX/QgBG/3kAR/8yAEj/KQBJ/1kASv9hAEv/GgBM/2EATf9pAE7/cgBP/5kAUP+JAFH/OgBS/0EAU/9CAFT/YgBV/yIAVv9pAFf/QgBY/0kAWf9BAFr/GgBb/1EAXP9hAF3/QQBe/1oABAAl/7EALf/QADr/6ABZ/8EAGwAl/4kAO//YAEX/oQBG/7EAR/+gAEj/sQBJ/7EAS/+pAEz/yQBN/6kATv+gAE//wQBQ/6gAUf+hAFL/qQBT/7EAVP+4AFX/qQBW/8gAV//RAFj/yABZ/7EAWv+pAFv/2ABc/7AAXf/AAF7/kQAcACX/aQAy/6kAPP+hAEX/iQBG/4kAR/+BAEj/cQBJ/5EASv+pAEv/agBN/6EATv9pAE//iQBQ/6EAUf9xAFL/iQBT/6EAVP+JAFX/aQBW/4kAV/+ZAFj/kQBZ/3EAWv95AFv/qQBc/4kAXf+hAF7/eQABACX/0AAfACX/aQAq/+gAN/+iADgAGAA+/7AARf9KAEb/iQBH/1IASP9RAEn/SgBK/4EAS/85AEz/kQBN/2kATv9xAE//gQBQ/5EAUf9hAFL/cQBT/0kAVP+BAFX/UQBW/3EAV/95AFj/mQBZ/1kAWv86AFv/gQBc/4kAXf95AF7/aQAGADMAGAA4ACAAOgAoADsAIAA9ACAAVP/0AAYAKgAYADMAQAA4ACAAOgA4ADsAOAA9AJ8ABgAqACAAMwAwADgAGAA6AEcAOwAoAD0ARwAJACkAPwAqAEAALAAgADMAMAA0ADcAOACHADoAYAA7AG8APQCXAAgAKgAoACwAGAAvABgAMwAvADoANwA7ABgAPQAwAFD/4wAPACkAhwAqAI4AKwBoACwAbwAtAHcALgBAAC8AZwAwAF8AMwCWADQAjwA3AF8AOADPADoAhwA7AMYAPQDmAAcAKwAgACwAKAAt/+AAMwA3ADQAGAA6ABAAPQAoAAgAKwAQACwAcAAzADgANAAYADgARwA6AD8APQA/AEX/9AAIACsAVwAzAGAANAAwADcAPwA4AG8AOgBPADsAVwA9AG8ACAAqAB8AKwAgACwAQAAvACcAMwA4ADoAPwA7ACcAPQBQAAkAKwBvACwATwAwACAAMwBnADQALwA4AC8AOgBQADsAQAA9AH8ACwApAEgAKgBYACsAKAAxAEAAMwA/ADQAQAA4AIcAOgAwADsAUAA9AHcAXf/rAAQAKwBPADMANwA6ADAAPQBIAAUAKwBfADMAKAA6ACgAOwBQAD0ALwAGACsAPwAzAEAANAAgADoAIAA7AC8APQA3AAQAKwAQADMABwA7ACAASQAIAAYAKwBQADMAJwA0ADgAOgBQADsAQAA9AE8ABwArAD8ALwAwADMAIAA3ADcAOgAvADsALwA9ACAABgArADcALwA3ADgAHwA6ACAAOwAoAD0AIAAIACsAXwAvAD8AMwBYADQARwA5AE8AOgBfADsASAA9AFgAAgA6ACgAPQAoAAIAOwAwAD0AMAADADsAKAA8ACAAPQAoAAQAKwAoADsASAA9ADAAXQAgAAEAPQBIAAEARf/YAAAAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
