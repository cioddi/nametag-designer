(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.doppio_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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XgGoAwcGFxIUJhcVOCcNJCotFTI3AAACALYAAAU1BXEABQAKADSyAwADK7IGAAMREjmyCAADERI5sgoAAxESObADELAM3ACwAEVYsAQvG7EEET5ZsQYD9DAxNwEzARUhJQEnBwG2Ae6kAe37gQN6/s4ICf7OlwTa+yaX4gL2Hh79CgABAKD//QXyBXIAMQChsDIvsB8vsDIQsAbQsAYvsSkN9LQGKRYpAl22Jik2KUYpA12yAQYpERI5QAsJHxkfKR85H0kfBV2wHxCxEA30shUfEBESObIZBhAREjmyLwYQERI5sDPcALAARViwFy8bsRcRPlmwAEVYsBkvG7EZET5ZsABFWLAvLxuxLxE+WbAARViwMS8bsTERPlmzCwUkBCuwMRCxAAP0sBXQsBbQMDE3My4DNTQ+AjMyHgIVFA4CBzMVIQc1PgM1NC4CIyIOAhUUHgIXFSchoPAtSzcfUqHvnp70p1YfN0st7/29CVt+TyMoYqZ/fqJdJCRPflsK/b3gMHF/i0ui+alYWKn5okuLf3Ew4AONS4+Qk1BgpntGRnumYFCTkI9LjQMAAQAl//oEuwQJABcAWbAYL7ATL7AYELAA0LAAL7ATELEGDfSwABCxFQr0ALAARViwDC8bsQwRPlmwAEVYsA4vG7EOET5ZsABFWLAWLxuxFhE+WbMCBQEEK7ABELAE0LABELAU0DAxEyM1IRUjEQYeAhcVBiMuAzURIREj1K8ElsUBITdHJyovSntaMv6d2gM209P+VlNcLg4FnAYBMVd5SQHx/MsA//8AtgAABKwHORImACUAABAHAUgBygF0//8Apv/hBFwGEhImAEUAABAHAUgB+gAA//8AtgAABOcHORImACcAABAHAUgB5wF0//8AZv/hBBwGEhImAEcAABAHAUgBNwAA//8AtgAABBAHORImACkAABAHAUgBZQF0//8AWgAAAykHhxImAEkAABAHAUgAvgHC//8AtgAABhAHORImADAAABAHAUgCnQF0//8ApgAABnsFxRImAFAAABAHAUgCygAA//8AtgAABG8HORImADMAABAHAUgBmgF0//8Apv4bBFIFxRImAFMAABAHAUgBmwAA//8AbP/hA/IHORImADYAABAHAUgBZQF0//8AdP/hA6cFxRImAFYAABAHAUgBQAAA//8ADAAABFYHORImADcAABAH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BJwAfwScAH8EnAB/BJwAfwScAH8EnAB/BvUAfwPFAF4EPQBeBD0AXgQ9AF4EPQBeAmgAAQJ5AFUCYv/nAl7/zgSVAG8E2wCmBKQAXgSkAF4EpABeBKQAXgSkAF4EZAA8BLAAXgTdAKYE3QCmBN0ApgTdAKYEQQAMBMwApgRBAAwE/AAOBJwAfwT8AA4EnAB/BPwADgScAH8EmwBzA8UAXgSbAHMD8wBeBJsAcwPFAF4EmwBzBBAAXgVaALYFNQBoBYsAPAStAGgEfQC2BD0AXgR9ALYEPQBeBH0AtgQ9AF4EfQC2BD0AXgR9ALYEPQBeBUYAcwTMAHIFRgBzBMwAcgVGAHMEzAByBUYAcwTMAHIFsAC2BQP/uwXTAAAFAgA8Amj/nQJo/7oCZ//UAmf/+wJb/9cCUf/tAoEAQQJoACgCfQC2AjQAowUbALYEpACjAvkAQQKZ/+IFIQC2BIUApgR7AKYEMwC2AlkApgQgALYCYgCmBCYAtgLuAKYEPwC2Ax8ApgSeAHsC6QBaBfEAtgTbAKYF8QC2BNsApgXxALYE2wCmBfEAtgTbAKYFeQBzBKQAXgV5AHMEpABeBXkAcwSkAF4HsABzBysAXgUFALYDTgCWBQUAtgMwAKYFBQC2AzT/rARWAGwECwB0BFYAbAQLAHQEVgBsBAsAdARWAGwECwB0BGIADANgAFQEYgAMA1wAUgScACkDewBnBX0AsQTdAKYFfQCxBN0ApgV9ALEE3QCmBX0AsQTdAKYFfQCxBPoApgV9ALEE3gCmB5YAIwYSAAwExQAABEEADATFAAAE/ABaBEQAdQT8AFoERAB1BPwAWgREAHUDBwBRBssADgb1AH8EVgBsBAsAdAJi/9gDZAAzA2QAMwMrAD0BiwA9AnMAPQIEAD0DqgA9BBAAPQYBALYGqgCgBVUAJQUgALYEzACmBVoAtgTCAGgEVgC2AwcAWgbGALYHHwCmBL8AtgTCAKYEVgBsBAsAdARiAAwDYABUB5YAIwYSAAwHlgAjBhIADAeWACMGEgAMBMUAAARBAAwEdAA8CHYAPAH8AF0B/ABlAfwAZQQCAGcEAgCNBAIAjQP6ADIEEAA9ArEAZgWEAGYI0QBBAqwAcQKsAHEDnAAKBNUASAdQAMAEqgBhBqoAwASsAD8DLAA8BVEAPQdZAKgDVABBBWYAPAQmAEYD7QBa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AHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4AUwB6AHkAbQBvAG4AIABDAGUAbABlAGoARABvAHAAcABpAG8AIABpAHMAIABhACAAcgBvAGIAdQBzAHQAIABsAG8AdwAgAGMAbwBuAHQAcgBhAHMAdAAgAHMAYQBuAHMAIABzAGUAcgBpAGYAIAB0AHkAcABlACAAdwBpAHQAaAAgAGEAIABjAG8AbgB0AGUAbQBwAG8AcgBhAHIAeQAgAGYAZQBlAGwAaQBuAGcALgAgAEQAbwBwAHAAaQBvACAAdwBpAGwAbAAgAHcAbwByAGsAIABmAHIAbwBtACAAcwBtAGEAbABsACAAdABlAHgAdAAgAHMAaQB6AGUAcwAgAHQAaAByAG8AdQBnAGgAIABsAGEAcgBnAGUAIABkAGkAcwBwAGwAYQB5ACAAcwBpAHoAZQBzAC4AIABEAG8AcABwAGkAbwAnAHMAIABiAG8AeAB5ACAAcwB0AHkAbABlACAAbQBhAGsAZQBzACAAaQB0ACAAZQBzAHAAZQBjAGkAYQBsAGwAeQAgAHMAdQBpAHQAYQBiAGwAZQAgAGYAbwByACAAcwBjAHIAZQBlAG4AIAB1AHMAZQAuAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtAHcAdwB3AC4AaAB5AHAAbgBvAHQAeQBwAGUALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABjAG8AcABpAGUAZAAgAGIAZQBsAG8AdwAsACAAYQBuAGQAIABpAHMAIABhAGwAcwBvACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/ZgBmAAAAAAAAAAAAAAAAAAAAAAAAAAABjwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQIBAwEEAQUBBgEHAP0A/gEIAQkBCgELAP8BAAEMAQ0BDgEBAQ8BEAERARIBEwEUARUBFgEXARgBGQEaAPgA+QEbARwBHQEeAR8BIAEhASIBIwEkASUBJgEnASgBKQEqAPoA1wErASwBLQEuAS8BMAExATIBMwE0ATUBNgE3ATgBOQDiAOMBOgE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHALAAsQFIAUkBSgFLAUwBTQFOAU8BUAFRAPsA/ADkAOUBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfAWABYQFiAWMBZAFlAWYBZwC7AWgBaQFqAWsA5gDnAKYBbAFtAW4BbwFwANgA4QDbANwA3QDgANkA3wCoAJ8AmwFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfAF9AX4BfwGAAYEBggGDAYQBhQGGALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBhwCMAJgAmgCZAO8ApQCSAJwApwCPAJQAlQC5AYgAwADBAYkBigGLAYwBjQGOAY8BkAdBbWFjcm9uB2FtYWNyb24GQWJyZXZlBmFicmV2ZQdBb2dvbmVrB2FvZ29uZWsLQ2NpcmN1bWZsZXgLY2NpcmN1bWZsZXgKQ2RvdGFjY2VudApjZG90YWNjZW50BkRjYXJvbgZkY2Fyb24GRGNyb2F0B0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQMR2NvbW1hYWNjZW50DGdjb21tYWFjY2VudAtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdJbWFjcm9uB2ltYWNyb24GSWJyZXZlBmlicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMS2NvbW1hYWNjZW50DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMGTGFjdXRlBmxhY3V0ZQxMY29tbWFhY2NlbnQMbGNvbW1hYWNjZW50BkxjYXJvbgZsY2Fyb24ETGRvdARsZG90Bk5hY3V0ZQZuYWN1dGUMTmNvbW1hYWNjZW50DG5jb21tYWFjY2VudAZOY2Fyb24GbmNhcm9uA0VuZwNlbmcHT21hY3JvbgdvbWFjcm9uBk9icmV2ZQZvYnJldmUNT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uBlNhY3V0ZQZzYWN1dGULU2NpcmN1bWZsZXgLc2NpcmN1bWZsZXgMVGNvbW1hYWNjZW50DHRjb21tYWFjY2VudAZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHQUVhY3V0ZQdhZWFjdXRlDFNjb21tYWFjY2VudAxzY29tbWFhY2NlbnQIZG90bGVzc2oHdW5pMUUwMgd1bmkxRTAzB3VuaTFFMEEHdW5pMUUwQgd1bmkxRTFFB3VuaTFFMUYHdW5pMUU0MAd1bmkxRTQxB3VuaTFFNTYHdW5pMUU1Nwd1bmkxRTYwB3VuaTFFNjEHdW5pMUU2QQd1bmkxRTZCBldncmF2ZQZ3Z3JhdmUGV2FjdXRlBndhY3V0ZQlXZGllcmVzaXMJd2RpZXJlc2lzBllncmF2ZQZ5Z3JhdmUERXVybwJmZgl0aWxkZS5jYXAIcmluZy5jYXAJY2Fyb24uY2FwDmNpcmN1bWZsZXguY2FwCWFjdXRlLmNhcAlncmF2ZS5jYXALY29tbWFhY2NlbnQQaHVuZ2FydW1sYXV0LmNhcAAAAAEAAwAIAA4AKgAP//8ADgABAAAADAAAAAAAAAACAAQAAQDyAAEA8wD0AAIA9QGDAAEBhAGGAAIAAQAAAAoADAAOAAAAAAAAAAEAAAAKACYAZAABbGF0bgAIAAQAAAAA//8ABQAAAAEAAgADAAQABWNhbHQAIGxpZ2EAJnNtY3AALHN1YnMAMnN1cHMAOAAAAAEAAgAAAAEAAQAAAAEAAAAAAAEABAAAAAEAAwAGAA4CVgLYAwgDRgNyAAEAAAABAAgAAgHWAOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABEAJAA9AAAARABdABoAgQCGADQAiACQADoAkgCXAEMAmgCeAEkAoQCmAE4AqACwAFQAsgC3AF0AugC+AGMAwADwAGgA9QD4AJkA+gEJAJ0BDAERAK0BFAE+ALMBQgFDAN4BXgFlAOAABAAAAAEACAABAG4ABAAOABgALgBkAAEABADzAAIALQABAAQAAAAIAFoATABTAE8AUgBKAFIABgAOABYAHgAkACoAMAAAAAMASQBMAAAAAwBJAE8BhQACAEwBhAACAEkBhgACAE8AAAACAFcAAQAEAPQAAgBNAAEABAAsAEgASQBMAAYAAAABAAgAAwABABYAAQCgAAIAHAAiAAEAAAAFAAEAAQBIAAEAAQBMAAEAAQBTAAEAAAABAAgAAgAgAA0AAAB6AHMAdAAAAAAAAAAAAAAAAABsAAAAewACAAMAEwAcAAAARABEAAoAUQBSAAsAAQAAAAEACAACABoACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAQATABwAAAABAAAAAQAIAAEABv+mAAEAAQBaAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
