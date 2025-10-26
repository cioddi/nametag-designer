(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.nothing_you_could_do_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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AU8DUBImAE8AABAHAHMApQEm////9f//AqwC7RImAC8AABAGABDY+f///9IABgGLAqISJgBPAAAQBgAQtQD//wAKAAADcANVEiYAMQAAEAcAcwHMASv//wASAAACIgJ1EiYAUQAAEAcAcwEkAEv//wAKAAADcANKEiYAMQAAEAcBCAHZAPX//wASAAACIgKaEiYAUQAAEAcBCAD8AEX//wAUAAECQwNxEiYAMgAAEAcBDQDpAVT//wAaAAIBkgJfEiYAUgAAEAYBDU9C//8AFP/6BQUC7RAmADIAABAHACgBkv/4//8AGgACAwMB2hAmAFIAABAHAEgBMgAA//8AEv/8AykDehImADUAABAHAHMBNgFQ//8AHQAAAd0C8hImAFUAABAHAHMAzQDI//8AEv/8AykDdxImADUAABAHAQgBLgEi//8AHQAAAd0CVRImAFUAABAGAQhaAP//AAr/9wKPA28SJgA2AAAQBwBzAOgBRf//ABwACwFyAmQSJgBWAAAQBgBzYjr//wAK//cCjwOlEiYANgAAEAcBBwC4ART//wAcAAsBewMfEiYAVgAAEAcBBwBjAI7//wAK/1MCjwMHEiYANgAAEAcAdwCmAAD//wAc/24BcgHyEiYAVgAAEAYAdzgb//8ACv/3Ao8DQhImADYAABAHAQgAmwDt//8AHAALAXICVRImAFYAABAGAQgtAP//ABIAAAPTAwESJgA3AAAQBwEIAH4ArP//ABf//gInAjISJgBYAAAQBgEM7wD//wAhAAkC6ANcEiYAOAAAEAcBCQE8AQT//wAX//4CIQJYEiYAWAAAEAYBCXIA//8AIQAJAugDcRImADgAABAHAQsBHAGO//8AF//+AiECYxImAFgAABAHAQsAggCA//8AIQAJAugDahImADgAABAHAQ0BVgFN//8AF//+AiECehImAFgAABAHAQ0AugBd//8AEgACAzsDkhImADoAABAHAQcA0AEB//8ADwABAs4DSxImAFoAABAHAQcA4gC6//8AI/9qAfsDqxImADwAABAHAQcAPgEa////Vv5pAYwDHxImAFwAABAHAQcAKgCO//8AI/9qAfsDFhImADwAABAHAGkAJwET//8AHQAJAzMDfhImAD0AABAHAHMBdgFU//8AGv/7AhkC2hImAF0AABAHAHMBSACw//8AHQAJAzMDTRIm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AuoAEgLoAA8CYAAEAsUAGgDcAAoCbgACAxsAEwK9ABAD9gAhAz4ACgIPABQCYAAWAlEAQwKvABICZgAKAi4AEgJgACECMAAaAr4AEgIZABkBkgAjA0oAHQHaACIBSAAUAb4ADQEEACACcwASAKoALQK+AB4CJAAQAi8AGQIgAAQBswARAdYAEQFq/xsCKgAKAP4ACwC6/qcC2QASAUgAEQM5ABYCQAASAa4AGgIe/6YBjAAPAeYAHQGMABwBrgALAkAAFwITABEC6gAPAfcAEgG5/1YCNgAaAQ8AEABxABYBLAAKAhMAIgEKAA4CLwAZAUz/9AJSADUBkgASAHEAFgJcAEoB3gBmAqoACAGtABICqgAMAgMASQKqAAgBSAAiAXwAFgE1AA8A4gAJAOkAGgGRABcCLwBQAUIAjwDyADQAxgADAUgAIgJNABwCogAgAjkAAQKiAAoBlv+XA0//mwNP/5sDT/+bA0//mwNP/5sDT/+bBjn/PgJ5AAQC6gASAuoAEgLqABIC6gASANwACgDcAAoA3AAKANwACgM3/+kDPgAKAg8AFAIPABQCDwAUAg8AFAIPABQCqgBVAg8AFAJgACECYAAhAmAAIQJgACEBkgAjAln/ugKYABoCvgAeAr4AHgK+AB4CvgAeAr4AHgK+AB4EcAAeAi8AGQGzABEBswARAbMAEQGzABEA/gALAP4ACwD+//8A/gALAToACAJAABIBrgAaAa4AGgGuABoBrgAaAa4AGgJnACsBrgAaAkAAFwJAABcCQAAXAkAAFwG5/1YCHv/RAbn/VgNP/5sCvgAeAnkABAIvABkCeQAEAi8AGQJ5AAQCLwAZAnkABAIvABkDNwAXAuoAEgGzABEC6gASAbMAEQJgAAQBav8bAmAABAFq/xsCYAAEAWr/GwLFABoCKgAKAioAFADcAAoA3AAKAm4AAgC6/qcCvQAQAUgAEQK9//UBSP/SAz4ACgJAABIDPgAKAkAAEgIPABQBrgAaBH4AFAMaABoCrwASAeYAHQKvABIB5gAdAmYACgGMABwCZgAKAYwAHAJmAAoBjAAcAmYACgGMABwCLgASAkAAFwJgACECQAAXAmAAIQJAABcCYAAhAkAAFwK+ABIC6gAPAZIAIwG5/1YBkgAjA0oAHQI2ABoDSgAdAjYAGgNKAB0CNgAaAdb/vAGmAEMBJwAyAScAMgEpAEIB3AB6AqoAVQGHABgCzgAUAiQAEAM3ABcCIAAEAugADwHWABED9gAhAzkAFgJgABYCHv+mAmYACgGMABwCLgASAa4ACwK+ABIC6gAPAr4AEgLqAA8CvgASAuoADwGSACMBuf9WAfoAGAKqACAAqQArALQAOgB9ACIBEgAvARUAOQDcACECGgA5AfIAZwFCAEwBuAAaAdAADAFZABwBNgAXAsQAFQYjABIBLgArAhoAEQKJABEAAQAAA7/+aQAABjn+pv5NBbcAAQAAAAAAAAAAAAAAAAAAATgAAwIVAZAABQAAAs0CmgAAAI8CzQKaAAAB6AAzAQAAAAIAAAAAAAAAAACgAAAvQAAASgAAAAAAAAAAUFlSUwBAACD7AgPC/mkAAAO/AZcAAAABAAAAAAHOAvYAAAAgAAEAAAACAAAAAwAAABQAAwABAAAAFAAEAYgAAABeAEAABQAeAH4AoACsAK4A/wEDAQ4BFwEhASUBKAEwATUBOgFEAUgBVQFhAWQBaQFxAX4BkgLHAtoC3R4DHgseHx5BHlceYR5rHoUe8yAUIBogHiAiICYgOiBEIKwhIiIS+wL//wAAACAAoAChAK4AsAECAQYBFgEaASQBJwEwATQBOQFBAUcBUAFYAWQBaQFsAXQBkgLGAtgC3B4CHgoeHh5AHlYeYB5qHoAe8iATIBggHCAgICYgOSBEIKwhIiIS+wH////j/2P/wf/A/7//vf+7/7T/sv+w/6//qP+l/6L/nP+a/5P/kf+P/4v/if+H/3T+Qf4x/jDjDOMG4vTi1OLA4rjisOKc4jDhEeEO4Q3hDOEJ4Pfg7uCH4BLfIwY1AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAQAMYAAwABBAkAAAGWAAAAAwABBAkAAQAoAZYAAwABBAkAAgAOAb4AAwABBAkAAwBWAcwAAwABBAkABAAoAZYAAwABBAkABQAaAiIAAwABBAkABgAiAjwAAwABBAkABwBwAl4AAwABBAkACAAgAs4AAwABBAkACQAgAs4AAwABBAkACgGWAAAAAwABBAkACwA0Au4AAwABBAkADAA0Au4AAwABBAkADQGWAAAAAwABBAkADgA2AyIAAwABBAkAEgAoAZYAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADAALAAgAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AIAAoAGsAaQBtAGIAZQByAGwAeQBnAGUAcwB3AGUAaQBuAC4AYwBvAG0AKQAuACAAVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgACAAVABoAGkAcwAgAGwAaQBjAGUAbgBzAGUAIABhAHYAYQBpAGwAYQBiAGwAZQAgAHcAaQB0AGgAIABhACAARgBBAFEAIABhAHQAOgAgACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAE4AbwB0AGgAaQBuAGcAIABZAG8AdQAgAEMAbwB1AGwAZAAgAEQAbwBSAGUAZwB1AGwAYQByAEsAaQBtAGIAZQByAGwAeQBHAGUAcwB3AGUAaQBuADoAIABOAG8AdABoAGkAbgBnACAAWQBvAHUAIABDAG8AdQBsAGQAIABEAG8AOgAgADIAMAAxADAAVgBlAHIAcwBpAG8AbgAgADEALgAwADAANQBOAG8AdABoAGkAbgBnAFkAbwB1AEMAbwB1AGwAZABEAG8ATgBvAHQAaABpAG4AZwAgAFkAbwB1ACAAQwBvAHUAbABkACAARABvACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAASwBpAG0AYgBlAHIAbAB5ACAARwBlAHMAdwBlAGkAbgAuAEsAaQBtAGIAZQByAGwAeQAgAEcAZQBzAHcAZQBpAG4AaAB0AHQAcAA6AC8ALwBrAGkAbQBiAGUAcgBsAHkAZwBlAHMAdwBlAGkAbgAuAGMAbwBtACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAAAAAgAAAAAAAP+zADMAAAAAAAAAAAAAAAAAAAAAAAAAAAE4AAAAAQACAAMABAAFAAYABwAIAAkACgALAAwADQAOAA8AEAARABIAEwAUABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApACKAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugECAQMA/QD+AQQBBQEGAQcA/wEAAQgBCQEKAQsBDAENAQ4A+AD5AQ8BEAERARIBEwEUAPoBFQEWARcBGADiAOMBGQEaARsBHAEdAR4AsACxAR8BIAEhASIBIwEkASUBJgD7APwA5ADlAScBKAEpASoBKwEsAS0BLgEvATABMQEyALsBMwE0ATUBNgDmAOcApgDYAOEA2wDcAN0A2QDfATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwAsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAvgC/ALwBTQCMAO8AwADBBkFicmV2ZQZhYnJldmULQ2NpcmN1bWZsZXgLY2NpcmN1bWZsZXgKQ2RvdGFjY2VudApjZG90YWNjZW50BkRjYXJvbgpFZG90YWNjZW50CmVkb3RhY2NlbnQGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQLSGNpcmN1bWZsZXgLaGNpcmN1bWZsZXgEaGJhcgZJdGlsZGULSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgGTGFjdXRlBmxhY3V0ZQZOYWN1dGUGbmFjdXRlBk5jYXJvbgZuY2Fyb24NT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4BlRjYXJvbgZ1dGlsZGUGVWJyZXZlBnVicmV2ZQVVcmluZwV1cmluZw1VaHVuZ2FydW1sYXV0DXVodW5nYXJ1bWxhdXQLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHdW5pMUUwMgd1bmkxRTAzB3VuaTFFMEEHdW5pMUUwQgd1bmkxRTFFB3VuaTFFMUYHdW5pMUU0MAd1bmkxRTQxB3VuaTFFNTYHdW5pMUU1Nwd1bmkxRTYwB3VuaTFFNjEHdW5pMUU2QQd1bmkxRTZCBldncmF2ZQZ3Z3JhdmUGV2FjdXRlBndhY3V0ZQlXZGllcmVzaXMJd2RpZXJlc2lzBllncmF2ZQZ5Z3JhdmUERXVybwAAAAEAAf//AA8AAQAAAAwAAAAAAAAAAgABAAEBNwABAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
