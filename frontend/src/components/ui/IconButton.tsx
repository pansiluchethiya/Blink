import React from 'react';

const IconButton = ({ children, variant = 'ghost', size = 'md', className = '', ...props }) => {
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const variants = {
    ghost: 'btn-ghost',
    active: 'btn-primary',
    subtle: 'bg-base-200 hover:bg-base-300 text-base-content',
  };
  return (
    <button className={['btn btn-circle', sizes[size], variants[variant], className].join(' ')} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const iconSizes = { sm: 16, md: 20, lg: 24 };
          return React.cloneElement(child, { size: child.props.size || iconSizes[size] });
        }
        return child;
      })}
    </button>
  );
};

export default IconButton;
