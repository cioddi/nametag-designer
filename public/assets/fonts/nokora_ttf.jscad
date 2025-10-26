(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.nokora_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGEAcgBOAG8AawBvAHIAYQAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAzACAATwBjAHQAbwBiAGUAcgAgADEANAAsACAAMgAwADEAMgBOAG8AawBvAHIAYQAtAFIAZQBnAHUAbABhAHIATgBvAGsAbwByAGEAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABHAG8AbwBnAGwAZQAgAGEAbgBkACAAbQBhAHkAIABiAGUAIAByAGUAZwBpAHMAdABlAHIAZQBkACAAaQBuACAAYwBlAHIAdABhAGkAbgAgAGoAdQByAGkAcwBkAGkAYwB0AGkAbwBuAHMALgBEAGEAbgBoACAASABvAG4AZwBoAHQAdABwADoALwAvAGsAaABtAGUAcgB0AHkAcABlAC4AYgBsAG8AZwBzAHAAbwB0AC4AYwBvAG0ALwBMAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAEEAcABhAGMAaABlACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADIALgAwAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBhAHAAYQBjAGgAZQAuAG8AcgBnAC8AbABpAGMAZQBuAHMAZQBzAC8ATABJAEMARQBOAFMARQAtADIALgAwAAIAAAAAAAD/ZgBmAAAAAAAAAAAAAAAAAAAAAAAAAAAA1gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwBeAF8AYABhAQIAqQEDAKoBBAEFAQYBBwEIAQkBCgELAQwBDQEOAQ8BEAERARIBEwEUARUBFgEXARgBGQEaARsBHAEdAR4BHwEgASEBIgEjASQBJQEmAScBKAEpASoBKwEsAS0BLgEvATABMQEyATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHAUgBSQFKAUsBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfAWABYQFiAWMBZAFlAWYBZwFoAWkBagFrAWwBbQFuAW8BcAFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfAF9AX4BfwGAAYEBggGDAYQBhQGGAYcBiAGJAYoBiwGMAY0BjgGPAZABkQGSAZMBlAGVAZYBlwGYAZkBmgGbAZwBnQGeAZ8BoAGhAaIBowGkAaUBpgGnAagBqQGqAasBrAGtBHp3c3AHdW5pMDBBRAd1bmkxNzgwB3VuaTE3ODEHdW5pMTc4Mgd1bmkxNzgzB3VuaTE3ODQHdW5pMTc4NQd1bmkxNzg2B3VuaTE3ODcHdW5pMTc4OAd1bmkxNzg5B3VuaTE3OEEHdW5pMTc4Qgd1bmkxNzhDB3VuaTE3OEQHdW5pMTc4RQd1bmkxNzhGB3VuaTE3OTAHdW5pMTc5MQd1bmkxNzkyB3VuaTE3OTMHdW5pMTc5NAd1bmkxNzk1B3VuaTE3OTYHdW5pMTc5Nwd1bmkxNzk4B3VuaTE3OTkHdW5pMTc5QQd1bmkxNzlCB3VuaTE3OUMHdW5pMTc5RAd1bmkxNzlFB3VuaTE3OUYHdW5pMTdBMAd1bmkxN0ExB3VuaTE3QTIHdW5pMTdBMwd1bmkxN0E0B3VuaTE3QTUHdW5pMTdBNgd1bmkxN0E3B3VuaTE3QTgHdW5pMTdBOQd1bmkxN0FBB3VuaTE3QUIHdW5pMTdBQwd1bmkxN0FEB3VuaTE3QUUHdW5pMTdBRgd1bmkxN0IwB3VuaTE3QjEHdW5pMTdCMgd1bmkxN0IzB3VuaTE3QjYHdW5pMTdCNwd1bmkxN0I4B3VuaTE3QjkHdW5pMTdCQQd1bmkxN0JCB3VuaTE3QkMHdW5pMTdCRAd1bmkxN0JFB3VuaTE3QkYHdW5pMTdDMAd1bmkxN0MxB3VuaTE3QzIHdW5pMTdDMwd1bmkxN0M0B3VuaTE3QzUHdW5pMTdDNgd1bmkxN0M3B3VuaTE3QzgHdW5pMTdDOQd1bmkxN0NBB3VuaTE3Q0IHdW5pMTdDQwd1bmkxN0NEB3VuaTE3Q0UHdW5pMTdDRgd1bmkxN0QwB3VuaTE3RDEHdW5pMTdEMgd1bmkxN0QzB3VuaTE3RDQHdW5pMTdENQd1bmkxN0Q2B3VuaTE3RDcHdW5pMTdEOAd1bmkxN0Q5B3VuaTE3REEHdW5pMTdEQgd1bmkxN0UwB3VuaTE3RTEHdW5pMTdFMgd1bmkxN0UzB3VuaTE3RTQHdW5pMTdFNQd1bmkxN0U2B3VuaTE3RTcHdW5pMTdFOAd1bmkxN0U5C3VuaTE3RDIxNzgwC3VuaTE3RDIxNzgxC3VuaTE3RDIxNzgyC3VuaTE3RDIxNzgzC3VuaTE3RDIxNzg0C3VuaTE3RDIxNzg1C3VuaTE3RDIxNzg2C3VuaTE3RDIxNzg3C3VuaTE3RDIxNzg4C3VuaTE3RDIxNzg5DXVuaTE3RDIxNzg5LmELdW5pMTdEMjE3OEELdW5pMTdEMjE3OEILdW5pMTdEMjE3OEMLdW5pMTdEMjE3OEQLdW5pMTdEMjE3OEULdW5pMTdEMjE3OEYLdW5pMTdEMjE3OTALdW5pMTdEMjE3OTELdW5pMTdEMjE3OTILdW5pMTdEMjE3OTMLdW5pMTdEMjE3OTQLdW5pMTdEMjE3OTULdW5pMTdEMjE3OTYLdW5pMTdEMjE3OTcLdW5pMTdEMjE3OTgLdW5pMTdEMjE3OTkLdW5pMTdEMjE3OUELdW5pMTdEMjE3OUILdW5pMTdEMjE3OUMLdW5pMTdEMjE3OUYLdW5pMTdEMjE3QTALdW5pMTdEMjE3QTIJdW5pMTdCQi5iCXVuaTE3QkMuYgl1bmkxN0JELmIJdW5pMTdCNy5hCXVuaTE3QjguYQl1bmkxN0I5LmEJdW5pMTdCQS5hCXVuaTE3QzYuYQl1bmkxNzg5LmEJdW5pMTc5NC5hDXVuaTE3RDIxNzlBLmILdW5pMTdCNzE3Q0QJdW5pMTdCRi5iCXVuaTE3QzAuYgl1bmkxN0I3LnIJdW5pMTdCOC5yCXVuaTE3Qjkucgl1bmkxN0JBLnIJdW5pMTdDNi5yCXVuaTE3Qzkucgl1bmkxN0NELnINdW5pMTdCNzE3Q0Qucg11bmkxN0QyMTc4QS5uDXVuaTE3RDIxNzhCLm4NdW5pMTdEMjE3OEMubg11bmkxN0QyMTdBMC5uDXVuaTE3RDIxNzhBLnINdW5pMTdEMjE3OTcucg11bmkxN0QyMTc5OC5yCXVuaTE3QkIubgl1bmkxN0JDLm4JdW5pMTdCRC5uCnVuaTE3QkIubjIKdW5pMTdCQy5uMgp1bmkxN0JELm4yDXVuaTE3RDIxNzk4LmINdW5pMTdEMjE3QTAuYgAAAAIABQAC//8AAwABAAAADAAAAAAAAAACAAEAAADVAAEAAAABAAAACgAMAA4AAAAAAAAAAQAAAAoAJgCOAAFraG1yAAgABAAAAAD//wAFAAAAAQACAAQAAwAFYWJ2cwAgYmx3ZgAoY2xpZwBCcHJlZgBYcHN0ZgBgAAAAAgAFAAwAAAALAAAABwAJAAoACwANAA4ADwAQABIAEwAAAAkAAwAEAAgACQAKAAsAEQASABMAAAACAAIABAAAAAIAAQAGACQASgEkAWYBhgLiAyADQAOCA+wEBgQiBM4FQAW8BdYF9gYaBlQGwAbgBxoHLgdCB1gHbAeWB7AHygfYCAoIMAhICGAIggiWCKoABAAAAAEACAABAS4AAQAIABkANAA6AEAARgBMAFIAWABeAGQAagBwAHYAfACCAIgAjgCUAJoAoACmAKwAsgC4AL4AxACQAAIALACRAAIALQCSAAIALgCUAAIAMACVAAIAMQCWAAIAMgCXAAIAMwCZAAIANQCbAAIANgCcAAIANwCdAAIAOACfAAIAOgCgAAIAOwChAAIAPACiAAIAPQCjAAIAPgCkAAIAPwCmAAIAQQCnAAIAQgCoAAIAQwCpAAIARACsAAIARwCtAAIASACvAAIATACwAAIATgAEAAAAAQAIAAEAVAABAAgABgAOABQAGgAgACYALACTAAIALwCYAAIANACeAAIAOQClAAIAQACqAAIARQCuAAIASwAEAAAAAQAIAAEAEgABAAgAAQAEAKsAAgBGAAEAAQB8AAYAAAAPACQANgBIAFoAbgCCAJYAqgC+ANIA5gD6AQ4BIgE8AAMAAAABBX4AAQMYAAEAAAAUAAMAAAABBWwAAQEAAAEAAAAUAAMAAAABBVoAAQEOAAEAAAAUAAMAAAABBUgAAgNIAuIAAQAAABQAAwAAAAEFNAACAzQAyAABAAAAFAADAAAAAQUgAAIDIADUAAEAAAAUAAMAAAABBQwAAgVKAqYAAQAAABQAAwAAAAEE+AACBTYAjAABAAAAFAADAAAAAQTkAAIFIgCYAAEAAAAUAAMAAAABBNAAAgQYAmoAAQAAABQAAwAAAAEEvAACBAQAUAABAAAAFAADAAAAAQSoAAID8ABcAAEAAAAUAAMAAAABBJQAAgBCAi4AAQAAABQAAwAAAAEEgAACAC4AFAABAAAAFAABAAEAbgADAAAAAQRmAAIAFAAaAAEAAAAUAAEAAQBlAAEAAQBvAAYAAAABAAgAAwAAAAEEUgACABQDhgABAAAAFQACAAUALAAuAAAAMAAzAAMANgA4AAcAOwBEAAoATgBOABQABAAAAAEACAABABIAAQAIAAEABAC8AAIAdwABAAEAYQAGAAAAAwAMAB4AMAADAAEDJAABBAQAAAABAAAAFgADAAEFMgABA/IAAAABAAAAFgADAAEDQAABA+AAAAABAAAAFgAGAAAABAAOACIAPABQAAMAAQBWAAED1gABALYAAQAAABcAAwABABQAAQPCAAEAogABAAAAFwABAAEATAADAAAAAQOoAAIBBAEKAAEAAAAXAAMAAQAUAAEDlAABAKwAAQAAABcAAQABAEsABgAAAAEACAADAAEDcgABA5IAAAABAAAAGAAGAAAAAQAIAAMAAQKiAAEDmgABADgAAQAAABkABgAAAAYAEgAuAEoAYgB0AIwAAwAAAAEDjgABABIAAQAAABoAAgABAGEAZAAAAAMAAAABA3IAAQASAAEAAAAaAAIAAQC0ALcAAAADAAAAAQNWAAEAEgABAAAAGgABAAEAaAADAAAAAQM+AAEARAABAAAAGgADAAAAAQMsAAEAEgABAAAAGgABAAEAegADAAAAAQMUAAIAFAAaAAEAAAAaAAEAAQBgAAEAAQBwAAYAAAAFABAAIgA0AEYAYAADAAEBkgABA2AAAAABAAAAGwADAAEBwAABA04AAAABAAAAGwADAAEDjgABAzwAAAABAAAAGwADAAIAFAN8AAEDKgAAAAEAAAAbAAEAAQBzAAMAAQHmAAEDEAAAAAEAAAAbAAYAAAAFABAAIgA0AEwAZAADAAEA5gABAqYAAAABAAAAHAADAAEA7AABApQAAAABAAAAHAADAAEAEgABAoIAAAABAAAAHAABAAEAywADAAEAEgABAmoAAAABAAAAHAABAAEAzAADAAEAEgABAlIAAAABAAAAHAABAAEAzQAGAAAAAQAIAAMAAQAsAAECXgAAAAEAAAAdAAYAAAABAAgAAwABABIAAQJgAAAAAQAAAB4AAQABADoABgAAAAEACAADAAEAEgABAlgAAAABAAAAHwACAAEAxwDKAAAABgAAAAIACgAiAAMAAQASAAECUgAAAAEAAAAgAAEAAQBGAAMAAQASAAECOgAAAAEAAAAgAAEAAQBIAAYAAAACAAoASgADAAAAAQIyAAEAEgABAAAAIQACAAcAkACSAAAAlACXAAMAmQCdAAcAnwCkAAwApgCpABIArACtABYArwCwABgAAwAAAAEB8gABABIAAQAAACEAAQAGAJMAmACeAKUAqgCuAAYAAAABAAgAAwABABIAAQHcAAAAAQAAACIAAQABALkABgAAAAIACgAiAAMAAQASAAEB0gAAAAEAAAAjAAEAAQCuAAMAAQASAAEBugAAAAEAAAAjAAEAAQBNAAEAAAABAAgAAQAGAHoAAQABAEAAAQAAAAEACAABAAYAEAABAAEAqwABAAAAAQAIAAEABgBUAAEAAgBpAGoAAQAAAAEACAABAAb/8QABAAEAdAABAAAAAQAIAAIAEgAGALQAtQC2ALcAtQC4AAEABgBhAGIAYwBkAGgAcAABAAAAAQAIAAIACgACALEAsQABAAIAcwB0AAEAAAABAAgAAgAKAAIAZQBlAAEAAgBzAMQAAQAAAAEACAABAGwATAABAAAAAQAIAAIAFgAIAL8AwADBAMIAwwDEAMUAxgABAAgAYQBiAGMAZABwAHMAdwC8AAEAAAABAAgAAgAQAAUAxwDIAMkAxwDKAAEABQCbAJwAnQCgAK8AAQAAAAEACAABAAYAaQABAAMAZQBmAGcAAQAAAAEACAABAAYAIAABAAMAsQCyALMAAQAAAAEACAACAA4ABADLAMsAzADNAAEABACbAKAAqACpAAEAAAABAAgAAQAGAIQAAQABADUAAQAAAAEACAABAAYAAQABAAEAmQABAAAAAQAIAAIACgACANQA1QABAAIAqQCvAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
