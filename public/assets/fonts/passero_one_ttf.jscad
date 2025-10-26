(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.passero_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGEAcwBzAGUAcgBvACIAUABhAHMAcwBlAHIAbwAgAE8AbgBlAFIAZQBnAHUAbABhAHIAVgBpAGsAdABvAHIAaQB5AGEARwByAGEAYgBvAHcAcwBrAGEAOgAgAFAAYQBzAHMAZQByAG8AOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBQAGEAcwBzAGUAcgBvAE8AbgBlAC0AUgBlAGcAdQBsAGEAcgBQAGEAcwBzAGUAcgBvACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4AVgBpAGsAdABvAHIAaQB5AGEAIABHAHIAYQBiAG8AdwBzAGsAYQBQAGEAcwBzAGUAcgBvACAAaQBzACAAYQBuACAAaQBuAG4AbwB2AGEAdABpAHYAZQAgAGwAbwB3ACAAYwBvAG4AdAByAGEAcwB0ACAAcwBhAG4AcwAgAHMAZQByAGkAZgAgAHQAeQBwAGUALgAgAEQAZQBzAHAAaQB0AGUAIABoAGEAdgBpAG4AZwAgAGEAbgAgAHUAdAB0AGUAcgBsAHkAIABkAGkAcwB0AGkAbgBjAHQAaQB2AGUAIAB2AG8AaQBjAGUAIABpAHQAIAByAGUAbQBhAGkAbgBzACAAcgBlAG0AYQByAGsAYQBiAGwAeQAgAGwAZQBnAGkAYgBsAGUAIABhAG4AZAAgAHYAZQByAHMAYQB0AGkAbABlAC4AIABQAGUAcgBoAGEAcABzACAAdABoAGkAcwAgAGkAcwAgAGIAZQBjAGEAdQBzAGUAIABvAGYAIAB0AGgAZQAgAHcAYQB5ACAAUABhAHMAcwBlAHIAbwAgAGcAZQBuAHQAbAB5ACAAZQBjAGgAbwBzACAAbwBsAGQAIABzAHQAeQBsAGUAIAB0AGUAeAB0ACAAbABlAHQAdABlAHIAZgBvAHIAbQBzAC4AIABQAGEAcwBzAGUAcgBvACAAdwBpAGwAbAAgAHcAbwByAGsAIABiAGUAcwB0ACAAZgByAG8AbQAgAG0AZQBkAGkAdQBtACAAdABlAHgAdAAgAHMAaQB6AGUAcwAgAHQAaAByAG8AdQBnAGgAIABsAGEAcgBnAGUAIABkAGkAcwBwAGwAYQB5ACAAcwBpAHoAZQBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgB2AGkAawBhAG4AaQBlAHMAaQBhAGQAYQAuAGIAbABvAGcAcwBwAG8AdAAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/2YAZgAAAAAAAAAAAAAAAAAAAAAAAAAAAP0AAAABAAIBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEVAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBFgEXARgA1wEZARoBGwEcAR0BHgEfAOIA4wEgASEAsACxASIBIwEkASUBJgDYAOEA3QDZALIAswC2ALcAxAC0ALUAxQCHAKsAvgC/AScA7wd1bmkwMDAxB3VuaTAwMDIHdW5pMDAwMwd1bmkwMDA0B3VuaTAwMDUHdW5pMDAwNgd1bmkwMDA3B3VuaTAwMDgHdW5pMDAwOQd1bmkwMDEwB3VuaTAwMTEHdW5pMDAxMgd1bmkwMDEzB3VuaTAwMTQHdW5pMDAxNQd1bmkwMDE2B3VuaTAwMTcHdW5pMDAxOAd1bmkwMDE5B3VuaTAwQUQEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24ERXVybwAAAAEAAgAkAA///wAOAAEAAAAMAAAAAAAAAAIAAQABAPwAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
