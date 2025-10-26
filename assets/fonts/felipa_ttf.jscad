(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.felipa_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAERAAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQECAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBAwEEAQUA1wEGAQcBCAEJAQoBCwEMAQ0A4gDjAQ4BDwCwALEBEAERARIBEwEUAOQA5QC7ARUBFgDmAOcApgEXANgA4QDbANwA3QDgANkA3wEYAKgAnwCbALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBGQCMARoAmACaAJkA7wClAJIAnACnAI8AlACVALkBGwDAAMEBHAEdB25ic3BhY2UEaGJhcgZJdGlsZGUGaXRpbGRlAklKAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMKTGRvdGFjY2VudARsZG90Bk5hY3V0ZQZuYWN1dGUGUmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgpaZG90YWNjZW50Cnpkb3RhY2NlbnQIZG90bGVzc2oMZG90YWNjZW50Y21iBEV1cm8JZXN0aW1hdGVkAmZmA2ZmaQNmZmwAAAABAAH//wAPAAEAAAAMAAAAAAAAAAIAAQABARAAAQAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
