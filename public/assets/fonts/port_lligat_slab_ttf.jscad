(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.port_lligat_slab_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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Ad8AQQI6ADcChwBBAT0ASwEZ/4sCFABBAbsAQQMWADcCigA8AlkANwITAEECWQA3AjQAQQHgACAB4QAPAoQANwI5AAEDLgABAhkADwHvAAEB5gAeAUkASwI2AGABSQAUAlkAUAH2ABQBqABuAdkAMgHhABkBrgAtAfMAMgHDAC0BSwAiAdIAGQIVADQBBwA0AP7/xAHcAC0A/AAtAvsANAIVADQB0gAtAe4AJQHyADIBWwAgAZMAHQEzAAoB9gAjAcb/+wKF//sBmwAAAbf/7wGQAA8BWAAeAQcAWgFYABQCWQBUAQ4AMgHWACgCIgA3Ae4AAwEHAFoB4AAjAdkAbgJoADwBRwArAe8AHgJZAFcCaAA8AdMAbgFWACgCWQBXAV0AJQFyACkBqABuAeUAOgIAAEsBDgBaAfYAlwEdAB4BSwAwAe8ARgN5AFADeQBQA3kASQGtADYCMf//AjH//wIx//8CMf//AjH//wIx//8DCP//AhgANwIHAEECBwBBAgcAQQIHAEEBPQA8AT0ASwE9AAsBPQAfAmgALQKKADwCWQA3AlkANwJZADcCWQA3AlkANwJZAGgCWQA3AoQANwKEADcChAA3AoQANwHvAAECCgA+AhkAGgHZADIB2QAyAdkAMgHZADIB2QAyAdkAMgLMADIBrgAtAcMALQHDAC0BwwAtAcMALQEHAA4BBwA0AQcAAgEHAAkB5gA3AhUANAHSAC0B0gAtAdIALQHSAC0B0gAtAlkAVwHSAC0B9gAjAfYAIwH2ACMB9gAjAbf/7wHuACABt//vAQcANAG7ABsA/AAOAyYANwLoAC0B4AAgAZMAHQHvAAEB5gAeAZAADwGQ/8sB6ABuAegAbgHaAG4A6wA8AYIAbgFAADIB/ABuA1AAdgJtADIB9gAUAtsAFAEFADwBBQA8ARkAUAG6ADwBugA8Ac4AUAGrAAoBqwAIAS4APAMqAFoExwAyASoAHgEqAEYDeQEWAXkAKwEJABIBXQAlAXIAKQFoACABcgAsAWQAJAE4ABcBVwAfAWQAJAJOABQCqQApAtcAPQHmACsCMQAOAu8ARgI+ADMCWQBXAlkALwMGADIBkAAAAlkAVAJZAFcCWQBXAlkAVwJXADwCHAAiAggAGgABAAADXP8tAAAEx/+L/7AEnwABAAAAAAAAAAAAAAAAAAAA/wACAY4BkAAFAAACvAKKAAAAjAK8AooAAAHdADIA+gAAAgAAAAAAAAAAAIAAAK9AACBLAAAAAAAAAABweXJzAEAAIPsCA1z/LQAAA1wA0yAAAAEAAAAAAJsAYwAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQBSAAAAE4AQAAFAA4AfgCjAKwA/wExAUIBUwFhAXgBfgGSAscC3QPAIBQgGiAeICIgJiAwIDogRCCJIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvsC//8AAAAgAKEApQCuATEBQQFSAWABeAF9AZICxgLYA8AgEyAYIBwgICAmIDAgOSBEIIAgrCEiISYiAiIGIg8iESIaIh4iKyJIImAiZCXK+wH////j/8H/wP+//47/f/9w/2T/Tv9K/zf+BP30/RLgwOC94Lzgu+C44K/gp+Ce4GPgQd/M38ne7t7r3uPe4t7b3tjezN6w3pneltsyBfwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBI0AAAAADgCuAAMAAQQJAAAAugAAAAMAAQQJAAEAIAC6AAMAAQQJAAIADgDaAAMAAQQJAAMAOADoAAMAAQQJAAQAIAC6AAMAAQQJAAUAGgEgAAMAAQQJAAYALAE6AAMAAQQJAAcAUAFmAAMAAQQJAAgACAG2AAMAAQQJAAkATgG+AAMAAQQJAAsALAIMAAMAAQQJAAwALAIMAAMAAQQJAA0BIAI4AAMAAQQJAA4ANANYAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABUAGkAcABvACAAKABoAHQAdABwADoALwAvAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AC4AYQByACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIAUABvAHIAdAAgAEwAbABpAGcAYQB0ACAAUwBsAGEAYgAiAFAAbwByAHQAIABMAGwAaQBnAGEAdAAgAFMAbABhAGIAUgBlAGcAdQBsAGEAcgBUAGkAcABvADoAIABQAG8AcgB0ACAATABsAGkAZwBhAHQAIABTAGwAYQBiADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADIAUABvAHIAdABMAGwAaQBnAGEAdABTAGwAYQBiAC0AUgBlAGcAdQBsAGEAcgBQAG8AcgB0ACAATABsAGkAZwBhAHQAIABTAGwAYQBiACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAVABpAHAAbwAuAFQAaQBwAG8ARABhAHIAaQBvACAATQB1AGgAYQBmAGEAcgBhACwAIABFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA2wDcAN0A4ADZAN8AmwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQIBAwEEAQUBBgEHAQgBCQEKAQsBDACMAJ8AmACoAJoAmQDvAKUAkgCcAKcAjwCUAJUAuQDAAMEMemVyb2luZmVyaW9yC29uZWluZmVyaW9yC3R3b2luZmVyaW9yDXRocmVlaW5mZXJpb3IMZm91cmluZmVyaW9yDGZpdmVpbmZlcmlvcgtzaXhpbmZlcmlvcg1zZXZlbmluZmVyaW9yDWVpZ2h0aW5mZXJpb3IMbmluZWluZmVyaW9yBEV1cm8AAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAMA/gABAAAAAQAAAAoAJAAyAAJERkxUAA5sYXRuAA4ABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAEACAABADwABAAAABkAcgB4AIIAoACmAKwAxgDQAO4BBAFGAUwBfgGcAaICFgHEAcoB7AICAgwCFgIcAhwCIgABABkABQAaACQAJgAnACkALgAvADMANwA4ADkAOgA7ADwAPgBFAEkAVQBXAFkAXgBiAH4AwQABACT/ugACABf/zgAaACgABwAF/7oAN//OADj/7AA5/84AOv/YADz/xABZ/+cAAQBG/+wAAQAk//YABgAk/9gARv/iAIX/ugCrAB4ArQAeAK4AHgACAEb/zgBZ/+IABwAF/7oAJv/dADf/sAA5/84AOv/YADz/xABZ/8kABQAFAB4AJP/OAEb/4gCF/7AArgAKABAAJP/YAEAAHgBE/7AARv+1AEn/7ABQ/8QAVv/EAFf/2ABY/8QAYAAeAIX/ugCh/9gAo//YAKsAFACtAB4ArgAeAAEAJP/sAAwADQAUAA//pgAk/9gARP/YAEb/xABW/+IAaQAUAG0AFACF/7AAqwAPAK0ADwCuAA8ABwAk/+IARv/OAFb/7ACF/7oAqwAeAK0AHgCuAB4AAQBG/9gACAAk/84ARP/OAEb/zgBW/9gAhf+mAKsAFACtABQArgAeAAEAWf/xAAgABQAoAA0AHgBE/+IARv/iAFb/7ABpADwAbQA8AO4APAAFAAUAHgANAB4AWQAUAGkAMgBtADIAAgAKAB4AV//sAAIADQAeAEb/8QABADcAHgABAC0ARgABAFkAIwAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
