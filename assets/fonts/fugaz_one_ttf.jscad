(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fugaz_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAEECQAFABoBRAADAAEECQAGACABXgADAAEECQAHAFYBfgADAAEECQAIACAB1AADAAEECQAJACAB1AADAAEECQALACQB9AADAAEECQAMACoCGAADAAEECQANASACQgADAAEECQAOADQDYgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEwAYQB0AGkAbgBvAFQAeQBwAGUAIABMAGkAbQBpAHQAYQBkAGEAIAAoAGkAbgBmAG8AQABsAGEAdABpAG4AbwB0AHkAcABlAC4AYwBvAG0AKQAsACAAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAcwAgACIARgB1AGcAYQB6ACIAIABhAG4AZAAgACIARgB1AGcAYQB6ACAATwBuAGUAIgBGAHUAZwBhAHoAIABPAG4AZQBSAGUAZwB1AGwAYQByAEQAYQBuAGkAZQBsAEgAZQByAG4AYQBuAGQAZQB6ADoAIABGAHUAZwBhAHoAIABPAG4AZQA6ACAAMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyAEYAdQBnAGEAegBPAG4AZQAtAFIAZQBnAHUAbABhAHIARgB1AGcAYQB6ACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAATABhAHQAaQBuAG8AVAB5AHAAZQAgAEwAaQBtAGkAdABhAGQAYQBEAGEAbgBpAGUAbAAgAEgAZQByAG4AYQBuAGQAZQB6AHcAdwB3AC4AbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtAHcAdwB3AC4AaABlAHIAbgBhAG4AZABlAHoAdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAg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/+0AAQA8/+4AFAAK/+cADP/uAA3/5wAS//IAFP/0ABr/8wAi//IAMv/4ADb/+QA3/8YAOP/6ADn/6gA6/+4APP/JAD//5wBA/+QAYP/sANL/6wDT//EA4P/nABAADP/wAA3/+AAS/+QAJP/5ADf/+AA5//UAOv/3ADv/8AA8/90AP//0AED/8QBb//sAYP/yAK0AFgCuAAsA4P/zAAoADP/1ABL/4gAk//gAOf/5ADr/+gA7//EAPP/mAK0AKACuABgA4P/4AA0ADP/xABL/3gAk//cAN//7ADn/9wA6//kAO//oADz/3gBA//MAYP/0AK0AHACuAAoA4P/0AAYAEP/1ABL/8QAy//sAqwALAK0AMQCuADcAFAAQ/+cAEf/HABL/ugAX//MAHf/vACT/6gAt/84ARP/pAFH/6gBS/+kAVv/uAFj/7QBa/+8AXf/yAKsAGgCs//gArQBAAK4ARgDd/+0A3v/zAAoADP/0ABL/4gAk//gAOf/5ADr/+gA7/+8APP/kAK0AJgCuABUA4P/3AAMAEv/qAK0AFgCuABwABAAS/94AUf/7AK0AHACuACEAEAANAAcAEP/oAC3/8wAy//EANv/4AET/8gBS//AAVv/4AFf/9QBY//IAWv/uAKsAKQCs//oArQAVAK4APADd//AAEwAK/7oADP/yAA3/ugAQ/98AFP/KABr/9gAi/+cAN/+iADj/+QA5/8MAOv/FADz/rAA//9kAQP/cAGD/7wB2/8gA0v+6ANP/ugDg/7oADQAM//EAEv/fACT/+AA3//sAOf/3ADr/+QA7/+oAPP/fAED/8wBg//QArQAbAK4ACgDg//QADAAM/+4AEP/4ABH/wQAS/78AJP/yAC3/2AA7/98APP/xAET/+wBS//sArQA2AK4AKgACAK0AHQCuAA0AFwAM//IADf/1ABD/9gAt//kAMv/7ADf/9gA4//sAOf/2ADr/+AA8/9wAP//uAED/6ABE//sARf/7AFL/+gBX//sAWP/7AFr/+gBg/+8ArQAWAK4ACwDd//IA4P/tAAoADP/1ABL/5wAk//sAOf/4ADr/+QA7//QAPP/kAK0AJQCuABYA4P/4ACgADQAQABD/vwAR/8AAEv/BABf/4wAd/9YAJP/GAC3/nABE/4oAUf+wAFL/hQBW/5QAV//7AFj/rwBa/64AW//FAF3/pgCe//gAof+nAKL/qACj/6YAp/+aAKn/wgCq/9IAqwAsAKz/9gCtAFIArgBYALD/yACx/5gAs//KALT/0AC1/9MAuf+ZALr/wQC7/7oAvP+bAL7/twDd/8YA3v/NAAQAEv/dAFH/+wCtABwArgAiABwAEP/qABH/4AAS/8oAE//2ABf/8gAZ//YAG//2AB3/8gAj//YAJP/qAC3/4wAy//UANv/4AET/5gBR/+wAUv/lAFb/6wBX//sAWP/tAFr/7gBd//AAbv/2AKsAIACtACoArgA/ALD/8wDd/+4A3v/zABMAEP/wABH/5wAS/9EAHf/2ACT/7gAt/+oAMv/5ADb/+wBE/+wAUf/xAFL/7ABW//EAWP/yAFr/8wBd//UAqwAbAK0AKQCuAD0A3f/zABIADAAHAA0ADgAQ/+MALf/pADL/6QA2//IARP/uAFL/7ABW//cAV//yAFj/8QBa/+oAqwAwAKz/+QCtABQArgA+AK//+wDd//AAMQAJ/+wADAAHAA0AEgAQ/78AEf+6ABL/rwAT/+kAFP/sABX/7AAW/+wAF//SABn/6gAb/+sAHP/sAB3/1QAj/+sAJP/KAC3/nwAy/+IANv/qAET/qwBJ//UAUf+2AFL/qgBW/6YAV//WAFj/tQBa/7MAW//NAF3/swBu/+oAnv/dAKL/uACq/8sAqwAzAKz/4gCtABYArgBDAK//8QCw/9YAtP/WALX/zAC7/70Avv+7AN3/yADe/9AA4AAGAOL/9QDj//UACQAQ//EAEv/uAET/+wBS//sAWP/7AFr/+gCrAAkArQAwAK4ANgATAAv/8QAT//QAF//bABn/9gAk/+QALf/WADL/9QBE/+kATQAWAFH/7QBS/+gAVv/sAFj/7QBa/+4AXf/vAF7/8gCrAC4ArQAqAK4AQwAlAAr/uQAT/90AFP/JABX/6wAW/+IAF//lABj/4AAZ/98AGv/YABv/5AAc/+EAJP/wACz/6gAt/+oAMv/eADb/4QA3/8EAOP/bADn/zQA6/9EAPP+xAD3/7gBE/+QARf/kAEv/7QBM/+YATQAZAE//5gBR/+wAUv/kAFb/5gBX/+IAWP/kAFr/4gBd/+4Ar//lANP/xAAJAAr/ywAN/+cAN/+MADn/7wA6//UAPP+2AD//7gBA/+YA4P/lAA8ACv+3AAz/5QAN/9IAEv/mACL/8wA3/3oAOf/qADr/7wA8/5sAP//mAED/1ABb//EAYP/kANL/7QDg/+EAFwAK//MADP/0AA3/8wAQ/+8AEv/1ADL/9wA2//sAN//AADj/7wA5/+oAOv/tADz/zQA///YAQP/wAET//ABS//wAV//8AGD/8wCv//wA0v/zANP/8wDd//EA4P/0AA8ACv+2AAz/5AAN/9AAEv/mACL/8QA3/3kAOf/oADr/7gA8/6AAP//kAED/0wBb/+8AYP/kANL/6wDg/+AACQAK/8cADf/pADf/pwA5//QAOv/3ADz/twA//+0ATQAlAOD/5QADADf/9wA8//AArgAcAAYAOP/2ADn/+gA9//gAqwAaAK0AJgCuAEgAFgAK/7AADP/tAA3/xwAS//UAIv/uADL/9wA2//kAN/96ADj/9gA5/98AOv/lADz/oAA//+AAQP/WAET/+QBS//kAVv/6AGD/6gCv//kA0v/jANP/8gDg/9UABAA3/9QAPP/gAHb/3gCuAAwACgAK/7wADf/WADf/iAA5/+wAOv/yADz/pgA//+kAQP/mANL/7QDg/98AEQAK/7QADP/jAA3/ywAS/+YAIv/vADf/dgA4//sAOf/kADr/6gA7//cAPP+jAD//4gBA/9IAW//uAGD/4gDS/+gA4P/eAAEATQANABEACv+/AAz/5gAN/94AEf/OABL/1gAk//gAN/+UADn/8gA6//UAO//NADz/pgA9//AAP//sAED/1wBb//AAYP/lAOD/6QAPAAr/uQAM/+YADf/UABL/6gAi//QAN/98ADn/6QA6/+4APP+lAD//5QBA/9YAW//2AGD/5QDS/+8A4P/hAA0ACv/DAAz/6AAN/+MAEv/oADf/nwA5//MAOv/2ADz/sAA//+sAQP/cAFv/9wBg/+cA4P/iAAkACv/LAA3/5wA3/4wAOf/vADr/9QA8/7UAP//uAED/5gDg/+UAEAAK/78ADP/jAA3/3gAS/+AAN/+NADn/6QA6/+4AO//wADz/rQA9//oAP//nAED/1ABb/+4AYP/iANL/9QDg/+MADgAK/9oADP/1ABD/6QAt//QAN/+1ADz/zgBA/+wARP/vAFL/7gBW//QAYP/xAK//9gDd/+wA4P/yAAwACv/JAAz/6wAN/+wAEv/uADf/owA5//AAOv/0ADz/sQA//+0AQP/eAGD/6ADg/+cAEgAL//MAE//1ABf/6QAk/+sALf/qADL/9QBE/+oATQAUAFH/7gBS/+oAVv/tAFj/7gBa/+4AXf/wAF7/8wCrAC0ArQAoAK4AQQADAKsADQCtABwArgAiAAMADP/xAED/8gBg//MABAA3/8sAOf/yADr/9QA8/9IAAwA8/+gArQAfAK4ADwABABf/6gACABr/4QBP/94AFAAs//YALf/sADL/5AA2/+gAN/+7ADj/4gA5/9cAOv/bADz/uQBE/+YARf/kAEz/6gBNAA4AT//qAFL/5ABW/+gAV//jAFj/6ABa/+MAr//iAAEACgAgAAEACgARABAACv/rAAz/7QAN/+4AEf/zABL/2gAk//YAN//vADn/9QA6//gAO//WADz/zAA9//YAP//0AED/5QBg/+wA4P/pABEACv/4AAz/7wAN//QAEv/nADf/9gA4//sAOf/yADr/9AA7//kAPP/VAD//8wBA//IAW//zAGD/8gCtAAoArgAIAOD/8gABAA3/4QAHAAoAHAANAB4APwAYAEAACgBgAAgAxwARAOAACQALAAkADgAKAAYADQAaACIAJgBAAA4ARQAIAFcACQBgAAoArwAYANIAFwDgAAsAEgAEAA8ACQAQAAoAHAAMACoADQBKACIALAA/ABoAQAAuAEUAFQBLABAATAAcAE8ADQBXAAwAXwAMAGAALACvABgA0gAkAOAAOAAEABL/4gA8//sArQAWAK4AMQABAA3/1AAIABH/owAk/+4ALf/HAFL/+ACOAAsAqwBeAK0ALwCuACYADQAQ/9UAEf+TABL/vAAk/+kALf+3AET/5gBS/+UAVv/wAKsAFACtADEArgA9AN3/7ADe//UAAQAF/2wAAQAF/2QABQAK/7QAN//DADn/8wA6//YAPP/MAAcACv+nADf/vwA5/+sAOv/uADz/wgBb/+oA0//yAAUAJP/wAC3/4ACrAB8ArQA2AK4APAAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
