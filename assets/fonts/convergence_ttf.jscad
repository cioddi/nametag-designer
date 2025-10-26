(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.convergence_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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At8AbAJXAGwCNQBsAsYAPALqAGwBSgBsAVb/qQKGAGwCDQBsA8YAYgL3AGwC8gA8Am0AbALnADwClgBsAjwAMgIqAAcCwQBaApoABQOKAB4CqwAhApMAIgJPADABTQA8AZ8AJwFNAC0CBgAZAcQADwEBAAoCYQAwAlwAZAH3ADACYQAwAhIAMAF6ABcCXAAwAnEAZAE0AFwBNP/ZAkkAZAFDAGQDmABSAmsAUgJIADACXABSAlwAMAHDAFIBwwAiAaIAIwJqAFACJgAPAyAADwIKAA8CZQBQAfoAMgGIADwBJABsAYgAPAKNAEsBHABEAgsAOgINAGACPgAyApMALAEkAG0CPAA8AUgACgNWADwBvQApAlQAWwKyAEABxwBAAg8AHgFlAAoBtAApAiIAQAE4ACIBRgArAQEACgJ+AGQCfgAyAOAAMgDNAAoBGwAlAbQAKQJUACgCkQAlArUAJQK6ACsB7QAsApwAGQKcABkCnAAZApwAGQKcABkCnAAZA7EAGQKWADwCVwBsAlcAbAJXAGwCVwBsAUoACgFKAGYBSgAWAUoADQLfABgC9wBsAvIAPALyADwC8gA8AvIAPALyADwCGgA+AvMAPALBAFoCwQBaAsEAWgLBAFoCkwAiAm0AbAJuAGQCYQAwAmEAMAJhADACYQAwAmEAMAJhADADbQAwAfcAMAISADACEgAwAhIAMAISADABNP/sATQAUwE0AAgBNAAAAioAOQJrAFICSAAwAkgAMAJIADACSAAwAkgAMAIiAEACSAAwAmoAUAJqAFACagBQAmoAUAJlAFACXQBkAmUAUAJxABkBSv/1ATT/5QE0AGQClABsAmgAXAFW/6kBNP/ZAkkAZAJJAGQCDQBsAXoAZAIN/+4BUgARAvcAbAJrAFID2gA8A44AMAKWAGwClgBsAcMAUgKWAGwBwwBSAXr/+gE0/9kBOAAKATgACgDRAAoBcgAKAJAACgJKAEADdwBAAKIAGgCiAAIAogACAS4AGgEuAAIBLgACATcAMgKgADIBhQBbAYUAKAHOAAYCfQAXApYAFwABAAADr/8aAAAD3v+p/+ADrgABAAAAAAAAAAAAAAAAAAAA7gACAekBkAAFAAACvAKKAAAAjAK8AooAAAHdADIA+gAAAgsGAAMCBAIABIAAAG9AAAACAAAAAAAAAABweXJzAEAAIPsCA6//GgAAA68A5iAAARFAAAAAAh0C1wAAACAAAgAAAAIAAAADAAAAFAADAAEAAAAUAAQAyAAAAC4AIAAEAA4AfgD/ASkBNQE4AUQBVAFZAZICNwLHAtoC3AMHIBQgGiAeICIgJiA6IKz7Av//AAAAIAChAScBMQE3AT8BUgFWAZICNwLGAtoC3AMHIBMgGCAcICIgJiA5IKz7Af///+P/wf+a/5P/kv+M/3//fv9G/qL+FP4C/gH91+DM4MngyODF4MLgsOA/BesAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAVoAAAADAAEECQABABYBWgADAAEECQACAA4BcAADAAEECQADAFgBfgADAAEECQAEACYB1gADAAEECQAFABoB/AADAAEECQAGACYB1gADAAEECQAHAHYCFgADAAEECQAIADoCjAADAAEECQAJADoCxgADAAEECQALAEIDAAADAAEECQAMACQDQgADAAEECQANAVQDZgADAAEECQAOADQEugBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMAAgAGIAeQAgAEoAbwBzAI4AIABOAGkAYwBvAGwAhwBzACAAUwBpAGwAdgBhACAAUwBjAGgAdwBhAHIAegBlAG4AYgBlAHIAZwAuADwAaQBuAGYAbwBAAG4AcwBpAGwAdgBhAC4AYwBvAG0APgAgAGEAbgBkACAASgBvAGgAbgAgAFYAYQByAGcAYQBzACAAQgBlAGwAdAByAGEAbgAgADwAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGoAbwBoAG4AdgBhAHIAZwBhAHMAYgBlAGwAdAByAGEAbgAuAGMAbwBtAC8APgAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlAHMAIAAiAEMAbwBuAHYAZQByAGcAZQBuAGMAZQAiAC4AQwBvAG4AdgBlAHIAZwBlAG4AYwBlAFIAZQBnAHUAbABhAHIATgBpAGMAbwBsAGEAcwBTAGkAbAB2AGEAYQBuAGQASgBvAG4AaABWAGEAcgBnAGEAcwA6ACAAQwBvAG4AdgBlAHIAZwBlAG4AYwBlADoAIAAyADAAMQAxAEMAbwBuAHYAZQByAGcAZQBuAGMAZQAtAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMgBDAG8AbgB2AGUAcgBnAGUAbgBjAGUAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABOAGkAYwBvAGwAYQBzACAAUwBpAGwAdgBhACAAYQBuAGQAIABKAG8AaABuACAAVgBhAHIAZwBhAHMATgBpAGMAbwBsAGEAcwAgAFMAaQBsAHYAYQAgAGEAbgBkACAASgBvAG4AaAAgAFYAYQByAGcAYQBzAE4AaQBjAG8AbABhAHMAIABTAGkAbAB2AGEAIABhAG4AZAAgAEoAbwBoAG4AIABWAGEAcgBnAGEAcwBoAHQAdABwADoALwAvAHcAdwB3AC4AagBvAGgAbgB2AGEAcgBnAGEAcwBiAGUAbAB0AHIAYQBuAC4AYwBvAG0ALwBoAHQAdABwADoALwAvAG4AcwBpAGwAdgBhAC4AYwBvAG0ALwBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABjAG8AcABpAGUAZAAgAGIAZQBsAG8AdwAsACAAYQBuAGQAIABpAHMAIABhAGwAcwBvACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA7gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBAgCKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQMBBAEFANcBBgEHAQgBCQEKAQsBDAENAOIA4wEOAQ8AsACxARABEQESARMBFACmARUA2ADhAN0A2QEWALIAswC2ALcAxAC0ALUAxQCHAKsAvgC/ARcAwADBB3VuaTAwQUQEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbghkb3RsZXNzagxkb3RhY2NlbnRjbWIERXVybwAAAAAAAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAO0AAQAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAAEAA4AyAlwCuQAAQAwAAQAAAATARwAmABaBKAAmABoAJgF9AaSB6gAcgByCCIJEgCYAJgAmACYAJgAAQATACQAJwApAC8AMgAzADQANQA3ADgAOQA6ADwATwCTAJQAlQCWAJcAAwAP/9gAEf+6ACT/ugACABH/ugAk/7oACQAQ/90AEf/TACT/0wAt/84AVv/iAFv/8QBd/+IA3//dAOD/3QAIAA//8QAR//EAJP/sADf/4gA7/9gAPP/OAEX/7ABT/+IAAQA0AAQAAAAVAGIBOAFGAeQCDgKcAwoDcAPmBLQFOgXYBu4HaAe2B+AH+ghYCIIIlAieAAEAFQAkACUAJgAoACoAKwAsAC0ALwAwADUANwA4ADwAPQBEAEoATwBVAFYAWAA1AAX/zgAK/84AJv/sACr/7AAy/+wANP/sADf/tQA5/9MAOv/TADz/0wBE/+IARf/iAEb/4gBH/+IASP/iAEr/4gBL/+IATP/sAE3/7ABO/+IAT//iAFL/4gBU/+IAWf/dAFr/3QCI/+wAk//sAJT/7ACV/+wAlv/sAJf/7ACh/+IAov/iAKP/4gCk/+IApf/iAKb/4gCo/+IAqf/iAKr/4gCr/+IArP/iAK3/7ACu/+wAr//sALD/7ACz/+IAtP/iALX/4gC2/+IAt//iAOL/zgDl/84AAwA5//YAOv/2ADz/9gAnACb/3QAq/90AMv/dADT/3QBE/90ARf/sAEb/3QBH/90ASP/dAEr/3QBL/+wATv/sAE//7ABS/90AVP/dAFn/7ABa/+wAiP/dAJP/3QCU/90Alf/dAJb/3QCX/90Aof/dAKL/3QCj/90ApP/dAKX/3QCm/90AqP/dAKn/3QCq/90Aq//dAKz/3QCz/90AtP/dALX/3QC2/90At//dAAoAJv/sACr/7AAy/+wANP/sAIj/7ACT/+wAlP/sAJX/7ACW/+wAl//sACMARP/sAEb/7ABH/+wASP/sAEr/7ABQ/+wAUf/sAFL/7ABT/+wAVP/sAFX/7ABY/+cAXP/nAKH/7ACi/+wAo//sAKT/7ACl/+wApv/sAKj/7ACp/+wAqv/sAKv/7ACs/+wAs//sALT/7AC1/+wAtv/sALf/7AC6/+cAu//nALz/5wC9/+cAvv/nAMD/5wAbAET/5wBF/+wARv/nAEf/5wBI/+cASv/nAEv/7ABO/+wAT//sAFL/5wBU/+cAof/nAKL/5wCj/+cApP/nAKX/5wCm/+cAqP/nAKn/5wCq/+cAq//nAKz/5wCz/+cAtP/nALX/5wC2/+cAt//nABkARP/sAEb/7ABH/+wASP/sAEn/8QBK/+wAUv/sAFT/7ABX//EAof/sAKL/7ACj/+wApP/sAKX/7ACm/+wAqP/sAKn/7ACq/+wAq//sAKz/7ACz/+wAtP/sALX/7AC2/+wAt//sAB0ARP/sAEb/7ABH/+wASP/sAEr/7ABM//AATf/wAFL/7ABU/+wAof/sAKL/7ACj/+wApP/sAKX/7ACm/+wAqP/sAKn/7ACq/+wAq//sAKz/7ACt//AArv/wAK//8ACw//AAs//sALT/7AC1/+wAtv/sALf/7AAzAAX/ugAK/7oAJv/dACr/3QAy/90ANP/dADf/pgA4/+wAOf/EADr/xAA8/6YARP/YAEb/2ABH/9gASP/YAEr/2ABS/9gAVP/YAFj/3QBZ/7oAWv+6AFz/3QCI/90Ak//dAJT/3QCV/90Alv/dAJf/3QCh/9gAov/YAKP/2ACk/9gApf/YAKb/2ACo/9gAqf/YAKr/2ACr/9gArP/YALP/2AC0/9gAtf/YALb/2AC3/9gAuv/dALv/3QC8/90Avf/dAL7/3QDA/90A4v+6ACEAJv/sACr/7AAy/+wANP/sAET/6QBG/+kAR//pAEj/6QBK/+kAUv/pAFT/6QCI/+wAk//sAJT/7ACV/+wAlv/sAJf/7ACh/+kAov/pAKP/6QCk/+kApf/pAKb/6QCo/+kAqf/pAKr/6QCr/+kArP/pALP/6QC0/+kAtf/pALb/6QC3/+kAJwAm/+wAKv/sADL/7AA0/+wAN//YADn/5wA6/+cAPP/TAET/9gBG//YAR//2AEj/9gBJ//YASv/2AFL/9gBU//YAV//2AIj/7ACT/+wAlP/sAJX/7ACW/+wAl//sAKH/9gCi//YAo//2AKT/9gCl//YApv/2AKj/9gCp//YAqv/2AKv/9gCs//YAs//2ALT/9gC1//YAtv/2ALf/9gBFAA//ugAQ/90AEf+6ACT/tQAm/+IAKv/iAC3/sAAy/+IANP/iAET/nABF/7AARv+cAEf/nABI/5wASf+mAEr/nABL/7AATP/EAE3/xABO/7AAT/+wAFD/kgBR/5IAUv+cAFP/kgBU/5wAVf+SAFb/kgBX/6YAWP+SAFn/kgBa/5IAW/+wAFz/kgBd/5wAiP/iAJP/4gCU/+IAlf/iAJb/4gCX/+IAof+cAKL/nACj/5wApP+cAKX/nACm/5wAqP+cAKn/nACq/5wAq/+cAKz/nACt/8QArv/EAK//xACw/8QAs/+cALT/nAC1/5wAtv+cALf/nAC6/5IAu/+SALz/kgC9/5IAvv+SAMD/kgDf/90A4P/dAB4AD//xABH/8QBE//EARv/xAEf/8QBI//EASv/xAFD/8QBR//EAUv/xAFP/8QBU//EAVf/xAFb/8QCh//EAov/xAKP/8QCk//EApf/xAKb/8QCo//EAqf/xAKr/8QCr//EArP/xALP/8QC0//EAtf/xALb/8QC3//EAEwAQ/90AEf/TACT/0wAm/84AKv/OAC3/zgAy/84ANP/OAFb/4gBb//EAXf/iAIj/zgCT/84AlP/OAJX/zgCW/84Al//OAN//3QDg/90ACgBJ/+wAV//sAFj/9gBc//YAuv/2ALv/9gC8//YAvf/2AL7/9gDA//YABgBQ//YAUf/2AFP/9gBV//YAWf/xAFr/8QAXAET/3QBG/90AR//dAEj/3QBK/90AUv/dAFT/3QCh/90Aov/dAKP/3QCk/90Apf/dAKb/3QCo/90Aqf/dAKr/3QCr/90ArP/dALP/3QC0/90Atf/dALb/3QC3/90ACgBWACMAWAAKAFwACgBdAA8AugAKALsACgC8AAoAvQAKAL4ACgDAAAoABABJAB4AVwAeAFkACgBaAAoAAgBJAAoAVwAKAAIAWf/2AFr/9gACAGAABAAAAIIAtgAEAAoAAP/s/9j/8f/s/+f/4v/iAAAAAAAA/+L/2AAAAAD/8f/2/+z/3QAAAAD/7P/d//b/8QAA/+wAAAAAAAAAAAAA//YAAP/xAAAAAAAAAAD/7AABAA8AJwApAC4AMgAzADQAOQA6ADsAPACTAJQAlQCWAJcAAgAIACcAJwADACkAKQACAC4ALgABADIAMgADADMAMwACADQANAADADsAOwABAJMAlwADAAIAHwAmACYAAQAqACoAAQAyADIAAQA0ADQAAQA5ADoACQA8ADwACQBEAEQAAgBFAEUABABGAEgAAgBJAEkAAwBKAEoAAgBLAEsABABMAE0ABQBOAE8ABABQAFEABgBSAFIAAgBTAFMABgBUAFQAAgBVAFUABgBXAFcAAwBYAFgABwBZAFoACABcAFwABwCIAIgAAQCTAJcAAQChAKYAAgCoAKwAAgCtALAABQCzALcAAgC6AL4ABwDAAMAABwACABQABAAAABoAHgABAAIAAP/EAAEAAQApAAIAAAACAAgARABEAAEARgBIAAEASgBKAAEAUgBSAAEAVABUAAEAoQCmAAEAqACsAAEAswC3AAEAAAABAAAACgAWABgAAWxhdG4ACAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
