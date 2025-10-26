(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.boogaloo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHIAcwBpAG8AbgAgADEALgAwADAAMgBCAG8AbwBnAGEAbABvAG8ALQBSAGUAZwB1AGwAYQByAEIAbwBvAGcAYQBsAG8AbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEoAbwBoAG4AIABWAGEAcgBnAGEAcwAgAEIAZQBsAHQAcgBhAG4ALgBKAG8AaABuACAAVgBhAHIAZwBhAHMAIABCAGUAbAB0AHIAYQBuAHcAdwB3AC4AagBvAGgAbgB2AGEAcgBnAGEAcwBiAGUAbAB0AHIAYQBuAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/XwBPAAAAAAAAAAAAAAAAAAAAAAAAAAABGgAAAAEAAgECAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQEDAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugD9AP4A/wEAAQUA+AD5AQYBBwEIAQkA1wEKAQsBDAENAQ4BDwEQAREA4gDjARIBEwCwALEBFAEVARYBFwEYAPsA/ADkAOUAuwDmAOcApgEZANgA4QDbANwA3QDgANkA3wEaAJ8AmwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8APcBGwCMAJgBHACaAJkA7wClAJIAnACnAI8AlACVALkBHQDSAMAAwQd1bmkwMDExB25ic3BhY2UJc2Z0aHlwaGVuBmRzbGFzaARoYmFyBkl0aWxkZQZpdGlsZGUESWRvdAJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24IZG90bGVzc2oMZG90YWNjZW50Y21iBEV1cm8JaW5jcmVtZW50EGRvdGFjY2VudGNtYi5jYXAAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQADARkAAQAAAAEAAAAKACQAMgACREZMVAAObGF0bgAOAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQBkAAQAAAAtAMIA/AFKAWAGbgF2AcwB7gIQAjYHGgaMAlgCrgLsA3oDxAQaBDwEkgS4BPYE/AbmBSoFeAWKBcQIIAimBfYGQAZuBowGsgbQBuYHDAcaB1wHogdcB6IIIAimAAEALQARACUAJgAnACgAKgArACwALgAvADAAMwA0ADYAOAA6ADsAPAA9AD4ASgBPAFIAUwBWAFoAWwBdAG4AfgCIAIkAkwCbAKIAsAC7AMwA1wD4APoA+wD9AQMBBAAOACcAEwArABMALgATADMAEwA4/8kAPf/XAFIAEwBTABMAVgATAJsAEwCiABMAuwATANsAEwDcABMAEwAQACAAEQATABIAIAAeABMAHwATACUAEwA4/+UAPAATAD3/7gBuABMAfgAlAPj/7gD5/9wA+gATAPv/7gD8/9wA/QATAQMAEwEEACUABQARABwAbgATAH4AJQEDABMBBAAlAAUAEQATAG4AEwB+ACUBAwATAQQAJQAVABD/qQAS/6kAHgATAB8AEwAl/9wAOAATAEX/7gBJ/+4ATQATAG4AEwB+ACUAiP/cAKn/7gD4ABMA+QATAPr/pAD7ABMA/AATAP3/pAEDABMBBAAlAAgAEQATADgAEwBuABMAfgAlAPoAEwD9ABMBAwATAQQAJQAIAB4AEwAfABMAbgATAH4AJQD4ABMA+wATAQMAEwEEACUACQARABMAbgATAH4AJQD4ABMA+QATAPsAEwD8ABMBAwATAQQAJQAIAH4AJQD4ACUA+QATAPoAIAD7ACUA/AATAP0AIAEEACUAFQAQ/38AEv9/AB4AEwAfABMAJf/hAEX/3ABJ/+4AUv/uAFP/7gBX/+4AXQATAH4AJQCI/+EAqf/cALv/7gDc/+4A+QAXAPr/bQD8ABcA/f9tAQQAJQAPABAAEwARABcAEgATAB4AJQAfACUAWQATAF3/3ABuACUAfgAlAPkAEwD6ABMA/AATAP0AEwEDACUBBAAlACMAEP/JABH/yQAS/8kAHv/TAB//0wAl/+UARf/JAEf/yQBJ/8kATQATAFP/yQBW/9wAV//JAFn/1wBb/9MAXf/TAG7/7gCI/+UAo//dAKn/yQCr/90Arv/dAK8AIgCwAAIAtf/nALn/2AC7/8kA3P/JAPgAJQD5ABMA+v/cAPsAJQD8ABMA/f/cAQP/7gASABD/yQAS/8kAJf/uAEX/3ABJ/9wAU//cAFn/3ABd/9wAiP/uAKn/3AC7/9wA3P/cAPgAJQD5ABMA+v/cAPsAJQD8ABMA/f/cABUAEP/XABL/1wAl/+4ARf/cAEn/3ABT/9wAVv/cAFn/3ABd/+4AfgATAIj/7gCp/9wAu//cANz/3AD4ABwA+QATAPr/7gD7ABwA/AATAP3/7gEEABMACAB+ACUA+AAlAPkAEwD6ACUA+wAlAPwAEwD9ACUBBAAlABUAEP+8ABH/1wAS/7wAJf/cAEX/yQBJ/84ATQATAFP/zgBZ/9cAbv/cAIj/3ACp/8kAu//OANz/zgD4ACUA+QATAPr/yQD7ACUA/AATAP3/yQED/9wACQAR/+4Abv/uAH4AJQD4ABMA+gATAPsAEwD9ABMBA//uAQQAJQAPABD/7gAS/+4AHgATAB8AEwBYABMAWwATAF0AEwBuABMAfgAlAPgAMwD5ADMA+wAzAPwAMwEDABMBBAAlAAEAXQATAAsAEQATAG4AEwB+ACUA+P/uAPkAEwD6ABMA+//uAPwAEwD9ABMBAwATAQQAJQATABD/rwARACUAEv+vAB4AEwAfABMASgATAFoAEwBbABMAXQATAG4AJQB+ACUA+QAXAPr/xQD8ABcA/f/FAQMAJQEEACUBGAATARkAEwAEABD/6gAS/+oAHgAlAB8AJQAOABD/7gAS/+4AHgAlAB8AJQBuABwAfgAlAPgAHAD5ACUA+v/qAPsAHAD8ACUA/f/qAQMAHAEEACUADAAeACUAHwAlAG4AHAB+ACUA+AAlAPkAJQD6/+4A+wAlAPwAJQD9/+4BAwAcAQQAJQASABAAIAARABMAEgAgAB4AEwAfABMAOP/lADwAEwA9/+4AbgATAH4AJQD4/+4A+f/cAPoAEwD7/+4A/P/cAP0AEwEDABMBBAAlAAsAEQATAG4AEwB+ACUA+AAlAPkAEwD6ABMA+wAlAPwAEwD9ABMBAwATAQQAJQAHABEAEwBuACUAfgAlAPkAEwD8ABMBAwAlAQQAJQAJABEAEwAeABMAHwATAG4AEwB+ACUA+QATAPwAEwEDABMBBAAlAAcAEQAXAG4AFwB+ACUA+QATAPwAEwEDABcBBAAlAAUABQBBAAsAVQAOAEsAIwBLAPwAVQAJABEAEwAeABMAHwATAG4AEwB+ACUA+P/uAPv/7gEDABMBBAAlAAMACwAtACMALQD8AC0AEAAR/+4AJQATADj/yQA6/9wAO//cAD3/xQBd/9wAbv/uAH4AJQCIABMA+P+3APn/xQD7/7cA/P/FAQP/7gEEACUAEQAl/8UALv+NADgAEwA6ABMAOwAXADwAEwA9ABMASgAcAFIAEwBWABMAWwAlAF0AJQCI/8UAif/AAKIAEwEYABwBGQAcAB8AJQATACYAEwAnABMAKAATACoAEwArABMALAATAC4AEwAvABMAMAATADMAEwA0ABMANgATADj/5QA6/+4APAAXAD3/3AA+ABMAUgATAFMAEwBWABMAXQATAIgAEwCJACUAkwATAJsAEwCiABMAuwATANcAEwDbABMA3AATACEAJQAlACYAJQAnACUAKAAlACoAJQArACUALAAlAC4AJQAvACUAMAAlADMAJQA0ACUANgAlADsAEwA8ACUAPgAlAEoAJQBSACUAUwAlAFYAJQBbACUAXQAlAIgAJQCJACUAkwAlAJsAJQCiACUAuwAlANcAJQDbACUA3AAlARgAJQEZACUAGgAmABMAJwATACgAEwAqABMAKwATACwAEwAuABMALwATADAAEwAzABMANAATADYAEwA4/+4APf/cAFIAEwBTABMAVgATAFsAEwBdABMAkwATAJsAEwCiABMAuwATANcAEwDbABMA3AATAAAAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
