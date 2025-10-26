(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.aladin_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAPAIAAAwBwR0RFRgARAOoAAJcIAAAAFkdQT1Ojcoz8AACXIAAABqBHU1VCuPq49AAAncAAAAAqT1MvMldbPjEAAI6cAAAAYGNtYXD83/TfAACO/AAAARRnYXNwAAAAEAAAlwAAAAAIZ2x5Zo9bZ7wAAAD8AACHpGhlYWT4EN4HAACKmAAAADZoaGVhBpQC9AAAjngAAAAkaG10eIT8FR4AAIrQAAADqGxvY2EZ0/giAACIwAAAAdZtYXhwATMAfQAAiKAAAAAgbmFtZXylmggAAJAYAAAE3nBvc3TK3gFzAACU+AAAAghwcmVwaAaMhQAAkBAAAAAHAAIAM//zAL4CyAALAB4AAD8BMhYUBiImNDMXFgMmNDY3NjIVBwYRFBYOASMiJxBvGBgRF0MbDQsLKgEhFiYuAiYCAhMQIwFVARU1GRpYCAgCOgUUFAQIFAye/uEgEwYLFwFjAAACADICDwEXAsgAEQAjAAAAFhQGDwEGKwEiNTQnJjU0PgEGFhQGDwEGKwEiNTQnJjU0PgEBAxQTCQkJBAIJGAkjGHgUEgoJCQQCCRkIIxgCxRIvQxESDwdENxMCDxIBAxIvQxESDwdAOxMCDxIBAAIAKABhAiQCUwADAD8AABM/ASMHNyMiNTQ7ATU0MzIdAQcVNzU0MzIVBhUzMh0BFCsBFTMyFh0BFCsBFRQGIyI9ASMVFAYjIj0BIyI1NDPycAFxQQF7DytfLRQBcS0UAXIPKFlyBwgoWRkcDHAZHAx6DysBJwFnaWkVK1krDwsfSgFXKw8xQQoDNmYHAwM2XBkQDndcGRAOdxQsAAMAFP+pAfUDDQAGAAwAUQAAExQXNQ4BBxMVPgE1NAMHFAYiPQEiJj0BNDY3Nj8BMhYVFAcOAQ8BFBcRLgMnJjU0Njc1NDYyHQEyFhUUBiMiJjU3NCYnFx4EFxYVFAarRB4iAnwhJUYBFSRagRcRIRsLHC4JERMCAVILKyAkFy9tUxkgSmYpIA8dBCcYAQIIJyY9Dyl0Ai80JbEJLBL+39wOOSVD/v4mDxISMFlLASU3DRsCARsYCgcLIAsLSQ8BAwUSEBYUKkVbZw0jDREWJjkyJDAMDB8gHwPRAQMSEygTM0NpeAAABQAe/+oCJwLNAAMADAAWABoAIwAAACIQMhYiJjQ2MhYUBwUGIjU3ATYyFQcEIhAyFiImNDYyFhQHAeJqagh6PT55PSL+Zwg7AwGyAz4B/q9qagh6PT55PSIBLf7nI0rEUlK7LxgTCwgCwg4JBR/+5yNKxFJSuy8AAwAf/+4CPgLCAAoAFgBGAAABFjI3NjU0JiIGFBMyNy4CIwcGFRQWAzY0JyY0NjMyFxYVFAcGFRYXNjUmJyY1NDIWFRQHFhceAQcGIyInJicGIyImNTQ3AQICCAQtFiUWLC4lLWAGAgY9QyACAiJRQRsaMWQCOVgQAg8CUhk5MR0JAQ8wGikSBxA/SmaFjQIOBgQrLRUVHjv+DBNK0AoDOmVAVQF5AgYEPnRKChM3SVwCAoaQLjcmEgMDDh4haFJGBQMRBhQQBxInaWOFcQABADICDwCQAsgAEQAAEhYUBg8BBisBIjU0JyY1ND4BfBQSCgkJBAIJGQgjGALFEi9DERIPB0A7EwIPEgEAAAEAKf+jAQMDEwAeAAASFBYXFh8BFhUUIycuBDQ+Aj8BNjIVFA4DiRcRIxwLBQoTCBlAMSgmNjcTExEQDQ8nHgGspJIuXiQPBgUJBgQQRVihvqBbQAwLCAcEEBVLWAAB/9//owC5AxMAHwAAEjQmJyYvASY1NDMXHgMXFhQOAg8BBiI1ND4DWRcRIxwLCAcaDSsjKg8lJjc3ExMLEgoPJx4BCKSSLl4kDwsEBwgGJShJKmPnoFtADAsGCQULFUtYAAEAFAIDANkC1wA/AAATMjQmNTQyFRQGFDI3Njc2MhYUDgEUFxYXFhQGIiYvASYjIhQfARQiNTQ2NCMiBwYiJjQ3PgE1JyYnJjQ2MhcWaAMLLQwGBxMYAw0QFzIJFSIHDQwICAsWCAQGBi0LBAkqAw0QCiIbBBgiCA4MBSYCgxsqAQ4MAjEWBg0YAxYRBRIIBAsIAhIXBwcMFBQYGQ4MAS8XKgMWEAQHEAMFDAgDEhYFKQABAB4AegHoAkMAIAAAPwEjIjU0MzI3NjU0OwEyFhUUBzcyFh0BFCsBBhUUIyI14AG0DytnMQE0BAIHAbcHCCieAS4Tq5UULAE6Wy0IB340AQcDAzY4ZSkPAAABADL/nQCnAGEAEgAANxQGByI1NzY/ATQnIyImNDYyFqczHwcCFwUBDgUXERdCHCo3UAYDBhckDBECFDQZGQAAAQAsAN4BtgEbAAoAABMwJTIVFCMhIjU0UwFWDST+pw0BGAMLMhQmAAEAMv/vAKcAYQAMAAAXByIuATYyFhUUIycmcxgYEAEaPh0NBQcBARQ3GBcaQQMNAAH/oP/BAcYC7QAKAAAHBiI1NDcBNjIVFBsLOgMB3Qg+KhUMBQQDCA8IAQAAAgAe//AB+QLNAAMAGQAAACIQMhYGIi4DND4DMh4CFxYUDgIBddPTF05vWjEeCAoeM1hxUjIgBwwHESMCif2rJh4rQWJYd2RpRi0iP0QuTntQWUMAAQAE//EA3QLQABcAABsBFAcOASI1NDc2NScmIwciNTQ2MzIUBtQFAQFOPAUSBAYxFBGnIhAJAab+tzANGBcPCC6Qq5k0AgsZcCmsAAEAFP/sAcYC0QA+AAAFJyIHBiMiNDY3Nj8BPgE1NCcuAQYHBgcGHwEWHQEUBg8BIiYnJjU0NjIWFRQPAQYHBhUUFjMyNzYzMhQGBwYBKZ85JAcFDSYbOSoTN0MxCygkCREBAhIFFSAQER4pCA+BpnJZFIYqDyc4jSoFBQwcGxMKCRADQ10oVy0UO3JDPxEEARAMGRUkDAQJEgEbHwICFhEeHlVgVk1oTxFySBkRCwUuA0RNEAwAAQAb//ABywLJAFAAABMiPQE2OwEyPgE3NjQmJyYiBhUUFhUUBiIuATU0NzYzMh4CFAYHBg8BBhQeBBQGBwYPASImNTQ2MzIWFRQHDgEPARQWMzI1NCYjIiMHhAcDIRQkNRwIDBIOFjguDCItIgciPW8XRS4mGRImHQwGDRMyJh8wI0c3GF9oNy4ZKQkPEAEBKCBoWEcGBhcBYwUCQBghFyE9JAcLKiMPHgMPDx4dDzEhOhEbPE07ESMHBAQHAgUZJklvXRUsAgFPQTJOFhULBAkhDAwkLatHQAIAAAIAAP/xAdsC0gAPADQAABMXMjc2NSc0IwcOAQ8BBhQXJwciNTc2NzY/ATYzMhUGHQE2PwEyMzIVFAYPARYXFAYiNTQ2jVMsGQMBBwwfRRMTBJpWtBYCQJcwKQ0aMxsQDQ8XBwIIIhIOAghPRwwBHwIBUj5iDQYibicmCRJoAQIUC57JQS0NGxCNkn8BAQIFEUwIA3EnGhgQAkwAAAEAGP/vAcgCxgBHAAABJyIHBgcUMzI3NjIeAhcWFRQGKwEiJjU0Njc2PwEyFhUUDgEPARQWFxYzMjY3NjU0IyIHBiI9ATY3Njc2MxcyNzYzMhUUBgFtY10EDgIHAgQkXksqHQYIc2oDXXMVDx8ZChcqFhABAhIOFxAjLwkNYDskBUwWDgMLKTNzXBMEBQovAk0HGUIzCgITHDAxHjAgao1ISSM0DBkCARUVCBEhCwwbJQYLLyQ4H6s2ERAEgdsJAgICCAIKHFMAAgAe//MB0wLPAA4APwAAACYiBgcGFB4BMjY3NjQmAyIuAScmND4DMzIXHgEVFAcGIyImNDY1NCMiDgMVFjMyNz4BMh4CFxYVFAYBQSg7KAgLDCo8JQkRBFE6VS8NFgsjN2A/KDYgKgwXJxYlEkEFDygeGQEFAQQMRkxAIxgFB28BRykpHzFGQTojGzM8Jf7rJDcqRKdsdlQ2Egs6KxwTJRwbGhE4AhsvaEgIAg4bGiwtGSsRa5QAAAEAHv/uAZACwgAjAAATFzI/ATIUBwIVFBYVFCMiNTQSNTQnJiIGBwYPAQYjIjU0NzaHmDQhCxENsg83YtsIIjVCEyYKBQcIDCIUAsEFBAJMHf7j8i8aARIligGgEAgCAg0KEw8HDBKWBwUAAAMAD//yAeECywAPAB8ARAAAJSYnJiIOAQcGFRQXFjMyNgI2NCYnLgEGBwYVFBYzMjcDIiY1NDY3Nj8BNjUnJjU0NjMyHgIUBgcGFBceAxQOAwFjBUYgDxEZCxwKFUQ2Mi0WDwsVNycIDVYTBQUqY4EdFSkmDgYFanlUJEguIzQoCAYQMyEcBBouYLpVLxYJFxAmQyAiQVQBT0QuJwgSAhQQGhksRwT+KGNaK0sXLBAHAgQGLGhSWhMcOVRSGgQFBQYnKUY2JEo3LAACAB7/8gHUAs8ADgAyAAASFjI3NjU0JyYjIgYHBhQnNDc2Mh4BFxYVECMiJyY0MzIWFAYVFDsBMhEmIyIHDgEjIiasKkEVIwkUPB0oBwx/TTqDVjEOFv8rL11SFSEVRAF5AQUBBAxGJFFeAZQwGipJIihQKR8wRAOIRDEiNSpDbv5VDhy2HR4iCj0BDwgCDhttAAIAMv/vAKcBwQAMABgAABcHIiY0NjIWFRQjJyYDByImNDYyFhQjJyZzGBgRHD4bDQUHGBgYFBo+HQ0FBgEBFTkVGR47Aw0BYQIWNhcWWwMNAAACADL/nQCnAcEACwAeAAATByImNDYyFhQjJyYTFAYHIjU3Nj8BNCcjIiY0NjIWdhgYFBo+HQ0FBhgzHwcCFwUBDgUXERdCHAFgAhY2FxZbAw3+yjdQBgMGFyQMEQIUNBkZAAEAHgBUAYcCOAAaAAAlIicmLwEmNTQ3Njc2MzIUBwYHBhQXFhcWFRQBagcHDthIEBOllgcGDhOiSgkHuy8QVAgQhi0NCxMPf1sFNw9jPQYNBHAnCRUyAAACAB4A8wHVAdUACgAWAAABMh0BFCMhIjU0MzclMhYdARQjISI1NAHFDyj+gQ8rAQF8Bwgo/oEPATYKAzYVK58DBwMDNhQsAAABAB4AUgGHAjYAHAAANwYjIiY1NDc2PwE2NTQnJi8BJjQzFxYfARYUBwRJBwcMChMwhzAHCUJ/KxMODYGMLhMQ/uRaCB4NGQ4mUh0EBQkFNlAaDzcFTWojDSANrwAAAgAe//MBngK+AAsAOAAAPwEyFhQGIiY0MxcWAjYyHgEXFhQOAQcGFRQWFRQjIi4CNDc2NTQnJiIGFRQXFhUUIyIuAjQ+AbYYGBEXQxsNCwtGVGpIIgoNKDgcRBwUCS0bFg+iCRFhMxYIGwwqGxYDF1UBFTUZGlgICAJHIh8oGiJKUDYXOioYKAEJDxQpKgpzfSAbNkw3JhsJAwsPFjEnFTYAAQAo/18DaAJXAGgAAAEHFBYyNjc2NC4DJyYjIgYQFjM3MhUUBiMiJj0BNDc2NzY3Nj8BMh4DFxYUDgIiJjU3NCYrAQ4BFRQWMjY3FhQGIi4BJyY1NDc+AT8BNjQmIgYVFw4BDwEiJjQ2NzYzMhcWFxYCaAMYQywKER0sPjYeJyKcs4yGIgdAJpipNzRLTUA/Iw9PgVA8HQgLGTNbhzsGBQICMVIYIRkCET5DMBcGCUwkegsHAxs1IQYBGAsLGyYjHDU2IyRHBAEBLKNIPTQoRX5mQDAXBwm//t+qBAcTIbSTAYtcViosDg0BASM1ST8jMFhqXDg8QZQEBAI1KhYeDgECQykWHRIZFFYzGR8ECBAyFx0XFwgKAQEeNSoJEgoVPRAAAAIAA//pAkMC2gAKADoAAAEGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBIk8jAYspBAERFBRoFgocFSIYLi4mOgsiEy1HYBlJKAoaIww7GQZVLRgDEhIGBAQH0QwFHAI9Y2MBBAN7Wf4VBAsjMAoRRYtvFjGecx40Eir+93LzFAQGDxoLBieTLy8YBQEzTCMoAAACABf/6QIAAswAIgBLAAATFwcWMjc2MhUUFjI2NTQnJicmIyI1NDcyNzY1NCMHBgcVBgM3NhI0JicmNDc2MzIeAhcUBwYUFxYXHgEVFAcGBwYjIicmIwcGByKxAQQBBAEUOx01MQgQLCBICBQbHjxsHxICC5MCCg4JFAQMUo0jUjUrA3gGBT4qFSInID0iKmkcAQIEFWMOAcJ9rQQCHAwmKUg8FBw4Ew0LOAIOHFdeAgQLAyj9pwsSAQHfhx4FDgUgExw6KJEWAgUDCigTUDRDPDEVDEMDBEYDAAEAGwACAecCywA1AAAlMhQOAQcGJy4BJyY0PgIzMh4CFRQHDgEjIicmNDc+ATU0JyYiBgcGFRQXFhcWMzI3Njc2Ac4TJDMga10vMg8XHj5ySyBFLCIWCiweLhMIDQ4YChNIOw8eFxwrGyM7LxQNBeVgTCoNLzEZRTBInop9TBUfQCsuJREbKRAmAwQkGBMOGUIyZFRUMz8VDTUVHQkAAgAf//QCAwLLAAwAKAAAEyIGFQYQBxYzMjY0JgEmNTc2ETQmLwEmNDc2MyARFAcOAiMuAicG8BIaDAETKEdIRv72DwMZEQUFBAxOfwELLxMyUTEKHz0LJQKIDAkq/l8ZHp3tjf1tAgcMNgFPoFALCgQPBR/+rIVuKj0pAQQaFTMAAAH/8P/yAdACzgAxAAAlFAYjIiY1NDcjIjU0NjsBPgI3NjIXFhQjIicmIyIGBzYzMhUUBisBBhQeATI3NjMyAdBZUIB5AjgIIhQTDTtBJz6IEQgHAQgaJ1VfEEyCCiAUrAEdT34rBQQIfEZEqokWKgYRMEhuPBIeFgs7BAx4XgEHEDEMUVk+HAQAAAEAA//nAa4CxgAzAAA/ASMiNTQ2OwEmJyYvASY0PgIyFhQjIicmIgYPAQYHBhUzMhUUBiMnExQHDgEjIjU0NzZIBkMIIhQVAgIEEAUEFiuMpQ8HAQYQQkwUEwgECKIJIBR3BwcTWx4IAQy0sQYSL04iPSEKBQ4KDhcYMwEEDAYHAgw7cgYSMAH+1BYKGRkKBQMRAAABABv/7gIBAs0AOwAAATQnIyI1PgE3NjIWFxYUBhQWFRQOASMiJy4BNRAhMh4BFRQHBiMiJjU0NzY0JiMiBgcGFRQXFjMyNzY1AXkcRwgGHgocgCAEBAcIOHFEW0M0JwEjMU47ChI+IiMNEygWMEIPGVMfIj8EAwEmFwIFHSMCBAEDBQ2ZeR8EECUcPzJ2awGNFT0wGRo1Ix8MAws1HUU4ZGiqOBYXH0EAAAEAD//uAgoCzABCAAATFTM1NjQuAzQ3NjMyFRQHBgcGFRQXFhQHBiMiJyY0NjcjFBcUBiI1NDc2ETUjIjU0PgE7ATQvASY0Nz4BMh0BBsaxAQICAwILMDslAhMFAxIDCCU7JgUDBwKvDlw8AxM7CAgdEgsXBAYLD00+DAG7DgIYSTcmHA8MCCANAQpfqKgMmzwICwcYGg47epjkXBgfCQYJKgEoDQYCGyTFHgYFDwUJEg4DaAAAAQAo/+4AzQLJABYAABMQFxQGIjU0NzYREC8BJjQ3PgEyHQEGvg5cPAMTGAQGCw9NPgwBu/7KYBgfCQYJKgEoARgfBgUPBQkSDgNoAAH/6v9vANACyQAZAAA/ATQnJjQ+ATIVBwYUFhUUBgcmNTQ+BEsCFwsbTjwCDAx9VhEJDCAYFLnK7R8OCw8SDg1szv48UXUFAgoHCAwyP3AAAQAX/+4CCwLMAEYAAAA+ATIVFA4CBwYUHgcXFhUUBiInJic1NCcmJyYjBw4BDwEUFxYVFAYiNTQ3PgE0JyYnJjU0NjIVBwYVFDI+AgFMNSJoFiZ5PQILFDUqJwYGGREFWEUFBQIeGhUQAQsYHAECDAJdOwMKCQQGDgtnPwENCQwXPQKFOQ4NBQwadE4CBwIEGylVSzxwCwQGEBscHnEoaS8pBQUFHDQMDY1kDAIWIAkGCRb3yz9fEw4EDhoODWx7ChIgVAAAAQAR//kBtwLUACsAACUnIiMHIjU0Nz4BNCcmJyY1NDYyFhQHBhAXFBYzMjU0JjU0MzIeAhUUIyIBNDkMDLYPAwoJBAYOC2wvDAQKCCYcYgkOCyUYFB0zAQEJCgMLF/bLP18TDgQQGAUQK3/+r2ULEJcqFAMKFiFHMHcAAAEAGf/2AqMC1ABIAAATJzQmNTQ2MhcSFxYyNzY3PgIyFRQOAQcOARUXFBYUBwYjIicmNBI0IyIUDgMHBiMiJyYDJyYjIgcGEBcWFRQGIjU0Nz4BNgUUh0cDPysFCwRDMwQgT04GBgQJBQITBx8/KAUDDAgBBhlKPAMLHw8JIFIcAgIFAgQOAUI1BQ8JAYW9LTQCFhgR/udtDAm9uQwNDBABHSoeRbNaaUg9CQYZGw49ATqPAQI87M0IGwuUARNbBQdB/oMyAgQVEwwBDzPCAAABAB7/7AH2As8AQAAAASc0JyY1NDYyFRQHBhEUFxYVFAYjIicmAi8BJiMiBwYUHgMVFAYiNTQ2Nz4BNCcmJyY1NDYyFzYXFhIXFjMyAZkBDAJEKAIXFQRcEx4LFmMlJgIDBAUFAwQEA0I1BgQKCAMFDQNqOwUOAx1pKQUDBQE5d7E6BwQRGAwBCnv+9LdQDQEVGw4cAQNwcAUHXbpkNB8OAxMVDAYSDiO57TZYHgMFEB4BARFp/uRLBQACABT/7wIeAswAGwA5AAABIgcGFBcWFRQGByIVBhQeAzI2NzY0LgMHNz4CNzYzMhYXFhUUBwYHBiMiJjU0Nj8BNjIeAQEkJBgqJAkoHQkBBA8ZL0s8DBYUGyYawwQKLS0cJRxDYRkuZDE7JSJ9dhoODQQSCQUCghoujQ4DCh4pBAcLKTFDMSM8MFSbdj4mCWMGLkMhCQw+NWWA12IwEQurg0x/GhoJAwMAAAEAGv/uAfUCzQAxAAABMhY7ATI2PwE0LgEnJiIGDwEGFB4BFRQGIyI1NDc2ETQnJjQ+ATMyFhQGIyInJjU0NgEBBBYMASIoAgMXHhQZNyICAQkHB1grFAMTHQYdhkt2d2FOGRkyEAGjEDYbGyY3GwcKCwUGh9WaUwQZHgoDCywBbdcfBg0QFYCxggkSOQwpAAIAEv/FAh8CzAAhAEkAABMGFBcWFRQGByIVBhQeAzI3Ji8BJjU0MzIXNjU0JyYiBzc+Ajc2MzIWFxYVFAcWMzIVFAYjJy4BLwEGIyImNTQ2PwE2Mh4B5CokCSgdCQEEDxkvPhoXGQgDFCkrJkMdQpAECi0tHCUcQ2EZLmYvLQ1KKiANEAIHLzF9dhoODQQSCQUCXi6NDgMKHikEBwspMUMxIxI0FgcEBAsrTn3KQhxZBi5DIQkMPjVlgNdmNAkQJQMCDw0cE6uDTH8aGgkDAwABAB3/7AIdAswATQAAAQYUHgEXFhQWFxYfARYVFAYjIiY9ATQnJisBIjQ2MzI2NzY3NTQmJyYiBwYVBhQeARUUBwYjIjU0Nz4BNCcmJyY0NzYzMhcWFRQGBwYHAWwLMCsJDg4KFBEHBmIbNR00FBwBCRUIITALFwIYEh4+FBwJBwcHKVgPAwoJBAYOCwtAqIdDJB4WKiUBewMHEiYbKV49ECIIBAQGDxdVZzdXGAkjJBkSJhsNJTMKEAUICYPzgU8HDQUmCgMLF/bLP18TDgsGHkwqPyY8ECAHAAEADf/rAe4C0QBAAAABNzQnJisBIgYHBgcUHgMVFAYiJj0BNDY3Nj8BMhYVFA4BDwEUFxYzMjY1NCcuAycmNDc2MzIWFRQGIyImAVwEJBwPAR4sChUDRGFhRJvFgRcQIRsMHC4aEwECOBQMN0M0J1sgJBYwJ0aMSmYpIA8dAiofLg0JEw4dICY3KTBaP3t6WUsBJTcNGwIBGxgMECALCz0UB0IzPSYcJhAWFCqPMVk5MiQwDAAAAf/o/+wBlQLbACgAABMXMjc2MhQHBiMnIgcGEBcVFAYjIjU0NzYSNSc0JyYjIgcGIjU0Njc2bJBgKgYJERkvNwgCBw5fKhQDCxECBhUbNhoHDRkOIgLICBcEHCAxAQmT/qtWBRkeCwMLFgF+YW0GAQQWBQgMKg8kAAABAB3/7QIHAssAQwAANxM0JyYvASY1NDYyFQcGAhQeAhcWMjY3Nj8BNjQuAzU0Nz4BMhUUBwYVFBcWFAcGIicmLwE0IwcOAQcGIi4BJyYzBwMFDAQFZEQBDgYGAQkHEkItCxcFAgUCBAMCCxFHOAUWGAQIHmMEBQEBBAsTMhchPz8fCg2uARlBKksTBgQGExcTC2P+8VQ4CRkKGB4WLyIPR8I8Jx4RAQsHDRINAh+I8rNMDAkHFxkNJwwJByArCAwhLB4rAAAB/+j/5QIaAtIAJwAANy4CJyY1NDYyFxYXEhcWMj4CNTQnJjU0NjMyFRQOAQcGIyInJieHBjQ2JQpsOwYSHDkbBhITITg+BXQvH0hkK0QSCQgeKuoW8pAYBQgTGBElgf7yRg4jQaY9XicGBxUqHVrty0pzDiuaAAAB/+j/5QNLAtIAVAAAADY0JyYvASY1NDYyFx4DFxYXFjI+AjU0JyY0Nz4CMhYVFAIGBwYjIicmJy4BIyIHDgEPAQYiJyYvASYnJicuAScmNDc+ATIXFhcSFxYyNz4BAX0NEBwUBgpaOQUMHRUMChMTBhETITc+BQcHGk4+DHOBIBEDCQgiKBIGAgUEI1YaGQoUCBsnDQQONRwQFwcLCAxSOAUUGzkbBRIHCTUBfDUtPWYTBwYIERgRJYxlNitQMw4jQaY9XicGDgcFERsRFmH+v/UfDw45pk4UClGbJSUODTOSMg4+7TshFAIFDwcJGRElgf7yRg4PCXkAAf/3/+0CVALPAD8AAAAOARUXEhcWFRQHBiIuBScmIgcGBw4BIjU0PgI3Njc2NScmJyYnJjU0NjIeARceATI3Njc+ATIVFA4BAg8vbQJ5WQs3IDMVFhEbFSYQAwgETSgFTlgNEDMbR0gDAk4+Dw0KZjkWGQ4jDAcDPSoHQVANDQJ1PKcPB/7oLgQIEhQLChobOC9WIwUGgnMWHw0FCw87JWOTBgQHv0EPBAYJEhskPiNZFgVtXRMOCwYLCwAB/+f/5wI2AtAALAAAASc0NjIVFAcOAQ8BBhQeARUUBiI1NzY1NC8BJicmLwEmNTQ2MhcWFxYyPgIBhgRcWAonbyQkEgYGXDsDEQoDQDgwFgkKaDUJWjIDCw8eMgKKJRIPDwcKKbpJSCZbWT4FGR8LDVt9Hy4NrVJJDQYGCBEkELx0Bhg0hQAAAf/+//gCAwLEAD0AAAE3MhUUABUUMzI2NTQmIyI1NDYzMhcWFRQHBisBJiMHJyY0NhI3Nj8BNjU0IgYHBg8BBgcjIiY1NDc+AjMBUpwR/sBQOlwsHQ9BJhIUKTcLCgRDTchLEiepGDYeCwJWRxcvEggJBwMGCRICFDM1Ar4GEiL97SUcKy8dHhAhMgsWR2xWEQQFAgIZVQEcKmJEFwYCCxgRIx0MEQIHBWc9CA8CAAABADL/pgC7Aw4AGwAAEwM0Nz4BMhQHBhUGFR8BFB4BHwEWFRQiLgE1NjQCDA1YGAQqBQEDARUKCwQQOj8CAVkBWw0RECwJBDAhrr+ZjA4aKQ0NBAMGFi0Z3gAB/9H/wQH3Au0ADQAABSImJwA1NDMyFwEWFRQB2QwUB/4fFSYIAeADPwsKAw4BCAv89AQFDAAB//v/pgCEAw4AGAAAEwMTFA4BIjU0NzY1NzU0JzQvASY0MhYXFoQCAj86EAQqBQUfCwQYWA0MArT+pf6pGS0WBgMEMSH5Rb+uHScNBAksEBEAAQAoAMQBBQE/ABMAACUUIicGIjU3Njc2Mhc2MxcWHwEWAQUQXl0SAiEkBBMREQsMHh0KAc0JPz8ICD8nBQ4OBR42EgMAAAEALP+7Abb/+AAKAAAXMCUyFRQjISI1NFMBVg0k/qcNCwMLMhMnAAABAIICAwEIAoUACgAAAAYiLgE0NjMXHgEBCAUJXBwnCQwPOwIKBzsVFR0FDlwAAQAL//MBiwHEADoAAAEHFBcWFRQiJyY1NzQjIgYVFBYyNjcWFAYiLgEnJjU0Njc2NzY1NCMiBhUXBg8BIiY1ND4CMh4DAWwCHQSBBAEECDBUGCMXAhE+RDEWBwdYRVsEAzYXJAYCIgseIxUgQz4iOycDASyAhRsEBQ8mCRygBzYqFh4OAQJDKRgeExcRRlQSEg8LGjUdFhgRAwEeGRAnGBMEDyovAAEABf/rAZQCugAwAAATByI0NjMyHgIVFAYjIi8BJicmNRM0LwEuAS8BJjU0NjIXFhUHFBcWMjY3NjU0JyboFxIxJhUwIBmDfCQjCg0CAwYEAgITCQgHZC4BBwUJAT0sCxQIDgFZBkMpGSVPNXqYBwIEChVOAURLKA4cKAYFBAUPKQw9cfCdPA4iHDM+HSJCAAEAGf/vAWgBxgAtAAAlFAYjIiY1NDc+ATMyFxYVFAcGIi4BNTY3NjU0IyIOAhQeAjMyNzY3NjMyFgFlWz9cVi0WUjdTIg4oEBsRHAEQDzAMIRYTBREvIyogDQgEBgkJczlLb19lTiguOBcfMBgJAxgVCwcJFycVIUdBITkkIw4UCCEAAAEAGf/yAY0CuQAzAAATMhYzNycuAS8BJjU0NjIXFhQGFBcWFRQjIjUmNDY0IgYVFDMyNjMyFhUUBiMiJjU0Nz4B5hIdAQYEAhQICQZdNAIFCQ8EK1ICDWM0PgkRAggJNic8PS8YUgHBCQVtHCgGBQQFDygLIr+46R4HBg8nEEO3Y3Q6ewcUCiIvaU5jVSozAAIAFP/tAWEBxgAOADEAADcXFDM+ATc2PwE0IyIHBhcUDgEHBiMiJjQ2MzIXFhQOAwciFRQWFxYzMjc2NzYyFn0BCCAwDBgCASsgFCHaHycaIR5UUGNjWiANBBgoVjoIDQgWKyseEAoEDQj+GQYDGxElGww2HCzPJjkbCAp+w5g/GCsZMigkBgcJIwwcHA8WCBYAAf/2/zwA7gKrAC0AADcXFAYHBg8BIjU3NhE0JyIHIyI1NzY7ATU3ND4CMhUUBw4BHQE2NzIUDgEnBqAFIRgxJREPBUkBFRUBCwMBDSQCBSZKNQkdJTMQBxUfFwL6yD9hGDMHBAkPZQGLJBIDCyYJQ18HESMdEAYECVVmHAIDGCMBAUwAAQAR/sABgAHWADoAABI2MhcyNzYzMhUUDgEHDgEVFxQHDgEjJjQ3PgE1LwE0JyIGBwYUFjMyNjMyFAYHBiMiJyYnJjQ+A3ZIQiIEAhoyDAQGAgcBAzQVVTkNCz82AgMcJDEJEB0kChEDCgYJFDo6GRoEBgEJDyABqh8PAhoLARAfFjmKRdJlQxsoCBAFHdndjEQJBC8mPVlECCgZDyEqKyIzIBM5Mz8AAQAI/+sBnAK5ADYAABMHFDI3NjMyFxYUBhUUFxYVFCMiNTQ2NCYiBg8BBhQWFRQGIyI1NzY1NC8BLgEvASY1NDYyFxafAQgEGTZbIw0JHAUrdCgiPCMEAwEKTiYOAhYGAQITCAkHXjMCBAIZYQYDET4XTIYcYiAFBQpsKphIJxoODRPMPQQdLRATqMRMThYcKAYFBAUOKQszAAIAGf/qALMCeQAMACIAABMnIgcGIyI0NjIWFAYDNzQnJicmNTQ2MhcUBhQXFhUUIicmhRgbCAIDDRtDGBJnCxMGCAZmLwELDANMKAoCFwENA1kYFzYV/gfpUx4KBQIGEiIMFLvOGQUFDRQFAAL/uv6/ALMCeQAMACUAABMnIgcGIyI0NjIWFAYXBhUGFRcUDgIjIjU0Nz4BNTQnJjU0NjKIGBsIAgMNG0QXEhQJBAEfK1c6EhBGOyQKaC4CFwENA1kYFzYVX1Ftk2pPNFk4Kg0HByHmpegWBwURIgABAAX/6wGWAroAPwAAEwYUHgEXFh8BFhcWFRQjIicmPQE0JyYiBhUUFhUUBiMiPQE2ETQvAS4BLwEmNTQ2MxYXFhQHFDI+AjIWFQcG9gQlLAsVAgEFJgUcVBcMFwwjJghPIw0YBAICEwkIB2AjEAEFBggRK0ktLAs5AUQECQgkFSkfDXUrBwMLIw5JGV0kET0VVEIBHSAQBHsBCVc8FBwoBgUEBRAoAQso+UoMFzJCFgoHFQABAA//5wCtArkAGAAAEwMUFxYVFCImNTY1Jy4BLwEmNTQ2MzIXFqUGCwM6RxQEAhMJCAdXKRACBAI8/pGsIgYGDB0XjOqZHCgGBQQFDikLGgAAAQAe/+gCZgHMAEkAAAU2NC4CIgYPAQYUFhQHBiMiNTY1NC8BJic0MzIXFjI3NjMyFhcWMjc2MzIXFhQGFB4BFRQjIiY0NjU0IyIGDwEGFB4BFRQGIyIBAA4CGhMiIAMEAwkIIj4WFAMEAQMfLg8BBgshOCA+DAEEBCpDWSEMDA8PHEU2JUAbIAMCBAQERiERBkb9LhwEHxAQHs41EgkkDXi6RRggCw0MIgQIGhgUAgQqQBlMjEo8GgINOFubJ08gEBAugkkpBBweAAEAHv/oAYwBzQAoAAAXNhAnNDMyFxYyNzYyFhUUBhUUFxYVFCMiNTQ2NTQjIg4BFRQfARQGIh4SCR4uDwEIAh+CTA0bBBx8JkIgIQQHAkk1B2wBLi0NIwMCIEI/JowiUSQFBQ1uKpYnUCYxRGhNFhwfAAEAFP/sAZUBxAAzAAATDgE0NzYzMh8BFhUUBw4BFRceAR8BFAYjIi4BJyY0PgE3NjIVBw4BFB4BFxYyNjc2NTQmgBoXBkCYNB4KDAcbMgYgIwICbl8wRiEKDBsjFhwiBhYTEBQNEyooCRJVAXkBAQwGOwkDBQYFAwgjBwcSTh4fY4AiKxslT1AmDA8HChpUQUAfCAwhGzI1VFwAAAEAD/7PAYUBxwAvAAA3NjQnNDIWFxYyNzYyFhcWFRQHDgEjIjU0MzIWMzIQIyIGDwEGERQWFAcOASMiNTYoAgkoHQYQBQ0nX0cPGxsPOidNCgITCUdMFR0EBA4JBhREGgoQmWWCOwoKBhAJGTAnQ0tKSigzWRgJAS0TCQpa/v90ZRQIGikNZQABABn+1AGnAc0AQgAABTc0IyImNTc+AT8BNjU0JyYiBgcGFRQzMjYzMhQGIiYnJjU0NjMyFxYyNzYzMhUUBwYVFB4BFRQHBhUUFxYVFCIuAQELBgUPHQQUGAIBCA0HNy4KFEEKEwIKLFYzCxVvYSgUBwYCICgQBRAQIAUsFQMfNDDKcAYSDQgMJQwMzQl2Fg0pIT00dQk+NCggOkJroxAFAhwKAyBovQUCEAoEAxxKv0cGBQgRLwAAAQAe/+8BVAHIACcAAAEXFCMiNTQ2NCYiBg8BBhQeARUUBiI1NzYQJzQzMhcWMjc2MzIXFhUBTwQkSQ4UJhsDBAYEBD4+BQ4KFTYSAQULIS0cHDkBDCMTNw0uIhkbDg4fkVMfAxkfDR9XARgyDCUECRsLF0kAAAEACv/rAU4BxQA3AAAlFA4BBwYjIiY1NDc2MzIVFAYUFjI2NzY1NC4CNTQ2MzIWFAYjIi4CIg4BBwYVFB4EFxYBTiEqHSYfQVYSHCcMCSMyHgYJOkY6W04iSw8LBgQKJhsJFgkXDggUCBwEaokrQB4JDDM4IRUfCwEdLCIRDRIQHSoYOCpISBMtJgkMEwEFBQ0ZEA8ICwQNAjIAAAEAD//jAO8CTAAoAAATNzY7ASc1NDYzMh0BBgcyNjMyFAYHIwYUHgMVFAciJjU2NSIHIyIPAwENIwRGHQkEBCwYAQcWDSoBAwQFAw0nTRUbDgEJAYYoCVAEFyoIARtwBBglASKhaDUgDgIKARYbqMECAAEAHv/uAYAByQAuAAABBhUUHwEUIyInJiIHBiMiJy4BNTc0JyY1NDc2MzIVFAYUFjI2PwE2NCY1NDYzMgGAEgoEFk0LAQcDH0EkJxgeDw4FBRAZYSkhOyIDAwQLUCAPAb1sp3snDQ0rBQQpEgs3KNtFHQsDBgIFUBmySygqFRUjsC8GGR0AAf/2/+QBfgHFACcAAAAyFRQGBwYHBiIuAS8BLgEvASY1Nz4BMzIXHgIXMj4CNC4CNTQBKlQvI0g6Dg4PHwoJFCYJCgoFDT0lEQQPFiUMBg8VHwUeJgHFV0CEMmkjCB5mKClYaQgJBQcJDBkTLnycARIeVj0hLAcJEAAB//b/4wJjAcUARAAABQYjIicmJyYjBw4BDwEGIyInJi8BLgEvASY1NDYyFhcWMzI+AjU0LgEnJjU0NjMyFxYXFjMyPgE0LgI1NDYzMhUUBgGPCgULBB4UAQIGG0cWFgoGCwQWHQkTJwoKCVMuDxAqEwYPFSQOGwgSUiEPBg8VGxcIIB8FHiZTLCp8FAcJPGYEBDBSEREJCip5KVhqCQkDBw4gJVXgFR5KHAU/OwQKBwwhEi96nC1WPSEsBwkOLFRp3gAAAQAA//IBqQHMADYAADcXMjc2Ny4BLwEmNTQ2NzYXFhcVNjc0NjIVFAcOAgcGBx4EFRQGIyInJicOAiImLwE0FBQ7OwMFLEELCg5JIBEPHCgvDTJKCQYXSiYCAToWDScjSB8WDBVHPhgkKxsCAmIDZQUHUWAHCAYJDR4CARopVAJQIQ8QDAUGAxJXPwMDaR8UJgoJDicPGXxnIRocDg42AAH/7P7fAZMBywAvAAATFCsBIiY0NjU0Jy4CLwEmNTQ2MzIXFhcWMzI2NTQnJjU0NjMyFRQOAgcGFRQWzwwBIVNMGiEnLQoKC1chDwoSFTMNCTcsCl4mIRwYXx8iEP7rDC48lRkbRltyVwgHBgcOHRgvU6qMK0sNAggSISshWDO5RlRXLi4AAQAA//UBfQG7ADIAABM3MhUUDgEVFDI2NzY0JzQ3MhcWFRQGIycHIjQ2PwE+ATU0Ig4BBwYVBisBIjU0PwE2M/1tDX5dOCoKEQQWNBENWDxyZRJBISFUCzovHgsUAwgBDhIHBBEBuAMLFMSSDwoRDhgoEwwCHRcYNjYDAhlqLy+EFQgOEBcMFgYKESc1Eg4AAQAJ/6YAzAMOADUAABMXFAcGBwYVFx4DFxYVBxcUFh8BFhUUIi4BNTY0LgI1Nz4ENzY1JzQ3NjIUBwYVBpsCIgUMFAQCGQgSAwsCAxULCgQYVhsDBxMjAwQUBg0EAwgDeAMOBCoDAj5vMR4FChIECAIVBxYIGBlvcg8pDQ0EAwYsHxFOljcYIgMHBBIHDgoHE2qZMigBCQQwISgAAQA9/78AgALrAA0AABMDFCMiPQETNTQ7ATIWgAIuEwI0AwMHAtz9DCkPRAI4dC0IAAAB//f/pgC6Aw4AMwAANyc0Nz4CNC4DJyY1Nyc0LwEmNDMXFhUGFB4EFxYUBw4CFRcUDgEiNTQ3NjU2KAIkBBkGCRcKEAMKAgMfCwQKB3gDBQYEDQYKEQMgEwcDG1YYBCoDd28zHwQVBgcJFAkTCRcYb3IdJw0ECQEoMk6WKw4KDgcJDwgDHxg3S5kRHywGAwQxISgAAQAyAOUBDgEfABAAABMXMjYzMhUUBiImIg4BIjQ2fGUUEgEGJyU5JhsQBi0BHwgGBQ8kDgYGECgAAAIAM/8VAL4B6gALAB4AABMHIiY0NjIWFCMnJhMWFAYHBiI1NzYRNCY+ATMyFxCCGBgRF0MbDQsLKgEhFyUuAiYCAhMQIwEBiAEVNRkaWAgI/cYFFBQFBxQMngEfIBMGCxf+nQADAB7/uQFtAgAALQA3AEEAACUUBiMiJjU0Nz4BMzIXFhUUBwYiLgE1Njc2NTQjIg4CFB4CMzI3Njc2MzIWAxcUIyI9ATQ2MhEVFAYiPQE0NjIBals/XFYsF1I3UyIOKQ8bERwBEA8wDCEWEwURLyMpIQ0IBAYJCXgBHQ4SGBIYExdzOUtvX2VOKC44Fx8wGAkDGBULBwkXJxUhR0EhOSQjDhQIIQFvPBYOQAkM/sDuCg8P7woMAAH/6//5AewC1AA7AAAlJyIjByI1NDc+ATUjIjQ2OwEuAjU0NjIWFAcGBzYzMhYdARQGKwEUFxQWMzI1NCY1NDMyHgIVFCMiAWg4DAy2DwMKCXgGGxZNBBAPbC8MAwkCJm8HCB4XbwgmHGIJDgwkGBQdMwEBCQoDCxfwShkfvT0SBhAYBREkb48BBwMDEB6hYgsQiCUZAwoTHUItdwAAAf/t/+cCPALQAEgAABc3NjU0JyMiNDY7AS8BIyI0NjsBJicmLwEmNTQ2MhcWFzM+ATUnNDYyFRQHBgczMhYdARQrAQcGBzYzMh0BFAYrARUUFhUUBiK3AxEBdQ8UF1IFDF0PFBcqNi0nEwcKaDUJWDIVFUUEXFgKQHFOBwgoVwsHBSFcDxcRagxcOw4NW4cSCh8XJh8fF30xKwMCBggRJBCccxmgISUSDw8HCkO8BwMDLBQOIQEKAxMZEEOGBRkfAAACAD3/xgCAAusADQAbAAATAxQjIj0BNzU0OwEyFhEDFCMiPQE3NTQ7ATIWgAIuEwI0AwMHAi4TAjQDAwcBEf7eKQ8UxUUtCAHE/t4pDxTGRC0IAAACABH/9AHCAscAFABVAAABNCYvASYjBw4CHQEUFh8BFjI3NgIGJicmLwE0MzIWMj4BNzY0LgM0Njc2PwE2NScuATQ2NzYzMhUUIyImIg4CFRQXFhcWFRQHBgcGFBcWFRQGAVw2GxsDBg0KHzQ1GhoEDgZeKmhpDxkDAQcELjw8IAkON09PNx0UJScOBAQoKzMoUFtCBwMUQSs1IHNfHSESIlwGBVolAXIUJwkKAQMEDzAYARUoCQkCAzX+xBkBAwYlDAkLDBELESMkIiY3Ni4RHxMHAwIFEiZFOA8fNgoHBAwcFCAiHRgcKRgdOS4DBQMoPiA2AAACAEwCDQFaAmoADQAaAAABByImNDYyFhUUBiMnJiMHIiY0NjIWFRQjJyYBMRUTDhQ2FQgCBAbEFRMOFDYVCgQGAhoBES4SFRQjEQMKAREuEhUUNAMKAAMAKP/lAeIBngAmAC4ANgAAJQcOAQciJyY0NjMyFxYVFAcGFBcWMjY/ATQuASMiBhUUFxYzMjY0JiIGFBYyNjQmFhQGIiY0NgFMBQgaEjAJARobCgYIDgUHCR0TAQEhFwo2MwwVOiIsBZJoaJJnVIGCtoKBkgMREwJACy9MBggIEAgBEggJFwwMGh4EXT0mHTUuLuBnkmhokpOBt4GBt4EAAAEAIgFMAS8CkQA0AAABBxQXFhUUIicmNTc0IyIGFRQWMjYzFhQGIi4BJyY1NDc2NzY1NCMiBhUXDgEmND4BNzYyFgEaAhQDWgMBAwUiOxEZEAEMKzAiEAQGbkADAiYQGQQCNBgCDAscdjMCNGddEwMDCxsGFHAFJh0PFgsCLh0RFQ4QC10bDQoIEiUUDxENAhYWChcJFSsAAgAy/+0CfwHUABkANAAAJScmNTQ3Njc2MzIUBwYHBhQXFhcWFRQjIiYHIicmLwEmNTQ3Njc2MzIUBwYHBhQXFhcWFRQBckgQEpyWBwYOE5hLCQe/LxAVBhbQBwcO2EgQE6WWBwYOE6JKCQe7LxCVLQ0LEhB4WwU5DF48Bw0EcCcKGy0ZIAkPhywNCxERf1sFNw9jPQYNBHAnCRQzAAABAB4AsAHTAYMAEAAAEzAlMh0BFCMiPQE0NyEiNTRJAXYULhMB/poPAYADFpQpDwJAPxQsAAADACj/5QHiAZ4AMwA7AEMAADcnNDc0Mh4BFA4BIyIGFDsBMh0BFBYyNjUnJjQnJjUwPgE0JiIHBhUXHgEUDwEGFDMyNzYSIgYUFjI2NCYWFAYiJjQ27gQDIg4PAhUSAwcDASMKGyMCGCMFGxwwXBgEAgcDAQUBBSANAmCSaGiSZ1SBgraCgVpkPS0IBBMWDhcNDCoTJB4IBQQJYAwCAQgcNR8KAwIEBi9nCj8CBg0BAR1nkmhokpOBt4GBt4EAAQBsAgMBTgIwAAkAABM0MzcyFRQrASJsHL0JGr8JAhAeAgkkAAACACwB7QDoAqYABwAPAAASNjQmIgYUFgYmNDYyFhQGnRsbJRsbFDg8TTM4AhgYMBscLhkrL1Y0L1kxAAACAB4AdwHUAkMACgArAAAlMh0BFCMhIjU0Mz8BIyI1NDMyNzY1NDsBMhYVFAc3MhYdARQrAQYVFCMiNQHFDyj+gQ8rkQGuDythMQE0BAIHAacHCCiOAS4TugoDNhUrPXYULAE6MS0IB1Q0AQcDAzY4OykPAAEAFQD/ARkCvAA1AAATJyIHBiMiNDY/AT4CNCYvASIGDwEUFxYdARQGDwEiNTQ2MhYVFAcGFRQWMzI3NjMyFRQHBrtfIhYGAQg3HBsWGhkWDAsYGwIBDgwTCgo4TmNENX8WI1UZAwMHIQsBBQYKAjVhHx4YJDkyGgEBGAwMEQoGCgEQEwEBOzM6NC4+MG8kBgMbAhA9FAcAAQAZAQUBHQK7ADwAABMHIyc2OwEyNzY0JyYiBhQWFRQjIjQ2MzIXFhQGDwEGFB4EFAYHBg8BIiY0NjMyFhUUBw4BFjMyNTRvFAMEAxMMNREMCg8qGwgeKkwvQh0LJRISBAgLHhcTHRQqIg85PyEcDxkGEgIYFD4B5QEEJiQcLgwPGR4SAhJXKi0SOy8GBwMEAQMPFyxCOA0aAQEwRS4NCAsCCjQbZ1EAAQDcAgMBYwKFAA0AABMGIyI1NzY3NjIWFAcG7gUFCAIbLQQRKAkqAgcECQg2NgUdFQYiAAH//f/qAYYCzQApAAAXFAcmNTY9ASciLgEnJjU0NjMyFxYdAQYRFBcWFRQGIicmNTQ3NCYHBhD8CCwPBjdSKw0To4I3JwYmEAUbIgMFHCwFFQkKAgMXVbIfBRsmGyYsbIMHAwYCqP77n1IdAwoJEEp3+dwIARpp/jUAAQAyALwApwEuAAwAADcHIi4BNjIWFRQjJyZzGBgQARo+HQ0FB8wBFDcYFxlCAw0AAQCT/5AA8f/1ABMAABc0NjIXBhQXFhQGIiY1NxYyNjQmpRwXAhAJHiMiGQUMFAwfKA4PAQsQAwooFAkIBgINEBEAAQAgAQkAowLCABYAABMXFQ4BIjU0NzY1JyYjByI1NDYzMhQGnQMBLyQECgIDHgwLZRQKBgIPxSUODgkFG1FsXB8BBw9DGWcAAQAUAUkBIQKTADAAABMOATQ3NjMyFxYVBw4BFRceAR8BFAYjIi4BJyY0PgE3NjIVBwYHBhQeARcWMzI2NCZfEhAELmklHAgFEyMFFhkBAU1CITIXBwgTGA8VFwQLBwsLDgoMCiUePAJfAQEJBCkIBAQGBRkFBAw3FRZGWRgeExo3OBoICwUHDRYfOC0WBghIZUEAAAIAOv/tAocB1AAbADgAABcGIyI1NDc2PwE2NTQnJi8BJjQzFxYfARYUBwQXBiMiJjU0NzY/ATY1NCcmLwEmNDMXFh8BFhQHBF0HBxUSKpExBwk/fCgTDg2AhysSEP7f2wcHDAoTMIcwBwlCfysTDg2BjC4TEP7kAwktFxAiVh0EBQYJM04ZDDkFTGcgDSANsRwIHg0ZDyVSHQQECgU2TxsPNwVNayINIA2vAAAEABn/6gIsAt0ADgAxADwAUwAAJRcyNzY1JzQjBwYPAQYUPwEyFAYPARYXFAYiNTQ3NjcnIiMHIyI1NzY3Nj8BNjIVBhUBBiI1NDcBNjIVFAUXFQ4BIjU0NzY1JyYjByI1NDYzMhQGAWQxGw8CAQQHJCMMA6QkBRQLCQIEMCoCBAY0HBwlDw0BL3EPBwgQLwr+Wws6AwGwCD7+iwMBLyQECgIDHgwLZRQKBrICAUIUOwgEJkcXBgoDAg0uBQFEGA8PCgEEIkYBAQwGc4wSCAgRClhU/v4VDAQFAs8PCA25xSUODgkFG1FsXB8BBw9DGWcAAAMAGf/qAm0C3QAKAEAAVwAAFwYiNTQ3ATYyFRQDJyIHBiMiNDY/AT4CNCYvASIGDwEUFxYdARQGDwEiNTQ2MhYVFAcGFRQWMzI3NjMyFRQHBgEXFQ4BIjU0NzY1JyYjByI1NDYzMhQGXgs6AwGwCD4DXyIWBgEINxwbFhoZFgwLGBsCAQ4MEwoKOE5jRDV/FiNVGQMDByEK/lsDAS8kBAoCAx4MC2UUCgYBFQwEBQLPDwgN/TYGCgI1YR4fGCQ5MhoBARgMDBEKBgoBEBICATszOjQuPjBvJAYDGwIQPRQHAhHFJQ4OCQUbUWxcHwEHD0MZZwAEABn/6gKRAt0APABLAG4AeQAAEwcjJzY7ATI3NjQnJiIGFBYVFCMiNDYzMhcWFAYPAQYUHgQUBgcGDwEiJjQ2MzIWFRQHDgEWMzI1NBMXMjc2NSc0IwcGDwEGFD8BMhQGDwEWFxQGIjU0NzY3JyIjByMiNTc2NzY/ATYyFQYVAQYiNTQ3ATYyFRRvFAMEAxMMNREMCg8qGwgeKkwvQh0LJRISBAgLHhcTHRQqIg85PyEcDxkGEgIYFD77MRsPAgEEByQkCwOkJAUUCwkCBDAqAgQGNBwcJQ8NAS9xDwgHEC8K/lsLOgMBsAg+AeUBBCYkHC4MDxkeEgISVyotEjsvBgcDBAEDDxcsQjgNGgEBMEUuDQgLAgo0G2dR/s0CAUIUOwgEJkcXBgoDAg0uBQFEGA8PCgEEIkYBAQwGc4wSCAgRClhU/v4VDAQFAs8PCA0AAAIAEv8fAZIB6gALADgAABMHIiY0NjIWFCMnJhIGIi4BJyY0PgE3NjU0JjU0MzIeAhQHBhUUFxYyNjU0JyY1NDMyHgIUDgH6GBgRF0MbDQsLRlRqSCIKDSg4HEQcFAktGxYPogkRYTMWCBsMKhsWAxcBiAEVNRkaWAgI/bkiHygaIkpQNhg5KhgoAQkPFCkqCnN9IBs2TDcmGwkDCw8WMScVNgAAAwAD/+kCQwOJAAoAFQBFAAAABiIuATQ2MxceAQcGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBngUJXBwnCQwPO3xPIwGLKQQBERQUaBYKHBUiGC4uJjoLIhMtR2AZSSgKGiMMOxkGVS0YAxISBgQEB9EMBRwDDgc7FRUdBQ9b3WNjAQQDe1n+FQQLIzAKEUWLbxYxnnMeNBIq/vdy8xQEBg8aCwYnky8vGAUBM0wjKAAAAwAD/+kCQwNqAA0AGABIAAABBiMiNTc2NzYyFhQHBgcGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBNAUFCAIbLQQRKAkqVE8jAYspBAERFBRoFgocFSIYLi4mOgsiEy1HYBlJKAoaIww7GQZVLRgDEhIGBAQH0QwFHALsBAkINjYFHRUGItNjYwEEA3tZ/hUECyMwChFFi28WMZ5zHjQSKv73cvMUBAYPGgsGJ5MvLxgFATNMIygAAwAD/+kCQwNoABMAHgBOAAABFCInBiI1NzY3NjIXNjMXFh8BFgcGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBzhBeXRICISQEEhISCgweHQoBrE8jAYspBAERFBRoFgocFSIYLi4mOgsiEy1HYBlJKAoaIww7GQZVLRgDEhIGBAQH0QwFHAL2CT8/CAg/JwUODgUeNRMDvWNjAQQDe1n+FQQLIzAKEUWLbxYxnnMeNBIq/vdy8xQEBg8aCwYnky8vGAUBM0wjKAAAAwAD/+kCQwM+ABAAGwBLAAABFzI2MzIVFAYiJiIOASI0NhMGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBM2UUEgEGJyU5JhsQBi0MTyMBiykEAREUFGgWChwVIhguLiY6CyITLUdgGUkoChojDDsZBlUtGAMSEgYEBAfRDAUcAz4IBgUPJA4GBhAo/v9jYwEEA3tZ/hUECyMwChFFi28WMZ5zHjQSKv73cvMUBAYPGgsGJ5MvLxgFATNMIygABAAD/+kCQwOBAAwAGgAlAFUAAAEHIiY0NjIWFRQjJyYjByImNDYyFhUUBiMnJgcGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBzhUTDhQ2FQoEBsQVEw4UNhUIAgQGEk8jAYspBAERFBRoFgocFSIYLi4mOgsiEy1HYBlJKAoaIww7GQZVLRgDEhIGBAQH0QwFHAMxAREuEhUUNAMKAREuEhUUIxEDCvRjYwEEA3tZ/hUECyMwChFFi28WMZ5zHjQSKv73cvMUBAYPGgsGJ5MvLxgFATNMIygAAAQAA//pAkMDhgAKABYAIQBRAAABMhcyNTQjIgYVFCc0NjIWFCMiJyYjIgcGBzMyFjY3LgEiAzcyFRQGBwYjIiY0NyMiNDY7ATY3PgEyFxYTHgEXFhUUBiImJyYvASYvAgYUHgEBcQ8SBR0OEB8hOR4NAwMQJi8bTyMBiykEAREUFGgWChwVIhguLiY6CyITLUdgGUkoChojDDsZBlUtGAMSEgYEBAfRDAUcAzEGEC8QDB0aHR4qVgIO2WNjAQQDe1n+FQQLIzAKEUWLbxYxnnMeNBIq/vdy8xQEBg8aCwYnky8vGAUBM0wjKAAAAgAz/+kDTALaAAoAXQAAAQYHMzIWNjcuASIDNzIVFAYHBiMiJjQ3IyI0NjsBNjc+ATMyFxYXFjI3PgEyFxYUIyInJiMiBgc2MzIVFAYrAQYUHgEyNzYzMhUUBiMiJwYjIicmLwEmLwIGFB4BAVJPIwGLKQQBERQUaBYKHBUiGC4uJjoLIhMtR2AZSRkKBxUSAQYEMX6CEQgHAQgaJ1VfEDmVCiAUrAEdT34rBQQIWVAmJi8cLggSEgYEBAfRDAUcAj1jYwEEA3tZ/hUECyMwChFFi28WMZ5zHjQIFGcFBEM1Fgs7BAx4XgEHEDEMUVk+HAQVRkQKExEnky8vGAUBM0wjKAABABv/dAHnAssASwAAFzQ7ARYyNjQmND8BLgInJjQ+AjMyHgIVFAcOASMiJyY0Nz4BNTQnJiIGBwYVFBcWFxYzMjc2NzYzMhQOAQcGByIGFBcWFAYjIsQEAQwbDyUODThTLQ0VHj5ySyBFLCIWCiweLhMIDQ4YChNIOw8eFxwrGyM7LxQNBQgTHiwdLi8FDwwkLRQ0dgcDEBYUEQoKBTVELUaain1MFR9AKy4lERspECYDBCQYEw4ZQjJkVFQzPxUNNRUdCVtIKg4YBRMKBQ8vGQAC//D/8gHQA3AACgA8AAAABiIuATQ2MxceARMUBiMiJjU0NyMiNTQ2OwE+Ajc2MhcWFCMiJyYjIgYHNjMyFRQGKwEGFB4BMjc2MzIBfgUJXBwnCQwOPFJZUIB5AjgIIhQTDTtBJz6IEQgHAQgaJ1VfEEyCCiAUrAEdT34rBQQIAvQGOxUVHQUPW/17RkSqiRYqBhEwSG48Eh4WCzsEDHheAQcQMQxRWT4cBAAAAv/w//IB0ANtAA0APwAAAQYjIjU3Njc2MhYUBwYTFAYjIiY1NDcjIjU0NjsBPgI3NjIXFhQjIicmIyIGBzYzMhUUBisBBhQeATI3NjMyASsFBQgCGy0EESgJKmNZUIB5AjgIIhQTDTtBJz6IEQgHAQgaJ1VfEEyCCiAUrAEdT34rBQQIAu8ECQg2NgUdFQYi/WlGRKqJFioGETBIbjwSHhYLOwQMeF4BBxAxDFFZPhwEAAL/8P/yAdADZAATAEUAAAEUIicGIjU3Njc2Mhc2MxcWHwEWExQGIyImNTQ3IyI1NDY7AT4CNzYyFxYUIyInJiMiBgc2MzIVFAYrAQYUHgEyNzYzMgGyEF5dEgIhJAQSEhIKDB4dCgEeWVCAeQI4CCIUEw07QSc+iBEIBwEIGidVXxBMggogFKwBHU9+KwUECALyCT8/CAg/JwUODgUeNRMD/YZGRKqJFioGETBIbjwSHhYLOwQMeF4BBxAxDFFZPhwEAAAD//D/8gHQA0wADAAaAEwAAAEHIiY0NjIWFRQjJyYjByImNDYyFhUUBiMnJhMUBiMiJjU0NyMiNTQ2OwE+Ajc2MhcWFCMiJyYjIgYHNjMyFRQGKwEGFB4BMjc2MzIBhhUTDhQ2FQoEBsQVEw4UNhUIAgQG5FlQgHkCOAgiFBMNO0EnPogRCAcBCBonVV8QTIIKIBSsAR1PfisFBAgC/AERLhIVFDQDCgERLhIVFCMRAwr9gEZEqokWKgYRMEhuPBIeFgs7BAx4XgEHEDEMUVk+HAQAAAIAKP/uAM0DdgAKACEAABIGIi4BNDYzFx4BAxAXFAYiNTQ3NhEQLwEmNDc+ATIdAQbKBQlcHCcJDA48DA5cPAMTGAQGCw9NPgwC+gY7FRUdBQ9b/rT+ymAYHwkGCSoBKAEYHwYFDwUJEg4DaAAAAgAo/+4A2wNiAA0AJAAAEwYjIjU3Njc2MhYUBwYTEBcUBiI1NDc2ERAvASY0Nz4BMh0BBmYFBQgCGy0EESgJKhYOXDwDExgEBgsPTT4MAuQECQg2NgUdFQYi/rP+ymAYHwkGCSoBKAEYHwYFDwUJEg4DaAACABT/7gDxA1kAEwAqAAATFCInBiI1NzY3NjIXNjMXFh8BFgMQFxQGIjU0NzYREC8BJjQ3PgEyHQEG8RBeXRICISQEExERCwweHQoBMw5cPAMTGAQGCw9NPgwC5wk/PwgIPycFDg4FHjYSA/7Q/spgGB8JBgkqASgBGB8GBQ8FCRIOA2gAAAP/+P/uAQYDRAANABoAMQAAEwciJjQ2MhYVFAYjJyYjByImNDYyFhUUIycmExAXFAYiNTQ3NhEQLwEmNDc+ATIdAQbdFRMOFDYVCAIEBsQVEw4UNhUKBAZ7Dlw8AxMYBAYLD00+DAL0AREuEhUUIxEDCgERLhIVFDQDCv7H/spgGB8JBgkqASgBGB8GBQ8FCRIOA2gAAAL/7P/0AgMCywAbAEAAADcHFjI+Ajc2NC4BJyYjIgYVBh0BNjMyFRQrASczNTQmLwEmNDc2MyARFAcOAiMiJicmIwcGIyY1NzYTIyI1NLgBE0k0HRQEBRYfFSEmEhoMF0gNJEilKxEFBQQMTn8BCy8TMlExH0IMAgEEI0UPAxYCRA32Zx4jPTwkOV5iNRAZDAkqlTUBCzI6EqBQCwoEDwUf/qyFbio9KRsUAwQtAgcMLgELEycAAgAe/+wB9gMzABEAUgAAARcyNjMyFRQGIiYiDgEiNTQ2Eyc0JyY1NDYyFRQHBhEUFxYVFAYjIicmAi8BJiMiBwYUHgMVFAYiNTQ2Nz4BNCcmJyY1NDYyFzYXFhIXFjMyAQFqHBICBi4sRCYbEgY9sgEMAkQoAhcVBFwTHgsWYyUmAgMEBQUDBAQDQjUGBAoIAwUNA2o7BQ4DHWkpBQMFAzMHBgUQNRIFBQYOL/4Gd7E6BwQRGAwBCnv+9LdQDQEVGw4cAQNwcAUHXbpkNB8OAxMVDAYSDiO57TZYHgMFEB4BARFp/uRLBQAAAwAU/+8CHgNqAAoAJgBEAAAABiIuATQ2MxceAQciBwYUFxYVFAYHIhUGFB4DMjY3NjQuAwc3PgI3NjMyFhcWFRQHBgcGIyImNTQ2PwE2Mh4BAV4FCVwcJwkMDjw6JBgqJAkoHQkBBA8ZL0s8DBYUGyYawwQKLS0cJRxDYRkuZDE7JSJ9dhoODQQSCQUC7gY7FRUdBQ9beRoujQ4DCh4pBAcLKTFDMSM8MFSbdj4mCWMGLkMhCQw+NWWA12IwEQurg0x/GhoJAwMAAAMAFP/vAh4DXQANACkARwAAEwYjIjU3Njc2MhYUBwYHIgcGFBcWFRQGByIVBhQeAzI2NzY0LgMHNz4CNzYzMhYXFhUUBwYHBiMiJjU0Nj8BNjIeAfcFBQgCGy0EESgJKhUkGCokCSgdCQEEDxkvSzwMFhQbJhrDBAotLRwlHENhGS5kMTslIn12Gg4NBBIJBQLfBAkINjYFHRUGIoEaLo0OAwoeKQQHCykxQzEjPDBUm3Y+JgljBi5DIQkMPjVlgNdiMBELq4NMfxoaCQMDAAADABT/7wIeA1sAEwAvAE0AAAEUIicGIjU3Njc2Mhc2MxcWHwEWByIHBhQXFhUUBgciFQYUHgMyNjc2NC4DBzc+Ajc2MzIWFxYVFAcGBwYjIiY1NDY/ATYyHgEBlRBeXRICISQEExERCwweHQoBcSQYKiQJKB0JAQQPGS9LPAwWFBsmGsMECi0tHCUcQ2EZLmQxOyUifXYaDg0EEgkFAukJPz8ICD8nBQ4OBR42EgNrGi6NDgMKHikEBwspMUMxIzwwVJt2PiYJYwYuQyEJDD41ZYDXYjARC6uDTH8aGgkDAwAAAwAU/+8CHgMpABAALABKAAABFzI2MzIVFAYiJiIOASI0NhciBwYUFxYVFAYHIhUGFB4DMjY3NjQuAwc3PgI3NjMyFhcWFRQHBgcGIyImNTQ2PwE2Mh4BAQ1lFBIBBiclOSYbEAYtNCQYKiQJKB0JAQQPGS9LPAwWFBsmGsMECi0tHCUcQ2EZLmQxOyUifXYaDg0EEgkFAykIBgUPJA4GBhAopxoujQ4DCh4pBAcLKTFDMSM8MFSbdj4mCWMGLkMhCQw+NWWA12IwEQurg0x/GhoJAwMAAAQAFP/vAh4DQQAMABoANgBUAAABByImNDYyFhUUIycmIwciJjQ2MhYVFAYjJyYXIgcGFBcWFRQGByIVBhQeAzI2NzY0LgMHNz4CNzYzMhYXFhUUBwYHBiMiJjU0Nj8BNjIeAQGGFRMOFDYVCgQGxBUTDhQ2FQgCBAY4JBgqJAkoHQkBBA8ZL0s8DBYUGyYawwQKLS0cJRxDYRkuZDE7JSJ9dhoODQQSCQUC8QERLhIVFDQDCgERLhIVFCMRAwpvGi6NDgMKHikEBwspMUMxIzwwVJt2PiYJYwYuQyEJDD41ZYDXYjARC6uDTH8aGgkDAwAAAQAeAIcBsgJEAB4AAAEUBgceARUUIyInJicHBiI1NzY3JyY1NDIXFhc3NjIBrjVmdygiOAYIY3APSgdQUIAFTwwmMGcITgI2AzyFsCUIDg0TkpkUCwthaLUGBg4SO0iNEgADABT/wQJPAu0ACgAmAEQAABcGIjU0NwE2MhUUBSIHBhQXFhUUBgciFQYUHgMyNjc2NC4DBzc+Ajc2MzIWFxYVFAcGBwYjIiY1NDY/ATYyHgFuCzoDAd0IPv7VJBgqJAkoHQkBBA8ZL0s8DBYUGyYawwQKLS0cJRxDYRkuZDE7JSJ9dhoODQQSCQUqFQwFBAMIDwgBYhoujQ4DCh4pBAcLKTFDMSM8MFSbdj4mCWMGLkMhCQw+NWWA12IwEQurg0x/GhoJAwMAAAIAHf/tAgcDYAAKAE4AAAAGIi4BNDYzFx4BARM0JyYvASY1NDYyFQcGAhQeAhcWMjY3Nj8BNjQuAzU0Nz4BMhUUBwYVFBcWFAcGIicmLwE0IwcOAQcGIi4BJyYBUgUJXBwnCQwPO/7hBwMFDAQFZEQBDgYGAQkHEkItCxcFAgUCBAMCCxFHOAUWGAQIHmMEBQEBBAsTMhchPz8fCg0C5AY7FRUdBQ9b/b0BGUEqSxMGBAYTFxMLY/7xVDgJGQoYHhYvIg9HwjwnHhEBCwcNEg0CH4jys0wMCQcXGQ0nDAkHICsIDCEsHisAAAIAHf/tAgcDcAANAFEAAAEGIyI1NzY3NjIWFAcGARM0JyYvASY1NDYyFQcGAhQeAhcWMjY3Nj8BNjQuAzU0Nz4BMhUUBwYVFBcWFAcGIicmLwE0IwcOAQcGIi4BJyYBEQUFCAIbLQQRKAkq/uAHAwUMBAVkRAEOBgYBCQcSQi0LFwUCBQIEAwILEUc4BRYYBAgeYwQFAQEECxMyFyE/Px8KDQLyBAkINjYFHRUGIv2YARlBKksTBgQGExcTC2P+8VQ4CRkKGB4WLyIPR8I8Jx4RAQsHDRINAh+I8rNMDAkHFxkNJwwJByArCAwhLB4rAAIAHf/tAgcDXgATAFcAAAEUIicGIjU3Njc2Mhc2MxcWHwEWARM0JyYvASY1NDYyFQcGAhQeAhcWMjY3Nj8BNjQuAzU0Nz4BMhUUBwYVFBcWFAcGIicmLwE0IwcOAQcGIi4BJyYBjBBeXRICISQEEhIRCwweHQoB/qcHAwUMBAVkRAEOBgYBCQcSQi0LFwUCBQIEAwILEUc4BRYYBAgeYwQFAQEECxMyFyE/Px8KDQLsCT8/CAg/JwUODgUeNRMD/b4BGUEqSxMGBAYTFxMLY/7xVDgJGQoYHhYvIg9HwjwnHhEBCwcNEg0CH4jys0wMCQcXGQ0nDAkHICsIDCEsHisAAAMAHf/tAgcDTwAMABoAXgAAAQciJjQ2MhYVFCMnJiMHIiY0NjIWFRQGIycmAxM0JyYvASY1NDYyFQcGAhQeAhcWMjY3Nj8BNjQuAzU0Nz4BMhUUBwYVFBcWFAcGIicmLwE0IwcOAQcGIi4BJyYBeBUTDhQ2FQoEBsQVEw4UNhUIAgQGqwcDBQwEBWREAQ4GBgEJBxJCLQsXBQIFAgQDAgsRRzgFFhgECB5jBAUBAQQLEzIXIT8/HwoNAv8BES4SFRQ0AwoBES4SFRQjEQMK/a8BGUEqSxMGBAYTFxMLY/7xVDgJGQoYHhYvIg9HwjwnHhEBCwcNEg0CH4jys0wMCQcXGQ0nDAkHICsIDCEsHisAAv/n/+cCNgN3AA0AOgAAAQYjIjU3Njc2MhYUBwYXJzQ2MhUUBw4BDwEGFB4BFRQGIjU3NjU0LwEmJyYvASY1NDYyFxYXFjI+AgERBQUIAhstBBEoCSozBFxYCidvJCQSBgZcOwMRCgNAODAWCQpoNQlaMgMLDx4yAvkECQg2NgUdFQYikyUSDw8HCim6SUgmW1k+BRkfCw1bfR8uDa1SSQ0GBggRJBC8dAYYNIUAAQAZ/+4B9QLJADsAABc3NhEQLwEmNDc+ATIdAQYHNjMyFhQGIyInJjU0NjMyFjsBMjY/ATQuAScmIgYPAQYdARYXFhUUBisBJiUDExcFBgsPTT4FBCcsdndhThkZMhAPBBYMASIoAgMXHhQZNyICAQkCCARYKwYQCQ8qASgBGB8GBQ8FCRIOAyhBA4CxggkSOQwpEDYbGyY3GwgJCwYFh3oFckkOAxkeAQAB//b/PAIFAsAASAAANxcUBgcGDwEiNTc2ETQnIgcjIjU3NjsBNTQ+ATMyFRQGFRQXFhUUDgEHBiMiJjU0NzYzMhUUBhQWMjY3NjU0LgI0NjU0IgYVoAUhGDElEQ8FSQEVFQELAwENJFVvMGZaWWohKhwmIEFWExsnDAkjMh4GCTpGOlRPQ/rIP2EYMwcECQ9lAYskEgMLJglDQGErOSbTITErMlYrQB4JDDM4IRUfCwEdLCIRDRIQHSoYOGbVEyNWWQAAAgAL//MBiwKFAAoARQAAAAYiLgE0NjMXHgEXBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeAwElBQlcHCcJDA48RwIdBIEEAQQIMFQYIxcCET5EMRYHB1hFWwQDNhckBgIiCx4jFSBDPiI7JwMCCgc7FRUdBQ5c6oCFGwQFDyYJHKAHNioWHg4BAkMpGB4TFxFGVBISDwsaNR0WGBEDAR4ZECcYEwQPKi8AAgAL//MBiwKFAA0ASAAAEwYjIjU3Njc2MhYUBwYXBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeA8gFBQgCGy0EESgJKmICHQSBBAEECDBUGCMXAhE+RDEWBwdYRVsEAzYXJAYCIgseIxUgQz4iOycDAgcECQg2NgUdFQYi/4CFGwQFDyYJHKAHNioWHg4BAkMpGB4TFxFGVBISDwsaNR0WGBEDAR4ZECcYEwQPKi8AAgAL//MBiwJ9ABMATgAAARQiJwYiNTc2NzYyFzYzFxYfARYXBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeAwFPEF5dEgIhJAQTERELDB4dCgEdAh0EgQQBBAgwVBgjFwIRPkQxFgcHWEVbBAM2FyQGAiILHiMVIEM+IjsnAwILCT8/CAg/JwUODgUeNhID44CFGwQFDyYJHKAHNioWHg4BAkMpGB4TFxFGVBISDwsaNR0WGBEDAR4ZECcYEwQPKi8AAgAL//MBiwJBABAASwAAExcyNjMyFRQGIiYiDgEiNDYTBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeA61lFBIBBiclOSYbEAYt3AIdBIEEAQQIMFQYIxcCET5EMRYHB1hFWwQDNhckBgIiCx4jFSBDPiI7JwMCQQgGBQ8kDgYGECj+64CFGwQFDyYJHKAHNioWHg4BAkMpGB4TFxFGVBISDwsaNR0WGBEDAR4ZECcYEwQPKi8AAwAL//MBiwJqAA0AGgBVAAABByImNDYyFhUUBiMnJiMHIiY0NjIWFRQjJyYXBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeAwEzFRMOFDYVCAIEBsQVEw4UNhUKBAbTAh0EgQQBBAgwVBgjFwIRPkQxFgcHWEVbBAM2FyQGAiILHiMVIEM+IjsnAwIaAREuEhUUIxEDCgERLhIVFDQDCu6AhRsEBQ8mCRygBzYqFh4OAQJDKRgeExcRRlQSEg8LGjUdFhgRAwEeGRAnGBMEDyovAAMAC//zAYsCegAKABYAUQAAEzIXMjU0IyIGFRQnNDYyFhQjIicmIyIXBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeA+EPEgUdDhAfITkeDQMDECYvvwIdBIEEAQQIMFQYIxcCET5EMRYHB1hFWwQDNhckBgIiCx4jFSBDPiI7JwMCJQYQLxAMHRodHipWAg7egIUbBAUPJgkcoAc2KhYeDgECQykYHhMXEUZUEhIPCxo1HRYYEQMBHhkQJxgTBA8qLwAAAwAL/+0CVAHGAA4AMQBsAAAlFxQzPgE3Nj8BNCMiBwYXFA4BBwYjIiY0NjMyFxYUDgMHIhUUFhcWMzI3Njc2MhYnBxQXFhUUIicmNTc0IyIGFRQWMjY3FhQGIi4BJyY1NDY3Njc2NTQjIgYVFwYPASImNTQ+AjIeAwFwAQggMAsZAgErIBUg2h8nGiAfVFBjY1ohDAQYKFY6CA0JFSsrHw8KBA0I3gIdBIEEAQQIMFQYIxcCET5EMRYHB1hFWwQDNhckBgIiCx4jFSBDPiI7JwP+GQYDGxElGww2HCzPJjkbCAp+w5g/GCsZMigkBgcJIwwcHA8WCBatgIUbBAUPJgkcoAc2KhYeDgECQykYHhMXEUZUEhIPCxo1HRYYEQMBHhkQJxgTBA8qLwAAAQAZ/5ABaAHGAEAAACUUBgcGFBcWFAYiJjU3FjI2NCY1NDY1JyY1NDc+ATMyFxYVFAcGIi4BNTY3NjU0IyIOAhQeAjMyNzY3NjMyFgFlUjsOCR4jIhkFDBQMHxUCny0WUjdTIg4oEBsRHAEQDzAMIRYTBREvIyogDQgEBgkJczdHBAkPAwooFAkIBgINEBEFBw8CAgfEZU4oLjgXHzAYCQMYFQsHCRcnFSFHQSE5JCMOFAghAAADABT/7QFhAoUACgAZADwAABIGIi4BNDYzFx4BAxcUMz4BNzY/ATQjIgcGFxQOAQcGIyImNDYzMhcWFA4DByIVFBYXFjMyNzY3NjIW/gUJXBwnCQwOPIEBCCAwDBgCASsgFCHaHycaIR5UUGNjWiANBBgoVjoIDQgWKyseEAoEDQgCCgc7FRUdBQ5c/ugZBgMbESUbDDYcLM8mORsICn7DmD8YKxkyKCQGBwkjDBwcDxYIFgADABT/7QFhAoUADQAcAD8AABMGIyI1NzY3NjIWFAcGAxcUMz4BNzY/ATQjIgcGFxQOAQcGIyImNDYzMhcWFA4DByIVFBYXFjMyNzY3NjIWqQUFCAIbLQQRKAkqbgEIIDAMGAIBKyAUIdofJxohHlRQY2NaIA0EGChWOggNCBYrKx4QCgQNCAIHBAkINjYFHRUGIv7TGQYDGxElGww2HCzPJjkbCAp+w5g/GCsZMigkBgcJIwwcHA8WCBYAAAMAFP/tAWECcgATACIARQAAARQiJwYiNTc2NzYyFzYzFxYfARYDFxQzPgE3Nj8BNCMiBwYXFA4BBwYjIiY0NjMyFxYUDgMHIhUUFhcWMzI3Njc2MhYBOhBeXRICISQEEhISCgweHQoBvQEIIDAMGAIBKyAUIdofJxohHlRQY2NaIA0EGChWOggNCBYrKx4QCgQNCAIACT8/CAg/JwUODgUeNRMD/voZBgMbESUbDDYcLM8mORsICn7DmD8YKxkyKCQGBwkjDBwcDxYIFgAABAAU/+0BYQJqAAwAGgApAEwAAAEHIiY0NjIWFRQjJyYjByImNDYyFhUUBiMnJgMXFDM+ATc2PwE0IyIHBhcUDgEHBiMiJjQ2MzIXFhQOAwciFRQWFxYzMjc2NzYyFgEcFRMOFDYVCgQGxBUTDhQ2FQgCBAYFAQggMAwYAgErIBQh2h8nGiEeVFBjY1ogDQQYKFY6CA0IFisrHhAKBA0IAhoBES4SFRQ0AwoBES4SFRQjEQMK/uQZBgMbESUbDDYcLM8mORsICn7DmD8YKxkyKCQGBwkjDBwcDxYIFgAAAgAZ/+oAswKFAAoAIAAAEgYiLgE0NjMXHgEDNzQnJicmNTQ2MhcUBhQXFhUUIicmrAUJXBwnCQwPO3cLEwYIBmYvAQsMA0woCgIKBzsVFR0FDlz+COlTHgoFAgYSIgwUu84ZBQUNFAUAAAIAGf/qAMwChQANACMAABMGIyI1NzY3NjIWFAcGAzc0JyYnJjU0NjIXFAYUFxYVFCInJlcFBQgCGy0EESgJKmQLEwYIBmYvAQsMA0woCgIHBAkINjYFHRUGIv3z6VMeCgUCBhIiDBS7zhkFBQ0UBQAC//v/6gDYAn0AEwApAAATFCInBiI1NzY3NjIXNjMXFh8BFgM3NCcmJyY1NDYyFxQGFBcWFRQiJybYEF5dEgIhJAQTERELDB4dCgGjCxMGCAZmLwELDANMKAoCCwk/PwgIPycFDg4FHjYSA/4P6VMeCgUCBhIiDBS7zhkFBQ0UBQAAA//i/+oA8AJqAA0AGgAwAAATByImNDYyFhUUBiMnJiMHIiY0NjIWFRQjJyYTNzQnJicmNTQ2MhcUBhQXFhUUIicmxxUTDhQ2FQgCBAbEFRMOFDYVCgQGCAsTBggGZi8BCwwDTCgKAhoBES4SFRQjEQMKAREuEhUUNAMK/gTpUx4KBQIGEiIMFLvOGQUFDRQFAAABABn/8gHHAt8AQwAAAQMUFxYVFCMiNSY0NjQiBhUUMzI2MzIWFRQGIyImNTQ3PgEzMhYzNzY0JwcGIyI0NzY3JicmNTQzFhc3NjMyFRQPARYBgggPBCtSAg1jND4JEQIICTYnPD0vGFI0Eh0BBgMCSgEDDQ4eJxVHBBF4KEwEAw4SQA0B5/7blh4HBg8nEEO3Y3Q6ewcUCiIvaU5jVSozCQU2FSAvASkJExlbHgMECQRRLwMXEwonLwACAB7/6AGMAjIAEAA5AAATFzI2MzIVFAYiJiIOASI0NgM2ECc0MzIXFjI3NjIWFRQGFRQXFhUUIyI1NDY1NCMiDgEVFB8BFAYiumUUEgEGJyU5JhsQBi1/EgkeLg8BCAIfgkwNGwQcfCZCICEEBwJJNQIyCAYFDyQOBgYQKP3HbAEuLQ0jAwIgQj8mjCJRJAUFDW4qlidQJjFEaE0WHB8AAgAU/+wBlQKFAAoAPgAAAAYiLgE0NjMXHgEHDgE0NzYzMh8BFhUUBw4BFRceAR8BFAYjIi4BJyY0PgE3NjIVBw4BFB4BFxYyNjc2NTQmAR0FCVwcJwkMDzudGhcGQJg0HgoMBxsyBiAjAgJuXzBGIQoMGyMWHCIGFhMQFA0TKigJElUCCgc7FRUdBQ5cnQEBDAY7CQMFBgUDCCMHBxJOHh9jgCIrGyVPUCYMDwcKGlRBQB8IDCEbMjVUXAACABT/7AGVAoUADQBBAAATBiMiNTc2NzYyFhQHBgcOATQ3NjMyHwEWFRQHDgEVFx4BHwEUBiMiLgEnJjQ+ATc2MhUHDgEUHgEXFjI2NzY1NCbIBQUIAhstBBEoCSqKGhcGQJg0HgoMBxsyBiAjAgJuXzBGIQoMGyMWHCIGFhMQFA0TKigJElUCBwQJCDY2BR0VBiKyAQEMBjsJAwUGBQMIIwcHEk4eH2OAIisbJU9QJgwPBwoaVEFAHwgMIRsyNVRcAAIAFP/sAZUCfQATAEcAAAEUIicGIjU3Njc2Mhc2MxcWHwEWBw4BNDc2MzIfARYVFAcOARUXHgEfARQGIyIuAScmND4BNzYyFQcOARQeARcWMjY3NjU0JgFaEF5dEgIhJAQSEhIKDB4dCgHaGhcGQJg0HgoMBxsyBiAjAgJuXzBGIQoMGyMWHCIGFhMQFA0TKigJElUCCwk/PwgIPycFDg4FHjYSA5YBAQwGOwkDBQYFAwgjBwcSTh4fY4AiKxslT1AmDA8HChpUQUAfCAwhGzI1VFwAAgAU/+wBlQI5ABAARAAAExcyNjMyFRQGIiYiDgEiNDYHDgE0NzYzMh8BFhUUBw4BFRceAR8BFAYjIi4BJyY0PgE3NjIVBw4BFB4BFxYyNjc2NTQmwGUUEgEGJyU5JhsQBi0jGhcGQJg0HgoMBxsyBiAjAgJuXzBGIQoMGyMWHCIGFhMQFA0TKigJElUCOQgGBQ8kDgYGECjAAQEMBjsJAwUGBQMIIwcHEk4eH2OAIisbJU9QJgwPBwoaVEFAHwgMIRsyNVRcAAADABT/7AGVAmoADQAaAE4AAAEHIiY0NjIWFRQGIycmIwciJjQ2MhYVFCMnJgcOATQ3NjMyHwEWFRQHDgEVFx4BHwEUBiMiLgEnJjQ+ATc2MhUHDgEUHgEXFjI2NzY1NCYBOxUTDhQ2FQgCBAbEFRMOFDYVCgQGIRoXBkCYNB4KDAcbMgYgIwICbl8wRiEKDBsjFhwiBhYTEBQNEyooCRJVAhoBES4SFRQjEQMKAREuEhUUNAMKoQEBDAY7CQMFBgUDCCMHBxJOHh9jgCIrGyVPUCYMDwcKGlRBQB8IDCEbMjVUXAADAB4AewHUAjkACwAYACQAAAEHIiY0NjIWFCMnJgMHIiY0NjIWFRQjJyYnJTIWHQEUIyEiNTQBBRgYFBo+HQ0FBhwYGBEcPhsNBQbVAXwHCCj+gQ8B2AIWNhcWWwMN/rMBFTkVGR47Aw31AwcDAzYULAAC//r/wQGoAiMACAA9AAABBxYzMjY3NjQnDgE0NzYzNzYyFQYHFxYVFAcOARUXHgEfARQGIyInBwYiNTQ/ASY0PgE3NjIVBw4BFBc3JgEVhhcnHSgKEagaFwZAmDIIPAwuIAwHGzIGICQCAW5fPiofCzoDOR0bIxUdIgYWEwFzKwEx2jEhGzJ0cQEBDAY7UA8IEkoHBQYDBQgjBwcSTh4fY4AcMhUMBQRbLWpQJgwPBwoaVC0KuB4AAgAe/+4BgAKFAAoAOQAAAAYiLgE0NjMXHgEXBhUUHwEUIyInJiIHBiMiJy4BNTc0JyY1NDc2MzIVFAYUFjI2PwE2NCY1NDYzMgEPBQlcHCcJDA87cRIKBBZNCwEHAx9BJCcYHg8OBQUQGWEpITsiAwMEC1AgDwIKBzsVFR0FDlxZbKd7Jw0NKwUEKRILNyjbRR0LAwYCBVAZsksoKhUVI7AvBhkdAAIAHv/uAYAChQANADwAABMGIyI1NzY3NjIWFAcGFwYVFB8BFCMiJyYiBwYjIicuATU3NCcmNTQ3NjMyFRQGFBYyNj8BNjQmNTQ2MzLBBQUIAhstBBEoCSp9EgoEFk0LAQcDH0EkJxgeDw4FBRAZYSkhOyIDAwQLUCAPAgcECQg2NgUdFQYibmyneycNDSsFBCkSCzco20UdCwMGAgVQGbJLKCoVFSOwLwYZHQACAB7/7gGAAn0AEwBCAAABFCInBiI1NzY3NjIXNjMXFh8BFhcGFRQfARQjIicmIgcGIyInLgE1NzQnJjU0NzYzMhUUBhQWMjY/ATY0JjU0NjMyAUwQXl0SAiEkBBMREgoMHh0KATQSCgQWTQsBBwMfQSQnGB4PDgUFEBlhKSE7IgMDBAtQIA8CCwk/PwgIPycFDg4FHjYSA1Jsp3snDQ0rBQQpEgs3KNtFHQsDBgIFUBmySygqFRUjsC8GGR0AAwAe/+4BgAJqAA0AGgBJAAABByImNDYyFhUUBiMnJiMHIiY0NjIWFRQjJyYXBhUUHwEUIyInJiIHBiMiJy4BNTc0JyY1NDc2MzIVFAYUFjI2PwE2NCY1NDYzMgErFRMOFDYVCAIEBsQVEw4UNhUKBAbvEgoEFk0LAQcDH0EkJxgeDw4FBRAZYSkhOyIDAwQLUCAPAhoBES4SFRQjEQMKAREuEhUUNAMKXWyneycNDSsFBCkSCzco20UdCwMGAgVQGbJLKCoVFSOwLwYZHQAC/+z+3wGTAoUADQA9AAATBiMiNTc2NzYyFhQHBgMUKwEiJjQ2NTQnLgIvASY1NDYzMhcWFxYzMjY1NCcmNTQ2MzIVFA4CBwYVFBbVBQUIAhstBBEoCSpIDAEhU0waISctCgoLVyEPChIVMw0JNywKXiYhHBhfHyIQAgcECQg2NgUdFQYi/MAMLjyVGRtGW3JXCAcGBw4dGC9TqowrSw0CCBIhKyFYM7lGVFcuLgABAA/+zwGUArkANgAAExYUBzYyFhcWFRQHDgEjIjU0MzIWMzIQIyIGDwEGERQWFAcOASMiNTYTNjUnLgEvASY1NDYzMqEEASNcRxAaHA46J00KAhMJR0wVHQQEDgkGFEQaChENBAQCEwkIB1cpEAKuGrcsFjAnQ0tKSigzWRgJAS0TCQpa/v9bfhQIGikNbgGqhheZHCgGBQQFDikAAAP/7P7fAZMCagANABoASgAAAQciJjQ2MhYVFAYjJyYjByImNDYyFhUUIycmExQrASImNDY1NCcuAi8BJjU0NjMyFxYXFjMyNjU0JyY1NDYzMhUUDgIHBhUUFgEhFRMOFDYVCAIEBsQVEw4UNhUKBAZIDAEhU0waISctCgoLVyEPChIVMw0JNywKXiYhHBhfHyIQAhoBES4SFRQjEQMKAREuEhUUNAMK/NEMLjyVGRtGW3JXCAcGBw4dGC9TqowrSw0CCBIhKyFYM7lGVFcuLgABABn/6gCzAcMAFQAAPwE0JyYnJjU0NjIXFAYUFxYVFCInJjULEwYIBmYvAQsMA0woCh7pUx4KBQIGEiIMFLvOGQUFDRQFAAAB/+z/+QG3AtQAPAAAJSciIwciNTQ3PgE9AQcGIyI0NjcuAjU0NjIWFAcGBzc2MzIVFA8BBhQeAjMyNTQmNTQzMh4CFRQjIgE0OQwMtg8DCgk3AQMNJiEDEA9sLwwCBwMwBAMOEjQBCAUhHGIJDgslGBQdMwEBCQoDCxf2TxIjASkZFac7EgYQGAUSGFBXHgMXEwsfHuloCg6XKhQDChYhRzB3AAH//P/nAQECuQArAAA3NjcHBiMiNDc2NzUnLgEvASY1NDYzMhcWFAc3NjMyFRQPAQYVFBcWFRQiJkUPBEsBAw0OIywEAhMICQdXKRACBAMxBAMOEjUCCwM6RxtnlzABKQkWHEWZHCgGBQQFDikLGrhRHgMXEwohXiysIgYGDB0AAgAU/+8DPQLOABoAWAAAASIOARUUFxYVFAYHIhUGFB4DMzIRNCcuAQc3PgI3NjMyFz4BMhcWFCMiJyYjIgYHNjMyFRQGKwEGFB4BMjc2MzIVFAYjIicGBwYjIiY1NDY/ATYyHgEBGiQsDCQJKB0JAQQPGS8fgEITGrkECiosGiMagzwxgYIRCAcBCRknVV8QOJYKIBSsAR1PfisFBAhZUIhAM0MxHn12Gg4NBBIJBQKCNTwjQQ4DCh4pBAcLKTFDMSMBDNRCEwljBi5DIQkMeUU2Fgs7BAx4XgEHEDEMUVk+HAQVRkRlSBMNq4NMfxoaCQMDAAMAGf/sAoUBxgAOADEAZQAAJRcUMz4BNzY/ATQjIgcGFxQOAQcGIyImNDYzMhcWFA4DByIVFBYXFjMyNzY3NjIWJQ4BNDc2MzIfARYVFAcOARUXHgEfARQGIyIuAScmND4BNzYyFQcOARQeARcWMjY3NjU0JgGhAQggMAwYAgErIBQh2h8nGiAfVFBjY1ogDQQYKFY6CA0IFisrHhAKBA0I/goaFwZAmDQeCgwHGzIGICQCAW5fMEYhCQ0bIxUdIgYWExAUDhIqKAoRVf4ZBgMbESUbDDYcLM8mORsICn7DmD8YKxkyKCQGBwkjDBwcDxYIFvoBAQwGOwkDBQYDBQgjBwcSTh4fY4AiKxslT1AmDA8HChpUQUAfCAwhGzI1VFwAAgAN/+sB7gN/ABMAVAAAATYyFQcGBwYiJwYjJyYvASY1NDITNzQnJisBIgYHBgcUHgMVFAYiJj0BNDY3Nj8BMhYVFA4BDwEUFxYzMjY1NCcuAycmNDc2MzIWFRQGIyImASdeEAElIAQTERELDCIaCQISkgQkHA8BHiwKFQNEYWFEm8WBFxAhGwwcLhoTAQI4FAw3QzQnWyAkFjAnRoxKZikgDx0DQD8JB0YgBQ4OBSQxEQQECP6rHy4NCRMOHSAmNykwWj97ellLASU3DRsCARsYDBAgCws9FAdCMz0mHCYQFhQqjzFZOTIkMAwAAAIACv/rAU4CewATAEsAABM2MhUHBgcGIicGIycmLwEmNTQyExQOAQcGIyImNTQ3NjMyFRQGFBYyNjc2NTQuAjU0NjMyFhQGIyIuAiIOAQcGFRQeBBcWyl4QASUgBBISEQsMIhoJAhLhISodJh9BVhIcJwwJIzIeBgk6RjpbTiJLDwsGBAomGwkWCRcOCBQIHARqAjw/CQdGIAUODgUkMREEBAj+DitAHgkMMzghFR8LAR0sIhENEhAdKhg4KkhIEy0mCQwTAQUFDRkQDwgLBA0CMgAAA//n/+cCNgNmAA0AGgBHAAABByImNDYyFhUUBiMnJiMHIiY0NjIWFRQjJyYXJzQ2MhUUBw4BDwEGFB4BFRQGIjU3NjU0LwEmJyYvASY1NDYyFxYXFjI+AgFvFRMOFDYVCAIEBsQVEw4UNhUKBAaxBFxYCidvJCQSBgZcOwMRCgNAODAWCQpoNQlaMgMLDx4yAxYBES4SFRQjEQMKAREuEhUUNAMKjCUSDw8HCim6SUgmW1k+BRkfCw1bfR8uDa1SSQ0GBggRJBC8dAYYNIUAAAL//v/4AgMDcAATAFEAAAE2MhUHBgcGIicGIycmLwEmNTQyFzcyFRQAFRQzMjY1NCYjIjU0NjMyFxYVFAcGKwEmIwcnJjQ2Ejc2PwE2NTQiBgcGDwEGByMiJjU0Nz4CMwEyXhABJSAEEhISCgwiGgkCEn2cEf7AUDpcLB0PQSYSFCk3CwoEQ03ISxInqRg2HgsCVkcXLxIICQcDBgkSAhQzNQMxPwkHRiAFDg4FJDERBAQIsgYSIv3tJRwrLx0eECEyCxZHbFYRBAUCAhlVARwqYkQXBgILGBEjHQwRAgcFZz0IDwIAAgAA//UBfQJ7ABMARgAAEzYyFQcGBwYiJwYjJyYvASY1NDIXNzIVFA4BFRQyNjc2NCc0NzIXFhUUBiMnByI0Nj8BPgE1NCIOAQcGFQYrASI1ND8BNjPjXhABJSAEEhIRCwwiGgkCEndtDX5dOCoKEQQWNBENWDxyZRJBISFUCzovHgsUAwgBDhIHBBECPD8JB0YgBQ4OBSQxEQQECMMDCxTEkg8KEQ4YKBMMAh0XGDY2AwIZai8vhBUIDhAXDBYGChEnNRIOAAABAGkCAgFGAn0AEwAAARQiJwYiNTc2NzYyFzYzFxYfARYBRhBeXRICISQEEhISCgweHQoBAgsJPz8ICD8nBQ4OBR42EgMAAQBmAgABQwJ7ABMAABM2MhUHBgcGIicGIycmLwEmNTQy1V4QASUgBBMREgoMIhoJAhICPD8JB0YgBQ4OBSQxEQQECAABACwCBgDpAncAEAAAEzYyFRQGIiY1NDIWFx4BMja4Ai86STocFAEEGiIZAm0KCS46OyoMBwQeIiIAAQA4AggArgJ5AAwAABMnIgcGIyI0NjIWFAaFGBsIAgMNG0MYEgIXAQ0DWRgXNhUAAgCRAfoBCQJ6AAsAFwAAEzI1NCMiBhUUMzIWJzQ2MhYUIyInJiMi5gUdDhAVDxFUITkeDQMDECYvAh8QLxAMHQYgHR4qVgIOAAABAKH/oQEG//0ADwAAHwEGFRQzMjcyFRQjIiY0NtYKFCEKCgUmGCcdAwsODh0DBhUXJR0AAQB5AfgBVQIyABAAABMXMjYzMhUUBiImIg4BIjQ2w2UUEgEGJyU5JhsQBi0CMggGBQ8kDgYGECgAAAIAhAIDAXoChQANABsAABMGIyI1NzY3NjIWFAcGFwYjIjU3Njc2MhYUBwaWBQUIAhstBBEoCSotBQUIAhstBBEoCSoCBwQJCDY2BR0VBiIkBAkINjYFHRUGIgAAAQAO/+oBsQHcADoAABMXMjc2MzIVDgIVBhUUFxYVFAcmJyY1NzY1JzQnJiMiHQEGFRQfAhQGIyI1NzYRNTQiBiMiNTQ+AaaUQyYDAwgHJCEIHgILLhYsAg0BCikiCgoFAQZAIxUBIhkqBAklSwHPDBgBCxYrDQRBU5FWCAEJAgIFCiMXmnAwCQIGCQFgRm0tDxkTFw4GWwERDwgLBwklJAAAAQAsAN4BRgEbAAsAABMwJTIVFCMhIjQ3Nj8BAAcS/v4GBQMBGAMLMicKCQABACwA3gJgARsACgAAEzAlMhUUIyEiNTRTAgANJP39DQEYAwsyFCYAAQAlAgIAkALGABIAABMmNTQ2MhYVFAcGIyIVFBcUIyZMJxs8FAYFHRIZBw0CESRaHRoVFR4KDxIpHgoCAAABABQCAgB/AsYAEQAAExQHBgciNTY1NCMiJyY0NjIWfzUHBwcZEhoGCBQ8GwKPbRoEAgoeKRILEDEVGgABADL/nQCnAGEAEgAANxQGByI1NzY/ATQnIyImNDYyFqczHwcCFwUBDgUXERdCHCo3UAYDBhckDBECFDQZGQAAAgAlAgIBFALGABIAJQAAEyY1NDYyFhUUBwYjIhUUFxQjJjcmNTQ2MhYVFAcGIyIVFBcUIyZMJxs8FAYFHRIZBw11Jxs8FAYFHRIZBw0CESRaHRoVFR4KDxIpHgoCDSRaHRoVFR4KDxIpHgoCAAACABQCAgEDAsYAEQAjAAABFAcGByI1NjU0IyInJjQ2MhYHFAcGByI1NjU0IyInJjQ2MhYBAzUHBwcZEhoGCBQ8G4Q1BwcHGRIaBggUPBsCj20aBAIKHikSCxAxFRodbRoEAgoeKRILEDEVGgACADL/nQEzAGEAEgAlAAAlFAYHIjU3Nj8BNCcjIiY0NjIWBxQGByI1NzY/ATQnIyImNDYyFgEzMx8HAhcFAQ4FFxEXQhyMMx8HAhcFAQ4FFxEXQhwqN1AGAwYXJAwRAhQ0GRkeN1AGAwYXJAwRAhQ0GRkAAAEAHgA6AegCYQAdAAA3EyMiNTQzMjc1NDsBMhYdATcyFh0BFCsBAxQjIjXgAbQPK2gxNAQCB7YHCCieAS4TiQEJFCwBYS0IB34BBwMDNv7RKQ8AAAEAHgA6AegCYQAuAAABNzIWHQEUKwEVFCMiNTQ3IyI1NDMyNzUjIjU0MzI3NTQ7ATIWHQE3MhYdARQrAQEitwcIKJ8uEwG0DytnMbQPK2gxNAQCB7YHCCieASQBBwMDNn8pD0RVFCwBbxQsAWEtCAd+AQcDAzYAAAEANACaAM0BMQAHAAA2JjQ2MhYUBmIuMT4qLZomRisnSCgAAAMAMv/vAlIAYQAMABkAJgAABQciLgE2MhYVFCMnJiMHIi4BNjIWFRQjJyYjByIuATYyFhUUIycmAh4YGBABGj4dDQUG8RgYEAEaPh0NBQfxGBgQARo+HQ0FBwEBFDcYFxpBAw0BFDcYFxpBAw0BFDcYFxpBAw0AAAcAHv/qA0ACzQADAAwAEAAZACMAJwAwAAAAIhAyFiImNDYyFhQHACIQMhYiJjQ2MhYUBwUGIjU3ATYyFQcEIhAyFiImNDYyFhQHAvtqagh6PT55PSL+xGpqCHo9Pnk9Iv5nCDsDAbIDPgH+r2pqCHo9Pnk9IgEt/ucjSsRSUrsvARj+5yNKxFJSuy8YEwsIAsIOCQUf/ucjSsRSUrsvAAABADL/7QGbAdEAGgAABSInJi8BJjU0NzY3NjMyFAcGBwYUFxYXFhUUAX4HBw7YSBATpZYHBg4TokoJB7svEBMJD4csDQsREX9bBTcPYz0GDQRwJwkUMwAAAQA6/+0BowHRABwAABcGIyImNTQ3Nj8BNjU0JyYvASY0MxcWHwEWFAcEZQcHDAoTMIcwBwlCfysTDg2BjC4TEP7kCwgeDRkPJVIdBAQKBTZPGw83BU1rIg0gDa8AAAH/6P/qAd4CzQAJAAAXBiI1NwE2MhUHKwg7AwGyAz4BAxMLCALCDgkFAAIACgEEAScCvwAOADEAABMXMjc2NSc0IwcGDwEGFD8BMhQGDwEWFxQGIjU0NzY3JyIjByMiNTc2NzY/ATYyFQYVXzEbDwIBBAckJAsDpCQFFAsJAgQwKgIEBjQcHCUPDQEvcQ8IBxAvCgG6AgFCFDsIBCZHFwYKAwINLgUBRBgPDwoBBCJGAQEMBnOMEggIEQpYVAABAAb/7QHoAskAPQAAEzM2NyMiNDY7AT4BMzIWFCMiJyYjIgYHMzIVFAYjIgcGFTMyFRQGIyIHFhcWMzI3NjMyFRQGIyImJyMiNDY4DgEFPAkgEh4dkng0LggCAhouS1sUxwofFGhBBdYKHxRpQgYgJVk/MAUECGVEfHoENgkgAUogIBIodo8YRAEPZ1IIEx0BJRwIEx0BQjU/HAQSPj6hghIoAAIAHgCLAdYBuAA4AFUAABMnNCY1NDYyFxYzMjc2NzYzMhUGFQcVFBcUBwYiJyY1NzQiDgEHBiMnJi8BNCMiFBcVFCMiNDc2NycXMjYyFAcGKwEHBhQXFAYiNT4BNSc0IgYiND4B3QIINh0BJAsCARsUBjUTCwEIAw0oAgIFBQ4zAQQMCgokCwIEBicIAgYCiTooEQQGChQWBAIFJhkGBwEqDgYHGwEvSxMUAQkJBqEDTEoPBzc1RCobGgQCCgsIDKUcIaoCCwUzdSUCtBUCEAUGEzTOAwsLDRQDRH8lCgwFD4Y5KwULBhEWAAEAHgFAAdQBgwAMAAATMCUyFh0BFCMhIjU0SQF8Bwgo/oEPAYADBwMDNhQsAAABAB4AZAIfAlMALwAAATcyFh0BFCsBBw4BIjU0NyMiNTQzMjc2NyMiNTQzMj8BPgEyFRQHNjMyFh0BFCsBATHfBwgo2xoHGTEipA8rZzYTEN4PK4xLGQYbMCM0cwcIKKIBKAEHAwM2VhcVDwtoFCwBOzAULAFRHBMPAm4BBwMDNgAAAgAeAHcBrQJEABgAIwAAEycmNDc+ATMyFRQHBgcGFBcWFxYVFCMiJhcyHQEUIyEiNTQzfU8PEsOdBg4TvkwJB9kvEBYGGzcPKP6oDysBSiAHJxBWRhQiDEwjBAkDURwGECkUMQoDNhUrAAIAHgB3Aa0CRAAYACMAAAEXFhQHDgEjIjU0NzY3NjQnJicmNTQzMhYBMh0BFCMhIjU0MwFHTw8Sw50GDhO+TAkH2S8QFgYbAUEPKP6oDysB0SAHJxBWRhQiDEwjBAkDURwGDyoU/ooKAzYVKwAAAv/2/zwBgwKrAAwASgAAASciBwYjIjQ2MhYUBgMXFAYHBg8BIjU3NhE0JyIHIyI1NzY7ATU3ND4CMhUUBw4BHQE+ATMyFxQGFBcWFRQiJyY1NzQnJiMiJwYBVRgbCAIDDRtDGBLMBSEYMSURDwVJARUVAQsDAQ0kAgUmSjUJHSVVbwEWAQsMA0woCgsJCRMtHAICFwENA1kYFzYV/uPIP2EYMwcECQ9lAYskEgMLJglDXwcRIx0QBgQJVWYaAw0MFLvOGQUFDRQFG+k9HRkBTAAAAv/2/zwBiwK5ABgARgAAAQMUFxYVFCImNTY1Jy4BLwEmNTQ2MzIXFgMXFAYHBg8BIjU3NhE0JyIHIyI1NzY7ATU3ND4CMhUUBw4BHQE2NzIUDgEnBgGDBgsDOkcUBAITCQgHVykQAgTjBSEYMSURDwVJARUVAQsDAQ0kAgUmSjUJHSUzEAcVHxcCAjz+kawiBgYMHReM6pkcKAYFBAUOKQsa/mbIP2EYMwcECQ9lAYskEgMLJglDXwcRIx0QBgQJVWYcAgMYIwEBTAAAAQAAAOoAegAHAAAAAAACAAAAAQABAAAAQAAAAAAAAAAAAAAAAAAAAAAAMgBpALcBKgFmAc0B7AIbAkwCpQLSAvIDBgMeAzQDXgOEA98ETQSbBP8FWwWRBfYGPwZoBpkGxQbpBxgHaQf7CFQIwQkQCVEJlgngCjUKkAq2Ct4LQQt/C+cMRAyZDOENSQ22DhEOTg6xDu0Pag/IEAwQZBCREKwQ1RD4EQwRIxF2Eb4SABJIEpES0xMnE3QTqhPiFDwUZRTKFQMVURWVFfEWLBZ6FrMW9hczF5UX5RgoGHAYvhjXGSEZPhlwGcsaGhp7GqUbIBtLG5wb6Bw3HFIcsRzEHOIdHB1oHbwd1h4THiseTB5wHrofEB+JIAMgrCD+IWch0yJIIrcjNCOqJCwklSTrJUQlpiYQJkcmgSbEJw8naiffKEQorCkdKYgqASoyKpYrCyuDLAQsjCzjLTgtmi39LmMu0i87L7IwIjC4MRMxbTHLMjIyoTLWMw4zTzOYM/U0RTSjNQQ1bjXSNkQ2fTbZNyw3gjfhOEg4nzjuOVY5ejnMOgw6hjsXO447+DxgPNM9Nz1aPXw9mT2xPdY98D4NPjs+jD6iPrY+1T7zPxM/Sj+AP7o/5EAgQDJAbkC+QOpBGUEuQXhBykI/QlZCl0LMQwNDbEPSAAAAAQAAAAEAANtBcINfDzz1AAsD6AAAAADK9M1tAAAAAMr0zW3/oP6/A2gDiQAAAAgAAgAAAAAAAAC0AAAAAAAAAU0AAAC0AAAA8AAzARIAMgJNACgCBAAUAkUAHgJCAB8AiwAyANoAKQDa/98A7QAUAgcAHgDZADIB3gAsANoAMgGA/6ACFwAeARAABAHhABQB3QAbAeMAAAHjABgB6wAeAZQAHgHwAA8B8gAeANkAMgDZADIBpQAeAfQAHgGlAB4BsAAeA5AAKAI9AAMCCQAXAfoAGwINAB8B3v/wAZcAAwIZABsCJQAPAPUAKAD3/+oB7wAXAb4AEQK3ABkCFAAeAjIAFAHvABoCMgASAhAAHQH+AA0Bj//oAiIAHQIJ/+gDQf/oAlD/9wIR/+cCHf/+ALsAMgJI/9EAuf/7AS0AKAHeACwBogCCAYsACwGjAAUBfAAZAZwAGQFwABQA3v/2AY8AEQGcAAgA0gAZANH/ugGLAAUAywAPAmkAHgGPAB4BpAAUAZgADwGtABkBYwAeAVgACgDgAA8BkgAeAYP/9gJk//YBnAAAAYX/7AF9AAAAwwAJALEAPQDD//cBQAAyAPAAMwGLAB4B8//rAhH/7QCxAD0B0wARAZoATAIKACgBQQAiArIAMgHzAB4CCgAoAYsAbAD/ACwB8wAeATIAFQE7ABkBogDcAZz//QDSADIBfACTANUAIAEyABQCswA6AkoAGQKGABkCrwAZAZcAEgI9AAMCPQADAj0AAwI9AAMCPQADAj0AAwNaADMB+gAbAd7/8AHe//AB3v/wAd7/8AD1ACgA9QAoAPUAFAD1//gCDf/sAhQAHgIyABQCMgAUAjIAFAIyABQCMgAUAdAAHgIyABQCIgAdAiIAHQIiAB0CIgAdAhH/5wIJABkCD//2AYsACwGLAAsBiwALAYsACwGLAAsBiwALAmMACwF8ABkBdQAUAXAAFAFwABQBcAAUANIAGQDSABkA0v/7ANL/4gGcABkBjwAeAaQAFAGkABQBpAAUAaQAFAGkABQB8wAeAan/+gGSAB4BkgAeAZIAHgGSAB4Bhf/sAakADwGF/+wA0gAZAb7/7AD3//wDSwAUApQAGQH+AA0BWAAKAhH/5wId//4BfQAAAYsAaQGLAGYA/wAsANIAOAGLAJEBcAChAZkAeQGiAIQBuAAOAWgALAKCACwApAAlAJwAFADZADIBKAAlASAAFAFlADICKAAeAigAHgD/ADQChQAyA1QAHgHOADIBzwA6Aa7/6AE8AAoB2wAGAfQAHgHzAB4CPgAeAcwAHgHMAB4Bov/2Aan/9gABAAADif6/AAADkP+g/7oDaAABAAAAAAAAAAAAAAAAAAAA6gACAUgBkAAFAAACvAKKAAAAjAK8AooAAAHdADIA+gAAAgAFBgAAAAIABIAAACdAAABCAAAAAAAAAABTVURUAEAAIPsCA4n+vwAAA4kBQSAAAAEAAAAAAVEBgwAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQBAAAAADwAIAAEABwAfgCjAKwAtAD/ATEBQgFTAWEBeAF+AscC3QPAIBQgGiAeICIgJiAwIDogRCB0IKwhIiISImAiZfsC//8AAAAgAKEApQCuALYBMQFBAVIBYAF4AX0CxgLYA8AgEyAYIBwgICAmIDAgOSBEIHQgrCEiIhIiYCJk+wH////j/8H/wP+//77/jf9+/2//Y/9N/0n+Av3y/RDgvuC74LrgueC24K3gpeCc4G3gNt/B3tLehd6CBecAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBI0AAAAADgCuAAMAAQQJAAABKgAAAAMAAQQJAAEADAEqAAMAAQQJAAIADgE2AAMAAQQJAAMAZAFEAAMAAQQJAAQAHAGoAAMAAQQJAAUAGgHEAAMAAQQJAAYAHAHeAAMAAQQJAAcAdAH6AAMAAQQJAAgAQAJuAAMAAQQJAAkAQAJuAAMAAQQJAAsALgKuAAMAAQQJAAwALgKuAAMAAQQJAA0BIALcAAMAAQQJAA4ANAP8AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMAA5ACAAQQBuAGcAZQBsACAASwBvAHoAaQB1AHAAYQAgACgAcwB1AGQAdABpAHAAbwBzAEAAcwB1AGQAdABpAHAAbwBzAC4AYwBvAG0AKQAsAA0AQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAwADkAIABBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwAIAAoAHMAdQBkAHQAaQBwAG8AcwBAAHMAdQBkAHQAaQBwAG8AcwAuAGMAbwBtACkALAANAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIAQQBsAGEAZABpAG4AIgBBAGwAYQBkAGkAbgBSAGUAZwB1AGwAYQByAEEAbgBnAGUAbABLAG8AegBpAHUAcABhAGEAbgBkAEEAbABlAGoAYQBuAGQAcgBvAFAAYQB1AGwAOgAgAEEAbABhAGQAaQBuACAAUgBlAGcAdQBsAGEAcgA6ACAAMgAwADAAOQBBAGwAYQBkAGkAbgAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMABBAGwAYQBkAGkAbgAtAFIAZQBnAHUAbABhAHIAQQBsAGEAZABpAG4AIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABBAG4AZwBlAGwAIABLAG8AegBpAHUAcABhACAAYQBuAGQAIABBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwALgBBAG4AZwBlAGwAIABLAG8AegBpAHUAcABhACAAYQBuAGQAIABBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHMAdQBkAHQAaQBwAG8AcwAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsAA0AVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6AA0AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcA2ADhANsA3ADdAOAA2QDfAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAECAQMAjADvAI8AlACVAMAAwQxmb3Vyc3VwZXJpb3IERXVybwABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAOkAAQAAAAEAAAAKACQAMgAC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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
