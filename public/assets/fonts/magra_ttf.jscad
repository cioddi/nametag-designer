(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.magra_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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QXZBtUHgQgBCREKGQs1DAkMyQ0BDWkOJQ6tDx0PjQ/5EI0RUAAEAAAABAEKRQadTXw889QALA+gAAAAAyy0JygAAAADLLQnK/8//CQMhA60AAAAIAAIAAAAAAAACfQBjAAAAAAFNAAAAzQAAAQQARwFnAEECWwAeAcUAGALwAB4CfQApANQAQQE4AEEBOAAQAYwAIwHsACgA1v/3AUoALQD5ADwBOgASAkAAKAGYACoByAAtAdYAEwIcADcB6QAoAgcAMAHYACYCCQAtAg0AKAD5ADwA7wABAfIAMQH/ACgB8gAxAaUAGANVADkCFgAKAjMAWgIeADICZABaAfMAWgHYAFoCWgA3AnMAWgEUAFoBFP/PAgcAWgHKAFoC3QA9AnYAWgJyADICGABaAnEAMQIZAFoB5gAiAb4AAAJuAFUCAQACAwYACwH1AAgB3gAAAcsAGQEwAF8BOgASATAADwJhAEEB1v/7ATUAKAHhAB0CEABLAcsALQIVAC0B4QAtAU8AEgHqABICHwBQAPoAPAD6AAwB0wBLAPUASQMjAEgCHwBIAgwALQIUAEgCEAAtAW0ASAGtACUBXgAJAh8ASwGzAAwCqwARAaz//gGuAAUBlwATAVsALQEJAF8BWv/yAhMAKQEEAEYB4gA4AcsADwJqAC0BywAXAQkAXwICACsBeAAoAvgALQFxACQBugAoAjEAKAIWACgBVAAoAVgAIwHuACgBfAA3AWsAIwE1ACgCOQBVAlMAKwDOACMA8wAjAUkAKAGVACMBugAoAt8ACgLnAAoC6gAZAbIANgIWAAoCFgAKAhYACgIWAAoCFgAKAhYACgMZ/+wCHgAyAfMAWgHzAFoB8wBaAfMAWgEU/+oBFAA3ART/+wEUAAoCaQAQAnYAWgJyADICcgAyAnIAMgJyADICcgAyAhsAVQJyADICbgBVAm4AVQJuAFUCbgBVAd4AAAIYAFoCNQBVAeEAHQHhAB0B4QAdAeEAHQHhAB0B4QAdAuQAHQHLAC0B4QAtAeEALQHhAC0B4QAtAPr/4wD6AC8A+v/yAPoAAAIHADYCHwBIAgwALQIMAC0CDAAtAgwALQIMAC0CPAAoAgwALQIfAEsCHwBLAh8ASwIfAEsBrgAFAhUAUAGuAAUCFgAKAeEAHQIWAAoB4QAdAhYACgHhAB0CHgAyAcsALQIeADICHgAyAcsALQIeADIBywAtAmQAWgJRAC0CZAALAhoAMgHzAFoB4QAtAfMAWgHhAC0B8wBaAeEALQHzAFoB4QAtAfMAWgHhAC0CWgA3AeoAEgJaADcB6gASAloANwHqABICWgA3AeoAEgJzAFoCHwBQAn0AGQIfABQBFP/9APr/9QD6AB4BFP/zARQALwD6ABcBFABJAPoAUAIoAFoB2gA8ART/zwD6//gCBwBaAlgAgAHKAFoA9QA2AcoAWgD1ACoBygBaASoASQHKAFoBVABJAc8ADQEBABACdgBaAh8ASAJ2AFoCHwBIAnYAWgIfAEgCH//eAnYAWgIcAEgCcgAyAgwALQJyADICDAAtAnIAMgIMAC0DLgAyAykALQIZAFoBbQBIAhkAWgFtACsCGQBaAW0AHgHmACIBrQAlAeYAIgGtACUB5gAiAa0AJQHmACIBrQAlAb4AAAFeAAkBvgAAAWgACQHRAAoBbQAUAm4AVQIfAEsCbgBVAh8ASwJuAFUCHwBLAm4AVQIfAEsCbgBVAh8ASwJuAFUCHwBLAwYACwKrABEB3gAAAa4ABQHeAAABywAZAZcAEwHLABkBlwATAcsAGQGXABMBUQBQAcX/8QKAADECFgAtAn0AVQIuAEsCFgAKAeEAHQEUAAAA+v/4AnIAMgIMAC0CbgBVAh8ASwMZ/+wC5AAdAnIAMgIMAC0B5gAiAa0AJQD6AAwBeAAjAXgAIwFyACEA0QAoAP4AKADFAB4BkgAjAcIAIwIWAAoB4QAdAt0APQMjAEgDBgALAqsAEQMGAAsCqwARAwYACwKrABEB3gAAAa4ABQHeAAABrgAFAd4AAAGuAAUB3gAAAa4ABQH+AB4C+AAeAMIAKADCACcAwgAnAWAAMgFiACcBYgAnAdIAIwHdACgBgABBAqUAOwEGACgBBgAoAWr//QFmABYBYwAhAUEAGQF1ADIBPgAZAWIAKAF0AC0BuQAKAe0ADgK6ACABzAAcAewAEAJ8ABkB/gBKAj4APwInABICGgAoAigAOAIoADgCnwA1AfYAEgIXABIAAQAAA8j/CQAAA1X/z//MAyEAAQAAAAAAAAAAAAAAAAAAAY8AAgGcAZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAAAAAAAvAAAAAAAAAAAAAAAAcHlycwBAACD7AgPI/wkAAAPIAPcAAAABAAAAAAINArwAAAAgAAEAAAACAAAAAwAAABQAAwABAAAAFAAEAWAAAABUAEAABQAUAH4ArAEIASkBLAE2AX8BkgGhAbAB1AH/AhkCNwLHAt0DvB4BHj8ehR75IBQgGiAeICIgJiA6IEQgcCB5IKQgpyCsISIiEiIaIkgiYCJlJcr7Av//AAAAIAChAK4BCgErAS4BOAGSAaABrwHNAfwCGAI3AsYC2AO8HgAePh6AHvIgEyAYIBwgICAmIDkgRCBwIHQgoyCnIKshIiISIhoiSCJgImQlyvsB////4//B/8D/v/++/73/vP+q/53/kP90/03/Nf8Y/or+evy541jjHOLc4nDhV+FU4VPhUuFP4T3hNOEJ4Qbg3eDb4NjgY990323fQN8p3ybbwgaMAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA4ArgADAAEECQAAAK4AAAADAAEECQABAAoArgADAAEECQACAA4AuAADAAEECQADADgAxgADAAEECQAEAAoArgADAAEECQAFABoA/gADAAEECQAGAAoArgADAAEECQAHAFIBGAADAAEECQAIACABagADAAEECQAJACABagADAAEECQALADABigADAAEECQAMADABigADAAEECQANASABugADAAEECQAOADQC2gBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADEAMQAsACAARgBvAG4AdABGAHUAcgBvAHIAIAAoAGkAbgBmAG8AQABmAG8AbgB0AGYAdQByAG8AcgApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAATgBhAG0AZQBzACAAIgBNAGEAZwByAGEAIgAgACIATQBhAGcAcgBhACAAUAByAG8AIgBNAGEAZwByAGEAUgBlAGcAdQBsAGEAcgBWAGkAdgBpAGEAbgBhAE0AbwBuAHMAYQBsAHYAZQA6ACAATQBhAGcAcgBhADoAIAAyADAAMQAxAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEATQBhAGcAcgBhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAVgBpAHYAaQBhAG4AYQAgAE0AbwBuAHMAYQBsAHYAZQAuAFYAaQB2AGkAYQBuAGEAIABNAG8AbgBzAGEAbAB2AGUAaAB0AHQAcAA6AC8ALwB3AHcAdwAuAGYAbwBuAHQAZgB1AHIAbwByAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAABjwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMBBAEFAQYBBwD9AP4BCAEJAQoA/wEAAQsBDAENAQEBDgEPARABEQESARMBFAEVARYBFwEYARkA+AD5ARoBGwEcAR0BHgEfASABIQEiASMBJAElASYBJwD6ANcBKAEpASoBKwEsAS0BLgEvATABMQEyATMBNAE1AOIA4wE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRACwALEBRQFGAUcBSAFJAUoBSwFMAU0BTgD7APwA5ADlAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsBXAFdAV4BXwFgAWEBYgFjAWQAuwFlAWYBZwFoAOYA5wFpAKYBagFrAWwBbQFuAW8BcAFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfADYAOEA2wDcAN0A4ADZAN8BfQF+AX8BgAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAvgC/ALwBjwGQAZEBkgGTAZQBlQD3AZYBlwGYAZkAjADvAKUApwCPAJQAlQC5AMAAwQdBbWFjcm9uB2FtYWNyb24GQWJyZXZlBmFicmV2ZQdBb2dvbmVrB2FvZ29uZWsLQ2NpcmN1bWZsZXgKQ2RvdGFjY2VudApjZG90YWNjZW50BkRjYXJvbgZkY2Fyb24GRGNyb2F0B0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQMR2NvbW1hYWNjZW50DGdjb21tYWFjY2VudAtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdpbWFjcm9uBklicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMS2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlDExjb21tYWFjY2VudAxsY29tbWFhY2NlbnQGTGNhcm9uBmxjYXJvbgRMZG90BGxkb3QGTmFjdXRlBm5hY3V0ZQxOY29tbWFhY2NlbnQMbmNvbW1hYWNjZW50Bk5jYXJvbgZuY2Fyb24LbmFwb3N0cm9waGUDRW5nA2VuZwdPbWFjcm9uB29tYWNyb24GT2JyZXZlBm9icmV2ZQ1PaHVuZ2FydW1sYXV0DW9odW5nYXJ1bWxhdXQGUmFjdXRlBnJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQtTY2lyY3VtZmxleAtzY2lyY3VtZmxleAhUY2VkaWxsYQh0Y2VkaWxsYQZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQFbG9uZ3MFT2hvcm4Fb2hvcm4FVWhvcm4FdWhvcm4GQWNhcm9uBmFjYXJvbgZJY2Fyb24GaWNhcm9uBk9jYXJvbgZvY2Fyb24GVWNhcm9uBnVjYXJvbgdBRWFjdXRlB2FlYWN1dGULT3NsYXNoYWN1dGULb3NsYXNoYWN1dGUMU2NvbW1hYWNjZW50DHNjb21tYWFjY2VudAhkb3RsZXNzagpBcmluZ2JlbG93CmFyaW5nYmVsb3cGTWFjdXRlBm1hY3V0ZQZXZ3JhdmUGd2dyYXZlBldhY3V0ZQZ3YWN1dGUJV2RpZXJlc2lzCXdkaWVyZXNpcwZZZ3JhdmUGeWdyYXZlB3VuaTFlRjQHdW5pMUVGNQd1bmkxRUY2B3VuaTFFRjcGWXRpbGRlBnl0aWxkZQx6ZXJvc3VwZXJpb3IMZm91cnN1cGVyaW9yDGZpdmVzdXBlcmlvcgtzaXhzdXBlcmlvcg1zZXZlbnN1cGVyaW9yDWVpZ2h0c3VwZXJpb3IMbmluZXN1cGVyaW9yBGxpcmEGcGVzZXRhBGRvbmcERXVybwAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAwGOAAEAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
