(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.julee_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AT0ALQE9AAAB0QBQAfQALgDZAAoBkQAjANQAJwHMAAAB9AAfAfQALQH0AAAB9AAfAfT/+gH0ACkB9AAoAfQAJwImADYB9AAmANQAJwDUAAkB9AAsAfQALgH0AC0BlQBBA3IAQgH2/+gB/QAeAegAHgIdACMCHgA7AbEALQIaAB4CYwA8AQUAUAGN/8UB6wBLAaYAUAL5AEwCTABCAkUAHgHgADcCRQAbAhAANwG2AAAByQAUAmMAUAHeABkDJAAZAf0ADwG5ADcB4AAAAVsAVQHMAAABWwAAAfQAMgG9AAABPwAyAdYAGAHZADYBmAApAcsAGAGqACkBIAALAb8AEgHuAEQA5wBGAOf/lgHCADwA8gA8AuwAPwHyAD8B3QAqAfAALgHDABgBSQA/AXAADwE5AA4B/wBHAZYANQKSADUBqwASAZYACAGXABgBWwAkATwAbAFbAAAB9AAzANT/+wH0AGEB9AAfAfQAHgH0ADwBPABsAfcAIwGRADIC5gAyAS4AEgIgACgB9AAmAuYAMgE5ACgBLwAeAfQALgEs//sBLAANAT8AMgH/AEUBsAAAANQAJwGYAE0BLAAUATIAHAIgADwDKQApAykAKQMpAAkBlQAWAfb/6AH2/+gB9v/oAfb/6AH2/+gB9v/oAvz/+AHoAB4CHgA7Ah4AOwIeADsCHgA7AQUAFQEFABUBBf/5AQX/+AId//wCTABCAkUAHgJFAB4CRQAeAkUAHgJFAB4B9ABHAkUAHgJjAFACYwBQAmMAUAJjAFABwQAZAcYARgIUAAsB1gAYAdYAGAHWABgB1gAYAdYAGAHWABgCpQAYAZgAKQGqACkBqgApAaoAKQGqACkA5wAbAOcABgDn//0A5//1Ad0AKgHyAD8B3QAqAd0AKgHdACoB3QAqAd0AKgH0AC4B3QAqAf8ARwH/AEcB/wBHAf8ARwGWAAgB9QA8AZYACADnAEYBpgAAAPL/9gNsAB4C1wAqAbYAAAFwAA8BwQAZAeAAAAGXABgB9P/fAXcAMgF3ADIBTQAzAO4AMgElADIBqgBgAasAPgG0ADICOAAoAkwAAAL5AAAAxQAnANkACgDZAAoBgQAnAZUACgGVAAoBPP/uATz/3wEMACcCfAAnBFQAMgFJACgBSQA8AykArgEs//kB9AAIA0AAHAL1ACkB3QAqAhUAGQLJAAwCoAArAfQALgKdAB4CxgA1ASn/xQH0ADMB9AAuAfQALAH0AC0CJwAjAfMACwIRAAsAAQAAA37+5AAABFT/lv/EBDYAAQAAAAAAAAAAAAAAAAAAAPcAAgGHAZAABQAAArwCigAAAIwCvAKKAAAB3QAyAPoAAAIAAAAAAAAAAACAAACvQAAgSwAAAAAAAAAAVElQTwBAACD7AgN+/uQAAAN+ARwgAAERQAAAAACZAM8AAAAgAAIAAAACAAAAAwAAABQAAwABAAAAFAAEAUAAAABMAEAABQAMAH4ArAD/ATEBQgFTAWEBeAF+AZICxwLdA8AgFCAaIB4gIiAmIDAgOiBEIHQgrCEiISYiAiIGIg8iEiIaIh4iKyJIImAiZSXK+wL//wAAACAAoQCuATEBQQFSAWABeAF9AZICxgLYA8AgEyAYIBwgICAmIDAgOSBEIHQgrCEiISYiAiIGIg8iESIaIh4iKyJIImAiZCXK+wH////j/8H/wP+P/4D/cf9l/0//S/84/gX99f0T4MHgvuC94LzgueCw4Kjgn+Bw4DnfxN/B3ube497b3tre097Q3sTeqN6R3o7bKgX0AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAMAJYAAwABBAkAAAC4AAAAAwABBAkAAQAKALgAAwABBAkAAgAOAMIAAwABBAkAAwBAANAAAwABBAkABAAaARAAAwABBAkABQAaASoAAwABBAkABgAaARAAAwABBAkABwBKAUQAAwABBAkACAAYAY4AAwABBAkACQAYAY4AAwABBAkADQEgAaYAAwABBAkADgA0AsYAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADEALAAgAEoAdQBsAGkAYQBuACAAVAB1AG4AbgBpACAAKABqAG8AdABhAGQAZQBqAHUAbABpAGEAbgBAAGgAbwB0AG0AYQBpAGwALgBjAG8AbQApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEoAdQBsAGUAZQAiAEoAdQBsAGUAZQBSAGUAZwB1AGwAYQByAEYAbwBuAHQARgBvAHIAZwBlACAAMgAuADAAIAA6ACAASgB1AGwAZQBlACAAOgAgADQALQA5AC0AMgAwADEAMQBKAHUAbABlAGUALQBSAGUAZwB1AGwAYQByAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEASgB1AGwAZQBlACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAASgB1AGwAaQBhAG4AIABUAHUAbgBuAGkALgBKAHUAbABpAGEAbgAgAFQAdQBuAG4AaQBUAGgAaQBzACAARgBvAG4AdAAgAFMAbwBmAHQAdwBhAHIAZQAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUAbgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUALAAgAFYAZQByAHMAaQBvAG4AIAAxAC4AMQAuACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABpAHMAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATABoAHQAdABwADoALwAvAHMAYwByAGkAcAB0AHMALgBzAGkAbAAuAG8AcgBnAC8ATwBGAEwAAgAAAAAAAP+1ADIAAAAAAAAAAAAAAAAAAAAAAAAAAAD3AAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKANoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBs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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
