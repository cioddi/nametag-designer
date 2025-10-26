(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rufina_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

var font = Buffer("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ACwAIABNAGEAcgB0AGkAbgAgAFMAbwBtAG0AYQByAHUAZwBhACAAKABtAGEAcgB0AGkAbgBAAGUAcwB0AHUAZABpAG8AdAByAGEAbQBhAC4AYwBvAG0AKQAsACAAdwBpAHQAaAAgAFIAZQBzAGUAcgB2AGUAZAAgAEYAbwBuAHQAIABOAGEAbQBlACAAJwBSAHUAZgBpAG4AYQAnAFIAdQBmAGkAbgBhAFIAZQBnAHUAbABhAHIATQBhAHIAdABpAG4AUwBvAG0AbQBhAHIAdQBnAGEAOgAgAFIAdQBmAGkAbgBhADoAIAAyADAAMQAyAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADEAUgB1AGYAaQBuAGEALQBSAGUAZwB1AGwAYQByAFIAdQBmAGkAbgBhACAAaQBzACAAYQAgAHQAcgBhAGQAZQBtAGEAcgBrACAAbwBmACAATQBhAHIAdABpAG4AIABTAG8AbQBtAGEAcgB1AGcAYQAuAE0AYQByAHQAaQBuACAAUwBvAG0AbQBhAHIAdQBnAGEAdwB3AHcALgBlAHMAdAB1AGQAaQBvAHQAcgBhAG0AYQAuAGMAbwBtAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAAAAAIAAAAAAAD/tQAyAAAAAAAAAAAAAAAAAAAAAAAAAAAA5gAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAowCEAIUAvQCWAOgAhgCOAIsAnQCpAKQAigDaAIMAkwDyAPMAjQCXAIgAwwDeAPEAngCqAPUA9AD2AKIArQDJAMcArgBiAGMAkABkAMsAZQDIAMoAzwDMAM0AzgDpAGYA0wDQANEArwBnAPAAkQDWANQA1QBoAOsA7QCJAGoAaQBrAG0AbABuAKAAbwBxAHAAcgBzAHUAdAB2AHcA6gB4AHoAeQB7AH0AfAC4AKEAfwB+AIAAgQDsAO4AugDXALAAsQDkAOUAuwDmAOcApgDYAOEA2wDcAN0A4ADZAN8AsgCzALYAtwDEALQAtQDFAIIAwgCHAKsAxgC+AL8AvAECAIwA7wDAAMEERXVybwAAAQAB//8ADwABAAAADAAAAAAAAAACAAEAAQDlAAEAAAABAAAACgAeACwAAURGTFQACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAgAKDd4AAQC2AAQAAABWAWYBhAGKAbAB7gH4AiICMAI+AlQCWgKIArIC3AMGAzgDhgO4A8YD8AP+BCgELgQ4BEIESARSBIwEtgTYBQ4FLAVyBZAFmgXIBhYGdAaOBwQHdgeQB9IIQAheCHgIlgicCR4JQAlWCXQJmgm0CeYKFApSCnwKngrACwILRAtqC5gLsgv0C/4MHAwqDEAMWgxgDGYMbAx6DKwM6gzwDQoNEA1aDWgNaA1yDZgNvgABAFYAAwAGAAkACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeACAAIwAkACUAKQAqAC0ALgAvADAAMQAzADUANwA4ADkAOgA7ADwAPgA/AEQARgBHAEkASgBMAE0ATgBPAFIAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYgBuAHAAdwB/AI4AjwCYAJ4AnwCnAK0ArwCwANQA1QDYAOAA4gDjAAcAN//lADn/3AA6/90AWf/mAFr/5gCG/9QA1P/wAAEAF//yAAkAKv/rADf/4gA5/8cAOv/JAFn/4ABa/+AAWwAFAIYAMQDU/7kADwAL//IAE//lABT/8AAV/+0AF//sABn/7AAa//YAG//uABz/8AAq/+kALQBxAE0AhgBX//QAWf/uAFr/7gACAAz/8gBA/+kACgA5ABsAOgAhADsAGABNAA8AUwAJAFcABQBZAA0AWgANAIb/ugCuAAsAAwAW/+sAF//vABr/6QADAC0AFABNABwAhgAPAAUAFP/zABb/7QAX/+IAGP/yABr/5gABAC3/8AALABL/rAAT/+8AFf/2ABb/7QAX/9oAGP/qABz/8AA5AA4AOgAKAEr/8ACG/+wACgAM/+UALf/2ADf/5AA5/90AOv/fADz/0QA///AAQP/ZAGD/7gBw/+oACgAM//AAEP/zADn/8QA6//EAPP/pAED/3wBg//UAd//0AIYAEwDj//QACgAM/+0AN//rADn/3gA6/98APP/ZAD//8ABA/90AYP/zAHD/7gCGABUADAAM//AALQA6ADf/7AA4//QAOf/dADr/3gA8/9sAP//vAED/4ABg//MAcP/nAIYAFwATAAz/7gAO/+8AEP/gABr/7QAkAAwALQAPADf/5gA4/+4AOf/NADr/zwA8/9UAP//jAED/4QBg//QAY//2AHD/3QB3/90AhgAoAOP/4QAMAAz/8gAO//QAEP/oAC0ANAA5/+0AOv/uADz/6QBA/+IAYP/2AHf/9ACGABMA4//qAAMADP/zAED/4wBg//UACgAM//MADv/0ABD/9QAX/9wAJP/qADz/9gBA/+MAhv/sAOD/4gDj//YAAwAM/+8AQP/hAGD/9AAKAAz/6wAtAB4AN//nADn/2wA6/9wAPP/VAD//7gBA/94AYP/yAHD/4gABAC3/+AACAC0ABABNAAsAAgAW//UAGv/yAAEAJP/2AAIAFwAbACP/9gAOAAz/7AAt//sAMP/7ADf/+wA5//IAOv/yADv/6QBA/90ASv/6AFn/+QBa//kAW//2AGD/8ACG//cACgAD/+wAEv/2ABb/9QAX/+cAGP/zAED/5ABK//UAYP/0AIb/zwCuAAYACAAD//UADP/yADn/+gA6//oAQP/jAFn/+wBa//sAYP/1AA0AE//2ACr/9wBA/+oASv/qAE//+ABT//UAV//4AFn/8gBa//IAYP/1AK3/9QCvAAgAwP/1AAcAFwAOACr/xABK//YAV//4AFn/rwBa/68AmP/YABEAA//lAAz/8wAN/7gAGv/pACr/+wAt//kAN//CADn/ugA6/7wAP//pAED/5ABK//sAWf+zAFr/tQB3/7gAhgAaAOL/vwAHACr/9wBA/+YASv/xAFP/+gBX//gAWf/uAFr/7gACABb/9gAY//UACwAD/+YACf/2AAz/9AAS/+0AF//ZADD/+gBA/+IASv/2AGD/9QCG/5sArgALABMAA//xAAz/9gAN//UAFwANACP/9gAq//UALf/5ADf/9AA5/+kAOv/oAD//9gBA/+QASv/4AFf/+wBZ//AAWv/wAGD/9gBu//YA4v/1ABcAA//lABL/7QAT/+QAFf/xABb/6gAX/9wAGP/tABz/5wAq//cAOQAMADoACABA/+cASv+4AFP/5ABZ/+cAWv/oAFv/8wBg//UAhv+9AK3/8QCuABgArwAOAMD/5AAGABb/7AAX/+oAGP/rABz/9QCt//cAwP/2AB0AA//dAAn/8AANAB4AEv/mABP/3QAU//AAFf/kABb/2wAX/8QAGP/YABz/3QAj//EAKv/nAED/8gBK/8AAU//mAFn/7QBa/+0AW//qAGD/9gBu//MAhv+qAKP/0wCk/9AArAAPAK3/8wCuAAYArwAqAMD/5AAcAAP/3QAJ//IADQAgABL/5wAT/94AFP/yABX/5QAW/90AF//GABj/2QAc/98AI//yACr/6gBA//MASv/DAFP/6QBZ//AAWv/wAFv/6gBu//QAhv+tAKP/1QCk/9IArAASAK3/9QCuAAgArwAsAMD/5QAGABcADQAq/9wASv/uAFn/ygBa/8oArwAHABAAE//SABT/6AAV/90AFv/aABf/1wAY/9oAGf/zABr/7QAc/9cAI//qAKP/ywCk/8gArAAJAK3/5gCvACQAwP/XABsAC//pABP/2QAU/98AFf/dABb/4wAX/90AGP/jABn/3wAa/+sAG//gABz/4QAq/90ALQB9ADD/5gA3/+cAOf/2ADr/9ABK//YATQCZAE8ADABX/+IAWf/eAFr/3gBb/+4Ahv/uAI7//ACP//gABwA3/+4AOf/pADr/6ABZ//QAWv/1AIYAHwDU/+YABgAt//MAN/+/ADj/8AA5/8EAOv/FADz/tQAHAC3/8QA3/80AOP/zADn/zgA6/9IAO//1ADz/qwABADj/+QAgAAQAGgAMADwADQA8ACIAKQAtAFsAMABGADEAVAA2AAkANwBkADgAXwA5AJMAOgCOADsAfgA8AJoAPQBEAD8ATwBAAE0ASv/5AEwAHABNACgAXwAiAGAAPQCjAAYApAAMAKwAYQCtAAEArgBAAK8AcgDAAAEA0wAUANYAHQDiAEsACAAt//cAOP/6ADn/+AA6//gAPP/2AFn/+QBa//oAhgAfAAUAJv/7ACr/+wAt//gAN//4ADj/9wAHAC3/+AAw//oAMf/7ADf/+wA4//kAPf/6AED/9AAJACb/6QAq/+kAN//rADj/8gA5/+IAOv/kADz/1gBA//AASv/0AAYAJv/7ACr/+wAt//gAOP/2ADn/5AB3/8cADAAt/+wAMP/tADH/7AA2//sAN/+5ADj/6gA5/8EAOv/FADv/2gA8/6wAPf/oAIb/+gALAC3/9gAw//cAMf/1ADf/0AA4//QAOf/OADr/0gA8/8UAPf/4AEAACgDi//cADwAD/+kADP/tAC3/7gAw/+0AMf/vADf/6AA4//QAOf/kADr/5QA7/9UAPP/PAD3/+wBA/94AYP/1AIb/vAAKAC3/6gAw//oAMf/2ADf/xgA4/+0AOf/DADr/yAA7/+0APP+1AD3/+QAIAAz/8gAt//oAN//lADj/+QA5/+cAOv/nADz/1wBA/+MACAAm//kAKv/5AC3/7wA3/9EAOP/uADn/xAA6/8gAPP+8ABAAA//mAAz/7gAS//UALf/yADD/7AAx//AAN//pADj/9wA5/+8AOv/vADv/1gA8/9gAQP/eAEr/9ABg//QAhv++ABAAA//lAAz/7gAS//UALf/yADD/7QAx//EAN//oADj/9wA5/+8AOv/vADv/1wA8/9cAQP/eAEr/+gBg//UAhv/BAAkAJv/uACr/7gA3//AAOP/3ADn/5wA6/+oAPP/cAED/7gBK//QACwAt//IAMP/sADH/8AA3/+YAOP/3ADn/7gA6/+4AO//WADz/2QA9//sAhv+9AAYALf/uADf/2QA4//AAOf/bADr/3QA8/8EAEAAT/+4AFP/1ABX/8wAW//AAF//0ABj/8AAZ//QAG//0ABz/8QAq//AALQBpADf/9ABNAIYATwALAFn/9ABa//QAAgAtAFsATQBqAAcALQBjADf/2AA5/90AOv/fAE0AdgBZ//YAWv/2AAMAOf/zADr/8gCG//UABQAT/+oAFv/mABf/vAAY/+sAHP/lAAYAFP/0ABf/zwAY/+8AG//yAC//6gBP/8cAAQCGAAwAAQBA//4AAQBA//oAAwA8//UAnf/1AMX/9QAMAAz/6wAX//UALf/3ADD/9AA3//YAOf/rADr/6wA7/7oAQP/gAFv/+QBg//YAhv/bAA8AA//tACb/+wAq//sALf/vADH/+gA3/78AOP/wADn/6wA6/+cAO//4ADz/8gBA//AAWf/fAFr/4ABb//EAAQBNAE4ABgBA//UARQAaAEsAEwBOABMATwASAL4AGgABAA0ACQASAAz/7AAk/+0ALf/wADD/8QAx//AANv/6ADf/5AA4/+0AOf/hADr/4gA7/+cAPP/cAD3/7gBA/+QAW//wAGD/8gCG//UA4v/zAAMAA//oAAn/8AAS/+IAAgAtABMATQAbAAkAE//gABT/9AAV/+kAFv/fABf/vgAY/9oAGf/1ABz/4QDg/7gACQA5AA8AOgALAE0ADgBTAA4AWQAMAFoADABbAAYAhv+5AK8AEAAFABT/9AAW/+0AF//jABj/8wAa/+cAAiP+AAQAACSGJk4ASQA/AAD/3f/m/9v/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9cAAP/zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/R/87/ff/o/+r/2P/S/7r/vf/S/9j/ff+A/+3/7QAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9oAAP/3AAD/4QAA/+H/4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1/+3/5P/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8gAA//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5P/q/70AAP/zAAD/vv/r/9L/1P/sAAAAAAAAAAAAAP/uAAD/9f/4//f/9v/0//f/8P/t/+3/7f/T/+D/5P/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/5gAAABUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAAAAAAAAAA/+3/7//yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/zwAGABcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+3/9wAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/u/83/8AAAAAD/zv/v/9z/3//vAAAAAP/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHf/g/9v/t//r/+oAAAAAAAAAAAAAAAAAAAAA/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/yQAAAAwAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAP+3/3wAAAAAAAAAAAAA//cAAAAAAAAAAAAAAAAAAAAA/+L/7P/3AAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAAAABoAAAAAAAAAAAAAABMAEQAAAAAAAAAA//f/9/+0/3AAAAAAAAAAAAAA/+wAAAAAAAAAAAAAAAAAAAAA/9b/4P/sAAD/5P/z/+oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/yAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+3/30AAAAAAAAAAAAA//YAAAAAAAAAAAAAAAAAAAAA/+H/6//2AAD/7gAA//D/7v/u//H/w//u/+3/5P/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0QAIACMAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAA//D/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9MAAAAAAAD/0gAA/9//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/v/+oAAP/y//UAAAAAAAAAAAAAAAAAAP/3//UAAAAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAA//X/8QAA//sAAP/4AAAAAAAAAAAAAAAAAAAAAAAA//oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/O/83/yP/o/+7/yf/P/8T/xv/QAAD/yv/K/+//7wAAAAAAAAAAAAAAAAAAAAD/+wAAAAAAAAAAAAAAAAAA//T/8QAA//n/+f/kAAD/3AAAAAAAAAAAAAAACwAAAAD/+//q/+n/9v/G/9EAAAAAAAAAAAAAAAAAAAAAAAD/xQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/7IAAAAAAAAAAAAA//YAAAAAAAAAAAAAAAAAAAAA/+n/7P/3AAAAAP/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9f/5//AAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAP/7AAD/+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+P/yAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAA//cAAAAA//AAAAAA//j/9P/s/+oAAAAAAAAAAAAAAAAAAAAA/+3/7P/r//QAAP/wAAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAAAAAAAAAD/+P/4//YAAAAAAAAAAAAAAAD/4P/1AAAAAAAA//kAAP/2AAAAAP/2AAAAAAAA//j/+P/m/+YAAAAA//j/9P/u/+cAAAAAAAAAAAAA//gAAAAA/+n/6P/m//f/6P/xAAAAAAAAAAAAAAAAAAD/9AAA//n/+v/lAAAAAAAAAAD/9v/2//b/9v/3//EAAAAAAAD/6wAA/+oAAP/6AAD/+gAA/+//7gAAAAAAAAAAAAAAAP/q/+oAAAAAAAAAAAAAAAD/+P/3//b/9//h//L/+QAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAP/dAAAAAAAAAAD/+wAAAAD/+wAA//L/6gAAAAAAAP/wAAAAAAAA//cAAP/wAAAAAP/wAAAAAAAA//f/9wAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAA/+//7AAA//j/7//tAAAAAAAAAAAAAAAAAAAAAAAAAAD/+v/nAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAP/uAAAAAAAA//cAAAAAAAAAAAAAAAAAAAAA//cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//H/7gAA//gAAP/uAAAAAAAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+y/7T/u//0//oAAAAAAAAAAAAAAAD/tv+6//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/RAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/2wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8sAAAAAAAAAAP/7//EAAAAAAAAAAAAAAAAAAAAA//X/9v/yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/yf/oABQAAAAA//oAAAAAAAAAAAAAAAAAAAAA//cAAAAA/9j/+wAAAAD/4//a/70AAAAAAAAAAAAAAAAAAAAA/7r/uf+9/+QAAP++/84AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/h/9IAAAAAAAAAAAAAAAD/+//1AAAAAAAA//oAAP/1AAAAAP/1AAAAAAAA//r/+gAA//QAAAAA//n/+P/w/+0AAAAAAAAAAAAAAAAAAAAA//D/7//u//f/7v/0AAAAAAAAAAAAAAAAAAAAAAAA//j/+P/lAAAAAAAAAAD/9gAAAAD/9v/4//MAAAAAAAD/wv/tAAAAAAAA/+0AAAAAAAAAAAAAAAAAAAAA/+cAAAAA/7oAAAAA//r/5P/d/7gAAAAAAAAAAAAAAAAAAP/z/8L/wf+4/+UAAP/S/90AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/h/98AAAAAAAAAAAAAAAD/6QAA/+oAAP/6AAD/+wAA/+//7wAAAAAAAAAAAAAAAP/m/+sAAAAAAAAAAAAAAAD/+P/3//b/9//d//b/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7wAAAAAAAAAAAAAAAP/dAAAAAAAAAAD/+gAAAAD/+gAA//H/6gAAAAD/w//XAAAAAAAA/98AAP/XAAAAAP/YAAAAAAAA/9f/1/+x/9MAAAAA//P/0f/D/68AAAAAAAAAAAAA/+AAAP/0/63/rf+u/9X/t/+//8//3AAAAAAAAAAAAAD/6P/tAAD/9//uAAD/7AAAABsAAP/b/9QAAP/a//QAAAAAAAAAAP/KAAAAAAAA/98AAAAAAAAAAAAAAAAAAAAA/9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+H/4QAA//YAAP/XAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xf/vAAAAAAAA/+8AAAAAAAAAAAAAAAAAAAAA/+oAAAAA/7wAAAAA//v/5P/e/7sAAAAAAAAAAAAAAAAAAP/z/8X/xP+7/+cAAP/U/94AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/i/+AAAAAAAAAAAAAAAAAAAP/tAAAAAAAA//oAAP/tAAAAAP/tAAAAAAAA//r/+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+gAAAAD/9f/sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9f/2AAAAAAAAAAAAAP/4AAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+QAAAAAAAAAAAAAAAAAAAAAAAAAA//sAAP/jAAAAAAAAAAAAAAAAAAAAAAAA//b/9AAAAAD/3wAA/94AAP/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9QAAAAAAAAAAAAAAAAAAP/1AAD/9QAAAAD/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7//kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+uAAAAAAAA/8gAAAAAAAAAAAAAAAAAAAAA/8QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+n/3AAA//UAAP/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/j//QAAP/yAAAAAAAAAAAAAAAAAAD/9AAAAAAAAAAAAAAAAAAA//sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/ygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+gAAAAAAAAAAAAAAAAAAP/wAAAAAAAAAAAAAAAA//X/9wAAAAAAAP/N/+sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARQAAAAAAAAAAAAAAAAAAAAAAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTAAAAAAAAAAAAAAAA//H/8AAAAAAAAP/c/+oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9j/1gAAAAAAAP/S/+8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/0/7P/8P/t//r/vP/0/8L/xP/1AAD/8v/y//v/+wAAAAAAAAAAAAAAAAAAAAD/7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/f/+8AAP/sAAAAAAAAAAAAAAAA//X/8AAAAAD/8//zAAD/7AAAAAAAAP/0AAAAAP/1AAD/7f/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/sAAAAAAAA/+cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Y/+8AAP/p//gAAAAAAAAAAAAA/+3/5f/0AAAAAP/4/6IAAP/tAAD/vf/5/7//xP/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/6//4//r/9//pAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/c//YAAP/zAAAAAAAAAAAAAAAA//H/6gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/iAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/bAAAAAP/1AAAAAAAAAAAAAAAA//H/6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//P/pAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/eAAAAAAAAAAAAAAAAAAAAAAAA//X/7gAAAAD/zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9EAAAAAAAAAAAAA//UAAP/wAAAAAAAAAAAAAAAA/+7/8f/1AAD/9f/o/+z/5gAAAAAAAAAAAAD/9AAAAAAAAP/gAAAAAAAAAAAAAAAAAAAAAAAA//X/7wAAAAAAAP/1AAD/8gAAAAAAAP/1AAAAAP/2AAD/9P/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/n//IAAP/uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8//4/7b/6v/sAAD/u//5/8T/x//6AAD/7P/sAAAAAP/6AAAAAAAAAAAAAAAAAAD/7v/u/+//7v/Z/+f/6v/7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/a//AAAP/o//gAAAAAAAAAAAAA/+//5v/0AAD/zQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9IAAAAAAAAAAAAA//YAAP/wAAAAAAAAAAAAAAAA/+7/8f/1AAAAAP/o/+0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9QAAAAAAAAAAAAA//gAAP/wAAAAAAAAAAAAAAAA//H/9P/4AAAAAP/r/+8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+X/5QAAAAAAAP/c//IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
