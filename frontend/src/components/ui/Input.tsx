import React from 'react';

const Input = React.forwardRef(({ className = '', error = false, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={['input input-bordered w-full', error ? 'input-error' : '', className].join(' ')}
      aria-invalid={error}
      {...props}
    />
  );
});

export default Input;
