(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.euphoria_script_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("AAEAAAANAIAAAwBQR0RFRgATANsAAJCIAAAAFk9TLzJnnn3kAACJDAAAAGBjbWFwkBiwowAAiWwAAADEZ2FzcAAAABAAAJCAAAAACGdseWY0KM2uAAAA3AAAgpBoZWFk+iZjEgAAhUQAAAA2aGhlYQhVBAMAAIjoAAAAJGhtdHjHug4IAACFfAAAA2xsb2NhYHOB8wAAg4wAAAG4bWF4cAEmANcAAINsAAAAIG5hbWVsqY+DAACKOAAABF5wb3N03LFW3AAAjpgAAAHlcHJlcGgGjIUAAIowAAAABwACADz/+ADzAwYACgAXAAA2MhUUDwEiJyY0PwE0PgEzMhUGAhUUIyJIMBYIEQkEBAIuTSYQKF0OHm0XFDgSHQ8dD59g+r0QWv5zTg0AAgB5AikBJQLJAAsAFgAAEwYiNDc2NzYzMhceASI0NzY3NjMyFRSgExMBBAsFFwwFCzUTAQQLBRcVAlgvJhEpJhoIEoYmESkmGhUZAAIAK//fAooCjQBFAE0AACUGIwYVFCMiNDcGIyInJjcWOwE2NwYjIic2NxY7AT4BMzIVBgcyNz4BMzIVBgc2MzIHBgciBwYHNjMyBwYHIgcGFRQjIjQnNjM2NyIHBgGIbCofDhcLZgYeBAENBRFwCBM6QB0EAQsEEYIaPhgQIyBiMBo+GBAkIEdQCQEEESlnCxRPWwkBBBEvcyAOF4UwZAwRRE4H7gSvTw2tXQIWDwIHPVICFA8DBmF4EEt9AWB3EEp9AQsMAQMtZgELDAEDuEsNs3UCS0YDFgAAA//x/4EBdALkAEQASQBPAAA3FDMyNzY3LgInJjU0Njc+AjMyFxYUBx4BFQcmIgcGBx4CFRQGBwYHBiMiJyY0NzY3BiMiJyY1NDc2PwEyFhciBwYWNjQnAxIGFBc2Nx1QKB8RKQgpEg0XYD8DCQMIAwQQCBQUAQohBB8SHiIhWU8OAwIFAwILAgYCKBliFAUeME4ODRADRzQk5TQsOCYyMRQRMD4KZesHIhIPHCQ7ag8WMxACByYmARkMDAcBqVkaI0IjR3kYQxgJAQUYCCQTBkIQECgrQwYBEA87KTNffTH+2gI8RlUvfF8AAwA3/6cCfALUABAAKwBFAAAXIjU0NgA3NjIXFgcGBwIHBhMiBhQzMjY0IzQ2MzIUBwYiJyY1NDc2NzYyFgEiBhQzMjY0IzQ2MzIUDgEnJjU0NzY3NjIWoAsxAR0PDB0FCR0NUcE9CEg7TC0wQyoTDS8mMIsRBR4pQBAaCQFMO0wsMUMrFA0vWIoQBR4oQBAaClkQEGQCcyAWDBg9Gp/+gYQQAtSmsI+YCBGoT2BTFxk9Rl8WBgr+0aawkJcJEKiuAVMXGD5GXhcGCgAAAv/j/7cCrQLPAEgAUQAAASIVFBc+ATc2NR4BFA4DBw4DBxYXNjc2NCcmIzYzMhcWFAcGBxYzMjc2JyYjNDc2MzIUBwYjIicGIiY0NjcmND4BMzIWAzI3JicGFRQWASR8Ci07ID4OEw4QKRQeSBIEBAIqaDETDAYOKAYcJw0FDhc4Z2U9EwoLAQIGCQ8XKCk/cnBIpWtKSRQeTjsOCYZPPms4bk4Cc5YnLic7KlJpAxksNig3Gh1EDAQDApl3OU8uQhc4FUAXSThaP2omFQYBBgcLPhwcZDdMgmY/RGtUMhD9gy5rl2VcNDsAAQCuAl4BCQLxAAsAABI2NDIVFAcGByInNb8UNiYTDBQCAmpDRCQ3JhEBCQMAAAEAEf+xASQDBwAXAAABMhQjDgECFRQXFhcWIyInJicmNTQ3PgEBGQoGOWwyNwQBAggCBDwYEDUicwMHEgnr/vxvqiMDBQgCIWA+N5ewcZ4AAf/8/60BDgMJABQAABciNDM+ARI1NCcmNjIXHgEVFA4CBQkHOWszOAYEBwMzMSxHY1MSCe0BB2+qJAQLARyQVl7Uq3UAAAEAdwHtAZYDBgAxAAASFhc2NCY3NjIeAQcGBzY3NjIWFRQGIicWFxYUBiInJjcGBwYiJyY0PgE3JicmNTQ1NrFCDAIGBQcbDwQCBBMaMwwVDEcrDQo3DREdFiQBFB8KFQcOCzMYEkgbBwK7IxQILDkJCxEgEikZCSAGFAcVIAQRMgwUEhosJxI9EwQKFB8wBwgMBBUDAxcAAQA/ACYB/wIcAB8AAAEiBwYVFCMiNTQ3BiInNjcWOwE+ATMyFQYHBgczMhUUAeo5jiMKDRGGMQQBCwQRnxM2FAwhGQIEzwgBLQWxRwo7aF4CFA8DBl16C0RyCA4IEAAAAQAc/90AdwBwAAsAABY2NDIVFAcGIyInNS0UNiYSDRQCF0NEJDcmEgkDAAABAD8BJQHTAUsADAAAATAFIic2NxYzITIHBgG+/qIdBAELBBEBagoBBAEtCBQPAwYLDAAAAQA5//kAfwBuAAkAABciNTQ2MzIVFAdOFRoYFCUHJxg2Fxc2AAAB//X/pwGBAtQADgAAFSI1NDYANjIVFAYHAgcGCzEBIxUjIlHBPQhZEBFkAn8pGR1Fn/6BhBAAAAH//v//AaUCjgAgAAA3FDISNTQjPgEzMhUUBwYHBiMiJyY0NzY3NjMyFhciBwZGsHlIAxkSTyU2WicqbiMOGy5aOT8JCwJlRUDKrgEMgpYOFJ5ecaI6GnQvgVmXSzANDZaKAAABAAH//wFsAo4AGAAAATIVBgIVFCMiNTQSNw4BFRQzBiImNTQ+AQFcEDZfDh5ENVSVGgUvIHujAo4QPf43bA1QsQE1Ox6yUS0XKiNClV8AAAH/1//3AZsCjgAuAAAnIjQzMj4CNTQiBwYUMxUUBwYjIjU0NzY3MhYUBgcGBxYXFjI2NzY3MgcOASImIgYHFHiBZag2IBQTCAonOk9rRUdSPYJuGzNwVigKFgcRAwRNd8kvHmqQpjRNTi9CBRcLBC09RFsBQ22MQIVDAgYPCwgREhooMDgAAf+r/6kBhAKOADMAABMWFRQHBiMiJyY0NjcUHgEzMjc2NTQnJiM0NjMyNjU0JiMiBwYUMxQGIyI0NzYyFxYVFAbih0VUi20kCRMTEDctZ0AwWSIsEg0ufCUlRigUFxkRKjJEwhMEWgFgJoxXT184DRgXCBQoJVhCSW8lDg0UhEEcIzgbMA8bVjNERg4QMXkAAf/X/+4B7gKOADoAAAEyFAcGBwYVFCMiNTQ3JicGIyI1NDc2OwE2NzY3NjQjNjMyFxYUBwYHFhc2Nz4BMzIVDgEHNjc2NCc2Ac4gIixNDg4fAi6rGRg4Fg0QBxkXJRQGEAMTHgkEDhQtdkMKIhI2IRAfORJLGAYOBwE3TyErBV88DlA6HgEODxsOCQQWNFiMKlcTWBxfTXA5EAOSbDdAECrJcQc2DyACFgAB/6v/qQGFAqYAOgAAEhYyNjc2NzIVFAcGIicGBwYHNjMyFxYUBwYHBiMiJyY0NjcUHgEzMjc2NTQnJiIGBwYiJicyNjc2MzKiPT8vDBgHDDAkeDkDBQsMKCt3LBQSJ2BATG0kCRMTEDctZkE0SBo3JQscHQ8DGyMGEhsCAnQODQkUFhY1IRgeECRTKBRhLWQ3dDkmOA0YFwgUKCVmU152Jg4SCx4MDVo1kAAAAf////8BjgLJADEAADc0PgEzMhcWFAcGBwYjIicmNDc2NzYzMhYXIgcGBwYVFBcWMzI3NjU0JyYjIgYVFAYmUSpfPVUZCB0tVSYqayQQGzJrWGcJCwKCX08RBCUUHk02LDcHCDxeDg7JMW9aVx5dRm8qE3Awg1mkXU0NDZl/nyIdXSkXZFVaaA0ClUkFBAUAAQAdAAEBjwKOABgAAAEyFQ4BAhUUIyI1NDc2EjcOASImPwEWMjYBfxAxln4OHwshpUQboz4PBAQSQdICjhAr2v7tWA0yHi+RASU2BCoeEA8QIwAAAv/j/+QBmQLPACUAMQAAARQGBx4CFxYVFAYiJjU0NzY3JjQ2MzIWHwEmIyIGFBc+ATUeAQM0LgInDgEUFjI2AZldVQkzGRAgfqBrUCVEL1dFFBcCAgscNDUpT1gOE2scFkMHTFBOclgColCASgs6IBoyNVllTEVSUCU6QIBWDggHBDxbOEiKWQMZ/dYeQB9MCEJscjtKAAAB/53/qQGTAowANgAAExQzMjY1PAE3NhUUDgEjIicmNDc2NzYzMhcWFAcGBwYjIiYnNDY3HgEzMjc2NzY1NCcmIyIHBj1NPFUHFiVcPVYaChgqUyYpcykSFy5oWGhARwESEgEuNGtXThQFKRomTjApAWqEkEYECAIGEy9sWlgiXkFvKRN2NolVp2BSNhkOFwgiP5CBoikjYy0dYlIAAAIAOf/5AJcBeAAJABQAABciNTQ2MzIVFAc3IjU0NjMyFRQGB04VGhgUJQwVGhgUGA0HJxg2Fxc2+CgYNhgLLxIAAAIAHP/dAJ0BeAAJABUAABMiNTQ2MzIVFAcCNjQyFRQHBiMiJzVsFRkYFSVLFDYmEg0UAgECKBg2GBQ4/tVDRCQ3JhIJAwABAAkABAF+AeIAFQAAARQGBx4BFRQGBzQmIz4BMzI2NR4CAX6jT0NxDg+wagMlFmmxAwoQAbMrfQgehS4PFwhJog0YkD4BBBgAAAIAPwDaAf8BlgAMABgAAAEwBSInNjcWMyEyFRQHBSInNjcWMyEyFRQB6v52HQQBCwQRAZcIFf52HQQBCwQRAZcIAXgIFA8DBggQlggUDwMGCBAAAAEAGwAEAZAB4gAVAAA3NDY3LgE1NDY3FBYzDgEjIg4BFS4BG6JQQ3EODrBrAyYWRodNChI0K30IHoUuDxYISaEMGUhgJwMbAAIAaP/4AeoDCAAfACoAABMGFDMUBiMiNTQ3NjcyFhQOAQcGFRQGNTQ3PgI1NCICMhUUDwEiJyY0N8EfFBURJzpPbERIQ18wciJkKlM7qYEwFggRCQQEApouQxAbLT1EWwFEbHFeK2k3CwEMOHQvZG8vTf2FFxQ4Eh0PHQ8AAAEAT//HAusCjQBdAAAlFDMyNjU0JyYjIgcGFRQXFjMyNjc2PwEXDgMjIicmNTQ3PgEgFxYUBwYHBiMiJyY1NDcjBiMiNTQ3Nj8BMhYfARYjIicmIyIHBhUUFzI3PgU3NjMyFQ4BAgsvOFNxLT2jZllGOl4qRBImCQQSAyApUDKiRSYMIuABPTgXEB5DICE2FhABCFoxPCgySRcTGgQEAxAOBAgTLCUsDBM3DRIeEhUMBw0QDhQf81ibVp41FoV0mH5JPBUOHxkKARAyIRt5Q1MvNJPBfTZvOGstFi0jMQ0PnF9GT2MQAxQKCg8KFE9cVCoIUhUeMRwkFAoUEiR1AAAD////igRCAyQARwBTAFsAAAUmNTQ3PgEzMhc+ATc2MzIVBgoBFRQjIjU0JyYnDgMHBgcWMzI2NzYXFgcOASMiJwYjIicmNTQ3Njc2MzIWFyIHBhUUFjIBIg4BFBc+AzcmAQ4BBxYXNhIBcTFFJoJNIidMYCNPURBCRycOIxMjVws9HTkUMDgKDlRuFQMNCAIWe10VGlxohzkfCRhKJSwOEgQ7L09dnQFZVIY+JiZWMmoQGAFnUIRFYScSUQ4vXmlwPlAMfXAdQBCR/tn+6WEOUGVSnDIVdjdjHkg2A29MCwEBB1aBB0pqOUIjJmcsFhESKkV/TVcCFm6TlickdVC0GgcBOxWcgTWfqgEdAAAB//7/jALFAwUAVgAAARYVFAYjIicmNDc2MzIWBiMiBwYUFxYzMjc2NzY1NCcmJwYjIjQzMjc2NyYnIg4DFCMiNTQSNwYHBhUUMwYiJjU0PgEzMhUGAzM2Nz4BMzIXFhUUBgIyd9/DmS4QEB45BQQFBSIXEAwjeZhwVxQFKRYgNj4HB2VMOAQCLTFwWksqDh5XNY9ZMxQEJBuPpjoQQTUIOk8qZjVUEANTAc0mnYP7WR4/IUALDCwdNBhEgGJ1HBhFIhIDFxtfR0Q8A4zI0ZUaUMEBbD0UUS01Gg4cGTtlMRCX/t61j01ZRA4QNnsAAgA8/4YCjAMGAA0AMgAAARQGJjU0NjMyFhUGBwYnIgcGBwYVFBYzMjc2NTQjNjMyFRQHBiMiJyY0Nz4BNzIWBxUmAkMRES4lCg4uEwg8im1eHQpIQVg+KgwGGBxCT2qFLxcaMu2QFBIBCAICBAIIB2Z9DgwuWCSsoYu5PTNid2VENBcXKEtVZYU+nWHA/gEaDA0DAAIAB/+MAqgDBgAyAEAAABMiNDc2PwEyFxYVFAcGBwYgJyY0NzYzMhYGIyIHBhQXFjMyNzY3NjU0JyYjIgcGFRQzBhM0EjYzMhUGBwIVFCMiLCU2WqA3tlIxCB1teP7BKw0RITkFAwUFIhkQCiB5iW9kHQoxQYuuVywJBn02TyUQLSI/Dh4B3mhAbBEDkVl0MDWyfIlZHD8jQAsMLB80FkSMfqo3MW1LZXU8NBUU/oWYAR+nEF2b/uV+DQAAAv/8/2gCkAMRADcARQAAATIXFhUUBwYHBiMiJyY0NzY3NjcmNDYzMhYHFSYjIgcGFRQzMhYXIgcGFRQXFjMyNzY1NCcmIzY3FCImNTQ2MzIWFQYHBgHdMQ8GHzZtPEWUNhkVLnZJWFCObBISAQgaWz4sfQsPBa11bjInP45MMi8ICQ2NEhEuJgoOLhMIAS5BGBo9SX4zHGwycj6IVjQUHY5/HA4NBEAtLFMNDYV8mFYvJnhOVl4RAxf2BQgHZn0PCy5YJQAAAv/9/4wC1wNCAFAAXgAAExQXBiMiJyY0NzY3NjI2NzYyFRQVBgcGBw4BBzYzMgcOAQcGBwYjIicmNTQ3NjMyFhciBwYVFBcWMj4CNz4BNwYiJyY3FjI3PgE3BiMiBwYBFCImNTQ2MzIWFQYHBq8qAxQpEQgaO5s1eVYQKigHNSAoISwYNCIJAQQiPi8jWKN1HQslOFsNEQNWOCxMEjpBNSIWGiQEODkEAQwFNTkZLh8QIsBNJQG4EhEuJgoOLRQIAgBKBQ4yF0MvbR8KGA8nDAMDHBkOCA59dgULDAEK6GDzayUlRkZrDAxZRUpsGAUhVztMXZ8QCRkUAwYFYnsgAXE1/v0FCAdmfQ4MLVklAAAC/+r+ugLBAwYAWgBjAAATJicmNTQ3NjMyFhciBwYVFBYXPgEzMhcWFRQHBgcGBwYUMzI2NzY3PgEyFQYHDgQHBiMiJyY0NzY3NjMyHwEiBwYVFBcWMzI+BzcjDgEiJyY0ASIGBzY3NjUm6jchJDcgKAkKASkeJio2NJ9VSQwDLkZ7JSgsNyZiK1QhDx0qJCIjJCYqOyFMXpw7HAoYPRcSIAUBPiMXex4jRW1AOhUVAgIDBgo8hnQfJwFiP3MpgFM6BgG8DSEmM1MsGQsLICkzH0cNgq48DAw0PmAfCQKI8GpOmlglJBdVyLxuXT1BEytoL1UiThsJFAZELCWRIQhIVLBebggLFRdymiUvygGvn3kJXkE8MQAAAQAB/4wDpwMkAFsAAAA2MzIfASIGBw4DBzY3PgEzMhUGCgEVFCMiNTQ3DgEHBgcGBwYjIiYnJjQ+ATMyFhciBwYVFBcWMzI3Njc2NwYiJyY3NjMWMjc+AjcGBw4BFRQzBiImNTQ2Ab16GSEBARUeDhAYAwMCsDogYCsQQkcnDiMgYW0cKzUZIEFqTl8HAhdXOA8SA1szIgocZ2Q7JRQcFSAyBAQMAQIEJykTFiwZXFApNBQEJBtUAsYfDAQhMT2JDhUJDwOm2xCR/tn+6WEOUKm7Cw8D7FsrJUpYPxU/aVgSElk6Oh8gWWlDQ2BmBBkTBAEHA1tdbxgRLxhGJhoOHBksUgABAAb/jAJhAvoAMgAAATIfASIOBiImJyY0PgEzMhYXIgcGFRQXFjMyPgM3NjcOARUUMwYiJjU0PgECTRADAR0pFBgVLj1slF8HAhdXOA8RA1o0IQocZzhVNCYcDSEwTn8VAiUddZEC+gwESnmbopt5Slg/FT9pWBISWTo6HyBZSXuXpEmuNht1RR8OHhw7bz0AAAEAA/8cAvMC+gBAAAAXMj4DNzY3BgcGFRQXFjMUBwYjIicmNTQ3Njc2MzIWFyIHDgYiJicmNTQ3NjMyFh8BJiMiBwYVFBcW4ktwQjAhECQ9jUouMwQEBgsTOxAGITx/SFULDAE3HAwWGiI9UYCIVho5JEl2FRkCAhIHbDslDSXNWZK0wVXFNhZ0R0RTBwEHBgs/FRc3P3MwGwoKejmRoaGRcUIiHUFVXT+BFgoLAm1DQykpbQAAAgAA/y0DAgMFAB8AOgAABTI3MhQHBgciLgMjJjcAMzIWFyIHDgEHBgcWEx4BATIVBgMGFRQjIjU0EjcGBwYVFDMGIiY1ND4BAtMbDQYFFiAyZ1FGOBAHEQEPaw4QAis9IDEpNE4obihi/sEQTjMUDh5XNY9ZMxQEJBuPprETCgoeA2uYmWsHFwGzGRg6IDU1Q2kb/v5emgOVELT+vYM6DVDBAWw9FFEtNRoOHBk7ZTEAAAP/xP8QAs0DBgArADkAQwAAASIOAwceARcWMzI3NjcyFRQGIi4CJwYiJyY0NjIXNhM+AjMyFhUXJhcUBiY1NDYzMhYVBgcGARQWMjcmIyIHBgIZLTslJ044I4opcTg3HQcEEEtedkibEzedGAcmYGdQMBIsU0AcHQEKIhESLiYKDi4TCP2MM1QqWDIfBwEC2HnBzss3DjkQLCMJCxgpMSUgUQkkLAwdIyVaARZsy4EcDg4K1gQCCAdmfQ4MLlgk/aISFR0oFgQAAf///24DuwMIAFQAACUUMzI3NhcWDgEHBiMiNTQTNiIHDgEHBgcGIyI1NDcSNTQjIgIHBiMiNT4DNzY1NC4BIyIHBhQzBiI1NDYyFhcWFRQHMxIzMhUUBzMSMzIVBgcCAxY+KBsGDAUFCg0eJ3mZBBEKNW8qSiMvJBUBfRcuxjI8LhUBChAjDCgMMCc9GQgHAypTaj8OFwQKn2w+Fwm3dS0fJmAXiDsKBAINExQswNgBywwJMqhWlWOLFQEBAcV0NP6prM8WAxw3dzi6UixXNjMSGQ4bKUA1LElVICIBQmozgAFZMk2F/rcAAQAA/24CtQMIADwAACUUMzI3NhcWDgMjIjU0Ezc2IgcOAQcOASMiPQE2NzY3NjU0JiIHBhQzBiI1NDYzMhEUBzMSMzIVBgcCAhA+Jh4FDAYGChklFHmBEAINBjh/NWJYHRUMIjwIAS50GQgHAipTPZEKCeh/LR8mYBqLOwoEAg0TJxm/xQGgMwgFMb9qwtkWAht61acMCkFgNREYDhspQP74OTsBuTJNhf64AAEARP/GAmkDBgAqAAABNCM0NzYzMhcWFRQHBgcGIyInJjQ3Njc2MzIWFRcmIyICBwYVFBcWMzISAjRTBw0TQxUJHzRpSFOHMBcWLWZYZRweAQobbKcTBS0kOnmbAdS3BwYLaCovWW27XD+JQJxbtW1eGQ0MBP7srSwlcj0vAUsAAf/+ABMCygMFADUAAAE0IyIGAgYUIyI1NBI3BgcGFRQzBiImNTQ+ATMyFQYDMzY3PgEzMhUUBwYHBiMiJicyNzY3NgKIMECNYkEOHlc1j1kzFAQkG4+mOhA/Nwg7TipmNWwxPl4yMgwNAl5URRAEAqo91/7z1hpQwQFsPRRRLTUaDhwZO2UxEJL+2LiNTVl0RlZuLhkODXBbXxQAA//w/xAC9AMGACcASgBUAAAFMjcyFRQHBiIuAycGIicmNDYzMhc2EjU0IzQ3NjMyFRQCBxYXFgI2NDYfARQOASMiJyY0NzY3NjMyFh0BJiMiBwYHBhUUFxYyByIHBhUUFjI3JgKDSRkPLSJURmQnhAVGpRYGKSdJhpKdTwcNE12pmYgratgmLAUBN2w7cyENITdoU1kcHQkbbVpQFQUmF071HwgCMWA4arU3FSodFg4sEkcCGiwLHSQ3RgFPhqQHBguqiv6gUToQKQFKWj0TDwcpdmN4LIdmp15JGQ0MBI5+nCkjWikYXxYFBBEVETQAAf/+/3IDAAMFAEcAAAE0IyIOAxUUIyI1NBI3BgcGFRQzBiImNTQ+ATMyFQYDMz4DMzIXFhUUBwYPAR4DMzI3MhQHBgciLgInIiYnMjc2AokxNHNYSSgOHlc1j1kzFAQkG4+mOhBGMQcsXkZVK1gRBCo8ZSYdQTJGIhsNBwYWIDRhPEMXCw0BalRLAqo9j8vTkQkNUMEBbD0UUS01Gg4cGTtlMRCi/t6RwWNATBETPUhnKQwDl7OUEwoJHgOOrawUDQ5qXwAAAgAE/2ECSgMGADAAPgAAFxQXFjMyNjU0LgQ1NDYzMhYVByYjIgYVFB4EFRQGIyInJjY3NjIWFyIHBgEUIiY1NDYzMhYVBgcGMU4PE32SIzQ9NCOlXxMSAQccQHgjNDw0I8iTfCEaXFcgMhMDXkMzAdATEC4mCg4tFAgpSg8DoXowUTU2LD4jXJscDg0EeE8gPS45N08sebxQQqAcChESTDkB7wUIB2Z8DgstWiQAAQAB/4wDIgNcADoAABMUFwYjIicmNDc2NzYyPgIyFRQGBwYHDgQiJyY1NDc2MzIWFyIHBhUUFxYzMj4ENyMiBwanKgMUKREIGjygOYhvNS8fgmgrGBskMT5lhyouSSw2DREDVTUnTxIVPl0xLR4zIRTNUSUB/0cHDjEXQi9tIAsgKCAOIUQKF4yhzJFvQywwUolJLAwMWEFGcxkGZpzDsJkfczQAAAEAI/9uAucDBQA7AAAlFDMyNzYWFA4BIyI1NDcjAiMiNTQ+ATU0IyIHBhUUFxYzBiMiJyY1NDc2MzIWFAIUMzI3Njc2MzIVBgICYzUcHQUQFCsWaBMKmVNlOzxiWy0eBxZHBwxaGwknOnFXT3AnIEBpTx8iFiszJJU7CgUHLC7PbHn+3ngww9A5eGhGRiIiaA5yJCRNTnJhm/6Nc2KjvksXZv7fAAAB//7/twJ2AwUAKQAAEwYUMwYjIjQ3NjIeARUUBwYzMjc2EjU0Iz4BMzIVFAoBIyI1NhI1NCMiKwcIAhQYJyh9Ux9BBAwJCWm8GwMYECyGxkw0HDB4PQKAERoORh8fXYZXte4MCGAB0Iw+DhNLbP6R/tgyUwEhZvAAAAIAEP+3A8UDCABMAFQAACUUMzI+ATcuATQ2MzIWFxYyNzIVFA8BIicOAiMiJyY1NDcCIyI1NDUSNTQjIgcGFDMGIjU0NjMyFRQOAQcGMzY3Njc2NzYzMhUGBwYTBhQeARcuAQIsPC5fPgIxUCITKj8DJTYIDB8SHx8GQmw5UB8ZAr9yMXdiPhkIBwIqUz2XKBsjAwgHCkZEYi4xLRQYJAzEBAcoGAcpqYai6WgogCUlfFggEQ8cCQIScuyjTj9YFxj+oy0CAwFC3as1ERgOGylA51bVW3ALAQg9baGGmBVMykcCBgIOHEgdPlMAAf/2/3IC/gMHADoAABMGFDMGIyI0NjMyFhc+ATcyFh8BIgcGBx4CFxYzMjcyBwYHIicmJyYnDgEHBiMiJi8BMjY3JicmIyIrBwgCFBhRQ1F1LZGLMhIWAQJLZFRqEi0fEycuGQ8JBQkyQjE3PAcEdUwaMSUVGAECRKZsR0UeJD0CgBEaDkRAmYXFlAEYDAxpWI05pXE3cBMRIANWYeccDqBUGi4YDAyhkf47GgAAAf/p/roCwQMFAFIAABMyPgc3IwIjIjU0EjU0JiMiBwYVFBcWMwYjIicmNTQ3NjMyFhQCFDMyNzY3NjMyFQYHBgcOAyMiJyY1NDc2NzYzMh8BIgcGFRQXFt1FbUA6FRUCAgQGB4xWZGQvM1stHgcWRwcMWhsJJzpxV09dJyE8YkgcIxYjIyksE0BLaz+ZPh0JF0AbFSEGAkUnGXgg/tFIVLBebggLFh7+8Hg2AV1PMz9oRkYiImgOciQkTU5yYZv+rXNfl7JGF1XI6mUsZTsoaDI5HyFUHw0TB0gvJ5UlCgAC/+v/JgL0AwYAVgBfAAAAFjI2MzIWBhUiBw4BBzYzMgYiDgEHBgceAjI2NzY3MhUUBiIuAicGIyInJjQ2Mhc2NwYiJzY3FjI3PgE3NjcGIiYjIgcGFBcWHwEGIyInJjQ3Njc2ARQWMjcmIgcGAZawNTwXCQsCICsgWxM0EgoDGxUhCn95H8tyPiQKFAcQSmB4TZkWPTpUGAcmYWNbeDBJBAELBUY3DzwRLCYWM7Itci8YBxIvEAUcOxoMEihnL/7bMkwsVksIAQMFLzAUEQFNOMEnAhgCAgH7Wg5kKwsIEBMZKjMsKl4NICwMHSMqTewGGA8DBgMdeSFZNgUwXi9NHEQLAhdEIlAwaCQR/QQSFRoqFQQAAAEABP+dAQIC8AAQAAAXMhYfASM2EjczDgIrAQIHWh0nBAWjCkgHpQEGJR0sRRZLDAYGSgK6TwMIDf2XugAAAQBS/4wBJgLeAA4AABoBFhQjIicmAiY1NDMyFoyFFA0JBBKYDxoFDQKS/XpZJxNTAnI/FSYNAAABABL/nQEQAvAAEAAAEyImLwEzBgIHIz4COwE2E7odJwQFowlICaQBBiUdLBw/AtgMBgZG/VViAwgN9QIuAAEAAgG+AckCZwAGAAABIycHIzczAckil+sj7TEBvo2NqQABAAX/uwH2/+AACQAADQEiNTQ3BTIHBgHR/j8LLgG6CgEIRAEIGAUIChAAAAEAvQIlAVECtgAKAAATHgEUIiYnJjQ2MuglRBdGJw8MFAKsIlITMyYOFRUAAQAB/5ABqAHuADcAADMiNTQ3Njc2MhYfAQYjIi4CIyIHBhUUMzI2NzY3NjMyFQ4CFDMyNjc2MzIWDgIjIiY0NyMGVFImNVYlQCUFBgMOEAUGFg5BNTwYE0UmQikiJBMJHC4fDBQIAwsEBAQKIRIqLQsKf4FNXIEvFBwODREPCxN1h3c8VUBuUUgXE0bQzhUVCwYOGSpulkXZAAEAGwAAAbEDBAA0AAA3FDMyNzY1NCIOAhUUIyI1NBI2MzIVBgIHMzY3PgEzMhcWFRQHBgcGIyI1NDY3NhcWBw4BvyApMTlOYUgzDx5AWCYQNU0TBy47IUsjRxEGIC1JGRtENSsJBgECJixcPG5+bkt/nn8HD1CfAUHBEHX+uJN1XTQ9XBseSld8Jw5aMH0eBQkFAh50AAEACf/gAYQCIgApAAAkMh0BDgMjIicmNjc2Mhc2MzIVDgIVFCMiJzQ3JiMiBhUUMzI2PwEBDRoEJCE0G2kdGl5ULFASGyoQCBkqCw0CBwYmSG1SIDkMDVwGAwsxHhllXvA0GxdXEQwnZCYNFyciH9pogigUFQABAAD/bgIJAwYANwAAMyI1NDc2NzYyFh8BBiImIyIHBhUUMzI2NzY3PgEzMhUOAxUUMzI2NzYXFgcOAiMiNTQ3IwZUVCY0VSU8IAUFAx4NGEEzOxkUTSk4KyRnIhEYQS0lQRkrCQUNBQEGEjUbdw4NjYFLWn4tFBULCxEhc4J0PWNHYlGc6RE0tKPiZJUrFQsFAgQNIjLgT1r3AAAB//7/4AFSAeUALQAAATIVFAcGIyImJzI3NjU0IyIHBhUUFxYyNjc2NzYzMgcOAyMiJyY1NDc2NzYBBUwiOmAPFAVHOzAhQjk9OQsiJg0aEQQLEgEDJyE1G2odCR8xVi8B5VkzOF0KClJCNylncHZkFAQRDBgdCAYLNB8ZZCIkQ094NRwAAAP/o/7HAbIDJAAmADEAQQAAAyI1NDY3Njc2NwYiJzQ3FjI3EjMyBwYjIgYHNjMyBiIHBgIOAQcGJzI3Njc2NwYHBhQBIic0NjMyFQ4DBwYVFCozNhsxFRcSGDAFDAQyFEGdFAEBBkRSGXcaCQMmeA0dEhgRI0EfEBIIDAlLEBsBqQwBKyAMBwwNDgYN/sc9K5Y3YCTXXQMZFAMGAgErDwqOgAkYFEr+5pRwL2AdNDk+XWKfM1ZCA4MUP2oPCxIYHg8hHwwAAAH/s/6wAaEB7gBPAAAzIjU0NzY3NjIWHwEGIyIuAiMiBwYVFDMyNjc2MzIVDgMHFhcWFAYjNi4CJwYHBiMiJyY1NDYXFjMyNzY3BgcGJyY3PgE3PgI3IwZUUiY1ViVAJQUGAw4QBQYWDkE1PBghkzseIRUEECoiDEwMAhgJAgILHhgfOkJwUhsBFgQSQloyLRi0YgYNBwMrmm4LEQwCC4SBTVyBLxQcDg0RDwsTdYd3POd5PRgHIJfDNw01CR8XByMYGgZ6T1k6AwIGBQopVUtwBIYJBgQGQVsEMm9ADuMAAQAb/7cBiwMEACsAADYGFCMiNTQSNjMyFQYCBzMSMzIVDgIVFDMyNjMyBw4BIyImNTQ3NgcGBwaCOw4eQFgmEDVHGAd/ejMHFiQfCxYEDg8EGw0nKywCDgcHMsKUG1CfAUHBEHX+1KoBODEXS8JJahMWBxhtV5OcDwIBBy0AAgAaAAEA0QKkAAwAFgAANzQ2MzIVDgIVFCMiEyI1NDYzMhUUBxo9LxcKHjEPG4YVGhgUJVWU6BkaVuFYDgIuKBg1Fxc2AAP/ov7HAPYCpAASABwAJwAAAyI1NDY3Njc2NzYzMhUGBwYHBicyNz4BNwYHBhQBIjU0NjMyFRQGByozOxwlHhcqExkXMhIaFilNKRUSDwFMERsBBhUZGBUYDP7HPSugOEc29zwaGXih61SZHWpcoAiiM1VEA0soGDUXDC8SAAEAG/+3AbcDBAAxAAABNjQjIg4CFQYjIjU0EjYzMhUGBwYHMxIzMhUUBgcWFx4BMjcyFAcGByIuAicmJzIBNCEdI1lFMAENHkBYJhA1JyAWCHJyR007DCUNLjUNBgUWIClIKCMEBwJPATc1XXuchQ4MUJ8BQcEQdaiClQElUTR0Ewt+LUoTCgoeA1RkYwYFBwAAAQAi/24BAAMGABkAABciJjQSNjMyFQ4DFBYzMjY3NhcWDgEHBpM6N0hhJBEVQCsjHxsXKgkFDQUFCw4eknr0AU7cFDDBpNydVSsVCwUCDRQVLwAAAQAM/7cCVwHpAD4AADc0NzYHBgcOAhUUIyI1NDYzMhUGBzMSMzIVBgczPgIzMhUGFRQzMjYzMgcOASMiJjU0NzYjBgcGAhUUIyL1LQMJBwYsakAPHjwrEy4UCYRvMC8VCCFDWiQwNCALFgQODwQbDScrIAIHBgY5jBAdenu8CgEBBSXIpQ4MT5bxFZGZAUovjIhGc2MuraRqExYHGG1XmXQHAQUx/vcYDAABAAz/twF+AecAKQAANxIzMhUOAhUUMzI2MzIHDgEjIiY1NDc2IyIHDgIUIyI1NDYzMhUGB02BejMHFiUfDBYEDg4FGw4mKysEDAgKMGo8DiA9KxIuFKIBPzEXS8JJahMWBxhtV4qlDQgqwpkZT5XyFpWaAAH//v/3AagCMgAlAAAXIjU0NzYzMhYXIgYVFDMyPgE9AS4BNDYzMhYXFjI3FAYiJw4CenswPVQMEAM/XEElUDUfKBkNEyQHHy8OFCobAThkCalfX3gMDMpid3G4XQwUPBwZRCsVCA4WCmDCgwAAAv9+/q8BrwJbADYAQAAANxQzMjc2NTQiDggHBiMiNTQTNjc+ATMyFQYPATM2MzIVFAcGIyI1NDY3NhcWBw4BARQzMjc2NwYHBr0gKTE5T15JNAsGDQsSEwwYJTCWDxAjTyAQMDMGDXJlXjc9VUU1KwkGAQImLP7dFi0WCBRbFgRcPG5+bkt6oY9FI0woPSERITdiAQ9uRKGxE3/DF/iVbGx6WjB9HgUJBQIedP5nHnoqqrBhEgABAAH+qwGhAe4ANAAAMyI1NDc2NzYyFh8BBiMiLgIjIgcGFRQzMjY/ATYzMhUOAxQzMjYyFg4CIyI1NDcjBlRSJjVWJUAlBQYDDhAFBhYOQTU8GBt3Li8eIRUNLh4ZJQsXBwQDCRwNVCQJf4FNXIEvFBwODREPCxN1h3c8sFhYPRgcn4nI0BMFCg4YwqrC2QABABEAEQGAAgYAHwAAASI1NDcGAhUUIyI1NDYzMhUGBzM2NzYzMhYVDgIVFAE+JhJEqBAdPCsTLhQHUWI4LgoNBxQiAR9TLyk7/r8xDE+V8haSmbtpPAwJBxxpPggAAf/w/7sBLwJtACwAADcUMzI2NTQmNDcOAQcGLgE0Nz4CMzIVFAcGFRQWFRQGIyI1NDY3NhYHBgcGRy0qSSUCDXwwBA4JAS99VCkVETY6Yj5YXS8JBQY1JxsiRoppM7o5CRXtRQQDCQQBRO92EgwUPUAm2TFYe2VMph0GGgQeYkUAAAEAFP9uATwCWwAqAAATIjU0NzYzFjI3NjMyFQYHNjMyFRQjIgcGEDMyNjc2FxYHDgIjIjU0NwY7JwoBAgYhJC8rERAUYx4IFQt0Tz4ZLAkEDQYCBhI0G3dBDgGxIAwDAQcCfxMoPwsIEBX6/sorFQsFAgQNIjLPr8cCAAAB////kgGmAeUAKQAABTI2NzYyDgIjIicmNDcjBiMiNDc2MzIVDgEUMzI2Nz4BMzIVBgcGFRQBXgwVCQEWBQsjEigWFwsJeUFNMjcqEio8GBFDI0tPKhRAGwtLFRYJEhorMjKTTtPrdYEWb9JnUjt/shZ/sEZDYgAB//7/9AGZAjMAIQAAARYyNxQGIicOAiImNTQ+ATIVBhQzMj4BPQEuATQ2MzIWATwdNQsXKxkDQmhnLCUyKD8nIldAHSQaDxIfAcUWBw0XCl7FhVU3QpdcFdqwdsFcBhU6HRhDAAABAAD/9AJ7AjMANQAAARYyNxQGIicOAiInJjU0NwYiNTQ3NjcyFQ4CFDMyNj8BNjIVBhUUMzI+AT0BLgE0NjMyFgIeHTULFysZAjpcWhgZBXyFOTAoEwwkOxUabyorHCw9ICRPNR0kGg8THgHFFgcNFwpexYUjJ0gpL95wdIRpBRUdW8hfqFRTOBXRdjd3v10GFTodGEMAAAH/7P/dAW0B5AA2AAAFIiYnDgEjIiY9ATI+BTcwNy4GJyYjPgIzMhYXNjMyFhciBgceATI2MzIHDgEBJitKJzRAFAsLBxINEg4WDw0VBRAKDQoMCQYKCQEDFxEZMR11MwwPAiRZOTotGxYEDg8EGyN1ZlJTDQcHEw4ZFCEXFB8OLBwlGBwRBw8EDRZgV6QODmFWuEcTFgcYAAAB/6z+sAGlAeUAQAAAEzI3NjcGBwYnJjc+ATc+ATcjBiMiNDY/ATIVDgIUMzI3Njc2MzIVDgIHFhcWFAYjNi4CJwIjIicmNTQ2FxYbWjMsGLVhBg0HAyuabgsUDQmCRExkKQYRCyI4GBw+W0MdIRUTNiIMTAwCGAkCAgseGE2+UhsBFQUS/sdVS3AEhgkGBAZBWwQyhj/n6u0JARYbV8dvYY6SPRcjwMM3DTUJHxcHIxgaBv7eOgMCBgMIKQAAAf+n/rABWAHnAD0AAAMiNTQ2NzYWFAcGBwYUFzI3Njc2NTQjIgYjIi8BMjc2NzY1NCciDgIUBiY0PgIyFhUUBzYzMhUUBwYHBgtOh2YFCgZnRi8jU2JTHQosImIOFwYCSkxADgInKE0xHhMTJj1dWzKEDAdeOEVkOP6wS0KzJwIJCwMmZkZaAXJgYCEWLy0iDGZYUw8MMAE9T0AOBQoXR1NAPDCBdAJoS2B1NBwAAQAk/6cBUwMLACQAADc0IyI1NDMyPgQzMhYXIg4BBwYHFhQHBhUUMwYjIiY1NDZaMAULHigSGh5GMgwOATg+FAYPQBYKEU4CGCwrDv5SCx08WWlZPA0MQ2c2iicVaTlhKWUUPy9cgAABAH//hADGAtEACwAAFyI1EhM2MzIWFQMGigsEDAElBwknAXwUAToBrFMPCv0GOgAB/+b/pwEVAwsAJAAAExQzMhQGIyIOAyMiJicyPgE3NjcmNDc2NTQjNDYzMhYVFAbfMAUGBSQpFx5KOwwOAjg+FAYPQRYKEU4OCywrDgGzUhUSU3d2Uw0MQ2c2iiYWaDpgKWUHDj8wWoEAAQBFAbEB2QH/ABEAAAEqAQYiJi8BMxYyNjIWHwEjJgFjBCh3NjAKCyERQHpGQhAQIR8Bzh0fEA8WJiYTExsAAAIAA/7EAMQB5QAKABcAABIyFRQPASInJjQ3FxQOASMiNTYSNTQzMpQwFggRCQUFKC5NJhAoXA8eAeUXFDgSHQ8dD+xh+r0QWQGOTg4AAAIAAP8+AT8CoAA5AEAAABcmNDcmJyY1NDc2NzY3Njc2NzYzMhcWFRQOAgceAR8BIzQmJwIHPgE/ATYyHQEGBwYHBgcGBwYjIgMUFxI3DgGACxZmHAkfMFUfIgYHCggBCAMDEgIIDAYVGwMDGRUNUwIaLQoJBBoeNRUXBAcNBAIFAz1MPBJBWcAEHn4CZCEkRE55MxMFIyo+KQoBBhoHDDA8HgQdDQ0JFAL+SQoHKBAQCQYDPSAOBRgkRRsJAUl/BgFbZBfKAAP/1/+rApACvgA5AEcAUQAAASIHBgcWMzI2PwEyBw4BIi4BJwYiJyY0NjIXNjcGIyInJjcWOwE2NzYzMhYVFyYiDgUHMzIGNxQGJjU0NjMyFhUGBwYBFBYyNyYjIgcGAfUySyxOpkcjMAYHEAECSWNrOzc5nxkHJmZqPCUlNR0EAQwFEV8gEC9jHB0BCi4gGBERChAFhAkDPxESLiYKDi4TCP2tMVopUzofBwEBOAPFTD4bDQ4aKC8eHBwhLAwdIyREugIWDwIHrDGRHA4OChAoJEYtWhcYgQQBCAdmfQ4MLlgl/kERFhkrFQQAAQA6ABgB4gHXAEAAAAEyFRQPARYVFAcXFgYvAQYiJwcGIyImND8BJjU0NzY3NhYGBwYHBhUUMjc2NTQjIgcGJyY3JicmPgEfATYyFzc2AdQNBkUTNE0LEgtLNYUgOAUFCQUFPQcvIi0GBwEEJhYQdygiPCUfEhAFAyItBwQOCU4tXRpFBQHWCwcHRSEuWU1OChMLSkIqNwUJCgU9GhdNOioKAgkMAQtAKylkU0ZHaRwOBAEEIy0HEQIHTiMXRQUAAf///5oCDQKfAGEAACUjBiMiJyY0NjMyHwEiBwYUFjMyNyMiNTY3FjIXNjcGIyInNjcWOwE2NyMGIyI1NDY1NCMiBwYVFBcWMwYjIicmNDc2MzIWFAYUMzI2Nz4BMzIWFAcGAgczMgYiBwYHMzIGAZk5QXNgGwgiIRMFASoPBikuUDooFQEGAy0TEAcWJxUBAQYDDEYeIAhQSERFUEQoHAYSSgEZRxUIFy9eP0VDFhpAHDkyHgoJAR1MGigIBCUPCA02CAQEakATKzUNBCgOJS9QEAkBBQEcDwEQCQEFSYaDUjTTNldFMC8WFUURRxlIMWROedBNRDFolgwGAkD+u0IQARYYEAAAAgB//4IAwQKbAAkAEgAAGwE2MzIVFA4BBwMiNTYTMwIHBogGASIPBgcDJwoBBiYPAQEBSQEFTRkFbJYy/joTRQEU/uAVNwAAAv/q/9kB6gMDADQAQwAANxQXFjMyNjU0JyYnJjQ2NzU0NjMyFh0BJiMiBhUUFxYXFhQGBw4BIicmNTQ3NjcyFhciBwYTFhcWFT4BNC4CJw4BFBMDDDtVZDgYGDlfO3JAFBQJGS1RORgYOFJLCn/DEgQfMksMEANEMB/VFxc6LjIlLzcLKUIpCgolalNIMhUTLWplCgQ/axcMDAdNNy0wFRY1hm8WTGo/Dg4oKEABDw85JQEGFBY2QhZZZEImMBUISF4AAAIAiwIvAWACpAAJABQAABMiNTQ2MzIVFAcXIjU0NjMyFRQGB6AVGhgUJYMVGRgVGAwCLygYNRcXNhEpGDQXDC8SAAMAcP/cAtoCQgANABsASQAAADIXFhUUBwYiJyY1NDcHFBcWMjc2NTQnJiIHBgU2Mh0BDgQjIicmNTQ3Njc2Mhc2MzIVBhUUJyY0Ni4BJyYjIgYVFDMyNjcBRf5RRnJk/1BFcl1AS+1da0FM7VtrAVwCFQIGFxgoFFQTBSAsRhYuDRUgDDgJCwUBBQMHETZSPhgrCgJCWk5plGdaWk1plWf7YEdUVGCJYUhUVGHZCAYCAwwdFxJUFhg8RF0bCBFADE5ACwEBMRcDCAQIpE5iHg8AAAEAUAGCAV0DAwAvAAATIjU0NzY3MhYXBiMiJyYjIgcGFRQXMjY/ATYyFQ4BFBYzMjc2Mh0BBiMiJjQ3IwaFNSg0RBEYBwENCQQEEyYhJgwOSx4eEyUTIQcKDQgCDxAYGx0HBVQByVNDSFkDEhILCBJFUEgmCG83NyUPJpZiHBYHBQIwRWcpjgACACMAPQHlAa0ACAASAAA3JjU0PwEVBxc3JjQ/ARUHFxUmzqsJ5LNxLQMI5bNwgD3EDgcGkSCJpagFCgaRIImlIpQAAAEAPgBbAtABfgALAAABMhYUDwEjNyU1JTICoxkTA2kgR/20AmECAX0WEQjz6QwbEgAAAQBVAPwBnwEXAAsAACUFIjU0NzYzBTIVBgF5/uYKAQUnARQJBv4CBgICEQgFCwAAAgBWAeIBegMFAAkASAAAEjIWFRQGIiY1NDM2NCMiBhUUIyI1NDY3DgEVFDMGIyI0NjIVDgEHMzYzMhQHBgcyHgEXNjc2NTQmIgcGFRQWMzI3LgEnIj0BMrp5R2Z4Rr8KCxw+BAkSDhcoBQEFDEEcDgwBAyUqHCENDwoTEwg5CQFCbyoyQDcmIRIjBgYhAwVPM0ZbTzJHEhiZEgQTMVUQBBgSBQcjHgMjPgNvPRgKAzI6BydEBwcvSSctQi1IEwtpBQYCAAIAXQHmARcCnQAHAA8AABI2MhYUBiImNhYyNjQmIgZdNU82Nk81HSUzJSU0JAJoNTRONTYNJSUzJSUAAAIAPwCRAcEB5AAbACgAADciNDcGIyInNjcWOwE+ATMyFQYHMzIVFCIPARQXMAUiJzY3FjMhMhUU+RAGO1QdBAELBBGUDywSDBUbnAgvfBKo/rQdBAELBBEBWQjOOCMCFA8DBj1gCyxmCBAEUwo1CBQPAwYIEAABAC4B2wD/AwgAKAAAEzI+ATU0IgcGFxYzBiI1NDc2NzYzMhUUBgcWMjY/ATIHBg8BIiYjIjQyD05FSRcPDAICAyUCCSgdH0NtOVggGAMDCgMFIRYgWg4EAgpJZB8dKBoHARoTBgcpHBQ4LHclCAwGBhMfCAMaFQABABwBrAD9AwcAKQAAExYVFAYjIicmNTQ2NxQyNzY1NCM2MjY1NCIHBh8BBiI1NDc2MzIVFAcGsEBLQBkSHgwMYhoRRgEiNEERCwwFBCUtGRw9JBICehFBKlIHDBIIDQUtLBwWUxA+HhkdFQUBFRIkGw8xIiEQAAABAQMCJwGFArYACgAAAQ4BIjQ2NzYyFhQBfh5KEy4fDRUSAo0kQhNJIw8JEwAAAf+x/uABpgHlADAAAAMiNTQ3Njc2MzIVDgEUMzI+ATMyFQYCFDMyNjc2MzIHDgEjIjU0NyMGIyInBhQzFAYcMyUgJEU0Eio8GCOYWCgUGkogDRUIAggNAQYrElgJCHlCMxIdHhb+4GNWn4VlwxZv0mf8whYp/vigFhUJBho3oiY21TmHvAoQAAIABv+bAt4DLQBVAGIAABciJyY0NzYzMhciBwYUFxYzMj4ENyYjIgcGFRQXFjMGIyInJjQ3Njc2Mhc2NzYzMh8BIgc2MzIXFhUUBiInBgIHBiMiJjcyNzY3EjcOBgEiDwEWMzI3NjU0JybOhy4SDB09EQstGQ4NImpPbjYoEiUaRylhQDVCEhUDE2QpFBAkXzeGUQIFIT4NBAI0HhYgLgkCKDEnDhwNGlMKCAI+Gw0HGwwZGhcaMD5gAZknGgEhFyUGARIHZVMgPRxAETIdNhlEVIKqnZwqG2JPWWUaBw9VKlktaC4bIAMFfAwEUgwfBwYUHA5J/pRSsQ0NmUlLAQhDP8B+bmdKLAMnHQgMFgMDDQYCAAEAZgDwAKwBZgAJAAA3IjU0NjMyFRQHexUZGBUk8CgYNhcYNQAAAQAC/y8AwAADACMAABc0NzMHNjMyFxYVFAYiNTQ3NjMyFyIHBjMyNzY0JiIOAQcjIiwzFi4aITIKAUN6DgQGCgQOAgIlPBsLEyQaEgMCCVwWSVINJgcIHT0nDwcCDA8XLBIbFgcIAQABACgB1wDWAwUAFwAAEzIVDgEVFCMiNTQ2Nw4BFRQzFCImNTQ2zggZJAkTHBcnQBIhEnEDBQcS1ToGJU6LHg9MJRUPFxAwXwABACMBxQEiAxgAIQAAEyI1NDc2MzIWFyIGFDMyNj0BLgE0NjIWFxYyNxQjIicOAW9MHSQ0CgsBJTcmIkISFw4VFQQRGwcUEQwCTAHFaDg4SAkId36SUggMIhEOKBoKBRYEWaEAAgAyAD0B9AGtAAkAEwAAJRYUDwE1Nyc1FgcWFA8BNTcnNRYB8QII5LJwgK0DCOWzcIDiBAoGkSCJpCOVNgQKBpEgiaQjlQAAAwA2/6cDVwLUADcATwBeAAAlMhQGBwYVFCMiNTQ3JicGIyInJjc2OwE2NzY0IzU0MzIXFhQHBgcWFz4CMzIVBgc2NzYnJiM2ATIVBgIVFCMiNTQ2Nw4BFRQzFCImNTQ2AyI1NDYANjIVFAYHAgcGAz0ZQDoKCxwBNWgUEykDAhcICwoyFQMMExoLBQcOJWUZCCgrGwwuIj0PCQsCAgP+ExIoRgscLiU+aBQrGL01DDEBHxkkIlHBPQjCRjgDQDEKPSkVAgwKFBAHAzipG0IBEEEdSi5VLQ4BbH0wDD3QBisaBwEUAgcMLf6vUAo7ft0xGXw6IRYiG0qc/N4QEGQCdjMaHEWf/oGEEAADADb/pwMYAtQAKgBCAFEAAAEGFBcUBiMiNTQ2MzIVFAYHBgcyFjI2PwEyBwYHBiImIyImNjMyPgE1NCIBMhUGAhUUIyI1NDY3DgEVFDMUIiY1NDYDIjU0NgA2MhUUBgcCBwYCNRMQEg4fcEhtPi5iUwOSQSYFBQ4DAycXVJYWAwMEAxSDeH3+4RIoRgscLiU+aBQrGL01DDEBHxkkIlHBPQgBVB4tAQ0VIjdwXChnL2QxChQKChgmFAsqCwt+rDI1ATcMLf6vUAo7ft0xGXw6IRYiG0qc/N4QEGQCdjMaHEWf/oGEEAAAAwAB/6cDgwLUADMAYwByAAAlMhQGBwYVFCMiNTQ3JicGIiY2OwE2NzY0IzU0MzIXFhQHBgcWFz4BMzIVBgc2NzYnJiM2ARYVFAcGIyImNTQ/ARQWMzI3NjU0JyYjNjMyNjU0IgcGFBYzBiMiNDYzMhcWFRQGAyI1NDYANjIVFAYHAgcGA2kaQjkKCh0BMWwSMhUXGAkzFQMMEhsLBQgOJWQbCTkzDS4iPBAJDAICBP2JYDI9YjY2FgclKk4rGQUWVgIUIVNnGgkJBgQZIVg+UAsCSCALMQEjFSMiUcE9CMJGOANLJgo9KRUCDAoXFzWsG0IDDkEdSS9VLQ4BdqMMPdAGKxoHARQBMxtgPjhDJg4WDQQXLUYqKhQUSxddLicrEBQII0lNNwkJKlD9oBARZAJ/KRkdRZ/+gYQQAAIAAv7UAYMB5AAhACwAAAU2NCM1NDc2MzIVFAcGIyImND4BNzY1NDYVFAcGBwYVFDISMhUUDwEiJyY0NwEqIBQTCAonOk5sRUdDXi9zI2QqKmSoWzAXCBEJBAS+L0IFFwsELT1EXERscV4raTcLAQw4dC8yeVZOAvAXFjUTHQ4eDgAE////igRCA/YACgBSAF4AZgAAAR4BFCImJyY0NjIBJjU0Nz4BMzIXPgE3NjMyFQYKARUUIyI1NCcmJw4DBwYHFjMyNjc2FxYHDgEjIicGIyInJjU0NzY3NjMyFhciBwYVFBYyASIOARQXPgM3JgEOAQcWFzYSA8EkRBZHJhANFP26MUUmgk0iJ0xgI09REEJHJw4jEyNXCz0dORQwOAoOVG4VAw0IAhZ7XRUaXGiHOR8JGEolLA4SBDsvT12dAVlUhj4mJlYyahAYAWdQhEVhJxJRA+0iUhQ0Jg4UFPv9L15pcD5QDH1wHUAQkf7Z/ulhDlBlUpwyFXY3Yx5INgNvTAsBAQdWgQdKajlCIyZnLBYREipFf01XAhZuk5YnJHVQtBoHATsVnIE1n6oBHQAABP///4oEfgPmAAoAUgBeAGYAAAEOASI0Njc2MhYUASY1NDc+ATMyFz4BNzYzMhUGCgEVFCMiNTQnJicOAwcGBxYzMjY3NhcWBw4BIyInBiMiJyY1NDc2NzYzMhYXIgcGFRQWMgEiDgEUFz4DNyYBDgEHFhc2EgR3HkoTLSAOFBP88zFFJoJNIidMYCNPURBCRycOIxMjVws9HTkUMDgKDlRuFQMNCAIWe10VGlxohzkfCRhKJSwOEgQ7L09dnQFZVIY+JiZWMmoQGAFnUIRFYScSUQO+JEMTSSQOChL8KS9eaXA+UAx9cB1AEJH+2f7pYQ5QZVKcMhV2N2MeSDYDb0wLAQEHVoEHSmo5QiMmZywWERIqRX9NVwIWbpOWJyR1ULQaBwE7FZyBNZ+qAR0AAAT///+KBGsDzwAJAFEAXQBlAAAAMh8BIycHIzY3ASY1NDc+ATMyFz4BNzYzMhUGCgEVFCMiNTQnJicOAwcGBxYzMjY3NhcWBw4BIyInBiMiJyY1NDc2NzYzMhYXIgcGFRQWMgEiDgEUFz4DNyYBDgEHFhc2EgQcEAQ7HC6CHWAw/V8xRSaCTSInTGAjT1EQQkcnDiMTI1cLPR05FDA4Cg5UbhUDDQgCFntdFRpcaIc5HwkYSiUsDhIEOy9PXZ0BWVSGPiYmVjJqEBgBZ1CERWEnElEDzwh2TU1QJvwrL15pcD5QDH1wHUAQkf7Z/ulhDlBlUpwyFXY3Yx5INgNvTAsBAQdWgQdKajlCIyZnLBYREipFf01XAhZuk5YnJHVQtBoHATsVnIE1n6oBHQAABP///4oEgwOyABMAWwBnAG8AAAEiByM2NzYzMhYyNzMOAgcGIiYBJjU0Nz4BMzIXPgE3NjMyFQYKARUUIyI1NCcmJw4DBwYHFjMyNjc2FxYHDgEjIicGIyInJjU0NzY3NjMyFhciBwYVFBYyASIOARQXPgM3JgEOAQcWFzYSA8YZFyAIEyUlEjctFB4CBRMLGzQ7/Z0xRSaCTSInTGAjT1EQQkcnDiMTI1cLPR05FDA4Cg5UbhUDDQgCFntdFRpcaIc5HwkYSiUsDhIEOy9PXZ0BWVSGPiYmVjJqEBgBZ1CERWEnElEDjSkZEiMvJAMLGwocNfxlL15pcD5QDH1wHUAQkf7Z/ulhDlBlUpwyFXY3Yx5INgNvTAsBAQdWgQdKajlCIyZnLBYREipFf01XAhZuk5YnJHVQtBoHATsVnIE1n6oBHQAF////igSJA84ACQATAFsAZwBvAAABIjU0NjMyFRQHFyI1NDYzMhUUBwEmNTQ3PgEzMhc+ATc2MzIVBgoBFRQjIjU0JyYnDgMHBgcWMzI2NzYXFgcOASMiJwYjIicmNTQ3Njc2MzIWFyIHBhUUFjIBIg4BFBc+AzcmAQ4BBxYXNhIDyRUaGBQkghUZGBUl/Q0xRSaCTSInTGAjT1EQQkcnDiMTI1cLPR05FDA4Cg5UbhUDDQgCFntdFRpcaIc5HwkYSiUsDhIEOy9PXZ0BWVSGPiYmVjJqEBgBZ1CERWEnElEDWCgYNhcYNRIpGDUXFTj8iC9eaXA+UAx9cB1AEJH+2f7pYQ5QZVKcMhV2N2MeSDYDb0wLAQEHVoEHSmo5QiMmZywWERIqRX9NVwIWbpOWJyR1ULQaBwE7FZyBNZ+qAR0ABf///4oETwPrAAcADwBXAGMAawAAADYyFhQGIiYWMjY0JiIGFAEmNTQ3PgEzMhc+ATc2MzIVBgoBFRQjIjU0JyYnDgMHBgcWMzI2NzYXFgcOASMiJwYjIicmNTQ3Njc2MzIWFyIHBhUUFjIBIg4BFBc+AzcmAQ4BBxYXNhIDvyk9Kio9KTUiGRkiGP2VMUUmgk0iJ0xgI09REEJHJw4jEyNXCz0dORQwOAoOVG4VAw0IAhZ7XRUaXGiHOR8JGEolLA4SBDsvT12dAVlUhj4mJlYyahAYAWdQhEVhJxJRA8EqKjwqKwsYIhgYIvxfL15pcD5QDH1wHUAQkf7Z/ulhDlBlUpwyFXY3Yx5INgNvTAsBAQdWgQdKajlCIyZnLBYREipFf01XAhZuk5YnJHVQtBoHATsVnIE1n6oBHQAAA////2gFywMkAHkAhACSAAAlNzQnDgEHBgcWMzI2NzYXFgcOASMiJwYjIicmNTQ3Njc2MzIWFyIHBhUUFjI3JjU0Nz4BMzIXNjc2MzIUByIHDgEHFhc+ATcmNDc2MzIWFQcmIyIHBhUUMzIWFyIHBhUUFxYzMjc2NTQnJiM2MzIXFhUUBwYHBiMiJgMiDgEUFzY3NjcmJRQjIjU0NjMyFhUGBwYDOgJoWCMhO0MVA1RuFQMNCAIWe10VGlxohzkfCRhKJSwOEgQ7L09dnVExRSaCTSImWFJdaQIBaFQqQShiESikblBCTGwTEgEIG1o/K30LDwSsdW4yJz+OTDIvCAkNIzEPBR42bTxFeWjBVIY+Jj9WKWoVAugJGi4mCQ8uEwhQQdVDp0A3YEEDb0wLAQEHVoEHSmo5QiMmZywWERIqRX9NV0YvXmlwPlAMkFZkEBBeL2RJO7xfkhgdjjtEHA4NBEAtK1QNDYV8l1cvJnhOVl4RAxdBGBo9SX4zHIgB0m6Tlic8hEG1CGIFD2Z9DwsuWCUAAAIAO/7EAowDBgBKAFkAAAEiBwYHBhUUFjMyNzY1NCM2MzIVFAcGIyInBzYzMhcWFRQGIicmNzYzMhciBwYzMjc2NCYiDgEHIyI0NjcmJyY1NDc+ATMyFgcVJhcUIycmNTQ2MzIWFQYHBgIHim1eHQpIQVg+KgwGGBxCT2oSFiYaITIKAUNzBgQRBAYKBA4CAiU7HAsTJBoSAwIKGBZWIxZWNspzFBIBCCEMDQkuJQoOLhMIAtahi7k9M2J3ZUQ0FxcoS1VlBUUNJgcIHT0fFQkCDA8XLBIcFgcJAREwHhpkPTqjwHqlGgwNA9QFAwQHZn0ODC5YJAAAA//8/2gCkAPUAAoAQgBQAAABHgEUIiYnJjQ2MhMyFxYVFAcGBwYjIicmNDc2NzY3JjQ2MzIWBxUmIyIHBhUUMzIWFyIHBhUUFxYzMjc2NTQnJiM2NxQiJjU0NjMyFhUGBwYBxSVDFUkmDgwUIjEPBh82bTxFlDYZFS52SVhQjmwSEgEIGls+LH0LDwWtdW4yJz+OTDIvCAkNjRIRLiYKDi4TCAPKIlMSNCUOFRX9WkEYGj1JfjMcbDJyPohWNBQdjn8cDg0EQC0sUw0NhXyYVi8meE5WXhEDF/YFCAdmfQ8LLlglAAAD//z/aAKQA8UACwBDAFEAAAEOASI1NDY3NjIWFAMyFxYVFAcGBwYjIicmNDc2NzY3JjQ2MzIWBxUmIyIHBhUUMzIWFyIHBhUUFxYzMjc2NTQnJiM2NxQiJjU0NjMyFhUGBwYCbBxKFC0gDBUTljEPBh82bTxFlDYZFS52SVhQjmwSEgEIGls+LH0LDwWtdW4yJz+OTDIvCAkNjRIRLiYKDi4TCAOdI0QIDEgkDgoS/YZBGBo9SX4zHGwycj6IVjQUHY5/HA4NBEAtLFMNDYV8mFYvJnhOVl4RAxf2BQgHZn0PCy5YJQAAA//8/2gCkAO2AAkAQQBPAAAAMh8BIycHIzY3AzIXFhUUBwYHBiMiJyY0NzY3NjcmNDYzMhYHFSYjIgcGFRQzMhYXIgcGFRQXFjMyNzY1NCcmIzY3FCImNTQ2MzIWFQYHBgIQDgQ8HC6CHWAwKDEPBh82bTxFlDYZFS52SVhQjmwSEgEIGls+LH0LDwWtdW4yJz+OTDIvCAkNjRIRLiYKDi4TCAO2CHZNTVAm/YBBGBo9SX4zHGwycj6IVjQUHY5/HA4NBEAtLFMNDYV8mFYvJnhOVl4RAxf2BQgHZn0PCy5YJQAABP/8/2gCkAOoAAoAFQBNAFsAAAEiNTQ2MzIVFAYHFyI1NDYzMhUUBgcDMhcWFRQHBgcGIyInJjQ3Njc2NyY0NjMyFgcVJiMiBwYVFDMyFhciBwYVFBcWMzI3NjU0JyYjNjcUIiY1NDYzMhYVBgcGAZ0VGRgVGAyBFRoYFBgMWzEPBh82bTxFlDYZFS52SVhQjmwSEgEIGls+LH0LDwWtdW4yJz+OTDIvCAkNjRIRLiYKDi4TCAMzKBg1FwwvEhEoGDUXDC8S/epBGBo9SX4zHGwycj6IVjQUHY5/HA4NBEAtLFMNDYV8mFYvJnhOVl4RAxf2BQgHZn0PCy5YJQACAAb/jAJhA7kACgA9AAABHgEUIiYnJjQ2MhcyHwEiDgYiJicmND4BMzIWFyIHBhUUFxYzMj4DNzY3DgEVFDMGIiY1ND4BAdglQxdGJw8MFIAQAwEdKRQYFS49bJRfBwIXVzgPEQNaNCEKHGc4VTQmHA0hME5/FQIlHXWRA68iURQzJg4VFL4MBEp5m6KbeUpYPxU/aVgSElk6Oh8gWUl7l6RJrjYbdUUfDh4cO289AAIABv+MAnMDqQALAD4AAAEOASI1ND4BMzIVFAcyHwEiDgYiJicmND4BMzIWFyIHBhUUFxYzMj4DNzY3DgEVFDMGIiY1ND4BAmwcShQuKwsdJhADAR0pFBgVLj1slF8HAhdXOA8RA1o0IQocZzhVNCYcDSEwTn8VAiUddZEDgCNDCAxJMRQJkQwESnmbopt5Slg/FT9pWBISWTo6HyBZSXuXpEmuNht1RR8OHhw7bz0AAgAG/4wCewOaAAkAPAAAADIfASMnByM2NxcyHwEiDgYiJicmND4BMzIWFyIHBhUUFxYzMj4DNzY3DgEVFDMGIiY1ND4BAioRBDwdLYIeYTArEAMBHSkUGBUuPWyUXwcCF1c4DxEDWjQhChxnOFU0JhwNITBOfxUCJR11kQOaCHVMTFAlmAwESnmbopt5Slg/FT9pWBISWTo6HyBZSXuXpEmuNht1RR8OHhw7bz0AAwAG/4wCggOkAAkAEwBGAAABIjU0NjMyFRQHFyI1NDYzMhUUDwEyHwEiDgYiJicmND4BMzIWFyIHBhUUFxYzMj4DNzY3DgEVFDMGIiY1ND4BAcIVGhgUJYMVGRgVJBEQAwEdKRQYFS49bJRfBwIXVzgPEQNaNCEKHGc4VTQmHA0hME5/FQIlHXWRAy4oGDYXFTgSKBg2Fxg1RgwESnmbopt5Slg/FT9pWBISWTo6HyBZSXuXpEmuNht1RR8OHhw7bz0AAAIAB/+MAqgDBgAyAFIAABMiNDc2PwEyFxYVFAcGBwYgJyY0NzYzMhYGIyIHBhQXFjMyNzY3NjU0JyYjIgcGFRQzBgUiBwYVFCMiNTQ3BiMiJzY3FjsBPgEzMhUGBzYzMhUULCU2WqA3tlIxCB1teP7BKw0RITkFAwUFIhkQCiB5iW9kHQoxQYuuVywJBgFaA38vDh4VQBAdBAELBBFVGVEmEDApNVMIAd5oQGwRA5FZdDA1snyJWRw/I0ALDCwfNBZEjH6qNzFtS2V1PDQVFGgF6GkNUIeEAhQPAwaIrRBkwAEIEAAAAgAA/24CtQONABEATgAAASIHIzY3NjMyFjI2NzMOASImExQzMjc2FxYOAyMiNTQTNzYiBw4BBw4BIyI9ATY3Njc2NTQmIgcGFDMGIjU0NjMyERQHMxIzMhUGBwIBjhkXHwgTIyYSNyAXCh4NOC87dD4mHgUMBgYKGSUUeYEQAg0GOH81YlgdFQwiPAgBLnQZCAcCKlM9kQoJ6H8tHyZgA2cpGRMjLxESHTE0/LOLOwoEAg0TJxm/xQGgMwgFMb9qwtkWAht61acMCkFgNREYDhspQP74OTsBuTJNhf64AAACAET/xgJpA8wACgA1AAABHgEUIiYnJjQ2MhM0IzQ3NjMyFxYVFAcGBwYjIicmNDc2NzYzMhYVFyYjIgIHBhUUFxYzMhIBoCVDFkcnDwwUn1MHDRNDFQkfNGlIU4cwFxYtZlhlHB4BChtspxMFLSQ6eZsDwiRREjMmDhUU/gm3BwYLaCovWW27XD+JQJxbtW1eGQ0MBP7srSwlcj0vAUsAAgBE/8YCaQPJAAkANAAAAQ4BIjQ+ATIWFAM0IzQ3NjMyFxYVFAcGBwYjIicmNDc2NzYzMhYVFyYjIgIHBhUUFxYzMhICPx5IFC4rFRIRUwcNE0MVCR80aUhThzAXFi1mWGUcHgEKG2ynEwUtJDp5mwOgJEIUSTEJE/4otwcGC2gqL1ltu1w/iUCcW7VtXhkNDAT+7K0sJXI9LwFLAAACAET/xgJpA7AACQA0AAAAMh8BIycHIzY3EzQjNDc2MzIXFhUUBwYHBiMiJyY0NzY3NjMyFhUXJiMiAgcGFRQXFjMyEgH/EQM8HS2CHWAwPlMHDRNDFQkfNGlIU4cwFxYtZlhlHB4BChtspxMFLSQ6eZsDsAd1TExQJf4rtwcGC2gqL1ltu1w/iUCcW7VtXhkNDAT+7K0sJXI9LwFLAAIARP/GAmsDlwASAD0AAAAWMjczDgIHBiImIgYHIzY3NhM0IzQ3NjMyFxYVFAcGBwYjIicmNDc2NzYzMhYVFyYjIgIHBhUUFxYzMhIB1DgsFB8CBRQKHDQ7GhgMHxAuEoZTBw0TQxUJHzRpSFOHMBcWLWZYZRweAQobbKcTBS0kOnmbA5cvJAMLGwsbNRQVLxYJ/j23BwYLaCovWW27XD+JQJxbtW1eGQ0MBP7srSwlcj0vAUsAAwBE/8YCaQOmAAkAEwA+AAABIjU0NjMyFRQHFyI1NDYzMhUUBwM0IzQ3NjMyFxYVFAcGBwYjIicmNDc2NzYzMhYVFyYjIgIHBhUUFxYzMhIBqBUZGBUlghUaGBQlDlMHDRNDFQkfNGlIU4cwFxYtZlhlHB4BChtspxMFLSQ6eZsDMCgYNhgUOBIoGDYYFDj+krcHBgtoKi9ZbbtcP4lAnFu1bV4ZDQwE/uytLCVyPS8BSwAAAQAx//8BxQHnACEAADcGIjQ2Ny4CJyYzMhcWFzY3NjIWFRQGBxYXFiMiJyYnBkEGCiOcEDYoCw4TFRgHVFdVBgkGPHY6LQkLDxQoLpYGBhgpuxtcRBMWJQ2ba2IGCwYSSYNvTg4iSkipAAIARP86AmsDdQAyADsAAAEWFRQCBw4CIyImNDc2NyMiJyY0NzY3NjMyFhUXJiMiAgcGFRQXFhcSNzYzMhcWFRQGAj4BNTQnAgM2Ag1erIgLHAUFAw4DFQkEhzAXFi1mWGUcHgEKG2ynFAUuIzrrEQMIAwQRKDA4FDBhYT4Coga7o/6kGCReDgcWCUcfiUCcW7VtXhkNDAT+660rJXI9LgEDP0QKAgYVDoj9uKyIKIMm/rD+vQ4AAgAj/24C5wNNAAkARQAAAR4BFCIuATQ2MhMUMzI3NhYUDgEjIjU0NyMCIyI1ND4BNTQjIgcGFRQXFjMGIyInJjU0NzYzMhYUAhQzMjc2NzYzMhUGAgIEJEQWRjcNFGk1HB0FEBQrFmgTCplTZTs8YlstHgcWRwcMWhsJJzpxV09wJyBAaU8fIhYrMwNEIlIUMzQVFPzYlTsKBQcsLs9sef7eeDDD0Dl4aEZGIiJoDnIkJE1OcmGb/o1zYqO+Sxdm/t8AAAIAI/9uAucDSwALAEcAAAEOASI0Njc2MhcWFAIVFDMyNzYWFA4BIyI1NDcjAiMiNTQ+ATU0IyIHBhUUFxYzBiMiJyY1NDc2MzIWFAIUMzI3Njc2MzIVBgKpHkoTLSANFQcMTTUcHQUQFCsWaBMKmVNlOzxiWy0eBxZHBwxaGwknOnFXT3AnIEBpTx8iFisDIyRDE0kkDwUGEv1lb5U7CgUHLC7PbHn+3ngww9A5eGhGRiIiaA5yJCRNTnJhm/6Nc2KjvksXZgAAAgAj/24C5wNiAAkARQAAADIfASMnByM2NxMUMzI3NhYUDgEjIjU0NyMCIyI1ND4BNTQjIgcGFRQXFjMGIyInJjU0NzYzMhYUAhQzMjc2NzYzMhUGAgJfEQM8HC6CHWAwDTUcHQUQFCsWaBMKmVNlOzxiWy0eBxZHBwxaGwknOnFXT3AnIEBpTx8iFiszA2IHdk1NUCb8yZU7CgUHLC7PbHn+3ngww9A5eGhGRiIiaA5yJCRNTnJhm/6Nc2KjvksXZv7fAAMAI/9uAucDPQAJABMATwAAASI1NDYzMhUUBxciNTQ2MzIVFAcDFDMyNzYWFA4BIyI1NDcjAiMiNTQ+ATU0IyIHBhUUFxYzBiMiJyY1NDc2MzIWFAIUMzI3Njc2MzIVBgIB6BUZGBUlghUaGBQlHzUcHQUQFCsWaBMKmVNlOzxiWy0eBxZHBwxaGwknOnFXT3AnIEBpTx8iFiszAsgoFzYXFDgSJxg2FxQ4/UqVOwoFBywuz2x5/t54MMPQOXhoRkYiImgOciQkTU5yYZv+jXNio75LF2b+3wAAAv/p/roCwQNJAAsAXgAAAQ4BIjU0Njc2MhYUATI+BzcjAiMiNTQSNTQmIyIHBhUUFxYzBiMiJyY1NDc2MzIWFAIUMzI3Njc2MzIVBgcGBw4DIyInJjU0NzY3NjMyHwEiBwYVFBcWApsdShQuHw0VE/47RW1AOhUVAgIEBgeMVmRkLzNbLR4HFkcHDFobCSc6cVdPXSchPGJIHCMWIyMpLBNAS2s/mT4dCRdAGxUhBgJFJxl4IAMgI0MIC0kjDwoT+6ZIVLBebggLFh7+8Hg2AV1PMz9oRkYiImgOciQkTU5yYZv+rXNfl7JGF1XI6mUsZTsoaDI5HyFUHw0TB0gvJ5UlCgAD/9f/7wI1AwUAMAA8AEIAABMOARUUFzY3PgEzMgcGAzY3Njc2NzYzMhcWFRQHBgcGBw4EBwYjIjQ3LgE0NjclNCciBwYHNjc2NzQBMjcHBhY5JBs7IR8IGg0QARU4DBgyLzAwPkFUEgUvSYhHTwobERYQCRAMFScsLS4oAcAoU0w/PZFjRwj+aAsgIBIBAaEPJwsoB7iDJSUSaf72AQShYGIvPUkSFEBOe0IjDBtPMTwlESBR1wQnMDYT8jQDinWpJYhhVQf+CWkCWg0AAAH+kf77AYcCtwBGAAA3MjY0LgE0PgI0JiMiDgUjIicmNDc2MzIfASIHBhQXFjI+BTIWFA4DFB4CFAYiJyY0NzYzMhUGBwYVFL4oJiwsMToxIh04RiEYJDx5WWshCw8YLBQIAiwTCBAchF4zJSQxWno9JjU2JiMqI0l1FAkLFygZJxEHF0FUQj9LSS9DRClnpMfIpGdJGjUbLg8FLhUuGStnpMfHpGc5TDcrKzU6NSY8U0svFy8ZLxUNKBATOgACAAH/kAGoArYACgBCAAATHgEUIiYnJjQ2MgMiNTQ3Njc2MhYfAQYjIi4CIyIHBhUUMzI2NzY3NjMyFQ4CFDMyNjc2MzIWDgIjIiY0NyMG6SVDFkYnDwwTilImNVYlQCUFBgMOEAUGFg5BNTwYE0UmQikiJBMJHC4fDBQIAwsEBAQKIRIqLQsKfwKsIlEUMyYOFRX9SoFNXIEvFBwODREPCxN1h3c8VUBuUUgXE0bQzhUVCwYOGSpulkXZAAIAAf+QAagCtgAKAEIAAAEOASI0PgEzMhUUASI1NDc2NzYyFh8BBiMiLgIjIgcGFRQzMjY3Njc2MzIVDgIUMzI2NzYzMhYOAiMiJjQ3IwYBdB5IFC4rCx3+2VImNVYlQCUFBgMOEAUGFg5BNTwYE0UmQikiJBMJHC4fDBQIAwsEBAQKIRIqLQsKfwKNJEIUSTEUCf1ogU1cgS8UHA4NEQ8LE3WHdzxVQG5RSBcTRtDOFRULBg4ZKm6WRdkAAgAB/5ABqAKrAAgAQAAAADIfASMnByM2AyI1NDc2NzYyFh8BBiMiLgIjIgcGFRQzMjY3Njc2MzIVDgIUMzI2NzYzMhYOAiMiJjQ3IwYBQg4FPB0tgh5gs1ImNVYlQCUFBgMOEAUGFg5BNTwYE0UmQikiJBMJHC4fDBQIAwsEBAQKIRIqLQsKfwKrCHZNTVD9g4FNXIEvFBwODREPCxN1h3c8VUBuUUgXE0bQzhUVCwYOGSpulkXZAAIAAf+QAcECiwAPAEcAAAAWMjczDgEiJiIGByM2NzYDIjU0NzY3NjIWHwEGIyIuAiMiBwYVFDMyNjc2NzYzMhUOAhQzMjY3NjMyFg4CIyImNDcjBgEqOCwUHw05LzsaGAwfEC4SsFImNVYlQCUFBgMOEAUGFg5BNTwYE0UmQikiJBMJHC4fDBQIAwsEBAQKIRIqLQsKfwKLLyQdMTQUFS8WCf11gU1cgS8UHA4NEQ8LE3WHdzxVQG5RSBcTRtDOFRULBg4ZKm6WRdkAAAMAAf+QAakCpAAKABQATAAAEyI1NDYzMhUUBgcXIjU0NjMyFRQHASI1NDc2NzYyFh8BBiMiLgIjIgcGFRQzMjY3Njc2MzIVDgIUMzI2NzYzMhYOAiMiJjQ3IwbpFRoYFBgMghUZGBUl/tBSJjVWJUAlBQYDDhAFBhYOQTU8GBNFJkIpIiQTCRwuHwwUCAMLBAQECiESKi0LCn8CLygYNRcMLxIRKRg0Fxc2/cCBTVyBLxQcDg0RDwsTdYd3PFVAblFIFxNG0M4VFQsGDhkqbpZF2QAAAwAB/5ABqALDAAcADwBHAAASNjIWFAYiJjYWMjY0JiIGAyI1NDc2NzYyFh8BBiMiLgIjIgcGFRQzMjY3Njc2MzIVDgIUMzI2NzYzMhYOAiMiJjQ3IwbwKT4pKT4pHhcjGBgjF7pSJjVWJUAlBQYDDhAFBhYOQTU8GBNFJkIpIiQTCRwuHwwUCAMLBAQECiESKi0LCn8CmSoqPSorDRcXIxcX/XOBTVyBLxQcDg0RDwsTdYd3PFVAblFIFxNG0M4VFQsGDhkqbpZF2QAAAQAB/+ACVQHuAEgAAAEyFRQHBg8BIiYnMjc2NTQjIgcGFRQXFjI2NzY3NjMyBw4DIyInJjU0NwYjIjU0NzY3NjIWHwEGIyIuAiMiBwYVFDI+AgIITCI0VBIPFAVHOzAhQjk9OQsiJg0aEQQLEgICJyE1G1YiGAWCMVImNVYlQCUFBgMOEAUGFg5BNTwvl1VsAeVZMzhTCQEKClJCNylncHZkFAQRDBgdCAYLNB8ZQC08Gh3AgU1cgS8UHA4NEQ8LE3WHdzzQok8AAAEAAf8tAYQCIgBOAAAXJjcmJyY1NDc+ATIXNjMyFQ4CFRQjIic0NyYjIgYVFDMyNj8BNjIdAQ4DIicHNjMyFxYVFAYiJyY3NjMyFyIHBh8BMjc2NCYiDgEHRxQsKBgdWh9UThIbKhAIGSoLDQIHBiZIbVIgOQwNBBoEJCE0JRAcGiEyCgFDcwYEEQQGCgQPAQIXDjwbCxQkGRIDZwpEDSIrRot2KTEXVxEMJ2QmDRcnIh/aaIIoFBUJBgMLMR4ZAjMNJgcIHT0fFQkCDA8RBQEsEhwWBwkBAAL//v/gAVICtgAKADgAABMeARQiJicmNDYyFzIVFAcGIyImJzI3NjU0IyIHBhUUFxYyNjc2NzYzMgcOAyMiJyY1NDc2NzbAJUMWRicPDBRPTCI6YA8UBUc7MCFCOT05CyImDRoRBAsSAQMnITUbah0JHzFWLwKsIlEUMyYOFRXRWTM4XQoKUkI3KWdwdmQUBBEMGB0IBgs0HxlkIiRDT3g1HAAAAv/+/+ABVQK2AAoAOAAAAQ4BIjQ2NzYyFhQHMhUUBwYjIiYnMjc2NTQjIgcGFRQXFjI2NzY3NjMyBw4DIyInJjU0NzY3NgFOHkoTLh8NFRJPTCI6YA8UBUc7MCFCOT05CyImDRoRBAsSAQMnITUbah0JHzFWLwKNJEITSSMPCRO0WTM4XQoKUkI3KWdwdmQUBBEMGB0IBgs0HxlkIiRDT3g1HAAC//7/4AFkAqsACQA3AAAAMh8BIycHIzY3BzIVFAcGIyImJzI3NjU0IyIHBhUUFxYyNjc2NzYzMgcOAyMiJyY1NDc2NzYBFg4EPBwugh1gMAZMIjpgDxQFRzswIUI5PTkLIiYNGhEECxIBAychNRtqHQkfMVYvAqsIdk1NUCa+WTM4XQoKUkI3KWdwdmQUBBEMGB0IBgs0HxlkIiRDT3g1HAAD//7/4AGEAqQACgAVAEMAABMiNTQ2MzIVFAYHFyI1NDYzMhUUBg8BMhUUBwYjIiYnMjc2NTQjIgcGFRQXFjI2NzY3NjMyBw4DIyInJjU0NzY3NsUVGRgVGAyBFRoYFBgMW0wiOmAPFAVHOzAhQjk9OQsiJg0aEQQLEgEDJyE1G2odCR8xVi8CLygYNRcMLxIRKBg1FwwvEltZMzhdCgpSQjcpZ3B2ZBQEEQwYHQgGCzQfGWQiJENPeDUcAAIAGgABALUCtgAMABcAADc0NjMyFQ4CFRQjIhMeARQiJicmNDYyGj0vFwoeMQ8bMyVDF0YnDwwUVZToGRpW4VgOAqsjURMzJg4VFAACABoAAQEJArYADAAXAAA3NDYzMhUOAhUUIyITDgEiND4BMzIVFBo9LxcKHjEPG+geSBQuKwsdVZToGRpW4VgOAowkQhRJMRQJAAIAFAABAP0CqgAMABYAADc0NjMyFQ4CFRQjIhIyHwEjJwcjNjcaPS8XCh4xDxuSEgM8HS2CHWAwVZToGRpW4VgOAqkHdk1NUCYAAwAaAAEBFAKkAAwAFwAiAAA3NDYzMhUOAhUUIyITIjU0NjMyFRQGBxciNTQ2MzIVFAYHGj0vFwoeMQ8bOxUZGBUYDIEVGRgVGAxVlOgZGlbhWA4CLikYNBcMLxIRKBg1FwwvEgAAAQAG/+YB0wKTAD0AAAEWFRQOASInJjQ3Njc2MzIWFAcGBwY3NjQmIyIHBhUUFxYzMjc2NzY1NCcHBjU0NzY3JiMnMhc+AhUUBwYBgjUwjL8lERAhTCAkNT0OBQoPBQ8qJ0UrHgURTS8pSyALGTkMIwsNHjoIUDUJOB0oCwJCUIVSq4pdK18zaCUQR2IyEAIEDjRUPmBFRRwcYCpLqzwlcTseBwkMFAYJOB1ABSIQCxAWBwAAAgAM/7cBgQKLAA8AOQAAEhYyNzMOASImIgYHIzY3NgMSMzIVDgIVFDMyNjMyBw4BIyImNTQ3NiMiBw4CFCMiNTQ2MzIVBgfrNy0UHg04LzsbGAsfEC8ReIF6MwcWJR8MFgQODgUbDiYrKwQMCAowajwOID0rEi4UAosvJB0xNBQVLxYJ/hcBPzEXS8JJahMWBxhtV4qlDQgqwpkZT5XyFpWaAAAC//7/9wGoAusACwAxAAATHgEUIiYnJjQ3NjIDIjU0NzYzMhYXIgYVFDMyPgE9AS4BNDYzMhYXFjI3FAYiJw4CrCREFkklDwUHFCd7MD1UDBADP1xBJVA1HygZDRMkBx8vDhQqGwE4ZALiIlIUNSUNFQcN/Q2pX194DAzKYndxuF0MFDwcGUQrFQgOFgpgwoMAAAL//v/3AagC3QAKADAAAAEOASI0Njc2MhYUAyI1NDc2MzIWFyIGFRQzMj4BPQEuATQ2MzIWFxYyNxQGIicOAgE+HkoTLh8NFRLKezA9VAwQAz9cQSVQNR8oGQ0TJAcfLw4UKhsBOGQCtCRCE0kjDwkT/TepX194DAzKYndxuF0MFDwcGUQrFQgOFgpgwoMAAAL//v/3AagCxgAJAC8AAAAyHwEjJwcjNjcDIjU0NzYzMhYXIgYVFDMyPgE9AS4BNDYzMhYXFjI3FAYiJw4CAQ0SAzwdLYIdYDCLezA9VAwQAz9cQSVQNR8oGQ0TJAcfLw4UKhsBOGQCxgh1TExQJf05qV9feAwMymJ3cbhdDBQ8HBlEKxUIDhYKYMKDAAAC//7/9wGoAroAEAA2AAASNjIWMjY3Mw4BIiYiBgcjNhMiNTQ3NjMyFhciBhUUMzI+AT0BLgE0NjMyFhcWMjcUBiInDgKcIyY3IBcKHg04LzsbGAsgCAR7MD1UDBADP1xBJVA1HygZDRMkBx8vDhQqGwE4ZAKpES8REh0xNBQVGP10qV9feAwMymJ3cbhdDBQ8HBlEKxUIDhYKYMKDAAP//v/3AagC1QAKABQAOgAAEyI1NDYzMhUUBgcXIjU0NjMyFRQHAyI1NDc2MzIWFyIGFRQzMj4BPQEuATQ2MzIWFxYyNxQGIicOAqkVGhgUGAyCFRkYFCTKezA9VAwQAz9cQSVQNR8oGQ0TJAcfLw4UKhsBOGQCYCcYNhcMLxESKRc1Fxg0/YWpX194DAzKYndxuF0MFDwcGUQrFQgOFgpgwoMAAwA/AHUB0wH0AAkAFAAgAAA3IjU0NjMyFRQHNyI1NDYzMhUUBgcXBSInNjcWMyEyBwbpFRoYFCQLFRoYFBgMsP6iHQQBCwQRAWoKAQR1KBg2Fxg1+CcYNhcMLxJjCBQPAwYLDAAAAv///2UBSgKnACcALwAAFyY1NDc2PwE2MzIXFhUUAgc+ATU0Iz4CMzIVFAYHBgcGIyInJjQ2Eg4BFRQXNhN3dy88WRsBCAIDEVkMOUk5AQMTDkNqTAQRAgUCAgsNIT4SNgU8BwipXV14C7QMAQgjGf3/RxG5UXEDChF2Z98OGm8LAQYhaAG4iW0gdgolAYn//////5IBpgKsECYAWAAAEAYAQ+QAAAL///+SAaYCtgAKADQAAAEOASI0Njc2MhYUAzI2NzYyDgIjIicmNDcjBiMiNDc2MzIVDgEUMzI2Nz4BMzIVBgcGFRQBfh5KEy4fDRUSJgwVCQEWBQsjEigWFwsJeUFNMjcqEio8GBFDI0tPKhRAGwsCjSRCE0kjDwkT/RwVFgkSGisyMpNO0+t1gRZv0mdSO3+yFn+wRkNiAAAC////kgGmAqoACQAzAAAAMh8BIycHIzY3EzI2NzYyDgIjIicmNDcjBiMiNDc2MzIVDgEUMzI2Nz4BMzIVBgcGFRQBPhIDPB0tgh1gMCgMFQkBFgULIxIoFhcLCXlBTTI3KhIqPBgRQyNLTyoUQBsLAqoHdk1NUCb9EhUWCRIaKzIyk07T63WBFm/SZ1I7f7IWf7BGQ2IAAAP///+SAaYCpAAJABQAPgAAEyI1NDYzMhUUBxciNTQ2MzIVFAYHAzI2NzYyDgIjIicmNDcjBiMiNDc2MzIVDgEUMzI2Nz4BMzIVBgcGFRTfFRkYFCSCFRkYFRgMHAwVCQEWBQsjEigWFwsJeUFNMjcqEio8GBFDI0tPKhRAGwsCLykYNBcYNREoGDUXDC8S/XUVFgkSGisyMpNO0+t1gRZv0mdSO3+yFn+wRkNiAAL/rP6wAaUCtgAMAE0AAAEOASI1NDY3NjMyFRQBMjc2NwYHBicmNz4BNz4BNyMGIyI0Nj8BMhUOAhQzMjc2NzYzMhUOAgcWFxYUBiM2LgInAiMiJyY1NDYXFgF4HEoULh8NCh3+nFozLBi1YQYNBwMrmm4LFA0JgkRMZCkGEQsiOBgcPltDHSEVEzYiDEwMAhgJAgILHhhNvlIbARUFEgKNI0MIDEkiDxQJ/C9VS3AEhgkGBAZBWwQyhj/n6u0JARYbV8dvYY6SPRcjwMM3DTUJHxcHIxgaBv7eOgMCBgMIKQAB/9j+RgGiArcAKwAAATIWFAYVFDMUBiMiNTQSNCMiBgIHAiMmNBoBNz4BMzIHBgoBFDMyNzY3PgEBWCMnPRsUDkFEHC5WQR1GMRQjViIKKg4cBzljKgEYKSs6HlsB7ixN/zJKCA9mQAEBR7v+9YX+wAN+ASwB3owsLhe9/hP+5hzT2a9aeQAAA/+s/rABpQKkAAoAFABVAAATIjU0NjMyFRQGBxciNTQ2MzIVFAcAMzI3NjcGBwYnJjc+ATc+ATcjBiMiNDY/ATIVDgIUMzI3Njc2MzIVDgIHFhcWFAYjNi4CJwIjIicmNTQ2F9cVGhgUGAyCFRkYFSX+Z0JaMywYtWEGDQcDK5puCxQNCYJETGQpBhELIjgYHD5bQx0hFRM2IgxMDAIYCQICCx4YTb5SGwEVBQIvKBg1FwwvEhEoGDUXFzb8h1VLcASGCQYEBkFbBDKGP+fq7QkBFhtXx29hjpI9FyPAwzcNNQkfFwcjGBoG/t46AwIGAwgAAAIARP9oBHkDEQBbAGkAAAE0IzQ3NjMyFxYUBzY3JjQ2MzIWFQcmIyIHBhUUMzIWFyIHBhUUFxYzMjc2NTQnJiM2MzIXFhUUBwYHBiMiJjcGIyInJjQ3Njc2MzIWFRcmIyICBwYVFBcWMzISJRQjIjU0NjMyFhUGBwYCNFMHDRNCFgkRX4hQjmwTEgEIG1o/K30LDwStdW0yJz+OTDEvBwkNIzEPBR42bTxFcXMBXXeHMBcWLWZYZRweAQobbKcTBS0kOnmbAfwJGi4mCQ8uEwgB1LcHBgtnK3JKaR4djn8cDg0EQC0rVA0NhXyXVy8meE5XXREDF0EYGj1JfjMcfGF/iUCcW7VtXhkNDAT+7K0sJXI9LwFL8QUPZn0PCy5YJQAAAf/+/+ACUAHnAEEAAAEyFRQHBg8BIiYnMjc2NTQjIgYVFDMyNzY3NjIdAQ4DIyImJwYjIjU0NzYzMhYXIgYVFDMyNzY1NCM0NjMyFzYCA00jNFQSDxMFRzsvIUdxUzIsCgoDHAUkITUbP0YJP0d7NEFcDBADRWVAMy80KxUNNAVQAeVaMjhTCQEKClJBNyrda4E1DBEIBgIOLx8ZRjtqrWNkfAwM1Wh3Y2xpUQoTUHQAAAMABP9hAloDzwAIADkARwAAATMXNzMGBwYnARQXFjMyNjU0LgQ1NDYzMhYVByYjIgYVFB4EFRQGIyInJjY3NjIWFyIHBgEUIiY1NDYzMhYVBgcGAW8cQW8fYTAVCv6HTg8TfZIjND00I6VfExIBBxxAeCM0PDQjyJN8IRpcVyAyEwNeQzMB0BMQLiYKDi0UCAPPTExQJhER/H5KDwOhejBRNTYsPiNcmxwODQR4TyA9Ljk3Tyx5vFBCoBwKERJMOQHvBQgHZnwOCy1aJAAAAv/w/7sBqwM8AAkANgAAACIvATMXNzMGBwMUMzI2NTQmNDcOAQcGLgE0Nz4CMzIVFAcGFRQWFRQGIyI1NDY3NhYHBgcGARISBDwdQW8eYTDTLSpJJQINfDAEDgkBL31UKRURNjpiPlhdLwkFBjUnGwK+B3dNTVAn/V1GimkzujkJFe1FBAMJBAFE73YSDBQ9QCbZMVh7ZUymHQYaBB5iRQAAA//p/roCwQMFAAoAFABnAAABIjU0NjMyFRQGBxciNTQ2MzIVFAcBMj4HNyMCIyI1NBI1NCYjIgcGFRQXFjMGIyInJjU0NzYzMhYUAhQzMjc2NzYzMhUGBwYHDgMjIicmNTQ3Njc2MzIfASIHBhUUFxYB4RUaGBQYDIIVGRgVJf5hRW1AOhUVAgIEBgeMVmRkLzNbLR4HFkcHDFobCSc6cVdPXSchPGJIHCMWIyMpLBNAS2s/mT4dCRdAGxUhBgJFJxl4IAKDKBg1FwwvEhEoGDUXFzb8PUhUsF5uCAsWHv7weDYBXU8zP2hGRiIiaA5yJCRNTnJhm/6tc1+XskYXVcjqZSxlOyhoMjkfIVQfDRMHSC8nlSUKAAP/6/8mAvQDzwAJAGAAaQAAACIvATMXNzMGBwYWMjYzMhYGFSIHDgEHNjMyBiIOAQcGBx4CMjY3NjcyFRQGIi4CJwYjIicmNDYyFzY3BiInNjcWMjc+ATc2NwYiJiMiBwYUFxYfAQYjIicmNDc2NzYBFBYyNyYiBwYCJRIEPB1Bbx5hMJewNTwXCQsCICsgWxM0EgoDGxUhCn95H8tyPiQKFAcQSmB4TZkWPTpUGAcmYWNbeDBJBAELBUY3DzwRLCYWM7Itci8YBxIvEAUcOxoMEihnL/7bMkwsVksIAQNSB3ZMTFAmVC8wFBEBTTjBJwIYAgIB+1oOZCsLCBATGSozLCpeDSAsDB0jKk3sBhgPAwYDHXkhWTYFMF4vTRxECwIXRCJQMGgkEf0EEhUaKhUEAAL/p/6wAZYCrAAJAEcAABIiLwEzFzczBgcBIjU0Njc2FhQHBgcGFBcyNzY3NjU0IyIGIyIvATI3Njc2NTQnIg4CFAYmND4CMhYVFAc2MzIVFAcGBwb8EQQ8HEFwHmEw/vBOh2YFCgZnRi8jU2JTHQosImIOFwYCSkxADgInKE0xHhMTJj1dWzKEDAdeOEVkOAIuB3dNTVEm/HtLQrMnAgkLAyZmRloBcmBgIRYvLSIMZlhTDwwwAT1PQA4FChdHU0A8MIF0AmhLYHU0HAAAAv8y/qwCCgMkADwATAAAEyInNDcWMjc2NzYzMgcGIyIHBgc2MzIGIgcOBAcGIyImJyY0PgEzMhYXIgcGFRQXFhcyPgQ3BiUiJzQ2MzIVDgMHBhUUjxwFDAQiKC5aJC4UAQEGSSgjGHUZCQMwagwdGBorGj1bPUwHAhJILw0RA0kqGQYYSjNNLCQTGgwmASUMASsgDAcMDQ4GDQGxGRQDBgLeNxYPCk1EfQkYFEn1j2trIk1ALhAuSUALDEMoKBMSQQJFZ6SOyT8EthQ/ag8LEhgeDyEfDAAAAQCVAi0BfgKqAAkAAAAyHwEjJwcjNjcBLRIDPB0tgh1gMAKqB3ZNTVAmAAABAIgCMgGVAosADwAAABYyNzMOASImIgYHIzY3NgD/Ny0UHg04LzsbGAwfEC8SAosvJB0xNBQVLxYJAAABAEEA9wHaARwACQAAJQUiNTQ3BTIHBgG1/pcKLAFjCgEG+QIJGAQICREAAAEAQQD3AmkBHAALAAAlBSI1NDcFMhUUBwYCQ/4JCiwB8gkBBPkCCRgECAcBAhEAAAH//wI4AFoCywAMAAATIjU0NzYzMhcVIgYUHBwlEhQNAhEUAjgkNiYTCQNDRAABAIcCOADiAssACgAAEjY0MhUUBwYjIieYFDYmEhQNAgJDREQkNiYTCwABABz/3QB3AHAACwAAFjY0MhUUBwYjIic1LRQ2JhINFAIXQ0QkNyYSCQMAAAL//wI4ANoCywAMABkAABMiNTQ3NjMyFxUiBhQzIjU0NzY3MhcVIgYUHBwlEhQNAhEUZxwlEw0TAhETAjgkNiYTCQNDRCQ2JhIBCQNDRAAAAgBgAjgBOwLLAAoAFwAAEjY0MhUUBwYjIi8BMhUUBwYHIic1MjY08RQ2JhIUDQJCHCUTDRMCERQCQ0REJDYmEwuIJDYmEgEIA0REAAIAHP/dAOIAcAALABcAABY2NDIVFAcGIyInNTI2NDIVFAcGIyIvAS0UNiYSDRQCfBQ2JhIUDQEBF0NEJDcmEgkDQ0QkNiYTCQMAAQA//5MBrgLIAB8AABMXNjc2MzIHDgEHMzIVFCMiBwIHBiI1NDYTBiInJjcWYIA8CAoVEgIBFSyVCBU3WoUYBhUgZ2IzAwENBAG6AdgZHioWR4gIEAP+XlcSDhdpAXsCFhABBwAAAQAf/5MBrgLIADEAABMXNjc2MzIHDgEHMzIVFCMiDwEGBzMyBiIHAgcGIjU0NjcGIic2NxYzFzY3BiInJjcWYIA8CAoVEgIBFSyVCBU3WhIMBqIJAzKAYA8GFSk4XDIEAQsEEXkPD2IzAwENBAG6AdgZHioWR4gIEAM5JhQYBP7OOBIOF4bQAhQPAwYBMj8CFhABBwAAAQBUAToA1gG8AAcAABIWFAYiJjQ2sCYmNiYmAbwlNicnNiUAAwAw//kCOQBuAAoAFQAfAAAXIjU0NjMyFRQGBxciNTQ2MzIVFAYHFyI1NDYzMhUUB0UVGhgUGAzVFRkYFRgM1BUZGBUlBycYNhcMLxIRKRc1FwwvEhEoFzYXFzYAAAQAKP+lA0QCUgAOAC4AUwB3AAAXIjQ2Ejc2MhYOAQcCBwYTNCMiBwYmNzYzMhUUBwYjIicmND4BNzYWBw4BFRQyNgU0IyIHBicmNzYzMhcWFRQHBiMiJyY0PgE3NhYXFAcOARUUMjYlNCMiBicmNzYzMhcWFRQHBg8BIicmNDc2NzYXFAcOARUUMjaOCir6AgsXCAgYQ68nB0ssHBUODgIgNUsdK0MmFhgQLh0HAwQcHFY3ASUsHBUNDAMCHzU7DQQdK0MmFhgQLh0GAgEDHBxWNwEWLBojDAQDHzU7DQMcJjkPPxEGERswCAEDHBxXNlsbVgIlBBMUJjCE/qVWDgIDWhgNBgQvbTk+XxkbS0M7CAERAgpcI1aEu1oXDQQBBDBHExQ4Pl8YHEtDOggCCQMFAwldI1aEPVokBAEEMEcTFDg+UgwBPBY9KEANAgsHAgldI1aEAAEAIwA9ARABrQAIAAA3JjU0PwEVBxfOqwnks3E9xA4HBpEgiaUAAQBEAD0BMQGtAAgAABMWFRQPATU3J4aqCOSzcQGtxQ0HBpEgiaQAAAEAA///Ag0CjgBCAAAlIgcGFBcWMzI3NhYHBiMiJjU0NwYjIic2NxY7ATY3BiMiJyY3FjsBPgEzMhYUBwYnNC4BIyIGBzMyBiMiBwYHMzIGAXkBuwIQFTJRPgsgB1FjVEsBIS4dBAELBRBRBxMlMx4DAQ0EEWQoi1U2NBUSAwklHzheH7gKBRIikg4LxwkD8wUXVCw7ZREICoF+WAsMARQPAwY5PQEWEAEGaIU+OggDERMjInZdGQQ1RBgAAgCqAfACHwL5ADMAXwAAAQ4BFDMyNzYyFQYjIjQ3NiYHBgcGIyI1NjU0IyIOASMiNjU2NCM3MhUUBzYzMhUUBzYzMgU2Mh0BIgcGFBYzMjY3NjcjIgcGFxYzFCMiNDYyPwEyFAcGBwYHDgEjIjU0AhwRGBALBgIJDBYeJgEDAyshEQoFIAUNMB8PBgIgDgYZASsZFQcvHg3+lg0lHgwFEwgVHQYPEgFCDAYNAgILEDpDFhYHAQwtDw8GKCAqAtQrcDwLAgIYaHYCAwQqWC8FaCoOV2IIBF9NCjELDk8fCiFZjxsIAiINGQ4zIVsZJhYHAQg4Hg4NBwMUBwhpJj4xEQAAAQAAANsAkwAFAEAAAgACAAAAAQABAAAAQAAAAAIAAQAAAAAAAAAAAAAAJgBMALkBLgGUAgkCIAJIAmsCtwLnAv0DFwMqA0YDeAOgA+MEKwSABNYFHgVIBZQF4wYEBicGTAZ2BpoG2QdZB+AIVwihCP8JYgnqCnYK+AtBC5wL9QxZDM4NJA1kDbIOKg6NDuQPNw+KD8cQPRCUEQQRjxGuEcoR6RH6EhASJhJzEr4S+RNHE4oT7RRdFJwUvxT+FUcVcRXGFgAWNxaSFtoXCRdKF4gXxBf3GEMYkBjvGUYZehmSGccZ5xoOGnEa5xtHG8sb7xxRHHIc2x0fHUEdWh1yHdQd8h4tHmkepR68HwAfih+dH9Ef9SAnIEsg0CFEIeIiIyK7I1Mj6iSNJS4lzSaYJxQnhyf7KG0o7ClEKZwp8ypVKsgrOCuIK9csJiyBLNstEC1rLc0uMS6TLwAvgi/pMEgwpjEEMWAxxjIwMpYy+zNnM7k0CzRcNLo04DUFNSo1XTW3Ngk2UjaaNuE3MDeCN7U3/TgIOFU4oTj4OWk5rTonOrg7ETt4O8k8VTzuPVU9wT3XPfU+Cz4jPjo+Tz5lPo0+sz7YPws/Vj9oP5dAQkBVQGlAx0FIAAEAAAABAIN0L71JXw889QALBOIAAAAAy1WPOgAAAADLVY86/pH+RgXLA/YAAAAIAAIAAAAAAAAAuwAAAAAAAAGgAAABCwAAAOwAPAElAHkDBwArAd//8gLRADcC0f/jAQkArgEUABEBKf/9AboAdwJyAD8AzAAcAkIAPwDqADkBsf/2Aev//wGLAAEB6//YAdT/qwIj/9gBwv+rAdMAAAF9AB0B0f/jAd3/nQD6ADkA8AAcAhUACQKOAD8BzwAbAewAaANFAE8EIQAAAvr//gJdADwC7gAHAnj//QKo//4C8//rA4YAAQJLAAYC3AADApQAAAJI/8UDyAAAArUAAAKsAEQCi//+Aqr/8QLc//4CWwAEAk8AAQL/ACMCdP//A6QAEAKJ//YC6//qApz/7AEFAAQB1wBSAUUAEgHKAAICZQAFAakAvQHeAAEB9QAbAYQACQHnAAABhf//ATb/pAHO/7QByAAbANoAGgD7/6MByAAbAQcAIgKZAAwBwAAMAZ3//wHk/38B4AABAX8AEQF7//EBIQAUAdsAAAGF//8CdQAAAZH/7AHR/60Bof+oATwAJAFsAH8BQf/mAdsARQE4AAMBxAAAAtf/2AI1ADoCSQAAAaEAfwIq/+sBwgCLA0oAcAHJAFACYgAjAy8APgHvAFUBwQBWAWIAXQJHAD8BFwAuASIAHAG9AQMB2/+yAroABgEuAGYA/gACAPQAKAE3ACMCQgAyA9wANgOeADYECAABAewAAgQhAAAEIQAABCEAAAQhAAAEIQAABCEAAAWzAAACXQA7Anj//QJ4//0CeP/9Anj//QJLAAYCSwAGAksABgJLAAYC7gAHArUAAAKsAEQCrABEAqwARAKsAEQCrABEAksAMQKsAEQC/wAjAv8AIwL/ACMC/wAjAuv/6gH3/9gBkv6SAd4AAQHeAAEB3gABAd4AAQHeAAEB3gABAogAAQGEAAEBhf//AYX//wGF//8Bhf//ANoAGgDaABoA2gAUANoAGgIQAAYBwAAMAZ3//wGd//8Bnf//AZ3//wGd//8CMAA/AY8AAAHbAAAB2wAAAdsAAAHbAAAB0f+tAeH/2QHR/60EYQBEAoP//wJbAAQBe//xAuv/6gKc/+wBof+oAgr/MwHJAJUB0wCIAjIAQQLuAEEAjQAAAOIAhwDMABwBIwAAAUAAYAE+ABwB2QA/AQsAHwFPAFQCpAAwA/UAKAFvACMBnQBEAlMAAwJjAKoAAQAAA/b+RgAABbP+kf8uBcsAAQAAAAAAAAAAAAAAAAAAANsAAgF7AZAABQAAA2sDLAAAAK8DawMsAAACVAA+ATgAAAIAAAAAAAAAAAAAAAAjAAAAAAAAAAAAAAAAUFlSUwBAACAhIgP1/kYAAAP2AboAAAABAAAAAAFYARIAAAAgAAEAAAACAAAAAwAAABQAAwABAAAAFAAEALAAAAAoACAABAAIAH4ArgD/AVMBYQF4AX4BkgLGAtwgFCAaIB4gIiAmIDAgOiCsISL//wAAACAAoQCwAVIBYAF4AX0BkgLGAtwgEyAYIBwgICAmIDAgOSCsISL////j/8H/wP9u/2L/TP9I/zX+Av3t4LfgtOCz4LLgr+Cm4J7gLd+4AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuAH/hbAEjQAAAAAOAK4AAwABBAkAAADYAAAAAwABBAkAAQAeANgAAwABBAkAAgAOAPYAAwABBAkAAwBUAQQAAwABBAkABAAeANgAAwABBAkABQAaAVgAAwABBAkABgAsAXIAAwABBAkABwBwAZ4AAwABBAkACAAqAg4AAwABBAkACQAqAg4AAwABBAkACwAkAjgAAwABBAkADAAkAjgAAwABBAkADQEgAlwAAwABBAkADgA0A3wAQwBvAHAAeQByAGkAZwBoAHQAIAAoAGMAKQAgADIAMAAxADIAIABTAGEAYgByAGkAbgBhACAATQBhAHIAaQBlAGwAYQAgAEwAbwBwAGUAegAgACgAdAB5AHAAZQBzAGUAbgBzAGUAcwBAAGwAaQB2AGUALgBjAG8AbQAuAGEAcgApACwAIAB3AGkAdABoACAAUgBlAHMAZQByAHYAZQBkACAARgBvAG4AdAAgAE4AYQBtAGUAIAAiAEUAdQBwAGgAbwByAGkAYQAgAFMAYwByAGkAcAB0ACIARQB1AHAAaABvAHIAaQBhACAAUwBjAHIAaQBwAHQAUgBlAGcAdQBsAGEAcgBTAGEAYgByAGkAbgBhAE0AYQByAGkAZQBsAGEATABvAHAAZQB6ADoAIABFAHUAcABoAG8AcgBpAGEAIABTAGMAcgBpAHAAdAA6ACAAMgAwADEAMgBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAyAEUAdQBwAGgAbwByAGkAYQBTAGMAcgBpAHAAdAAtAFIAZQBnAHUAbABhAHIARQB1AHAAaABvAHIAaQBhACAAUwBjAHIAaQBwAHQAIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABTAGEAYgByAGkAbgBhACAATQBhAHIAaQBlAGwAYQAgAEwAbwBwAGUAegAuAFMAYQBiAHIAaQBuAGEAIABNAGEAcgBpAGUAbABhACAATABvAHAAZQB6AHcAdwB3AC4AdAB5AHAAZQBzAGUAbgBzAGUAcwAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/ogA+AAAAAAAAAAAAAAAAAAAAAAAAAAAA2wAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQBAgCKAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugCwALEA5ADlALsA5gDnAKYA2ADZALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/AQMAjAd1bmkwMEFEBEV1cm8AAAAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAwDaAAEAAA==","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
