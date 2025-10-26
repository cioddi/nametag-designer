(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stardos_stencil_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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/30ANwDZ/94AOQAP/1AAOQAQ/9UAOQAR/1AAOQAd/6gAOQAe/6gAOQAk/vkAOQBE/1AAOQBI/1AAOQBS/1AAOQBV/9UAOQBY/9UAOQCC/vkAOQCD/vkAOQCE/vkAOQCF/vkAOQCG/vkAOQCH/vkAOQCI/vkAOQCi/3oAOQCj/1AAOQCk/3oAOQCl/3oAOQCm/6gAOQCn/3oAOQCo/1AAOQCq/3oAOQCr/1AAOQCs/1AAOQCt/6gAOQC0/1AAOQC1/1AAOQC2/1AAOQC3/1AAOQC4/3oAOQC6/1AAOQC7/9UAOQC8/9UAOQC9/9UAOQC+/9UAOQDS/1AAOgAP/1AAOgAQ/9UAOgAR/1AAOgAd/9UAOgAe/9UAOgAk/yYAOgBE/1AAOgBI/1AAOgBS/1AAOgCC/yYAOgCD/yYAOgCE/yYAOgCF/yYAOgCG/yYAOgCH/yYAOgCI/yYAOgCi/1AAOgCj/1AAOgCk/1AAOgCl/1AAOgCm/3oAOgCn/1AAOgCo/1AAOgCq/1AAOgCr/1AAOgCs/1AAOgCt/1AAOgC0/1AAOgC1/1AAOgC2/1AAOgC3/1AAOgC4/3oAOgC6/1AAOgDS/1AAPAAP/30APAAQ/6gAPAAR/30APAAd/6gAPAAe/6gAPAAk/6gAPABE/30APABI/1AAPABS/1AAPABT/9UAPABU/30APABY/9UAPAC4/3oASQEOAFgAVQAP/1AAVQAQ/9UAVQAR/1AAWQAP/30AWQAR/30AWgAP/6gAWgAR/6gAXAAP/30AXAAR/30AggA3/6gAggA5/yYAggA6/1AAggBZ/6gAggBa/6gAggEO/yYAgwA3/6gAgwA5/yYAgwA6/1AAgwBZ/6gAgwBa/6gAgwEO/yYAhAA3/6gAhAA5/yYAhAA6/1AAhABZ/6gAhABa/6gAhAEO/yYAhQA3/6gAhQA5/yYAhQA6/1AAhQBZ/6gAhQBa/6gAhQEO/yYAhgA3/6gAhgA5/yYAhgA6/1AAhgBZ/6gAhgBa/6gAhgEO/yYAhwA3/6gAhwA5/yYAhwA6/1AAhwBZ/6gAhwBa/6gAhwEO/yYAnwAP/30AnwAQ/6gAnwAR/30AnwAd/6gAnwAe/6gAnwAk/6gAnwBE/30AnwBI/1AAnwBS/1AAnwBT/9UAnwBU/30AnwBY/9UAnwC4/3oAvwAP/30AvwAR/30AwQAP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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
