(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.balthazar_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEQAYQByAGkAbwAgAE0AYQBuAHUAZQBsACAATQB1AGgAYQBmAGEAcgBhAC4ARABhAHIAaQBvACAATQBhAG4AdQBlAGwAIABNAHUAaABhAGYAYQByAGEAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAANAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgANAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPcAAAABAAIBAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wDiAOMAsACxAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wCbALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBAwCMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDSAMAAwQJSUwRFdXJvAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA9gABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABADgABAAAABcAagBwAHYAfACSAJgAngCwAL4BOADMAQIBOAFCAUwBkAFSAWwBbAFyAYQBigGQAAEAFwAGAAwAGwAlACcAKAAqAC8AMAA0ADgAOgA8AD0APgA/AEoATQBQAFYAWABaAF8AAQAl/5IAAQA4ADwAAQAY/+IABQAG/7oAOP/iADr/2ABK/+IAWv/nAAEAR//sAAEAJf/2AAQAJf/dAEf/4gCsAB4ArwAPAAMAR//sAFr/5wCsAB4AAwAG/7oAOP/OADr/4gANAA0APAAl/+IAQQAeAEX/zgBH/8kASv/sAFH/xABX/8QAWP/YAFn/xABhAB4ArAAeAK8AHgANAA4AFAAQ/8QAIwAeACX/yQBF/9gAR//YAFH/7ABZ/+IAagAUAG4AFACsAB4ArgAPAK8AHgACACX/4gBH/+IAAgCg/+wArwAjAAEArAAoAAYABgA8AA4AHgAjAC0AagBQAG4AUADlAFAAAQAGABQABAAGAB4ADgAeAGoAMgBuADIAAQAGAB4AAQAOAB4AAQA4AB4AAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
