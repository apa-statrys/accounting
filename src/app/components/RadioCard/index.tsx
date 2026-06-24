import React from 'react';
import styles from './index.module.css';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  name: string;
  alignment?: 'horizontal' | 'vertical';
  size?: 'sm' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  /** Stack cards vertically and stretch each to the container width (selection lists). */
  fluid?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  alignment = 'vertical',
  size = 'lg',
  showIcon = true,
  showText = true,
  fluid = false,
  className = '',
}) => {
  return (
    <div
      role="radiogroup"
      className={[
        styles.container,
        styles[alignment],
        fluid ? styles.fluid : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => {
        const isChecked = value === option.value;
        const isDisabled = option.disabled ?? false;

        return (
          <label
            key={option.value}
            className={[
              styles.option,
              size === 'lg' ? styles.sizeLg : styles.sizeSm,
              isChecked ? styles.selected : '',
              isDisabled ? styles.disabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              disabled={isDisabled}
              aria-disabled={isDisabled || undefined}
              onChange={(e) => onChange(e.target.value)}
              className={styles.hiddenInput}
            />

            {alignment === 'horizontal' ? (
              /* Horizontal left align — icon + text side by side */
              <div className={styles.optionInner}>
                {showIcon && option.icon && (
                  <div className={styles.icon}>{option.icon}</div>
                )}
                <div className={styles.textContent}>
                  <p className={`${styles.title} h4`}>{option.label}</p>
                  {showText && option.description && (
                    <p className={`${styles.description} body-md`}>{option.description}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Vertical center align — stacked */
              <>
                <p className={`${styles.title} h4`}>{option.label}</p>
                {showIcon && option.icon && (
                  <div className={styles.icon}>{option.icon}</div>
                )}
                {showText && option.description && (
                  <p className={`${styles.description} body-md`}>{option.description}</p>
                )}
              </>
            )}
          </label>
        );
      })}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';
