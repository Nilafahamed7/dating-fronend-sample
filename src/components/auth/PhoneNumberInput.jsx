import { useState, useEffect, useRef } from 'react';
import { validatePhoneNumber, normalizePhoneNumber } from '../../services/firebaseSMSService';

// Common country codes
const COUNTRIES = [
  { code: '+1', name: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
];

export default function PhoneNumberInput({ value, onChange, onValidationChange, error, disabled }) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      // Extract country code and phone number from value
      const match = value.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2]);
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Update parent when phone number changes
  useEffect(() => {
    const fullNumber = countryCode + phoneNumber;
    if (fullNumber !== value) {
      onChange({ target: { name: 'phone', value: fullNumber } });
    }

    // Validate phone number
    if (phoneNumber) {
      const validation = validatePhoneNumber(fullNumber);
      if (!validation.valid) {
        setValidationError(validation.error);
        if (onValidationChange) onValidationChange(false);
      } else {
        setValidationError('');
        if (onValidationChange) onValidationChange(true);
      }
    } else {
      setValidationError('');
      if (onValidationChange) onValidationChange(false);
    }
  }, [countryCode, phoneNumber, value, onChange, onValidationChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (code) => {
    setCountryCode(code);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/[^\d]/g, ''); // Only digits
    setPhoneNumber(input);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const match = pasted.match(/^(\+\d{1,4})?(\d+)$/);
    if (match) {
      if (match[1]) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2]);
      } else {
        setPhoneNumber(match[2]);
      }
    }
  };

  const displayError = error || validationError;

  return (
    <div className="w-full">
      <label htmlFor="phone" className="block text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-700 mb-0.5">
        Phone Number <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="px-2 sm:px-3 py-2.5 sm:py-3 md:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-velora-primary focus:border-velora-primary transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-w-[80px] sm:min-w-[100px]"
            aria-label="Select country code"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="text-base">{COUNTRIES.find(c => c.code === countryCode)?.flag || '🌐'}</span>
            <span className="text-xs sm:text-sm font-medium">{countryCode}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="p-2">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm"
                    role="option"
                    aria-selected={country.code === countryCode}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium">{country.code}</span>
                    <span className="text-gray-500 ml-auto">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <input
            ref={inputRef}
            id="phone"
            name="phone"
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onPaste={handlePaste}
            disabled={disabled}
            required
            inputMode="numeric"
            autoComplete="tel"
            aria-label="Phone number"
            aria-invalid={!!displayError}
            aria-describedby={displayError ? 'phone-error' : undefined}
            className={`input-field bg-gray-50 text-gray-900 placeholder-gray-400 py-2.5 sm:py-3 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-velora-primary/20 transition-all w-full ${
              displayError
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-200 focus:border-velora-primary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="1234567890"
          />
        </div>
      </div>

      {displayError && (
        <p id="phone-error" className="text-[8px] sm:text-[9px] md:text-[10px] text-red-500 mt-0.5 leading-tight" role="alert">
          {displayError}
        </p>
      )}
      {!displayError && phoneNumber && (
        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 mt-0.5 leading-tight">
          Format: {countryCode} {phoneNumber || '1234567890'}
        </p>
      )}
    </div>
  );
}

