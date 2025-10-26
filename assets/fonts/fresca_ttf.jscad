(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fresca_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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Ai4AFgHaAAoBvQA3AeIAHgIZADMBgAAqAVsAKgHqABkCDQAxANAAOQHaAAoB8wAwAb8AMAKCACoCEAAzAiQAIwGjACoCLgAoAcEAKgF4ABoBywAMAgwAKAIbABQDLAAMAjcAHwIzABEB8gAeAXIARwFs/9oBdQA+AacAQQJbADIAyAAGAZ4AHgH+//IBpwAgAfYAGQHBACABPwAMAgUAJAIM/+wA4AARARX/dQHU//wA6wAEAyEAPQH0ADEBzgAhAegAKwIUACoBcwA/AaMAFQGcAAkB9gAtAeAAFAM1ABcB6QAUAer/4wHHACgBEQAuANAAQQERACsBgQATAP0AAACeABYBqQAVAjYAFAJPAB0CJgARANAAQQFvAA8BQwAbApkAFAE5ACgB6wAyAl8AMgE5AB4C1gAyATsAHgFtADICWwAyAU8AMgFTADIAxgAKAfYAKAJ0ACAAqQAYATUAMgD8ADIBWAAyAesAMgMMAE8DDABEAwwAMQFVAAAB2AAKAdgACgHYAAoB2AAKAdgACgHYAAoCyv/0AeIAHgGAACoBgAAqAYAAKgGAACoA0P/gANAALgDQ/+QA0P/rAj0AAwIPADMCJQAkAiUAJAIlACQCJQAkAiUAJAIkAEYCJAAjAgwAKAIMACgCDAAoAgwAKAIzABEBsAA0AlkAEQGeAB4BngAeAZ4AHgGeAB4BngAeAZ4AHgLJAB4BpwAgAcEAIAHBACABwQAgAcEAIADg/+IA3gAVAOD/6wDg//ACAwAuAfQAMQHOACEBzgAhAc4AIQHOACEBzgAhAkgANAHBABoCCgA8AgoAPAIKADwCCgA8Aer/4wIEAEgB6v/jAgz/7ADQ/7wA8P/FAPAAEQKqADkB9QARAdoACgEV/3UB1P/8AdQAAQG/ADABlAAEAb//1AD/AAYCEAAzAfQAMQL7ACQC/QAhAcEAKgHBACoBcwA+AcEAKgFzACwBeAAaAaMAFQIzABEB8gAeAccAKAHm/5ABbwAOATsADgG8ADIA3AAyASAAKgE4ADIBgQATAYwACgDcADICGP/+AlsAMgRYADAApQAPAKUADwCoABEBTgAWAU4AFwFOABcB6AANAegADgHTAEUCLgAcBCEAMgEyADIBMgAyAjkAMgHyAEoBewAyAkAAHgHRAB4DlAAyAqsAMAPvAFoB9wAtAdoAEgINADEB8wAWAlsANAKRADIDQABGAUz/3QI7ADIChABNAqgARgKoAEYCIAAyAmYADAIfABICPgASA14ADANpAAwDJAAVAAEAAANl/uMAAATZ/0r/oASxAAEAAAAAAAAAAAAAAAAAAAETAAIBmAGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAUGAAAAAgADgAAA70AAIEsAAAAAAAAAAFBZUlMAQAAg+wYDZf7jAAADZQEdIAAAAQAAAAAB5AKIAAAAIAABAAAAAgAAAAMAAAAUAAMAAQAAABQABAF4AAAAWgBAAAUAGgB+AP8BKQE1ATgBRAFUAVkBYQF4AX4BkgLHAt0DBwPAIBQgGiAeICIgJiAwIDogRCBwIHQgrCETISIhJiEuIgIiBiIPIhIiGiIeIisiSCJgImUlyvsE+wb//wAAACAAoAEnATEBNwE/AVIBVgFgAXgBfQGSAsYC2AMHA8AgEyAYIBwgICAmIDAgOSBEIHAgdCCsIRMhIiEmIS4iAiIGIg8iESIaIh4iKyJIImAiZCXK+wD7Bv///+P/wv+b/5T/k/+N/4D/f/95/2P/X/9M/hn+Cf3g/Sjg1uDT4NLg0eDO4MXgveC04InghuBP3+nf29/Y39He/t773vPe8t7r3uje3N7A3qnepttCBg0GDAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAACmAAAAAwABBAkAAQAMAKYAAwABBAkAAgAOALIAAwABBAkAAwAuAMAAAwABBAkABAAcAO4AAwABBAkABQAaAQoAAwABBAkABgAcAO4AAwABBAkABwBGASQAAwABBAkACAASAWoAAwABBAkACQAWAXwAAwABBAkACwAiAZIAAwABBAkADAAiAZIAAwABBAkADQEgAbQAAwABBAkADgA0AtQAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABGAG8AbgB0AHMAdABhAGcAZQAgACgAaQBuAGYAbwBAAGYAbwBuAHQAcwB0AGEAZwBlAC4AYwBvAG0AKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBGAHIAZQBzAGMAYQAiAEYAcgBlAHMAYwBhAFIAZQBnAHUAbABhAHIARgBvAG4AdABzAHQAYQBnAGUAOgAgAEYAcgBlAHMAYwBhADoAIAAyADAAMQAxAEYAcgBlAHMAYwBhAC0AUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAEYAcgBlAHMAYwBhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAARgBvAG4AdABzAHQAYQBnAGUALgBGAG8AbgB0AHMAdABhAGcAZQBJAHYA4QBuACAATQBvAHIAZQBuAG8AdwB3AHcALgBmAG8AbgB0AHMAdABhAGcAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAABEwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBBAEFAQYA1wEHAQgBCQEKAQsBDAENAQ4A4gDjAQ8BEACwALEBEQESARMBFAEVAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wEWAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAEXARgBGQEaAIwAnwEbAJgAqACaAJkA7wClAJIAnACnAI8AlACVALkBHADAAMEBHQEeAR8HbmJzcGFjZQd1bmkwMEFEBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24MZG90YWNjZW50Y21iDHplcm9zdXBlcmlvcgxmb3Vyc3VwZXJpb3IERXVybwlhZmlpNjEyODkJZXN0aW1hdGVkAmZmA2ZmaQNmZmwDc190AAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABARIAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
