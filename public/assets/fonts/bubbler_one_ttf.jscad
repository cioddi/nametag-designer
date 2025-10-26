(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bubbler_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AA4ANAN6AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACAAYgB5ACAAQgByAGUAbgBkAGEAIABHAGEAbABsAG8AIAAoAGcAYgByAGUAbgBkAGEAMQA5ADgANwBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIAQgB1AGIAYgBsAGUAcgAiAEIAdQBiAGIAbABlAHIAIABPAG4AZQBSAGUAZwB1AGwAYQByADEALgAwADAAMgA7AFUASwBXAE4AOwBCAHUAYgBiAGwAZQByAE8AbgBlAC0AUgBlAGcAdQBsAGEAcgBCAHUAYgBiAGwAZQByACAATwBuAGUAIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAQgB1AGIAYgBsAGUAcgBPAG4AZQAtAFIAZQBnAHUAbABhAHIAQgB1AGIAYgBsAGUAcgAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEIAcgBlAG4AZABhACAARwBhAGwAbABvACAAKABnAGIAcgBlAG4AZABhADEAOQA4ADcAQABnAG0AYQBpAGwALgBjAG8AbQApAC4AQgByAGUAbgBkAGEAIABHAGEAbABsAG8AQgByAGUAbgBkAGEAIABHAGEAbABsAG8AIAAoAGcAYgByAGUAbgBkAGEAMQA5ADgANwBAAGcAbQBhAGkAbAAuAGMAbwBtACkAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0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ABv/8wAi/98AN/+ZADn/rwA6/7cAP/+zAED/7QBX/7EAWf+hAFr/rABg/+4Ab/+zAHf/swCY/+oAzP++AM3/vwDP/7cA0P+3ANr/sAAKAAn/7QAM//EAEv+5ABf/5QAt/50AN//uADv/9gBA//QAYP/0AK4ACgAFAAn/9wAX//UAN//lAED/8wBg//MAEgAJ/9cADf/rABL/xQAT/+sAF//cABn/8AAb//MAI//dAC3/tQBJ/+0AV//iAFn/zABa/9AAW//CAIb/4QCf//gArAAsAK3/1AAIAAn/5wAS/8YAF//pACP/7wAt/8EAhv/yAKwAFwCt//UABwAJ//IAEv/QABf/8gAt/8gAhv/5AKwAGQCt//oABgAJ//cAV//sAFn/5QBa/+cAb//2AKwAEQACABP/9QCsABYADwAL/90AE//lABf/zgAZ/+oAG//sABz/9AAt/9MASf/wAFf/5wBZ/+AAWv/fAFv/7ABe/+4Ahv/oAKwAIQAVAAX/oAAK/78AE//ZABT/0QAW//IAF//nABj/6gAZ/+EAGv/tABv/5AAc/+oAN//HADn/yAA6/9MASf/vAE//8wBX/9QAWf/MAFr/0QCG//UAzf+/AAMAFP/wADf/vwA5//oAAgAS//AASf/8AAUAFP/nABr/8QA3/7kAOf/rADr/9QAFAAn/8wAMADMAEv/VABf/8gAt/+kAAQBNAGoABQAM//MAN//XAD//6wBA/+gAYP/pAAMAEv/wAEn//AB3/+EACgAU/+IAFf/wABr/5AA2//MAN//XADn/5wA6//EAO//gADz/+QA9//gADwAJ/+AADP/SABL/uwAU//MAFf/kABb/4QAX/+MAGv/dAC3/oAA3/7oAO//RAD3/wwA//+YAQP/WAGD/1wAFABT/8QAa/+0AN/++ADn/+QA7//UADgAJ//EADP/mABL/0QAV//AAFv/wABf/7QAa/+0ALf/cADf/4gA7//UAPf/iAD//8wBA/+cAYP/oAA4ACf/3AAz/2wAS/8sAFf/tABb/7AAX//QAGv/nAC3/zgA3/80AO//nAD3/4AA//+4AQP/gAGD/3wANAAn/+gAM/9sAEv/QABX/7AAW/+4AGv/mAC3/4gA3/9IAO//oAD3/5QA//+4AQP/fAGD/3wAGAAn/+gAM/+wAN//IAD//8QBA/+UAYP/nAAcAFP/rABr/6gA3/8AAOP/5ADn/6wA6//QAO//6AAMAF//2ABr/9AA3/74ADwAL/94AE//mABf/1gAZ/+sAG//tABz/9AAt/9gASf/wAFf/6ABZ/98AWv/fAFv/7QBe/+4Ahv/pAKwAIQABAE0AgQADAAz/6wBA/+4AYP/uAAIAE//0ABT/7wABAC3/vAABABf/zwAGABT/2wAV/80AFv/bABr/1AAc//AAT//hAAYAN//mADn/6AA6//AAV//tAFn/6wBa/+8AAwAPAAgAzgATANEAEwACAAz/9QA3/+kACgAM/9oAEv/MACL/9AAt/8gAN//QADn/9wA7/8gAP//lAED/3ABg/94ADwAM/+YAEv/fACL/7wA//+sAQP/nAEn/9gBP//sAVv/3AFf/6ABY//wAWf/pAFr/8ABb/9oAXf/vAGD/5wABAE0AoQALAAUADgAKAA4ADAAmAD8AHQBAACQAYAAlAMwACgDNAA4AzwAKANAADgDaAAcAAgANAAcAIgAHAAwADP/dABL/3wAi/+gAP//hAED/2wBJ//oAV//3AFn/+QBa//sAW//tAF3/9QBg/90AAQAF/64AAQCsAAYABAAJ//MAEv+/ACP/3wCsAAoAAQAF/6oAAwAP/6AAEf+lAKwABgADAA//oAAR/6UArAAKAAEABf90AAEALf/BAAIaJgAEAAAalhxEAD8ANQAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//b/9v/4//X/9v+//9//v/+//8X/8f/F//P/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/vwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9P/h/+r/9v/t//P/3v/2/97/6//z/+D/vv+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//b/9v/4//b/9v+/AAD/vgAAAAAAAAAAAAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/2//b/+P/1//b/vwAA/7//v//F//EAAAAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0f/R/9//0P/RAAAAAAAAAAAAAAAAAAAAAP/SAAAAAAAA/+L/8//wAAAAAAAAAAAAAAAAAAAAAP/e/+D/6P/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+/AAAAAP/2AAAAAP/RAAAAAAAAAAAAAAAAAAAAAP/t//P/9wAAAAAAAP/ZAAD/6v/zAAAAAAAA/78AAAAA/9gAAP/p//f/0//W/+7/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8v/0//QAAP/2//QAAAAAAAAAAAAAAAAAAAAA//QAAAAAAAAAAAAAAAD/3wAAAAAAAAAAAAAAAP/yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+8AAAAAAAAAAAAA/9wAAP/s//UAAAAAAAD/xQAAAAD/7wAAAAAAAP/r/+r/8v/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/93/3QAA/+T/3QAAAAAAAAAAAAAAAAAAAAD/3QAAAAAAAP/X/9T/2gAA/90AAAAAAAAAAAAAAAD/8//eAAD/9QAAAAD/9QAA/+IAAP/z//P/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/3AAAAAAAA//cAAP/5//kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/3P/bAAD/6//cAAAAAAAA/9H/7wAAAAD/8P/cAAAAAAAA/+3/9//0AAAAAAAAAAAAAAAAAAAAAAAA//EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5AAD/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/ZAAD/9P/7AAAAAAAAAAAAAAAAAAAAAP/0AAAAAP/hAAD/7QAAAAAAAP/T/9//4v/r/+MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7gAAAAAAAP/zAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+gAAAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+wAAAAAAAP/A/+v/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6AAD/3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0P/QAAD/8P/QAAAAAAAA/7X/5gAAAAAAAP/QAAAAAAAA/6n/uP/PAAD/2QAAAAAAAAAAAAAAAAAA/90AAAAAAAAAAP/UAAD/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/iAAD/9gAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAP/pAAD/8wAAAAAAAP/Y/+b/6f/x/+r/9f/xAAAAAAAAAAAAAP/4//gAAP/2//gAAAAA/7z/5P/uAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAP/0AAAAAAAA/+T/7P/yAAAAAAAA//AAAAAAAAAAAAAAAAAAAAAAAAD/9gAA/9//+v/3//IAAAAAAAAAAAAA/+IAAAAA//EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//L/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4//gAAP/6//gAAAAAAAD/7v/xAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/1f/V/7n/1//VAAAAAP/e/9n/2//fAAAAAP/VAAAAAAAA/8j/4v/eAAAAAAAAAAAAAAAAAAAAAP/A/8D/vP/hAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+gAAAAAAAAAAAAAAAAAAAAD/+wAAAAAAAP/aAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/m/+b/9f/n/+YAAAAA/9//6v/sAAAAAAAA/+YAAAAAAAD/8//4//UAAAAAAAAAAAAAAAAAAAAA/+v/8P/7//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8v/yAAD/8f/yAAAAAP/r//P/9QAAAAAAAP/yAAAAAAAA//kAAAAAAAAAAAAAAAAAAAAAAAAAAP/0//cAAP/5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//j/+AAAAAD/+AAAAAAAAP/hAAAAAAAAAAD/+AAAAAAAAP/u/+L/6AAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAD/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//oAAP/7AAAAAAAAAAAAAAAA//sAAAAAAAD/2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4//jAAD/8f/jAAAAAAAA/9X/6wAAAAD/+P/j//X/7f/t/+H/7f/uAAAAAAAAAAAAAAAAAAAAAAAA/+YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/vAAAAAAAAAAAAAAAAAAD/0wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/w/+8AAAAAAAAAAAAAAAAAAAAAAAD/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sAAP/3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//P/8AAD//P/8AAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAA//sAAAAA/8H/+f/r//QAAP/rAAAAAAAAAAAAAAAAAAD//AAA//oAAAAAAAAAAAAA/+//4v/Y/9z/2QAA/+oAAP/vAAAAAP/2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5//wAAAAAAAAAAAAAAAAAAAAAAAAAAP/2//YAAAAAAAAAAP/3//wAAAAAAAAAAAAAAAAAAAAA/+v/4f/T/+IAAAAAAAD/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9QAAAAAAAAAAAAAAAAAAAAD/5//d/9f/4//aAAAAAAAA//YAAAAAAAD//P/8AAD//P/8AAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAA//AAAAAAAAAAAAAAAAAAAAAAAAAAAP/2AAAAAAAAAAAAAAAAAAAAAAAAAAD/9gAAAAAAAP/z//j/+gAAAAAAAAAAAAAAAAAAAAAAAP/2//b//AAA//UAAP/s//oAAAAAAAAAAP/8//wAAP/f/9L/zf/P/9EAAAAAAAD/4v/8AAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6//u//P/+P/7AAD/wP/3/9z/6AAA/9//9f/0AAD/+gAAAAAAAP/6//gAAP/zAAD//AAA//r/8f/j/9r/y//aAAD/7AAA/9///AAA//QAAAAAAAAAAAAAAAAAAAAAAAAAAP/0AAAAAAAA//T/+f/7AAAAAAAA/9YAAP/m//IAAP/h//T/9P/8AAD/8AAA/+z/+f/w/97/+f/z//z//AAA/9r/0P/N/9D/0P/r/+EAAP/h//wAAAAA//v/+wAA//n/+wAAAAD/xf/O/+4AAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/5//kAAP/5//kAAAAAAAD/6QAAAAAAAP/0//kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1/+r/3//rAAAAAAAA//IAAAAAAAD/9P/0AAD/8v/0AAAAAP/0/+z/7wAAAAAAAP/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//r/+gAA//j/+gAAAAD/5P/0AAAAAAAAAAD/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8//wAAP/6//sAAAAA/+v/+AAAAAAAAAAA//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7P/r//v/8P/rAAAAAAAA/+EAAAAAAAAAAP/sAAAAAAAAAAD/9P/yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//z//AAA//z//AAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/z//MAAP/y//MAAAAA//T/6//zAAAAAAAA//MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//P/8AAD//P/8AAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAAAAAAAAAA/94AAAAAAAAAAP/vAAAAAAAA//P/8wAA//b/8wAAAAAAAP/e/+8AAAAA//j/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//H/5v/q/+cAAAAAAAAAAAAAAAAAAP/2//b//P/5//YAAAAAAAD/9gAAAAAAAAAA//YAAAAAAAAAAP/5//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/8AAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAP/7//sAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAP/8//wAAP/8//wAAAAAAAAAAAAAAAAAAAAA//wAAAAAAAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/P/8//6v/S/88AAAAAAAAAAAAAAAAAAAAA/88AAAAAAAD/0//m/+QAAAAAAAAAAAAAAAAAAAAA/+L/1P/y/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/zf/N/+D/zf/NAAAAAAAAAAAAAAAAAAAAAP/NAAAAAAAA/9T/6v/oAAAAAAAAAAAAAAAAAAAAAP/Y/9P/6f/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/zAAAAAAAAAAAAAD/5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Q/9D/4P/R/9AAAAAAAAAAAAAAAAAAAAAA/9AAAAAAAAD/1v/q/+gAAAAAAAAAAAAAAAAAAAAA/9n/1f/p/+kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABIABQAFAAAACQALAAEADQANAAQADwATAAUAFQAVAAoAGgAaAAsAHQAeAAwAIwApAA4AKwA/ABUARABeACoAbABsAEUAbgBvAEYAewB7AEgAgACWAEkAmAC2AGAAuADGAH8AygDRAI4A1wDYAJYAAQAFANQAAQAAAAAAAAAjAAEAOwAAAAwAAAACAAcAAgAGADkAAAA6AAAAAAAAAAAAPQAAAAAAAwADAAAAAAAAAAAAAAANAA4ADwAQABEAEgAAABMAEwAUABkAFQATABMAFgAXABYAGgAYABsAHAAdAB4AHwAgACEAPAAKAAAAAAAAAAAAJAAqACwAOAAlADIAJAApACcAJwA1ADEAKQApACgAKgAkACsAJgAtACQALgAvADAAMwA0AD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAABwALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAAAAAAAAAAAADQANAA0ADQANAA0AEQAPABEAEQARABEAEwATABMAEwAQABMAFgAWABYAFgAWAAAAFgAcABwAHAAcACAAIgA3ACQAJAAkACQAJAAkACUALAAlACUAJQAlACcAJwAnACcANgApACgAKAAoACgAKAAAACgAJAAkACQAJAAzACoAMwARACUAGAAmACAAIQA0AAAAAAAAAAcABwAEAAUAAgAEAAUAAgAAAAAAAAAAAAAACAAJAAEABQDUAAEAAAAAAAAADgABAAAALAAAAAAACQAKAAkAKwAaABsAMAAAAA0AAAAAADEAAAAAADIAMgAAAAAAAAAzAAgAIQAqABQAKgAqACoAFAAqACoABwAqACoAKgAqABUAKgAVACoAJAAWABcAGAAZACUAJgAnAAAALgAtAAAAAAAAAAIAKAAGAA8AAwAjAA8AKAApACkAKAA0AB4AHgAFAB4ADwAeAAQAEAAfABEAEgAiABMAIAAAAAAALwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAACEAIQAhACEAIQAhAAAAFAAqACoAKgAqACoAKgAqACoAKgAqABUAFQAVABUAFQAAABUAFwAXABcAFwAmACoAKAACAAIAAgACAAIAAgACAAYAAwADAAMAAwApACkAKQApAAUAHgAFAAUABQAFAAUAAAAFAB8AHwAfAB8AEwAoABMAFQAFACQABAAmACcAIAAAAAAAAAAKAAoAHAAdAAkAHAAdAAkAAAAAAAAACQAAAAsADAABAAAACgAWABgAAWxhdG4ACAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
