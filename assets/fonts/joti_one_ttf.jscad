(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.joti_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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Aj4APgEeADIBHgAyAmQAaQJkAFoCZABWAZcAKgPnAEUCfwAeAr4AYgH2AEYCjgBiAl0AXQI+AF0CQABGAwEAYgGvAGIBpf/4AqkAYgH5AF0DqwBQArQAUAJNADwCdQBiAk0APAK+AGIBrwAxAjYAKAK4AEsCVwAPA5sAHQJ3AB4CLgAEAjAAFAGqAGQB8ABQAaoAHgJkAGkCPwAoAbYAbgJEACMCmQBGAcwAMgK9AFMCFgAyAa8AFALQAFMCmQBGAWIARgFi/8wCVgBGAWIARgOiAEEClABBAhoAMgKlAFAC0ABTAdYAQQGjADwBrwAKArIAQQIuAB4DPAAeAhwAHgI2AB4CMAAtAaoANQFkAGwBqgAeAmQAWgEsAAABfwBkAcwAMgJ4AFACpgAyAi4ABAFkAGwCbAA5AbYAJgNSAGQBmAAxAs4ARgJkAFADUgBkAX4ATQGGADICZABaAZcANwGUADMBtgCCArIAQQJ4AFABHgAyAcwAfAFYABcBnQA8As4ARgMbACsDGwArAxsAHwGXABQCfwAeAn8AHgJ/AB4CfwAeAn8AHgJ/AB4DcAAeAfYARgJdAF0CXQBdAl0AXQJdAF0BrwBhAa8AYgGvAEABrwAjAo4AFAK0AFACTQA8Ak0APAJNADwCTQA8Ak0APAJkAFYCTQA8ArgASwK4AEsCuABLArgASwIuAAQCdQBiAuUAFAJEACMCRAAjAkQAIwJEACMCRAAjAkQAIwNbACMBzAAyAhYAMgIWADICFgAyAhYAMgFiADoBYgA6AWIAIAFi//wCSQAyApQAQQIaADICGgAyAhoAMgIaADICGgAyAmQAWgIaADICsgBBArIAQQKyAEECsgBBAjYAHgKlAFICNgAeAn8AHgJEACMCfwAeAkQAIwJ/AB4CRAAjAfYARgHMADIB9gBGAcwAMgH2AEYBzAAyAfYARgHMADICjgBiAr0AUwKOABQCvQBTAl0AXQIWADICXQBdAhYAMgJdAF0CFgAyAl0AXQIWADICXQBdAhYAMgJAAEYC0ABTAkAARgLQAFMCQABGAtAAUwJAAEYC0ABTAwEAYgKZACYDAQAVApkAAAGvAE8BYgAfAa8AWwFiACsBrwBMAWIAHAGvAF8BYgAyAa8AYgFiAEYDVABiAsQARgGl//gBYv/MAqkAYgJWAEYCVgBGAfkAXQFiADAB+QBd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AHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAZcAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAQIAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEDAQQBBQEGAQcBCAD9AP4BCQEKAQsBDAD/AQABDQEOAQ8BAQEQAREBEgETARQBFQEWARcBGAEZARoBGwD4APkBHAEdAR4BHwEgASEBIgEjASQBJQEmAScBKAEpASoBKwD6ANcBLAEtAS4BLwEwATEBMgEzATQBNQE2ATcBOAE5AToA4gDjATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJALAAsQFKAUsBTAFNAU4BTwFQAVEBUgFTAPsA/ADkAOUBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQC7AWoBawFsAW0A5gDnAKYBbgFvAXABcQFyAXMBdAF1AXYBdwDYAOEBeADbANwA3QDgANkA3wF5AXoBewCbAXwBfQF+AX8BgAGBAYIBgwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AYQBhQGGAYcBiAGJAYoBiwGMAY0A9wGOAY8BkACMAJ8BkQCYAKgAmgCZAO8BkgClAJIAnACnAI8AlACVALkBkwDSAZQAwADBAZUBlgGXB25ic3BhY2UHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24GZGNhcm9uBkRjcm9hdAdFbWFjcm9uB2VtYWNyb24GRWJyZXZlBmVicmV2ZQpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24LR2NpcmN1bWZsZXgLZ2NpcmN1bWZsZXgKR2RvdGFjY2VudApnZG90YWNjZW50B3VuaTAxMjIHdW5pMDEyMwtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdJbWFjcm9uB2ltYWNyb24GSWJyZXZlBmlicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgHdW5pMDEzNgd1bmkwMTM3DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlB3VuaTAxM0IHdW5pMDEzQwZMY2Fyb24GbGNhcm9uBExkb3QEbGRvdAZOYWN1dGUGbmFjdXRlB3VuaTAxNDUHdW5pMDE0NgZOY2Fyb24GbmNhcm9uC25hcG9zdHJvcGhlA0VuZwNlbmcHT21hY3JvbgdvbWFjcm9uBk9icmV2ZQZvYnJldmUNT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUHdW5pMDE1Ngd1bmkwMTU3BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQtTY2lyY3VtZmxleAtzY2lyY3VtZmxleAd1bmkwMTYyB3VuaTAxNjMGVGNhcm9uBnRjYXJvbgRUYmFyBHRiYXIGVXRpbGRlBnV0aWxkZQdVbWFjcm9uB3VtYWNyb24GVWJyZXZlBnVicmV2ZQVVcmluZwV1cmluZw1VaHVuZ2FydW1sYXV0DXVodW5nYXJ1bWxhdXQHVW9nb25lawd1b2dvbmVrC1djaXJjdW1mbGV4C3djaXJjdW1mbGV4C1ljaXJjdW1mbGV4C3ljaXJjdW1mbGV4BlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50CkFyaW5nYWN1dGUKYXJpbmdhY3V0ZQdBRWFjdXRlB2FlYWN1dGULT3NsYXNoYWN1dGULb3NsYXNoYWN1dGUHdW5pMDIxOAd1bmkwMjE5B3VuaTAyMUEHdW5pMDIxQgd1bmkwMkM5B3VuaTAzOTQHdW5pMDNBOQd1bmkwM0JDBldncmF2ZQZ3Z3JhdmUGV2FjdXRlBndhY3V0ZQlXZGllcmVzaXMJd2RpZXJlc2lzBllncmF2ZQZ5Z3JhdmUMemVyb2luZmVyaW9yC29uZWluZmVyaW9yC3R3b2luZmVyaW9yDXRocmVlaW5mZXJpb3IMZm91cmluZmVyaW9yDGZpdmVpbmZlcmlvcgtzaXhpbmZlcmlvcg1zZXZlbmluZmVyaW9yDWVpZ2h0aW5mZXJpb3IMbmluZWluZmVyaW9yBGxpcmEERXVybwd1bmkyMTEzCWVzdGltYXRlZAd1bmkyMjE1C2NvbW1hYWNjZW50A2ZfZgVmX2ZfaQVmX2ZfbAJmagAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAgADAZAAAQGRAZYAAgABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAgAKAjgAAQASAAQAAAAEAB4AuAFSAcAAAQAEACkAMwA9AFcAJgAk/84ARv/OAEj/zgBS/84Agf/OAIL/zgCD/84AhP/OAIX/zgCG/84AqP/OAKn/zgCq/84Aq//OAKz/zgCz/84AtP/OALX/zgC2/84At//OAMH/zgDD/84Axf/OAMj/zgDK/84AzP/OAM7/zgDU/84A1v/OANj/zgDa/84A3P/OAQ7/zgEQ/84BEv/OART/zgFB/84BRv/OACYAJP/iAEb/3QBI/90AUv/dAIH/4gCC/+IAg//iAIT/4gCF/+IAhv/iAKj/3QCp/90Aqv/dAKv/3QCs/90As//dALT/3QC1/90Atv/dALf/3QDB/+IAw//iAMX/4gDI/90Ayv/dAMz/3QDO/90A1P/dANb/3QDY/90A2v/dANz/3QEO/90BEP/dARL/3QEU/90BQf/iAUb/3QAbAEb/4gBI/+IAUv/iAKj/4gCp/+IAqv/iAKv/4gCs/+IAs//iALT/4gC1/+IAtv/iALf/4gDI/+IAyv/iAMz/4gDO/+IA1P/iANb/4gDY/+IA2v/iANz/4gEO/+IBEP/iARL/4gEU/+IBRv/iABsARv/pAEj/6QBS/+kAqP/pAKn/6QCq/+kAq//pAKz/6QCz/+kAtP/pALX/6QC2/+kAt//pAMj/6QDK/+kAzP/pAM7/6QDU/+kA1v/pANj/6QDa/+kA3P/pAQ7/6QEQ/+kBEv/pART/6QFG/+kAAgA6AAQAAAByANYAAwAHAAD/uv/JAAAAAAAAAAAAAP/J//H/8f/YAAAAAAAAAAAAAAAAAAD/2P/nAAEAGgAkADcAOQA6ADwAgQCCAIMAhACFAIYAngDBAMMAxQEjASUBJwE1ATcBOQFBAVgBWgFcAV4AAgAQACQAJAACADkAOgABADwAPAABAIEAhgACAJ4AngABAMEAwQACAMMAwwACAMUAxQACATUBNQABATcBNwABATkBOQABAUEBQQACAVgBWAABAVoBWgABAVwBXAABAV4BXgABAAIAMAAkACQAAgA3ADcABgBEAEQABABGAEYAAQBIAEgAAQBSAFIAAQBZAFoABQBcAFwABQCBAIYAAgCHAIcAAwChAKcABACoAKwAAQCzALcAAQC+AL4ABQDAAMAABQDBAMEAAgDCAMIABADDAMMAAgDEAMQABADFAMUAAgDGAMYABADIAMgAAQDKAMoAAQDMAMwAAQDOAM4AAQDUANQAAQDWANYAAQDYANgAAQDaANoAAQDcANwAAQEOAQ4AAQEQARAAAQESARIAAQEUARQAAQEjASMABgElASUABgEnAScABgE2ATYABQE4ATgABQFBAUEAAgFCAUIABAFDAUMAAwFEAUQABAFGAUYAAQFZAVkABQFbAVsABQFdAV0ABQFfAV8ABQAAAAEAAAAKADQATgABbGF0bgAIABAAAk1PTCAAGFJPTSAAGAAA//8AAQAAAAD//wACAAAAAQACbGlnYQAObG9jbAAUAAAAAQAAAAAAAQABAAIABgBSAAQAAAABAAgAAQA+AAEACAAGAA4AFgAeACQAKgAwAZUAAwBJAE8BlAADAEkATAGTAAIATwGRAAIASQGWAAIATQGSAAIATAABAAEASQABAAAAAQAIAAIACgACAUgBSgABAAIBIAEkAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
