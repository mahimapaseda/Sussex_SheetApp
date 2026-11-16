/**
 * Phone Number Normalizer & Sanitizer
 * Handles international phone formats and auto-infers default country codes (e.g. 94 for Sri Lanka)
 */

function sanitizePhoneNumber(rawPhone, defaultCountryCode = '94') {
  if (!rawPhone) return { isValid: false, normalized: null, raw: rawPhone };

  // Strip all non-numeric characters except leading '+'
  let str = String(rawPhone).trim();
  const hasPlus = str.startsWith('+');
  let digitsOnly = str.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 7) {
    return { isValid: false, normalized: null, raw: rawPhone, error: 'Too short' };
  }

  // Sri Lanka handling (defaultCountryCode == '94')
  if (defaultCountryCode === '94') {
    // 07XXXXXXXX (10 digits starting with 0)
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
      digitsOnly = '94' + digitsOnly.slice(1);
    }
    // 7XXXXXXXX (9 digits starting with 7)
    else if (digitsOnly.length === 9 && digitsOnly.startsWith('7')) {
      digitsOnly = '94' + digitsOnly;
    }
    // 00947...
    else if (digitsOnly.startsWith('0094')) {
      digitsOnly = digitsOnly.slice(2);
    }
    // Already 947... (11 digits)
    else if (digitsOnly.length === 11 && digitsOnly.startsWith('947')) {
      // Valid as is
    }
    // If not matching Sri Lankan patterns but has international plus prefix, keep digits
    else if (!hasPlus && !digitsOnly.startsWith('94') && digitsOnly.length <= 10) {
      digitsOnly = defaultCountryCode + digitsOnly;
    }
  } else {
    // Generic fallback: if leading 0, strip and prepend defaultCountryCode if no + prefix
    if (!hasPlus && digitsOnly.startsWith('0')) {
      digitsOnly = defaultCountryCode + digitsOnly.replace(/^0+/, '');
    } else if (!hasPlus && !digitsOnly.startsWith(defaultCountryCode)) {
      digitsOnly = defaultCountryCode + digitsOnly;
    }
  }

  // Ensure digits length is between 9 and 15 digits (ITU-T E.164 recommendation)
  const isValid = digitsOnly.length >= 9 && digitsOnly.length <= 15;

  return {
    isValid,
    normalized: isValid ? digitsOnly : null,
    formatted: isValid ? `+${digitsOnly}` : null,
    raw: rawPhone
  };
}

module.exports = {
  sanitizePhoneNumber
};
