import { useState, ChangeEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (errors[name as keyof T]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = (validationRules: Record<keyof T, (value: any) => string | null>) => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(key => {
      const fieldKey = key as keyof T;
      const error = validationRules[fieldKey](values[fieldKey]);
      
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
    resetForm,
    setErrors,
    setValues
  };
}
