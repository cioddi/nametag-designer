(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.imprima_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AFIAZQBnAHUAbABhAHIASQBtAHAAcgBpAG0AYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAVAB1AG4AbgBpAHcAdwB3AC4AdABpAHAAbwAuAG4AZQB0AFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPcAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADu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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
