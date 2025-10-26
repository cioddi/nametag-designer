(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vampiro_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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JUZhOCMgPCM4GyEgIEYjR7AAKyNhOCFZsSIBFCstsEEssgAAOCstsEIssgABOCstsEMssgEAOCstsEQssgEBOCstsEAssAkjQrA/Ky2wOSywLCsusSIBFCstsEUssgAAOSstsEYssgABOSstsEcssgEAOSstsEgssgEBOSstsDossC0rISMgIDywBCNCIzixIgEUK7AEQy6wIistsFEssgAAOistsFIssgABOistsFMssgEAOistsFQssgEBOistsD8ssAAWRSMgLiBGiiNhOLEiARQrLbBZLLAuKy6xIgEUKy2wWiywLiuwMistsFsssC4rsDMrLbBcLLAAFrAuK7A0Ky2wXSywLysusSIBFCstsF4ssC8rsDIrLbBfLLAvK7AzKy2wYCywLyuwNCstsGEssDArLrEiARQrLbBiLLAwK7AyKy2wYyywMCuwMystsGQssDArsDQrLbBlLLAxKy6xIgEUKy2wZiywMSuwMistsGcssDErsDMrLbBoLLAxK7A0Ky2waSwrsAhlsAMkUHiwARUwLQAAS7DIUlixAQGOWbkIAAgAYyCwASNEILADI3CwFEUgIEuwDVFLsAZTWliwNBuwKFlgZiCKVViwAiVhsAFFYyNisAIjRLMKCgUEK7MLEAUEK7MRFgUEK1myBCgIRVJEswsQBgQrsQYBRLEkAYhRWLBAiFixBgNEsSYBiFFYuAQAiFixBgNEWVlZWbgB/4WwBI2xBQBEAAAAAAAAAAAAAAAAAAAAAIkAAACJAAACv//gAsoCFv/l/toCv//MAsoCFv/l/toAAAAAAA8AugADAAEECQAAALgAAAADAAEECQABABYAuAADAAEECQACAA4AzgADAAEECQADADQA3AADAAEECQAEABYAuAADAAEECQAFABoBEAADAAEECQAGACQBKgADAAEECQAHAFIBTgADAAEECQAIAB4BoAADAAEECQAJACwBvgADAAEECQAKAWAB6gADAAEECQALACQDSgADAAEECQAMACQDSgADAAEECQANASADbgADAAEECQAOADQEjgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMgAgAGIAeQAgAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAgACgAdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAJwBWAGEAbQBwAGkAcgBvACcAVgBhAG0AcABpAHIAbwAgAE8AbgBlAFIAZQBnAHUAbABhAHIAUwBvAHIAawBpAG4AVAB5AHAAZQBDAG8ALgA6ACAAVgBhAG0AcABpAHIAbwAgAE8AbgBlAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAVgBhAG0AcABpAHIAbwBPAG4AZQAtAFIAZQBnAHUAbABhAHIAVgBhAG0AcABpAHIAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAuAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAuAFIAaQBjAGMAYQByAGQAbwAgAEQAZQAgAEYAcgBhAG4AYwBlAHMAYwBoAGkAVgBhAG0AcABpAHIAbwAgAGkAcwAgAGEAIABsAG8AdwAgAGMAbwBuAHQAcgBhAHMAdAAgAHMAYwByAGkAcAB0ACAAZgBvAG4AdAAuACAASQB0ACAAdwBhAHMAIABpAG4AcwBwAGkAcgBlAGQAIABiAHkAIAB0AGgAZQAgADIAMAB0AGgAIABDAC4AIABJAHQAYQBsAGkAYQBuACAAdAByAGEAZABpAHQAaQBvAG4AIABvAGYAIABtAG8AbgBvAGwAaQBuAGUAIABzAGMAcgBpAHAAdABzAC4AIABWAGEAbQBwAGkAcgBvACAAaQBzACAAYgBlAHMAdAAgAHUAcwBlAGQAIABmAG8AcgAgAGQAaQBzAHAAbABhAHkAIABwAHUAcgBwAG8AcwBlAHMAIABhAHQAIABtAGUAZABpAHUAbQAgAHQAbwAgAGwAYQByAGcAZQAgAHMAaQB6AGUAcwAuAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAQ4AAAABAAIBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBGACsAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkARkAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEaARsBHADXAR0BHgEfASABIQEiASMBJAElAOIA4wEmAScAsACxASgBKQEqASsBLAC7AS0A2ADhAN0A2QCyALMAtgC3AMQAtAC1AMUAhwCrAL4AvwEuAIwA7wEvATABMQEyATMBNAE1ATYHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4AkhUAkxGA0RMRQNEQzEDREMyA0RDMwNEQzQHdW5pMDAxNQd1bmkwMDE2B3VuaTAwMTcHdW5pMDAxOAd1bmkwMDE5AlJTAlVTA0RFTAd1bmkwMEFEBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwRMZG90BGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uCGRvdGxlc3NqBEV1cm8LY29tbWFhY2NlbnQJYWN1dGUuY2FwDGRpZXJlc2lzLmNhcAlncmF2ZS5jYXAIcmluZy5jYXAOY2lyY3VtZmxleC5jYXAJY2Fyb24uY2FwCXRpbGRlLmNhcAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAQYAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
