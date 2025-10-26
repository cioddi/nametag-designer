(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.voltaire_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ACAAcgBlAGEAZABhAGIAbABlACAAYQBuAGQAIAB3AGkAbABsACAAdwBvAHIAawAgAGYAcgBvAG0AIABtAGUAZABpAHUAbQAgAHkAZQB4AHQAIABzAGkAegBlAHMAIABhAGwAbAAgAHQAaABlACAAdwBhAHkAIAB1AHAAIAB0AG8AIABsAGEAcgBnAGUAcgAgAGQAaQBzAHAAbABhAHkAIABzAGUAdAB0AGkAbgBnAHMALgAgAFYAbwBsAHQAYQBpAHIAZQAgAHcAYQBzACAAaQBuAHMAcABpAHIAZQBkACAAYgB5ACAAMgAwAHQAaAAgAGMAZQBuAHQAdQByAHkAIABTAHcAZQBkAGkAcwBoACAAcABvAHMAdABlAHIAcwAgAHcAaABvAHMAZQAgAGwAZQB0AHQAZQByAHMAIAAgAGgAYQB2AGUAIABzAGkAbQBpAGwAYQByACAAZgBvAHIAbQBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgB5AHMAYwBoAC4AZABlAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAADnAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMBBADXAQUBBgEHAQgBCQEKAQsBDADiAOMBDQEOALAAsQEPARABEQESARMBFADYAOEA3QDZALIAswC2ALcAxAC0ALUAxQCHAL4AvwEVBGhiYXIGSXRpbGRlBml0aWxkZQJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxrY29tbWFhY2NlbnQMa2dyZWVubGFuZGljCkxkb3RhY2NlbnQEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24IZG90bGVzc2oERXVybwAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEA5gABAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
