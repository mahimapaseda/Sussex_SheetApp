/**
 * Phone Number Normalizer & Sanitizer
 * Handles international phone formats, multi-number cell values, and auto-infers country codes
 */

function sanitizeSinglePhone(rawStr, defaultCountryCode = '94') {
  if (!rawStr) return { isValid: false, normalized: null, raw: rawStr };

  let str = String(rawStr).trim();
  // Strip trailing float zeroes like .0 from Excel/Sheets numbers
  if (/^\d+\.0+$/.test(str)) {
    str = str.split('.')[0];
  }

  const hasPlus = str.startsWith('+');
  let digitsOnly = str.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 7) {
    return { isValid: false, normalized: null, raw: rawStr, error: 'Too short' };
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
    raw: rawStr
  };
}

function sanitizePhoneNumber(rawPhone, defaultCountryCode = '94') {
  if (rawPhone === null || rawPhone === undefined || String(rawPhone).trim() === '') {
    return { isValid: false, normalized: null, raw: '' };
  }

  let str = String(rawPhone).trim();

  // If cell contains multiple numbers separated by slash, comma, semicolon, newline, or 'or' / '&'
  // Example: "0762364124 / 0706486351", "768123643, 759363643"
  const candidates = str.split(/[/,;&\n]|\s+or\s+|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
  if (candidates.length > 1) {
    for (const candidate of candidates) {
      const res = sanitizeSinglePhone(candidate, defaultCountryCode);
      if (res.isValid) {
        return {
          ...res,
          raw: str // Keep original string for display
        };
      }
    }
  }

  return sanitizeSinglePhone(str, defaultCountryCode);
}

module.exports = {
  sanitizePhoneNumber,
  sanitizeSinglePhone
};
