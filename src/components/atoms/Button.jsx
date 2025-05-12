import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  fullWidth = false,
  className = '',
  icon = null,
  iconPosition = 'left',
  type = 'button',
  loading = false,
  ...rest
}) => {
  // Define style variants
  const variantStyles = {
    primary: 'bg-royalGold text-deepLapis hover:bg-royalGold/80',
    secondary: 'bg-deepLapisDark border border-royalGold/40 text-royalGold hover:bg-deepLapis/70',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'bg-transparent border border-royalGold text-royalGold hover:bg-royalGold/10',
    ghost: 'bg-transparent text-textLight hover:bg-deepLapis/50 hover:text-textGold',
  };
  
  // Define size variants
  const sizeStyles = {
    small: 'px-3 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };
  
  // Combine all styles
  const buttonStyles = [
    'rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-royalGold/50 font-medium',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    className,
  ].join(' ');
  
  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
          {children}
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  type: PropTypes.string,
  loading: PropTypes.bool,
};

export default Button;