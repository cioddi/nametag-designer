(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.macondo_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AfAALQIJAC0CBQAtAMEAKADCACgBrQAtAZoAPAGtAC0BxgAyAw4AMgKn//sCXAA8ApAAGQKzADwCVwA8AjYAPAKzACgCigA8ANgAPAFlAB4CLQA8AeMAPAOLADcC2wA3AsgAGQJmADwCyAAZAkQAPAIKACgCBAAPAqQAPAKPAB4DYQAeAkMAHgJ1AB4CZAAyAUYANwHwAB0BRgA3AloALQIVADIBKAAyAcsALQIKADcBjAAZAiEAGQGWABkBZgAKAhIAGQITADwA8QA8APQAMgHvADwA1wA0AvIAPAIQADwB5AAZAhcAMgIZABkBhgAyAasANAFRABQB8wAKAdkAFALMABQBzgAeAeoACgHHADQBZgAJAKoAMgFmAAkBxQAjAO8APAGbABQCGgAeAfgAIwJ1AEIAqgAyAjwAPAF/ADIDDgAyAWgAIQHzADICFQAyAXIAMgMOADIBYQAvAU4ALQHWADIBgwA8AXQAPAEoADIB8wAKAe4AHgEGAEsBBwAyATgAPAFhAB4B8wAyAuYAPAL+ADwDBAA8AcYAMgKn//sCp//7Aqf/+wKn//sCp//7Aqf/+wPh//sCkAAZAlcAPAJXADwCVwA8AlcAPADs/+wA7AAoAOz/8ADs/+ECwgA8AtsANwLIABkCyAAZAsgAGQLIABkCyAAZAdYANQLIABkCpAA8AqQAPAKkADwCpAA8AnUAHgIyADwCZQAyAcsALQHLAC0BywAtAcsALQHLAC0BywAtApsAHgGWABkBlgAZAZYAGQGWABkBlgAZAND/+wDkADAA0P/rAND/2gIeABkCCgAyAeQAGQHkABkB5AAZAeQAGQHkABkAwf/GAeQAGQHzAAoB8wAKAfMACgHzAAoB6gAKAf4ALQHqAAoCCf/YAOz/4wDY/9kA2AA4Aj0APAG6ADQBZQAeAOr/+QHlADIB5QAyAeMAPAFfADQB4//MANf/0QLbADcCBgAyA7kAGQMMABkCRAA8AkQAPAGGADICRAA8AYYAMgI4ADoBqwA0AnUAHgJkADIBxwA0AXD/gwFcADIBXAAyAMkAMgDuADIBiwAyAMkAMgIVADIC+wAyAMQANwDEADcAxwAoAVEANwFRADcBXQAoAQYAMgJDACgBPwAyAT8AMgJHACMCkQAYAZoAMgG7AC0BLAAAAqf/IwJXADwCXP/5ArMAPAJ2ACECRAA8Ahv/ewLIABkCyAAZArMAKAKKADsB7gAjAav/MgItADwB4wA8A4sAFALbADcCOQAPAooAHgNqAB4CkAAZAkoAPAKkAB4CQwAeAnX+9gJkADIBLABdA9IAKALIABkCyAAZAsgAGQLIABkCyAAZAlcAPAJXADwCVwA8AlcAPALbADcC2wA3AqQAHgKkAB4CpAAeAqQAHgHuACMB7gAjAfwAIwHuACMB7gAjA8P/IwKn/yMCp/8jAqf/IwKn/yMCp/8jAqf/IwKQABkCyAAZAnX+9gJ1/vYCUQAjAeP/zAHjADwCOP97AmQAMgI9ABQCSgAUAAEAAAN4/twAAAPh/vb+XwPOAAEAAAAAAAAAAAAAAAAAAAE3AAIBngGQAAUAAAK8AooAAACMArwCigAAAd0AMgD6AAACAAAAAAAAAAAAAAAAIwAAAAAAAAAAAAAAAFBZUlMAQAAg+wIDeP7cAAADeAEkAAAAAQAAAAAAGAA1AAAAIAACAAAAAgAAAAMAAAAUAAMAAQAAABQABAEIAAAAPgAgAAQAHgB+AP8BKQE1ATgBRAFUAVkBYQF4AX4BkgLHAtoC3AMHA7wgFCAaIB4gIiAmIDogRCCsIhIiK+AA4EH7Av//AAAAIAChAScBMQE3AT8BUgFWAWABeAF9AZICxgLZAtwDBwO8IBMgGCAcICIgJiA5IEQgrCISIivgAOAB+wH////j/8H/mv+T/5L/jP9//37/eP9i/17/S/4Y/gf+Bv3c/Lrg0eDO4M3gyuDH4LXgrOBF3uDeyCABIPMGNAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4Af+FsASNAAAAAA0AogADAAEECQAAARYAAAADAAEECQABAA4BFgADAAEECQACAA4BJAADAAEECQADAFABMgADAAEECQAEAA4BFgADAAEECQAFABoBggADAAEECQAGAB4BnAADAAEECQAHAFwBugADAAEECQAIACYCFgADAAEECQAJACYCFgADAAEECQAMADICPAADAAEECQANASACbgADAAEECQAOADQDjgBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMQA5ADkANwAgAC0AIAAyADAAMQAxACwAIABKAG8AaABuACAAVgBhAHIAZwBhAHMAIABCAGUAbAB0AHIAYQBuAC4AIAAoAHcAdwB3AC4AagBvAGgAbgB2AGEAcgBnAGEAcwBiAGUAbAB0AHIAYQBuAC4AYwBvAG0AfABqAG8AaABuAC4AdgBhAHIAZwBhAHMAYgBlAGwAdAByAGEAbgBAAGcAbQBhAGkAbAAuAGMAbwBtACkALAAgAHcAaQB0AGgAIABSAGUAcwBlAHIAdgBlAGQAIABGAG8AbgB0ACAATgBhAG0AZQAgACIATQBhAGMAbwBuAGQAbwAiAE0AYQBjAG8AbgBkAG8AUgBlAGcAdQBsAGEAcgBKAG8AaABuAFYAYQByAGcAYQBzAEIAZQBsAHQAcgBhAG4AOgAgAE0AYQBjAG8AbgBkAG8AIABSAGUAZwB1AGwAYQByADoAIAAxADkAOQA3AFYAZQByAHMAaQBvAG4AIAAyAC4AMAAwADEATQBhAGMAbwBuAGQAbwAtAFIAZQBnAHUAbABhAHIATQBhAGMAbwBuAGQAbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEoAbwBoAG4AIABWAGEAcgBnAGEAcwAgAEIAZQBsAHQAcgBhAG4ALgBKAG8AaABuACAAVgBhAHIAZwBhAHMAIABCAGUAbAB0AHIAYQBuAHcAdwB3AC4AagBvAGgAbgB2AGEAcgBnAGEAcwBiAGUAbAB0AHIAYQBuAC4AYwBvAG0AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoAIABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAABNwAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBAgCKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQMBBAEFANcBBgEHAQgBCQEKAQsBDAENAOIA4wEOAQ8AsACxARABEQESARMBFADkAOUAuwDmAOcApgDYAOEA3ADdANkBFQCyALMAtgC3AMQAtAC1AMUAhwCrAL4AvwC8ARYA7wCcARcBGAEZARoBGwEcAR0BHgEfASABIQEiASMBJAElASYBJwEoASkBKgErASwBLQEuAS8BMAExATIBMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwDAAMEHdW5pMDBBRARoYmFyBkl0aWxkZQZpdGlsZGUCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgMa2NvbW1hYWNjZW50DGtncmVlbmxhbmRpYwpMZG90YWNjZW50BGxkb3QGTmFjdXRlBm5hY3V0ZQZSYWN1dGUMUmNvbW1hYWNjZW50DHJjb21tYWFjY2VudAZSY2Fyb24GcmNhcm9uDGRvdGFjY2VudGNtYgRFdXJvAkNSB0Euc3dhc2gHRS5zd2FzaAdCLnN3YXNoB0Quc3dhc2gHUC5zd2FzaAdSLnN3YXNoB1Muc3dhc2gHUS5zd2FzaAdPLnN3YXNoB0cuc3dhc2gHSC5zd2FzaAdJLnN3YXNoB0ouc3dhc2gHSy5zd2FzaAdMLnN3YXNoB00uc3dhc2gHTi5zd2FzaAdULnN3YXNoB1Yuc3dhc2gHVy5zd2FzaAdDLnN3YXNoB0Yuc3dhc2gHVS5zd2FzaAdYLnN3YXNoB1kuc3dhc2gHWi5zd2FzaAtjb21tYWFjY2VudAhPRS5zd2FzaAxPZ3JhdmUuc3dhc2gMT2FjdXRlLnN3YXNoEU9jaXJjdW1mbGV4LnN3YXNoDE90aWxkZS5zd2FzaA9PZGllcmVzaXMuc3dhc2gMRWdyYXZlLnN3YXNoDEVhY3V0ZS5zd2FzaBFFY2lyY3VtZmxleC5zd2FzaA9FZGllcmVzaXMuc3dhc2gMTmFjdXRlLnN3YXNoDE50aWxkZS5zd2FzaAxVZ3JhdmUuc3dhc2gMVWFjdXRlLnN3YXNoEVVjaXJjdW1mbGV4LnN3YXNoD1VkaWVyZXNpcy5zd2FzaAxJZ3JhdmUuc3dhc2gMSWFjdXRlLnN3YXNoDEl0aWxkZS5zd2FzaBFJY2lyY3VtZmxleC5zd2FzaA9JZGllcmVzaXMuc3dhc2gIQUUuc3dhc2gMQWdyYXZlLnN3YXNoDEFhY3V0ZS5zd2FzaBFBY2lyY3VtZmxleC5zd2FzaAxBdGlsZGUuc3dhc2gPQWRpZXJlc2lzLnN3YXNoC0FyaW5nLnN3YXNoDkNjZWRpbGxhLnN3YXNoDE9zbGFzaC5zd2FzaAxZYWN1dGUuc3dhc2gPWWRpZXJlc2lzLnN3YXNoCElKLnN3YXNoDExzbGFzaC5zd2FzaBBMZG90YWNjZW50LnN3YXNoDFNjYXJvbi5zd2FzaAxaY2Fyb24uc3dhc2gAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABATYAAQAAAAEAAAAKACQAMgACREZMVAAObGF0bgAOAAQAAAAA//8AAQAAAAFrZXJuAAgAAAABAAAAAQAEAAIAAAABAAgAAQBMAAQAAAAhBHgAkgLoAQABRgOMA4wD9gHcAe4CcAJwAnACfgKEBHgEeAR4BHgEeAR4AsoC6AL6A4wDjAP2BHgEeAR4BHgEeAR4AAEAIQAkACkALwAzADcAOQA6ADwARABJAEsAUABRAFQAVwCBAIIAgwCEAIUAhgDpAQMBBgEHAQgBDQEmAScBKAEpASoBKwAbACT/ugBE/8IARv+1AEf/tQBI/7UASv+1AFL/tQBU/7UAVf/JAFj/7gCB/7oAgv+6AIP/ugCE/7oAhf+6AIb/ugCo/7UAqf+1AKr/tQCr/7UArP+1ALP/tQC0/7UAtf+1ALb/tQC3/7UA0v+1ABEARv/EAEf/xABI/8QASv/EAFL/xABU/8QAqP/EAKn/xACq/8QAq//EAKz/xACz/8QAtP/EALX/xAC2/8QAt//EANL/xAAlACT/xAAm/7oAKv+6ADL/ugA0/7oARP+mAEb/iABH/4gASP+IAEr/iABS/4gAVP+IAFX/xABY/7UAWf+6AIH/xACC/8QAg//EAIT/xACF/8QAhv/EAJP/ugCU/7oAlf+6AJb/ugCX/7oAqP+IAKn/iACq/4gAq/+IAKz/iACz/4gAtP+IALX/iAC2/4gAt/+IANL/iAAEAFf/9gBZ/8QAWv/EAFz/xAAgAAQAPAAFAGQACgBkAA0AMgAP/84AEf/OACIAPABG/9gAR//YAEj/2ABK/9gAUv/YAFT/2ACo/9gAqf/YAKr/2ACr/9gArP/YAK0APACvACMAsABQALP/2AC0/9gAtf/YALb/2AC3/9gA0v/YAOYAZADnAGQA6QBkAOoAZADt/84AAwBZ/8QAWv/EAFz/xAABAFj/0wARAEb/zgBH/84ASP/OAEr/zgBS/84AVP/OAKj/zgCp/84Aqv/OAKv/zgCs/84As//OALT/zgC1/84Atv/OALf/zgDS/84ABwAk/7oAgf+6AIL/ugCD/7oAhP+6AIX/ugCG/7oABAA3/6EAOf+rADr/qwA8/54AJAAk/8QAJv+6ACr/ugAy/7oANP+6AET/pgBG/4gAR/+IAEj/iABK/4gAUv+IAFT/iABV/8QAWP+1AIH/xACC/8QAg//EAIT/xACF/8QAhv/EAJP/ugCU/7oAlf+6AJb/ugCX/7oAqP+IAKn/iACq/4gAq/+IAKz/iACz/4gAtP+IALX/iAC2/4gAt/+IANL/iAAaABH/oQAk/7UARP/iAEb/zgBH/84ASP/OAEr/zgBS/84AVP/OAIH/tQCC/7UAg/+1AIT/tQCF/7UAhv+1AKj/zgCp/84Aqv/OAKv/zgCs/84As//OALT/zgC1/84Atv/OALf/zgDS/84AIAAR/6EAJP+1ADL/vwBE/8QARv+mAEf/pgBI/6YASv+mAFL/pgBU/6YAgf+1AIL/tQCD/7UAhP+1AIX/tQCG/7UAk/+/AJT/vwCV/78Alv+/AJf/vwCo/6YAqf+mAKr/pgCr/6YArP+mALP/pgC0/6YAtf+mALb/pgC3/6YA0v+mAAQAWf/sAFr/7ABc/+wA6v/7AAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
