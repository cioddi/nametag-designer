(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pompiere_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4ASwBhAHIAbwBsAGkAbgBhACAATABhAGMAaABQAG8AbQBwAGkAZQByAGUAIABpAHMAIABhACAAbABvAHcAIABjAG8AbgB0AHIAYQBzAHQAIABjAG8AbgBkAGUAbgBzAGUAZAAgAHMAYQBuAHMAIABzAGUAcgBpAGYAIABmAG8AbgB0AC4AIABIAG8AdwBlAHYAZQByACAAdQBuAGwAaQBrAGUAIABtAG8AcwB0ACAAcwBhAG4AcwAgAGkAdAAgAGgAYQBzACAAdgBlAHIAeQAgAHQAYQBsAGwAIABhAHMAYwBlAG4AZABlAHIAcwAgAGEAbgBkACAAYQBuAGQAIAB2AGUAcgB5ACAAcwBtAGEAbABsACAAeAAgAGgAZQBpAGcAaAB0AC4AIABQAG8AbQBwAGkAZQByAGUAIABpAHMAIABwAGwAYQB5AGYAdQBsACAAYQBuAGQAIABlAHYAZQBuACAAYQAgAGwAaQB0AHQAbABlACAAcwB3AGUAZQB0AC4AIABUAGgAaQBzACAAZgBvAG4AdAAgAHcAYQBzACAAaQBuAHMAcABpAHIAZQBkACAAYgB5ACAAYQAgAGgAYQBuAGQAbQBhAGQAZQAgAHMAaQBnAG4AIABzAGUAZQBuACAAbwB1AHQAcwBpAGQAZQAgAG8AZgAgAE4AWQBDACAAZgBpAHIAZQBmAGkAZwBoAHQAZQByAHMAIABTAHEAdQBhAGQAIABDAG8ALgAgADEAOAAgAGkAbgAgAHQAaABlACAAVwBlAHMAdAAgAFYAaQBsAGwAYQBnAGUAIABvAGYAIABNAGEAbgBoAGEAdAB0AGEAbgAuACAAQgBlAGMAYQB1AHMAZQAgAG8AZgAgAGkAdABzACAAcwBtAGEAbABsACAAeAAgAGgAZQBpAGcAaAB0ACAAYQBuAGQAIABtAG8AZABlAHMAdAAgAHcAZQBpAGcAaAB0ACAAaQB0ACAAdwBpAGwAbAAgAHcAbwByAGsAIABiAGUAcwB0ACAAYQB0ACAAbQBlAGQAaQB1AG0AIAB0AG8AIABsAGEAcgBnAGUAIABzAGkAegBlAHMALgB3AHcAdwAuAHMAbwByAGsAaQBuAHQAeQBwAGUALgBjAG8AbQB3AHcAdwAuAHQAaABlAGsAYQByAG8AbABpAG4AYQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/zcATAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ4AAAABAAIBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEVAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBFgEXARgA1wEZARoBGwEcAR0BHgEfASAA4gDjASEBIgCwALEBIwEkASUBJgEnASgA2ADhAN0A2QEpASoAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8BKwCMAMAAwQEsAS0BLgEvATABMQEyATMHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAxMAd1bmkwMDExB3VuaTAwMTIHdW5pMDAxMwd1bmkwMDE0B3VuaTAwMTUHdW5pMDAxNgd1bmkwMDE3B3VuaTAwMTgHdW5pMDAxOQd1bmkwMEFEBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24IZG90bGVzc2oMZG90YWNjZW50Y21iB3VuaTAzNEYERXVybwlhY3V0ZS5jYXAIcmluZy5jYXAMZGllcmVzaXMuY2FwCXRpbGRlLmNhcAlncmF2ZS5jYXAOY2lyY3VtZmxleC5jYXAJY2Fyb24uY2FwC2NvbW1hYWNjZW50AAAAAAAB//8AAwABAAAADAAAAAAAAAACAAEAAQEFAAEAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
