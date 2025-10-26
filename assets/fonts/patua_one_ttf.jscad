(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.patua_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAAPAIAAAwBwR0RFRgATAOoAAGrAAAAAFkdQT1OtMLKNAABq2AAAGVRHU1VCuPq49AAAhCwAAAAqT1MvMog7E+sAAGMsAAAAYGNtYXDUr6+vAABjjAAAAORnYXNwAAAAEAAAargAAAAIZ2x5Zr4UeZEAAAD8AABcNGhlYWT5vWDpAABfKAAAADZoaGVhCAMEmAAAYwgAAAAkaG10eNnuF88AAF9gAAADqGxvY2EcOwUFAABdUAAAAdZtYXhwATMAVwAAXTAAAAAgbmFtZWT2jEsAAGR4AAAENHBvc3QNDBqvAABorAAAAgtwcmVwaAaMhQAAZHAAAAAHAAIAPP/2ANsCsgAJAA0AABM0NzMWFRQHIyYCNDIUPgeOBiFaIAKfAf5UYFlPu4WC/qqUlAACACYCQwGQA0cACAARAAAAFhUUByc2NzYiFhUUByc2NzYBZiloMwIlEJMpaDMCJRADRyAZQokTmT4aIBlCiROZPhoAAAIAFv84AwQC0AAzADcAACUjAycuATQ/ASMDJy4BND8BIyc2OwE3Iyc2OwETFx4BFA8BMxMXHgEUDwEzFwYrAQczFwYBBzM3AkpIX0IHBQg6kl9CBwUIOnoKHztJP3oKHztJVkIHBQgxklZCBwUIMXsKHjxKP3kKHv7dP5I/Vv7iCwstGhKv/uILCy0aEq86I786IwEBCwstGhORAQELCy0aE5E6I786IwEcv78AAAEAHv9RAgQDYwA9AAABJiIGFBYfAR4BFAYHFhUUFSMmNTQ3Jic8ATY3MxYXFjI2NTQuAS8BJjU0NjcmNTQ1MxQVFAcWFxwBBgcjJgFTIkotIjJZSFV2XBh4ARd+Sw4NXxADI108Bh8dZ51nVRh4F19bDg1fEAJFCSVDJg4aFVmxcgxNTAkICwtHSwczBiJSGh80DywpExkdCR4tm1BoDFBICwoJCEtOBSoGIlIaHQAABQAZ/+UDNQLQAAkAEgAaACMAKwAAFyY0NwEXFhQHAQM0NjIWFAYjIhIGFBYyNjQmEzQ2MhYUBiMiEgYUFjI2NCbZBRMBTD8FE/60/2SlXGVSrpEXGj8YGuZkpVxlUq6RFxo/GBoFEDEiAnIWEDAk/Y8CFmFiV8ZmAS4ogy8sgyv+T2FiV8ZmAS4ogy8sgysAAwAd//gCRgK6ABoAIgAqAAAAFhQGBxYXNjcXBgceARcHJicGIiY1NDcmNDYXNCMiFRQXNgcGFRQzMjcmAWlMRU4uYB0PWhErDToFODksXb5xdktmmzxLK1x8J2w0GG8Cult8UDpESh41IEI2DCkEVR4lQ1pUYVhhoVmoT087Oz7KJzFbHmMAAAEAJgJDAMIDRwAIAAASFhUUByc2NzaYKWgzAiUQA0cgGUKJE5k+GgABAB3/UgEJAr4AFwAAEgYUFhcWHwEHLgMnJjQ+Aj8BFw4BvxQTDhwYCTMKLiMqDyUmNjcTEzAMIwHXhImHL1wtEicHMTBOKmXPm11EDg4qElcAAQAU/1IBAAK+ABYAABIWFAYHBg8BJz4BNzY1NCcmLwE3HgLYKCYbOC0TMwkoDSAgHhQJMAgYQAICnKyaMWUoECcNYy1zholqXyMQKgUTSgABABwBVgGCAtIAHwAAExU3FwYPARcHBiIvARUHJj0BByc2PwEnNzYyHwE1Nxb7WyQILR9cFQ4pHR44IFwjCC0fXBQNKR4fOCACgyQ1LCgaEjQ1BRERaggbNCM1LCkaEjY0BRISawgaAAEAGAAsAeMB7wATAAABFTMXBisBFQcmPQEjJzY7ATU3FgExqAoePFhGI6YKHztWRiMBlVc+I6cKHztXPiOnCh4AAAEAJP9pAM4AjQANAAA3NDIVFAYHJzY1NCcuASSqRDAqIQETGUFMTENzIho3NQgHBiUAAQAuANwBeAE/AAcAACUjJzY7ARcGAR7mCh875goe3EAjQCMAAQAl//YAzACNAAMAABY0MhQlpwqXlwAAAQAc/zgBgQLQAAsAABcmNTQ3ARceARQHASkMCAENQgcFCP7zvRUwDRIDKQsLLRoT/NgAAAIAKf/4AhgCugAHABEAABYmEDYgFhAGAhAWMzI3NhAmIpRreQELa3veKDkwFxsodwieAXqqlv6GsgH5/t56Jy0BQHQAAQAcAAABPQK2ABEAABMyFxU3ERYXByEnNjcRJic1Ns4bHAEoDwr+/AoSPzgiVAK1AwEB/cIQEVNTFhABtgYPTCUAAQAWAAACAAK6ACUAAAEyFRQGDwEGDwEXNjsBNjcXFhUUByEnEzY1NCYiBwYHJyYnNDc2ARPYJhqRIS0QBS40TwcSXxYH/jUY+UYkXCEJDlkTAgFaArqvJlUfriYlDgsJNx8GJlMjHHwBDkxGJCINShcFIU4RBzoAAQAY//gB3QK6ACkAABM0Nz4BMh4CFAYHFRYUBiMiJic3FjMyNTQjIgcnNzY1NCYjIgcGBycmKAEZdldIRCc2JXagfyhjGxdDPJN1LyoJWXEwMBISBxJZFgKEDQkMFBAlSVtPFAkq43AXDlYZangEVAgLYjMuAzcdBSMAAAEABgAAAhUCygAcAAABMxUjFRYXByMnNjc1IScTFwMGDwEXNjsBNTQ3FwHLSkonEAr+ChM+/t8a1WaBFBgJBSI0WyJoARpkRQ8TT08XEEBPAcUs/tAuHAsLDI9/NgsAAAEAHP/4AdgCsgAbAAABMhYVFAYjIiYnNxYyNjU0JyYiBycjESEVIxU2AQdib5GCKmQbIDmEQiYeVEMoAQFx9CABumloe3YYEFcWNjxRGhUKSgEfcowGAAACACT/+AH6Ar4ADQAYAAABMhYUBiImEDY3FwYHNgcUFjMyNTQmIyIHAStjbIjoZqOHKpIlLzwoK2MjKT0tAapr0XaHASTxKlM/mxmZYVp9OzsdAAABABAAAAHwArIAEgAAEyMGBycmNTQ3IRcDIxM2PwEnBvZYBxJfFgcBzA3/l8UUHwsFLgJONx8GJlAiHE/9nQHXLjUSCwkAAwAi//gCCgK6ABUAHwAqAAATNDYyFhUUBgceARUUBiImNTQ2Ny4BExQyNTQnLgEnBhIGFB4DFzY0JkNxz2YsHzY2he12ODAkI3HEJh5CCDY4Kw8gGC0ILiwCBFheU1gnUxwkST1kc2JmNlsdIEL+/G9eNB0WGgQuAU4oOiEXDREELmUpAAACABH/9AHjArsADQAYAAATIiY0NjIWEAYHJzY3Bjc0JiIGFBYzMjc27VyAe916pIIuiyshLzBcJjMmOx0BARpryG6X/urqMFNBoxGHZlY2cTsSBwACADAARgDPAb0AAwAHAAA2NDIUJjQyFDCfn59GlZXilZUAAgA1/6UA1wG6AA0AEQAANzQyFRQGByc2NTQnLgE2NDIUNaJALikgARIYAZ9zSUk/byAZMjQIBwYjyZWVAAABABcAPAFfAmoACwAAJQcuASc+ATcXBgcWAV8sObcsLLc5LCp3eWImGbFNTbEZJWyGigAAAgA0AGwB/wGSAAcADwAAASEnNjMhFwYHISc2MyEXBgGl/pkKHzsBZwoePP6ZCh87AWcKHgExPiM+I8U+Iz4jAAEAKAA8AXACagALAAA3JzY3Jic3HgEXDgFULCV7eScsObcsLLc8JmKPi2clGbFNTbEAAgAZ//gB+QK6ACEAJQAANyY0PgM1NCMiBwYHIy4BNDU+ATMyFhUUDgIHBhUUFwY0MhSnChA9QTJmKiYDEF8NDit9Om+OIzM7GTUBkKfBISouPSo+I0sQNB8aUSIGHSBlXilFKywSJDIEBcmXlwACACT/RQOPAroAMwA8AAAFIBEQEjMyFhUUBiMiJicOASMiJjQ2NzYyFzY7AQMUFRQzMjU0JyYjIgcOARUUFjMyNxcGAhYyPwEmIyIVAab+fv3pxMGKfjVBBxdEGExIKCE+giQPIjYfJYlaU4DDXiIppIVvXhFsrR1KIxQfI1y7AXABAgEDr7aMuScZEhhNoW8dNh8Z/sADAiHVp0ZBfy6VYaCPIUUyAWApINcOrQAC//oAAAKIArcAEwAcAAABExYXByMnNjcnIwcWFwcjJzY3ExcUDwEzJyYvAQGGxyoRCuoKDCQbyBkjEQrkChIxwDYZJ48mFwMBArf9vw8UU1MQDlRRDhNTUxcPAj6MPVF8ekY5EQADACAAAAJMArIAFAAcACUAAAEyFhcWFRQHFhUUBgchJzY3ESYnNwEjFTMyNjQmAyMVMzI2NC4BAQ12axczSV2Dgv7jCg0qKQ4KARZZRURGN2Q0UjM2JjICsh0ULFtEPS+AZGEFUxEQAckPE1P+eb4oaC4BGq00SyYIAAEAHv/4AiUCugAXAAABJiIGEBYzMjcXBiAmEDYzMhccAQYHIyYBlB54SkdGa1Ukav7if52OcmcODV8OAjwNaP78bSBZP6IBcLA/BiJSGhsAAgAgAAACZwKyAA0AFQAAISMnNjcRJic3MzIWEAYnMzI2NTQrAQEp/woNKikOCt+hvavVSEtXvS1TERAByQ8TU7T+o6FtW4P6AAABACAAAAH6ArIAHQAAKQEnNjcRJic3IRUHJicjFTM2NxcVByYnIxUzNjcXAfr+MAoNKikOCgHIShcOnIsMDT8/DQyLpA0YSlMREAHJDxNTrgkUNqweDAeyCAogvzQWCQABACAAAAHyArIAGwAAARUHJicjFTM2NxcVByYnIxUWFwchJzY3ESYnNwHyShcOnIsMDT8/DQyLQx4K/uwKDSopDgoCsq4JFDa2HgwHsggKIKYPGlNTERAByQ8TUwAAAQAe//gCWwK6ACEAAAEiBhUUMzI3NSYnNzMXBgcVDgEjIiYQNiAXHAEGByMmJyYBQ0RLiDYqLhEK6goNIjBzVo+GnwEVWA4NXA8FKwJJaIH3EXEPFk9PEA+5Ix2jAW+wPwYiUhocNw8AAAEAIAAAAooCsgAjAAABIxUWFwcjJzY3ESYnNzMXBgcVMzUmJzczFwYHERYXByMnNjcBw9woDwrqCg0qKQ4K6goQJ9wpDgrqChAnKA8K6goNKgE8yBARU1MREAHJDxNTUxMPnZ0PE1NTEw/+NxARU1MREAAAAQAgAAABHgKyAA8AAAEXBgcRFhcHIyc2NxEmJzcBFAoQJygPCuoKDSopDgoCslMTD/43EBFTUxEQAckPE1MAAAH/df8wARUCsgAYAAAXMjY1ESYnNzMXBgcDFAYiJzwBNjczFhcWDCQeKQ4K6goQJwFZx0cNDFoOBgVkJTYCRg8TU1MTD/3Dc100Bh9HGBY1AQACACAAAAJ7ArIADgAeAAAhIwM3Jic3MxcGDwEXFhcBFwYHERYXByMnNjcRJic3AnGm3qccCwrkCg4mrZ5BGP6ZChAnKA8K6goNKikOCgFo3g0OUVEQENXuDh0CX1MTD/43EBFTUxEQAckPE1MAAAEAIAAAAfQCsgARAAApASc2NxEmJzczFwYHETM2NxcB9P42Cg0qKQ4K6goQJ54NGEpTERAByQ8TU1MTD/4wNBYJAAEAHgAAA2wCsgAwAAABND8BJwYHAyMDJi8BBxYVERYXByMnNjcRJic3MxMWHwEzNjcTMxcGBxEWFwcjJzY3AqkHAgoXEYWFjBMPBgoJJRIKxAoSJSkQCuSSHAgDDgQgi+AKECknEArkChAnAXkoVBgBVTL+eQGHLUMXAVk7/vkOF01NFw4Bzg8WTf5tQjcRPU0Bk00WD/42DxRTUhQPAAABAB4AAAKNArIAJAAAExEWFwcjJzY3ESYnNzMTFh8BNyY1ESYnNzMXBgcRIwMmLwEHFsElEgrEChIlKRAKzscWFQcLDiQTCsQKEySdyRYVBwsOAXn++Q4XTU0XDgHODxZN/nwqRhgEVzsBAw4YTU0YDv3BAYcqRxcEVwAAAgAe//gCZQK6AAcAEAAAFiYQNiAWEAYAEBYyNjU0IyKrjZsBH42e/u1MhUqQQwikAW+vnP6SuAHp/v52b4HwAAIAIAAAAkcCsgASABoAACUjFRYXByEnNjcRJic3IR4BFRQBIxUzMjY0JgEULUkSCv7yCg0qKQ4KAQmLif7cPENEQ0nwdhAXU1MREAHJDxNTAmF84wFV6DaFLQAAAgAe/08CZQK6ABEAGgAANiYQNiAWFRQGBxYXByIjIiYnAhAWMjY1NCMih2mbAR+NdmwydQoEBWiqFTxMhUqQQxCmAVWvnLqbtBZBE1tbUwHj/v52b4HwAAIAIAAAAnMCsgAdACUAAAEUBgcWHwEWFwcjJyYrARUWFwchJzY3ESYnNyEeAQUjFTMyNjQmAj1VQDIQSS8RCqlzEBVBSRIK/vIKDSopDgoA/4yI/uU7OURDRAHoRFwYFR6LEBVN9SWgEBdTUxEQAckPE1MCVhW+KWorAAABAB//+AIFAroALAAAASYiBhQWHwEeARUUBiMiJic8ATY3MxYXFjI2NTQuAS8BJjU0NjIXHAEGByMmAVQiSi0iMllIVZNtPH8qDg1fEAMjXTwGHx1nnYTVZg4NXxECRQklQyYOGhVZVmZ2HxwGIlIaHzQPLCkTGR0JHi2bW20wBiJSGhgAAAEACAAAAjgCsQATAAABFQcmJyMRFhcHIyc2NxEjBgcnNQI4Pw0MeCgPCuoKDSp4DA0/ArGPCAog/jAQEVNTERAB0CAKCI8AAAEAEP/4AmoCsgAbAAAkBiAmNREmJzczFwYHERQWMjY1ESYnNzMXBgcRAjN3/vZrJhEK6goQJy96MikOCtsKECd3f32FAUMOFFNTEw/+uUhFR0YBRw8TU1MTD/69AAABAAD/+wJ+ArIAGAAAFwMmJzczFwYHExYfATM2NxMmJzczFwYHA/a+Kw0K6goOJVUVBQEOARhZJg8K5AoSMbwFAkIQElNTEw3+2EU6ET1RASkNFFNTFhD9wgABAAP/+wPcArIAKgAAAQMjAyYnNzMXBgcTFh8BMzY3EzMTFh8BMzY3EyYnNzMXBgcDIwMmLwEjBgHIVJqgKQ4K5woRJUcQCQIOARJamVoQBgIOAhZPKhAK3QoTMKidUQ4HAg4EAXb+hQJCDxNTUxQN/tlAPxE7UwGW/mxJNhI9UgElDxZTUxgP/cMBekRBFEUAAAEAAQAAAk4CsgAuAAABNj8BJic3MxcGDwEXFhcHIyc2NycmLwEjBg8BFhcHIyc2PwEnJic3MxcGBxcWFwE9Bh4mIw4K5AoSMYKHLBEK6goMHi4ZCAMPCRstJA4K5AoSMYiCLw8K6goNGygaCgGnGDhIDxFTUxYQ0vEPFFNTDg5iMx8LIjlgEBBTUxYQ79MQFFNTEAtLMiAAAf/8AAACTwKyACIAACEjJzY3NQMmJzc1NzMXBgcXFh8BMzY/ASYnNzMXBgcDFRYXAZzqCg0qoy8RCQHqCgwiIh0VBw8VIiAoDgrkChQunigPUxEQcwFTEBVOAQRTEQ1NQkEUSU5JEBJTUxcP/q5zEBEAAQAPAAACJAKyACEAAAEjBgcnJjU0NyEXAQYPARc2OwE2NxcWFRQHIScBNj8BJwYBDV0HEl8WBwHnCv7eGx0LBS40egcSXxYH/fwKASIbHgoFLgJONx8GJlAiHE/+TSoYCAsJNx8GJlAiHE8BsyoYCAsJAAABAEP/OAE9AtAADQAAEyMRMzIWHwEHIxEzFwbfNzcbLwoKCvDwCiICev0UEggJMwOYMyMAAQAc/zkBogLPAAkAABMBBy4BJwE3HgGXAQs7DygI/vQ8ESYCgfzXHwYvGQMqHgcuAAABAAr/OAEEAtAADQAAEyMiJi8BNzMRIyc2OwGfNxsvCgoK8PAKIjw3AnoRCQkz/GgzIwAAAQBfAjkBrQNFAAsAAAEGByc+ATceARcHJgEGNUcrDW0tLW0NK0cCt08vIy2iGhqiLSMvAAEAXf+DAh3/4gAHAAAFISc2MyEXBgHD/qQKHzsBXAoefTwjPCMAAQCFAjkBSAMcAAcAAAEHLgEnNx4BAUg2KVYOaB04AlgfGmEoQB17AAIAFf/4AfYB/AAfACgAABM0NzYyFh0BFhcVBiMmJwYjIiY0NjsBNTQjIgcGByMmEzI3NSMiFRQWLgFd1l0jFDNfCgcrcUNfWVhtUx8UAgpiEbQzHkZIHwGqDxEyUV7VBwpXGBolP06GTTBOBioXI/7rHlI3GSAAAAL/+//4Af4C0wAXACEAABM2MhcVPgEzMhYVFAYHBiMiJwYrAREmJwEyNTQmIyIHERYFOGAhFUYgbVgpI0JaREITGTIjFAETYCEpPigrAsYNA/oPF3CHS20dOCIaAlcMFv3loVU9If7/EQABABn/+AGwAfwAGgAAASIVFBYzMjcXDgEjIjU0NzYyFxYVFAcjJicmAQVcMzBMOh4gbDPYS0PAQAEaWA4DDAGWnlA/Dk0VHfqSQDgkCgk5MxkjAQACABr/+AIbAtQAGwAkAAABNjIXERYXFQYjLgEnDgEjIiY1NDc2MzIXNSYnAzI3ESYiBhQWAR45aCUeGTxcChMBFkYibGFKQV8qKi4WGDkjKVwpKALGDQP9qAUMTyAFGgwSGXWFlz02CmMNF/3lIgEMClGhRgAAAgAZ//gBygH8ABgAHwAABSImNTQ2NzYyFhUUKwEeATMyNj8BFw4CEzY0JiIGBwEKeHkqJEa6Y0fZBDk+Ij4ODh4GF10EAiBPKgcIgHpKax04X3tIPzQQCAhQBxUjATsOKC0wOQAAAQAaAAABuQLYACEAABM0NjIXFhQGByMmJyYjIgYdATMVIxEWFwchJzY3ESMnNjdRWsRIAQ4MVBIBDAgmIJmZSxsK/usKDiksCxYhAgdoaTUHGz4TIh4CKjcmXP7lDxhNTRMPASBFFAMAAAIAG/8wAeUB/AAeACcAAAUyPQEGIyImNRAzMhc2OwERFAYjIiYnJjU0NzMWFxYCFjI3NSYjIhUBAFkxSl5l6jw0ChRSbXI8gCEBGlgLBSYrKWMoKC9damssHm6AAP8aEv4UbmocFQkJNzMVIw8BIjwc7RGTAAABAA4AAAI+AtMAIgAAEzYyFxU+ATMyFh0BFhcHIyc2NzU0JiIHERYXByMnNjcRJicYOGAhGFAfY0wnEArmCg4pI1wrJxAK5goOKSMUAsYNA/oQFmBiyw8TTU0TD8Y2JSD+/w8TTU0TDwHoDBYAAAIAHAAAARYC0AAOABIAABM2MhcRFhcHIyc2NxEmJzY0MhQmOGAhJxAK5goOKSMUKKcB9A0D/nEPE01NEw8BFgwWkpeXAAAC/9z/MADeAtAAEQAVAAATNjIXERQGIyInNxYyNjURJic2NDIUGThgIVdmHhsMBzgfIxQopwH0DQP+AnRcBWIBKjcBjgwWkpeXAAIADgAAAjUC0wAOAB0AABM2MhcRFhcHIyc2NxEmJwEDNyYnNzMXBg8BFxYXBxg4YCEnEArmCg4pIxQBfbFuEQcK3AoWPWBxPhkKAsYNA/2fDxNNTRMPAegMFv2HAQOPCgtNTRwQbpUOHU0AAAEADgAAAQgC0wAOAAATNjIXERYXByMnNjcRJicYOGAhJxAK5goOKSMUAsYNA/2fDxNNTRMPAegMFgABABoAAANkAgEANgAAEzYyFxU+ATMyFz4BMzIWHQEWFwcjJzY3NTQmIgcWHQEWFwcjJzY3NTQmIgcRFhcHIyc2NxEmJyQ3WB0YSB1yJhlSI25MJxAK5goOKR5ZKAUnEArmCg4pHlgoJxAK5goOKSMUAfQMAjIUHDkYIWOIog8TTU0TD8Y3JCEiPKIPE01NEw/GNyQg/v8PE01NEw8BFgwWAAABABoAAAJKAgEAIgAAEzYyFxU+ATMyFh0BFhcHIyc2NzU0JiIHERYXByMnNjcRJickN1gdGVMmYk8nEArmCg4pI1otJxAK5goOKSMUAfQMAjIVG1xxwA8TTU0TD8Y2JSD+/w8TTU0TDwEWDBYAAAIAGf/4AfkB/AAHABEAABYmEDYyFhQGAxQzMjY1NCMiBotyf+5zgc9gMS9iMC4IfgD/h3j/jQEGoElTnEUAAgAP/zgCEgIBABsAJQAAEzYyFxU2MzIWFRQGBwYjIicVFhcHIyc2NxEmJwEyNjQmIyIHERYZN1gdQ0xkWiokRV8pJTsRCvsKDSojFAEHMjogKkAmHwH0DAIxL3KFR2wePAhWEBVNTRIQAd4MFv63WZ06Hv72CAAAAgAa/zgCDgH8ABYAHgAAAREWFwcjJzY3NQYjIiY1NDc2MzIXNjMCFjI3ESYiBgHkHQ0K6AoTMzg1b2JKQV83MxYU7iheKChdKQH0/a4NEE1NGA9xJXSGlz02Fw/+sEYmAQERUQAAAQAaAAABdQIBABgAAAEiBxUWFwchJzY3ESYnNzYyFxU+ATIXByYBRkwdUR4K/uIKDikjFAo3WB0XSDsLAxQBeR3lDxtNTRMPARYMFk0MAj8bIwWCAwABAB//+AGuAfwAKAAAEyIVFB8BFhUUBiInJjU0NzMWFxYzMjU0Ji8BLgE0NjIXFhUUByMmJybiQkVPemnlQAEWUw0EFCVYGCNPPURqxUQBFlINBBwBoiclEhUgbUtfIAsLNywYGgYyEBUKFxFDg1QdCgo0LBcZBwABAAwAAAFrAnIAFQAAExUzFSMVFBYyNxcGIiY1ESMnNjc2N9CPjxJEJx5NoTktCxAyDC0Ccn5U/SAdD04nRUIBGT0TE1IdAAABAAr/+AI9AgEAHgAAJQYiJj0BJic3NjIXERQWMjcRJic3NjIXERYXFQYjJgGLRbtKIxQKOGAhIWIqIxQKOGAhIxQ8WxkqMk5Y5wwWTQ0D/sE2IyAA/wwWTQ0D/noHCk8gEgAAAQAH//oCQwH0ABgAAAUjAyYnNzMXBgcXFh8BMzY/ASYnNzMXBgcBXG6kMhEK5goNHjYSCAIOCBQ1JQ8K3AoSMAYBhhAXTU0QDZcvLg4yN5QOFE1NFxAAAAEAAf/6AzAB9AAlAAAFJyYvASMGDwEjAyYnNzMXBgcXMzY3EzMfATM2PwEmJzczFwYHAwHyMxAJAw4KFC+OfisQCuoKEis6DgsPRHBDGQ4lDQYtDwreChEufQaeMEgYTkGfAYkPFU1NFQ//NTgBAf9vqTocEBRNTRcP/nkAAAEADQAAAh0B9AAuAAABNj8BJic3MxcGDwEXFhcHIyc2NycmLwEjBg8BFhcHIyc2PwEnJic3MxcGBxcWFwEmBxYSHQwK3AoUPVheNxUK5goKGxkRCQMOCRQYIgwK3AoTOF9YPBUK5goOFBUUCQEwGyMcDRBNTRsQe4sPGk1NDQ0pHB8KIyAmDxBNTRkQi3sQG01NEAkeHiIAAf/+/zACOgH0ACcAABcyNjcDJic3MxcGBxcWHwEzNj8BJic3MxcGBwMGBwYiJyY1NDczFhehEikIpDERCuYKDR83EgcDDggUNSUPCtwKEjClLxksnSkBF1MPAnRDLgGEEBZNTRANly8uDjI3lA4UTU0XEP56byA7KQoKNzEbLgABABUAAAHIAfQAHQAAEyY0NyEXBwYHFzY7ATY3FxYUByEnNzY3JwYrAQYHKgsBAZUKwxsgBR00Nw8STQsB/lkKxBsgBR00Jw8RAWYySRNU+SQaCwkkEQoyTBRS/CQaCwkiEAAAAQAC/y8BngLYAC0AADc1MjY1NCY1NDYzMhcHBiMiFRQWFRQGBxUeARUUBhUUMzIfAQYjIiY1NDY1NCYCSlQSUjtXLAodMiYOQy0tQw4mMh0KLFc7UhJU02E1NRhtGUtRHFAMTBtTFDxHBwgHSDwUUxtMDFAcUUsZbRg1NQAAAQBB/zgApgLQAAcAABMRByY1ETcWpkIjQiMCcvzQCiM7AzAKIgABABD/LwGsAtgALQAAARUiBhUUFhUUBiMiJzc2MzI1NCY1NDY3NS4BNTQ2NTQjIi8BNjMyFhUUBhUUFgGsSlQSUjtXLAodMiYOQy0tQw4mMh0KLFc7UhJUATRhNTUYbRlLURxQDEwbUxQ8SAcIB0c8FFMbTAxQHFFLGW0YNTUAAAEAHgDKAj0BYgAUAAASNjIWMjY/ARcOAiImIyIPASc+AWk2RnZOQxERLwgeYFd6IDwwECwGJAFSEC0TCgpDCRosLRkJQgkeAAIAOwAAANoCvAAJAA0AADc0NzMWFRQHIyYSFCI0PSFaIAeOBp2fqLuFgrJUYFkCY5SUAAABABr/TwGxAqYAKwAABRQVIyY1NDcuATQ2NyY1NDczFBUUBxYXFhUUByMmJyYjIgYUFjMyNxcGBxYBQHgBGGtaZ1IZAXgYUjsBGlgOAwwUMykyMEc+IDRVGKAICQ0MR0oEc/59DVBJCwoICU1NAyAKCTkzGSMBUZ9DFE0hDU4AAAEAJAAAAfgCugAoAAABIxUzNjcXFSEnNjc1Iyc2NzU0Nz4BMzIXFhUUByMmJyYjIgYdATMXBgEVKp4NGEr+NgoNKiwKEyNLJUsxYkABGlgOAwwUMyl6Ch4BR9o0FgmuUxEQ00AVCSmSMBgSJAoJOTMZIwE5RypAIwAAAgAmAEACUgJwACUALQAANyY0Nyc3MjMyHwE2Mhc3FxQVFA8BFhQHFwciIyIvAQYiJwcnJj8BFBYzMhAjImscH0gjAwMoJBM6rDVGMyQSHiFJIwEBKiYTOq82RDMCJlZQPpCRjcg3qzdIMiQTIx1GIwMDKCQSNq85SDMlEiQhRCMsJqRWTgFBAAEAGQAAAlYCsgAwAAAlIxUWFwcjJzY3NSMnNjsBNSMnNjsBJyYnNzMXFh8BMzY/ATMXBg8BMxcGKwEVMxcGAcNCKA8K6goNKpIKHztCkgofOxRkMxMKmUwjCgQPCiZMiAoSNmFmCh48QpIKHpsnEBFTUxEQJzQjMDQjvw8YU6JPJQ83TKJTGBC+NCMwNCMAAAIAQf84AKYC0AAFAAsAABcRMxEHJhMVIxE3FkFlQiNlZUIjagEH/qUKIwMX9gFKCiIAAgAt//gBvQK6AC4APQAAEyIVFB8BFhUUBxYUBiInJjU0NzMWFxYzMjU0Ji8BLgE0NyY0NjIXFhUUByMmJyYTNCcmJwYVFB4CFxYXNvBCRU96ODlp5j8BFlMOAxUkWBgjTz1EP0Bqx0IBFlINBBwsHBs4GhIMFgggDCECZiUiERQeZkorI41ZHgoKNCkbFAUvDxQJFRA/giYni04bCgkxKRUYB/76DQsLExMhDAwHCAMKBBQAAgBPAnAB4gMHAAYADQAAEzQyFCMiJjc0MhQjIiZPo1IoKfCjUigpArtMlyIpTJciAAADACX/+ALZAroAFwAgACkAAAEUByMmJyYjIhUUFjMyNxcGIiY0NjIXFAU0NiAWEAYjIDYWMzIQIyIHBgIUEkgMAhEYSSQlPzsZRLRSY6BF/hG0AViotqz+rmiHavP0aEFHAfMtJBEeCH1GOhQ3J1vPYiUDnbGwqP6fudiAAhI0OAAAAgAfATsBiAK+ACIAKQAAEzQ3PgEzMhYdARYXFQYjJicGIiY1NDYzMjM1NCYiBwYHIyYXFDI3NSIGMgEcWilJRBwNK0cPDCpwQltqCQkZORMDCkIQWkkhRSUChgkJEBY2RacGBj0YBRIXNTRCLiIiGgYdEh+xIxE2DQACABgAJgH4AckADAAZAAABFw4BBxYXBy4BJz4BJxcOAQcWFwcuASc+AQHJLwk5I08WLymAIiKAvS8JOSNPFi8pgCIigAHJIyBjLGJMIxGFOzuFEiMgYyxiTCMRhTs7hQABABcAjwI3AfQADQAAASEiJi8BNyERFAYPAScB1P6dGy0JCQoCFhEJCUABkREJCUD+9RotCgkKAAEALgDcAXgBPwAHAAAlIyc2OwEXBgEe5gofO+YKHtxAI0AjAAQAJf/4AtkCugAcACQALQA2AAABMhYUBxUWHwEWFwcjJyYrARUWFwcjJzY3NSYnNxcjFTMyNjU0BTQ2IBYQBiMgNhYzMhAjIgcGAXNRUUoWCiQWDwVqQgkJGSQOBakGChUXCAaTFxYhIP52tAFYqLas/q5oh2rz9GhBRwIZMH0gBQsSRAUPLoQRTwcQLzAKCPAKCTBBXRQYMX+xsKj+n7nYgAISNDgAAAEAKAJJAX4CqAAHAAABIyc2OwEXBgEk8gofO/IKHgJJPCM8IwAAAgAeAaEBWQLBAAgADAAAEzQzMhYUBiImNiIUMh6cSVZWkVTmkpICMJFGlUVFl5YAAgAjAAAB7gIDABMAGwAAARUzFwYrARUHJj0BIyc2OwE1NxYTISc2MyEXBgE8qAoePFhGI6YKHztWRiNY/pkKHzsBZwoeAakzPiOBCh87MT4jgwoe/hs+Iz4jAAABACIBRwFqAsEAJQAAEzQiBwYHJyY1NDc+ATMyFRQPAQYHFzY7ATY3FxYUByEnNz4BNzbsThAEDzkTARpfJ48zXxAaAx4ZLgsJQAsF/tEUoQUVBQoCWRsGHxMEHy0ICBAVZSwsVA4LBgYfDQUmOxZRjQUSBgoAAQAiATsBXALBACUAABM0IwcGBycmNTQ3NjMyFRQGBxUeARUUBiInNxYzMjU0IwcnNz4B3y4mAgs9FwE/VY0dGB0oZKcvFjMyUkxLCEYfKgJRJgUXFQEsKAgIFlwZLQsFBy8nOzwZRA4uKwM+BQIXAAEAuAI5AXsDHAAHAAATJz4BNxcOAe42BjgdaA5WAjkfLHsdQChhAAABABj/KgJPAgEAKwAAFzQ3Jj0BJic3NjIXERQWMzI3ESYnNzYyFxEWFxUGIyYnDgEiJxYUBwYiJzRYFyAjFAo4YCEjJzwrIxQKOGAhIxQ8XBkCF1JLGxABGlYUs3NqK3G/DBZNDQP+uzYlJgEBDBZNDQP+fAcKUSASIBQeBGNUDQ4OCgACABv/MAIqArIAFgAhAAAXFjI2NREzFwYHERQGIyImJzQ1NDczFhMzESMiJjU0Nz4BuCVjJ7kKECeAZTx6IRlYC1gpQ2trRSNQZQ04MwK5UxMP/cp1YhoVBwcyNBUC9P5dXnCCLBYRAAEAKQDIANABXwADAAA2NDIUKafIl5cAAAEAHv8nAMMABwAQAAAXNDczBhUWFRQHJz4BNCYnJi4RTwxBlRAhGhgSATYgHRUVB0VfCzYMFCYUAQkAAAEAKQFHANkCvgAPAAATMhcRFhcHIyc2NzUmJzU2ng4PFwcFowgOGxsNOAK9Af7gCg0+PhALuwUHPxcAAAIAHwE7AYgCvgAHAA4AABImNDYyFhQGJxQyNCMiBnVWYLNWYZuQSiQiATtewGVawGnEeOo0AAIAIgAmAgIByQAMABkAABM3HgEXDgEHJzY3LgE/AR4BFw4BByc2Ny4BIi8pgCIigCkvFk8jOd0vKYAiIoApLxZPIzkBpiMShTs7hREjTGIsYyAjEoU7O4URI0xiLGMAAAMAG//pArQC0AAJACcANwAAFyY0NwEXFhQHASUzNTQ3FxUzFSMVFhcHIyc2NzUjJzc2NxcHBgcXNgE2MzIXERYXByMnNjc1JieCBRMBSj8FE/62ATM1IUwcHBQKCKUJDh3KE0YhMzQ9CBIDFv4/NlAQDhsOCKsIDhsiGQEPMSMCbhYQMCT9k8Q1OjEHmUoPCA4+PBIGDy+IQBwighQSBgcB+RgC/uQLED4+EAu7BAgAAwAa/+kC5ALQACMALQA9AAABBgcnJjU0Nz4BMzIVFA8BBgcXNzM2NxcWFAchJzc2NzY1NCIBJjQ3ARcWFAcBAzYzMhcRFhcHIyc2NzUmJwIIBA85EwEaXyePM18QGgM3LgsJQAsF/tEUoQUSEk7+awUTAUo/BRP+tqg2UBAOGw4IqwgOGyIZAScfEwQfLQgIEBVlLCxUDgsGBh8NBSY7FlGNBQ8QEBv+0g8xIwJuFhAwJP2TAr0YAv7kCxA+PhALuwQIAAMAGv/pAvgC0AAJACcAUwAAFyY0NwEXFhQHASUzNTQ3FxUzFSMVFhcHIyc2NzUjJzc2NxcHBgcXNgEiByc3PgE1NCMiBwYHJyY1NDc2MzIVFAYHFR4BHQEUBgcGIyInNxYzMjU0ygUTAUo/BRP+tgEvNSFMHBwUCgilCQ4dyhNGITM0PQgSAxb+exU2CEYfKi4UEgILPRcBP1WNHRgdKCcgNzhVLxYzMlIBDzEjAm4WEDAk/ZPENToxB5lKDwgOPjwSBg8viEAcIoIUEgYHATYDPgUCFxUmBRcVASwoCAgWXBktCwUHLycBJTMLExlEDi4rAAACABn/+AH5AroAIQAlAAABFhQOAxUUMzI3NjczHgEUFQ4BIyImNTQ+Ajc2NTQnNhQiNAFrChA9QTJmKiYDEF8NDit9Om+OIzM7GTUBkKcB8SEqLj0qPiNLEDQfGlEiBh0gZV4pRSssEiQyBAXJl5cAA//6AAACiAPMAAcAGwAkAAABBy4BJzceARcTFhcHIyc2NycjBxYXByMnNjcTFxQPATMnJi8BAXs2Kk4OaB0xEccqEQrqCgwkG8gZIxEK5AoSMcA2GSePJhcDAQMTHxpXJ0AdcIj9vw8UU1MQDlRRDhNTUxcPAj6MPVF8ekY5EQAD//oAAAKIA8wACAAcACUAAAE+ATcXDgEHJhcTFhcHIyc2NycjBxYXByMnNjcTFxQPATMnJi8BAQcGMR1oDk4qNn/HKhEK6goMJBvIGSMRCuQKEjHANhknjyYXAwEDEyxwHUAnVxodWv2/DxRTUxAOVFEOE1NTFw8CPow9UXx6RjkRAAAD//oAAAKIA8sACwAfACgAAAEHJicGByc+ATceAQcTFhcHIyc2NycjBxYXByMnNjcTFxQPATMnJi8BAeYkLk5OLiQNZi0tZlPHKhEK6goMJBvIGSMRCuQKEjHANhknjyYXAwEDHSkNQ0MNKSNtHh5tif2/DxRTUxAOVFEOE1NTFw8CPow9UXx6RjkRAAP/+gAAAogDhQAUACgAMQAAEjYyFjMyPwEXDgEHBiImIyIPASc2BRMWFwcjJzY3JyMHFhcHIyc2NxMXFA8BMycmLwGLP0JcHjgkDCgEIw8qSl8ZLyELJgUBDscqEQrqCgwkG8gZIxEK5AoSMcA2GSePJhcDAQNhJBwVBz8GHgkYHBQHQgeU/b8PFFNTEA5UUQ4TU1MXDwI+jD1RfHpGOREAAAT/+gAAAogDfgAGAA0AIQAqAAATNDIUIyImNzQyFCMiJhcTFhcHIyc2NycjBxYXByMnNjcTFxQPATMnJi8BfqNSKCnwo1IoKRjHKhEK6goMJBvIGSMRCuQKEjHANhknjyYXAwEDMkyXIilMlyJS/b8PFFNTEA5UUQ4TU1MXDwI+jD1RfHpGOREAAAT/+gAAAogDtwAIAA4AIgArAAAAJjQ2MzIVFCMnFDI1NCIXExYXByMnNjcnIwcWFwcjJzY3ExcUDwEzJyYvAQEGP0A6fX05dXV+xyoRCuoKDCQbyBkjEQrkChIxwDYZJ48mFwMBAuAwdjFtamszMzXJ/b8PFFNTEA5UUQ4TU1MXDwI+jD1RfHpGOREAAv/uAAADaQKyACQAKgAAARUHJicjFTM2NxcVByYnIxUzNjcXFSEnNjc1IwcWFwcjJzY3ARMRIwYPAQNhShcOnIsJED8/DwqLpA0YSv4wCg0qzj8gDQrkChAtAWM4CRIrTgKyrgkUNrAcDgewCAwevTQWCa5TERBobA4PU1MUEAI7/o0BCTtJhQAAAQAe/ycCJQK6ACcAAAUmNDcuARA2MzIXHAEGByMmJyYiBhAWMzI3FwYHBhUWFRQHJz4BNCYBBQEJfXKdjnJnDg1fDgYeeEpHRmtVJFdwBkGVECEaGEgIIBkHowFnsD8GIlIaGzoNaP78bSBZNAgPDwdFXws2DBQmFAACACAAAAH6A8wABwAlAAABBy4BJzceARMhJzY3ESYnNyEVByYnIxUzNjcXFQcmJyMVMzY3FwFUNipODmgdMaz+MAoNKikOCgHIShcOnIsMDT8/DQyLpA0YSgMTHxpXJ0AdcPzBUxEQAckPE1OuCRQ2rB4MB7IICiC/NBYJAAACACAAAAH6A8wABwAlAAABJz4BNxcOARMhJzY3ESYnNyEVByYnIxUzNjcXFQcmJyMVMzY3FwEKNgYxHWgOTsb+MAoNKikOCgHIShcOnIsMDT8/DQyLpA0YSgL0HyxwHUAnV/zyUxEQAckPE1OuCRQ2rB4MB7IICiC/NBYJAAACACAAAAH6A8sACwApAAABByYnBgcnPgE3HgETISc2NxEmJzchFQcmJyMVMzY3FxUHJicjFTM2NxcBuCQuTk4uJA1mLS1mT/4wCg0qKQ4KAchKFw6ciwwNPz8NDIukDRhKAx0pDUNDDSkjbR4ebfzAUxEQAckPE1OuCRQ2rB4MB7IICiC/NBYJAAADACAAAAH6A34ABgANACsAABM0MhQjIiY3NDIUIyImEyEnNjcRJic3IRUHJicjFTM2NxcVByYnIxUzNjcXSqNSKCnwo1IoKcD+MAoNKikOCgHIShcOnIsMDT8/DQyLpA0YSgMyTJciKUyXIvz3UxEQAckPE1OuCRQ2rB4MB7IICiC/NBYJAAIAIAAAAR4DzAAHABcAABMHLgEnNx4BHwEGBxEWFwcjJzY3ESYnN+s2Kk4OaB0xLwoQJygPCuoKDSopDgoDEx8aVydAHXCNUxMP/jcQEVNTERAByQ8TUwACACAAAAEkA8wABwAXAAATJz4BNxcOAR8BBgcRFhcHIyc2NxEmJzeeNgYxHWgOTkwKECcoDwrqCg0qKQ4KAvQfLHAdQCdXXFMTD/43EBFTUxEQAckPE1MAAgABAAABQQPLAAsAGwAAAQcmJwYHJz4BNx4BBxcGBxEWFwcjJzY3ESYnNwFBJC5OTi4kDWYtLWYgChAnKA8K6goNKikOCgMdKQ1DQw0pI20eHm2OUxMP/jcQEVNTERAByQ8TUwAAA//lAAABZAN+AAYADQAdAAADNDIUIyImNzQyFCMiJh8BBgcRFhcHIyc2NxEmJzcbo1IoKdyjUigpUwoQJygPCuoKDSopDgoDMkyXIilMlyJXUxMP/jcQEVNTERAByQ8TUwACAA0AAAJ3ArIAEgAgAAAhIyc2NzUjJzYzNSYnNzMyFhAGJzMyNjU0KwEVMxcGKwEBOf8KDSpQCh87KQ4K36G9q9VIS1e9LZYKHjxGUxEQyEAjng8TU7T+o6FtW4P6pkAjAAIAHgAAAo0DhQAUADkAABI2MhYzMj8BFw4BBwYiJiMiDwEnNhMRFhcHIyc2NxEmJzczExYfATcmNREmJzczFwYHESMDJi8BBxabP0JcHjgkDCgEIw8qSl8ZLyELJgU5JRIKxAoSJSkQCs7HFhUHCw4kEwrEChMknckWFQcLDgNhJBwVBz8GHgkYHBQHQgf+Lv75DhdNTRcOAc4PFk3+fCpGGARXOwEDDhhNTRgO/cEBhypHFwRXAAADAB7/+AJlA8wABwAPABgAAAEHLgEnNx4BAiYQNiAWEAYAEBYyNjU0IyIBhjYqTg5oHTHVjZsBH42e/u1MhUqQQwMTHxpXJ0AdcPy5pAFvr5z+krgB6f7+dm+B8AAAAwAe//gCZQPMAAcADwAYAAABJz4BNxcOAQImEDYgFhAGABAWMjY1NCMiASw2BjEdaA5Oq42bAR+Nnv7tTIVKkEMC9B8scB1AJ1f86qQBb6+c/pK4Aen+/nZvgfAAAAMAHv/4AmUDywALABMAHAAAAQcmJwYHJz4BNx4BACYQNiAWEAYAEBYyNjU0IyIB4iQuTk4uJA1mLS1m/taNmwEfjZ7+7UyFSpBDAx0pDUNDDSkjbR4ebfy4pAFvr5z+krgB6f7+dm+B8AADAB7/+AJlA4UAFAAcACUAABI2MhYzMj8BFw4BBwYiJiMiDwEnNhImEDYgFhAGABAWMjY1NCMiij9DWh45JAwoBCMQKUpfGS8gDCYFNI2bAR+Nnv7tTIVKkEMDYSQcFQc/Bh4JGBwUB0IH/K2kAW+vnP6SuAHp/v52b4HwAAAEAB7/+AJlA34ABgANABUAHgAAEzQyFCMiJjc0MhQjIiYCJhA2IBYQBgAQFjI2NTQjIoCjUigp8KNSKCnFjZsBH42e/u1MhUqQQwMyTJciKUyXIvzvpAFvr5z+krgB6f7+dm+B8AABABoAJwIGAhMAGQAAJSIvAQcnJj8BJzcyMzIfATcXFBUUDwEXByIB3S0neq82Ail4ryUDAysneLA2J3mxJQI3J3mwJS8pea82J3iwJQMDKyd5sDYAAAP//P/4ApoCugAVAB0AJQAAExAhMhc3FxQPARYVFAYgJwcnNj8BJiU0JwcWMzI2JxQXNyYjIgY2ARuWPVMjKycZkv7fP08kASolFgGVA+kdT0I+/wLnHU9BPAFXAWNSUBgxKiVNb7a2W00YMikkSHQoIeJXbIsbKuFNZQACABD/+AJqA8wABwAjAAABBy4BJzceARIGICY1ESYnNzMXBgcRFBYyNjURJic3MxcGBxEBgDYqTg5oHTG5d/72ayYRCuoKECcvejIpDgrbChAnAxMfGlcnQB1w/Th/fYUBQw4UU1MTD/65SEVHRgFHDxNTUxMP/r0AAAIAEP/4AmoDzAAIACQAABM+ATcXDgEHJgAGICY1ESYnNzMXBgcRFBYyNjURJic3MxcGBxH+BjEdaA5OKjYBNXf+9msmEQrqChAnL3oyKQ4K2woQJwMTLHAdQCdXGh39Zn99hQFDDhRTUxMP/rlIRUdGAUcPE1NTEw/+vQACABD/+AJqA8sACwAnAAABByYnBgcnPgE3HgESBiAmNREmJzczFwYHERQWMjY1ESYnNzMXBgcRAeIkLk5OLiQNZi0tZl53/vZrJhEK6goQJy96MikOCtsKECcDHSkNQ0MNKSNtHh5t/Td/fYUBQw4UU1MTD/65SEVHRgFHDxNTUxMP/r0AAAMAEP/4AmoDfgAGAA0AKQAAEzQyFCMiJjc0MhQjIiYSBiAmNREmJzczFwYHERQWMjY1ESYnNzMXBgcRe6NSKCnwo1IoKch3/vZrJhEK6goQJy96MikOCtsKECcDMkyXIilMlyL9bn99hQFDDhRTUxMP/rlIRUdGAUcPE1NTEw/+vQAC//wAAAJPA8wABwAqAAABJz4BNxcOARMjJzY3NQMmJzc1NzMXBgcXFh8BMzY/ASYnNzMXBgcDFRYXASA2BjEdaA5OUuoKDSqjLxEJAeoKDCIiHRUHDxUiICgOCuQKFC6eKA8C9B8scB1AJ1f88lMREHMBUxAVTgEEUxENTUJBFElOSRASU1MXD/6ucxARAAACACAAAAJHArIAFwAhAAATMzIWFRQhIxUWFwchJzY3ESYnNyEXBgcXIxUzMjY1NCcm52SBe/76WkkSCv7yCg0qKQ4KAQ4KE0g8PENFQisiAhhUZ78kEBdTUxEQAckPE1NTGBCEsCc1NxANAAABAA7/9wI3AtgAKAAAMyMnNjcRNDYyFhUUBwYUHgIVFAYjIic3FjI2NC4CND4CNCYiBhXRuQoOKVrDfEIXOEI4Zlg+Ng8fVCw3QTcfJB8tSCBNEw8BmGhpVkg7Vx4gMTBQKkhPCGIJGS40KEM+NSc7OSUqNwAAAwAV//gB9gMcAB8AKAAwAAATNDc2MhYdARYXFQYjJicGIyImNDY7ATU0IyIHBgcjJhMyNzUjIhUUFhMHLgEnNx4BLgFd1l0jFDNfCgcrcUNfWVhtUx8UAgpiEbQzHkZIH3U2KVYOaB04AaoPETJRXtUHClcYGiU/ToZNME4GKhcj/useUjcZIAH6HxphKEAdewADABX/+AH2AxwAHwAoADAAABM0NzYyFh0BFhcVBiMmJwYjIiY0NjsBNTQjIgcGByMmEzI3NSMiFRQWEyc+ATcXDgEuAV3WXSMUM18KBytxQ19ZWG1THxQCCmIRtDMeRkgfGzYGOB1oDlYBqg8RMlFe1QcKVxgaJT9Ohk0wTgYqFyP+6x5SNxkgAdsfLHsdQChhAAMAFf/4AfYDEAAfACgANAAAEzQ3NjIWHQEWFxUGIyYnBiMiJjQ2OwE1NCMiBwYHIyYTMjc1IyIVFBYTByYnBgcnPgE3HgEuAV3WXSMUM18KBytxQ19ZWG1THxQCCmIRtDMeRkgf5yQuTk4uJA1mLS1mAaoPETJRXtUHClcYGiU/ToZNME4GKhcj/useUjcZIAIEKQ1DQw0pI20eHm0AAwAV//gB9gLKAB8AKAA9AAATNDc2MhYdARYXFQYjJicGIyImNDY7ATU0IyIHBgcjJhMyNzUjIhUUFgI2MhYzMj8BFw4BBwYiJiMiDwEnNi4BXdZdIxQzXwoHK3FDX1lYbVMfFAIKYhG0Mx5GSB+AP0NaHjkkDCgEIxApSl8ZKyQMJgUBqg8RMlFe1QcKVxgaJT9Ohk0wTgYqFyP+6x5SNxkgAkgkHBUHPwYeCRgcFAdCBwAABAAV//gB9gMHAB8AKAAvADYAABM0NzYyFh0BFhcVBiMmJwYjIiY0NjsBNTQjIgcGByMmEzI3NSMiFRQWAzQyFCMiJjc0MhQjIiYuAV3WXSMUM18KBytxQ19ZWG1THxQCCmIRtDMeRkgflaNSKCnwo1IoKQGqDxEyUV7VBwpXGBolP06GTTBOBioXI/7rHlI3GSACXUyXIilMlyIABAAV//gB9gMcAB8AKAAxADcAABM0NzYyFh0BFhcVBiMmJwYjIiY0NjsBNTQjIgcGByMmEzI3NSMiFRQWAiY0NjMyFRQjJxQyNTQiLgFd1l0jFDNfCgcrcUNfWVhtUx8UAgpiEbQzHkZIHwQ/QDp9fTl1dQGqDxEyUV7VBwpXGBolP06GTTBOBioXI/7rHlI3GSAB5zB2MW1qazMzNQADABb/+ALjAfwALAA1ADoAABM0Nz4BMzIXNjIWHQEUBisBFjMyNxcGIicGIyImNTQ2MzIzNTQmIyIHBgcjJhcUMjc1IiMiBiUiBzc0LwEneDVhLjy3XRcT9AlgTUIiUeM6THZBWHiRCgsmLRkbAw5YFXdkKggITDIBflAMkQGzCwwVHSoqW38YFRl5Gkk8OjpHRVc3FkEuCCUaKuwvF0oT6WcJXgAAAQAa/ycBsQH8ACgAAAEiFRQWMzI3FwYHBhUWFRQHJz4BNCYnJjQ3JjU0NzYyFxYVFAcjJicmAQZcMzBMOh49YQVBlRAhGhgSAgyrS0PAQAEaWA4DDAGWnlA/Dk0mChEMB0VfCzYMFCYUAQkiGRjekkA4JAoJOTMZIwEAAAMAGf/4AcoDHAAYAB8AJwAABSImNTQ2NzYyFhUUKwEeATMyNj8BFw4CEzY0JiIGBxMHLgEnNx4BAQp4eSokRrpjR9kEOT4iPg4OHgYXXQQCIE8qB5c2KVYOaB04CIB6SmsdOF97SD80EAgIUAcVIwE7DigtMDkBKx8aYShAHXsAAwAZ//gBygMcABgAHwAnAAAFIiY1NDY3NjIWFRQrAR4BMzI2PwEXDgITNjQmIgYHEyc+ATcXDgEBCnh5KiRGumNH2QQ5PiI+Dg4eBhddBAIgTyoHYDYGOB1oDlYIgHpKax04X3tIPzQQCAhQBxUjATsOKC0wOQEMHyx7HUAoYQADABn/+AHKAxAAGAAfACsAAAUiJjU0Njc2MhYVFCsBHgEzMjY/ARcOAhM2NCYiBgcTByYnBgcnPgE3HgEBCnh5KiRGumNH2QQ5PiI+Dg4eBhddBAIgTyoH8SQuTk4uJA1mLS1mCIB6SmsdOF97SD80EAgIUAcVIwE7DigtMDkBNSkNQ0MNKSNtHh5tAAQAGf/4AcoDBwAYAB8AJgAtAAAFIiY1NDY3NjIWFRQrAR4BMzI2PwEXDgITNjQmIgYHAzQyFCMiJjc0MhQjIiYBCnh5KiRGumNH2QQ5PiI+Dg4eBhddBAIgTyoHe6NSKCnSo1IoKQiAekprHThfe0g/NBAICFAHFSMBOw4oLTA5AY5MlyIpTJciAAIAFgAAARYDHAAOABYAABM2MhcRFhcHIyc2NxEmJzcHLgEnNx4BJjhgIScQCuYKDikjFL02KVYOaB04AfQNA/5xDxNNTRMPARYMFrEfGmEoQB17AAIAHAAAARYDHAAHABYAABMnPgE3Fw4BBzYyFxEWFwcjJzY3ESYnczYGOB1oDlZ2OGAhJxAK5goOKSMUAjkfLHsdQChhXw0D/nEPE01NEw8BFgwWAAL/8wAAATMDEAAOABoAABM2MhcRFhcHIyc2NxEmJyUHJicGByc+ATceASY4YCEnEArmCg4pIxQBFyQuTk4uJA1mLS1mAfQNA/5xDxNNTRMPARYMFrspDUNDDSkjbR4ebQAAA//lAAABPgMDAAYACgAZAAADNDIUIyImFjQyFAU2MhcRFhcHIyc2NxEmJxubTiYnvpv+6DhgIScQCuYKDikjFAK7SI8gII+PgA0D/nEPE01NEw8BFgwWAAIAG//4AfEC2AAcACcAAAEUBiMiJjQ2MzIXJicHJzY/ASYnNxYXNxcGDwEWBzQnJiMiFRQWMjYB8XhqfnZ1XTYuDRksNgIdDwYrQyElMTYBHg1nkAIlO1QqZyUBHoKka+eAETMpJyQgGQ0HJVQUHiwkHxoMgsMTIBGBRUpkAAIAGgAAAkoCygAiADcAABM2MhcVPgEzMhYdARYXByMnNjc1NCYiBxEWFwcjJzY3ESYnEjYyFjMyPwEXDgEHBiImIyIPASc2JDdYHRlTJmJPJxAK5goOKSNaLScQCuYKDikjFE8/QlweOCQMKAQjDypKXxkrJQsmBQH0DAIyFRtcccAPE01NEw/GNiUg/v8PE01NEw8BFgwWAP8kHBUHPwYeCRgcFAdCBwAAAwAZ//gB+QMcAAcAEQAZAAAWJhA2MhYUBgMUMzI2NTQjIgYTBy4BJzceAYtyf+5zgc9gMS9iMC6cNilWDmgdOAh+AP+HeP+NAQagSVOcRQEHHxphKEAdewAAAwAZ//gB+QMcAAcAEQAaAAAWJhA2MhYUBgMUMzI2NTQjIgYTPgE3Fw4BByaLcn/uc4HPYDEvYjAuLwY4HWgOVik2CH4A/4d4/40BBqBJU5xFAQcsex1AKGEaHQADABn/+AH5AxAABwARAB0AABYmEDYyFhQGAxQzMjY1NCMiBgEHJicGByc+ATceAYtyf+5zgc9gMS9iMC4BACQuTk4uJA1mLS1mCH4A/4d4/40BBqBJU5xFAREpDUNDDSkjbR4ebQADABn/+AH5AsoABwARACYAABYmEDYyFhQGAxQzMjY1NCMiBgI2MhYzMj8BFw4BBwYiJiMiDwEnNotyf+5zgc9gMS9iMC5bP0NaHjkkDCgEIxApSl8ZKyQMJgUIfgD/h3j/jQEGoElTnEUBVSQcFQc/Bh4JGBwUB0IHAAQAGf/4AfkDBwAHABEAGAAfAAAWJhA2MhYUBgMUMzI2NTQjIgYDNDIUIyImNzQyFCMiJotyf+5zgc9gMS9iMC5oo1IoKfCjUigpCH4A/4d4/40BBqBJU5xFAWpMlyIpTJciAAADABkADgHkAe8ABwAPABcAACUhJzYzIRcGBTQyFRQGIiYRNDIVFCMiJgGK/pkKHzsBZwoe/uubKEwnm04mJ9A6IzojekhIJyEhAXdJSUcgAAP/+//RAjkCJQAVABwAIwAANzQ2Mhc3FxQPARYVFAYiJwcnNj8BJiU0JwcWMjYnFBc3JiIGKn/eOFcjKx8bgds5ViQBKiAcAVACoxdfL8ABpBhfLvh9hyxVGDEqHjlZfY0tVBgyKR84Xw8YnyRJVx0MnyJFAAACAAr/+AI9AxwAHgAmAAAlBiImPQEmJzc2MhcRFBYyNxEmJzc2MhcRFhcVBiMmAwcuASc3HgEBi0W7SiMUCjhgISFiKiMUCjhgISMUPFsZMjYpVg5oHTgqMk5Y5wwWTQ0D/sE2IyAA/wwWTQ0D/noHCk8gEgJOHxphKEAdewACAAr/+AI9AxwAHgAmAAAlBiImPQEmJzc2MhcRFBYyNxEmJzc2MhcRFhcVBiMmAyc+ATcXDgEBi0W7SiMUCjhgISFiKiMUCjhgISMUPFsZhjYGOB1oDlYqMk5Y5wwWTQ0D/sE2IyAA/wwWTQ0D/noHCk8gEgIvHyx7HUAoYQACAAr/+AI9AxAAHgAqAAAlBiImPQEmJzc2MhcRFBYyNxEmJzc2MhcRFhcVBiMmEwcmJwYHJz4BNx4BAYtFu0ojFAo4YCEhYiojFAo4YCEjFDxbGTkkLk5OLiQNZi0tZioyTljnDBZNDQP+wTYjIAD/DBZNDQP+egcKTyASAlgpDUNDDSkjbR4ebQADAAr/+AI9AwcAHgAlACwAACUGIiY9ASYnNzYyFxEUFjI3ESYnNzYyFxEWFxUGIyYBNDIUIyImNzQyFCMiJgGLRbtKIxQKOGAhIWIqIxQKOGAhIxQ8Wxn+vKNSKCnwo1IoKSoyTljnDBZNDQP+wTYjIAD/DBZNDQP+egcKTyASArFMlyIpTJciAAAC//7/MAI6AxwAJwAvAAAXMjY3AyYnNzMXBgcXFh8BMzY/ASYnNzMXBgcDBgcGIicmNTQ3MxYXEyc+ATcXDgGhEikIpDERCuYKDR83EgcDDggUNSUPCtwKEjClLxksnSkBF1MPAoA2BjgdaA5WdEMuAYQQFk1NEA2XLy4OMjeUDhRNTRcQ/npvIDspCgo3MRsuAq0fLHsdQChhAAAC//v/OAH+AtMAGQAjAAATNjIXFT4BMzIWEAYjIicVFhcHIyc2NxEmJwEyNTQmIyIHERYFOGAhF0UbbluJZTAiOxEK+woNKiMUARNgISk7KyQCxg0D+hAWcP7qfglXEBVNTRIQArAMFv3loVZBJv73CQAD//7/MAI6AwcAJwAuADUAABcyNjcDJic3MxcGBxcWHwEzNj8BJic3MxcGBwMGBwYiJyY1NDczFhcDNDIUIyImNzQyFCMiJqESKQikMREK5goNHzcSBwMOCBQ1JQ8K3AoSMKUvGSydKQEXUw8CN6NSKCnwo1IoKXRDLgGEEBZNTRANly8uDjI3lA4UTU0XEP56byA7KQoKNzEbLgMvTJciKUyXIgAAAQAcAAABFgIBAA4AABM2MhcRFhcHIyc2NxEmJyY4YCEnEArmCg4pIxQB9A0D/nEPE01NEw8BFgwWAAH//QAAAfYCsgAfAAA3MzY3FxUhJzY3NQcnPgE/ATUmJzczFwYHFTcXDgEPAemeDRhK/jYKDSpFFwYvGA8pDgrqChAnhBYGLRlObTQWCa5TERCyGSUPKQkFxQ8TU1MTD5IvJRAnCRwAAf/wAAABNwLTABwAABM2MhcRNxcOAQ8BFRYXByMnNjc1Byc+AT8BNSYnIThgIUcWBi0ZEScQCuYKDilHFwYvGBEjFALGDQP+5hklECcJBvUPE01NEw/EGSUPKggF0gwWAAACAB//+ANGAroAHwAnAAApAQYjIiY1ECEyFyEVByYnIxUzNjcXFQcmJyMVMzY3FwAQFjI3ESYiA0b+TDMzjIEBGzgqAaJKFw6aiQwNPz8NDImiDRhK/W9AfjQzgwiivQFjCK4JFDasHgwHsggKIL80FgkBNv74cwwBwRMAAwAZ//gDGAH8ABwAJQArAAAFIiYnDgEjIiYQNjIXNjMyFh0BFAYrARYzMjcXBgEUMzI2NCYiBiUiBzc0JgJSOV0TFFw3d3J/+Ckxc15dFxP0CWBNQiJR/eZgLzEzXy4BsE4OkRgIIR8fIX4A/4dCQlt/GBUZeRpJPAEGoEepSEVFXwktKQACAB//+AIFA7wACwA4AAABFw4BBy4BJzcWFzYDJiIGFBYfAR4BFRQGIyImJzwBNjczFhcWMjY1NC4BLwEmNTQ2MhccAQYHIyYBiSQNZi0tZg0kMUtLBCJKLSIyWUhVk208fyoODV8QAyNdPAYfHWedhNVmDg1fEQO8KSNtHh5tIykQQED+mQklQyYOGhVZVmZ2HxwGIlIaHzQPLCkTGR0JHi2bW20wBiJSGhgAAgAf//gBrgMRACgANAAAEyIVFB8BFhUUBiInJjU0NzMWFxYzMjU0Ji8BLgE0NjIXFhUUByMmJyYTFw4BBy4BJzcWFzbiQkVPemnlQAEWUw0EFCVYGCNPPURqxUQBFlINBBxXJA1mLS1mDSQxS0sBoiclEhUgbUtfIAsLNywYGgYyEBUKFxFDg1QdCgo0LBcZBwFvKSNtHh5tIykQQEAAAAP//AAAAk8DfgAGAA0AMAAAEzQyFCMiJjc0MhQjIiYTIyc2NzUDJic3NTczFwYHFxYfATM2PwEmJzczFwYHAxUWF2GjUigp8KNSKClL6goNKqMvEQkB6goMIiIdFQcPFSIgKA4K5AoULp4oDwMyTJciKUyXIvz3UxEQcwFTEBVOAQRTEQ1NQkEUSU5JEBJTUxcP/q5zEBEAAgAPAAACJAO8AAsALQAAARcOAQcuASc3Fhc2AyMGBycmNTQ3IRcBBg8BFzY7ATY3FxYVFAchJwE2PwEnBgGnJA1mLS1mDSQxS0tpXQcSXxYHAecK/t4bHQsFLjR6BxJfFgf9/AoBIhseCgUuA7wpI20eHm0jKRBAQP6iNx8GJlAiHE/+TSoYCAsJNx8GJlAiHE8BsyoYCAsJAAIAFQAAAcgDEQAdACkAABMmNDchFwcGBxc2OwE2NxcWFAchJzc2NycGKwEGBxMXDgEHLgEnNxYXNioLAQGVCsMbIAUdNDcPEk0LAf5ZCsQbIAUdNCcPEfMkDWYtLWYNJDFLSwFmMkkTVPkkGgsJJBEKMkwUUvwkGgsJIhABtSkjbR4ebSMpEEBAAAEAHP8wAmQC2AAqAAABIgYdATMVIxEUBiInJjU0NzMWFxYzMjY1ESMnNjc1NDYyFxYVFAcjJicmAccmIpmZV8RHARpWEgIGCyMfLAsWIVvNSAEaWBIBEAJyKjdUXP6fdFw0CQk2Mx4qASo3AWpFFANKZ2o1CQo4MyEqAgABAGYCOQGmAxAACwAAAQcmJwYHJz4BNx4BAaYkLk5OLiQNZi0tZgJiKQ1DQw0pI20eHm0AAQBmAjoBpgMRAAsAAAEXDgEHLgEnNxYXNgGCJA1mLS1mDSQxS0sDESkjbR4ebSMpEEBAAAEAUQI1AbAC1gAJAAATMxQWMjY1MxQgUVstTTBa/qEC1iYnJyahAAABADICVQDZAuwAAwAAEjQyFDKnAlWXlwACAHwCRQFzAxwACAAOAAASJjQ2MzIVFCMnFDI1NCK7P0A6fX05dXUCRTB2MW1qazMzNQAAAQAe/wkA9gAmAA0AABciJjQ2NxcOARUUFwcGwkddaEQsJjdKBQ/3MHpjECYSMxovB2EBAAEARwJGAeoCygAUAAASNjIWMzI/ARcOAQcGIiYjIg8BJzZfP0JcHjgkDCgEIw8qSl8ZKyULJgUCpiQcFQc/Bh4JGBwUB0IHAAIABgJjAZkDPwALABcAABM2MhcWFxYUBwYHJyU2MhcWFxYUBwYHJ30MFgkZCQUHJ3sgAUEMFgkZCQUHJ3sgAzUJAwkWChgPRUMkrgkDCRYKGA9FQyQAAQAuANwB4wE/AAcAACUhJzYzIRcGAYn+rwofOwFRCh7cQCNAIwABAC4A3ALFAT8ABwAAJSEnNjMhFwYCa/3NCh87AjMKHtxAI0AjAAEAHgGXAMgCuwANAAATFCI1NDY3FwYVFBceAciqRDAqIQETGQHjTExDcyIaNzUIBwYlAAABACIBlwDMArsADQAAEzQyFRQGByc2NTQnLgEiqkQwKiEBExkCb0xMQ3MiGjc1CAcGJQAAAQAk/2kAzgCNAA0AADc0MhUUBgcnNjU0Jy4BJKpEMCohARMZQUxMQ3MiGjc1CAcGJQACAB4BlwGhArsADQAbAAATFCI1NDY3FwYVFBceARcUIjU0NjcXBhUUFx4ByKpEMCohARMZ2apEMCohARMZAeNMTENzIho3NQgHBiUYTExDcyIaNzUIBwYlAAACACIBlwGlArsADQAbAAATNDIVFAYHJzY1NCcuASc0MhUUBgcnNjU0Jy4B+6pEMCohARMZ2apEMCohARMZAm9MTENzIho3NQgHBiUYTExDcyIaNzUIBwYlAAACACT/aQG4AI0ADQAbAAAlNDIVFAYHJzY1NCcuASc0MhUUBgcnNjU0Jy4BAQ6qRDAqIQETGeqqRDAqIQETGUFMTENzIho3NQgHBiUYTExDcyIaNzUIBwYlAAABABj/ggHsArIAHgAAFyY1NDcGIic1NjIXJjQ3MxYUBzYyFxUGIicWFRQGB+AgDE5SFBJQUQ0DggMOUlASFVJODRQMfoDhTGkUA28DFFVeGhhdWBQDbwMUU19zwDEAAQAf/4IB8wKyADEAADc0NwYiJzU2MhcmNDcGIic1NjIXJjQ3MxYUBzYyFxUGIicWFAc2MhcVBiInFhUUByMmywdLUxUSTlEHCE1RFBJQUQ0DggINUlASFFJNCAdRTxIXVEkHG0QcVjU0EwNvAxQlUCoUA28DFFFTFRRSUxQDbwMUKlAlFANvBBQzNGltbAAAAQA+AJ0BKwFzAAgAADYmNDYzMhUUI3o8PDp3d50xczJsagAAAwAl//YDCACNAAMABwALAAAWNDIUMjQyFDI0MhQlp3end6cKl5eXl5eXAAAHABr/5QTFAtAACQASABoAIwArADQAPAAAFyY0NwEXFhQHAQM0NjIWFAYjIhIGFBYyNjQmEzQ2MhYUBiMiEgYUFjI2NCYXNDYyFhQGIyISBhQWMjY0JtoFEwFMPwUT/rT/ZKVcZVKukRcaPxga5mSlXGVSrpEXGj8YGr5kpVxlUq6RFxo/GBoFEDEiAnIWEDAk/Y8CFmFiV8ZmAS4ogy8sgyv+T2FiV8ZmAS4ogy8sgytuYWJXxmYBLiiDLyyDKwABABgAJgESAckADAAAExcOAQcWFwcuASc+AeMvCTkjTxYvKYAiIoABySMgYyxiTCMRhTs7hQABACIAJgEcAckADAAAEzceARcOAQcnNjcuASIvKYAiIoApLxZPIzkBpiMShTs7hREjTGIsYwABAAT/6QGhAtAACAAAFyY3ARcWFAcBBA8dAUo/BRP+tgEvNAJuFhAwJP2TAAEAGv/4AmYCugAwAAABJiIGBzMXBisBFBczFwYrAR4BMzI3FwYjIiYnIyc2OwE1Iyc2OwE+ATIXHAEGByMmAd0oWEANywoePIMB0goePHYOPC9lUSJki2x3El4KHzsGVgofOw8VjtpjDQxaDgI2EztHNCMvDjQjOjIgWT9reTQjPTQjenk/ByJRGhoAAgAxAUcDUQLDACsARQAAARUWFwcjJzY3NSYnNzMXFhczNj8BMxcGBxUWFwcjJzY3NTcnBg8BIy8BBxYnFRYXByMnNjc1IwYHJzU3FhczNjcXFQcmJwH8EggFfwYJEhEMCYZHCAQIAgpEhwYJFBIKBo8GCxIDCAMJLlgvDAgE/RILCY8JDREiBw4xMQ0IqwYKNTMMBQHIMAgQOToOCscIDzuyGBoYGrI7DgrFBw4+Pg4IMi4BFRmHhS0BFna+BxA8PBAHvg4HBXUGBw8NCQZ1BQgNAAABAC4A3AHjAT8ABwAAJSEnNjMhFwYBif6vCh87AVEKHtxAI0AjAAEAGgAAAl0C2AArAAABIi4BJyYiBh0BMzYyFxEWFwcjJzY3ESMRFhcHIyc2NxEjJzY3NTQ2MhYVFAHkGywNCydfIpA4YCEnEArmCg4pvSsXCvEKDiksCxYhZOCdAjMYEA8IKjcsDQP+gA8TTU0TDwEa/ugPFU1NEw8BGkUUAzVjWyoySQAAAQAZAAACbgLYACYAABM0NjMyFzYyFxEWFwcjJzY3ESYiBh0BMxUjFRYXByEnNjc1Iyc2N1BbaDM2QF8cJxAK5goOKUphJJmZSxsK/usKDiksCxYhAgdnahIMAv2fDxNNTRMPAeQfKjdUXO0PGE1NEw/yRRQDAAEAAADqAFQABwAAAAAAAgAAAAEAAQAAAEAAAAAAAAAAAAAAAAAAAAAAABoAPACTAOsBMwF3AYsBtAHcAhACMQJKAlwCaAKCAqQCxQMBAz8DbwObA8UD6AQrBFUEZgSFBJ8EvwTYBQ8FZgWZBdYF/gYjBlMGgga3BvEHEQc6B3EHkgfiCCAIQAhuCJoI2AkbCT8JbgmbCeQKMAppCqMKvQrWCvALCgsdCzELbQuiC8wMBww6DG8MqgzhDQQNKQ1fDXwNzQ4EDiMOXw6SDr0O+Q8dD08Pew+6EAYQRhB4ELcQyhEKES4RLhFIEYgRxRIJElESahLEEt0THhNbE4sTpxO5FA0UIBQ4FGYUoRTZFO0VLxVjFW8VjRWrFcYV9hZOFrAXKhdiF6IX5BgqGHsYwBkGGUsZiBnHGgYaSxqOGroa5hsZG0obexvXHAYcNRxqHKkc3B0HHUUdgh3AHgMeRB6MHsIe/R9GH48f3iA4IIYg1SEoIWYhpiHmIiwicSKbIsUi9iMiI2EjtiPjJBEkRCSBJLMk2yUWJVUllCXZJh4mbCalJvgnFSdJJ3onuCf7KFEooSjtKTopfym9Kdcp8SoFKhEqKypFKmkqlCqnKroq1CruKwcrNCthK44rvSwFLBcsLSyNLKgswyzZLR8tiS2cLd8uGgAAAAEAAAABAINPCw1YXw889QALA+gAAAAAyzUOVgAAAADLNQ5W/2//CQTFA8wAAAAIAAIAAAAAAAAA+gAAAAAAAAFNAAAA4QAAARcAPAGCACYDGQAWAh0AHgNOABkCTwAdALQAJgEdAB0BHQAUAZ8AHAH7ABgA9AAkAaUALgDwACUBnQAcAkAAKQFbABwCHwAWAgAAGAItAAYB8wAcAgwAJAH2ABACLAAiAgYAEQD/ADABDwA1AYYAFwIzADQBhwAoAhIAGQOpACQChf/6AmkAIAI6AB4CgwAgAhsAIAILACACbAAeAqoAIAE+ACABLP92AnMAIAH2ACADiwAeAqQAHgKDAB4CXgAgAoMAHgJ0ACACGgAfAkAACAJ6ABACdgAAA9MAAwJUAAECTP/8AjoADwFHAEMBvgAcAUcACgIMAF8CeQBdA0EAhQIAABUCGf/7AcIAGQIrABoB4wAZAX4AGgIXABsCRwAOASQAHAEE/9wCNwAOARcADgNsABoCUwAaAhIAGQIsAA8CFgAaAYQAGgHDAB8BdAAMAkwACgJKAAcDLgABAioADQI4//4B3wAVAa4AAgDnAEEBrgAQAloAHgDhAAABFgA7AcsAGgIaACQCdgAmAm8AGQDnAEEB5gAtAiQATwL+ACUBpQAfAhoAGAJ7ABcBpQAuAv4AJQGkACgBdwAeAhMAIwGSACIBewAiAeUAuAJnABgCQwAbAPgAKQDhAB4A/AApAaYAHwIaACICzgAbAv0AGgMSABoCEgAZAoX/+gKF//oChf/6AoX/+gKF//oChf/6A4r/7gI6AB4CGwAgAhsAIAIbACACGwAgAT4AIAE+ACABPgABAT7/5QKTAA0CpAAeAoMAHgKDAB4CgwAeAoMAHgKDAB4CHwAaApf//AJ6ABACegAQAnoAEAJ6ABACTP/8AmMAIAI/AA4CAAAVAgAAFQIAABUCAAAVAgAAFQIAABUC/wAWAcMAGgHjABkB4wAZAeMAGQHjABkBJAAWASQAHAEk//MBJP/lAg0AGwJTABoCEgAZAhIAGQISABkCEgAZAhIAGQH9ABkCM//7AkwACgJMAAoCTAAKAkwACgI4//4CGP/7Ajj//gEkABwB+P/9ASf/8ANnAB8DNAAZAhoAHwHDAB8CTP/8AjoADwHfABUCfQAcAfQAZgH0AGYB9QBRAQsAMgH1AHwBFAAeAiAARwGwAAYCEAAuAvIALgDpAB4A5wAiAPQAJAHCAB4BwAAiAd4AJAIEABgCEgAfAWkAPgMsACUE3gAaATQAGAE0ACIBnwAEAogAGgOAADECEAAuAmsAGgJ9ABkAAQAAA8z/CQAABN7/b//GBMUAAQAAAAAAAAAAAAAAAAAAAOoAAgG7AZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAACAAAAvQAAASgAAAAAAAAAATHR0AABAACD7AgPM/wkAAAPMAPcAAAABAAAAAAH0ArIAAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEANAAAAAwACAABAAQAH4A/wExAUIBUwFhAXgBfgGSAscC3SAUIBogHiAiICYgMCA6IEQgrCEiIhL7Av//AAAAIACgATEBQQFSAWABeAF9AZICxgLYIBMgGCAcICAgJiAwIDkgRCCsISIiEvsB////4//C/5H/gv9z/2f/Uf9N/zr+B/334MLgv+C+4L3guuCx4KngoOA538Te1QXnAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAOQAAAADAAEECQABABIA5AADAAEECQACAA4A9gADAAEECQADAD4BBAADAAEECQAEABIA5AADAAEECQAFABoBQgADAAEECQAGACABXAADAAEECQAHAFYBfAADAAEECQAIAB4B0gADAAEECQAJAB4B8AADAAEECQALACQCDgADAAEECQAMACQCDgADAAEECQANASACMgADAAEECQAOADQDUgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAgAGIAeQAgAEwAYQB0AGkAbgBvAFQAeQBwAGUAIABMAGkAbQBpAHQAYQBkAGEAIAAoAGkAbgBmAG8AQABsAGEAdABpAG4AbwB0AHkAcABlAC4AYwBvAG0AKQAsACAAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAcwAgACIAUABhAHQAdQBhACIAIABhAG4AZAAgACIAUABhAHQAdQBhACAATwBuAGUAIgBQAGEAdAB1AGEAIABPAG4AZQBSAGUAZwB1AGwAYQByAEwAdQBjAGkAYQBuAG8AVgBlAHIAZwBhAHIAYQA6ACAAUABhAHQAdQBhACAATwBuAGUAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMgBQAGEAdAB1AGEATwBuAGUALQBSAGUAZwB1AGwAYQByAFAAYQB0AHUAYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEwAYQB0AGkAbgBvAFQAeQBwAGUAIABMAGkAbQBpAHQAYQBkAGEATAB1AGMAaQBhAG4AbwAgAFYAZQByAGcAYQByAGEAbAB1AGMAaQBhAG4AbwAgAFYAZQByAGcAYQByAGEAdwB3AHcALgBsAGEAdABpAG4AbwB0AHkAcABlAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA6gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEBAgCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA1wDiAOMAsACxAOQA5QC7AOYA5wCmANgA4QDbANwA3QDgANkA3wCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwC8AQQAjADvAMAAwQd1bmkwMEEwB3VuaTAwQUQERXVybwAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAwDpAAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEA1AAEAAAAZQF0AYYBvAIqAoACjgLgGFwC5gNsA64D+AQeBDQEXgSEBKYEwATyBUQFZgWcBbIFuAW+BdgGZgagBsYHIAcqB3QHrgfsCEoIjAjuCPwJXgmkCd4KNApeCwwLfgxgDUINhA5WDoAPCg+UD9IQMBBiEIgQzhFwEY4RsBG6EfQSHhJcEroSxBL6EzgTYhOYFB4UkBTGFTgVZhXcFeIV8BX2FgwWEhY0FloWkBbuGCIXKBdKF3wX0hfkGCIYKBg2GFwYZhhwGIoYzBjaGPwAAgAaAAUABQAAAAkAHgABACAAIAAXACMAKgAYACwAMwAgADUAPwAoAEQASgAzAEwATwA6AFEAUgA+AFQAYABAAGMAYwBNAHAAcABOAHIAcgBPAHkAeQBQAIEAgQBRAJoAmgBSAKAAoQBTAKgAqABVALAAsgBWALoAugBZAMQAxABaAMYAxgBbANcA2QBcANwA3ABfAOIA5ABgAOYA5wBjAAQAD/+GABH/iADZ/4YA3P9sAA0ACv/hACQAFwA3/+EAOf/dADr/4AA7ABAAPP/eAFn/4wBa/+8AXP/rAIgAIwCaAAoA2P/hABsAEP+rABH/pgAS/7sAF//hABn/4QAd/9kAI//RACT/wQAm//MAMv/0AET/9gBFAAsAR//2AFL/9ABW//YAWf/3AFr/9wBc//YAcP/yAIj/pgCQACQAkQBAAK4ACwCxADIA4v+mAOP/uQDmABIAFQAL//QAE//2ABf/8QAZ//EAG//2ACT/9gAm//QALQCRADL/8wBE//IAR//vAE0AIQBS/+4AVv/zAFj/9gBZ/+0AWv/zAF7/8gCxABcAsv/uAMAABwADAAz/9ABA/+YAYP/rABQAJP/PADcACwA5ABIAOgAPADsABgA8ABcARQAdAEkACgBLABAATwAQAFcAGABYAAcAWQANAFoADwBcABMAiP+wAKEAAQCwABoAsQAWAMQACgABABr/7gAhAAr/uAAU/+oAFf/yABb/6wAY/+4AGv/bABz/7wAk/+gALP/yAC3/7gA2//QAN//AADj/9wA5/9YAOv/bADv/6gA8/8gAPf/nAEn/9ABL//cATP/zAE3/9wBP//cAUf/zAFP/9wBX//cAWP/4AFn/4gBa/+QAW//jAFz/3wBd/+4AiP/rABAABf+IAAr/pgAa//MAHP/kAC3/9wA3/9cAOP/0ADn/xQA6/84APP/UAFn/0wBa/9gAXP/MAIgABgDX/5sA2P+aABIAEv9FABP/9QAX/+0AGf/uABv/9QAk/9IAJv/0ADL/9ABE/+8AR//nAFH/9QBS/+cAVv/tAFn/8gBd//YAiP/HALEAFQCy/+UACQAS/+QAJP/yADn/8wA6//QAPP/0AD//9ABA/+wAYP/xAIj/7AAFABD/9QA5//QAOv/zAIgAEADn//UACgAQ//QAEv/2ADn/9AA6//UAPP/1AD//9ABA//EAef/2AIgADgDn//QACQAS/+kAJP/1ADn/8wA6//QAPP/0AD//8wBA/+0AYP/yAIj/9AAIABL/9AA3/+4AOf/qADr/6wA8/+oAP//rAED/5gBg/+sABgAS/+0AJP/2ADn/9AA6//UAPP/0AD//9AAMAAr/5gAM//MAEv/wABr/7AA3/98AOf/iADr/5QA8/+AAP//mAED/5ABg/+gAcv/nABQABv/cAA7/6AAQ/90AEf/IABL/xAAX/+sAGf/vACD/5gAk/84ANwAOADgABgA5ABUAOgASADsACQA8ABoAZP/rAHn/4gCI/8AA5P/PAOf/3QAIABL/6wAk//UAOf/zADr/8wA8//MAP//yAED/7QBg//IADQAG//UADP/2ABH/5gAS/9oAJP/kADn/9AA6//QAPP/0AD//9ABA/+sAYP/xAIj/2wDk/+oABQAK/98AN//LADn/3wA6/+MAPP/YAAEALQAmAAEAGv/tAAYACv/2ACT/8gA5//EAOv/yADz/8ACI/+sAIwAK/8QADP/2AA3/zwAQ/+oAE//0ABf/8AAZ//UAGv/uABz/4gAi/+YAJv/vAC3/+QAy/+0AN/+9ADj/5AA5/74AOv/DADz/vAA//80AQP/aAEf/9wBS//gAV//4AFj/9wBZ/8sAWv/ZAFz/0gBg/+IAcP/wAJr/9gCy//cA1//SANj/zwDi//IA5v/KAA4AEv/oACT/8wA3//kAOf/wADr/8QA7//cAPP/xAD//8gBA/+0AWf/wAFr/+wBc//oAYP/zAIj/7QAJABD/5wAm//oAMv/5AEUABQBS//oAWf/4ALAADQCxABoAsv/7ABYACv/1AAz/8gAS/+IAJP/qACz/+AAt//sAN//sADj/+wA5/+UAOv/nADv/6QA8/+AAPf/2AD//7wBA/+IAS//7AE//+wBZ//YAYP/oAIj/5ADEAAwA5v/4AAIAWf/2ALEADAASABD/8wAR/84AEv/UAB3/9gAk/9AARP/vAEUABQBH//EASf/7AFL/8QBW//IAXf/6AIj/uQCh//cAsAAMALEAGwCy/+wA4v/1AA4AEv/rABcADAAk//UAN//6ADn/8wA6//UAPP/0AD//9ABZ//EAWv/3AFz/9wCI//YAsQAKAMQAEQAPABD/8gAS//MAJv/7ADL/+gBH//cAUv/2AFP/+QBX//cAWP/4AFn/8QBa//AAXP/wALEACgCy//YA4v/zABcAEP/1ABL/8QAk//gAJv/7ADL/+wBE//YAR//1AEn/+ABR//gAUv/0AFP/+QBW//UAV//2AFj/9wBZ//UAWv/1AFz/9QBd//cAof/4ALAADQCxABMAsv/0AOL/9AAQAA0ABgAQ/+sAFQAFABYABQAm/+oAMv/qAEUADQBX//cAWP/2AFn/3QBa/+kAXP/kAJr/9gCwABcAsQAdAMQACQAYAAr/ywAN/8MAFwAIABr/9gAc/+QAIv/uACQACwA3/7UAOP/1ADn/vAA6/8AAOwAGADz/ugA//9cAQP/kAFn/wABa/9EAXP+5AGD/7ACIABgAmgAJANf/wgDY/8YA5v/FAAMADQALALAABgCxAAwAGAANABEAEP/1ABL/6QAk//kAJv/7ADL/+wBE//YAR//1AEn/+ABR//gAUv/0AFP/+QBW//UAV//3AFj/+ABZ//YAWv/1AFz/9QBd//cAof/5ALAADQCxABQAsv/1AOL/9AARAAz/9gAR//cAEv/hACT/6QAs//oAN//2ADn/7gA6/+8AO//uADz/7QA9//kAP//yAED/6ABZ//gAYP/uAIj/4wDEAAkADgAQ/+cAEf+1ABL/0QAk/8EAOf/5ADr/+QA7//UAPP/7AEf/9gBS//YAiP+XAKH/9wCy/+sA4v/uABUAEP/nABL/8wAX//UAJv/5AC3/+wAy//kAN//zADj/9gA5/+gAOv/pADz/6gA//+wAQP/nAEf/+gBS//kAWf/pAFr/9ABc//QAYP/uALL/+gDm//cACgAS/+4AJP/4ADn/9gA6//YAPP/4AFn/7wBa//MAXP/zAIj/9gDEAAcAKwANABQAEP+/ABH/1wAS/8cAF//iABn/5wAd/8sAI//iACT/vQAm//IAMv/yAEAACABE/7kARQAWAEf/vABJ/+wATP/2AE3/+gBR/8QAUv+6AFP/xwBW/7kAV//kAFj/ywBZ/84AWv/DAFv/zgBc/78AXf/OAHD/9gCI/6QAof/yAKX/5ACm/+IArf/hALAAHQCxACwAsv/BALf/2QC4/9AAwv/EAOL/wwDj/88AHAANAAUAEP/3ABH/8gAS/9wAJP/jAET/8wBFAAsAR//zAEn/9gBM//sAUf/zAFL/8wBT//YAVv/yAFf/9wBY//gAWf/2AFr/9ABb//kAXP/1AF3/9ACI/+AAof/1ALAAFACxABoAsv/wAML/8wDi//UAOAAJ//MADAAGAA0AHQAQ/9MAEf/FABL/vgAT//MAFAAIABf/5AAZ/+UAGgATABv/8wAcAAYAHf/fACIACwAj/98AJP+/ACb/7AAy/+wANv/2ADcABwBAABEARP/VAEUAJABH/80ASf/vAEsAEABPABAAUf/cAFL/ywBT/9wAVv/QAFf/6gBY/94AWf/jAFr/4ABb/90AXP/iAF3/3ABgAAgAcP/wAIj/oQCh//IApf/wAKb/6ACt/+gAsAAtALEAMwCy/8cAt//lALj/1QDC/9wAxAAHAOL/1ADj/+EA5gAQADgACf/0AAwACAANAB0AEP/YABH/zAAS/8IAE//0ABQACgAX/+cAGf/nABoAFQAb//UAHAAGAB3/4gAiAAwAI//jACT/xAAm/+4AMv/uADb/+AA3AAgAQAATAET/2QBFACUAR//TAEn/8gBLABEATwARAFH/3QBS/9EAU//hAFb/1wBX/+4AWP/kAFn/5gBa/+UAW//jAFz/5wBd/+EAYAAKAHD/8gCI/6cAof/0AKX/8QCm/+oArf/pALAALgCxADQAsv/OALf/5gC4/9cAwv/dAMQACADi/9kA4//lAOYAEAAQAA0ADwAQ/+sAGgAGACb/7gAy/+4ARQAVAEf/+QBS//cAV//3AFj/9ABZ/9cAWv/kAFz/5ACwAB4AsQAkALL/+QA0AAn/8gANABcAEP/FABH/1AAS/8MAE//yABf/3wAZ/+EAGgAOABv/8gAd/9gAIgAGACP/3QAk/7wAJv/nADL/5wA2//UAQAAMAET/yABFAB4AR//IAEn/6wBLAAoATP/6AE8ACgBR/9YAUv/HAFP/3ABW/8AAV//iAFj/2gBZ/9YAWv/UAFv/3QBc/9QAXf/XAHD/7gCI/50Aof/vAKX/6gCm/+MArf/iALAAKACxAC0Asv/DALf/4AC4/9EAwv/XAMQAAgDi/8sA4//cAOYACgAKAA0ACwAQ//MAMv/7AFP/+ABX//UAWP/3AFn/5QBa/+UAXP/iALEACwAiAAv/5gAT/+gAF//hABn/3wAb/+sAHP/1ACT/3AAm/+UALQCbADL/5QA2//EANwAIADkACQA6AAYAPAAOAET/3wBFAA4AR//dAEn/8gBK/+YATQAtAFH/6ABS/9sAVv/fAFf/7QBY/+oAWf/UAFr/5wBb/+wAXf/lAF7/5gCI/9gAsQAoALL/3QAiAAr/uAAT/+IAFP/yABX/9AAW//MAF//kABj/8gAZ/+UAGv/iABv/6QAc/9MAJv/gACz/7gAtAIcAMv/fADb/8QA3/8IAOP/ZADn/uQA6/74APP+/AET/8wBF//UAR//rAE0AHgBS/+oAVv/2AFf/5wBY/+cAWf/FAFr/0gCy/+sAwP/9ANj/wQAPAAr/9wAQ//YAIv/xAC3/+AA3/8EAOP/wADn/zAA6/9QAPP/HAD//4ABA/98AWf/mAFr/6gBc/+gAYP/mABcACv/2AAz/7wAS/+sAIv/yACT/+AAs//YALf/0ADf/vgA4//QAOf/MADr/1AA7//UAPP/IAD3/9AA//+YAQP/eAFn/8gBa//IAW//4AFz/7gBg/+MAiP/0AMQACQAMABD/7wA3/8QAOP/2ADn/4AA6/+MAPP/VAED/6ABH//wAUv/8AGD/7QCy//oA4v/zAAkAEP/2ADf/9gA4//kAOf/1ADr/9AA8//cAWf/vAFr/9ABc//IAEQAK//gADP/xABL/9gAi//UALf/4ADf/tQA4//UAOf/UADr/1QA8/8AAP//pAED/3gBZ//UAWv/2AFz/9gBg/+QAxAANACgABAASAAoALAAMADwADQBEABD/1gAS//EAIgA5ACwALwAtADkANgAOADcASwA4AD8AOQBPADoATAA7AEMAPABUAD0AMAA/ADIAQABJAEf/+wBMAA8ATQAbAFL/+wBfABIAYABAAJIAHwClACUApgAfAK0AHgCwAFkAsQBqALL/9AC3ABsAuAANAL4ABgDCAAEA1wAZANgALwDi/+4A5gA9AAcAN//NADj/+wA5/9sAOv/fADz/1AA//+8AQP/2AAgAEP/2ADf/+AA4//oAOf/6ADr/+QBZ//IAWv/2AFz/9gACAC0AZACxAAgADgAQ/+IAMv/7ADf/ywA4//kAOf/eADr/3gA8/90AP//2AED/7wBH//UAUv/zAGD/9QCy//IA4v/0AAoAEP/2ADf/9wA4//kAOf/3ADr/9QA8//kAWf/wAFr/9QBc//UAef/gAA8ACv/4ABD/9wAi//EALf/2ADf/wgA4//EAOf/MADr/1QA8/8gAP//fAED/3gBZ/+YAWv/qAFz/6QBg/+UAFwAK//YADP/uABL/6wAi//EAJP/4ACz/9AAt//MAN/+6ADj/9AA5/8sAOv/RADv/9QA8/8YAPf/0AD//5QBA/9wAWf/wAFr/8QBb//YAXP/wAGD/4QCI//UAxAAJAAIAQAADAE0AKgANABD/5wAS//AALP/6ADf/ygA4//kAOf/oADr/6wA8/98AQP/qAGD/7gCy//cAxAAIAOL/7wAPAAr/+AAM//EAEv/0AC3/9wA3/7sAOP/0ADn/1QA6/9QAPP/NAD//6wBA/+AAWf/0AFr/9gBc//YAYP/mAAoAEP/oADf/0QA4//oAOf/qADr/7AA8/+IAQP/qAGD/7gCIAAkA4v/vAA0AEP/1AC3/9gA3/8QAOP/yADn/0AA6/9YAPP/KAD//5wBA/+IAWf/wAFr/9ABc//QAYP/pACEACf/zAAz/7gANAAoAEP/gABH/0wAS/8kAI//zACT/ywAm//cALP/xAC3/+QAy//cANv/7ADf/zQA4//cAOf/kADr/5wA7/9gAPP/XAD3/8wA//+wAQP/UAET/+ABH/+0AS//wAE//8ABS/+0AVv/2AGD/3QCI/7wAsv/eAOL/6ADm//UAHAAK//gADP/0AA0ADgAQ/+IAEf/YABL/1QAk/9kALP/yAC3/+QA3/8QAOP/2ADn/4wA6/+cAO//lADz/1wA9//EAP//xAED/5wBE//kAR//wAEv/9wBP//cAUv/wAFb/+ABg/+sAiP/PALL/5QDi/+UADQAQ/+IAN//OADj/+gA5/94AOv/jADz/3QA///YAQP/sAEf/9wBS//YAYP/yALL/9ADi//EAHAAK//cADP/0AA0ADwAQ/90AEf/MABL/0gAk/9IALP/wAC3/+QA3/78AOP/1ADn/4wA6/+YAO//kADz/1gA9/+0AP//wAED/5wBE//cAR//tAEv/9ABP//QAUv/uAFb/9wBg/+oAiP/GALL/4ADi/+IACwAQ/+gALf/6ADf/zgA4//MAOf/XADr/2wA8/9cAP//xAED/5ABg/+kA4v/xAB0AC//sABP/7wAX/+QAGf/lABv/8QAk/+MAJv/sAC0AkgAy/+wAPAAFAET/5gBFAAYAR//jAEn/9QBNACsAUf/tAFL/4QBW/+UAV//xAFj/7gBZ/90AWv/qAFv/8gBd/+oAXv/nAIj/3wCwAAwAsQAkALL/4gABAC0AZQADAAz/8gBA/+YAYP/nAAEAWf/0AAUAJP/uADn/8AA6//EAPP/vAIj/6AABABf/7wAIABT/7QAV//YAFv/uABj/8QAa/+AAHP/0AC//9ABP/+AACQAkAAkAN//oADn/5QA6/+YAPP/nAFn/4gBa/+wAXP/pAIgAFAANAAwABgANABIANwACADn/9gA6//UAPP/2AD///QBAABQARQAcAEsACABPAAgAYAALAOYACgAXAAr/zAAM/+8AEf/aABL/3gAU/+8AFf/zACT/0gAs/+8ALf/3ADf/4gA4//cAOf/aADr/3QA7/9IAPP/RAD3/5QA///AAQP/dAEv/9QBP//UAYP/mAIj/xQDm//EADgAM//YAIv/1AC3/9wA3/8IAOP/zADn/zQA6/9UAPP/JAD//6QBA/+kAWf/UAFr/2QBc/9kAYP/tAAgADQAcACIADgBAAAYARQAfAEsAEgBPABIAYAANAOYAEQAMAAoABwAMABYADQAeACIACwA/ABgAQAAmAEUALwBLABwATwAcAGAAIgDYAAsA5gAdABUADP/0ABL/6QAk//UALP/3AC3/9gA3/+kAOP/1ADn/5wA6/+cAO//zADz/5gA9//MAP//zAED/8QBZ//gAWv/2AFv//ABc//cAYP/xAIj/8QDEAAkABAANAAoAIv/4AFr/9wBc//cADwANAB0ASQAGAEwACwBNABgAUQANAFMAGABXABEAWAAdAFkAIQBaACYAWwAZAFwAKQBdAAcA4wAJAOkAEQABAMQACgADABH/mgAk/9EAiP+1AAkAEf+MABL/wAAj/+oAJP/JADwABQCI/60AsAALALEAEQDi/+wAAgAF/4YALQBUAAIABf9zAC0AVAAGAAr/vwA3/88AOf/iADr/5QA8/9wAiAAHABAACv+rACT/8wAs//MALf/0ADf/wwA4//UAOf/VADr/2QA8/8sAPf/yAFn/6ABa/+UAW//xAFz/4gBd//AAiP/zAAMAF//mABn/6QAaAAkACAAk/9gAOQAGADwACgBFAAgASQAGAIj/vwCwABsAsQAaAAYAFP/qABX/8gAW/+sAGP/uABr/2wAc/+8AAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
