(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.belgrano_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AQQARwG7ACQC4gA5AfQAJQJnAEACZQA/AnEAHgJ0AEICfQA9AjkAKQKIADoCfQA6AQgASQEbAE4BpQAwAiUATAGlAD8CBwApAx8ANQLp//YCqwAzAp0ANgMLADMCpQAzAo8ANAL3ADYDPgAzAYEAMwHiAA0C8gAzAn0AMwOlABQDGAAzAxgANgJ8ADMDGQA3AsEAMwI2AEMCtAAVAwkAHAMK//MERf/4AvMAEQKN//UCngA3AWgAYwG7ACMBaAAjAaQAMgKhAIYBPgAyAjIAJwJL//4CCwAuAmoALwIrAC8BkwAoAk0AGQKDAB0BTAArASP/lgJ9AB0BQAAdA80AKQKPACkCXgAuAmsAHAJLAC8B3QApAd4AMgGYACgCfAAVAqwAHgOLAAMCbAAYAnT//wIIAC8BTgAjARkAYwFOACgB+gBBARgASAINADYB9QA0AkkAOwLWACEBHQBlAjUAQgG1ADIC+gA5AYoAOwJgAC8CJABFAVAASQL6ADkBawA5AicATQGnAEwBpgBEAT4AMgI9AF8DEwAmAQYASAEQADIBlgA2AZwANwJgAD8DWAAnA2IAJQNlADQB9QAjAun/9gLp//YC6f/2Aun/9gLp//YC6f/2BAH/6gKdADYCpQAzAqUAMwKlADMCpQAzAYEAFQGBADMBgQAYAYEAFAMLADMDGAAzAxgANgMYADYDGAA2AxgANgMYADYB1QBFAxgANgMJABwDCQAcAwkAHAMJABwCjf/1AkwAMAKgABoCMgAnAjIAJwIyACcCMgAnAjIAJwIyACcDagAnAgsALgIrAC8CKwAvAisALwIrAC8BTAAEAUwAKwFMAAMBTP/3Am4AMgKPACkCXgAuAl4ALgJeAC4CXgAuAl4ALgIbAEcCXgAuAnwAFQJ8ABUCfAAVAnwAFQJ0//8CTwABAnT//wJ9ADMBWwAQA6IANgPQAC4CNgBDAd4AMgKN//UCngA3AggALwK0ABwBpAAyAaQAMgFjADIBFgAyAQYAMgHkADMB4wAyApsASQPcAEkAzwAkAPgAPQELAEcBdAAkAaYAPQG5AEcBdgA0AXoANgGOAFUCYgBHBUcAJgFZAC8BWQA/AvsANQP2AEECEQBBAtkAKALaACgAAQAAA97+6gAABUf/lv/cBSIAAQAAAAAAAAAAAAAAAAAAAOUAAgH0AZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAACAAACvQAAASgAAAAAAAAAAcHlycwBAACD7AgPe/uoAAAPeARYAAAABAAAAAAHzAsIAAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEAOAAAAA0ACAABAAUAH4ArgD/AUIBUwFhAXgBfgGSAscC2ALdA34DvCAUIBogHiAiICYgMCA6IKwhIiJg+wL//wAAACAAoQCwAUEBUgFgAXgBfQGSAsYC2ALaA34DvCATIBggHCAgICYgMCA5IKwhIiJg+wH////j/8H/wP9//3D/ZP9O/0r/N/4E/fT98/yg/LngvuC74LrgueC24K3gpeA037/eggXiAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAADKAAAAAwABBAkAAQAQAMoAAwABBAkAAgAOANoAAwABBAkAAwA2AOgAAwABBAkABAAgAR4AAwABBAkABQAaAT4AAwABBAkABgAgAVgAAwABBAkABwBcAXgAAwABBAkACAAgAdQAAwABBAkACQAgAfQAAwABBAkACwAkAhQAAwABBAkADAAqAjgAAwABBAkADQEgAmIAAwABBAkADgA0A4IAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEAIABiAHkAIABMAGEAdABpAG4AbwBUAHkAcABlACAATABpAG0AaQB0AGEAZABhACAAKABpAG4AZgBvAEAAbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtACkALAAgACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlAHMAIAAiAEIAZQBsAGcAcgBhAG4AbwAiAEIAZQBsAGcAcgBhAG4AbwBSAGUAZwB1AGwAYQByADEALgAwADAAMwA7AFUASwBXAE4AOwBCAGUAbABnAHIAYQBuAG8ALQBSAGUAZwB1AGwAYQByAEIAZQBsAGcAcgBhAG4AbwAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBCAGUAbABnAHIAYQBuAG8ALQBSAGUAZwB1AGwAYQByAEIAZQBsAGcAcgBhAG4AbwAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAEwAYQB0AGkAbgBvAFQAeQBwAGUAIABMAGkAbQBpAHQAYQBkAGEARABhAG4AaQBlAGwAIABIAGUAcgBuAIcAbgBkAGUAegBEAGEAbgBpAGUAbAAgAEgAZQByAG4AYQBuAGQAZQB6AHcAdwB3AC4AbABhAHQAaQBuAG8AdAB5AHAAZQAuAGMAbwBtAHcAdwB3AC4AaABlAHIAbgBhAG4AZABlAHoAdAB5AHAAZQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAOUAAAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAKMAhACFAL0AlgDoAIYAjgCLAJ0AqQCkAQIAigCDAJMA8gDzAI0AlwCIAMMA3gDxAJ4AqgD1APQA9gCiAK0AyQDHAK4AYgBjAJAAZADLAGUAyADKAM8AzADNAM4A6QBmANMA0ADRAK8AZwDwAJEA1gDUANUAaADrAO0AiQBqAGkAawBtAGwAbgCgAG8AcQBwAHIAcwB1AHQAdgB3AOoAeAB6AHkAewB9AHwAuAChAH8AfgCAAIEA7ADuALoA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA2wDdAOAA2QDfALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/AQMAjACPAMAAwQd1bmkwMEFEBEV1cm8AAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAwDkAAEAAAABAAAACgAkADIAAkRGTFQADmxhdG4ADgAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAyAAEAAAAXwFEAVYBfAG6AiwCOgKAAooC8AMyA2QDigPgA+4EAAQyBDgESgSMBJ4EvATKBOgFZgXMBdoGOAY+BnwGygcUB5IHwAgqCGgI4gk8CXoJ+AoiCqgLIgv8DMIM8A2SDbwOQg64Dv4PaA+WD8QQDhB4ELIQ3BDmERgRThGYEgISLBLGEwATMhN4E+4UXBSOFQAVLhWgFaYVtBXOFdQV9hX8FgYWiBb2FzwXRhdcF4IXzBf2F/wX/BgGGAwYGhhEGEoAAgAUAAUABQAAAAkADQABAA8AHQAGACMAKgAVACwAMwAdADUAPwAlAEQASgAwAEwATwA3AFEAUgA7AFQAYAA9AGIAYgBKAGQAZABLAG8AcABMAHcAdwBOAH8AfwBPAJ4AnwBQAK0ArQBSAK8AsABTANMA2ABVAN4A4QBbAAQAD/96ABH/fgDV/3oA2P9rAAkACv/vACQAGQAtAAUAN//wADn/7wA6//AAWf/zAIYAJQDU//MADwAJ/+8AEf+RABL/vwAX/84AI//RACT/wAAm//gALf/iAET/9QBH//EASv/zAFL/8gBW//QAhv+9AN7/sAAcAAv/8gAT/+kAFv/0ABf/5gAZ/+oAG//tABz/8gAk//MAJv/oAC3/8gAy/+gANv/tAET/5QBH/+IASf/2AE0AZABR/+8AUv/eAFb/5ABX/+sAWP/uAFn/6QBa/+4AXAAHAF3/6gBe//IAhv/2ALD/8wADAAz/8wBA//EAYP/1ABEAJP/FACwAFQAt/+IAMAAFADgAHQA5ADoAOgA1ADsAJAA8ADQARQAQAEf/9wCG/7YAngAIAK4AFQCvABcAvgAKANQAFQACAAX/egDW/3oAGQAU//YAGv/zACT/8QAs//cALf+8ADD/9gA3/78AOf/TADr/2AA7/+0APP/PAD3/9gBJ//QAS//2AEz/8QBN//QAT//2AFH/8QBT//UAWf/jAFr/5wBb/+cAXP/lAF3/9QCf//gAEAAF/34ACv+RABr/5AAy//cAN//cADj/7AA5/7kAOv/AADz/4ABZ/90AWv/ZAFz/0QDT/5gA1P+EANb/fgDX/34ADAAS/10AJP/nAC3/8AA5AA0AOgAIADwACwBE//QAR//vAEr/7wBS/+4AVv/xAIb/5wAJAAz/6QAS/+UAJP/yAC3/8gA5//IAOv/zAED/5QBg/+sAhv/xABUACv/rAAz/9gAO//YAE//1ABf/8wAa//IAJAAgACb/8wAtAAgAMv/yADf/7wA4/+8AOf/qADr/6wA8//MAP//zAED/7ABg//YAcP/qAHf/5gCGACwAAwAM//AAQP/qAGD/8QAEAAz/6wAS/+wAQP/oAGD/7QAMAAr/7AAM//IAGv/zACQABQA3//AAOf/tADr/7gA8//UAQP/rAGD/8wBw/+wAhgARAAEAEv/rAAQADP/zABL/7ABA//AAYP/0ABAABv/eAA7/9AAQ/+MAEf/HABL/zQAX/+EAJP/QACb/9gAt/+wAMv/2ADkAIwA6AB4APAAhAGP/3QB3//EAhv/OAAQADP/tABL/6wBA/+oAYP/vAAcADP/rABL/5QAk//QALf/2AED/6ABg/+0Ahv/0AAMAOf/kADr/5QA8/+0ABwAK/+0AJP/yAC3/7wA5/+YAOv/oADz/6wCG//EAHwAK/74ADf/EABD/8gAT//UAF//0ABr/6gAm/+0ALQAYADL/6wA3/8AAOP/aADn/tgA6/7sAPP/FAD//6gBA/+wAR//0AE3/+wBS//IAU//7AFf/9ABY//QAWf/PAFr/zwBc/8oAYP/2AG//7QCw//QA0/+zANT/yQDh/8UAGQAM/+oAEv/tACT/8AAs//oALf/7ADf/+QA4//gAOf/rADr/7QA7//YAPP/zAED/5wBK//sAS//4AE3/+wBP//gAU//7AFn/7ABa//cAXP/3AGD/7ACG//UAn//7ANP/8ADh//cAAwAm//oAMv/6AFn/8wAXAAz/6AAR//cAEv/jACT/5gAs//QALf/eADD/9AA3//kAOP/4ADn/5AA6/+cAO//gADz/7AA9//sAQP/jAET/+wBK//sAS//zAE//8wBb//sAYP/qAIb/5gDT/+gAAQBZ//gADwAQ/+4AEf+9ABL/1QAj//YAJP/OAC3/wgBE/+kAR//gAEn/+wBK/9sAUv/jAFb/5QBd//UAhv++AN7/9AATAAz/7gAS/+oAJP/xAC3/9QA3//UAOf/fADr/4QA7/+wAPP/tAD3/+QBA/+0AS//7AE//+wBZ/+cAWv/5AFz/+QBg//MAhv/sANP/9wASABD/9wAm//YAMv/1AET/+gBH/+0ASv/4AE3/+gBS/+oAU//vAFb/+QBX/+4AWP/wAFn/7gBa/+sAXP/sAG//9QCf//IAsP/1AB8AEf/wABL/2gAj//UAJP/eACb/9gAt/+cAMv/2ADb/+wBE/+MAR//kAEn/7QBK/+cATP/5AE3/+wBR/+gAUv/lAFP/5wBW/+AAV//pAFj/7ABZ//IAWv/uAFv/9gBc/+8AXf/mAIb/5ACf/+8Arf/uAK8ACACw//IA3v/xAAsAEP/xACb/zwAtAAgAMv/QAEf/+gBS//QAV//1AFj/9ABZ/94AWv/FAFz/uwAaAAr/uQAM//QADf+2ABr/5wAm//sAMv/6ADf/pwA4/+wAOf+rADr/rQA8/7AAP//tAED/6wBN//kAU//5AFj/+QBZ/7UAWv/BAFz/rwBg//UAd/+xAIYACwCf//sA0/+3ANT/ugDh/7MADwAQ//YAJv/2ADL/9QBH//kATf/4AFL/9gBT//QAV//wAFj/8QBZ/+UAWv/aAFz/2gBv//UAn//2ALD/+QAeABL/5QAj//YAJP/zACb/9gAt//UAMv/2AET/5gBH/+oASf/vAEr/7ABM//kATf/6AFH/6wBS/+oAU//qAFb/5gBX/+8AWP/tAFn/8gBa/+0AW//5AFz/7gBd/+gAb//2AIb/+wCf/+4Arf/vAK8ABACw//IA3v/wABYADP/oABH/9wAS/+QAJP/oACz/9QAt/+IAMP/1ADf/+QA4//gAOf/mADr/6AA7/+MAPP/tAD3/+wBA/+QARP/7AEv/9ABP//QAW//7AGD/6wCG/+gA0//qAA8AEP/sABH/sQAS/9wAJP/RACz/+gAt/8oAMP/zADv/9wBA//YAR//0AEr/9gBS//YAVv/6AIb/xQDT/+8AHwAM//QADf/3ABP/9gAX//AAGv/1ACL/9QAm//QAMv/zADf/7wA4/+4AOf/cADr/3wA8/+YAP//zAED/6wBF//sAR//1AEr/+gBN//gAUv/zAFP/+ABX//YAWP/4AFn/5QBa/+wAXP/sAGD/8wBv//MAn//5ALD/9QDh//AACgAM//UAEv/oACT/8QBK//gAWf/zAFr/+QBc//kAXf/7AIb/+ACf//sAIQAJ//IAEP+9ABH/2QAS/9YAF//eACP/5gAk/78AJv/4AC3/1QAy//kARP+xAEUADABH/64ASf/uAEr/sABM//sAUf/PAFL/rwBT/88AVv+rAFf/7wBY/9EAWf/1AFr/2ABb/9UAXP/ZAF3/xgCG/7MAn//zAK3/6QCuAAYArwATAN7/1wAeABH/7AAS/9gAI//2ACT/1QAm//gALf/gADL/+ABE/+QARQAFAEf/5ABJ//EASv/nAEz/+wBR/+sAUv/kAFP/6gBW/+IAV//pAFj/8ABZ//UAWv/yAFv/+ABc//MAXf/oAIb/2gCf//MArf/xAK8ADgCw//YA3v/zADYACf/tAA0AJAAQ/9MAEf+5ABL/yQAT//MAF//bABn/9gAaAAoAHf/kACIACQAj/9YAJP+2ACb/5QAt/7sAMv/mADb/8AA/AA0AQAAOAET/qgBFAC4AR/+1AEn/6QBK/7QASwAPAE8ADwBR/8oAUv+2AFP/0wBW/68AV//TAFj/2gBZ/9wAWv/VAFv/3gBc/9cAXf/AAGAACgBv/+cAhv+jAJ//7wCi/7oAo//MAKT/sACt/+IArgAQAK8AMgCw//cAtf/DAMEAAQDTAAYA3v/QAN//4wDhABcAMQAJ/+4ADQAgABD/2AAR/8AAEv/KABP/9AAX/90AGf/2ABoABQAd/+UAIgAFACP/2QAk/7sAJv/nAC3/vgAy/+gANv/xAD8ACABAAAoARP+xAEUAKQBH/70ASf/qAEr/vQBLAAoATwAKAFH/zwBS/74AU//XAFb/twBX/9gAWP/dAFn/3gBa/9cAW//iAFz/2gBd/8YAb//oAIb/qACf//AAo//NAK3/4wCuAAwArwAuALD/+ADBAAEA3v/UAN//5ADhABMACwAQ/+8AJv/gADL/4QBH//QAUv/tAFP/+QBX//UAWP/0AFn/5QBa/9YAXP/QACgACf/vAA0AEgAQ/9AAEf/nABL/2AAT//UAF//bAB3/7QAj/94AJP/BACb/5gAt/8kAMv/oADb/8wBE/7wARQAbAEf/wABJ/+sASv/CAFH/1wBS/8AAU//UAFb/uwBX/9YAWP/bAFn/3gBa/9YAW//mAFz/1wBd/9AAb//qAIb/swCf/+4Ao//LAK3/5QCvACAAsP/5AN7/1ADf/+oA4QAFAAoAMv/7AEr/+wBS//sAU//1AFf/9gBY//kAWf/rAFr/7gBc/+4An//2ACEAC//xABP/5QAU/+8AFf/yABb/8QAX/+MAGf/nABv/6gAc/+0AJP/pACb/5AAt/+0AMv/kADb/6QA5AA4AOgAKADwADABE/+IAR//fAEn/8wBNAGcAUf/qAFL/3ABW/+AAV//qAFj/7ABZ/98AWv/pAFv/9gBd/+UAXv/0AIb/7ACw//YAHQAK/78AE//lABb/8AAX/+sAGP/vABn/5wAa/9kAG//rABz/7AAm/+UAMv/kADb/7gA3/9cAOP/ZADn/yQA6/8oAPP/XAET/8gBF//UAR//rAE0AWQBS/+gAVv/wAFf/5wBY/+YAWf/WAFr/2QCw/+0A1P/IABEACv/4AAz/7gAQ//gAJv/4ADL/9wA3/7MAOP/lADn/ogA6/60APP++AD//7QBA/+UAWf/eAFr/7wBc/+4AYP/vANP/7wAaAAr/8QAM/+IAEv/pACL/8AAk//IALP/rAC3/7wAw//QAN/+yADj/5QA5/7gAOv+/ADv/4wA8/8AAPf/tAD//8gBA/+AAS//7AE//+wBZ/+gAWv/tAFv/6gBc/+sAYP/nAIb/8QDT/+wACwAM/+4AEP/3ADf/uAA4/+wAOf/AADr/xQA8/88AQP/qAFn/+gBg//EA0//3AAsAEP/3ACb/9QAy//QAN//yADj/7AA5//MAOv/yADz/+gBZ/98AWv/3AFz/9wASAAr/9AAM/+MAEv/tACz/9gA3/6MAOP/nADn/pQA6/64APP+rAD3/9QA///MAQP/gAFn/7QBa/+4AW//1AFz/7wBg/+cA0//sABoADAAiAA0AKgAQ/9sAEv/tACIADwAk//gALf/zADcAIQA4ABoAOQBDADoAPgA7ACUAPABBAD8AGQBAACAAR//4AFL/+gBgABwAngAOAKwACwCvACAAsP/sANMAHQDUAAYA3v/uAOEAIQAOABD/+AAk//cALP/4AC3/+QAw//sAN//aADj/9QA5/9gAOv/YADv/9gA8/9wATQAjALD/+gDT//QACgAQ//UAJv/1ADL/9AA3//YAOP/1ADn/+wA6//oAWf/eAFr/9QBc//UAAgBNAAsAWf/0AAwAEP/cACb/6gAy/+kAN//KADj/6gA5/7sAOv/AADz/1ABH/+cAUv/iAFn/8wCw/+YADQAQ//YAJv/1ADL/9AA3//MAOP/rADn/8gA6//IAPP/5AFL//ABZ/98AWv/2AFz/9wB3/+EAEgAK//cADP/vABD/9wAi//YAJv/1ADL/9AA3/7EAOP/lADn/oQA6/6sAPP+9AD//7ABA/+UAWf/cAFr/7wBc/+8AYP/vANP/7gAaAAr/8gAM/98AEv/oACL/8QAk//IALP/qAC3/8AAw//UAN/+xADj/5AA5/7YAOv++ADv/4gA8/74APf/sAD//7gBA/9wAS//8AE///ABZ/+EAWv/wAFv/6gBc/+0AYP/kAIb/9ADT/+sACgAs//YAN//CADj/9AA5/8IAOv/IADz/zwA9//gATQCKAFn/9ADT//IAJgAJ//YACv/0AAz/4QAQ/+4AEf/bABL/1wAi//YAJP/RACb/+QAs/+EALf+0ADD/2gAy//kANv/2ADf/tQA4/+oAOf/HADr/ygA7/88APP/LAD3/8QBA/94ARP/2AEf/9gBK//cAS//yAE//8gBS//cAVv/4AFn/9wBd//oAX//2AGD/4wCG/88AsP/wANP/6gDe//MA4f/4AA4ACv/2AAz/5AAS/+0ALP/3ADf/uAA4/+cAOf+0ADr/ugA8/78APf/7AED/4QBZ//cAYP/oANP/7gAMAAz/8AAkAAcAN//BADj/8AA5/8kAOv/PADz/2ABA/+kAWf/6AGD/8QCGABQA0//3ABEADP/rABD/9QAi//UAJv/1ADL/8wA3/7IAOP/kADn/qQA6/7EAPP+9AD//7ABA/+MAWf/dAFr/9QBc//QAYP/sANP/8AAdAAn/8gAM/+kAEP/jABH/3QAS/9YAJP/NACz/7gAt/8cAMP/lADf/9gA4//UAOf/cADr/3gA7/+UAPP/kAED/3wBE//AARf/5AEf/3gBK/+MAS//fAE//3wBS/+EAVv/vAGD/6ACG/8oAsP/YANP/3ADe//IAGwAM/+wAEP/mABH/2QAS/9gAJP/NACz/6QAt/7wAMP/ZADf/1QA4//AAOf/UADr/1QA7/9gAPP/ZAED/6ABE//gAR//vAEr/8QBL//QAT//0AFL/8gBW//IAYP/sAIb/xwCw/94A0//zAN7/6wAMABD/6AAm//sAMv/7ADf/1wA4//gAOf/eADr/4gA8/+cAQP/2AEf/6QBS/+kAsP/hABwACf/1AAz/7gAQ/+QAEf/TABL/2AAk/8gALP/nAC3/tQAw/9gAN//VADj/8AA5/9IAOv/UADv/0gA8/9kAQP/oAET/9gBH/+0ASv/vAEv/8wBP//MAUv/wAFb/8gBg/+0Ahv/CALD/3QDT//MA3v/pAAsADP/pABD/8AA3/8gAOP/mADn/uAA6/74APP/KAED/5ABZ//cAYP/rANP/8QAcAAv/9QAT/+sAFP/0ABb/9QAX/+oAGf/sABv/7wAc//IAJP/zACb/6wAt//MAMv/rADb/7gA5AAoAPAAIAET/6QBH/+cATQBiAFH/8ABS/+QAVv/oAFf/7QBY/+8AWf/oAFr/7QBd/+sAXv/1AIb/9QABAE0AKAADAAz/8gBA//QAYP/1AAYAN//yADj/8QA5/9oAOv/cADz/5QBNADYAAQAX//IACAAk/+oALP/0AC3/6QAw//QAOf/nADr/6AA8/+wAhv/oAAEAF//kAAIAL//tAE//4QAgACT/5wAm/+wALP/jAC3/4QAw/+gAMv/rADb/7QA3/98AOP/dADn/xAA6/8YAO//vADz/zwA9/+wARP/rAEX/8QBH/+kASf/wAEv/5wBM//EATQBHAE//5wBR//EAUv/pAFb/6gBX//EAWP/0AFn/6gBa//AAXf/sAIb/7QCw/+gAGwAK/78ADP/nAA3/4QAR/9kAEv/nABT/8wAi//IAJP/kACz/7gAt/9YAMP/tADf/3wA4//UAOf/TADr/0wA7/7oAPP/YAD3/7gBA/+UAS//0AE//9ABZ//oAYP/tAIb/4gDT/64A1P/aAOH/8QARAAz/7AAm//oAMv/4ADf/vwA4/+QAOf+oADr/rgA8/70AP//1AED/6gBN//sAU//7AFn/xwBa/98AXP/fAGD/7wCf//wAAgBFABEAvgAPAAUADQAJAEUADABLAAgATwAIAOEACAAJABL/5wAk/+kALP/2AC3/3gAw//EAOP/7AD3/+gBZ//cAhv/xABIAEf+YACT/tQAm/+kALf/gADL/6gA5AAUARP/vAEf/8ABK/+sAUf/2AFL/6wBT//YAVv/sAFn/3ABa//MAXP/zAF3/8QCG/7MACgAJ//IAEf+EABL/xgAj/+MAJP/FAC3/5wBH//YAUv/4AIb/vwDe/98AAQAF/3oAAgAP/3oAEf9+AAEABf9rAAMAOf/jADr/5AA8/+wACgAK/7AAN//YADj/8wA5/9AAOv/UADz/1ABZ//IAWv/sAFz/6wDU/+cAAQAX//MABAAk/9UALf/UADD/+ACG/8QAAAABAAAACgAmACgAAkRGTFQADmxhdG4AGAAEAAAAAP//AAAAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
