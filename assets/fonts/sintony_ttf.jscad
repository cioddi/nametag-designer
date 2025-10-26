(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sintony_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AAAAAwABBAkAAQAOALoAAwABBAkAAgAOAMgAAwABBAkAAwBIANYAAwABBAkABAAOALoAAwABBAkABQAeAR4AAwABBAkABgAOALoAAwABBAkABwBkATwAAwABBAkACAAuAaAAAwABBAkACQAuAaAAAwABBAkACwAsAc4AAwABBAkADAAsAc4AAwABBAkADQEgAfoAAwABBAkADgA0AxoAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADMALAAgAEUAZAB1AGEAcgBkAG8AIABUAHUAbgBuAGkAIAAoAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB0AGkAcABvAC4AbgBlAHQALgBhAHIAKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAJwBTAGkAbgB0AG8AbgB5ACcAUwBpAG4AdABvAG4AeQBSAGUAZwB1AGwAYQByAEUAZAB1AGEAcgBkAG8AUgBvAGQAcgBpAGcAdQBlAHoAVAB1AG4AbgBpADoAIABTAGkAbgB0AG8AbgB5ADoAIAAyADAAMQAzAFYAZQByAHMAaQBvAG4AIAAwADAAMQAuADAAMAAxAFMAaQBuAHQAbwBuAHkAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkALgBFAGQAdQBhAHIAZABvACAAUgBvAGQAcgBpAGcAdQBlAHoAIABUAHUAbgBuAGkAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAHQAaQBwAG8ALgBuAGUAdAAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAg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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
