(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.trykker_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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BKwATgVWAHACAACFAjIAdwKqAHIDVgBkBKgAbAf/AHIH/wByB/8AiQP/AIQF/wAYBf8AGAX/ABgF/wAYBf8AGAX/ABgIBABGBgEATgVRAFcFUQBXBVEAVwVRAFcCqwBfAqsAXwKr//ACqwAdBfwACAapAFkGqQB+BqkAfgapAH4GqQB+BqkAfgSqAP0GqQB+BfwAMgX8ADIF/AAyBfwAMgSs/8UErAA6BKwATAQBAE8EAQBPBAEATwQBAE8EAQBPBAEATwanAH0EAABmBAEAUAQBAFAEAQBQBAEAUAKqACoCqgB6Aqr/9wKqABwErABOBVUAegSrAFgEqwBYBKsAWASrAFgEqwBYBKoAoQSrAFgErABVBKwAVQSsAFUErABVBKoAPgSqAAEEqgA+Bf8AGAQBAE8F/wAYBAEATwX/ABgEAQBPBgEATgQAAGYGAQBOBAAAZgYBAE4EAABmBgEATgQAAGYF/AAmBVYAaQX8AAoEqwBpBVEAVwQBAFAFUQBXBAEAUAVRAFcEAQBQBVEAVwQBAFAFUQBXBAEAUAX8AE4EqgB2BfwATgSqAHYF/ABOBKoAdgX8AE4EqgB2Bf8AMAVV/+YGpwBNBS4AXAKr/+oCqv/9AqsAXwC2ADACqwAuALYAQAKrAF8CqgB6AqsAXwKqAHoFVgBfBVYAegKr/9kCrP/+BVYAUASsAFgErABtBKoATgKsAGEEqgBOAqwAYQSqAE4DVgBhBKoATgQKAGEEqv/bAqwAYQapAFkFVQB6BqkAWQVVAHoGqQBZBVUAegapAFkFVQB6BqkAfgSrAFgGqQB+BKsAWAapAH4EqwBYCAUATgf7AIYFVgBOA1UAXAVWAE4DVQBcBVYATgNVAFwErACGA1YAVwSsAIYDVgA3BKwAhgNWAFcErACGA1YAVwVSAFEDVQBFBVIAUQNVAEUFUgBRA1UARQX8ADIErABVBfwAMgSsAFUF/AAyBKwAVQX8ADIErABVBfwAMgSsAFUF+wAyBKwAVQim/9UF/P/kBKz/xQSqAD4ErP/FBU8ASAQAAGEFTwBIBAAAYQVPAEgEAABhBLD/4ggEAEYGpwB9BKwAhgNWAFcCrABTA1wAUgNcAGEC6ABOAYwATwJKAEMCPQBMA28ATANSAEwHVQDKB/8AsQYBAHoFVgBmBKoAAQX8ACYEqwBpBVEAawKrADUH/gBvB/wAlQSsADoErAAsBKwAhgNWAFcFUgBRA1UARQim/9UF/P/kCKb/1QX8/+QIpv/VBfz/5ASs/8UEqgA+BKwAoganAJ4CAAB4AgAAegIAAHoDVgB0A1YAdQNWAHUEsACzBLAAswIAAD8GAACFCVQASAKqAEICqgBYBLAATwVWAEIHVQBvBKwAZAX9ABgF/QC8BCQAXgamAMgG6gBzBAD/8QSqAIMEqgChBKkAjwSpAI4HXAFQBVYANQVVADUFVwA1AikA2wAw/+4ALwBMAEz/r//c/8UAPf+pAJkAAAABAAAH5v3mAAAJVP+p/zwJOgABAAAAAAAAAAAAAAAAAAABnAADBK0BkAAFAAAFmgUzAAABHwWaBTMAAAPRAF4CAAAAAgMFAgcIAAMDA6AAAK9AACBKAAAAAAAAAABTVEMgAEAAAfsCB+b95gAAB+YCGiAAAJMAAAAAA/UF1AAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQBkAAAAGAAQAAFACAACQAZAH4BSAF+AZIB/QIZAjcCxwLdA5QDqQO8A8AeAx4LHh8eQR5XHmEeax6FHvMgFCAaIB4gIiAmIDAgOiBEIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvsC//8AAAABABAAIACgAUoBkgH8AhgCNwLGAtgDlAOpA7wDwB4CHgoeHh5AHlYeYB5qHoAe8iATIBggHCAgICYgMCA5IEQgrCEiISYiAiIGIg8iESIaIh4iKyJIImAiZCXK+wD//wAC//z/9v/V/9T/wf9Y/z7/If6T/oP9zf25/M79o+Ni41zjSuMq4xbjDuMG4vLihuFn4WThY+Fi4V/hVuFO4UXg3uBp4Dzfit9b337ffd9233PfZ99L3zTfMdvNBpgAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBAAAAAAAEADGAAMAAQQJAAAAtAAAAAMAAQQJAAEADgC0AAMAAQQJAAIADgDCAAMAAQQJAAMARgDQAAMAAQQJAAQAHgEWAAMAAQQJAAUAGgE0AAMAAQQJAAYAHgFOAAMAAQQJAAcAUgFsAAMAAQQJAAgAGgG+AAMAAQQJAAkAGgG+AAMAAQQJAAoBigHYAAMAAQQJAAsAJANiAAMAAQQJAAwAIgOGAAMAAQQJAA0AmAOoAAMAAQQJAA4ANARAAAMAAQQJABIADgC0AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABTAG8AcgBrAGkAbgAgAFQAeQBwAGUAIABDAG8AIAAoAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtACkAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAFQAcgB5AGsAawBlAHIAIgAuAFQAcgB5AGsAawBlAHIAUgBlAGcAdQBsAGEAcgBNAGEAZwBuAHUAcwBHAGEAYQByAGQAZQA6ACAAVAByAHkAawBrAGUAcgAgAFIAZQBnAHUAbABhAHIAOgAgADIAMAAxADEAVAByAHkAawBrAGUAcgAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMQBUAHIAeQBrAGsAZQByAC0AUgBlAGcAdQBsAGEAcgBUAHIAeQBrAGsAZQByACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4ATQBhAGcAbgB1AHMAIABHAGEAYQByAGQAZQBUAHIAeQBrAGsAZQByACAAaQBzACAAYQAgAGgAaQBnAGgAIABjAG8AbgB0AHIAYQBzAHQAIABzAGUAcgBpAGYAZQBkACAAdABlAHgAdAAgAGYAYQBjAGUALgAgAFQAcgB5AGsAawBlAHIAIABoAGEAcwAgAGEAIABwAGwAZQBhAHMAYQBuAHQAIABvAGwAZAAgAGYAYQBzAGgAaQBvAG4AZQBkACAAZQBsAGUAZwBhAG4AYwBlACAAZABlAHIAaQB2AGUAZAAgAGYAcgBvAG0AIABvAG4AIAAxADYAdABoACAAYwBlAG4AdAB1AHIAeQAgAHQAZQB4AHQAIABmAGEAYwBlAHMALgAgAFQAcgB5AGsAawBlAHIAIABjAGEAbgAgAGIAZQAgAHUAcwBlAGQAIABmAHIAbwBtACAAcwBtAGEAbABsACAAcwBpAHoAZQBzACAAdABvACAAbABhAHIAZwBlAHIAIABkAGkAcwBwAGwAYQB5ACAAcwBlAHQAdABpAG4AZwBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgBzAGsAcgBpAGYAdABrAGwAbwBnAC4AZABrAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP9TAF4AAAAAAAAAAAAAAAAAAAAAAAAAAAGnAAAAAQACAQIBAwEEAQUBBgEHAQgBCQEKAQsBDAENAQ4BDwEQAREBEgETARQAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKwAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBFQCKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ARYBFwEYARkBGgEbAP0A/gEcAR0BHgEfAP8BAAEgASEBIgEBASMBJAElASYBJwEoASkBKgErASwBLQEuAPgA+QEvATABMQEyATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+APoA1wE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQDiAOMBTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgFbALAAsQFcAV0BXgFfAWABYQFiAWMBZAFlAPsA/ADkAOUBZgFnAWgBaQFqAWsBbAFtAW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewC7AXwBfQF+AX8A5gDnAKYBgAGBAYIBgwGEANgA4QDbANwA3QDgANkA3wCoAJ8AmwGFAYYBhwGIAYkBigGLAYwBjQGOAY8BkAGRAZIBkwGUAZUBlgGXAZgBmQGaALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBmwCMAJgAmgCZAO8ApQCSAJwApwCPAJQAlQC5AZwAwADBAZ0BngGfAaABoQGiAaMBpAGlAaYBpwGoB3VuaTAwMDEHdW5pMDAwMgd1bmkwMDAzB3VuaTAwMDQHdW5pMDAwNQd1bmkwMDA2B3VuaTAwMDcHdW5pMDAwOAd1bmkwMDA5B3VuaTAwMTAHdW5pMDAxMQd1bmkwMDEyB3VuaTAwMTMHdW5pMDAxNAd1bmkwMDE1B3VuaTAwMTYHdW5pMDAxNwd1bmkwMDE4B3VuaTAwMTkHdW5pMDBBRAdBbWFjcm9uB2FtYWNyb24GQWJyZXZlBmFicmV2ZQdBb2dvbmVrB2FvZ29uZWsLQ2NpcmN1bWZsZXgLY2NpcmN1bWZsZXgKQ2RvdGFjY2VudApjZG90YWNjZW50BkRjYXJvbgZkY2Fyb24GRGNyb2F0B0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQMR2NvbW1hYWNjZW50DGdjb21tYWFjY2VudAtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdJbWFjcm9uB2ltYWNyb24GSWJyZXZlBmlicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMS2NvbW1hYWNjZW50DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMGTGFjdXRlBmxhY3V0ZQxMY29tbWFhY2NlbnQMbGNvbW1hYWNjZW50BkxjYXJvbgZsY2Fyb24ETGRvdARsZG90Bk5hY3V0ZQZuYWN1dGUMTmNvbW1hYWNjZW50DG5jb21tYWFjY2VudAZOY2Fyb24GbmNhcm9uA0VuZwNlbmcHT21hY3JvbgdvbWFjcm9uBk9icmV2ZQZvYnJldmUNT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uBlNhY3V0ZQZzYWN1dGULU2NpcmN1bWZsZXgLc2NpcmN1bWZsZXgMVGNvbW1hYWNjZW50DHRjb21tYWFjY2VudAZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHQUVhY3V0ZQdhZWFjdXRlDFNjb21tYWFjY2VudAxzY29tbWFhY2NlbnQIZG90bGVzc2oHdW5pMUUwMgd1bmkxRTAzB3VuaTFFMEEHdW5pMUUwQgd1bmkxRTFFB3VuaTFFMUYHdW5pMUU0MAd1bmkxRTQxB3VuaTFFNTYHdW5pMUU1Nwd1bmkxRTYwB3VuaTFFNjEHdW5pMUU2QQd1bmkxRTZCBldncmF2ZQZ3Z3JhdmUGV2FjdXRlBndhY3V0ZQlXZGllcmVzaXMJd2RpZXJlc2lzBllncmF2ZQZ5Z3JhdmUERXVybwJmZgtjb21tYWFjY2VudBBodW5nYXJ1bWxhdXQuY2FwCWJyZXZlLmNhcAptYWNyb24uY2FwCWdyYXZlLmNhcAlhY3V0ZS5jYXAOY2lyY3VtZmxleC5jYXAMZGllcmVzaXMuY2FwCWNhcm9uLmNhcAhyaW5nLmNhcAl0aWxkZS5jYXANZG90YWNjZW50LmNhcAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEBmgABAAAAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAIACgBKAAEAHAAEAAAACQAyAJ4AMgAyADIAMgAyADIAMgABAAkANwBNAJUAlgCXAJgAmQCaANkAAwBK/wkATP6TAE3+kwABABAABAAAAAMAGgA8AF4AAQADAEoATABNAAgAN/8dAJX/HQCW/x0Al/8dAJj/HQCZ/x0Amv8dANn/HQAIADf+kwCV/pMAlv6TAJf+kwCY/pMAmf6TAJr+kwDZ/pMACQA3/pMAlf6TAJb+kwCX/pMAmP6TAJn+kwCa/pMAm/5RANn+kwAAAAEAAAAKABYAGAABbGF0bgAIAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
