(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numans_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AG8AdgBhAG4AbgB5ACAATABlAG0AbwBuAGEAZAAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAE4AdQBtAGEAbgBzAFIAZQBnAHUAbABhAHIARgBvAG4AdABGAG8AcgBnAGUAIAAyAC4AMAAgADoAIABOAHUAbQBhAG4AcwAgADoAIAAxADIALQA4AC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMAAwADEALgAwADAAMQBOAHUAbQBhAG4AcwAtAFIAZQBnAHUAbABhAHIATgB1AG0AYQBuAHMAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABKAG8AdgBhAG4AbgB5ACAATABlAG0AbwBuAGEAZAAuAEoAbwB2AGEAbgBuAHkAIABMAGUAbQBvAG4AYQBkAGgAdAB0AHAAOgAvAC8AdwB3AHcALgBqAG8AdgBhAG4AbgB5AC4AcgB1AC8AQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgAEEAdQBnAHUAcwB0ACAAMQAsACAAMgAwADEAMQAsACAASgBvAHYAYQBuAG4AeQAgAEwAZQBtAG8AbgBhAGQAIAAoAGwAZQBtAG8AbgBhAGQAQABqAG8AdgBhAG4AbgB5AC4AcgB1ACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIATgB1AG0AYQBuAHMAIgAgAGEAbgBkACAAIgBOAHUAbQBhAG4AcwAiAC4AIABUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABo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/8QAuf/EAOH/xADi/8QACAAk/9gALf/YADf/xAA5/9gAOv/sADv/2AA8/9gAPf/YAAwADv/YABD/2AAg/9gAWf/iAFr/4gBc/+IAYf/YAG7/2ABz/9gAuf/YAOH/2ADi/9gAPwAO/9gAEP/YACD/2AAk/8QAJv/YACr/2AAt/+IAMv/YAET/zgBG/9gAR//YAEj/2ABJ/+IASv/YAFD/2ABR/9gAUv/YAFP/2ABU/9gAVf/YAFb/2ABY/9gAWf/YAFr/2ABb/9gAXP/YAF3/2ABh/9gAbv/YAHP/2ACC/8QAg//EAIT/xACF/8QAhv/EAIf/xACi/84Ao//OAKT/zgCl/84Apv/OAKf/zgCo/9gAqf/YAKr/2ACr/9gArP/YAK3/2AC0/9gAtf/YALb/2AC3/9gAuP/YALn/2AC6/9gAu//YALz/2AC9/9gAvv/YAMH/2ADR/9gA4f/YAOL/2AAEADf/2AA5/9gAOv/sADz/2AAaAA7/xAAQ/8QAIP/EACb/7AAq/+wAMv/sADT/7AA2/+wARP/sAEb/7ABH/+wASP/sAEr/7ABS/+wAVP/sAFf/7ABY/+wAWf/YAFr/7ABc/9gAYf/EAG7/xABz/8QAuf/EAOH/xADi/8QAPQAF/7AACv+wAA3/sAAO/8QAEP/EACD/xAAm/9gAKv/YADL/2AA0/9gAN/+cADj/2AA5/7AAOv+wADz/nABB/7AAQ/+wAET/7ABG/+wAR//sAEj/7ABK/+wAUv/sAFT/7ABY/+wAWf+wAFr/xABc/8QAYf/EAGr/sABs/7AAbv/EAHH/sABy/7AAc//EAHb/sAB8/7AAif/YAJT/2ACV/9gAlv/YAJf/2ACY/9gAmv/YAJv/2ACc/9gAnf/YAJ7/2AC5/8QAwf/EANn/nADd/7AA3v+wAN//sADg/7AA4f/EAOL/xADj/7AA5P+wAOb/sADn/7AACQAk/9gALf/YADf/4gA5/+IAOv/sADv/4gA8/+IAPf/iANn/4gAYAA//nAAR/5wAJP/EAC3/xAA9/+IAQv+cAET/4gBG/+IAR//iAEj/4gBK/+IAUv/iAFT/4gBW/+wAev+cAIL/xACD/8QAhP/EAIX/xACG/8QAh//EAOX/nADo/5wA7P+cAAQAN//YADn/4gA6/+wAPP/YAAoAOf/iADr/7AA7/+wAPP/YAD3/7ABZ/9gAWv/iAFv/4gBc/+IAXf/iAEgADv/EAA//sAAQ/8QAEf+wACD/xAAk/7AAJv/YACr/2AAy/9gANP/YADb/2ABC/7AARP/EAEb/xABH/8QASP/EAEn/2ABK/8QAUP/YAFH/xABS/8QAU//YAFT/xABV/9gAVv/EAFj/xABZ/8QAWv/YAFv/xABc/9gAXf/YAGH/xABu/8QAc//EAHr/sACC/7AAg/+wAIT/sACF/7AAhv+wAIf/sACa/+IAov/EAKP/xACk/8QApf/EAKb/xACn/8QAqP/EAKn/xACq/8QAq//EAKz/xACt/8QAtP/EALX/xAC2/8QAt//EALj/xAC5/8QAuv/EALv/xAC8/8QAvf/EAL7/xADB/9gA0f/EAOH/xADi/8QA5f+wAOj/sADs/7AAAQAk/9gARwAO/9gAD//EABD/2AAR/8QAIP/YACT/sAAm/+IAKv/iADL/4gA0/+IANv/iAEL/xABE/9gARv/YAEf/2ABI/9gASv/YAFD/7ABR/+wAUv/YAFP/7ABU/9gAVf/sAFb/2ABY/+wAWf/sAFr/7ABb/9gAXP/sAGH/2ABu/9gAc//YAHr/xACC/7AAg/+wAIT/sACF/7AAhv+wAIf/sACJ/+IAlP/iAJX/4gCW/+IAl//iAJj/4gCa/+IAov/YAKP/2ACk/9gApf/YAKb/2ACn/9gAqP/YAKn/2ACq/9gAq//YAKz/2ACt/9gAtP/YALX/2AC2/9gAt//YALj/2AC5/9gAuv/YANH/2ADh/9gA4v/YAOX/xADo/8QA7P/EAC4ADv/YAA//2AAQ/9gAEf/YACD/2AAk/8QAJv/sACr/7AAy/+wANP/sADb/7ABC/9gARP/iAEb/4gBH/+IASP/iAEr/4gBQ/+wAUf/sAFL/4gBT/+wAVP/iAFX/7ABW/+IAWP/sAFn/7ABa/+wAW//sAFz/7ABd/+IAYf/YAG7/2ABz/9gAev/YAIL/xACD/8QAhP/EAIX/xACG/8QAh//EALn/2ADh/9gA4v/YAOX/2ADo/9gA7P/YABgADv/EABD/xAAg/8QAJv/YACr/2ABE/+IARv/iAEf/4gBI/+IASv/iAFL/4gBU/+IAVv/iAFf/4gBY/+IAWf/YAFr/4gBc/+IAYf/EAG7/xABz/8QAuf/EAOH/xADi/8QARwAO/8QAD/+cABD/xAAR/5wAIP/EACT/sAAm/9gAKv/YAC3/7AAy/9gANP/YADb/2ABC/5wARP/EAEb/xABH/8QASP/EAEr/xABQ/9gAUf/YAFL/xABT/9gAVP/EAFX/2ABW/8QAWP/YAFn/2ABa/9gAW//YAFz/2ABd/9gAYf/EAG7/xABz/8QAev+cAIL/sACD/7AAhP+wAIX/sACG/7AAh/+wAKL/xACj/8QApP/EAKX/xACm/8QAp//EAKj/xACp/8QAqv/EAKv/xACs/8QArf/EALT/xAC1/8QAtv/EALf/xAC4/8QAuf/EALr/xAC7/9gAvP/YAL3/2AC+/9gAwf/YANH/xADh/8QA4v/EAOX/nADo/5wA7P+cABoADv/EABD/xAAg/8QAJv/iACr/4gAy/+IANP/iADb/4gBE/+wARv/sAEf/7ABI/+wASv/sAFL/7ABU/+wAVv/sAFj/7ABZ/+IAWv/iAFz/4gBh/8QAbv/EAHP/xAC5/8QA4f/EAOL/xAAYAAX/4gAK/+IADf/iAEH/4gBD/+IAV//sAFj/7ABZ/+IAWv/sAFz/4gBq/+IAbP/iAHH/4gBy/+IAdv/iAHz/4gDd/+IA3v/iAN//4gDg/+IA4//iAOT/4gDm/+IA5//iACEABf/iAAr/4gAN/+IADv/YABD/2AAg/9gAQf/iAEP/4gBZ/+IAWv/sAFv/4gBc/+wAXf/iAGH/2ABq/+IAbP/iAG7/2ABx/+IAcv/iAHP/2AB2/+IAfP/iALn/2ADd/+IA3v/iAN//4gDg/+IA4f/YAOL/2ADj/+IA5P/iAOb/4gDn/+IAGAAF/+IACv/iAA3/4gBB/+IAQ//iAFn/4gBa/+wAW//iAFz/7ABd/+IAav/iAGz/4gBx/+IAcv/iAHb/4gB8/+IA3f/iAN7/4gDf/+IA4P/iAOP/4gDk/+IA5v/iAOf/4gAjAAUAKAAKACgADQAoAA//xAAR/8QAQQAoAEL/xABDACgARP/sAEb/7ABH/+wASP/sAEr/7ABS/+wAVv/sAFv/7ABd/+wAagAoAGwAKABxACgAcgAoAHYAKAB6/8QAfAAoAN0AKADeACgA3wAoAOAAKADjACgA5AAoAOX/xADmACgA5wAoAOj/xADs/8QAAwBZ/+wAWv/sAFz/7AAFAFf/7ABY/+wAWf/iAFr/7ABc/+IAGAAF/+IACv/iAA3/4gBB/+IAQ//iAFn/4gBa/+wAW//iAFz/7ABd/+wAav/iAGz/4gBx/+IAcv/iAHb/4gB8/+IA3f/iAN7/4gDf/+IA4P/iAOP/4gDk/+IA5v/iAOf/4gABAFn/7AAQAA7/2AAP/8QAEP/YABH/xAAg/9gAQv/EAGH/2ABu/9gAc//YAHr/xAC5/9gA4f/YAOL/2ADl/8QA6P/EAOz/xAAYAAX/4gAK/+IADf/iAEH/4gBD/+IAWf/iAFr/7ABb/+wAXP/iAF3/7ABq/+IAbP/iAHH/4gBy/+IAdv/iAHz/4gDd/+IA3v/iAN//4gDg/+IA4//iAOT/4gDm/+IA5//iAAwADv/YABD/2AAg/9gAWf/iAFr/7ABc/+IAYf/YAG7/2ABz/9gAuf/YAOH/2ADi/9gAGAAO/+IAD//EABD/4gAR/8QAIP/iAEL/xABE/+IARv/iAEf/4gBI/+IASv/iAFL/4gBU/+IAVv/iAGH/4gBu/+IAc//iAHr/xAC5/+IA4f/iAOL/4gDl/8QA6P/EAOz/xAAYAA7/4gAP/8QAEP/iABH/xAAg/+IAQv/EAET/7ABG/+wAR//sAEj/7ABK/+wAUv/sAFT/7ABW/+wAYf/iAG7/4gBz/+IAev/EALn/4gDh/+IA4v/iAOX/xADo/8QA7P/EABEADv/OABD/zgAg/84ARP/iAEb/4gBH/+IASP/iAEr/4gBS/+IAVP/iAFb/4gBh/84Abv/OAHP/zgC5/84A4f/OAOL/zgARAA7/zgAQ/84AIP/OAET/7ABG/+wAR//sAEj/7ABK/+wAUv/sAFT/7ABW/+wAYf/OAG7/zgBz/84Auf/OAOH/zgDi/84AJAAF/8QACv/EAA3/xAAO/9gAEP/YACD/2AA3/7AAOf+wADr/xAA8/7AAQf/EAEP/xABZ/9gAXP/YAGH/2ABq/8QAbP/EAG7/2ABx/8QAcv/EAHP/2AB2/8QAfP/EALn/2ADB/9gA2f+wAN3/xADe/8QA3//EAOD/xADh/9gA4v/YAOP/xADk/8QA5v/EAOf/xAAlAAX/xAAK/8QADf/EAA7/2AAQ/9gAIP/YADf/sAA5/7AAOv/EADz/sABB/8QAQ//EAFn/2ABa/+IAXP/YAGH/2ABq/8QAbP/EAG7/2ABx/8QAcv/EAHP/2AB2/8QAfP/EALn/2ADB/9gA2f+wAN3/xADe/8QA3//EAOD/xADh/9gA4v/YAOP/xADk/8QA5v/EAOf/xAAHAC3/2AA3/+IAOf/iADv/4gA8/+IAPf/iANn/4gAHAA//xAAR/8QAQv/EAHr/xADl/8QA6P/EAOz/xAAJAA7/2AAQ/9gAIP/YAGH/2ABu/9gAc//YALn/2ADh/9gA4v/YABMABf/iAAr/4gAN/+IAQf/iAEP/4gBq/+IAbP/iAHH/4gBy/+IAdv/iAHz/4gDd/+IA3v/iAN//4gDg/+IA4//iAOT/4gDm/+IA5//iAEEADv/EAA//nAAQ/8QAEf+cACD/xAAk/7AAQv+cAET/xABG/8QAR//EAEj/xABK/8QAUP/YAFH/2ABS/8QAU//YAFT/xABV/9gAVv/EAFj/2ABZ/9gAWv/YAFv/2ABc/9gAXf/YAGH/xABu/8QAc//EAHr/nACC/7AAg/+wAIT/sACF/7AAhv+wAIf/sACi/8QAo//EAKT/xACl/8QApv/EAKf/xACo/8QAqf/EAKr/xACr/8QArP/EAK3/xAC0/8QAtf/EALb/xAC3/8QAuP/EALn/xAC6/8QAu//YALz/2AC9/9gAvv/YAMH/2ADR/8QA4f/EAOL/xADl/5wA6P+cAOz/nAAZABT/2AAV/9gAFv/YABr/2AAk/9gALf/YADf/xAA5/9gAOv/YADv/xAA8/8QAPf/EAFn/4gBa/+IAW//OAFz/4gBd/84Agv/YAIP/2ACE/9gAhf/YAIb/2ACH/9gAwf/iANn/xAAjABf/xAAk/7AARP/iAEb/4gBH/+IASP/iAEr/4gBS/+IAVP/iAFb/4gCC/7AAg/+wAIT/sACF/7AAhv+wAIf/sACi/+IAo//iAKT/4gCl/+IApv/iAKf/4gCo/+IAqf/iAKr/4gCr/+IArP/iAK3/4gC0/+IAtf/iALb/4gC3/+IAuP/iALr/4gDR/+IAAQAAAAoAJgAoAAJERkxUAA5sYXRuABgABAAAAAD//wAAAAAAAAAAAAAAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
