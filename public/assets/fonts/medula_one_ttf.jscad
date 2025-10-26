(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.medula_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHQAeQBwAGUALgBjAG8AbQApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAcwAgACIATQBlAGQAdQBsAGEAIgBNAGUAZAB1AGwAYQAgAE8AbgBlAFIAZQBnAHUAbABhAHIATAB1AGMAaQBhAG4AbwBWAGUAcgBnAGEAcgBhADoAIABNAGUAZAB1AGwAYQAgAE8AbgBlADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIATQBlAGQAdQBsAGEATwBuAGUALQBSAGUAZwB1AGwAYQByAE0AZQBkAHUAbABhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAATABhAHQAaQBuAG8AVAB5AHAAZQAgAEwAaQBtAGkAdABhAGQAYQAuAEwAdQBjAGkAYQBuAG8AIABWAGUAcgBnAGEAcgBhAHcAdwB3AC4AbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA5gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wCwALEA5ADlALsA5gDnAKYA2ADhANwA3QDZAN8AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAEEAIwA7wDAAMEHdW5pMDBBMAd1bmkwMEFEBEV1cm8AAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMA5QABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABALoABAAAAFgBVAFeAXQBxgIgAi4O9gJEArIC5ANKA2gDrgPMA+4EHAQmBDwEdgSUBLIEzATmBPgFFgUsBUIFfAWSBZgHWAdCBaYGCAYaBjQGWgZ4BpYHFAdYB0IHWAdeB4AH3gh4CK4I6Aj6CTAJtgnkCfoKAAo+ClQKkgrMCvILOAtyC5wL3gwoDF4MmAzGDPwNUg1gDXoNiA2aDeQONg5ADlYOYA5qDqAO9g72DvwPAg8oDzIPQAACABkABQAFAAAACQALAAEADQAdAAQAIAAgABUAJAAmABYAKAAvABkAMQAzACEANQA3ACQAOQA/ACcARABEAC4ARgBKAC8ATABPADQAUQBSADgAVABeADoAYABgAEUAeQB5AEYAgQCBAEcAmgCaAEgAoAChAEkAsACyAEsAugC6AE4A0wDVAE8A2ADYAFIA3gDgAFMA4gDjAFYAAgAS/7QA2P+4AAUACv/rADf/7AA5//oATf/xANT/7AAUABD/3wAR/74AEv+9AB3/3gAj//IARP/pAEn/+gBK/+YATf/uAFH/8QBS/+YAVv/qAFf/9QBY//MAWf/yAFv/8QBd/+0AsQAMAN7/5ADf//EAFgAT//gAFf/7ABn/+QAb//gAHP/5ACT/+AAo//gAMv/4ADb/+QBE//MASf/4AE0ACwBR//YAUv/zAFb/8wBX//YAWP/5AFn/9wBb//cAXf/0AF7/9QCxAA8AAwAt//YAPf/7ALAAFQAFABT/7gAV//MAFv/1ABf/+wAa/+8AGwAK/+kAFP/sABX/8AAW//IAF//3ABj/+QAZ//sAGv/tABv/+QAo//oALP/7AC3/8wA2//cAN//lADn/9wA7//gAPP/3AD3/7wBJ//YATP/7AE3/6QBR//kAV//3AFn/+wBb//kAXf/uANT/5gAMAAr/vwAQ/+AAF//jADf/5gA5/+0APP/6AEn/+QBN/+QAV//4AFn/8ADT/74A1P++ABkAEv8nABP/9QAV//gAFv/5ABn/9gAb//UAHP/2ACT/9QAo//UALf/6ADL/9QA2//YARP/rAEn/9gBK/+kATf/0AFH/8gBS/+oAVv/rAFf/9ABY//YAWf/1AFv/9ABd/+4AsQAPAAcADP/4ABL/6AA3//sAP//1AED/9wBg//kA4P/7ABEACv/1AAz/9gAO//MAEP/xABL/9QAX//YAIP/0ADf/8wA5//oAP//wAED/8gBN//YAWf/7AGD/9gBy//UAef/yAOP/8QAHAA7/8QAQ/+8AEv/xACD/9AA///kAef/xAOP/8AAIAAz/+QAQ//oAEv/oAD//9gBA//gAYP/6AOD/+wDj//oACwAM//oADv/5ABD/9wAS//IAIP/4ADf/+gA///YAQP/4AGD/+wB5//gA4//2AAIAEv/qAE3/8QAFAAz/+wAS/+kAP//2AED/+QBg//sADgAG//EADv/xABD/7wAR/+MAEv/VACD/8wBE//gASv/2AFL/9wBW//gAZP/5AHn/8gDg/+QA4//xAAcADP/4ABD/+gAS/+gAP//1AED/9wBg//kA4//6AAcADP/5ABL/6QA3//sAP//1AED/9gBg//kA4//7AAYACv/nADf/5wA5//gAPP/7AE3/9ADU/+QABgAU//EAFf/2ABb/+AAX//gAGP/7ABr/8gAEABL/+gA3//sAP//3AED/+gAHAAz/9wAQ//oAEv/oADf/+gA///MAQP/1AGD/+AAFAAz/+wAQ//QAEv/qAD//9wBA//kABQAM//sAEP/zABL/7AA///cAQP/6AA4AEf/sABL/2wAd//sAI//4AC3/+gBE//oASv/8AE3/+wBR//wAUv/7AFb//ABX//wAXf/2ALEACgAFABD/+wAS//gAN//6AD//9gBA//kAAQAS//gAAwAQ//sAEv/uAD//+wAYAAr/4QAM//UADf/hABD/3gAS//YAF//lAB3/9wAi//cAN//MADn/4AA8//oAP//eAED/8ABJ//oATf/VAFf/4QBY//wAWf/fAGD/9AB5/9MA0//hANT/4QDe//cA4v/hAAQAEv/5ADf/+gA///cAQP/5AAYADP/5ABL/6AA3//sAP//1AED/9wBg//oACQAM//oAEf/kABL/1gAj//oALf/3AD3/+gA///cAQP/5AGD/+wAHAAz/+AAQ//oAEv/wADf/+QA///MAQP/1AGD/+QAHAAz/+QAQ//oAEv/pADf//AA///UAQP/3AGD/+gAfABD/5QAR/+cAEv/bAB3/5gAi/+oAI//xACT/+wAo//sALf/pADL/+wA2//wARP/fAEn/9QBK/+AATP/7AE3/3gBR/+UAUv/eAFb/4ABX/+wAWP/nAFn/4gBb/+UAXf/bAKX/5gCuAAEAsAAEALEADwDC/+cA3v/pAN//6gALABD/9wAR/+0AEv/dAB3/+QAj//cALf/4AET/+gBK//oAUv/5AFb/+wDe//oABQAQ//gAEv/2ADf//AA///oAQP/7AAEAEv/oAAgAEP/tABL/8AAd//oASv/8AFL//ACwAAkAsQAHAN7/+gAXABP/9gAV//oAFv/6ABn/9wAb//YAHP/3ACT/9gAo//YAMv/2ADb/9wBE/+0ASf/3AE0ADQBR//QAUv/sAFb/7QBX//UAWP/3AFn/9gBb//UAXf/wAF7/7ACxABAAJgAK/70AE//nABT/8AAV/+0AFv/pABf/1AAY/+kAGf/nABr/6gAb/+gAHP/pACT/7AAo/+cAK//uACz/7AAt/+kAMv/nADb/6AA3/9kAOP/rADn/3AA7/+wAPP/lAD3/7wBE/+sASf/oAEv/7ABM/+sAT//rAFH/6gBS/+oAVv/sAFf/5QBY/+oAWf/gAFv/6wBd//AA1P+3AA0ACv/vAAz/+AAS//gAF//5ADf/4gA5//cAP//qAED/8ABN//UAYP/4ANP/5ADU/+wA4v/vAA4ACv/3AAz/9AAS/+8AF//6ADf/1gA5//oAPP/8AD//7ABA/+4AYP/0ANP/6gDU//QA3v/4AOL/8AAEABD/+QAS//QAN//5AE3//AANAAr/9gAM//MAEv/tABf/+gA3/98AOf/7AD//6wBA/+4AYP/zANP/6QDU//MA3v/7AOL/8AAhAAwADQANABAAEP/oABH/4wAS/9gAFAARABYABQAXABcAGgATAB3/9gArABoALf/7ADcAFwA4ABwAOQAhADsAGAA8ABoAPQAIAEAADQBE//sASv/5AFL/+QBW//wAYAAPAKUABQCuACAAsAA1ALEAMQC3AAEA0wANANQADgDe/+kA4gAIAAsACv/6ABf/+gAt//wAN//hADn/+wA8//wAP//sALoABgDT/+wA1P/1AOL/8AAFABD/+QAS//QAN//6AE3//ADU//gAAQDU//sADwAK/+0ADP/2AA3/+QAQ//kAEv/1ABf/9wA3/+AAOf/0AD//6gBA/+8AYP/2ANP/5QDU/+sA3v/7AOL/7QAFABD/+QAS//QAN//5AE3//AB5/+4ADwAK/+4ADP/3AA3/+wAQ//sAEv/3ABf/+AA3/+EAOf/2AD//6QBA/+8ATf/6AGD/9wDT/+MA1P/rAOL/7wAOAAr/8QAM//MAEv/rABf/+QAa//sAN//eADn/9wA8//sAP//pAED/7ABg//MA0//mANT/7gDi/+8ACQAK//oAF//6ADf/3wA5//kAPP/8AD//7ADT/+wA1P/1AOL/8AARAAr/9QAM//MAEf/aABL/2gAU//UAGv/1ACP/+wAt/+0AN//XAD3/6QA//+4AQP/vAGD/8wDT/+cA1P/wAN7/+QDi//MADgAK//UADP/zABD/+wAS/+wAF//6ADf/4QA5//oAPP/8AD//6wBA/+0AYP/zANP/6ADU//IA4v/vAAoADP/2ABD/+wAS/+8AN//bAD//7wBA//EAYP/2ANP/7wDU//gA4v/xABAACv/2AAz/9QAN//sAEP/5ABL/9AAX//cAN//fADn/9QA8//wAP//qAED/7gBN//wAYP/1ANP/6QDU//EA4v/uABIADP/zABH/8AAS/+EAFP/4ABr/9wAj//oALf/yADf/4gA5//wAO//7ADz//AA9//EAP//vAED/8ABg//MA0//uANT/9wDi//EADQAK//kADP/zABL/6wAX//oAN//fADn/+gA8//wAP//sAED/7wBg//MA0//sANT/9ADi//EADgAK//cADP/2ABD/+QAS//UAF//3ADf/3wA5//QAP//qAED/7wBg//YA0//qANT/8gDe//sA4v/uAAsACv/5ABf/+QA3/98AOf/5ADz//AA//+wAQP/7AGD/+gDT/+sA1P/0AOL/8AANAAz/9AAQ//YAEv/xABf/+wAt//wAN//bAD//7wBA//EAYP/1ANP/7gDU//YA3v/0AOL/8QAVABP/+QAZ//kAG//5ABz/+gAk//kAKP/5ADL/+QA2//oARP/zAEn/+QBNAAcAUf/2AFL/8wBW//MAV//3AFj/+QBZ//cAW//3AF3/9QBe//MAsQASAAMADP/1AED/7QBg//MABgAU/+4AFf/yABb/9AAX//gAGv/uAE//8gADADf/8wA5//sATf/2AAQADAAFAD8ACQBAAAYAYAAIABIACv/vAAz/8wAR//EAEv/eABT/8gAV//oAGv/1AC3/+wA3/9kAOf/4ADz/+wA9//MAP//mAED/6gBg//MA0//oANT/7gDi//EAFAAK//EADP/1AA3/7wAQ//cAEv/uABf/9wAi//YAN//oADn/9gA8//sAP//uAED/8ABJ//kATf/kAFf/+gBZ//cAYP/1ANP/8QDU//EA4v/yAAIADQASANQADQAFAAwADAA/AA0AQAAMAGAADgDTAAYAAgAS/+sAOQAFAAIACv/7ANf/9AANABH/vgAt//gARP/xAEn/+wBK/+0ATf/1AFH/+QBS/+4AVv/yAFf/+QBb//oAXf/1ALAADAAVABD/3wAR/74AEv+0AB3/3gAj//IARP/oAEn/+gBK/+UATf/uAFH/8ABS/+YAVv/pAFf/9QBY//MAWf/xAFv/8ABd/+0AsQAKANj/uADe/+MA3//wAAEATf/uAAEAN//rAAkACv/vADf/6gA5//oAPf/7AET/+wBJ//sATf/rAF3/9ADU/+wAAgAT//sAG//7AAMALf/4ADf/+wA9//gACAAU/+wAFf/xABb/8gAX//cAGP/6ABn/+wAa/+wAG//5AAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
