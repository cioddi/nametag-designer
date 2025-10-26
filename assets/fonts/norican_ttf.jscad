(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.norican_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ADAAMQAxAE4AbwByAGkAYwBhAG4AIABSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEATgBvAHIAaQBjAGEAbgAtAFIAZQBnAHUAbABhAHIATgBvAHIAaQBjAGEAbgAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAHYAZQByAG4AbwBuACAAYQBkAGEAbQBzAC4AdgBlAHIAbgBvAG4AIABhAGQAYQBtAHMAdwB3AHcALgBuAGUAdwB0AHkAcABvAGcAcgBhAHAAaAB5AC4AYwBvAC4AdQBrAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/2YAZgAAAAAAAAAAAAAAAAAAAAAAAAAAAQsAAAABAAIBAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAQMAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugEEAQUBBgEHAQgBCQEKAQsA1wEMAQ0BDgEPARABEQESARMA4gDjARQBFQCwALEBFgEXARgBGQEaAOQA5QEbARwBHQEeALsA5gDnAR8BIAEhASIA2ADhANsA3ADdAOAA2QDfASMBJAElASYAsgCzALYAtwDEALQAtQDFAIcAvgC/ALwBJwEoASkBKgDAAMEBKwEsAS0ETlVMTAd1bmkwMEFEC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4BmVjYXJvbgRoYmFyBkl0aWxkZQZpdGlsZGUHSW9nb25lawdpb2dvbmVrAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgdVbWFjcm9uB3VtYWNyb24HVW9nb25lawd1b2dvbmVrBmFjYXJvbgJEWgJEeghkb3RsZXNzagxkb3RhY2NlbnRjbWIHdW5pMDMwRgd1bmkwMzExB3VuaTAzMjYMZm91cnN1cGVyaW9yBEV1cm8LY29tbWFhY2NlbnQCZmYDZmZpA2ZmbAJzdAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAgEKAAEAAAABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAmgAEAAAASAZEAS4BOAGOAhACigLwBmIDdgP4ByAEAgcwBLgFMgc6BWAGpAVqBqoFdAWWBtgHFgZsByoFtAYSBnIGRAZEBkQGRAZEBkQGYgZiBmIGYgZiBzAHMAcwBzAHOgc6BzoHOgc6BzoGpAaqBqoGqgaqBxYGbAZsBmwGbAZsBnIGcgakBqoG2AcWByAHKgcwBzAHOgABAEgAJQAmACgAKgAsAC8AMAAzADQANQA3ADgAOQA6ADsARQBGAEcASABJAEoASwBPAFIAUwBXAFgAXABdAIEAggCDAIQAhQCGAJMAlACVAJYAlwCaAJsAnACdAKEAogCjAKQApQCmAKgAqQCqAKsArACyALMAtAC1ALYAtwC+AMAAwgDDAM4A1QDdAN4A3wDhAOYAAgAQ/78AEv/TABUAEP90ABL/kgBF/9wAR//xAEj/2wBT/+MAVf/TAKH/3ACi/9wAo//cAKT/3ACl/9wApv/cAKj/8QCz/+MAtP/jALX/4wC2/+MAt//jAML/8QDm/9wAIAAQ/0cAEv90AEX/yQBJ/7oATf/OAFP/xABW/7oAof/JAKL/yQCj/8kApP/JAKX/yQCm/8kAqf+6AKr/ugCr/7oArP+6AK3/zgCu/84Ar//OALD/zgCz/8QAtP/EALX/xAC2/8QAt//EAMP/ugDG/84AyP/OANr/ugDc/7oA5v/JAB4ARf/rAEf/7wBJ/+IAU//nAFn/9ACh/+sAov/rAKP/6wCk/+sApf/rAKb/6wCo/+8Aqf/iAKr/4gCr/+IArP/iALP/5wC0/+cAtf/nALb/5wC3/+cAuv/0ALv/9AC8//QAvf/0AML/7wDD/+IA4P/0AOL/9ADm/+sAGQBJ/8kAU//OAFb/ugBZ/7oAXf/TAKn/yQCq/8kAq//JAKz/yQCz/84AtP/OALX/zgC2/84At//OALr/ugC7/7oAvP+6AL3/ugC+/9MAwP/TAMP/yQDa/7oA3P+6AOD/ugDi/7oAIQBF/+4ASf/sAEv/7ABN/9gAU//TAF3/7ACh/+4Aov/uAKP/7gCk/+4Apf/uAKb/7gCp/+wAqv/sAKv/7ACs/+wArf/YAK7/2ACv/9gAsP/YALP/0wC0/9MAtf/TALb/0wC3/9MAvv/sAMD/7ADD/+wAxv/YAMj/2ADm/+4A+QAjAPwAIwAgABD+jgAS/tQARf/cAEj/4gBJ/9cAS/+1AE0ADgBT/+4AVf/TAKH/3ACi/9wAo//cAKT/3ACl/9wApv/cAKn/1wCq/9cAq//XAKz/1wCtAA4ArgAOAK8ADgCwAA4As//uALT/7gC1/+4Atv/uALf/7gDD/9cAxgAOAMgADgDm/9wAAgAQ/4gAEv+wAC0AEP+wABL/TAAe/+wAH/9lAEX/xQBJ/9YATf9qAFP/YABW/y0AWf9gAFv/MwBd/1oAof/FAKL/xQCj/8UApP/FAKX/xQCm/8UAqf/WAKr/1gCr/9YArP/WAK3/agCu/2oAr/9qALD/agCz/2AAtP9gALX/YAC2/2AAt/9gALr/YAC7/2AAvP9gAL3/YAC+/1oAwP9aAMP/1gDG/2oAyP9qANr/LQDc/y0A4P9gAOL/YADm/8UAHgAQ/5wAHv/2AEX/9gBJ//cAS//nAFP/8QBZ//MAof/2AKL/9gCj//YApP/2AKX/9gCm//YAqf/3AKr/9wCr//cArP/3ALP/8QC0//EAtf/xALb/8QC3//EAuv/zALv/8wC8//MAvf/zAMP/9wDg//MA4v/zAOb/9gALABD/sAAe//YAS//qAFX/7QBZ//YAuv/2ALv/9gC8//YAvf/2AOD/9gDi//YAAgBG/+kAUP/uAAIASP/nAFv/6wAIAEn/8QCp//EAqv/xAKv/8QCs//EAw//xAPkAggD8AIIABwBJ//UAS//kAKn/9QCq//UAq//1AKz/9QDD//UAFwBF//kAR//2AEn/9gBT/+wAof/5AKL/+QCj//kApP/5AKX/+QCm//kAqP/2AKn/9gCq//YAq//2AKz/9gCz/+wAtP/sALX/7AC2/+wAt//sAML/9gDD//YA5v/5AAwASf/sAFP/9QCp/+wAqv/sAKv/7ACs/+wAs//1ALT/9QC1//UAtv/1ALf/9QDD/+wABwBU//YAVv/KAFv/8wDa/8oA3P/KAPkAVQD8AFAAAgAQ/7oAEv/EAAEAS//oAAwASf/0AFP/9QCp//QAqv/0AKv/9ACs//QAs//1ALT/9QC1//UAtv/1ALf/9QDD//QAAQBQ/+kACwBF//gARv/7AEv/3QBb//wAof/4AKL/+ACj//gApP/4AKX/+ACm//gA5v/4AA8ASf/uAFP/8ABd//QAqf/uAKr/7gCr/+4ArP/uALP/8AC0//AAtf/wALb/8AC3//AAvv/0AMD/9ADD/+4AAgBe/9wA5f/cAAIAEP/OABL/4gABAFv/5AACABD/YAAS/34ABwBG/9gAS//ZAFT/9ABb/+kAXf/9AL7//QDA//0AAQAAAAoAFgAYAAFsYXRuAAgAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
