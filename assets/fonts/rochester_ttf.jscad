(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rochester_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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4LngtuCt4KXgnOA138De0QXjAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAUAAAAADAAEECQABABIBQAADAAEECQACAA4BUgADAAEECQADADgBYAADAAEECQAEACIBmAADAAEECQAFABoBugADAAEECQAGACIB1AADAAEECQAHAHAB9gADAAEECQAIADgCZgADAAEECQAJABwCngADAAEECQALAEgCugADAAEECQAMADADAgADAAEECQANAFwDMgADAAEECQAOAFQDjgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMAAgAGIAeQAgAEYAbwBuAHQAIABEAGkAbgBlAHIALAAgAEkAbgBjACAARABCAEEAIABTAGkAZABlAHMAaABvAHcALgAgAEEAbABsACAAcgBpAGcAaAB0AHMAIAByAGUAcwBlAHIAdgBlAGQALgAgAEEAdgBhAGkAbABhAGIAbABlACAAdQBuAGQAZQByACAAdABoAGUAIABBAHAAYQBjAGgAZQAgADIALgAwACAAbABpAGMAZQBuAGMAZQAuAAoAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGEAcABhAGMAaABlAC4AbwByAGcALwBsAGkAYwBlAG4AcwBlAHMALwBMAEkAQwBFAE4AUwBFAC0AMgAuADAALgBoAHQAbQBsAFIAbwBjAGgAZQBzAHQAZQByAFIAZQBnAHUAbABhAHIAMQAuADAAMAA2ADsARABJAE4AUgA7AFIAbwBjAGgAZQBzAHQAZQByAC0AUgBlAGcAdQBsAGEAcgBSAG8AYwBoAGUAcwB0AGUAcgAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAANgBSAG8AYwBoAGUAcwB0AGUAcgAtAFIAZQBnAHUAbABhAHIAUgBvAGMAaABlAHMAdABlAHIAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABGAG8AbgB0ACAARABpAG4AZQByACwAIABJAG4AYwAgAEQAQgBBACAAUwBpAGQAZQBzAGgAbwB3AEYAbwBuAHQAIABEAGkAbgBlAHIALAAgAEkAbgBjACAARABCAEEAIABTAGkAZABlAHMAaABvAHcARwBpAGwAbABpAGEAbgAgAEYAaQBzAGgAZQByAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBmAG8AbgB0AGIAcgBvAHMALgBjAG8AbQAvAHMAaQBkAGUAcwBoAG8AdwAuAHAAaABwAGgAdAB0AHAAOgAvAC8AZwBpAGwAbABvAGcAcgBhAHAAaABpAGMALgBjAG8AbQAvAEwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAQQBwAGEAYwBoAGUAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMgAuADAAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGEAcABhAGMAaABlAC4AbwByAGcALwBsAGkAYwBlAG4AcwBlAHMALwBMAEkAQwBFAE4AUwBFAC0AMgAuADAAAgAAAAAAAP9mAGYAAAAAAAAAAAAAAAAAAAAAAAAAAADmAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQEDAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wDiAOMAsACxAOQA5QC7AOYA5wDYAOEA2wDcAN0A4ADZAN8AsgCzALYAtwDEALQAtQDFAIcAqwDGAL4AvwC8AQQAjADvAMAAwQd1bmkwMEEwCXNmdGh5cGhlbgRFdXJvAAAAAAEAAf//AA8=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
