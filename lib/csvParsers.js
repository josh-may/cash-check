/**
 * CSV Parser Library for Bank Transaction Imports
 * Supports: Discover, Chase, Capital One, and generic formats
 */

/**
 * Detect bank format from CSV headers
 * @param {string[]} headers - Array of header column names
 * @returns {string} - Bank format: 'discover', 'chase', 'capitalOne', or 'generic'
 */
export function detectBankFormat(headers) {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));

  // Discover: Has "Trans. Date" header
  if (headers.some(h => h.toLowerCase().includes('trans. date'))) {
    return 'discover';
  }

  // Chase: Has "Transaction Date" and "Type" columns
  if (headerSet.has('transaction date') && headerSet.has('type')) {
    return 'chase';
  }

  // Capital One: Has "Debit" and "Credit" columns
  if (headerSet.has('debit') && headerSet.has('credit')) {
    return 'capitalOne';
  }

  return 'generic';
}

/**
 * Parse a date string into a Date object
 * @param {string} dateStr - Date string in various formats
 * @returns {Date|null} - Parsed Date or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Try MM/DD/YYYY format
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try YYYY-MM-DD format
  const dashMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashMatch) {
    const [, year, month, day] = dashMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback to Date.parse
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalize amount based on bank format
 * @param {string} value - Raw amount value
 * @param {string} format - Bank format
 * @param {string} [type] - Transaction type (for Chase)
 * @param {string} [debit] - Debit value (for Capital One)
 * @param {string} [credit] - Credit value (for Capital One)
 * @returns {number} - Normalized amount (positive = expense, negative = income)
 */
export function normalizeAmount(value, format, type = null, debit = null, credit = null) {
  // Capital One uses separate Debit/Credit columns
  if (format === 'capitalOne') {
    const debitVal = parseFloat((debit || '').replace(/[^0-9.-]/g, '')) || 0;
    const creditVal = parseFloat((credit || '').replace(/[^0-9.-]/g, '')) || 0;

    // Debit = expense (positive), Credit = income (negative)
    if (debitVal > 0) return debitVal;
    if (creditVal > 0) return -creditVal;
    return 0;
  }

  // Clean the value
  const cleaned = (value || '').replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned) || 0;

  // Discover: Positive = expense, negative = income (already correct)
  if (format === 'discover') {
    return amount;
  }

  // Chase: Use Type column - "Debit" = expense, "Credit" = income
  if (format === 'chase') {
    const absAmount = Math.abs(amount);
    if (type && type.toLowerCase() === 'credit') {
      return -absAmount;  // Income
    }
    return absAmount;  // Expense
  }

  // Generic: Assume positive = expense, negative = income
  return amount;
}

/**
 * Parse CSV text into array of rows
 * @param {string} text - Raw CSV text
 * @returns {string[][]} - Array of rows, each row is array of values
 */
function parseCSVText(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentValue);
        currentValue = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentValue);
        if (currentRow.some(v => v.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentValue = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentValue += char;
      }
    }
  }

  // Handle last row
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some(v => v.trim())) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Get column mappings for each bank format
 * @param {string} format - Bank format
 * @param {string[]} headers - CSV headers
 * @returns {Object} - Column index mappings
 */
function getColumnMappings(format, headers) {
  const headerLower = headers.map(h => h.toLowerCase().trim());

  const findColumn = (patterns) => {
    for (const pattern of patterns) {
      const idx = headerLower.findIndex(h => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  switch (format) {
    case 'discover':
      return {
        date: findColumn(['trans. date']),
        description: findColumn(['description']),
        amount: findColumn(['amount']),
      };

    case 'chase':
      return {
        date: findColumn(['transaction date', 'posting date']),
        description: findColumn(['description']),
        amount: findColumn(['amount']),
        type: findColumn(['type']),
      };

    case 'capitalOne':
      return {
        date: findColumn(['transaction date', 'posted date']),
        description: findColumn(['description', 'payee']),
        debit: findColumn(['debit']),
        credit: findColumn(['credit']),
      };

    default:
      // Generic: Try common column names
      return {
        date: findColumn(['date', 'transaction date', 'trans date', 'posted']),
        description: findColumn(['description', 'name', 'memo', 'payee', 'merchant']),
        amount: findColumn(['amount', 'value', 'sum']),
      };
  }
}

/**
 * Parse CSV text into normalized transaction objects
 * @param {string} text - Raw CSV text
 * @param {string} [format] - Optional bank format (auto-detected if not provided)
 * @returns {{ transactions: Object[], errors: string[], format: string }}
 */
export function parseCSV(text, format = null) {
  const errors = [];
  const transactions = [];

  if (!text || !text.trim()) {
    errors.push('CSV file is empty');
    return { transactions, errors, format: 'unknown' };
  }

  const rows = parseCSVText(text);

  if (rows.length < 2) {
    errors.push('CSV must have a header row and at least one data row');
    return { transactions, errors, format: 'unknown' };
  }

  const headers = rows[0];
  const detectedFormat = format || detectBankFormat(headers);
  const mappings = getColumnMappings(detectedFormat, headers);

  // Validate that we found required columns
  if (detectedFormat === 'capitalOne') {
    if (mappings.date === -1 || mappings.description === -1 ||
        (mappings.debit === -1 && mappings.credit === -1)) {
      errors.push('Could not find required columns (date, description, debit/credit)');
      return { transactions, errors, format: detectedFormat };
    }
  } else {
    if (mappings.date === -1 || mappings.description === -1 || mappings.amount === -1) {
      errors.push('Could not find required columns (date, description, amount)');
      return { transactions, errors, format: detectedFormat };
    }
  }

  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    try {
      const dateVal = row[mappings.date]?.trim();
      const date = parseDate(dateVal);

      if (!date) {
        errors.push(`Row ${rowNum}: Invalid date "${dateVal}"`);
        continue;
      }

      const description = row[mappings.description]?.trim();
      if (!description) {
        errors.push(`Row ${rowNum}: Missing description`);
        continue;
      }

      let amount;
      if (detectedFormat === 'capitalOne') {
        const debit = row[mappings.debit]?.trim();
        const credit = row[mappings.credit]?.trim();
        amount = normalizeAmount(null, detectedFormat, null, debit, credit);
      } else {
        const amountVal = row[mappings.amount]?.trim();
        const typeVal = mappings.type !== undefined ? row[mappings.type]?.trim() : null;
        amount = normalizeAmount(amountVal, detectedFormat, typeVal);
      }

      if (amount === 0) {
        errors.push(`Row ${rowNum}: Amount is zero or invalid`);
        continue;
      }

      transactions.push({
        date: date.toISOString(),
        name: description,
        amount,
        rowNumber: rowNum,
      });
    } catch (err) {
      errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  return { transactions, errors, format: detectedFormat };
}
