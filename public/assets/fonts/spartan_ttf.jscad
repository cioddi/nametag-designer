(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.spartan_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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BQYA1wUGAEoCQQDAAkEA1wJBAMoCQf+xAkH/2wJBAMECQQCCAkH/iAJBAGACQv+cBE4A1wROANcCQQDXAkEAygJB/7ECQQDUAo0AaAfFANcFBgDXBQYA1wUGANcFBgDXBQIA1wUGAKcFgACJBYAAiQWAAIkFgACJBYAAiQWAAIkFgACJBYAAiQWAAIkJCACKBZ0A1wWdANcFnQCOA30A1wN9ANcDfQBmA30A1wPfAGoD3wBqA98AagPfAGoD3wBqBUUAcwLqAHwC6gB8AuoAFgLqAHwC6gB8BOsAxATrAMQE6wDEBOsAxATrAMQE6wDEBOsAxATrAMQE6wDEBMIAQAekAEAHpABAB6QAQAekAEAHpABABJkAPgTQAD8E0AA/BNAAPwTQAD8E0AA/BK4AUASuAFAErgBQBK4AUAU5AKIGIwCkBboAYgZvAJoHGwCsA9UAYgUjAKID9wCBBIgAmQQiAKgD7QCaBkwBDQS4AIwF2wEmBQsA1waXAKsCvQCHBa0AfgU6AHcFRwA9BawAgAWtAJAE8AB0BWAApAWtAI4FZgCWAukBkAWtAR8FegFdBOkAigWsARsE7ADLBPMBYQVgAUUFrQEqBbAAzgNeAOUFrQEfBToBIQVHAOgFrAEbBa0BLASnARYFYAFFBa0BKgGdAGwClABVAnYAVgIbABkAQf25A58A5QlMAOULawDOCRkA5QtnAR8IiADlCmQBIQlLAOULmQEfCycBIQs0AOgIiwDlCtgBGwiSAOUI/wDlCtsBIQtNARsKSAEWCUwA5QvuAOUC+wEXAtYBBQLcAQYC1AEFBb8BFwLeAQgC3wEJBTYAlwU1AK0C+wEXA1MBCgOXAOUFogDDBBEAMQQRADEC8ACnAvAAdwMGAKUDBgB8AxMBAwMTAG0EMwDXBDMA1wUSANcIUgDXBbEA1wLWANgDaQDSA4YA2gOEAOECeQDVAncA2wQ8AIIENQDzAvEAggLxAJADagD1AoMA9QICAAACAgAAAgIAAAVIAOMEyQB/Bc0AvwezANsDqf+cBrUA3wZ7ALoFmADMBocBQwUoAMoFlAC0BocBQwXnAPUF4gDeBeIAvgYGAO8GBgDQBcgA5AZrAUMF7QD6BZgAzATwALUIYQCJBLAAfwOp/5wFiQENBYkBDQaLAQ0FpACQBdsBJgiOALsMUwC7BLAAbghHANoHBQDDBdwAxgXEAMcIQgDZBWwA7AV+AM0D4AEcAwgBQwMIAUMEkgC2BMwA1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABHwAAARoAAAAAAAAAAAKKAAAAwAAAAWwAAAFsAAACzwAAAt8AAALfAAADNwAAAdEAAAP3AAADMAAAAfYAAAIOAAAAAAAABBEAMQABAAAGuP34AAAMnv2e/EQLrwABAAAAAAAAAAAAAAAAAAABngAEBUIBkAAFAAACigJYAAAASwKKAlgAAAFeAGQCZgAAAAAAAAAAAAAAAKAAAO9AACBbAAAAAAAAAABOT05FAMAAAPsCBrj9+ACCCV4CUCAAAJMAAAAABAIGcgAAACAAAwAAAAIAAAADAAAAFAADAAEAAAAUAAQErAAAAH4AQAAFAD4AAAANAC8AOQB+AQcBEwEbASMBJwErATEBNwE+AUgBTQFbAWcBawF+AZICGwLHAt0DBAMIAwwDEgMoA5QDqQO8A8AehR6eHvMgFCAaIB4gIiAmIDAgOiBEIHQgrCEiIV8hiSICIgUiDyISIhUiGiIeIisiSCJgImUlyvsC//8AAAAAAA0AIAAwADoAoAEKARYBHgEmASoBLgE2ATkBQQFKAVABXgFqAW4BkgIYAsYC2AMAAwYDCgMSAyYDlAOpA7wDwB6AHp4e8iATIBggHCAgICYgMCA5IEQgdCCsISIhUCGJIgIiBSIPIhEiFSIaIh4iKyJIImAiZCXK+wH//wGcAUUAAADDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xQAA/s4AAAAAAAAAAP55/mb9W/1H/TX9MgAA4bUAAOEuAAAAAAAA4QjhQuET4NHgoOCq4FgAAN+P323fZd9dAADfiN9U30vfQN8d3v8AANupBeoAAQAAAAAAegAAAJYBHgHsAf4CCAISAhQCFgIcAh4CKAI2AjwCUgJkAmYAAAKEAAACiAKSApoCngAAAAAAAAAAAAAAAAKWAAACngAAAp4CogKmAAAAAAAAAAAAAAAAAAACnAAAAAAAAAAAArIAAAAAAAAAAAAAAAACqAAAAAAAAAFQAS8BTgE2AVUBcQF1AU8BOQE6ATUBWgErAT8BKgE3ASwBLQFhAV4BYAExAXQAAQAMAA0AEgAWAB8AIAAkACYALgAvADEANgA3AD0ARwBJAEoATgBUAFkAYgBjAGgAaQBuAT0BOAE+AWgBQwGRAHIAfQB+AIMAhwCQAJEAlQCXAKAAoQCjAKgAqQCvALkAuwC8AMAAxgDLANQA1QDaANsA4AE7AXwBPAFmAVEBMAFTAVgBVAFZAX0BdwGPAXgA7QFKAWcBQAF5AZkBewFkARIBEwGSAXABdgEzAZoBEQDuAUsBGwEXARwBMgAGAAIABAAKAAUACQALABAAHAAXABkAGgArACcAKAApABMAPABBAD4APwBFAEABXABEAF0AWgBbAFwAagBIAMUAdwBzAHUAewB2AHoAfACBAI0AiACKAIsAnQCZAJoAmwCEAK4AswCwALEAtwCyAV0AtgDPAMwAzQDOANwAugDeAAcAeAADAHQACAB5AA4AfwARAIIADwCAABQAhQAVAIYAHQCOABsAjAAeAI8AGACJACEAkgAjAJQAIgCTACUAlgAsAJ4ALQCfACoAmAAwAKIAMgCkADQApgAzAKUANQCnADgAqgA6AKwAOQCrADsArQBDALUAQgC0AEYAuABLAL0ATQC/AEwAvgBPAMEAUQDDAFAAwgBXAMkAVgDIAFUAxwBfANEAYQDTAF4A0ABgANIAZQDXAGsA3QBsAG8A4QBxAOMAcADiAFIAxABYAMoBlgGQAZcBmwGYAZMBggGDAYUBiQGKAYcBgQGAAYgBhAGGAGcA2QBkANYAZgDYAG0A3wFIAUkBRAFGAUcBRQF+AX8BNAEjASgBKQEZARoBHQEeAR8BIAEhASIBJAElASYBJwEWAW0BWwFjAWK4Af+FsASNAAAAABAAxgADAAEECQAAAKQAAAADAAEECQABAA4ApAADAAEECQACAA4AsgADAAEECQADADQAwAADAAEECQAEAB4A9AADAAEECQAFABoBEgADAAEECQAGAB4BLAADAAEECQAIABYBSgADAAEECQAJADwBYAADAAEECQALADYBnAADAAEECQAMACYB0gADAAEECQANASAB+AADAAEECQAOADQDGAADAAEECQEAAAwDTAADAAEECQEEAA4AsgADAAEECQEKAAoDWABDAG8AcAB5AHIAaQBnAGgAdAAgADIAMAAyADAAIABUAGgAZQAgAFMAcABhAHIAdABhAG4AIABQAHIAbwBqAGUAYwB0ACAAQQB1AHQAaABvAHIAcwAgACgAaAB0AHQAcABzADoALwAvAGcAaQB0AGgAdQBiAC4AYwBvAG0ALwBiAGcAaAByAHkAYwB0AC8AUwBwAGEAcgB0AGEAbgAtAE0AQgApAFMAcABhAHIAdABhAG4AUgBlAGcAdQBsAGEAcgAxAC4AMAAwADMAOwBOAE8ATgBFADsAUwBwAGEAcgB0AGEAbgAtAFIAZQBnAHUAbABhAHIAUwBwAGEAcgB0AGEAbgAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBTAHAAYQByAHQAYQBuAC0AUgBlAGcAdQBsAGEAcgBNAGEAdAB0ACAAQgBhAGkAbABlAHkATQBhAHQAdAAgAEIAYQBpAGwAZQB5ACwAIABNAGkAcgBrAG8AIABWAGUAbABpAG0AaQByAG8AdgBpAGMAaAB0AHQAcAA6AC8ALwBtAGkAcgBrAG8AdgBlAGwAaQBtAGkAcgBvAHYAaQBjAC4AYwBvAG0AaAB0AHQAcAA6AC8ALwBtAHQAYgBhAGkAbABlAHkALgBjAG8AbQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAVwBlAGkAZwBoAHQAUgBvAG0AYQBuAAIAAAAAAAD/agBkAAAAAAAAAAAAAAAAAAAAAAAAAAABngAAACQAyQECAMcAYgCtAQMBBABjAK4AkAAlACYA/QD/AGQBBQAnAOkBBgEHACgAZQEIAMgAygEJAMsBCgELACkAKgD4AQwBDQArAQ4ALADMAM0AzgD6AM8BDwEQAC0ALgERAC8BEgETARQA4gAwADEBFQEWARcBGABmADIA0ADRAGcA0wEZARoAkQCvALAAMwDtADQANQEbARwBHQA2AR4A5AD7AR8BIAA3ASEBIgEjASQAOADUANUAaADWASUBJgEnASgAOQA6ASkBKgErASwAOwA8AOsBLQC7AS4APQEvAOYBMABEAGkBMQBrAGwAagEyATMAbgBtAKAARQBGAP4BAABvATQARwDqATUBAQBIAHABNgByAHMBNwBxATgBOQBJAEoA+QE6ATsASwE8AEwA1wB0AHYAdwE9AHUBPgE/AE0ATgFAAE8BQQFCAUMA4wBQAFEBRAFFAUYBRwB4AFIAeQB7AHwAegFIAUkAoQB9ALEAUwDuAFQAVQFKAUsBTABWAU0A5QD8AU4AiQBXAU8BUAFRAVIAWAB+AIAAgQB/AVMBVAFVAVYAWQBaAVcBWAFZAVoAWwBcAOwBWwC6AVwAXQFdAOcBXgFfAWABYQFiAWMBZAFlAMAAwQCdAJ4BZgFnAWgAmwATABQAFQAWABcAGAAZABoAGwAcAWkBagFrAWwBbQFuAW8BcAFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfAF9AX4BfwGAALwBgQD0AYIBgwGEAPUA9gGFAYYBhwGIAYkBigGLAYwBjQGOAY8BkAGRABEADwAdAB4AqwAEAKMAIgCiAMMAhwANAAYAEgA/AAsADABeAGAAPgBAABABkgCyALMAQgDEAMUAtAC1ALYAtwCpAKoAvgC/AAUACgADAZMBlACEAL0ABwGVAKYAhQCWAA4A7wDwALgAIACPACEAHwCVAJQAkwCnAGEApABBAJIBlgCcAJoAmQClAJgBlwAIAMYAuQAjAAkAiACGAIsAigCMAIMAXwDoAIIAwgGYAZkBmgGbAZwBnQGeAZ8BoAGhAaIBowGkAaUBpgCOANwAQwCNAN8A2ADhANsA3QDZANoA3gDgAacBqAZBYnJldmUHQW1hY3JvbgdBb2dvbmVrCkNkb3RhY2NlbnQGRGNhcm9uBkRjcm9hdAZFY2Fyb24KRWRvdGFjY2VudAdFbWFjcm9uB0VvZ29uZWsHdW5pMDEyMgpHZG90YWNjZW50BEhiYXIHSW1hY3JvbgdJb2dvbmVrB3VuaTAxMzYGTGFjdXRlBkxjYXJvbgd1bmkwMTNCBk5hY3V0ZQZOY2Fyb24HdW5pMDE0NQNFbmcNT2h1bmdhcnVtbGF1dAdPbWFjcm9uBlJhY3V0ZQZSY2Fyb24HdW5pMDE1NgZTYWN1dGUHdW5pMDIxOAd1bmkxRTlFBFRiYXIGVGNhcm9uB3VuaTAxNjIHdW5pMDIxQQ1VaHVuZ2FydW1sYXV0B1VtYWNyb24HVW9nb25lawVVcmluZwZXYWN1dGULV2NpcmN1bWZsZXgJV2RpZXJlc2lzBldncmF2ZQtZY2lyY3VtZmxleAZZZ3JhdmUGWmFjdXRlClpkb3RhY2NlbnQGYWJyZXZlB2FtYWNyb24HYW9nb25lawpjZG90YWNjZW50BmRjYXJvbgZlY2Fyb24KZWRvdGFjY2VudAdlbWFjcm9uB2VvZ29uZWsHdW5pMDEyMwpnZG90YWNjZW50BGhiYXIJaS5sb2NsVFJLB2ltYWNyb24HaW9nb25lawd1bmkwMTM3BmxhY3V0ZQZsY2Fyb24HdW5pMDEzQwZuYWN1dGUGbmNhcm9uB3VuaTAxNDYDZW5nDW9odW5nYXJ1bWxhdXQHb21hY3JvbgZyYWN1dGUGcmNhcm9uB3VuaTAxNTcGc2FjdXRlB3VuaTAyMTkEdGJhcgZ0Y2Fyb24HdW5pMDE2Mwd1bmkwMjFCDXVodW5nYXJ1bWxhdXQHdW1hY3Jvbgd1b2dvbmVrBXVyaW5nBndhY3V0ZQt3Y2lyY3VtZmxleAl3ZGllcmVzaXMGd2dyYXZlC3ljaXJjdW1mbGV4BnlncmF2ZQZ6YWN1dGUKemRvdGFjY2VudANmX2YFZl9mX2kFZl9mX2oFZl9mX2wFZl9mX3QDZl9qA2ZfdAd1bmkwMzk0B3VuaTAzQTkHdW5pMDNCQwl6ZXJvLmRub20Ib25lLmRub20IdHdvLmRub20KdGhyZWUuZG5vbQlmb3VyLmRub20JZml2ZS5kbm9tCHNpeC5kbm9tCnNldmVuLmRub20KZWlnaHQuZG5vbQluaW5lLmRub20JemVyby5udW1yCG9uZS5udW1yCHR3by5udW1yCnRocmVlLm51bXIJZm91ci5udW1yCWZpdmUubnVtcghzaXgubnVtcgpzZXZlbi5udW1yCmVpZ2h0Lm51bXIJbmluZS5udW1yB3VuaTAwQjkHdW5pMDBCMgd1bmkwMEIzB3VuaTIwNzQHdW5pMjE1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BRIFJAUqBPQFJAUqBPoFJAUqBPoFJAUqBQAFJAUqBQYFJAUqBQwFJAUqBRIFJAUqBRgFJAUqBR4FJAUqBg4FMAAABUIFVAAABTYFVAAABTwFVAAABUIFSAAABU4FVAAABVoFZgAABWAFZgAABZAFlgWcBWwFlgWcBXIFlgWcBXIFlgWcBXgFlgWcBX4FlgWcBYQFlgWcBYoFlgWcBZAFlgWcBaIFqAAABbQFxgAABa4FxgAABbQFugAABcAFxgAABcwF0gAABfwGAgYIBdgGAgYIBd4GAgYIBeQGAgYIBeoGAgYIBfAGAgYIBfYGAgYIBfwGAgYIBg4GFAAABiAGGgAABiAGJgAABj4GOAAABiwGOAAABjIGOAAABj4GRAAABkoGUAAABmIGdAAABlYGdAAABlwGdAAABmIGaAAABm4GdAAABnoGtga8BoAGtga8BpIGtga8BoYGtga8BowGtga8BpIGtga8BpgGtga8Bp4GpAaqBrAGtga8BsIGyAAABs4G1AAABs4G1AAABtoG4AAABvgG8gAABuYG8gAABuwG8gAABvgG/gAABxwHEAAABwQHEAAABwoHEAAABxwHFgAABxwHIgAABzoHLgAABygHLgAABzoHNAAABzoHQAAAB2QHcAd2B0YHcAd2B1gHcAd2B0wHcAd2B1IHcAd2B1gHcAd2B14HcAd2B2QHcAd2B2oHcAd2B3wHggAAB4gHpgAAB44HpgAAB5QHpgAAB5oHpgAAB6AHpgAAB6wHsgAAB7gH1gAAB74H1gAAB8QH1gAAB8oH1gAAB9AH1gAAB9wH9AAAB+IH9AAAB+gH9AAAB+4H9AAACBgIKggwB/oIKggwCAAIKggwCAAIKggwCAYIKggwCAwIKggwCBIIKggwCBgIKggwCB4IKggwCCQIKggwCDYIPAAACEIJzgAACFQIZgAACEgIZgAACE4IZgAACFQIWgAACGAIZgAACGwIeAAACHIIeAAACKIIqAiuCH4IqAiuCIQIqAiuCIQIqAiuCIoIqAiuCJAIqAiuCJYIqAiuCJwIqAiuCKIIqAiuCLQIugAACcgI0gAACMAI0gAACMYI0gAACMwI0gAACNgJaAAAAAAJLAAACN4JLAkICOQJLAkICOoJLAkICPAJLAkICQIJLAkICPYJLAkICPwJLAkICQIJLAkICRQJDgAACRQJGgAA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AAIBBQEPAAIBBgEQAAYAAAACAAoAHAADAAAAAQBUAAEALgABAAAAAwADAAAAAQBCAAIAFAAcAAEAAAAEAAEAAgGNAY4AAgABAYABiwAAAAEAAAABAAgAAQAUAAEAAQAAAAEACAABAAYABQABAAEAlwABAAAAAQAIAAEABgABAAEABABRAFcAwwDJAAEAAAABAAgAAQAGAB0AAgABAPQA9wAAAAEAAAABAAgAAQC0AAoAAQAAAAEACAABAAb/3gABAAEBNwABAAAAAQAIAAEAkgAUAAYAAAACAAoAIgADAAEAEgABAEIAAAABAAAADQABAAEBFQADAAEAEgABACoAAAABAAAADgACAAEA/QEGAAAAAQAAAAEACAABAAb/9gACAAEBBwEQAAAABgAAAAIACgAkAAMAAQAsAAEAEgAAAAEAAAAQAAEAAgABAHIAAwABABIAAQAcAAAAAQAAABAAAgABAPMA/AAAAAEAAgA9AK8AAQAAAAEACAACAA4ABADtAO4A7QDuAAEABAABAD0AcgCvAAQACAABAAgAAQBsAAEACAAEAAoAEgAaACAA5gADAJAAoADoAAMAkADGAOkAAgCgAOoAAgDGAAQACAABAAgAAQA2AAEACAAFAAwAFAAcACIAKADlAAMAkACXAOcAAwCQAKMA5AACAJAA6wACAJcA7AACAKMAAQABAJAAAQABAAgAAQAAABQAAQAAABwAAndnaHQBAAAAAAIAAQAAAAABBAGQAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
