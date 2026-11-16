/**
 * Template Parser & Interpolation Engine
 * Replaces tokens like {Name}, {{Name}}, {First Name} with row values.
 */

function extractTokens(template) {
  if (!template) return [];
  const matches = template.match(/\{+([^{}]+)\}+/g) || [];
  return Array.from(new Set(matches.map(m => m.replace(/[\{\}]/g, '').trim())));
}

function interpolateTemplate(template, rowData = {}) {
  if (!template) return '';

  return template.replace(/\{+([^{}]+)\}+/g, (match, rawKey) => {
    const key = rawKey.trim();
    
    // Direct match
    if (rowData[key] !== undefined && rowData[key] !== null) {
      return String(rowData[key]).trim();
    }

    // Case-insensitive & normalized key match
    const normalizedKey = key.toLowerCase().replace(/[\s_\-]/g, '');
    for (const [rowProp, val] of Object.entries(rowData)) {
      if (rowProp.toLowerCase().replace(/[\s_\-]/g, '') === normalizedKey) {
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }

    // First name token special handler
    if (normalizedKey === 'firstname') {
      const nameVal = rowData['Name'] || rowData['Full Name'] || rowData['Student Name'] || '';
      return String(nameVal).trim().split(' ')[0] || '';
    }

    return ''; // Empty if not found
  });
}

module.exports = {
  extractTokens,
  interpolateTemplate
};
