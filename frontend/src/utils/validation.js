export function validateName(name) {
  if (!name || name.trim().length < 20) return 'Name must be at least 20 characters';
  if (name.trim().length > 60) return 'Name must not exceed 60 characters';
  return '';
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!regex.test(email)) return 'Must be a valid email address';
  return '';
}

export function validateAddress(address) {
  if (!address || !address.trim()) return 'Address is required';
  if (address.length > 400) return 'Address must not exceed 400 characters';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return '';
}

export function validateForm(fields) {
  const errors = {};
  if (fields.name !== undefined) {
    const err = validateName(fields.name);
    if (err) errors.name = err;
  }
  if (fields.email !== undefined) {
    const err = validateEmail(fields.email);
    if (err) errors.email = err;
  }
  if (fields.address !== undefined) {
    const err = validateAddress(fields.address);
    if (err) errors.address = err;
  }
  if (fields.password !== undefined) {
    const err = validatePassword(fields.password);
    if (err) errors.password = err;
  }
  return errors;
}
