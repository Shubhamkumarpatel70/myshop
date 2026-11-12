// Remove MongoDB operator and dotted keys from untrusted request bodies.
// This is intentionally body-only so route/query semantics remain backward compatible.
const sanitizeObject = (value) => {
    if (Array.isArray(value)) return value.map(sanitizeObject);
    if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
    return Object.keys(value).reduce((clean, key) => {
        if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'prototype' || key === 'constructor') return clean;
        clean[key] = sanitizeObject(value[key]);
        return clean;
    }, {});
};

module.exports = (req, res, next) => {
    if (req.body && typeof req.body === 'object') req.body = sanitizeObject(req.body);
    next();
};
