(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.goblin_one_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AA4ANAc+AAMAAQQJABIADAdyAEMAbwBwAHkAcgBpAGcAaAB0ACAAKABjACkAIAAyADAAMQAxACwAIABTAG8AcgBrAGkAbgAgAFQAeQBwAGUAIABDAG8AIAAoAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtACkACgB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEcAbwBiAGwAaQBuACIALgAKAAoAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwACgBWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABsAGkAYwBlAG4AcwBlACAAaQBzACAAYQB2AGEAaQBsAGEAYgBsAGUAIAB3AGkAdABoACAAYQAgAEYAQQBRACAAYQB0ADoACgBoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwARwBvAGIAbABpAG4AIABPAG4AZQBSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAARwBvAGIAbABpAG4AIABPAG4AZQAgADoAIAAyADAALQA2AC0AMgAwADEAMQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAxAEcAbwBiAGwAaQBuAE8AbgBlAEcAbwBiAGwAaQBuACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAAUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4AUwBvAHIAawBpAG4AIABUAHkAcABlACAAQwBvAC4AUgBpAGMAYwBhAHIAZABvACAARABlACAARgByAGEAbgBjAGUAcwBjAGgAaQBHAG8AYgBsAGkAbgAgAGIAZQBsAG8AbgBnAHMAIAB0AG8AIAB0AGgAZQAgAGMAYQB0AGUAZwBvAHIAeQAgAG8AZgAgAGQAaQBzAHAAbABhAHkAIAB0AHkAcABlAHMAIABjAGEAbABsAGUAZAAgACIATABhAHQAaQBuACIALgAgAFQAaABpAHMAIABpAHMAIABiAGUAYwBhAHUAcwBlACAAbwBmACAAaQB0AHMAIABzAGgAYQByAHAAIAB0AHIAaQBhAG4AZwB1AGwAYQByACAAcwBlAHIAaQBmAHMALgAgAEcAbwBiAGwAaQBuACAAdwBhAHMAIABpAG4AcwBwAGkAcgBlAGQAIABiAHkAIABhACAAaABhAG4AZAAgAHAAYQBpAG4AdABlAGQAIABzAGkAZwBuACAAYQBiAG8AdgBlACAAYQAgAHAAdQBiACAAaQBuACAAdABoAGUAIAB0AG8AdwBuACAAbwBmACAAUgBlAGEAZABpAG4AZwAgACgAVQBLACkALgAgAEcAbwBiAGwAaQBuACAAaQBzACAAYQAgAHMAbwBtAGUAdwBoAGEAdAAgAHcAaQBkAGUAIABtAGUAZABpAHUAbQAgAGMAbwBuAHQAcgBhAHMAdAAgAGQAZQBzAGkAZwBuACAAdwBpAHQAaAAgAGEAIABsAGEAcgBnAGUAIAB4ACAAaABlAGkAZwBoAHQALgAgAEcAbwBiAGwAaQBuACAAaQBzACAAYgBvAHQAaAAgAGEAdAB0AGUAbgB0AGkAbwBuACAAZwBlAHQAdABpAG4AZwAgAGEAbgBkACAAZgB1AG4ALgAgAEcAbwBiAGwAaQBuACAAaQBzACAAcwB1AGkAdABhAGIAbABlACAAZgBvAHIAIAB1AHMAZQAgAGkAbgAgAG0AZQBkAGkAdQBtACAAdABvACAAbABhAHIAZwBlACAAcwBpAHoAZQBzACAAaQBuAGMAbAB1AGQAaQBuAGcAIABoAGUAYQBkAGwAaQBuAGUAcwAuACAAVABoAGkAcwAgAGYAbwBuAHQAIAB3AGEAcwAgAG0AYQBkAGUAIABzAHAAZQBjAGkAZgBpAGMAYQBsAGwAeQAgAHQAbwAgAGIAZQAgAHcAZQBiACAAdAB5AHAAZQAuAHcAdwB3AC4AcwBvAHIAawBpAG4AdAB5AHAAZQAuAGMAbwBtAHcAdwB3AC4AcgBkAGYAdAB5AHAAZQAuAGkAdABUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABHAG8AYgBsAGkAbgACAAAAAAAA/7gA3gAAAAAAAAAAAAAAAAAAAAAAAAAAAPoAAAABAAIBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEArACjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEVAIoA2gCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoBFgEXARgA1wEZARoBGwEcAR0BHgDiAOMBHwEgALAAsQEhASIBIwEkASUA2ADhAN0A2QCyALMAtgC3AMQAtAC1AMUAhwC+AL8BJgd1bmkwMDAxB3VuaTAwMDIHdW5pMDAwMwd1bmkwMDA0B3VuaTAwMDUHdW5pMDAwNgd1bmkwMDA3B3VuaTAwMDgHdW5pMDAwOQd1bmkwMDEwB3VuaTAwMTEHdW5pMDAxMgd1bmkwMDEzB3VuaTAwMTQHdW5pMDAxNQd1bmkwMDE2B3VuaTAwMTcHdW5pMDAxOAd1bmkwMDE5B3VuaTAwQUQEaGJhcgZJdGlsZGUGaXRpbGRlAmlqC0pjaXJjdW1mbGV4C2pjaXJjdW1mbGV4DGtjb21tYWFjY2VudAxrZ3JlZW5sYW5kaWMEbGRvdAZOYWN1dGUGbmFjdXRlBlJhY3V0ZQxSY29tbWFhY2NlbnQMcmNvbW1hYWNjZW50BlJjYXJvbgZyY2Fyb24ERXVybwAAAAABAAH//wAP","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
