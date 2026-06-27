import { useEffect, useRef } from 'react';

export function useFormPersist(formKey) {
  const formRef = useRef(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !formKey) return;

    // Load saved data
    try {
      const saved = window.sessionStorage.getItem(formKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [name, value] of Object.entries(parsed)) {
          const el = form.elements.namedItem(name);
          if (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
              el.checked = !!value;
            } else {
              el.value = value;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore form data', e);
    }

    // Save data on change
    const handleChange = () => {
      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        window.sessionStorage.setItem(formKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save form data', e);
      }
    };

    form.addEventListener('input', handleChange);
    form.addEventListener('change', handleChange);

    return () => {
      form.removeEventListener('input', handleChange);
      form.removeEventListener('change', handleChange);
    };
  }, [formKey]);

  const clearForm = () => {
    if (formKey) {
      window.sessionStorage.removeItem(formKey);
    }
  };

  return { formRef, clearForm };
}
