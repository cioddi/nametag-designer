(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.belleza_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AjQAOwDrADMBTQAnAPoARgEW//cB9AAaAfQALQH0ADgB9AAUAfT//wH0ABQB9AAoAfQAKQH0ADgB9AAhANMAMgDTAC0CNAA5AjQAOwI0ADkBvABoA8sATwJ1AAoChABaAngAHALEAFoCMgBaAeEAWgKoACACpQBaARAAWgGF/8sCYQBaAecAWgN5AFICqwBaAtUAIgIiAFoC1QAiAn4AWgIsAEUCFwAKApEASwJVAAoDWAAKAoYAHgItABQCOwAQAU0AWAEW//cBTQAiAdUAGAH0AAABTQAOAbwAIQH0AEUBlgAaAfQAGgHVABoBTQAVAeoAGgH3AEwA6QBBAOv/rgHtAEsA6gBLAwoAIAH0AB0B9AAbAfQAFwH0ABYBPgBAAXQAHAFJAAoB4AAzAZ8ACgKsAAoB2gAeAbkABQG8AC0B4AB+AMgAQwHgAHsCHQAoAU0AXwH0AFYB9AAaAigAEgH0AAsAyABDAfQAQwFNABIC+AAmAQYAEQH0ACoCNAA7AvgAJgFNAAsBkAA5AjQAOwGVAEYBlQBGAU0AXQH+AE8Bxf/qAPoARgFNADQBlQBQATAADwH0ADADHwAxAx8AMQMfACcBvAAsAnUACgJ1AAoCdQAKAnUACgJ1AAoCdQAKAzYACgJ4ABwCMgBaAjIAWgIyAFoCMgBaARD/0wEQAFoBEP/yARD/9gLEAAUC0gBaAtUAIgLVACIC1QAiAtUAIgLVACICNABCAtUAIgKRAEsCkQBLApEASwKRAEsCLQAUAiwAWgJDABQBvAAhAbwAIQG8ACEBvAAhAbwAIQG8ACECwAAhAbQAGgG8ABoBvAAaAbwAGgG8ABoA6f/hAOkAQQDp/98A6f/gAfQAGwH0AB0B9AAbAfQAGwH0ABsB9AAbAfQAGwI0ADsB9AAbAfQAMwH0ADMB9AAzAfQAMwG5AAUB9ABLAbkABQDpAEsB5wADAOoACgNRACIDFwAdAiwARQF0ABwCLQAUAjsAEAG8AC0B9P/9AU0AEQFNABABTQAaAO4AQQFNAEMBTQA+AU0ACAFN//sCAwAnAfQAAAPoAAAA4AAyAOAAMgDgADIBigAyAYoAMgGKADIB9AA7AfQAOgFeACgC7gBGBH0AKAFNAD8BTQAwAx8AyAH0ABID1AApAtUAQAH0ABECdQAoAnMAWgJYAFECNAA7AiYAMgNlADIBU//iAjQAOwI0ADsCNAA5AjQAOQJNADIDmwBkAjYAFQIUABUAAQAAA6D/IAAABH3/rv+qBFUAAQAAAAAAAAAAAAAAAAAAAPcAAgGMAZAABQAAAMwAzAAAAR4AzADMAAABHgAyAPoAAAIABQMFAAACAAOAAACvUAAgSgAAAAAAAAAAcHlycwBAACD7AgOg/yAAAAOgAOAgAAABAAAAAAHEApYAAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEAUAAAABMAEAABQAMAH4ArAD/ATEBQgFTAWEBeAF+AZICxwLdA8AgFCAaIB4gIiAmIDAgOiBEIKwhIiEmIgIiBiIPIhIiGiIeIisiSCJgImUlyvj/+wL//wAAACAAoQCuATEBQQFSAWABeAF9AZICxgLYA8AgEyAYIBwgICAmIDAgOSBEIKwhIiEmIgIiBiIPIhEiGiIeIisiSCJgImQlyvj/+wH////j/8H/wP+P/4D/cf9l/0//S/84/gX99f0T4MHgvuC94LzgueCw4Kjgn+A438PfwN7l3uLe2t7Z3tLez97D3qfekN6N2ykH9QX0AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAAC6AAAAAwABBAkAAQAOALoAAwABBAkAAgAOAMgAAwABBAkAAwA0ANYAAwABBAkABAAeAQoAAwABBAkABQAaASgAAwABBAkABgAeAUIAAwABBAkABwBkAWAAAwABBAkACAAuAcQAAwABBAkACQAuAcQAAwABBAkACwAsAfIAAwABBAkADAAsAfIAAwABBAkADQEiAh4AAwABBAkADgA0A0AAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADIALAAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkAIAAoAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAIgBCAGUAbABsAGUAegBhACIAQgBlAGwAbABlAHoAYQBSAGUAZwB1AGwAYQByADEALgAwADAAMgA7AFUASwBXAE4AOwBCAGUAbABsAGUAegBhAC0AUgBlAGcAdQBsAGEAcgBCAGUAbABsAGUAegBhACAAUgBlAGcAdQBsAGEAcgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyAEIAZQBsAGwAZQB6AGEALQBSAGUAZwB1AGwAYQByAEIAZQBsAGwAZQB6AGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAuAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA9wAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXAOIA4wCwALEA5ADlALsA5gDnAKYA2ADhANsA3ADdAOAA2QDfAJsAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAECAIwAnwCYAKgAmgCZAO8ApQCSAJwApwCPAJQAlQC5ANIAwADBBEV1cm8AAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAIAAwD0AAEA9QD2AAIAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAMADACsBMQAAQA2AAQAAAAWAGYAZgBsANIAegI+AoYDmAQSAIgEngBsAGwAbABsAGwAbACIAHoAiACaAJoAAQAWAAUACgAkACkALwAzADcAOQA6ADwAVQCAAIEAggCDAIQAhQCdAMEAxwDWANkAAQCG/7AAAwA3/8QAOf/nADr/7AADADf/xAA5/7oAOv/EAAQAEP/bAB3/7gAe/+4Ahv+hAAEAhv+mAAEAHAAEAAAACQAyARQBngHYAeYC+ANyA+wD/gABAAkAKQAuADMANQA3ADkAOgBJAFUAOAAP/6QAEf+kACT/nABE/9gARv/iAEf/4gBI/+IAUP/sAFH/7ABS/+IAU//sAFT/4gBV/+wAVv/sAFf/7ABY/+wAXf/sAHX/7ACA/5wAgf+cAIL/nACD/5wAhP+cAIX/nACG/3QAoP/YAKH/2ACi/9gAo//YAKT/2ACl/9gApv/YAKf/4gCo/+IAqf/iAKr/4gCr/+IArAAyAK8AQQCx/+wAsv/iALP/4gC0/+IAtf/iALb/4gC4/+IAuf/sALr/7AC7/+wAvP/sAMD/7ADE/+IAxv/sANj/pADb/6QA3/+kACIAJv/dACr/3QAy/90ANP/dAEb/9gBH//YASP/2AFL/9gBU//YAWf+6AFr/ugBc/7oAh//dAJL/3QCT/90AlP/dAJX/3QCW/90AmP/dAKf/9gCo//YAqf/2AKr/9gCr//YAsv/2ALP/9gC0//YAtf/2ALb/9gC4//YAvf+6AL//ugDD/90AxP/2AA4AD/9/ABH/fwAk/9MAgP/TAIH/0wCC/9MAg//TAIT/0wCF/9MAhv+rAK8AKwDY/38A2/9/AN//fwADADz/7gCd/+4Ax//uAEQAD//JABD/yQAR/8kAHf/JAB7/yQAk/8QARP/TAEb/tQBH/7UASP+1AEz/4gBN/+IAUP+cAFH/nABS/7UAU/+cAFT/tQBV/5wAVv+IAFf/nABY/6sAWf+1AFr/tQBc/7UAXf+cAHX/qwCA/8QAgf/EAIL/xACD/8QAhP/EAIX/xACG/5wAoP/TAKH/0wCi/9MAo//TAKT/0wCl/9MApv/TAKf/tQCo/7UAqf+1AKr/tQCr/7UArAAUAK3/4gCu/+IArwAUALH/nACy/7UAs/+1ALT/tQC1/7UAtv+1ALj/tQC5/6sAuv+rALv/qwC8/6sAvf+1AL//tQDA/5wAxP+1AMb/iADY/8kA2//JAN//yQAeAA//yQAR/8kAJP/nAEb/4gBH/+IASP/iAFL/4gBU/+IAgP/nAIH/5wCC/+cAg//nAIT/5wCF/+cAhv+/AKf/4gCo/+IAqf/iAKr/4gCr/+IAsv/iALP/4gC0/+IAtf/iALb/4gC4/+IAxP/iANj/yQDb/8kA3//JAB4AD//TABH/0wAk/+wARv/sAEf/7ABI/+wAUv/sAFT/7ACA/+wAgf/sAIL/7ACD/+wAhP/sAIX/7ACG/8QAp//sAKj/7ACp/+wAqv/sAKv/7ACy/+wAs//sALT/7AC1/+wAtv/sALj/7ADE/+wA2P/TANv/0wDf/9MABAAFAEYACgBGANcARgDaAEYABgAP/7YAEP/JABH/tgDY/7YA2/+2AN//tgACAI4ABAAAAMwBNgAHAAkAAP/u/8n/7P/O/9gAAAAAAAAAAAAAAAAAAAAAAAD/v//J/7oAAAAAAAAAAAAAAAD/yQAAAAAAAP/E/6YAAP+6/8QAAAAAAAAAAAAAAAAAAAAAAAAAAP/OAAAAAAAAAAAAAAAAAAAAAP/sAAAAAAAAAAAAAAAAAAAAAP/YAAAAAQAdAAUACgAkAC8AMgA0ADwAWQBaAFwAgACBAIIAgwCEAIUAkgCTAJQAlQCWAJgAnQC9AL8AwQDHANYA2QACABEABQAFAAYACgAKAAYALwAvAAMAMgAyAAUANAA0AAUAPAA8AAEAWQBaAAIAXABcAAIAkgCWAAUAmACYAAUAnQCdAAEAvQC9AAIAvwC/AAIAwQDBAAMAxwDHAAEA1gDWAAQA2QDZAAQAAgAhAAUABQAFAAoACgAFAA8ADwAGABEAEQAGACQAJAAHACYAJgADACoAKgADADIAMgADADQANAADADwAPAACAEYASAAIAFIAUgAIAFQAVAAIAFkAWgABAFwAXAABAIAAhQAHAIcAhwADAJIAlgADAJgAmAADAJ0AnQACAKcAqwAIALIAtgAIALgAuAAIAL0AvQABAL8AvwABAMMAwwADAMQAxAAIAMcAxwACANcA1wAEANgA2AAGANoA2gAEANsA2wAGAN8A3wAGAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFsaWdhAAgAAAABAAAAAQAEAAQAAAABAAgAAQAaAAEACAACAAYADAD1AAIATAD2AAIATwABAAEASQ==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
