(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ruluko_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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H7Af9yAkIHggrCDzISYhZCGfIcgh+CIWIkgiXyKEIsEi7SMYI10jgSOcI7sj3SQAJC8kbiSqJPAlKiVoJZsl2SYMJlImlibEJu8nHyc7J1AnZSd+J5gntyfFJ9In3yf0KAkoHShAKGMohSiVKLIoyyjlAAAAAQAAAAEAQqTMXAFfDzz1AAsD6AAAAADLLQnLAAAAAMstCcv/z/8PA18DkgAAAAgAAgAAAAAAAADSAAAAAAAAAU0AAADSAAAA7ABQAOAAHgJYAD0COgBZA2MAUALBADoAgAAeATIARgEyACgBLAAPAZkAMwDQADoBOwAzANAAPAFzAAACJgAyAiYAZAImAEECJgBEAiYARQImAE4CJgBHAiYATwImAD8CJgA2ANAAPADQADoBsQAzAa4AMwGxADMBaABBA6UARgI5ABYCVQBuAgwARgJyAG4B9QBuAdgAbgJQAEYCpABuASoAbgEzAAICMwBuAe0AbgM8AF0CqABuAq8ARgILAG4CwQBGAjsAbgHgACUBwgAKAooAYwIhAA4DSwAoAjcAHgHpAAwB8gAUAPMAPAFzAAAA8wAEAe4AHgITADMBCABSAhMANwINAFoBnAA2AhMANwGxADgBOAAoAhMAOAIhAFoBCABVAPz/zwHjAFoBCABcAxUAWgIhAFoCCAA4Ag8AUQIKADcBbABRAXsAKAFmACYCFQBOAb4AHgKgAB4BvwAaAhAATwGSAB4BMwA8ALAAPwEzAAQCTgBQAO0AUAGcADYCOgBvAc4APAI6ADkAsAA/A0EA9wIVAJEDKgAwAZoAPgIEADwCEwAzAjAAMAFfADgBmQAzAU0AJAFZACoBCABSAicAXAJ2ADwA0AA8AZwAnAE2ACQBjQA6AgQAPAOEAIEDhACBA4QAcAFUACMCOQAWAjkAFgI5ABYCOQAWAjkAFgI5ABYC0v/4AgkARgH8AHgB/AB4AfwAeAH8AHgBQwA4AUMAVwFDADEBQwA5AnwALQK8AHgCtQBJArUASQK1AEkCtQBJArUASQFlACMCrwBGAowAYwKMAGMCjABjAowAYwHlAAoDQQB4AiYAKAITADcCEwA3AhMANwITADcCEwA3AhMANwKzADcBnAA2AbEAOAGxADgBsQA4AbEAOAEIABQBCABNAQgADgEIABMCAgA1AiEAWgIIADgCCAA4AggAOAIIADgCCAA4AZEAMwIIADgCFQBOAhUATgIVAE4CFQBOAhAATwINAFoCEABPAjkAFgITADcB/AB4AbEANgJIAEEBpAA8AYQALAFDADsBCABDAQgAXAKCAHoCBABVAT8AAgEv/88B4wBaAcoATQH3AHgBkABcAccADAEI//gCvAB4AiEAWgNBAEYC9wA4AkUAeAJFAHgBbwBRAkUAeAFQAE4B4AAlAXsAKAHlAAoB8gAUAZIAHgD8/88BCAAMAQgADQITAK0CEwFuAiEAgADQADwBqQAzAgMAMwCZAB4AmQAeAJkAHgEKAB4BCgAeAQoAHgDuADwCcABJAWIAPAA8AAAAAQAAA5L/DwAAA6X/z//tA18AAQAAAAAAAAAAAAAAAAAAAPMAAgGaAZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAACAAABjAAAAAAAAAAAAAAAAcHlycwBAACAgOgOS/w8AAAOSAPEAAAABAAAAAAHWArIAAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEAPAAAAA4ACAABAAYAH4ArACuAP8BBQEZASkBLwE1ATgBRAFUAVkBYQF4AX4CNwLHAtwDBwO8IBQgGiAeICIgJiA6//8AAAAgAKEArgCwAQQBGAEnAS4BMQE3AT8BUgFWAWABeAF9AjcCxgLaAwcDvCATIBggHCAiICYgOf///+P/wf/A/7//u/+p/5z/mP+X/5b/kP+D/4L/fP9m/2L+qv4c/gr94Py44NXg0uDR4M7gy+C5AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBI0AAAAADACWAAMAAQQJAAABHgAAAAMAAQQJAAEADAEeAAMAAQQJAAIADgEqAAMAAQQJAAMAbAE4AAMAAQQJAAQADAEeAAMAAQQJAAUAGgGkAAMAAQQJAAYADAEeAAMAAQQJAAgAXAG+AAMAAQQJAAkAWgIaAAMAAQQJAAwAMAJ0AAMAAQQJAA0BIAKkAAMAAQQJAA4ANAPEAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABBAG4AYQAgAFMAYQBuAGYAZQBsAGkAcABwAG8ALAAgAEEAbgBnAGUAbABpAGMAYQAgAEQAaQBhAHoAIAB5ACAATQBlAG0AZQAgAEgAZQByAG4AYQBuAGQAZQB6ACAAKABhAG4AYQBzAGEAbgBmAGUAQABnAG0AYQBpAGwALgBjAG8AbQAgAC0AIABhAG4AZwBpAGUAYwBpAG4AYQBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIAUgB1AGwAdQBrAG8AIgBSAHUAbAB1AGsAbwBSAGUAZwB1AGwAYQByAEEAbgBhAFMAYQBuAGYAZQBsAGkAcABwAG8ALABBAG4AZwBlAGwAaQBjAGEARABpAGEAegB5AE0AZQBtAGUASABlAHIAbgBhAG4AZABlAHoAOgAgAFIAdQBsAHUAawBvADoAIAAyADAAMAA5AFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEAQQBuAGEAIABTAGEAbgBmAGUAbABpAHAAcABvACwAIABBAG4AZwBlAGwAaQBjAGEAIABEAGkAYQB6ACAAeQAgAE0AZQBtAGUAIABIAGUAcgBuAGEAbgBkAGUAegBBAG4AYQAgAFMAYQBuAGYAZQBsAGkAcABwAG8ALAAgAEEAbgBnAGUAbABpAGMAYQAgAEQAaQBhAHoALAAgAE0AZQBtAGUAIABIAGUAcgBuAGEAbgBkAGUAegB3AHcAdwAuAGEAbgBhAHMAYQBuAGYAZQBsAGkAcABwAG8ALgBjAG8AbQAuAGEAcgBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAPQAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQIBAwEEAQUBBgEHAQgBCQEKANcBCwEMAQ0BDgEPARABEQESAOIA4wETARQAsACxARUBFgEXARgBGQDkAOUAuwDmAOcBGgDYAOEA3QDgANkBGwCyALMAtgC3AMQAtAC1AMUAhwCrAL4AvwdBb2dvbmVrB2FvZ29uZWsHRW9nb25lawdlb2dvbmVrBGhiYXIGSXRpbGRlBml0aWxkZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwpMZG90YWNjZW50BGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uCGRvdGxlc3NqDGRvdGFjY2VudGNtYgABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAPMAAQAAAAEAAAAKAB4ALAABREZMVAAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQAMAAQAAAABABIAAQABAH4AAQAtABQAAQAAAAoAHAAeAAFERkxUAAgABAAAAAD//wAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
