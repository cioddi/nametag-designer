(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mr_bedfort_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGwAZQBqAGEAbgBkAHIAbwBQAGEAdQBsADoAIABNAHIAIABCAGUAZABmAG8AcgB0ACAAUgBlAGcAdQBsAGEAcgA6ACAAMgAwADAANgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAwAE0AcgBCAGUAZABmAG8AcgB0AC0AUgBlAGcAdQBsAGEAcgBNAHIAIABCAGUAZABmAG8AcgB0ACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAQQBsAGUAagBhAG4AZAByAG8AIABQAGEAdQBsAC4AQQBsAGUAagBhAG4AZAByAG8AIABQAGEAdQBsAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBzAHUAZAB0AGkAcABvAHMALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAANAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgANAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOoAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wDiAOMAsACxAOQA5QC7AOYA5wDYAOEA2wDcAN0A4ADZAN8AsgCzALYAtwDEALQAtQDFAIIAhwCrAMYAvgC/ALwBAgEDAIwA7wCUAJUA0gDAAMEMZm91cnN1cGVyaW9yBEV1cm8AAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQDpAAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAggAEAAAAPAEIAP4BCAEqATQBVgHIAeYB+AISAiwCOgJIAmYCfAKKAqgCvgLQAt4DEANiA5AD2gQABBYERARWBHwEwgVYBgoGFAaCBpQG4gcQB34H5Af6CAQIGggkCCoINAg+CEQISghUCFoIbAhyCHgIfgi4CMYI4AjmCPAI8AABADwABQAHAAoADwARABIAEwAUABUAFgAXABgAGQAaABsAHAAkACUAJgAnACgAKQAqACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD8ARwBJAE8AUABVAFcAXQBeAGYAaABwAHYAhwCQAJ4AxQDUANcAAgAXAC8ASAAhAAgAKQBzACsAOQAvADsAMv/kADT/wAA3AW4AOP/XADz/2QACABP/wQAZ/9QACAAT/5UAFP/aABX/xwAX/8AAGf+nABr/oQAb/8cAHP+0ABwAFABOABUAVAAYAFMAGgCmACUAeQAnAKsAKABSACsAUwAsAIUALQByAC4AqwAwANEAMQCrADUAeQA3AbUAOACLADkAhQA6ALEAOwBlADwAfwA9AD8ARP/HAEUARgBJAJ8ASwCMAE4AiwBPACYAVwBMAAcABAAaAA//twAR/8EAIgCMAGAAFQDW/7cA2f+3AAQABAAkABIAYwAT/9wAIgBeAAYABAAgABIAYwAT/+YAF//LABoAGgAiAJcABgAP/9wAEf/RABX/4gAiAGgA1v/cANn/3AADAAQAGgASAE4AIgBUAAMABAAaABX/2wAiAFkABwAEABoAD//HABH/1wAiAG0AYAAVANb/xwDZ/8cABQAEAC4AEgBTACIAjABgAC8AZgAlAAMABAAUACIAWQBm/+0ABwAEAB8AD/+yABH/pwAiAIwAYAAVANb/sgDZ/7IABQAq/+0AMAA5ADL/4AA6ABoAP//GAAQAOP/HADz/2gA9/9QAP/94AAMAIgAmADAAOQA6AC0ADAAS/+EAJQA5ACwAQAAtAEwANQBMADkAOQBIADIASQAnAEsAGgBOACcATwA0AMIANAAUAAQAkQANAPcAJQBSACcAWAApAFMALABZAC0AnwAuAGUALwBGADAAJgAyAD8ANQBeADYAMgA5AEYAOgAtADsALAA8ABMAPQAzAD8A3QBgAVIACwANAI8AJwBZACgAJgAtAKUAMAAsADkAUgA6AGUARP/NAEr/1wBS/+AAYABiABIADQBvACIAkgAlAEwAJwBZACwAPwAtAFkALgAsADAAfgAxAEAANQBmADYAJgA3AFkAOQBZAD0AOQBFACAASAAiAE0ANABOADoACQAx//oANQATADcALQA4/9oARP/fAEb/4ABIAB0ASv/mAFT/3wAFACr/7QArADIALAAaAET/5gBIABkACwAk/9MAJf+7ACj/4QAq/80ALP+iAC3/jgA4/6gAOv/AADz/jgA9/4EAP/9+AAQAJP/gACr/zQAr/9oAPf/aAAkAJP/HACb/5wAp/6cALf+0ADX/2gA3AGsAOv/gADz/xwA9/8AAEQAk/+AAJf/HACb/2gAp/9oALP+uAC3/wAAy/9MANf/tADcAmAA4/5sAOf/nADr/zgA8/6gAPf+0AD//SgBF/9MATP/gACUABABZAA0AlgAP/9MAEf/TACIAqwAkADIAJQCkACYAPwAnAJ4AKACFACkAMwAqAC0ALACrAC0AsQAwAIsAMQBmADUAnwA3ACYAOABGADkAjAA6AGYAOwBMADwATAA9AIUARP/ZAEUATwBIAEcASQB7AEsAewBMAC0ATQBUAE4AfABPAFsAVP/ZAFcAWwBgAFQAwgBbACwABADEAA0BCwAiAUMAJABMACUBCgAmAHIAJwEDACgA1wApACwAKwC+ACwA9wAtATAALgEKAC8AbAAwAPcAMQDxADIAeAA0AEwANQEKADYAnwA3AIUAOADRADkBBAA6AOsAOwDLADwAywA9AOQAPwCJAET/2QBFALIARwAgAEgADQBJAP4ASv/fAEsA6gBMAGUATQCFAE4A/QBPALYAUQANAFL/5gBXAOoAYADJAMIAtgACADUAGgBY/9kAGwAk/9MAJf/bACb/uwAn/+0AKv/HACv/tAAs/4EALf+nAC7/xwAw/7oANf+bADcAbAA4/5QAOf/NADr/ugA8/4gAPf9JAD//SgBA/0MARf/MAEv/xQBM/9kAT//GAFj/2QBa/9kAXP/ZAML/xgAEADH/2gA1AA0AQP+sAEgAIQATAAQAWAANAKkAIgBZACT/+gAnADkALP/6ADAAUgAyACYANQBYADkALQA6AF8APAAsAD8AlQBIACYASwAcAE0AHwBPACAAVgAZAGAAjwALACz/wAA8/60APf/bAED/cQBM/+AAT//gAFD/2QBZ/+YAWv/gAFz/5gDC/+AAGwANAIIAIgBfACUAPwAmACwAJwBMACgALAArAHEALABZAC0AZQAuADkAMABMADEALAAyAB8ANQB4ADkATAA6AD8APQAsAED/sgBFACYASAAmAEkALgBLADQATQAmAE4AOgBPADQAVwA5AMIANAAZAA0AdQAiADkAJQA/ACYAIAAnACwAKAAgACkAXwArAHIALABTAC0ATAAwADIAMQAyADUAWAA5AEwAPQAgAEUAEwBIAD4ASQAmAEsALQBNADkATgAaAE8ALQBXABkAWQAfAMIALQAFACb/zQAr/9oAOP/gAD3/xwBA/6sAAgA1ACAANwAgAAUALv/mADL/4QA4/+AAPf/OAED/pQACAC8AVQA3ATEAAQANADsAAgANADQAIgBTAAIADQBOACIAXwABAFP/5AABAEb/7AACAA0A0AArACcAAQBc/+0ABAAT/8IAGf/MABr/zAAc/8wAAQAa/+AAAQBIACEAAQApAQoADgAlAEoAJwBAACkAswArAGwALABEAC0AVQAuADkALwB7ADAAUQAxADEANQBOADcBlQA5ADkAkABAAAMADQDqAD8AbgBgAIIABgBIADIASQAnAEsAGgBOACcATwA0AMIANAABAEgALgACAED/rABIACEAFQAlAF4AJv/ZACcAdQApANkAKv+8ACwAYAAtAF4ALgB1ADAAfQAxAIAANQBKADcBfQA4AC0AOQBeADoAYAA8AEAASQB5AEsAVQBOAFMAh//ZAJAAdQABAAAACgAmACgAAkRGTFQADmxhdG4AGAAEAAAAAP//AAAAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
