(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.diplomata_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEALAAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkAIAAoAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBEAGkAcABsAG8AbQBhAHQAYQAiAEQAaQBwAGwAbwBtAGEAdABhAFIAZQBnAHUAbABhAHIARQBkAHUAYQByAGQAbwBSAG8AZAByAGkAZwB1AGUAegBUAHUAbgBuAGkAOgAgAEQAaQBwAGwAbwBtAGEAdABhADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEARABpAHAAbABvAG0AYQB0AGEALQBSAGUAZwB1AGwAYQByAEQAaQBwAGwAbwBtAGEAdABhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAARQBkAHUAYQByAGQAbwAgAFIAbwBkAHIAaQBnAHUAZQB6ACAAVAB1AG4AbgBpAC4ARQBkAHUAYQByAGQAbwAgAFIAbwBkAHIAaQBnAHUAZQB6ACAAVAB1AG4AbgBpAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAD1AAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXAOIA4wCwALEA5ADlALsA5gDnAKYA2ADhANsA3ADdAOAA2QDfAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAECAIwAnwCYAKgAmgCZAO8ApQCSAJwApwCPAJQAlQC5AMAAwQRFdXJvAAAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMA9AABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABACgABAAAAA8ASgBQAFYAXABmAHgAhgCMAJYApACqALwAyADCAMgAAQAPAAUAEwAUABoAJAApAC4ALwAzADgAOQA7AEQASgBRAAEAJP90AAEAEwBGAAEAE//YAAIAF/9MABj/kgAEAAX/OAA4/7oAOf9WAFn/agADACT/tQBE/6YAhf+mAAEARv/EAAIAJgAoAEYAKAADACT/ugBE/7AAhf+6AAEAJP/EAAQAD/90ACT/nABG/8QAhf+cAAEARv+wAAEABQCMAAEAWf/OAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
