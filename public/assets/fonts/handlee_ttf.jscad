(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.handlee_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AFb/3QBY/+AAWf/yAFr/2wBb/+0AXP/kAF3/6gB8/8QAkf/sAA0ADP/vABH/6QAS/+MAFf/uABr/9QA3/+0AO//zADz/8AA9//AAP//tAED/5gBg/+4AfP/yAAEAEv/vABEACv/zAA7/9QAQ/+EAFQAIABf/7AAc//EAIP/rADL/9gA0//UAN//vADj/9QA5/+8APP/uAD//5QBs//UAcf/hAHwACwAEAAz/9QAS/+sAP//1AED/8gASAAr/9AAM//AAEf/wABL/6AAU//UAFf/0ABb/9QAa//EALf/1ADf/9AA5//UAPP/uAD3/9QA//+sAQP/uAGD/8ABs//QAfP/2AAIAEv/tAED/9gAMAAr/5AAM//UAEv/xABT/6gAa/+EAN//jADn/7gA8/+QAP//gAED/5gBg/+0AbP/hAAsABv/uAA7/7gAQ/+MAEf/HABL/zgAg//UAJP/0AC3/2ABj//AAcf/0AHz/1QAEABD/5wAS/+4AIP/2AHH/5wAGAAz/9gAS//MAN//xADz/8wA//+4AQP/1AAMAN/+3ADn/7gA8/9kABAAU/+MAFf/lABb/6gAa/9UABQAK//AAN/+3ADn/5wA8/9QAuv/lACMACv/0AA3/8QAU//EAGv/wACL/9gA3/9oAOP/5ADn/7AA8/9wAP//iAEX/+QBG//sASP/7AEn/8wBK//sAS//6AEz/+gBN//oATv/7AE//+QBQ//sAUf/6AFL/+wBU//sAVf/5AFf/9wBY//kAWf/xAFr/+QBb//sAXP/5AJH/+wC5/+wAuv/wAMX/6wAYABL/7QAt//sAN//iADv/6QA8//gAPf/5AD//9QBA/+0ASf/4AE3/+wBO//sAUf/7AFX/+wBW//kAV//4AFn/+QBb//gAXP/7AF3/8wBg//YAfP/7AJH/+wCgABcAoQAVABIADf/zACb/+wAq//oAMv/5ADT/+QA2//kAN//cADj/+wA5//sAOv/6ADv/3gA8//oAP//zAEn/9wBX//gAWf/2AFv/+ACgABMAJQAM/+4AEf/bABL/3gAV/+oAIv/1ACT/+wAt/+AAN//ZADn/+gA7/98APP/wAD3/5gA//+8AQP/lAET/9gBF//oARv/4AEf/+QBI//cASv/5AEv/+gBM//kATf/6AE7/+ABP//oAUP/6AFH/+wBS//oAU//3AFT/+QBW//oAWv/6AGD/7gB8/90Akf/4AKAACQChAAYAHwAQ/+sAF//1ABz/8gAm/+kAKv/pADL/5gA0/+YANv/6ADj/9gA6//QARf/5AEb/+QBH//oASP/5AEn/8ABK//gAT//4AFD/+ABR//UAUv/3AFP/+wBU//oAVf/yAFf/7QBY//IAWf/iAFr/9ABb//YAXP/uAJH/+wCv//gANwAJ//UADQAXABD/4wAR/8QAEv/EABX/8QAW//IAGP/2ABn/8QAb//AAHf/nACP/4gAk/90AJv/fACf/+AAq/+AALf95ADL/4QA0/+UANf/7ADb/5gA4//cAOv/vAET/vQBF//gARv/EAEf/xwBI/78ASf/xAEr/xwBL//oATv/3AE//9gBQ/8gAUf/QAFL/ywBT/7wAVP/FAFX/2QBW/88AV//vAFj/1QBZ/+cAWv/GAFv/3wBc/9EAXf/bAGv/9gB8/4YAkf/fAJ4AEwCv/8gAwv/zAMP/8QDFAAsACgAR//EAEv/rADf/9gA7/+oAPP/5AD3/9QBA//UASf/5AHz/+wCgAAkAHAAS//MARP/1AEX/9wBG//QAR//2AEj/8wBK//YAS//5AEz/+QBN//kATv/5AE//+ABQ//kAUf/5AFL/9gBT//YAVP/2AFX/+ABW//cAWP/3AFn/+gBa//cAW//5AFz/9wBd//kAkf/5AKAACgChAA0AHgAQ//gAEv/1AET/9ABF//cARv/0AEf/9gBI//IASf/7AEr/9QBL//kATP/4AE3/+ABO//kAT//4AFD/+ABR//gAUv/1AFP/9gBU//YAVf/4AFb/9wBY//YAWf/5AFr/9wBb//gAXP/3AF3/+ACR//kAoAALAKEADQAfABH/9wAS/+sAO//7AET/+ABF//gARv/4AEf/+QBI//gASv/5AEv/+QBM//kATf/5AE7/+QBP//gAUP/4AFH/+QBS//kAU//2AFT/+QBV//gAVv/4AFj/+gBZ//sAWv/4AFv/+gBc//cAXf/5AHz/+wCR//kAoAAGAKEABwAjABD/2wAVABIAF//wABz/8AAm/90AKv/dADL/3gA0/+AANv/7ADj/8wA6//QAQAAIAET/+gBF//QARv/uAEf/9ABI/+0ASf/qAEr/7gBL//oAT//wAFD/+gBR//UAUv/sAFT/8QBV//EAV//bAFj/4QBZ/9cAWv/qAFz/4QBgAAsAa//yAKEAEQDC/+UALAAJ//AACv+jAA3/ogAQ/6sAFP/lABUACwAX/8cAGv/qABz/tgAi//IAJv/iACr/4AAy/9cANP/RADf/hgA4/9gAOf+rADr/9gA8/8MAP/+4AEX/8QBG//UAR//6AEj/9QBJ/+IASv/2AEv/+QBP//AAUf/4AFL/8gBU//gAVf/0AFf/pQBY/+YAWf+uAFr/9QBc/+UAa//iAHH/lgC5/6QAuv+kAML/xQDD/+wAxf+hAB0AEv/yAET/9QBF//gARv/1AEf/9wBI//QASf/7AEr/9gBL//kATP/5AE3/+QBO//kAT//4AFD/+QBR//kAUv/2AFP/9wBU//YAVf/5AFb/9wBY//cAWf/6AFr/+ABb//kAXP/3AF3/+ACR//kAoAAKAKEADAAdABL/9gBE//UARf/4AEb/9ABH//cASP/zAEn/+wBK//YAS//5AEz/+QBN//kATv/5AE//+ABQ//kAUf/5AFL/9gBT//cAVP/2AFX/+QBW//cAWP/3AFn/+gBa//gAW//5AFz/9wBd//kAkf/5AKAADAChAA4AJgAM/+4AEf/oABL/4gAV/+0AGv/yACL/8gAt//AAN//QADn/+AA7/+AAPP/pAD3/6AA//+wAQP/jAET/+ABF//sARv/6AEf/+gBI//kASv/6AEv/+gBM//oATf/6AE7/+QBP//sAUP/7AFH/+wBS//sAU//4AFT/+gBV//sAVv/7AFr/+gBc//sAYP/tAHz/7ACR//gAoAADABsAEP/zABH/0wAS/9IAFf/zACP/9gAk//kALf+qADv/6wA9//UARP/vAEb/8gBH//QASP/vAEr/9ABM//sATv/7AFD/+QBS//UAU//xAFT/8gBW//oAWv/3AHz/sgCR//kAnwAYAKAAOAChADQAHQAt//YAN//ZADn/+QA7//cAPP/wAD//7gBE//kARf/6AEb/+QBH//oASP/3AEr/+QBL//oATP/6AE3/+wBO//oAT//6AFD/+wBR//sAUv/6AFP/+QBU//kAVf/7AFb/+wBa//kAXP/6AJH/+gCgAAgAoQAJAAcAFQAgADf/3gBAAA0AYAAVAJ8ACgCgACEAoQAeABYAEv/0ADv/9wBJ//cAS//7AEz/+wBO//sAT//6AFD/+gBR//kAU//7AFX/+QBX//YAWP/7AFn/9QBa//sAW//3AFz/+ABd//gAkf/6AJ8AEQCgAB4AoQAnAEwACf/tAA0AGwAQ/7cAEf+8ABL/wQAT//AAF//2ABn/0wAb/+8AHP/0AB3/uwAiAA8AI/+6ACT/ywAm/8cAJ//3ACr/ygAr//sALf+eADL/yAAz//oANP/ZADX/+wA2//kAOv/4AD8ACQBAACAARP9zAEX/5QBG/3MAR/90AEj/cQBJ/84ASv90AEv/5ABM/+0ATv/fAE//+ABQ/3MAUf91AFL/dABT/3AAVP9zAFX/hwBW/3oAV//PAFj/dgBZ/6EAWv9wAFv/jQBc/3IAXf+AAGAAEQBr/+QAfP+qAJH/zwCS/5UAk/+CAJT/hgCV/4EAl/+WAJr/jwCc/34AngAwAKD/9QCh/+IAov+fAKP/rwCl/4UApv+FAKr/zACs/4YAr/+cAML/vQDD/8AAxQAdACIADP/2ABH/4wAS/+AAFf/2ACT/+wAt/+oAO//qAD3/+ABE//UARf/5AEb/9gBH//cASP/1AEr/9wBL//oATP/3AE3/+gBO//gAT//5AFD/+QBR//oAUv/4AFP/9ABU//YAVf/7AFb/+QBY//sAWv/4AFz/+gB8/+YAkf/3AJ///QCgABwAoQAfAC4ACf/2AA0AFAAQ/+EAEf/LABL/ywAZ/+4AHf/pACP/4AAk/+wAJv/uACf/+wAq//AALf/JADL/8wA0//QAOv/7AEAAFQBE/9EARv/SAEf/1QBI/84ASf/6AEr/1ABO//sAUP/XAFH/2QBS/9MAU//UAFT/1QBV/+MAVv/VAFf/+ABY/9YAWf/zAFr/1gBb/+wAXP/ZAF3/6AB8/7wAkf/iAJ4AFQCfAAkAoAAcAKEAKQCv/9kAwv/rACAAEf/nABL/4QAk//oALf/uADv/8wA9//oARP/zAEX/+ABG//QAR//1AEj/8wBK//UAS//4AEz/+ABN//oATv/2AE//9wBQ//YAUf/4AFL/9gBT//IAVP/1AFX/+QBW//YAWP/5AFr/9QBc//gAXf/7AHz/6QCR//QAoAAbAKEAGwAgAAr/9gAQ/9wAFQAZABf/7AAc/+kAJv/jACr/4gAy/+IANP/kADj/7QA6//QAQAAQAEX/8wBG//YAR//6AEj/9gBJ/+gASv/3AEv/+wBP//AAUf/7AFL/9ABU//gAVf/3AFf/2ABY/+oAWf/SAFr/8wBc/+oAYAAOAGv/9QDC/+QAQAAJ/+wADQAhABD/xAAR/7MAEv++ABP/8AAX//MAGP/1ABn/4QAb//MAHf/VACP/zQAk/9sAJv/aACf/9QAo//oAKv/aACv/+QAt/7IAMv/eADP/+QA0/+QANf/5ADb/+gA6//cAQAATAET/qgBF//sARv+uAEf/tQBI/6YASf/0AEr/tABL//sATv/5AE//+gBQ/7YAUf+9AFL/tgBT/68AVP+xAFX/zwBW/6kAV//wAFj/tgBZ/+EAWv+4AFv/1gBc/7oAXf/OAGAACwBr/+sAfP+hAJH/2QCS/7AAmv+wAJ4AHACgABEAoQAhAKP/wgCq/8kAr/+7AML/2QDD/+4AIQAJ//YAEP/pABf/7gAc/+0AJv/vACr/7wAy/+wANP/sADj/9wA6//sARf/5AEb/+QBH//sASP/6AEn/7gBK//kAS//6AE7/+wBP//gAUP/5AFH/9gBS//gAVP/6AFX/8wBX/+sAWP/zAFn/4QBa//YAW//5AFz/8ABr//AAkf/7AKEAEgAiABP/6wAW//UAF//lABj/9AAZ/+IAG//tABz/5AAm/98AKv/gAC3/7wAy/+AANP/iADcAGgA6//YARP/zAEb/5gBH/+sASP/lAEn/9QBK/+cAUP/zAFH/7wBS/+YAVP/oAFX/7wBW//AAV//vAFj/4wBZ/+cAWv/lAFz/5QBe/+0AngAOAKEADgAbAAr/wgAT//IAFP/fABf/5AAZ//QAGv/kABz/2QAl//YAJv/vACr/7gAy/+wANP/rADf/wgA4/+kAOf/PADr/8wA8/9gARf/1AEn/7ABP//QAVf/2AFf/4gBY//AAWf/fAFr/9QBc//AAuv+8AAgAIwAIADf/ggA5/+EAPP/EAD//6QBAAAsAYAASAMX/+AAkAAr/+AAM/+0ADf/0ABH/9gAS/+gAIv/sACT/+gAl//YAJ//3ACj/+AAp//YAK//4ACz/9gAt//gALv/2AC//9gAw//QAMf/1ADP/9QA1//gANv/3ADf/cQA4//gAOf/WADr/+gA7/9IAPP+0AD3/6QA//98AQP/mAEn//ABg/+wAfP/yALn/5wC6/+0Axf/pAB8ADP/2ABD/5QAS//QAIv/vACX/+gAm//kAKv/5ACz/+gAu//sAL//7ADD/+AAx//oAMv/5ADP/+wA0//kANv/5ADf/aQA4//QAOf/YADr/+AA7/94APP+xAD3/+AA//90AQP/wAFb//ABY//wAW//6AGD/9AC5//YAxf/uABYAEP/3ACX/+gAm//oAJ//6ACj/+gAp//kAKv/6ACv/+gAs//kALv/5AC//+QAw//kAMf/5ADL/+QAz//kANP/5ADX/+gA4//gAOv/6AD3/+wCgABUAoQAZAB4ADP/1ABD/6wAS//QAIv/uACX/+AAn//oAKP/6ACn/+gAr//sALP/5AC7/+AAv//gAMP/3ADH/+AAy//sAM//4ADT/+wA1//oAN/9oADj/9AA5/9UAOv/6ADv/6wA8/7MAPf/6AD//3ABA//AASf/8AGD/9QDF/+0AMQAFACEACgAXAAwAFQANADoAEP/fABH/7gAS/+UAHf/yACIALgAj/+8AJP/1ACUABgAm//oAKv/7AC3/4QAwAAcAMwAKADcAYwA5AEIAOwAzADwAQQA9ADAAPwAYAEAAQQBE/+0ARv/tAEf/8QBI/+gASv/wAEwADABQ//AAUv/wAFP/7gBU/+0AVv/3AFj/+wBa//UAXwAXAGAAOwB8/+EAngBTAJ8AAwCgABQAoQBCAK//+wC5ACsAugAOAML/7wDFADYAIAAN//UAIv/uACX/9gAm//sAJ//4ACj/+AAp//gAKv/7ACv/+AAs//gALv/3AC//9wAw//YAMf/3ADL/+gAz//cANP/5ADX/+AA2//sAN/9dADj/8QA5/9IAOv/4ADz/twA9//oAP//UAEn/9QBX//wAWf/5ALn/7AC6//IAxf/nABIABAAOAAr/9gAN//IADwAHABEAEgAdAAoAHgABACMAFAA3/4IAOf/dADz/xAA//+IAWf/7ALn/5gC6/+0AuwAHAL4ABwDF/+UAGgAS//QAJP/7ACX/+QAm//sAJ//6ACj/+gAp//oAKv/7ACv/+gAs//oALv/5AC//+QAw//gAMf/5ADL/+gAz//kANP/7ADX/+gA2//sAN//jADj/9gA6//sAO//7ADz/+wA9//YAoQAHABcAJf/5ACb/+wAn//oAKP/6ACn/+gAq//sAK//7ACz/+gAu//kAL//6ADD/+AAx//kAMv/6ADP/+QA0//oANf/6ADb/+wA3//cAOP/0ADn/+QA6//oAPP/3AD3/+wAZABD/2gAl//oAJv/pACr/6gAy/+oANP/qADf/kAA4//AAOf/qADr/9AA8/9wAP//sAET//ABG//AAR//2AEj/7wBK//EAT//8AFL/7wBU//MAVv/6AFj/8wBa//AAwv/pAMX/7wADAEAABQBgAAkAcf/jAA4ABAAOAA8ACAARABoAIwATADf/iQA4//oAOf/eADz/yAA//+MAQAAPAGAAEwC7AAgAvgAIAMX/8gAKABD/+AAl//sANP/7ADf/bAA4//cAOf/XADz/uAA//9sAuf/4AMX/7AAjAAz/7QAN//cAEv/qACL/7AAk//sAJf/1ACf/9wAo//cAKf/2ACv/+AAs//YALv/2AC//9gAw//MAMf/0ADP/9QA1//cANv/4ADf/XQA4//UAOf/TADr/+gA7/9YAPP+wAD3/7wA//9YAQP/nAEn/9ABZ//wAXf/4AGD/7AB8//gAuf/tALr/8wDF/+oAIQAM/+4AEv/rACL/7QAk//sAJf/1ACf/9wAo//cAKf/2ACv/+QAs//YALv/1AC//9QAw//QAMf/0ADP/9QA1//gANv/5ADf/XgA4//UAOf/UADr/+gA7/9YAPP+zAD3/7wA//9cAQP/nAEn/9wBd//oAYP/sAHz/+AC5//AAuv/3AMX/6wAjAA3/9gAPAAkAIv/tACX/9gAm//oAJ//4ACj/+AAp//gAKv/6ACv/+AAs//gALv/3AC//9wAw//YAMf/3ADL/+QAz//cANP/5ADX/+AA2//oAN/9ZADj/8QA5/9EAOv/3ADz/tAA9//gAP//UAEn/8wBX//wAWf/5ALn/7gC6//QAuwAJAL4ACQDF/+kAJwAM/+4ADQAFABD/ywAR/8cAEv/UACL/7AAj//IAJP/yACX/+gAn//gAKP/5ACn/9gAr//gALP/4AC3/oAAu//gAL//4ADD/9gAx//cAM//4ADX/+QA2//oAN/+SADn/9AA7/7UAPP/bAD3/1AA//+4AQP/jAET/9ABG//cAR//7AEj/7wBK//oAUv/8AFP/+QBU//kAYP/tAHz/uwAeAAz/9QAQ//IAEv/0ACL/7wAl//gAJ//6ACj/+QAp//kAK//7ACz/+QAu//gAL//4ADD/9wAx//cAMv/7ADP/+AA0//sANf/5ADf/ZQA4//UAOf/WADr/+gA7/+0APP+xAD3/+gA//9wAQP/xAEn/+wBg//YAxf/uAAgAEP/gADf/lwA4//oAOf/uADz/4AA//+0Awv/uAMX/9QAfAAz/7gAR//cAEv/oACL/7gAk//oAJf/3ACf/+AAo//gAKf/3ACv/+AAs//cALf/5AC7/9wAv//cAMP/2ADH/9gAz//cANf/4ADb/+QA3/2oAOP/4ADn/3QA6//oAO//VADz/vwA9/+sAP//iAED/5wBg/+0AfP/zAMX/8wAnAAz/8QANAA8AEP/pABH/4QAS/9kAHf/4ACL/8wAj/+8AJP/yACf/+wAp//kAK//7ACz/+wAt/88ALv/7AC//+wAw//kAMf/7ADX/+wA3/5cAOf/7ADv/1QA8/+4APf/mAD//9QBA/+wARP/wAEb/8wBH//YASP/sAEr/9gBQ//sAUv/3AFP/8wBU//MAVv/8AFr/+gBg//IAfP/OACEADP/xAA3/9gAS//AAIv/tACX/9gAn//gAKP/4ACn/+AAr//kALP/3AC7/9gAv//YAMP/1ADH/9gAz//YANf/4ADb/+wA3/2AAOP/0ADn/1gA6//oAO//gADz/tgA9//QAP//WAED/7QBJ//cAWf/7AF3/+wBg//AAuf/tALr/9ADF/+gAFAAEABQADAAIAA8ADwAQ/+kAEQAYAB0AEgAeAAEAIwAbACb/+AAq//YAMv/yADT/8gA3/54AOf/jADz/3wA///AAQAANAGAADQC7AA8AvgAPABoAEP/4ACL/8AAl//gAJv/6ACf/+gAo//oAKf/6ACr/+gAr//oALP/6AC7/+QAv//kAMP/4ADH/+QAy//kAM//5ADT/+QA1//oAN/9xADj/9AA5/9gAOv/5ADz/wgA9//sAP//gAMX/7wAaABD/5QAi//IAJf/3ACb/+QAn//oAKP/5ACn/+gAq//kAK//6ACz/+QAu//gAL//4ADD/9wAx//gAMv/4ADP/+AA0//gANf/5ADf/bAA4//IAOf/WADr/+AA7//sAPP/EAD//3wDF/+8AEgAL//YAE//0ABf/5wAZ//EAHP/mACb/7QAq/+0AMv/rADT/6wA4//QAOwAWAEn/9gBX/+8AWP/zAFn/6gBc//MAXv/vAHwADQACAKAAEQChABMAAQAM//YAAwA3/74APP/uAE0AJQACABf/8QAa//EABgAt/+4AN//gADv/6wA8/+wAPf/qAHz/6wABABn/8gAFABT/4gAV/9EAFv/gABr/2wBP/+MAMgAk/+kAJf/rACb/7AAn/+sAKP/rACn/7AAq/+0AK//rACz/7AAt/90ALv/rAC//6wAw/+sAMf/uADL/7QAz/+0ANP/tADX/7QA2/+4AN/+wADj/7AA5/+MAOv/sADv/7AA8/90APf/kAET/6ABF/+sARv/oAEf/6ABI/+cASf/0AEoABgBL/+sATP/pAE7/6wBP/+oAUP/pAFH/7ABS/+kAVP/nAFX/7QBW/+YAV//xAFj/6wBZ//EAWv/pAFv/8ABd/+wAfP/gAAEADAAIAAIADAA4AD8AMgACAAwAHgA/AA0AIgAK//YADP/2AA3/8gAS//IAJf/1ACf/+AAo//cAKf/4ACv/+QAs//YALv/2AC//9QAw//QAMf/1ADL/+gAz//UANP/6ADX/+AA3/9oAOP/xADn/6AA6//kAO//mADz/4gA9//cAP//sAEn/9wBX//kAWf/4AFv/+wBd//kAuf/2ALr/+ADF//UAAgANABkAxQAHAAEAxQAWAAYADQAiACIACQBAACsAYAAcALkADgDFABAADwAEABMABQAyAAoAMAANABQAIgAOAEUAGQBLABkATgAVAE8ABwBfACoAYAAHAGsABwC5ACcAugA4AMUAIAATAAQAFAAFADIACgAsAAwADwANACwAIgA8AD8AGwBAACQARQAaAEsAGQBMABQATQAZAE4AFQBPAAcAXwAsAGAALgC5ADUAugAvAMUAUgAPABH/ogAk/+4ALf+zAET/6QBG/+wAR//fAEj/5gBK//AAUv/yAFP/8ABU//AAfP+wAJ8ADgCgAC0AoQAuABMAEf+hABL/ugAj/9UAJP/rACb/9QAq//cALf+zAET/5QBG/+kAR//bAEj/4gBK/+wAUv/uAFP/7ABU/+0AfP+tAKAAHQChACYAwv/0AAEATQAIAAQAEf+PAJ8ACwCgACoAoQAoAAMAEf+PAKAAGgChACQAAgAF/4IATQAIAAMAN/+7ADn/8AA8/+cACQAt//AAN/+3ADn/6wA7/9wAPP/OAD3/9gBJ//QAXf/vAHz/7gADABf/9gAa//YAHP/wAAgAJP/3AC3/rwA3AAoAR//2AHz/xACfABUAoAA0AKEANAAAAAEAAAAKACYAKAACREZMVAAObGF0bgAYAAQAAAAA//8AAAAAAAAAAAAAAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
