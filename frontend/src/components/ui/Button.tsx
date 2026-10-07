import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-error'
  };

  return (
    <button className={['btn', sizes[size], variants[variant], className].join(' ')} {...props}>
      {children}
    </button>
  );
};

export default Button;
