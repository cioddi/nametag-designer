(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.snippet_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ykYMS/+8/vsD3AN6AAAACAACAAAAAAAAASwAAAAAAAABLAAAASwAAAEOAHgBGgAyAdAAKAItACgC7gBkAl4APACsADIBfwAyAZ0AUAGfADwB2AAyAPkAPAHxAGQBOQBkAYgAMgKqAEYBhAAKAesAGQHzACMCSgBGAgIADwJNAEYBzgAUAkEAQQJNAEYBOQB4ATkAZwGHAB4B2AA8AYcAPAGuADIC9wBaAnsACgJqAAoChAA8AwEABQJRAF8CKQBfArEAPAKpAF8A+wBfAcEAIwJiAF8B9wBfAy4AXwL8AF8DGwA8Ai4ABQMbADwCTwAFAhQAIwI5AA8CywBaApMAIwPMACgCSgAyAhQAIwIdACgBSAAyAYgAMgFIACgCCABLAbgAAAIIAKMB7AAoAikAVQGzADwCLgAyAggAPAGJAFUCTgAZAh4AVQDsADcA7gA5Ag8AVQD1AFUDMQAyAiMAMgJVADICLgAyAi4ANwFsADIBoQAjAY4ANwIYADcCBAAjAv4ALQHVAC0CBAAjAcsAHgFdAB4BhwClAV0ARgIIADcBLAAAAQ4AHgH+AEsB8AAjArAAPAIZACMBhwClAZ8AQQIIAGkC/gBQATQAKAJnADwBuAAoAYgAMgL+AFACCABhAW0AMgHYADIBGAAoAQwAKAIIAKMCKQBVAcEAFAElAFoDQQD3APUAKAFdACMCZwBGArcAWgKrAFoCygBkAa4ACgJ7AAoCewAKAnsACgJ7AAoCewAKAnsACgNwAAAChAA8AlEAXwJRAF8CUQBfAlEAXwD7/7wA+wBfAPv/4AD7/+ADCwAKAvwAXwMbADwDGwA8AxsAPAMbADwDGwA8AfYAPAMbADwCywBaAssAWgLLAFoCywBaAhQAIwIQAF8CAABVAfYAMgH2ADIB9gAyAfYAMgH2ADIB9gAyAzAAMgGzADwCCAA8AggAPAIIADwCCAA8AOv/8ADrADUA6//wAOv/2gJLADICIwAyAlUAMgJVADICVQAyAlUAMgJVADIB2AAyAlUAMgIYADcCGAA3AhgANwIYADcCBAAjAhUAVQIEACMA6wA3A/oAPAOwADICFAAjAPkAPAIIAGcCCACfAggAQQGrAAACSwAAAPkAVQD5ADwA+QA8AXYAVQF2ADwBdgA8AXEAZAGVADwBlQBGAXkAMgErACMCFQAUAboAMgFIAAAAAQAAA3r++wAAA/r/vP+/A9wAAQAAAAAAAAAAAAAAAAAAANoAAwIDAZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIABQMEAAACAASAAAAnAAAAQwAAAAAAAAAAICAgIABAACAiFQN6/vsAAAN6AQUgAAERQAAAAAHyAqwAAAAgAAEAAAACAAAAAwAAABQAAwABAAAAFAAEALAAAAAoACAABAAIAH4A/wExAVMBeAK8AsYC2gLcIBQgGiAeICIgOiBEIHQgrCISIhX//wAAACAAoAExAVIBeAK8AsYC2gLcIBMgGCAcICIgOSBEIHQgrCISIhX////j/8L/kf9x/03+Cv4B/e797eC34LTgs+Cw4JrgkeBi4Cvext7EAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAABAAAqvAABBx0YAAAKEq4ABQAk/5IABQA3AB4ABQA5AB4ABQA6ABQABQA8AB4ABQBE/+IABQBG/9gABQBH/9gABQBI/9gABQBK/6YABQBS/9gABQBU/9gABQBW/+IABQCC/5IABQCD/5IABQCE/5IABQCF/5IABQCG/5IABQCH/5IABQCI/5IABQCfAB4ABQCi/+IABQCj/+IABQCk/+IABQCl/+IABQCm/+IABQCn/+IABQCo/+IABQCp/9gABQCq/9gABQCr/9gABQCs/9gABQCt/9gABQCy/9gABQC0/9gABQC1/9gABQC2/9gABQC3/9gABQC4/9gABQC6/9gABQDE/9gABQDFAB4ACgAk/5IACgA3AB4ACgA5AB4ACgA6ABQACgA8AB4ACgBE/+IACgBG/9gACgBH/9gACgBI/9gACgBK/6YACgBS/9gACgBU/9gACgBW/+IACgCC/5IACgCD/5IACgCE/5IACgCF/5IACgCG/5IACgCH/5IACgCI/5IACgCfAB4ACgCi/+IACgCj/+IACgCk/+IACgCl/+IACgCm/+IACgCn/+IACgCo/+IACgCp/9gACgCq/9gACgCr/9gACgCs/9gACgCt/9gACgCy/9gACgC0/9gACgC1/9gACgC2/9gACgC3/9gACgC4/9gACgC6/9gACgDE/9gACgDFAB4ADQAT/+IADQAUAB4ADQAYACgADQAZ/+IADQAb/+IADQAc/+IADQAk/7AADQA3AB4ADQA5AB4ADQA6ABQADQA8AB4ADQBG/+IADQBH/+IADQBI/+IADQBK/6YADQBS/+IADQBU/+IADQCC/7AADQCD/7AADQCE/7AADQCF/7AADQCG/7AADQCH/7AADQCI/7AADQCfAB4ADQCp/+IADQCq/+IADQCr/+IADQCs/+IADQCt/+IADQCy/+IADQC0/+IADQC1/+IADQC2/+IADQC3/+IADQC4/+IADQC6/+IADQDE/+IADQDFAB4ADwAT/84ADwAU/7oADwAX/3QADwAZ/84ADwAa/9gADwAb/9gADwAc/9gADwAm/9gADwAq/9gADwAy/9gADwA0/9gADwA3/34ADwA4/+IADwA5/5wADwA6/5wADwA8/5wADwBZ/+IADwBa/+IADwBc/+IADwCJ/9gADwCU/9gADwCV/9gADwCW/9gADwCX/9gADwCY/9gADwCa/9gADwCb/+IADwCc/+IADwCd/+IADwCe/+IADwCf/5wADwC//+IADwDB/+IADwDD/9gADwDF/5wAEAA3/5wAEAA9/8QAEQAT/84AEQAU/7oAEQAX/3QAEQAZ/84AEQAa/9gAEQAb/9gAEQAc/9gAEQAm/9gAEQAq/9gAEQAy/9gAEQA0/9gAEQA3/3QAEQA4/9gAEQA5/7AAEQA6/7AAEQA8/5cAEQBZ/+IAEQBa/+IAEQBc/+IAEQCJ/9gAEQCU/9gAEQCV/9gAEQCW/9gAEQCX/9gAEQCY/9gAEQCa/9gAEQCb/9gAEQCc/9gAEQCd/9gAEQCe/9gAEQCf/5cAEQC//+IAEQDB/+IAEQDD/9gAEQDF/5cAEgBE/9MAEgBG/8QAEgBH/8QAEgBI/8QAEgBK/8QAEgBS/8QAEgBU/8QAEgBZ/9gAEgBa/9gAEgBb/9gAEgBc/9gAEgBd/84AEgCi/9MAEgCj/9MAEgCk/9MAEgCl/9MAEgCm/9MAEgCn/9MAEgCo/9MAEgCp/8QAEgCq/8QAEgCr/8QAEgCs/8QAEgCt/8QAEgCy/8QAEgC0/8QAEgC1/8QAEgC2/8QAEgC3/8QAEgC4/8QAEgC6/8QAEgC//9gAEgDB/9gAEgDE/8QAEwAN/+IAEwAP/84AEwAR/84AEwB0/+wAEwB7/+IAEwDO/84AEwDR/84AFAAN/+wAFAAXABQAFQAN/+wAFQB0ABQAFQB1ABQAFgAN/+wAFgAP/+wAFgAR/+wAFgB0//EAFgB7/+IAFgDO/+wAFgDR/+wAFwAUAB4AFwAaABQAFwDWABQAGAAN/+wAGAAP/+wAGAAR/+wAGAB0/+IAGAB1/+wAGAB7/+IAGADO/+wAGADR/+wAGQAN/9gAGQAP/9gAGQAR/9gAGQB0/9MAGQB1/+IAGQB7/9MAGQDO/9gAGQDR/9gAGQDW/+wAGgAP/3QAGgAR/3QAGgAXABQAGgB0ABQAGgB1AB4AGgB7AA8AGgDO/3QAGgDR/3QAGgDWACgAGwAN/+IAGwAP/9gAGwAR/9gAGwB0/+wAGwB1/+wAGwB7/9MAGwDO/9gAGwDR/9gAGwDW/+IAHAAN/+IAHAAP/84AHAAR/84AHAB0/+wAHAB1/+wAHAB7/9gAHADO/84AHADR/84AHADW/+IAHQATAB4AHQAVACgAHQAWACMAHQAXABkAHQAYAB4AHQAZAB4AHQAbACgAHQAcAB4AJAAN/7AAJAA3/84AJAA5/9gAJAA6/+IAJABs/7AAJAB0/7AAJAB1/7AAJAB7/7AAJAB8/7AAJADW/6YAJQAF/+IAJQAK/+IAJQAN/+IAJQA3/9MAJQBs/+IAJQB0/+IAJQB1/+IAJQB7/+IAJQB8/+IAJQDG/+IAJQDN/+IAJQDQ/+IAJQDW/+IAJgANABQAJgBsABQAJgB0ABQAJgB1ABQAJgB8ABQAJgCwAA8AJgCxAA8AJwAN/+IAJwAP/9gAJwAR/9gAJwAk/+cAJwA3/+wAJwBs/+wAJwB0/+wAJwB1/+wAJwB7/9gAJwCC/+cAJwCD/+cAJwCE/+cAJwCF/+cAJwCG/+cAJwCH/+cAJwCI/+cAJwCuABQAJwCwAAoAJwCxAB4AJwDO/9gAJwDR/9gAJwDW/+IAKACuAAoAKACwABQAKACxAB4AKQAFABQAKQAKABQAKQANABQAKQAP/5wAKQAR/4gAKQAk/9MAKQBE/+wAKQBG/+cAKQBH/+cAKQBI/+cAKQBK/84AKQBQ/+wAKQBR/+wAKQBS/+cAKQBT/+wAKQBU/+cAKQBV/+wAKQBW/+cAKQBY/+wAKQBZ/+wAKQBa//EAKQBc/+wAKQBd/+wAKQBsAB4AKQB0AB4AKQB1AB4AKQB7AB4AKQB8AB4AKQCC/9MAKQCD/9MAKQCE/9MAKQCF/9MAKQCG/9MAKQCH/9MAKQCI/9MAKQCi/+wAKQCj/+wAKQCk/+wAKQCl/+wAKQCm/+wAKQCn/+wAKQCo/+wAKQCp/+cAKQCq/+cAKQCr/+cAKQCs/+cAKQCt/+cAKQCuAB4AKQCwAB4AKQCxADwAKQCy/+cAKQCz/+wAKQC0/+cAKQC1/+cAKQC2/+cAKQC3/+cAKQC4/+cAKQC6/+cAKQC7/+wAKQC8/+wAKQC9/+wAKQC+/+wAKQC//+wAKQDB/+wAKQDC/+wAKQDE/+cAKQDGABQAKQDMABQAKQDNABQAKQDO/5wAKQDPABQAKQDQABQAKQDR/5wAKQDWAB4ALgAm//YALgAq//YALgAy//YALgA0//YALgCJ//YALgCU//YALgCV//YALgCW//YALgCX//YALgCY//YALgCa//YALgCuAAoALgCwABQALgCxAB4ALgDD//YALwAF/7AALwAK/7AALwAN/5wALwAQ/5wALwAm/+IALwAq/+IALwAy/+IALwA0/+IALwA3/7oALwA4/+IALwA5/90ALwA6/+IALwA8/8QALwBs/5wALwB0/5wALwB1/5wALwB7/5IALwB8/5wALwCJ/+IALwCU/+IALwCV/+IALwCW/+IALwCX/+IALwCY/+IALwCa/+IALwCb/+IALwCc/+IALwCd/+IALwCe/+IALwCf/8QALwDD/+IALwDF/8QALwDG/7AALwDK/8QALwDL/8QALwDM/7AALwDN/7AALwDP/7AALwDQ/7AALwDW/5wAMgAP/9gAMgAR/9gAMgAk/+cAMgCC/+cAMgCD/+cAMgCE/+cAMgCF/+cAMgCG/+cAMgCH/+cAMgCI/+cAMgCuABQAMgCwAAoAMgCxAB4AMgDO/9gAMgDR/9gAMwAR/4gAMwAk/+IAMwBsAB4AMwB0AB4AMwB1AB4AMwB8AB4AMwCC/+IAMwCD/+IAMwCE/+IAMwCF/+IAMwCG/+IAMwCH/+IAMwCI/+IAMwDMAB4AMwDPAB4AMwDWAB4ANAAP/9gANAAR/9gANAAk/+cANAA3/+wANACC/+cANACD/+cANACE/+cANACF/+cANACG/+cANACH/+cANACI/+cANACuABQANACwAAoANACxAB4ANADO/9gANADR/9gANQAN/+IANQAm//YANQAq//YANQAy//YANQA0//YANQA3//EANQBs/+IANQB0/+IANQB1/+IANQB7/+IANQB8/+IANQCJ//YANQCU//YANQCV//YANQCW//YANQCX//YANQCY//YANQCa//YANQDD//YANQDW/+IANgAN/+IANgBs/+IANgB0/+IANgB1/+IANgB7/+IANgCuAAoANgCxABQANgDW/+IANwAFAB4ANwAKAB4ANwANAB4ANwAP/5IANwAQ/5wANwAR/3QANwAd/8QANwAe/8QANwAk/84ANwAm/+wANwAq/+wANwAy/+wANwA0/+wANwBE/8QANwBG/8QANwBH/8QANwBI/8QANwBK/7AANwBQ/90ANwBR/90ANwBS/8QANwBT/90ANwBU/8QANwBV/90ANwBW/8kANwBY/+wANwBZ/9gANwBa/90ANwBc/9gANwBd/+IANwBsAB4ANwBt/6sANwB0AB4ANwB1AB4ANwB7AB4ANwB8AB4ANwB9/7oANwCC/84ANwCD/84ANwCE/84ANwCF/84ANwCG/84ANwCH/84ANwCI/84ANwCJ/+wANwCU/+wANwCV/+wANwCW/+wANwCX/+wANwCY/+wANwCa/+wANwCi/84ANwCj/8QANwCk/8QANwCl/+wANwCm/9gANwCn/8QANwCo/8QANwCp/8QANwCq/8QANwCr/8QANwCs/8QANwCt/8QANwCuAB4ANwCwACgANwCxADwANwCy/8QANwCz/90ANwC0/8QANwC1/8QANwC2/8QANwC3/8QANwC4/8QANwC6/8QANwC7/+wANwC8/+wANwC9/+wANwC+/+wANwC//9gANwDB/9gANwDC/9gANwDD/+wANwDE/8QANwDGAB4ANwDK/8QANwDL/8QANwDMAB4ANwDNAB4ANwDO/5IANwDPAB4ANwDQAB4ANwDR/5IANwDT/6sANwDU/7oANwDWAB4AOAAP/9gAOAAR/9gAOAAk/+wAOACC/+wAOACD/+wAOACE/+wAOACF/+wAOACG/+wAOACH/+wAOACI/+wAOADO/9gAOADR/9gAOQAFAB4AOQAKAB4AOQANAB4AOQAP/7AAOQAR/7AAOQAd/+wAOQAe/+wAOQAk/9gAOQBE/+wAOQBG/+wAOQBH/+wAOQBI/+wAOQBK/+IAOQBQ//EAOQBR//EAOQBS/+wAOQBU/+wAOQBV//EAOQBsAB4AOQB0AB4AOQB1AB4AOQB7AA8AOQB8AB4AOQCC/9gAOQCD/9gAOQCE/9gAOQCF/9gAOQCG/9gAOQCH/9gAOQCI/9gAOQCi/+wAOQCj/+wAOQCk/+wAOQCl/+wAOQCm/+wAOQCn/+wAOQCo/+wAOQCp/+wAOQCq/+wAOQCr/+wAOQCs/+wAOQCt/+wAOQCuAAoAOQCwABQAOQCxACMAOQCy/+wAOQCz//EAOQC0/+wAOQC1/+wAOQC2/+wAOQC3/+wAOQC4/+wAOQC6/+wAOQDE/+wAOQDGAB4AOQDMACgAOQDNAB4AOQDO/7AAOQDPACgAOQDQAB4AOQDR/7AAOQDWAB4AOgAFABQAOgAKABQAOgANABQAOgAP/7AAOgAR/7AAOgAd/+wAOgAe/+wAOgAk/+IAOgBE//EAOgBG//EAOgBH//EAOgBI//EAOgBK/+cAOgBQ//YAOgBR//YAOgBS//EAOgBU//EAOgBV//YAOgBsABQAOgB0ABQAOgB1ABQAOgB7AAoAOgB8ABQAOgCC/+IAOgCD/+IAOgCE/+IAOgCF/+IAOgCG/+IAOgCH/+IAOgCI/+IAOgCi//EAOgCj//EAOgCk//EAOgCl//EAOgCm//EAOgCn//EAOgCo//EAOgCp//EAOgCq//EAOgCr//EAOgCs//EAOgCt//EAOgCuAAoAOgCwABQAOgCxACMAOgCy//EAOgCz//YAOgC0//EAOgC1//EAOgC2//EAOgC3//EAOgC4//EAOgC6//EAOgDE//EAOgDGABQAOgDMAB4AOgDNABQAOgDO/7AAOgDPAB4AOgDQABQAOgDR/7AAOgDWABQAPAAFAB4APAAKAB4APAANAB4APAAP/7AAPAAR/5wAPAAd/+wAPAAe/+wAPAAk/+IAPABE/+wAPABG/+wAPABH/+wAPABI/+wAPABK/+IAPABQ//EAPABR//EAPABS/+wAPABU/+wAPABV//EAPABsAB4APAB0AB4APAB1AB4APAB7AA8APAB8AB4APACC/+IAPACD/+IAPACE/+IAPACF/+IAPACG/+IAPACH/+IAPACI/+IAPACi/+wAPACj/+wAPACk/+wAPACl/+wAPACm/+wAPACn/+wAPACo/+wAPACp/+wAPACq/+wAPACr/+wAPACs/+wAPACt/+wAPACuAAoAPACwABQAPACxACMAPACy/+wAPACz//EAPAC0/+wAPAC1/+wAPAC2/+wAPAC3/+wAPAC4/+wAPAC6/+wAPADE/+wAPADGAB4APADMAB4APADNAB4APADO/7AAPADPAB4APADQAB4APADR/7AAPADWAB4APQAQ/6YAPQCuAAoAPQCwABQAPQCxAB4APQDK/8kAPQDL/8kARAB7/+IARADW/+IARQAN/+IARQA//+IARQBs/+IARQB0/+wARQB1/+IARQB7/9gARQB8/+IARQDM/+wARQDP/+wARQDW/+IASAB7/+IASADW/+wASQAFACMASQAKACMASQANACgASQAP/6YASQAQ/+wASQAR/6YASQBE/+cASQBG/+cASQBH/+cASQBI/+cASQBK/90ASQBS/+cASQBU/+cASQBW/+wASQBsADcASQB0AC0ASQB1ADIASQB7ACgASQB8ADIASQCi//EASQCj/+cASQCk/+cASQCl//YASQCm/+cASQCn/+cASQCo/+cASQCp/+cASQCq/+cASQCr/+cASQCs/+cASQCt/+cASQCuAAoASQCwABkASQCxACMASQCy/+cASQC0/+cASQC1/+cASQC2/+cASQC3/+cASQC4/+cASQC6/+cASQDC//EASQDE/+cASQDGACMASQDK/+wASQDL/+wASQDMACgASQDNACMASQDO/6YASQDPACgASQDQACMASQDR/6YASQDWADwATQCwAAoATQCxABQAUgAN/+IAUgA//+IAUgBs/+IAUgB0/+wAUgB1/+IAUgB7/9gAUgB8/+IAUgDM/+wAUgDP/+wAUgDW/+IAUwAN/+IAUwA//+IAUwBs/+IAUwB0/+wAUwB1/+IAUwB7/9gAUwB8/+IAUwDM/+wAUwDP/+wAUwDW/+IAVQAP/7oAVQAQ/9gAVQAR/7oAVQBE//EAVQBG/+wAVQBH/+wAVQBI/+wAVQBK/90AVQBS/+wAVQBU/+wAVQCi//EAVQCj//EAVQCk//EAVQCl//EAVQCm//EAVQCn//EAVQCo//EAVQCp/+wAVQCq/+wAVQCr/+wAVQCs/+wAVQCt/+wAVQCy/+wAVQC0/+wAVQC1/+wAVQC2/+wAVQC3/+wAVQC4/+wAVQC6/+wAVQDE/+wAVQDK/+wAVQDL/+wAVQDO/7oAVQDR/7oAVwAQ/+IAVwDK/9gAVwDL/9gAWQAP/+IAWQAR/+IAWQDMABQAWQDO/+IAWQDPABQAWQDR/+IAWgAP/+IAWgAR/+IAWgDMABQAWgDO/+IAWgDPABQAWgDR/+IAXAAP/+IAXAAR/+IAXADMABQAXADO/+IAXADPABQAXADR/+IAbAAk/7AAbAA3AB4AbAA5AB4AbAA6ABQAbAA8AB4AbABK/7AAbACC/7AAbACD/7AAbACE/7AAbACF/7AAbACG/7AAbACH/7AAbACI/7AAbACfAB4AbADFAB4AbQA3/7oAdAAUACgAdAAVABQAdAAWAB4AdAAYAB4AdAAk/7AAdAA3AB4AdAA5AB4AdAA6ABQAdAA8AB4AdABK/7AAdACC/7AAdACD/7AAdACE/7AAdACF/7AAdACG/7AAdACH/7AAdACI/7AAdACfAB4AdADFAB4AdQAUADIAdQAVABQAdQAWABQAdQAYACgAdQAaABQAdQAk/7AAdQA3AB4AdQA5AB4AdQA6ABQAdQA8AB4AdQBK/7AAdQCC/7AAdQCD/7AAdQCE/7AAdQCF/7AAdQCG/7AAdQCH/7AAdQCI/7AAdQCfAB4AdQDFAB4AewAUADwAewAVAB4AewAWACgAewAYADwAewAaABQAewAk/7AAewA3AB4AewA5AB4AewA6ABQAewA8AB4AewBK/7oAewCC/7AAewCD/7AAewCE/7AAewCF/7AAewCG/7AAewCH/7AAewCI/7AAewCfAB4AewDFAB4AfAAk/7AAfAA3AB4AfAA5AB4AfAA6ABQAfAA8AB4AfABK/6YAfACC/7AAfACD/7AAfACE/7AAfACF/7AAfACG/7AAfACH/7AAfACI/7AAfACfAB4AfADFAB4AfQA3/6sAggAN/7AAggA3/84AggA5/9gAggA6/+IAggBs/7AAggB0/7AAggB1/7AAggB7/7AAggB8/7AAggDW/6YAgwAN/7AAgwA3/84AgwA5/9gAgwA6/+IAgwBs/7AAgwB0/7AAgwB1/7AAgwB7/7AAgwB8/7AAgwDW/6YAhAAN/7AAhAA3/84AhAA5/9gAhAA6/+IAhABs/7AAhAB0/7AAhAB1/7AAhAB7/7AAhAB8/7AAhADW/6YAhQAN/7AAhQA3/84AhQA5/9gAhQA6/+IAhQBs/7AAhQB0/7AAhQB1/7AAhQB7/7AAhQB8/7AAhQDW/6YAhgAN/7AAhgA3/84AhgA5/9gAhgA6/+IAhgBs/7AAhgB0/7AAhgB1/7AAhgB7/7AAhgB8/7AAhgDW/6YAhwAN/7AAhwA3/84AhwA5/9gAhwA6/+IAhwBs/7AAhwB0/7AAhwB1/7AAhwB7/7AAhwB8/7AAhwDW/6YAiACuAAoAiACwABQAiACxAB4AigCuAAoAigCwABQAigCxAB4AiwCuAAoAiwCwABQAiwCxAB4AjACuAAoAjACwABQAjACxAB4AjQCuAAoAjQCwABQAjQCxAB4AkgAP/9gAkgAR/9gAkgAk/+cAkgA3/+wAkgCC/+cAkgCD/+cAkgCE/+cAkgCF/+cAkgCG/+cAkgCH/+cAkgCI/+cAkgCuABQAkgCwAAoAkgCxAB4AkgDO/9gAkgDR/9gAlAAP/9gAlAAR/9gAlAAk/+cAlACC/+cAlACD/+cAlACE/+cAlACF/+cAlACG/+cAlACH/+cAlACI/+cAlACuABQAlACwAAoAlACxAB4AlADO/9gAlADR/9gAlQAP/9gAlQAR/9gAlQAk/+cAlQCC/+cAlQCD/+cAlQCE/+cAlQCF/+cAlQCG/+cAlQCH/+cAlQCI/+cAlQCuABQAlQCwAAoAlQCxAB4AlQDO/9gAlQDR/9gAlgAP/9gAlgAR/9gAlgAk/+cAlgCC/+cAlgCD/+cAlgCE/+cAlgCF/+cAlgCG/+cAlgCH/+cAlgCI/+cAlgCuABQAlgCwAAoAlgCxAB4AlgDO/9gAlgDR/9gAlwAP/9gAlwAR/9gAlwAk/+cAlwCC/+cAlwCD/+cAlwCE/+cAlwCF/+cAlwCG/+cAlwCH/+cAlwCI/+cAlwCuABQAlwCwAAoAlwCxAB4AlwDO/9gAlwDR/9gAmAAP/9gAmAAR/9gAmAAk/+cAmACC/+cAmACD/+cAmACE/+cAmACF/+cAmACG/+cAmACH/+cAmACI/+cAmACuABQAmACwAAoAmACxAB4AmADO/9gAmADR/9gAmgAP/9gAmgAR/9gAmgAk/+cAmgCC/+cAmgCD/+cAmgCE/+cAmgCF/+cAmgCG/+cAmgCH/+cAmgCI/+cAmgCuABQAmgCwAAoAmgCxAB4AmgDO/9gAmgDR/9gAmwAP/9gAmwAR/9gAmwAk/+wAmwCC/+wAmwCD/+wAmwCE/+wAmwCF/+wAmwCG/+wAmwCH/+wAmwCI/+wAmwDO/9gAmwDR/9gAnAAP/9gAnAAR/9gAnAAk/+wAnACC/+wAnACD/+wAnACE/+wAnACF/+wAnACG/+wAnACH/+wAnACI/+wAnADO/9gAnADR/9gAnQAP/9gAnQAR/9gAnQAk/+wAnQCC/+wAnQCD/+wAnQCE/+wAnQCF/+wAnQCG/+wAnQCH/+wAnQCI/+wAnQDO/9gAnQDR/9gAngAP/9gAngAR/9gAngAk/+wAngCC/+wAngCD/+wAngCE/+wAngCF/+wAngCG/+wAngCH/+wAngCI/+wAngDO/9gAngDR/9gAnwAFAB4AnwAKAB4AnwANAB4AnwAP/7AAnwAR/5wAnwAd/+wAnwAe/+wAnwAk/+IAnwBE/+wAnwBG/+wAnwBH/+wAnwBI/+wAnwBK/+IAnwBQ//EAnwBR//EAnwBS/+wAnwBU/+wAnwBV//EAnwBsAB4AnwB0AB4AnwB1AB4AnwB7AA8AnwB8AB4AnwCC/+IAnwCD/+IAnwCE/+IAnwCF/+IAnwCG/+IAnwCH/+IAnwCI/+IAnwCi/+wAnwCj/+wAnwCk/+wAnwCl/+wAnwCm/+wAnwCn/+wAnwCo/+wAnwCp/+wAnwCq/+wAnwCr/+wAnwCs/+wAnwCt/+wAnwCuAAoAnwCwABQAnwCxACMAnwCy/+wAnwCz//EAnwC0/+wAnwC1/+wAnwC2/+wAnwC3/+wAnwC4/+wAnwC6/+wAnwDE/+wAnwDGAB4AnwDMAB4AnwDNAB4AnwDO/7AAnwDPAB4AnwDQAB4AnwDR/7AAnwDWAB4AogB7/+IAogDW/+IAowB7/+IAowDW/+IApAB7/+IApADW/+IApQB7/+IApQDW/+IApgB7/+IApgDW/+IApwB7/+IApwDW/+IAqgB7/+IAqgDW/+wAqwB7/+IAqwDW/+wArAB7/+IArADW/+wArQB7/+IArQDW/+wAtAAN/+IAtAA//+IAtABs/+IAtAB0/+wAtAB1/+IAtAB7/9gAtAB8/+IAtADM/+wAtADP/+wAtADW/+IAtQAN/+IAtQA//+IAtQBs/+IAtQB0/+wAtQB1/+IAtQB7/9gAtQB8/+IAtQDM/+wAtQDP/+wAtQDW/+IAtgAN/+IAtgA//+IAtgBs/+IAtgB0/+wAtgB1/+IAtgB7/9gAtgB8/+IAtgDM/+wAtgDP/+wAtgDW/+IAtwAN/+IAtwA//+IAtwBs/+IAtwB0/+wAtwB1/+IAtwB7/9gAtwB8/+IAtwDM/+wAtwDP/+wAtwDW/+IAuAAN/+IAuAA//+IAuABs/+IAuAB0/+wAuAB1/+IAuAB7/9gAuAB8/+IAuADM/+wAuADP/+wAuADW/+IAugAN/+IAugA//+IAugBs/+IAugB0/+wAugB1/+IAugB7/9gAugB8/+IAugDM/+wAugDP/+wAugDW/+IAvwAP/+IAvwAR/+IAvwDMABQAvwDO/+IAvwDPABQAvwDR/+IAwQAP/+IAwQAR/+IAwQDMABQAwQDO/+IAwQDPABQAwQDR/+IAwwCuAAoAwwCwABQAwwCxAB4AxAB7/+IAxADW/+wAxQAFAB4AxQAKAB4AxQANAB4AxQAP/7AAxQAR/5wAxQAd/+wAxQAe/+wAxQAk/+IAxQBE/+wAxQBG/+wAxQBH/+wAxQBI/+wAxQBK/+IAxQBQ//EAxQBR//EAxQBS/+wAxQBU/+wAxQBV//EAxQBsAB4AxQB0AB4AxQB1AB4AxQB7AA8AxQB8AB4AxQCC/+IAxQCD/+IAxQCE/+IAxQCF/+IAxQCG/+IAxQCH/+IAxQCI/+IAxQCi/+wAxQCj/+wAxQCk/+wAxQCl/+wAxQCm/+wAxQCn/+wAxQCo/+wAxQCp/+wAxQCq/+wAxQCr/+wAxQCs/+wAxQCt/+wAxQCuAAoAxQCwABQAxQCxACMAxQCy/+wAxQCz//EAxQC0/+wAxQC1/+wAxQC2/+wAxQC3/+wAxQC4/+wAxQC6/+wAxQDE/+wAxQDGAB4AxQDMAB4AxQDNAB4AxQDO/7AAxQDPAB4AxQDQAB4AxQDR/7AAxQDWAB4AxgAk/5IAxgA3AB4AxgA5AB4AxgA6ABQAxgA8AB4AxgBE/+IAxgBG/9gAxgBH/9gAxgBI/9gAxgBK/6YAxgBS/9gAxgBU/9gAxgBW/+IAxgCC/5IAxgCD/5IAxgCE/5IAxgCF/5IAxgCG/5IAxgCH/5IAxgCI/5IAxgCfAB4AxgCi/+IAxgCj/+IAxgCk/+IAxgCl/+IAxgCm/+IAxgCn/+IAxgCo/+IAxgCp/9gAxgCq/9gAxgCr/9gAxgCs/9gAxgCt/9gAxgCy/9gAxgC0/9gAxgC1/9gAxgC2/9gAxgC3/9gAxgC4/9gAxgC6/9gAxgDE/9gAxgDFAB4AygA3/8QAygA9/+IAywA3/8QAywA9/+IAzAAk/5IAzAAm/+IAzAAq/+IAzAAy/+IAzAA0/+IAzAA3AB4AzAA5AB4AzAA6ABQAzAA8AB4AzABK/5wAzACC/5IAzACD/5IAzACE/5IAzACF/5IAzACG/5IAzACH/5IAzACI/5IAzACJ/+IAzACU/+IAzACV/+IAzACW/+IAzACX/+IAzACY/+IAzACa/+IAzACfAB4AzADD/+IAzADFAB4AzQAk/5IAzQA3AB4AzQA5AB4AzQA6ABQAzQA8AB4AzQBE/+IAzQBG/9gAzQBH/9gAzQBI/9gAzQBK/6YAzQBS/9gAzQBU/9gAzQBW/+IAzQCC/5IAzQCD/5IAzQCE/5IAzQCF/5IAzQCG/5IAzQCH/5IAzQCI/5IAzQCfAB4AzQCi/+IAzQCj/+IAzQCk/+IAzQCl/+IAzQCm/+IAzQCn/+IAzQCo/+IAzQCp/9gAzQCq/9gAzQCr/9gAzQCs/9gAzQCt/9gAzQCy/9gAzQC0/9gAzQC1/9gAzQC2/9gAzQC3/9gAzQC4/9gAzQC6/9gAzQDE/9gAzQDFAB4AzgAT/84AzgAU/7oAzgAX/3QAzgAZ/84AzgAa/9gAzgAb/9gAzgAc/9gAzgAm/9gAzgAq/9gAzgAy/9gAzgA0/9gAzgA3/34AzgA4/+IAzgA5/5wAzgA6/5wAzgA8/5wAzgBZ/+IAzgBa/+IAzgBc/+IAzgCJ/9gAzgCU/9gAzgCV/9gAzgCW/9gAzgCX/9gAzgCY/9gAzgCa/9gAzgCb/+IAzgCc/+IAzgCd/+IAzgCe/+IAzgCf/5wAzgC//+IAzgDB/+IAzgDD/9gAzgDF/5wAzwAk/5IAzwAm/+IAzwAq/+IAzwAy/+IAzwA0/+IAzwA3AB4AzwA5AB4AzwA6ABQAzwA8AB4AzwBK/5wAzwCC/5IAzwCD/5IAzwCE/5IAzwCF/5IAzwCG/5IAzwCH/5IAzwCI/5IAzwCJ/+IAzwCU/+IAzwCV/+IAzwCW/+IAzwCX/+IAzwCY/+IAzwCa/+IAzwCfAB4AzwDD/+IAzwDFAB4A0AAk/5IA0AA3AB4A0AA5AB4A0AA6ABQA0AA8AB4A0ABE/+IA0ABG/9gA0ABH/9gA0ABI/9gA0ABK/6YA0ABS/9gA0ABU/9gA0ABW/+IA0ACC/5IA0ACD/5IA0ACE/5IA0ACF/5IA0ACG/5IA0ACH/5IA0ACI/5IA0ACfAB4A0ACi/+IA0ACj/+IA0ACk/+IA0ACl/+IA0ACm/+IA0ACn/+IA0ACo/+IA0ACp/9gA0ACq/9gA0ACr/9gA0ACs/9gA0ACt/9gA0ACy/9gA0AC0/9gA0AC1/9gA0AC2/9gA0AC3/9gA0AC4/9gA0AC6/9gA0ADE/9gA0ADFAB4A0QAT/84A0QAU/7oA0QAX/3QA0QAZ/84A0QAa/9gA0QAb/9gA0QAc/9gA0QAm/9gA0QAq/9gA0QAy/9gA0QA0/9gA0QA3/34A0QA4/+IA0QA5/5wA0QA6/5wA0QA8/5wA0QBZ/+IA0QBa/+IA0QBc/+IA0QCJ/9gA0QCU/9gA0QCV/9gA0QCW/9gA0QCX/9gA0QCY/9gA0QCa/9gA0QCb/+IA0QCc/+IA0QCd/+IA0QCe/+IA0QCf/5wA0QC//+IA0QDB/+IA0QDD/9gA0QDF/5wA0wA3/7oA1AA3/6sA1gAUACgA1gAWABQA1gAYADIA1gAaABQA1gAk/7AA1gA3AB4A1gA5AB4A1gA6ABQA1gA8AB4A1gBK/7AA1gCC/7AA1gCD/7AA1gCE/7AA1gCF/7AA1gCG/7AA1gCH/7AA1gCI/7AA1gCfAB4A1gDFAB4AAAAQAMYAAwABBAkAAAHSAAAAAwABBAkAAQAOAdIAAwABBAkAAgAOAeAAAwABBAkAAwAyAe4AAwABBAkABAAOAdIAAwABBAkABQAaAiAAAwABBAkABgAOAdIAAwABBAkABwBMAjoAAwABBAkACAAWAoYAAwABBAkACQAWAoYAAwABBAkACgBuApwAAwABBAkACwAyAwoAAwABBAkADAAyAwoAAwABBAkADQHSAAAAAwABBAkADgA0AzwAAwABBAkAEgAOAdIAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABHAGUAcwBpAG4AZQAgAFQAbwBkAHQAIADKACgAdwB3AHcALgBnAGUAcwBpAG4AZQAtAHQAbwBkAHQALgBkAGUAKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBTAG4AaQBwAHAAZQB0ACIALgAgAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAFMAbgBpAHAAcABlAHQAUgBlAGcAdQBsAGEAcgBHAGUAcwBpAG4AZQBUAG8AZAB0ADoAIABTAG4AaQBwAHAAZQB0ADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADAAUwBuAGkAcABwAGUAdAAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEcAZQBzAGkAbgBlACAAVABvAGQAdAAuAEcAZQBzAGkAbgBlACAAVABvAGQAdABDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEcAZQBzAGkAbgBlACAAVABvAGQAdAAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBnAGUAcwBpAG4AZQAtAHQAbwBkAHQALgBkAGUAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADaAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQMAigDaAIMAkwEEAQUAjQEGAIgAwwDeAQcAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXALAAsQC7AQgA2ADdANkAsgCzALYAtwDEALQAtQDFAIcAvgC/ALwBCQEKAO8BCwd1bmkwMEEwB3VuaTAwQUQHdW5pMDBCMgd1bmkwMEIzB3VuaTAwQjUHdW5pMDBCOQphcG9zdHJvcGhlB3VuaTIwNzQERXVybwd1bmkyMjE1AAAAAQAB//8ADw==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
