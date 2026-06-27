import { useState } from 'react'

export default function PasswordField({
  label,
  labelRight,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete = 'current-password',
}) {
  const [visible, setVisible] = useState(false)
  const inputProps = {
    name,
    type: visible ? 'text' : 'password',
    placeholder,
    required,
    autoComplete,
  }

  if (value !== undefined) {
    inputProps.value = value
  }

  if (onChange) {
    inputProps.onChange = onChange
  }

  return (
    <label className="password-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {labelRight && labelRight}
      </div>
      <div className="password-field-row">
        <input {...inputProps} />
        <button className="password-toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  )
}