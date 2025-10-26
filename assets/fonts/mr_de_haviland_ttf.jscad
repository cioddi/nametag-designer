(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mr_de_haviland_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGEAbgBkAC0AUgBlAGcAdQBsAGEAcgBNAHIAIABEAGUAIABIAGEAdgBpAGwAYQBuAGQAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwALgBBAGwAZQBqAGEAbgBkAHIAbwAgAFAAYQB1AGwAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHMAdQBkAHQAaQBwAG8AcwAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsAA0AVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6AA0AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOoAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCg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AL8ARP/RAEUAHABG/9YAR//WAEr/2wBOABcATwAkAMIAJAANAA0ApgAiANEARQA7AEgAHABJACAATgAXAE8AJQBVACAAVgAXAFcAJQBZACQAXQAqAMIAJQABACIASQAEAA0ALQBFABsASQA7AFcAKQALACcAVAApAEIAMACoADEAfgAzAIQANQB+ADgAwAA5AJwAOgC6ADsAugCQAFQADwANAHAAIgCgAEb/8ABH/+YASf/xAEr/7gBL/+4ATP/mAE3/8QBR/+MAVP/uAFj/2gBc//IAsP/mANgAZwABAF3/8gAGAA0AcQAiAH4AUAADAFUAAwBWAAQA2AB9AAEARQAXAAEAIgATAAIAIgAoAFYAAQAGAA0AegAiAIsAUAACAFUAAgBWAAIA2ABkAAIAUf//AF3/4wADAEj/4wBWAAEAXf/eAAcARQAdAEgAIgBOABkATwAdAFUAAQBWAAEAwgAdAAEARQAdAAIAIv/VAF3/5QAIAA0ArwAiAG8AUP/+AFH//QBV//4AVv/+AFj/+wDYAIAABwAiABYARv/2AEf/8QBIAB0ATgAlAFIAHQCw//EABgBFAD8AS//pAE8AEQBQ/+EAUf/jAMIAEQACAFAAAQBVAAIAAgBG/+kASAAGAA0AEwAtACUASAAnAKMAKQCpADABCQAxAKkAMwC7ADUAowA4AOsAOQDZADoA8QA7AOUAkACjAAUALgBeADsAGgBK/9EAVP/AAGL/awADAEUAHQBIABoAWgARAAEAGf/SAAMARQAbAEkAOwBXACkACQATAGYAFAA9ABUAZgAWAIsAFwCFABgAeAAZAGcAGgBzABsAbQABAF3/4wAFAEUAHQBIACIATgAZAE8AHQDCAB0ABAAvAOEASQBKAFMAmgC+AJoABwBFAC0ASQBFAEsAPABOAGUATwBTAFcAMgDCAFMACwANAIAAIgCOAEUAFwBPABIAUf/uAFMAFQBXABcAWQARAL4AFQDCABIA2ABhAAMARQAPAEgAFgBZABcABgAVAGIAFgBpABcAUwAZAGkAGgBaABsAcQALAAz/PwATAGIAFABqABUAjwAWAGkAFwBiABgAPAAZAFMAGgCXABsAUwAcAIAACAAkAFAAJQAyADYAMgA4AFAAOwBkAEkAMgBXACgAxQAyAAsADP8/ABMAYgAUAGoAFQCPABYAaQAXAC4AGAA8ABkAGAAaAEoAGwAeABwAQAABAAAACgAmACgAAkRGTFQADmxhdG4AGAAEAAAAAP//AAAAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
