(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.lilita_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ALwAAAEfAC0BzABBA0EAWgITACIDHgAjApsALAEtAEYBrgBfAaYAXwItAFECWgAlATEANQINACMA5QAUAj0AAAJ/ACMBlgAPAg0AKwIQABQCVgAJAgwAKwI/ACMB9AAYAjoAGwI1ACgBFQA6ARUADQHkADQCRABDAcIAMwJIAEIDYwAnAo8ADwJSAD0CMQAeAmgAMgHtADIB2AAtAm0AHgKEADIBrQARAc4ACQJsADIBswAoA4sAMgKIADICuAAeAjoALgLCAB4CTgAyAhMAHQH2AAUCdAAeApUACwO5ABUCqwASAmf/9QIzACUBgQBQAksAEQGBAB4CrwAsAnwALwFeAEcCBQAOAggAMgGoABoCNQAaAeYAGgF3ABQCBAAaAfUALQERAC0BD/+KAhMALQEQAC0DFAATAicAFAIBABoCKwATAf8AGgGMABQBwgAZAXAAEwIgACgCCQAGAvAACwItAA8CGQAKAcYAGQFqAB4CdAD9AWoAUAHLABUBHwAtAhAAIwHqAB0C2ABXApMAAAGfAJkCaQAoAckAJgK1AFQB+gBQAwUAWQJlAEMBxgAvAr0AVAGCACgCUwBDAWAANwExAB0BZQBHAjwAKAMMAB4BNQA6AZIAZAEbACkBbgAoAtwAWQNHAFEDUABTA2QARQJIAEECjwAOAo8ADgKPAA4CjwAOAo8ADgKPAA4DlQAiAiIADwHoAC0B6AAtAegALQHoAC0BsAASAbAAEgGwABIBsAASAmz/8wKRACsCuAAeArgAHgK4AB4CuAAeArgAHgJiAGUCuAAeAnQAHgJ0AB4CdAAeAnQAHgJn//UCUwAuAqAAUgIFAA4CBQAOAgUADgIFAA4CBQAOAgUADgKtAA4BqAAaAeYAGgHmABoB5gAaAeYAGgELABYBCwAVAQv/2QEL/8sCPgAoAicAFAIBABoCAQAaAgEAGgIBABoCAQAaAmMAJgIBABoCIAAoAiAAKAIgACgCIAAoAhkACgJ0AFwCDAAKAPkAJgHVAAUBfQAFA20AHgMGABoCGAAdAcIAGQJn//UCMwAlAcYAGQGm/6YB4ABIAeMASAGMAHABuAAVAdUALwMVAEMBVQBZAToARgFwADUCNABZAhIARgKLADUB2wAlAeAAJQFlAFMDjQA6A+4AIwHxAFkBuwBZATn/qwI+ADYDIwA1AlsAQwKIABQChwAUAAEAAAOb/yQAAAPu/4r/zwO5AAEAAAAAAAAAAAAAAAAAAADkAAIBpwGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAAAAAAAAAAAgAAAL0AAAEoAAAAAAAAAAFBZUlMAQAAg+wIDmv8lAAADmwDcAAAAAQAAAAAB+gLAAAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABADgAAAANAAgAAQAFAB+AK4A/wExAUIBUwFhAXgBfgGSAscC2gLcIBQgGiAeICIgJiAwIDogRCCsISIiEvsC//8AAAAgAKEAsAExAUEBUgFgAXgBfQGSAsYC2gLcIBMgGCAcICAgJiAwIDkgRCCsISIiEvsB////4//B/8D/j/+A/3H/Zf9P/0v/OP4F/fP98uC84LnguOC34LTgq+Cj4JrgM9++3s8F4QABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgB/4WwBI0AAAAADQCiAAMAAQQJAAAAvAAAAAMAAQQJAAEAFAC8AAMAAQQJAAIADgDQAAMAAQQJAAMAQADeAAMAAQQJAAQAFAC8AAMAAQQJAAUAGgEeAAMAAQQJAAYAEgE4AAMAAQQJAAcAUgFKAAMAAQQJAAgAHgGcAAMAAQQJAAkAHgGcAAMAAQQJAAwAIgG6AAMAAQQJAA0BIAHcAAMAAQQJAA4ANAL8AEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACAASgB1AGEAbgAgAE0AbwBuAHQAbwByAGUAYQBuAG8AIAAoAGoAdQBhAG4AQAByAGUAbQBvAGwAYQBjAGgAYQAuAGIAaQB6ACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQBzACAAIgBMAGkAbABpAHQAYQAgAE8AbgBlACIATABpAGwAaQB0AGEAIABPAG4AZQBSAGUAZwB1AGwAYQByAEoAdQBhAG4ATQBvAG4AdABvAHIAZQBhAG4AbwA6ACAATABpAGwAaQB0AGEAIABPAG4AZQA6ACAAMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyAEwAaQBsAGkAdABhAE8AbgBlAEwAaQBsAGkAdABhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAASgB1AGEAbgAgAE0AbwBuAHQAbwByAGUAYQBuAG8ALgBKAHUAYQBuACAATQBvAG4AdABvAHIAZQBhAG4AbwB3AHcAdwAuAHIAZQBtAG8AbABhAGMAaABhAC4AYgBpAHoAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADkAAAAAQACAAMABAAFAAYABwECAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA3QDZALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBBACMAO8AwADBB3VuaTAwMjUHdW5pMDBBRARFdXJvAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABAOMAAQAAAAEAAAAKAB4ALAABbGF0bgAIAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQAmAAQAAAAOAEYAYACWAKAArgC0AOYA7AEuAVgBbgG4Ae4CFAABAA4AJAApAC4ALwAwADMANAA3ADkAOgA8AEkATgBcAAYAN//nADn/2AA6/90APP/YAFn/8QBc//EADQAk/9MARP/dAEj/3QBQ/+wAUf/sAFL/3QBU/+IAVf/nAFb/5wBY/+cAW//dAFz/3QBd/+IAAgBZ//EAXP/xAAMAN//dADn/7AA8/90AAQA8/+wADAAk/8QALf/TADn/3QA8/90APf/xAET/5wBG/+wASP/sAEr/5wBS/+cAVP/nAFb/5wABADz/4gAQACT/5wAt/90ARP/nAEb/3QBI/90ASv/nAFD/7ABR/+wAUv/dAFT/3QBV//EAVv/nAFj/3QBZ/+IAWv/iAFz/7AAKACT/2AAt/+wARP/dAEb/3QBH/90ASP/dAEr/3QBS/90AVP/dAFz/5wAFACT/3QAt/+wAMv/sAET/7ABI/+cAEgAk/84ALf/YADD/7AA0/+wARP/iAEb/2ABH/9gASP/YAEr/2ABQ/90AUf/dAFL/2ABU/9gAVf/iAFb/2ABb/+IAXP/dAF3/8QANAET/4gBG/+cAR//xAEj/5wBK/+wAUv/nAFT/7ABW/+wAV//iAFj/5wBZ/+wAWv/sAFv/8QAJAET/8QBG//EASP/nAFL/5wBU/+cAVv/sAFf/5wBZ/+wAXP/dAAEARv/xAAAAAQAAAAoAFgAYAAFsYXRuAAgAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
