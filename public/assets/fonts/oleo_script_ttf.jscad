(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.oleo_script_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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/+IAOwAUAD0AFABW//QAXf/2AAIAIv/sADf/7AAGABAADwAtAA8ALwAKAEkAFABWABAAXQAMAAMAVgANAFsACgBdAA0ABAAkAA8ALQAPAFYACgBdAAoAEAANAC0AEf/sACIAUAA3AEEAOQAZADoALQA7ACgAPQAjAFAAHABRABwAUv/xAFcAAwBZAAoAWgAMAFsABQBc//YAAQBbAAoABQA7ACgAPP/sAD0AFABbAB4AXf/7AAQAIgAUADsAKAA9ABkAWwAjAAUAJAAoADsAFAA9ABQAWwAFAF0ABQADAA3/4AAkABkAXQAKABAAEABGAB0ADwAeAA8ARAAKAEYACgBN//sAUP/uAFH/8QBSAAoAVf/yAFb/+wBY//YAWQAFAFv/9gBdABQAXgAeABIAD//ZABAADwAR/+EAJgAUACoAGQAyABQANAAUADv/7ABJ//oATQAKAFMAFABWAA8AVwAUAFkADwBaABQAWwAZAFz/+ABdAA8AAgBJ//kAVf/7AA8AJAAeADsAFABJACAATAAKAE0AEwBRAAoAUgADAFMAGQBVAAoAVwARAFgACABZAB4AWgAjAFsAGgBdAA8ABgAkACgAN//YADsAHgA9AB4AWwAFAF3/8QABADf/2AABAEkADwAGAAQAGQAPABkAN//sAEkAFABLAA8AWwArAAYAJAAeADsAHgA9ABkAVgAPAFsAGQBdABkAAQBNADIAAgAVABQAFwAUAAQAFQAeABYAFAAXACgAGAAUAAAAAQAAAAoAFgAYAAFsYXRuAAgAAAAAAAAAAAAA","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
