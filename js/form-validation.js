/**
 * Form Validation Utilities
 * Provides duplicate submission prevention and enhanced error messages
 */

class FormValidator {
  constructor(formElement, options = {}) {
    this.form = formElement;
    this.isSubmitting = false;
    this.submitTimeout = options.submitTimeout || 5000; // 5 seconds default timeout
    this.onSubmit = options.onSubmit || null;
    this.validateOnSubmit = options.validateOnSubmit !== false; // Default to true
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    // Prevent multiple submissions
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(e);
    });
    
    // Add real-time validation
    if (this.validateOnSubmit) {
      const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    }
  }
  
  handleSubmit(e) {
    if (this.isSubmitting) {
      this.showFormError('Please wait, form is being submitted...');
      return false;
    }
    
    // Validate all fields
    if (this.validateOnSubmit && !this.validateForm()) {
      return false;
    }
    
    // Set submitting state
    this.isSubmitting = true;
    this.setSubmitButtonState(true);
    
    // Create timeout to reset submitting state (safety measure)
    const timeoutId = setTimeout(() => {
      if (this.isSubmitting) {
        this.isSubmitting = false;
        this.setSubmitButtonState(false);
        this.showFormError('Request timed out. Please try again.');
      }
    }, this.submitTimeout);
    
    // Call the submit handler
    if (this.onSubmit) {
      const result = this.onSubmit(e, () => {
        // Success callback
        clearTimeout(timeoutId);
        this.isSubmitting = false;
        this.setSubmitButtonState(false);
        this.clearFormErrors();
      }, (error) => {
        // Error callback
        clearTimeout(timeoutId);
        this.isSubmitting = false;
        this.setSubmitButtonState(false);
        this.showFormError(error.message || 'An error occurred. Please try again.');
      });
      
      // If onSubmit returns a promise, handle it
      if (result && typeof result.then === 'function') {
        result
          .then(() => {
            clearTimeout(timeoutId);
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            this.clearFormErrors();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            this.showFormError(error.message || 'An error occurred. Please try again.');
          });
      }
    }
    
    return false;
  }
  
  validateForm() {
    const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    const type = field.type || field.tagName.toLowerCase();
    
    // Clear previous errors
    this.clearFieldError(field);
    
    // Required field validation
    if (isRequired && !value) {
      this.showFieldError(field, this.getRequiredErrorMessage(field));
      return false;
    }
    
    // Type-specific validation
    if (value) {
      if (type === 'email' && !this.isValidEmail(value)) {
        this.showFieldError(field, 'Please enter a valid email address');
        return false;
      }
      
      if (type === 'url' && !this.isValidUrl(value)) {
        this.showFieldError(field, 'Please enter a valid URL');
        return false;
      }
      
      if (field.hasAttribute('minlength')) {
        const minLength = parseInt(field.getAttribute('minlength'));
        if (value.length < minLength) {
          this.showFieldError(field, `Must be at least ${minLength} characters`);
          return false;
        }
      }
      
      if (field.hasAttribute('maxlength')) {
        const maxLength = parseInt(field.getAttribute('maxlength'));
        if (value.length > maxLength) {
          this.showFieldError(field, `Must not exceed ${maxLength} characters`);
          return false;
        }
      }
      
      if (field.hasAttribute('pattern')) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(value)) {
          const title = field.getAttribute('title') || 'Invalid format';
          this.showFieldError(field, title);
          return false;
        }
      }
    }
    
    return true;
  }
  
  showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.invalid-feedback');
    if (existingError) {
      existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
  }
  
  clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentElement.querySelector('.invalid-feedback');
    if (errorDiv) {
      errorDiv.remove();
    }
  }
  
  showFormError(message) {
    // Try to find existing alert container
    let alertContainer = document.getElementById('formAlertContainer');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'formAlertContainer';
      alertContainer.className = 'alert alert-danger';
      alertContainer.style.display = 'none';
      this.form.insertBefore(alertContainer, this.form.firstChild);
    }
    
    alertContainer.textContent = message;
    alertContainer.style.display = 'block';
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      alertContainer.style.display = 'none';
    }, 5000);
  }
  
  clearFormErrors() {
    const inputs = this.form.querySelectorAll('.is-invalid');
    inputs.forEach(input => this.clearFieldError(input));
    
    const alertContainer = document.getElementById('formAlertContainer');
    if (alertContainer) {
      alertContainer.style.display = 'none';
    }
  }
  
  setSubmitButtonState(disabled) {
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = disabled;
      if (disabled) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
      } else {
        submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
      }
    }
  }
  
  getRequiredErrorMessage(field) {
    const label = field.parentElement.querySelector('label');
    const fieldName = label ? label.textContent.replace('*', '').trim() : 'This field';
    return `${fieldName} is required`;
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  reset() {
    this.isSubmitting = false;
    this.setSubmitButtonState(false);
    this.clearFormErrors();
    this.form.reset();
  }
}

// Export for use in other files
window.FormValidator = FormValidator;

