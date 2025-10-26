(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.architects_daughter_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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//8ANP//AjACcBImAFIAABAHAHQAywAA//8ANP//AjACrxImAFIAABAGATp8AP//ADT//wIwAo4SJgBSAAAQBgFAOAD//wA0//8CMAKYEiYAUgAAEAYAaWoA//8AOgBvAUcBexAmAB1eChAGAVscAP//ADT/2gIwAgYSJgBSAAAQRgASXNo4IjOV//8ADf//AekCaBImAFgAABAHAEMAogAA//8ADf//AekCcBImAFgAABAHAHQArwAA//8ADf//AekCrxImAFgAABAGATpgAP//AA3//wHpApgSJgBYAAAQBgBpTgD//wAW/lgCIAJwEiYAXAAAEAcAdADEAAAAAgAY/3EB/gJPABsAKwAANwcUFxYVFAYiJwM2MhcWFzYzMhcWFRQGBwYHFgEmIgcGBwYVFBUXNjc2NTRyAQQBHx4HGhcXBw4EhGB+KhM8M3WpAQESIkslVCgSBcxXMB0vHR8IBhoZAQLUCQ8agig8GyEtWyZVERIBVw0HEDcaJgQEeS5FJycr//8AFv5YAiACmBImAFwAABAGAGljAP//ABr/8QJ+Ax0SJgAkAAAQBwBvAIgAuv//ABIABgH1AmMSJgBEAAAQBgBvVQD//wAh//EChQNPEiYAJAcAEAcBPACKARH//wASAAYB9QI+EiYARAAAEAcBPACAAAD//wAa/0oCmAK6EiYAJAAAEAcBPwG+AAP//wAS/1ECGAHGEiYARAAAEAcBPwE+AAr//wAW//8CwAM1EiYAJgAAEAcAdADtAMX//wAWAAACbQJwEiYARgAAEAcAdADvAAD//wAW//8CwAOJEiYAJgAAEAcBOgCrANr//wAWAAACbQKvEiYARgAAEAcBOgCgAAD//wAW//8CwAMaEiYAJgAAEAcBPQEIAPL//wAWAAACbQIoEiYARgAAEAcBPQD2AAD//wAW//8CwANBEiYAJgAAEAcBOwCzAQP//wAWAAACbQJTEiYARgAAEAcBOwCRABX//wAmAAYCfwMpEiYAJwAAEAcBOwCSAOv//wAeAAACSgLjEiYAKAAAEAcAbwBuAID//wAUAAYCCQJjEiYASAAAEAYAb2YA//8AHgAAAkoDBhImACgAABAHATwArgDI//8AFAAGAgkCWhImAEgAABAHATwAjgAc//8AHgAAAkoC9BImACgAABAHAT0AwgDM//8AFAAGAgkCThImAEgAABAHAT0AxwAm//8AHv9wAkoCfhImACgAABAHAT8BYAAp//8AFP9KAgkB0xImAEgAABAHAT8AngAD//8AHgAAAkoDIRImACgAABAHATsAkADj//8AFAAGAgkCcRImAEgAABAGATtvM///ABb/wAKuA3QSJgAqAAAQBwE6AMkAxf//ABf+UQH7Aq8SJgBKAAAQBgE6ZAD//wAW/8ACrgMQEiYAKgAAEAcBPADYANL//wAX/lEB+wI+EiYASgAAEAcBPACEAAD//wAW/8ACrgMFEiYAKgAAEAcBPQDnAN3//wAX/lEB+wIoEiYASgAAEAcBPQC6AAD//wAW/wUCrgKMEiYAKgAAEAcBXgCeAAD//wAX/lEB+wJrEiYASgAAEAcBTACmAAD//wAV//oCSgPNEiYAKwAAEAcBOgBvAR7//wAX//0B8QMdEiYASwAAEAYBOnlu//8AFf/6AkoC2xImACsAABBGAG/sr38fR0H////x//0B8QKcEiYASwAAEAYAb9Od////k///AR8DChImACwAABAHAUD/eQB8AAL/hAAGARACsAAIACcAABMWFwYjIiYnESciByImJz4BNzYyHgIyPgI3Mh4BFAYHBiMiJy4BdQ0JBioLFwM4IDYGGwMPPCEIFB0kJisZFRkXBg0BDxEsPi4cFBwB1rv2HwkIAb+DUQgNMEoNAxUmIg4aJhgVDxYkEi8fEhcAAAL/vAAGAMkCYwAIABYAABMWFwYjIiYnESciNTQ+AjcyFxYUBgd1DQkGKgsXA0gyFzlXMCoLAQkSAda79h8JCAG/QBkOCggPBRcECQ8G////3///AKAC0hImACwAABAHATz/wACU////1f9NAIkCRhImACwAABAGAT+vBv////T/VQCoAoESJgBMAAAQBgE/zg7//wAa//8AeQLEEiYALAAAEAcBPQAAAJwAAQA2AAYAiwHWAAgAABMWFwYjIiYnEXUNCQYqCxcDAda79h8JCAG///8ACQAEAgYDjBImAC0AABAHAToAfADdAAL/hP6RANkCrwAiADoAABcUIyIuAScmJzQ2NR4BMzI3NjU0JicmNDcmNzYzBhQeARcWAiY0Njc2NxYXFhcWFAcGJy4CJwYHBgejWAkbNRtBEg4hTCscEg8NBg4CAxkTFwkBCwcRzRcVEyo+MxEcJAYFChklDRgfPRUIBsinAQcJFioFHwEZLCokJFWhUKV5KBgMCT5ITZRKoQJjCiYkFCwdIQ4ZOAwVBhAPGwwaHiokDA4A//8AK/8FAmEC0BImAC4AABAGAV5yAP//AB7/BQJkAtsSJgBOAAAQBgFedgD//wA3AA4CtANYEiYALwAAEAcAdAEHAOj//wAQ//8AhgM8EiYATwAAEAcAdP/3AMz//wA3/wUCtAKuEiYALwAAEAcBXgCeAAD//wAI/wUAkwKqEiYATwAAEAYBXo0A//8ANwAOArQCrhImAC8AABAHAU0BAAAA//8ANwAOArQCrhImAC8AABAHAHcBKAAA//8AFv//AQcCqhAmAE8AABAHAHcAoQAA//8ACQAOArQCrhImAC8AABAGAUrrHP///8H//wDOAqoSJgBPAAAQBgFKowD//wAZ//gCYANlEiYAMQAAEAcAdADwAPX//wAi//oB4wJwEiYAUQAAEAcAdACrAAD//wAZ/wUCYALMEiYAMQAAEAYBXn0A//8AIv8FAeMB8xImAFEAABAGAV47AP//ABn/+AJgA3ESJgAxAAAQBwE7AKkBM///ACL/+gHjAoASJgBRAAAQBgE7aEL//wAi//oB4wMNEiYAUQAAEAcBXv+wA0v//wAWAA4CjgLZEiYAMgAAEAcAbwCoAHb//wA0//8CMAJjEiYAUgAAEAYAb3EA//8AFgAOAo4C9RImADIAABAHATwAzAC3//8ANP//AjACPhImAFIAABAHATwAnAAA//8AFgAOAo4DFRImADIAABAHAUEAvgCD//8ANP//AjACkhImAFIAABAHAUEAkQAAAAIAFv/yBDQCewAwAEAAAAEyFxUGBwYHBhYXFhUyPgEzFQUXMjc2MxQOAScGBTUGBwYiJicmNTQ+AjMyFzcWMwQGFBYXFjI3Nj8BJicmIgYDV1UkHGS5PxECAQQ9tmAy/oIFdV+vVxoTCn7+iS1NHWdyKlgxVXFBdEkBG1L+FicdHTzmMA4HARtXH1RUAm4NMgQBAg5OPBAnNBcLNjCkCRIUIgoHDh9YORMIJydTlEV6WzZtYwilW2lgIkheHB7EdSMMLAADABj/6gOWAd4AMQBEAEsAADc0NzY3MjMyFhc2NzY6ARcWFxYUBw4CBwYHBhQXFjMyNzY3MhYVBgcGIyImJwYjIiYkPgE3NTQnJiMOAQcGBxQXFjI2ASYjIgcGFRhmUXIGBzJCDjxtISYVIEwlDwIhVVkqXR4NAhlnOTtITQoPJGJMTEdgGDylX2EBaB0DAhwPHidPI0wXIRlzRQG6FzUmHDmpdkg5DC4pYh4JCBEtEx4JGBEHAwcuEysNWxQaIw8LPiUdLyRwWBA2NgxBPxwPBxAWMoU+FREJAUgkCxYj//8ALv/0AqsDLhImADUAABAHAHQA0AC+//8AG//1AiICcBImAFUAABAHAHQAxgAA//8ALv8FAqsChxImADUAABAHAV4AqQAA//8AG/8FAiIB4hImAFUAABAGAV5WAP//AC7/9AKrAykSJgA1AAAQBwE7AI0A6///ABv/9QIiAnkSJgBVAAAQBwE7AIIAO///AA///wJwAtsSJgA2AAAQBwB0APUAa///ABb/4wHfAnASJgBWAAAQBwB0AK0AAP//AA///wJwAz0SJgA2AAAQBwE6AJoAjv//ABb/4wHfAq8SJgBWAAAQBgE6XQD//wAP/xcCcAJgEiYANgAAEAcAeADGAAD//wAW/xoB3wHKEiYAVgAAEAcAeAC2AAP//wAP//8CcALZEiYANgAAEAcBOwCWAJv//wAW/+MB3wJTEiYAVgAAEAYBO2YV//8AAP8eAn4CRBImADcAABAGAV4aGf//ABD/BQGTAqgSJgBXAAAQBgFeCgD//wAAAAACfgLnEiYANwAAEAcBOwCKAKn//wAAAAACfgJEEiYANwAAEAcAbwBp/zb////1//EBkwKoEiYAVwAAEEcAb//I/ehhO03a//8AFP/+AhYDIxImADgAABAHAUAAQgCV//8ADf//AekCjhImAFgAABAGAUAcAP//ABT//gIWArkSJgA4AAAQBgBvd1b//wAN//8B6QJjEiYAWAAAEAYAb1UA//8AFP/+AhYCvhImADgAABAHATwAlwCA//8ADf//AekCPhImAFgAABAHATwAgAAA//8AFP/+AhYC/hImADgAABAHAT4ApgCz//8ADf//AekCSxImAFgAABAHAT4AjgAA//8AFP/+AhYDERImADgAABAHAUEAqQB///8ADf//AekCkhImAFgAABAGAUF1AP//ABT/YAIkAmMSJgA4AAAQBwE/AUoAGf//AA3/YwINAbkSJgBYAAAQBwE/ATMAHP//AA4AAAOzA3ASJgA6AAAQBwE6AT4Awf//AC7/6wMQAq8SJgBa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AGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAALAAgAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AIAAoAGsAaQBtAGIAZQByAGwAeQBnAGUAcwB3AGUAaQBuAC4AYwBvAG0AKQANAAoADQAKAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIAAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYwBvAHAAaQBlAGQAIABiAGUAbABvAHcALAAgAGEAbgBkACAAaQBzACAAYQBsAHMAbwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwADQAKAA0ACgANAAoALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAA0ACgBTAEkATAAgAE8AUABFAE4AIABGAE8ATgBUACAATABJAEMARQBOAFMARQAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAgAC0AIAAyADYAIABGAGUAYgByAHUAYQByAHkAIAAyADAAMAA3AA0ACgAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ALQAtAC0ADQAKAA0ACgBQAFIARQBBAE0AQgBMAEUADQAKAFQAaABlACAAZwBvAGEAbABzACAAbwBmACAAdABoAGUAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUAIAAoAE8ARgBMACkAIABhAHIAZQAgAHQAbwAgAHMAdABpAG0AdQBsAGEAdABlACAAdwBvAHIAbABkAHcAaQBkAGUAIABkAGUAdgBlAGwAbwBwAG0AZQBuAHQAIABvAGYAIABjAG8AbABsAGEAYgBvAHIAYQB0AGkAdgBlACAAZgBvAG4AdAAgAHAAcgBvAGoAZQBjAHQAcwAsACAAdABvACAAcwB1AHAAcABvAHIAdAAgAHQAaABlACAAZgBvAG4AdAAgAGMAcgBlAGEAdABpAG8AbgAgAGUAZgBmAG8AcgB0AHMAIABvAGYAIABhAGMAYQBkAGUAbQBpAGMAIABhAG4AZAAgAGwAaQBuAGcAdQBpAHMAdABpAGMAIABjAG8AbQBtAHUAbgBpAHQAaQBlAHMALAAgAGEAbgBkACAAdABvACAAcAByAG8AdgBpAGQAZQAgAGEAIABmAHIAZQBlACAAYQBuAGQAIABvAHAAZQBuACAAZgByAGEAbQBlAHcAbwByAGsAIABpAG4AIAB3AGgAaQBjAGgAIABmAG8AbgB0AHMAIABtAGEAeQAgAGIAZQAgAHMAaABhAHIAZQBkACAAYQBuAGQAIABpAG0AcAByAG8AdgBlAGQAIABpAG4AIABwAGEAcgB0AG4AZQByAHMAaABpAHAADQAKAHcAaQB0AGgAIABvAHQAaABlAHIAcwAuAA0ACgANAAoAVABoAGUAIABPAEYATAAgAGEAbABsAG8AdwBzACAAdABoAGUAIABsAGkAYwBlAG4AcwBlAGQAIABmAG8AbgB0AHMAIAB0AG8AIABiAGUAIAB1AHMAZQBkACwAIABzAHQAdQBkAGkAZQBkACwAIABtAG8AZABpAGYAaQBlAGQAIABhAG4AZAAgAHIAZQBkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABmAHIAZQBlAGwAeQAgAGEAcwAgAGwAbwBuAGcAIABhAHMAIAB0AGgAZQB5ACAAYQByAGUAIABuAG8AdAAgAHMAbwBsAGQAIABiAHkAIAB0AGgAZQBtAHMAZQBsAHYAZQBzAC4AIABUAGgAZQAgAGYAbwBuAHQAcwAsACAAaQBuAGMAbAB1AGQAaQBuAGcAIABhAG4AeQAgAGQAZQByAGkAdgBhAHQAaQB2AGUAIAB3AG8AcgBrAHMALAAgAGMAYQBuACAAYgBlACAAYgB1AG4AZABsAGUAZAAsACAAZQBtAGIAZQBkAGQAZQBkACwAIAByAGUAZABpAHMAdAByAGkAYgB1AHQAZQBkACAAYQBuAGQALwBvAHIAIABzAG8AbABkACAAdwBpAHQAaAAgAGEAbgB5ACAAcwBvAGYAdAB3AGEAcgBlACAAcAByAG8AdgBpAGQAZQBkACAAdABoAGEAdAAgAGEAbgB5ACAAcgBlAHMAZQByAHYAZQBkACAAbgBhAG0AZQBzACAAYQByAGUAIABuAG8AdAAgAHUAcwBlAGQAIABiAHkAIABkAGUAcgBpAHYAYQB0AGkAdgBlACAAdwBvAHIAawBzAC4AIABUAGgAZQAgAGYAbwBuAHQAcwAgAGEAbgBkACAAZABlAHIAaQB2AGEAdABpAHYAZQBzACwAIABoAG8AdwBlAHYAZQByACwAIABjAGEAbgBuAG8AdAAgAGIAZQAgAHIAZQBsAGUAYQBzAGUAZAAgAHUAbgBkAGUAcgAgAGEAbgB5ACAAbwB0AGgAZQByACAAdAB5AHAAZQAgAG8AZgAgAGwAaQBjAGUAbgBzAGUALgAgAFQAaABlACAAcgBlAHEAdQBpAHIAZQBtAGUAbgB0ACAAZgBvAHIAIABmAG8AbgB0AHMAIAB0AG8AIAByAGUAbQBhAGkAbgAgAHUAbgBkAGUAcgAgAHQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAZABvAGUAcwAgAG4AbwB0ACAAYQBwAHAAbAB5ACAAdABvACAAYQBuAHkAIABkAG8AYwB1AG0AZQBuAHQAIABjAHIAZQBhAHQAZQBkACAAdQBzAGkAbgBnACAAdABoAGUAIABmAG8AbgB0AHMAIABvAHIAIAB0AGgAZQBpAHIAIABkAGUAcgBpAHYAYQB0AGkAdgBlAHMALgANAAoADQAKAEQARQBGAEkATgBJAFQASQBPAE4AUwANAAoAIgBGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACIAIAByAGUAZgBlAHIAcwAgAHQAbwAgAHQAaABlACAAcwBlAHQAIABvAGYAIABmAGkAbABlAHMAIAByAGUAbABlAGEAcwBlAGQAIABiAHkAIAB0AGgAZQAgAEMAbwBwAHkAcgBpAGcAaAB0ACAASABvAGwAZABlAHIAKABzACkAIAB1AG4AZABlAHIAIAB0AGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGEAbgBkACAAYwBsAGUAYQByAGwAeQAgAG0AYQByAGsAZQBkACAAYQBzACAAcwB1AGMAaAAuACAAVABoAGkAcwAgAG0AYQB5ACAAaQBuAGMAbAB1AGQAZQAgAHMAbwB1AHIAYwBlACAAZgBpAGwAZQBzACwAIABiAHUAaQBsAGQAIABzAGMAcgBpAHAAdABzACAAYQBuAGQAIABkAG8AYwB1AG0AZQBuAHQAYQB0AGkAbwBuAC4ADQAKAA0ACgAiAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACIAIAByAGUAZgBlAHIAcwAgAHQAbwAgAGEAbgB5ACAAbgBhAG0AZQBzACAAcwBwAGUAYwBpAGYAaQBlAGQAIABhAHMAIABzAHUAYwBoACAAYQBmAHQAZQByACAAdABoAGUAIABjAG8AcAB5AHIAaQBnAGgAdAAgAHMAdABhAHQAZQBtAGUAbgB0ACgAcwApAC4ADQAKAA0ACgAiAE8AcgBpAGcAaQBuAGEAbAAgAFYAZQByAHMAaQBvAG4AIgAgAHIAZQBmAGUAcgBzACAAdABvACAAdABoAGUAIABjAG8AbABsAGUAYwB0AGkAbwBuACAAbwBmACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGMAbwBtAHAAbwBuAGUAbgB0AHMAIABhAHMAIABkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABiAHkAIAB0AGgAZQAgAEMAbwBwAHkAcgBpAGcAaAB0ACAASABvAGwAZABlAHIAKABzACkALgANAAoADQAKACIATQBvAGQAaQBmAGkAZQBkACAAVgBlAHIAcwBpAG8AbgAiACAAcgBlAGYAZQByAHMAIAB0AG8AIABhAG4AeQAgAGQAZQByAGkAdgBhAHQAaQB2AGUAIABtAGEAZABlACAAYgB5ACAAYQBkAGQAaQBuAGcAIAB0AG8ALAAgAGQAZQBsAGUAdABpAG4AZwAsACAAbwByACAAcwB1AGIAcwB0AGkAdAB1AHQAaQBuAGcAIAAtAC0AIABpAG4AIABwAGEAcgB0ACAAbwByACAAaQBuACAAdwBoAG8AbABlACAALQAtACAAYQBuAHkAIABvAGYAIAB0AGgAZQAgAGMAbwBtAHAAbwBuAGUAbgB0AHMAIABvAGYAIAB0AGgAZQAgAE8AcgBpAGcAaQBuAGEAbAAgAFYAZQByAHMAaQBvAG4ALAAgAGIAeQAgAGMAaABhAG4AZwBpAG4AZwAgAGYAbwByAG0AYQB0AHMAIABvAHIAIABiAHkAIABwAG8AcgB0AGkAbgBnACAAdABoAGUAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAdABvACAAYQAgAG4AZQB3ACAAZQBuAHYAaQByAG8AbgBtAGUAbgB0AC4ADQAKAA0ACgAiAEEAdQB0AGgAbwByACIAIAByAGUAZgBlAHIAcwAgAHQAbwAgAGEAbgB5ACAAZABlAHMAaQBnAG4AZQByACwAIABlAG4AZwBpAG4AZQBlAHIALAAgAHAAcgBvAGcAcgBhAG0AbQBlAHIALAAgAHQAZQBjAGgAbgBpAGMAYQBsACAAdwByAGkAdABlAHIAIABvAHIAIABvAHQAaABlAHIAIABwAGUAcgBzAG8AbgAgAHcAaABvACAAYwBvAG4AdAByAGkAYgB1AHQAZQBkACAAdABvACAAdABoAGUAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlAC4ADQAKAA0ACgBQAEUAUgBNAEkAUwBTAEkATwBOACAAJgAgAEMATwBOAEQASQBUAEkATwBOAFMADQAKAFAAZQByAG0AaQBzAHMAaQBvAG4AIABpAHMAIABoAGUAcgBlAGIAeQAgAGcAcgBhAG4AdABlAGQALAAgAGYAcgBlAGUAIABvAGYAIABjAGgAYQByAGcAZQAsACAAdABvACAAYQBuAHkAIABwAGUAcgBzAG8AbgAgAG8AYgB0AGEAaQBuAGkAbgBnACAAYQAgAGMAbwBwAHkAIABvAGYAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALAAgAHQAbwAgAHUAcwBlACwAIABzAHQAdQBkAHkALAAgAGMAbwBwAHkALAAgAG0AZQByAGcAZQAsACAAZQBtAGIAZQBkACwAIABtAG8AZABpAGYAeQAsACAAcgBlAGQAaQBzAHQAcgBpAGIAdQB0AGUALAAgAGEAbgBkACAAcwBlAGwAbAAgAG0AbwBkAGkAZgBpAGUAZAAgAGEAbgBkACAAdQBuAG0AbwBkAGkAZgBpAGUAZAAgAGMAbwBwAGkAZQBzACAAbwBmACAAdABoAGUAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACwAIABzAHUAYgBqAGUAYwB0ACAAdABvACAAdABoAGUAIABmAG8AbABsAG8AdwBpAG4AZwAgAGMAbwBuAGQAaQB0AGkAbwBuAHMAOgANAAoADQAKADEAKQAgAE4AZQBpAHQAaABlAHIAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABuAG8AcgAgAGEAbgB5ACAAbwBmACAAaQB0AHMAIABpAG4AZABpAHYAaQBkAHUAYQBsACAAYwBvAG0AcABvAG4AZQBuAHQAcwAsACAAaQBuACAATwByAGkAZwBpAG4AYQBsACAAbwByACAATQBvAGQAaQBmAGkAZQBkACAAVgBlAHIAcwBpAG8AbgBzACwAIABtAGEAeQAgAGIAZQAgAHMAbwBsAGQAIABiAHkAIABpAHQAcwBlAGwAZgAuAA0ACgANAAoAMgApACAATwByAGkAZwBpAG4AYQBsACAAbwByACAATQBvAGQAaQBmAGkAZQBkACAAVgBlAHIAcwBpAG8AbgBzACAAbwBmACAAdABoAGUAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAbQBhAHkAIABiAGUAIABiAHUAbgBkAGwAZQBkACwAIAByAGUAZABpAHMAdAByAGkAYgB1AHQAZQBkACAAYQBuAGQALwBvAHIAIABzAG8AbABkACAAdwBpAHQAaAAgAGEAbgB5ACAAcwBvAGYAdAB3AGEAcgBlACwAIABwAHIAbwB2AGkAZABlAGQAIAB0AGgAYQB0ACAAZQBhAGMAaAAgAGMAbwBwAHkAIABjAG8AbgB0AGEAaQBuAHMAIAB0AGgAZQAgAGEAYgBvAHYAZQAgAGMAbwBwAHkAcgBpAGcAaAB0ACAAbgBvAHQAaQBjAGUAIABhAG4AZAAgAHQAaABpAHMAIABsAGkAYwBlAG4AcwBlAC4AIABUAGgAZQBzAGUAIABjAGEAbgAgAGIAZQAgAGkAbgBjAGwAdQBkAGUAZAAgAGUAaQB0AGgAZQByACAAYQBzACAAcwB0AGEAbgBkAC0AYQBsAG8AbgBlACAAdABlAHgAdAAgAGYAaQBsAGUAcwAsACAAaAB1AG0AYQBuAC0AcgBlAGEAZABhAGIAbABlACAAaABlAGEAZABlAHIAcwAgAG8AcgAgAGkAbgAgAHQAaABlACAAYQBwAHAAcgBvAHAAcgBpAGEAdABlACAAbQBhAGMAaABpAG4AZQAtAHIAZQBhAGQAYQBiAGwAZQAgAG0AZQB0AGEAZABhAHQAYQAgAGYAaQBlAGwAZABzACAAdwBpAHQAaABpAG4AIAB0AGUAeAB0ACAAbwByACAAYgBpAG4AYQByAHkAIABmAGkAbABlAHMAIABhAHMAIABsAG8AbgBnACAAYQBzACAAdABoAG8AcwBlACAAZgBpAGUAbABkAHMAIABjAGEAbgAgAGIAZQAgAGUAYQBzAGkAbAB5ACAAdgBpAGUAdwBlAGQAIABiAHkAIAB0AGgAZQAgAHUAcwBlAHIALgANAAoADQAKADMAKQAgAE4AbwAgAE0AbwBkAGkAZgBpAGUAZAAgAFYAZQByAHMAaQBvAG4AIABvAGYAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABtAGEAeQAgAHUAcwBlACAAdABoAGUAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAoAHMAKQAgAHUAbgBsAGUAcwBzACAAZQB4AHAAbABpAGMAaQB0ACAAdwByAGkAdAB0AGUAbgAgAHAAZQByAG0AaQBzAHMAaQBvAG4AIABpAHMAIABnAHIAYQBuAHQAZQBkACAAYgB5ACAAdABoAGUAIABjAG8AcgByAGUAcwBwAG8AbgBkAGkAbgBnACAAQwBvAHAAeQByAGkAZwBoAHQAIABIAG8AbABkAGUAcgAuACAAVABoAGkAcwAgAHIAZQBzAHQAcgBpAGMAdABpAG8AbgAgAG8AbgBsAHkAIABhAHAAcABsAGkAZQBzACAAdABvACAAdABoAGUAIABwAHIAaQBtAGEAcgB5ACAAZgBvAG4AdAAgAG4AYQBtAGUAIABhAHMADQAKAHAAcgBlAHMAZQBuAHQAZQBkACAAdABvACAAdABoAGUAIAB1AHMAZQByAHMALgANAAoADQAKADQAKQAgAFQAaABlACAAbgBhAG0AZQAoAHMAKQAgAG8AZgAgAHQAaABlACAAQwBvAHAAeQByAGkAZwBoAHQAIABIAG8AbABkAGUAcgAoAHMAKQAgAG8AcgAgAHQAaABlACAAQQB1AHQAaABvAHIAKABzACkAIABvAGYAIAB0AGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABzAGgAYQBsAGwAIABuAG8AdAAgAGIAZQAgAHUAcwBlAGQAIAB0AG8AIABwAHIAbwBtAG8AdABlACwAIABlAG4AZABvAHIAcwBlACAAbwByACAAYQBkAHYAZQByAHQAaQBzAGUAIABhAG4AeQAgAE0AbwBkAGkAZgBpAGUAZAAgAFYAZQByAHMAaQBvAG4ALAAgAGUAeABjAGUAcAB0ACAAdABvACAAYQBjAGsAbgBvAHcAbABlAGQAZwBlACAAdABoAGUAIABjAG8AbgB0AHIAaQBiAHUAdABpAG8AbgAoAHMAKQAgAG8AZgAgAHQAaABlACAAQwBvAHAAeQByAGkAZwBoAHQAIABIAG8AbABkAGUAcgAoAHMAKQAgAGEAbgBkACAAdABoAGUAIABBAHUAdABoAG8AcgAoAHMAKQAgAG8AcgAgAHcAaQB0AGgAIAB0AGgAZQBpAHIAIABlAHgAcABsAGkAYwBpAHQAIAB3AHIAaQB0AHQAZQBuAA0ACgBwAGUAcgBtAGkAcwBzAGkAbwBuAC4ADQAKAA0ACgA1ACkAIABUAGgAZQAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUALAAgAG0AbwBkAGkAZgBpAGUAZAAgAG8AcgAgAHUAbgBtAG8AZABpAGYAaQBlAGQALAAgAGkAbgAgAHAAYQByAHQAIABvAHIAIABpAG4AIAB3AGgAbwBsAGUALAAgAG0AdQBzAHQAIABiAGUAIABkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABlAG4AdABpAHIAZQBsAHkAIAB1AG4AZABlAHIAIAB0AGgAaQBzACAAbABpAGMAZQBuAHMAZQAsACAAYQBuAGQAIABtAHUAcwB0ACAAbgBvAHQAIABiAGUAIABkAGkAcwB0AHIAaQBiAHUAdABlAGQAIAB1AG4AZABlAHIAIABhAG4AeQAgAG8AdABoAGUAcgAgAGwAaQBjAGUAbgBzAGUALgAgAFQAaABlACAAcgBlAHEAdQBpAHIAZQBtAGUAbgB0ACAAZgBvAHIAIABmAG8AbgB0AHMAIAB0AG8AIAByAGUAbQBhAGkAbgAgAHUAbgBkAGUAcgAgAHQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAZABvAGUAcwAgAG4AbwB0ACAAYQBwAHAAbAB5ACAAdABvACAAYQBuAHkAIABkAG8AYwB1AG0AZQBuAHQAIABjAHIAZQBhAHQAZQBkACAAdQBzAGkAbgBnACAAdABoAGUAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlAC4ADQAKAA0ACgBUAEUAUgBNAEkATgBBAFQASQBPAE4ADQAKAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAYgBlAGMAbwBtAGUAcwAgAG4AdQBsAGwAIABhAG4AZAAgAHYAbwBpAGQAIABpAGYAIABhAG4AeQAgAG8AZgAgAHQAaABlACAAYQBiAG8AdgBlACAAYwBvAG4AZABpAHQAaQBvAG4AcwAgAGEAcgBlACAAbgBvAHQAIABtAGUAdAAuAA0ACgANAAoARABJAFMAQwBMAEEASQBNAEUAUgANAAoAVABIAEUAIABGAE8ATgBUACAAUwBPAEYAVABXAEEAUgBFACAASQBTACAAUABSAE8AVgBJAEQARQBEACAAIgBBAFMAIABJAFMAIgAsACAAVwBJAFQASABPAFUAVAAgAFcAQQBSAFIAQQBOAFQAWQAgAE8ARgAgAEEATgBZACAASwBJAE4ARAAsACAARQBYAFAAUgBFAFMAUwAgAE8AUgAgAEkATQBQAEwASQBFAEQALAAgAEkATgBDAEwAVQBEAEkATgBHACAAQgBVAFQAIABOAE8AVAAgAEwASQBNAEkAVABFAEQAIABUAE8AIABBAE4AWQAgAFcAQQBSAFIAQQBOAFQASQBFAFMAIABPAEYAIABNAEUAUgBDAEgAQQBOAFQAQQBCAEkATABJAFQAWQAsACAARgBJAFQATgBFAFMAUwAgAEYATwBSACAAQQAgAFAAQQBSAFQASQBDAFUATABBAFIAIABQAFUAUgBQAE8AUwBFACAAQQBOAEQAIABOAE8ATgBJAE4ARgBSAEkATgBHAEUATQBFAE4AVAAgAE8ARgAgAEMATwBQAFkAUgBJAEcASABUACwAIABQAEEAVABFAE4AVAAsACAAVABSAEEARABFAE0AQQBSAEsALAAgAE8AUgAgAE8AVABIAEUAUgAgAFIASQBHAEgAVAAuACAASQBOACAATgBPACAARQBWAEUATgBUACAAUwBIAEEATABMACAAVABIAEUADQAKAEMATwBQAFkAUgBJAEcASABUACAASABPAEwARABFAFIAIABCAEUAIABMAEkAQQBCAEwARQAgAEYATwBSACAAQQBOAFkAIABDAEwAQQBJAE0ALAAgAEQAQQBNAEEARwBFAFMAIABPAFIAIABPAFQASABFAFIAIABMAEkAQQBCAEkATABJAFQAWQAsACAASQBOAEMATABVAEQASQBOAEcAIABBAE4AWQAgAEcARQBOAEUAUgBBAEwALAAgAFMAUABFAEMASQBBAEwALAAgAEkATgBEAEkAUgBFAEMAVAAsACAASQBOAEMASQBEAEUATgBUAEEATAAsACAATwBSACAAQwBPAE4AUwBFAFEAVQBFAE4AVABJAEEATAAgAEQAQQBNAEEARwBFAFMALAAgAFcASABFAFQASABFAFIAIABJAE4AIABBAE4AIABBAEMAVABJAE8ATgAgAE8ARgAgAEMATwBOAFQAUgBBAEMAVAAsACAAVABPAFIAVAAgAE8AUgAgAE8AVABIAEUAUgBXAEkAUwBFACwAIABBAFIASQBTAEkATgBHACAARgBSAE8ATQAsACAATwBVAFQAIABPAEYAIABUAEgARQAgAFUAUwBFACAATwBSACAASQBOAEEAQgBJAEwASQBUAFkAIABUAE8AIABVAFMARQAgAFQASABFACAARgBPAE4AVAAgAFMATwBGAFQAVwBBAFIARQAgAE8AUgAgAEYAUgBPAE0AIABPAFQASABFAFIAIABEAEUAQQBMAEkATgBHAFMAIABJAE4AIABUAEgARQAgAEYATwBOAFQAIABTAE8ARgBUAFcAQQBSAEUALgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAV8AAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAgEDAQQBBQEGAQcA/QD+AQgBCQEKAQsA/wEAAQwBDQEOAQ8BEAERARIBEwEUARUBFgEXARgA+AD5ARkBGgEbARwBHQEeAR8BIAEhASIBIwEkASUBJgD6ANcBJwEoASkBKgErASwBLQEuAS8BMAExAOIA4wEyATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+ALAAsQE/AUABQQFCAUMBRAFFAUYBRwFIAPsA/ADkAOUBSQFKAUsBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0AuwFeAV8BYAFhAOYA5wCmAWIBYwFkAWUBZgFnANgA4QDbANwA3QDgANkA3wFoAWkBagFrAWwBbQFuAW8AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAvgC/ALwBcACMAO8AwADBAXEHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24HRW1hY3JvbgdlbWFjcm9uBkVicmV2ZQZlYnJldmUKRWRvdGFjY2VudAplZG90YWNjZW50B0VvZ29uZWsHZW9nb25lawZFY2Fyb24GZWNhcm9uC0djaXJjdW1mbGV4C2djaXJjdW1mbGV4Ckdkb3RhY2NlbnQKZ2RvdGFjY2VudAxHY29tbWFhY2NlbnQMZ2NvbW1hYWNjZW50C0hjaXJjdW1mbGV4C2hjaXJjdW1mbGV4BEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlB2ltYWNyb24GSWJyZXZlB0lvZ29uZWsHaW9nb25lawtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMa2NvbW1hYWNjZW50BkxhY3V0ZQZsYWN1dGUMTGNvbW1hYWNjZW50DGxjb21tYWFjY2VudAZMY2Fyb24ETGRvdARsZG90Bk5hY3V0ZQZuYWN1dGUMTmNvbW1hYWNjZW50DG5jb21tYWFjY2VudAZOY2Fyb24GbmNhcm9uC25hcG9zdHJvcGhlB09tYWNyb24Hb21hY3JvbgZPYnJldmUGb2JyZXZlDU9odW5nYXJ1bWxhdXQNb2h1bmdhcnVtbGF1dAZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4DFRjb21tYWFjY2VudAx0Y29tbWFhY2NlbnQGVGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHQUVhY3V0ZQdhZWFjdXRlC09zbGFzaGFjdXRlC29zbGFzaGFjdXRlDFNjb21tYWFjY2VudAxzY29tbWFhY2NlbnQGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMGWWdyYXZlBnlncmF2ZQRFdXJvC2NvbW1hYWNjZW50AAABAAH//wAP","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
